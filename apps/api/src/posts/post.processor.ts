import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { PrismaService } from '../prisma/prisma.service';
import { PostStatus } from '@agentos/shared';
import { decrypt } from '../common/crypto';

@Processor('posts')
export class PostProcessor extends WorkerHost {
  private readonly logger = new Logger(PostProcessor.name);

  constructor(private prisma: PrismaService) {
    super();
  }

  async process(job: Job<{ postId: string }>) {
    const { postId } = job.data;
    this.logger.log(`Processing post ${postId}`);

    const post = await this.prisma.post.findUnique({
      where: { id: postId },
      include: { targets: { include: { socialAccount: true } } },
    });

    if (!post) {
      this.logger.warn(`Post ${postId} not found`);
      return;
    }

    await this.prisma.post.update({
      where: { id: postId },
      data: { status: PostStatus.PUBLISHING },
    });

    let allSuccess = true;

    for (const target of post.targets) {
      try {
        // Decrypt tokens for the social account
        const tokens = JSON.parse(decrypt(target.socialAccount.encryptedTokens));

        // STUB: Platform publishing adapters are isolated here.
        // When live OAuth creds + scopes are configured per platform,
        // replace the stub below with the real platform adapter call.
        // e.g. await this.publishToMeta(tokens, post.content, post.mediaUrls);
        this.logger.log(`[STUB PUBLISH] Platform: ${target.socialAccount.platform}, Account: ${target.socialAccount.accountName}, Content: ${post.content.substring(0, 50)}...`);

        // Simulate successful publish
        await this.prisma.postTarget.update({
          where: { id: target.id },
          data: {
            status: PostStatus.PUBLISHED,
            platformPostId: `mock-${Date.now()}`,
          },
        });
      } catch (error: any) {
        allSuccess = false;
        this.logger.error(`Failed to publish to ${target.socialAccount.platform}: ${error.message}`);
        await this.prisma.postTarget.update({
          where: { id: target.id },
          data: {
            status: PostStatus.FAILED,
            errorMessage: error.message,
          },
        });
      }
    }

    await this.prisma.post.update({
      where: { id: postId },
      data: {
        status: allSuccess ? PostStatus.PUBLISHED : PostStatus.FAILED,
        publishedAt: allSuccess ? new Date() : null,
      },
    });

    this.logger.log(`Post ${postId} processing complete. Success: ${allSuccess}`);
  }
}
