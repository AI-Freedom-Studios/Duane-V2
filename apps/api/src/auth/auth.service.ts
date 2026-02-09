import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
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

  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new UnauthorizedException();
    return { id: user.id, email: user.email, name: user.name, role: user.role, createdAt: user.createdAt.toISOString() };
  }
}
