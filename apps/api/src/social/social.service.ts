import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SocialService {
  constructor(private prisma: PrismaService) {}

  async getAccounts(userId: string) {
    const accounts = await this.prisma.socialAccount.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
    return accounts.map((a) => ({
      id: a.id,
      platform: a.platform,
      platformAccountId: a.platformAccountId,
      accountName: a.accountName,
      accountAvatar: a.accountAvatar,
      isActive: a.isActive,
      lastSyncAt: a.lastSyncAt?.toISOString() || null,
      createdAt: a.createdAt.toISOString(),
    }));
  }
}
