import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Job } from 'bullmq';
import { PrismaService } from '../prisma/prisma.service';
import { PostStatus } from '@agentos/shared';
import { decrypt, encrypt } from '../common/crypto';

type OAuthTokens = {
  access_token?: string;
  refresh_token?: string;
  expires_in?: number;
  scope?: string;
  token_type?: string;
  [key: string]: unknown;
};

@Processor('posts')
export class PostProcessor extends WorkerHost {
  private readonly logger = new Logger(PostProcessor.name);

  constructor(
    private prisma: PrismaService,
    private config: ConfigService,
  ) {
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
        const tokens = JSON.parse(decrypt(target.socialAccount.encryptedTokens)) as OAuthTokens;
        const platform = target.socialAccount.platform.toLowerCase();

        let platformPostId: string;
        if (platform === 'youtube') {
          platformPostId = await this.publishToYouTube(post, target, tokens);
        } else if (platform === 'x') {
          platformPostId = await this.publishToX(post, target, tokens);
        } else {
          throw new Error(`${target.socialAccount.platform} live publishing is not configured yet.`);
        }

        await this.prisma.postTarget.update({
          where: { id: target.id },
          data: {
            status: PostStatus.PUBLISHED,
            platformPostId,
            errorMessage: null,
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

  private async publishToYouTube(post: any, target: any, tokens: OAuthTokens) {
    const mediaUrl = post.mediaUrls?.[0];
    if (!mediaUrl) {
      throw new Error('YouTube publishing requires a direct public video URL.');
    }

    if (!tokens.access_token) {
      throw new Error('YouTube access token is missing. Reconnect the YouTube account.');
    }

    try {
      return await this.uploadYouTubeVideo(tokens.access_token, post.content, mediaUrl);
    } catch (error: any) {
      const message = String(error?.message || error);
      if (!message.startsWith('YOUTUBE_AUTH_FAILED') || !tokens.refresh_token) {
        throw error;
      }

      this.logger.warn(`Refreshing YouTube token for ${target.socialAccount.accountName}`);
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
        throw new Error('YouTube token refresh did not return an access token.');
      }

      return this.uploadYouTubeVideo(mergedTokens.access_token, post.content, mediaUrl);
    }
  }

  private async publishToX(post: any, target: any, tokens: OAuthTokens) {
    if (!tokens.access_token) {
      throw new Error('X access token is missing. Reconnect the X account.');
    }

    try {
      return await this.createXPost(tokens.access_token, post.content, post.mediaUrls || []);
    } catch (error: any) {
      const message = String(error?.message || error);
      if (!message.startsWith('X_AUTH_FAILED') || !tokens.refresh_token) {
        throw error;
      }

      this.logger.warn(`Refreshing X token for ${target.socialAccount.accountName}`);
      const refreshed = await this.refreshXTokens(tokens.refresh_token);
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
        throw new Error('X token refresh did not return an access token.');
      }

      return this.createXPost(mergedTokens.access_token, post.content, post.mediaUrls || []);
    }
  }

  private async uploadYouTubeVideo(accessToken: string, content: string, mediaUrl: string) {
    const mediaResponse = await fetch(mediaUrl);
    if (!mediaResponse.ok) {
      throw new Error(`Could not download media URL (${mediaResponse.status} ${mediaResponse.statusText}). Use a direct public video file URL.`);
    }

    const contentType = mediaResponse.headers.get('content-type') || 'video/mp4';
    if (!contentType.toLowerCase().startsWith('video/')) {
      throw new Error(`YouTube publishing requires a direct video URL. The URL returned "${contentType}".`);
    }

    const mediaBuffer = Buffer.from(await mediaResponse.arrayBuffer());
    const metadata = {
      snippet: {
        title: this.getYouTubeTitle(content),
        description: content,
        categoryId: '22',
      },
      status: {
        privacyStatus: 'private',
        selfDeclaredMadeForKids: false,
      },
    };

    const sessionResponse = await fetch('https://www.googleapis.com/upload/youtube/v3/videos?uploadType=resumable&part=snippet,status', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json; charset=UTF-8',
        'X-Upload-Content-Type': contentType,
        'X-Upload-Content-Length': String(mediaBuffer.byteLength),
      },
      body: JSON.stringify(metadata),
    });

    if (sessionResponse.status === 401) {
      throw new Error(`YOUTUBE_AUTH_FAILED: ${await sessionResponse.text()}`);
    }

    if (!sessionResponse.ok) {
      throw new Error(`YouTube upload session failed (${sessionResponse.status}): ${await sessionResponse.text()}`);
    }

    const uploadUrl = sessionResponse.headers.get('location');
    if (!uploadUrl) {
      throw new Error('YouTube did not return an upload session URL.');
    }

    const uploadResponse = await fetch(uploadUrl, {
      method: 'PUT',
      headers: {
        'Content-Type': contentType,
        'Content-Length': String(mediaBuffer.byteLength),
      },
      body: mediaBuffer,
    });

    if (uploadResponse.status === 401) {
      throw new Error(`YOUTUBE_AUTH_FAILED: ${await uploadResponse.text()}`);
    }

    if (!uploadResponse.ok) {
      throw new Error(`YouTube video upload failed (${uploadResponse.status}): ${await uploadResponse.text()}`);
    }

    const uploaded = await uploadResponse.json() as { id?: string };
    if (!uploaded.id) {
      throw new Error('YouTube upload completed, but no video ID was returned.');
    }

    return uploaded.id;
  }

  private async createXPost(accessToken: string, content: string, mediaUrls: string[]) {
    const text = this.buildXPostText(content, mediaUrls);
    const response = await fetch('https://api.x.com/2/tweets', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ text }),
    });

    if (response.status === 401) {
      throw new Error(`X_AUTH_FAILED: ${await response.text()}`);
    }

    const responseBody = await response.text();
    let parsed: any = null;
    try {
      parsed = responseBody ? JSON.parse(responseBody) : null;
    } catch {
      parsed = null;
    }

    if (!response.ok) {
      const message =
        parsed?.errors?.[0]?.detail ||
        parsed?.detail ||
        parsed?.title ||
        responseBody ||
        response.statusText;
      throw new Error(`X publishing failed (${response.status}): ${message}`);
    }

    const postId = parsed?.data?.id;
    if (!postId) {
      throw new Error('X post creation succeeded, but no post ID was returned.');
    }

    return postId;
  }

  private buildXPostText(content: string, mediaUrls: string[]) {
    const trimmedContent = content.trim();
    const trimmedUrls = mediaUrls
      .map((url) => String(url || '').trim())
      .filter(Boolean);

    if (trimmedUrls.length === 0) {
      return trimmedContent;
    }

    return [trimmedContent, ...trimmedUrls].filter(Boolean).join('\n');
  }

  private async refreshGoogleTokens(refreshToken: string) {
    const clientId = this.config.get<string>('YOUTUBE_CLIENT_ID');
    const clientSecret = this.config.get<string>('YOUTUBE_CLIENT_SECRET');

    if (!clientId || !clientSecret) {
      throw new Error('YouTube OAuth credentials are missing on the API server.');
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
      throw new Error(`YouTube token refresh failed (${response.status}): ${await response.text()}`);
    }

    return response.json() as Promise<OAuthTokens>;
  }

  private async refreshXTokens(refreshToken: string) {
    const clientId = this.config.get<string>('X_CLIENT_ID');
    const clientSecret = this.config.get<string>('X_CLIENT_SECRET');

    if (!clientId || !clientSecret) {
      throw new Error('X OAuth credentials are missing on the API server.');
    }

    const response = await fetch('https://api.x.com/2/oauth2/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`,
      },
      body: new URLSearchParams({
        refresh_token: refreshToken,
        grant_type: 'refresh_token',
        client_id: clientId,
      }),
    });

    if (!response.ok) {
      throw new Error(`X token refresh failed (${response.status}): ${await response.text()}`);
    }

    return response.json() as Promise<OAuthTokens>;
  }

  private getYouTubeTitle(content: string) {
    const firstLine = content
      .split('\n')
      .map((line) => line.trim())
      .find(Boolean);

    return (firstLine || 'AgentOS video').slice(0, 100);
  }
}
