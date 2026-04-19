import { Injectable, UnauthorizedException, ConflictException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { createHash } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { AuditAction } from '@agentos/shared';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
    private audit: AuditService,
  ) {}

  async register(email: string, password: string, name: string, ip?: string) {
    const existing = await this.prisma.user.findUnique({ where: { email } });
    if (existing) {
      throw new ConflictException('Email already registered');
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const user = await this.prisma.user.create({
      data: { email, passwordHash, name },
    });

    await this.audit.log(user.id, AuditAction.USER_REGISTER, { email }, ip);

    const token = this.jwt.sign({ sub: user.id, email: user.email, role: user.role });
    return {
      accessToken: token,
      user: { id: user.id, email: user.email, name: user.name, role: user.role, createdAt: user.createdAt.toISOString() },
    };
  }

  async login(email: string, password: string, ip?: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    await this.audit.log(user.id, AuditAction.USER_LOGIN, { email }, ip);

    const token = this.jwt.sign({ sub: user.id, email: user.email, role: user.role });
    return {
      accessToken: token,
      user: { id: user.id, email: user.email, name: user.name, role: user.role, createdAt: user.createdAt.toISOString() },
    };
  }

  async requestPasswordReset(email: string, ip?: string) {
    const normalizedEmail = email.trim().toLowerCase();
    const user = await this.prisma.user.findUnique({ where: { email: normalizedEmail } });
    const message = 'If an account exists for this email, a password reset link is ready.';

    if (!user) {
      return { message };
    }

    const passwordVersion = createHash('sha256').update(user.passwordHash).digest('hex');
    const token = this.jwt.sign(
      { sub: user.id, email: user.email, purpose: 'password-reset', passwordVersion },
      { expiresIn: '15m' },
    );
    const appUrl = process.env.CORS_ORIGIN || 'http://localhost:3000';
    const resetLink = `${appUrl}/reset-password?token=${encodeURIComponent(token)}`;

    await this.audit.log(user.id, 'PASSWORD_RESET_REQUEST', { email: user.email }, ip);

    // In production, this link should be emailed. Returning it keeps local demos functional without SMTP.
    return { message, resetLink };
  }

  async resetPassword(token: string, password: string, ip?: string) {
    let payload: any;
    try {
      payload = this.jwt.verify(token);
    } catch {
      throw new BadRequestException('Reset link is invalid or expired');
    }

    if (payload?.purpose !== 'password-reset' || !payload?.sub || !payload?.passwordVersion) {
      throw new BadRequestException('Reset link is invalid or expired');
    }

    const user = await this.prisma.user.findUnique({ where: { id: payload.sub } });
    if (!user) {
      throw new BadRequestException('Reset link is invalid or expired');
    }

    const currentPasswordVersion = createHash('sha256').update(user.passwordHash).digest('hex');
    if (currentPasswordVersion !== payload.passwordVersion) {
      throw new BadRequestException('This reset link has already been used');
    }

    const passwordHash = await bcrypt.hash(password, 12);
    await this.prisma.user.update({
      where: { id: user.id },
      data: { passwordHash },
    });

    await this.audit.log(user.id, 'PASSWORD_RESET_COMPLETE', { email: user.email }, ip);

    return { message: 'Password updated successfully. You can now sign in.' };
  }

  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new UnauthorizedException();
    return { id: user.id, email: user.email, name: user.name, role: user.role, createdAt: user.createdAt.toISOString() };
  }
}
