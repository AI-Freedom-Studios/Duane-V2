import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AuditService {
  constructor(private prisma: PrismaService) {}

  async log(userId: string, action: string, details: Record<string, unknown> = {}, ipAddress?: string | null) {
    return this.prisma.auditLog.create({
      data: {
        userId,
        action,
        details: details as any,
        ipAddress: ipAddress || null,
      },
    });
  }

  async getByUser(userId: string, page = 1, limit = 50) {
    const [data, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.auditLog.count({ where: { userId } }),
    ]);
    return { data, total, page, limit };
  }
}
