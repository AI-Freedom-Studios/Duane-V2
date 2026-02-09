import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { AuditAction, PostStatus } from '@agentos/shared';

@Injectable()
export class PostsService {
  constructor(
    private prisma: PrismaService,
    private audit: AuditService,
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

    await this.postsQueue.add('publish', { postId }, { jobId: `post-${postId}` });
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
    const post = await this.prisma.post.findFirst({ where: { id: postId, userId } });
    if (!post) throw new NotFoundException('Post not found');
    await this.prisma.post.delete({ where: { id: postId } });
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
