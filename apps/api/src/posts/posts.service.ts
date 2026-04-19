import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { ConfigService } from '@nestjs/config';
import { Queue } from 'bullmq';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { AuditAction, PostStatus } from '@agentos/shared';
import { decrypt, encrypt } from '../common/crypto';

type OAuthTokens = {
  access_token?: string;
  refresh_token?: string;
  [key: string]: unknown;
};

@Injectable()
export class PostsService {
  constructor(
    private prisma: PrismaService,
    private audit: AuditService,
    private config: ConfigService,
    @InjectQueue('posts') private postsQueue: Queue,
  ) {}

  async create(userId: string, data: { content: string; mediaUrls?: string[]; targetAccountIds: string[]; scheduledAt?: string }, ip?: string) {
    const post = await this.prisma.post.create({
      data: {
        userId,
        content: data.content,
        mediaUrls: data.mediaUrls || [],
        status: data.scheduledAt ? PostStatus.SCHEDULED : PostStatus.DRAFT,
        scheduledAt: data.scheduledAt ? new Date(data.scheduledAt) : null,
        targets: {
          create: data.targetAccountIds.map((accountId) => ({
            socialAccountId: accountId,
            status: PostStatus.DRAFT,
          })),
        },
      },
      include: { targets: true },
    });

    if (data.scheduledAt) {
      const delay = new Date(data.scheduledAt).getTime() - Date.now();
      await this.postsQueue.add('publish', { postId: post.id }, {
        delay: Math.max(delay, 0),
        jobId: `post-${post.id}`,
      });
      await this.audit.log(userId, AuditAction.POST_SCHEDULE, { postId: post.id, scheduledAt: data.scheduledAt }, ip);
    } else {
      await this.audit.log(userId, AuditAction.POST_CREATE, { postId: post.id }, ip);
    }

    return this.formatPost(post);
  }

  async publishNow(userId: string, postId: string, ip?: string) {
    const post = await this.prisma.post.findFirst({ where: { id: postId, userId } });
    if (!post) throw new NotFoundException('Post not found');

    await this.prisma.post.update({
      where: { id: postId },
      data: { status: PostStatus.PUBLISHING },
    });

    await this.postsQueue.add('publish', { postId }, { jobId: `post-${postId}-${Date.now()}` });
    await this.audit.log(userId, AuditAction.POST_PUBLISH, { postId }, ip);

    return { message: 'Publishing initiated' };
  }

  async list(userId: string, page = 1, limit = 20) {
    const [posts, total] = await Promise.all([
      this.prisma.post.findMany({
        where: { userId },
        include: { targets: { include: { socialAccount: true } } },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.post.count({ where: { userId } }),
    ]);

    return { data: posts.map(this.formatPost), total, page, limit };
  }

  async getById(userId: string, postId: string) {
    const post = await this.prisma.post.findFirst({
      where: { id: postId, userId },
      include: { targets: { include: { socialAccount: true } } },
    });
    if (!post) throw new NotFoundException('Post not found');
    return this.formatPost(post);
  }

  async update(userId: string, postId: string, data: { content?: string; mediaUrls?: string[]; targetAccountIds?: string[]; scheduledAt?: string | null }) {
    const post = await this.prisma.post.findFirst({ where: { id: postId, userId } });
    if (!post) throw new NotFoundException('Post not found');

    const updateData: any = {};
    if (data.content !== undefined) updateData.content = data.content;
    if (data.mediaUrls !== undefined) updateData.mediaUrls = data.mediaUrls;
    if (data.scheduledAt !== undefined) {
      updateData.scheduledAt = data.scheduledAt ? new Date(data.scheduledAt) : null;
      updateData.status = data.scheduledAt ? PostStatus.SCHEDULED : PostStatus.DRAFT;
    }

    const updated = await this.prisma.post.update({
      where: { id: postId },
      data: updateData,
      include: { targets: { include: { socialAccount: true } } },
    });

    return this.formatPost(updated);
  }

  async delete(userId: string, postId: string) {
    const post = await this.prisma.post.findFirst({
      where: { id: postId, userId },
      include: { targets: { include: { socialAccount: true } } },
    });
    if (!post) throw new NotFoundException('Post not found');

    await this.deletePublishedPlatformPosts(post);
    await this.prisma.post.delete({ where: { id: postId } });
    return { message: 'Post deleted from AgentOS and connected platforms' };
  }

  private async deletePublishedPlatformPosts(post: any) {
    for (const target of post.targets || []) {
      if (target.status !== PostStatus.PUBLISHED || !target.platformPostId) continue;

      const platform = target.socialAccount?.platform?.toLowerCase();
      if (platform === 'youtube') {
        await this.deleteYouTubeVideo(target);
      }
    }
  }

  private async deleteYouTubeVideo(target: any) {
    const tokens = JSON.parse(decrypt(target.socialAccount.encryptedTokens)) as OAuthTokens;
    if (!tokens.access_token) {
      throw new BadRequestException('YouTube access token is missing. Reconnect the YouTube account before deleting the remote video.');
    }

    try {
      await this.callYouTubeDelete(tokens.access_token, target.platformPostId);
    } catch (error: any) {
      const message = String(error?.message || error);
      if (!message.startsWith('YOUTUBE_AUTH_FAILED') || !tokens.refresh_token) {
        throw new BadRequestException(`Could not delete YouTube video: ${message}`);
      }

      const refreshed = await this.refreshGoogleTokens(tokens.refresh_token);
      const mergedTokens = {
        ...tokens,
        ...refreshed,
        refresh_token: refreshed.refresh_token || tokens.refresh_token,
      };

      await this.prisma.socialAccount.update({
        where: { id: target.socialAccount.id },
        data: {
          encryptedTokens: encrypt(JSON.stringify(mergedTokens)),
          lastSyncAt: new Date(),
        },
      });

      if (!mergedTokens.access_token || typeof mergedTokens.access_token !== 'string') {
        throw new BadRequestException('YouTube token refresh did not return an access token.');
      }

      await this.callYouTubeDelete(mergedTokens.access_token, target.platformPostId);
    }
  }

  private async callYouTubeDelete(accessToken: string, videoId: string) {
    const response = await fetch(`https://www.googleapis.com/youtube/v3/videos?id=${encodeURIComponent(videoId)}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (response.status === 401) {
      throw new Error(`YOUTUBE_AUTH_FAILED: ${await response.text()}`);
    }

    if (response.status === 404) {
      return;
    }

    if (!response.ok) {
      throw new Error(`YouTube delete failed (${response.status}): ${await response.text()}`);
    }
  }

  private async refreshGoogleTokens(refreshToken: string) {
    const clientId = this.config.get<string>('YOUTUBE_CLIENT_ID');
    const clientSecret = this.config.get<string>('YOUTUBE_CLIENT_SECRET');

    if (!clientId || !clientSecret) {
      throw new BadRequestException('YouTube OAuth credentials are missing on the API server.');
    }

    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        refresh_token: refreshToken,
        grant_type: 'refresh_token',
      }),
    });

    if (!response.ok) {
      throw new BadRequestException(`YouTube token refresh failed (${response.status}): ${await response.text()}`);
    }

    return response.json() as Promise<OAuthTokens>;
  }

  private formatPost(post: any) {
    return {
      id: post.id,
      content: post.content,
      mediaUrls: post.mediaUrls,
      status: post.status,
      scheduledAt: post.scheduledAt?.toISOString() || null,
      publishedAt: post.publishedAt?.toISOString() || null,
      targets: post.targets?.map((t: any) => ({
        id: t.id,
        accountId: t.socialAccountId,
        accountName: t.socialAccount?.accountName,
        platform: t.socialAccount?.platform,
        status: t.status,
        errorMessage: t.errorMessage,
      })) || [],
      createdAt: post.createdAt.toISOString(),
      updatedAt: post.updatedAt.toISOString(),
    };
  }
}
