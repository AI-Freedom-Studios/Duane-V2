import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { decrypt, encrypt } from '../common/crypto';

type OAuthTokens = {
  access_token?: string;
  refresh_token?: string;
  expires_in?: number;
  scope?: string;
  token_type?: string;
  [key: string]: unknown;
};

type PlatformMetrics = {
  platform: string;
  connected: boolean;
  followers: number | null;
  posts: number | null;
  views: number | null;
  engagementRate: number | null;
  lastSyncedAt: string | null;
};

type SocialFeedItem = {
  id: string;
  platform: string;
  title: string;
  publishedAt: string | null;
  views: number | null;
  likes: number | null;
  comments: number | null;
  url: string | null;
};

@Injectable()
export class SocialService {
  constructor(
    private prisma: PrismaService,
    private config: ConfigService,
  ) {}

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

  async getMetrics(userId: string) {
    const accounts = await this.prisma.socialAccount.findMany({
      where: { userId, isActive: true },
      orderBy: { createdAt: 'desc' },
    });

    const metricsByPlatform: Record<string, PlatformMetrics> = {
      linkedin: this.emptyMetrics('linkedin'),
      meta: this.emptyMetrics('meta'),
      youtube: this.emptyMetrics('youtube'),
      x: this.emptyMetrics('x'),
      tiktok: this.emptyMetrics('tiktok'),
    };

    const youtubeAccount = accounts.find((account) => account.platform.toLowerCase() === 'youtube');
    if (youtubeAccount) {
      metricsByPlatform.youtube = await this.getYouTubeMetrics(youtubeAccount);
    }

    return metricsByPlatform;
  }

  async getFeed(userId: string) {
    const accounts = await this.prisma.socialAccount.findMany({
      where: { userId, isActive: true },
      orderBy: { createdAt: 'desc' },
    });

    const items: SocialFeedItem[] = [];
    const youtubeAccount = accounts.find((account) => account.platform.toLowerCase() === 'youtube');
    if (youtubeAccount) {
      items.push(...await this.getYouTubeFeed(youtubeAccount));
    }

    return items.sort((a, b) => {
      const aTime = a.publishedAt ? new Date(a.publishedAt).getTime() : 0;
      const bTime = b.publishedAt ? new Date(b.publishedAt).getTime() : 0;
      return bTime - aTime;
    });
  }

  private emptyMetrics(platform: string): PlatformMetrics {
    return {
      platform,
      connected: false,
      followers: null,
      posts: null,
      views: null,
      engagementRate: null,
      lastSyncedAt: null,
    };
  }

  private async getYouTubeMetrics(account: any): Promise<PlatformMetrics> {
    const tokens = JSON.parse(decrypt(account.encryptedTokens)) as OAuthTokens;

    if (!tokens.access_token) {
      return {
        ...this.emptyMetrics('youtube'),
        connected: true,
        lastSyncedAt: account.lastSyncAt?.toISOString() || null,
      };
    }

    try {
      return await this.fetchYouTubeMetrics(account, tokens.access_token);
    } catch (error: any) {
      const message = String(error?.message || error);
      if (!message.startsWith('YOUTUBE_AUTH_FAILED') || !tokens.refresh_token) {
        return {
          ...this.emptyMetrics('youtube'),
          connected: true,
          lastSyncedAt: account.lastSyncAt?.toISOString() || null,
        };
      }

      const refreshed = await this.refreshGoogleTokens(tokens.refresh_token);
      const mergedTokens = {
        ...tokens,
        ...refreshed,
        refresh_token: refreshed.refresh_token || tokens.refresh_token,
      };

      await this.prisma.socialAccount.update({
        where: { id: account.id },
        data: {
          encryptedTokens: encrypt(JSON.stringify(mergedTokens)),
          lastSyncAt: new Date(),
        },
      });

      if (!mergedTokens.access_token || typeof mergedTokens.access_token !== 'string') {
        return {
          ...this.emptyMetrics('youtube'),
          connected: true,
          lastSyncedAt: new Date().toISOString(),
        };
      }

      return this.fetchYouTubeMetrics(account, mergedTokens.access_token);
    }
  }

  private async fetchYouTubeMetrics(account: any, accessToken: string): Promise<PlatformMetrics> {
    const response = await fetch('https://www.googleapis.com/youtube/v3/channels?part=statistics&mine=true', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (response.status === 401) {
      throw new Error(`YOUTUBE_AUTH_FAILED: ${await response.text()}`);
    }

    if (!response.ok) {
      throw new Error(`YouTube metrics failed (${response.status}): ${await response.text()}`);
    }

    const data = await response.json() as {
      items?: Array<{
        statistics?: {
          subscriberCount?: string;
          videoCount?: string;
          viewCount?: string;
        };
      }>;
    };

    const stats = data.items?.[0]?.statistics;

    return {
      platform: 'youtube',
      connected: true,
      followers: stats?.subscriberCount ? Number(stats.subscriberCount) : null,
      posts: stats?.videoCount ? Number(stats.videoCount) : null,
      views: stats?.viewCount ? Number(stats.viewCount) : null,
      engagementRate: null,
      lastSyncedAt: new Date().toISOString(),
    };
  }

  private async getYouTubeFeed(account: any): Promise<SocialFeedItem[]> {
    const tokens = JSON.parse(decrypt(account.encryptedTokens)) as OAuthTokens;

    if (!tokens.access_token) return [];

    try {
      return await this.fetchYouTubeFeed(account, tokens.access_token);
    } catch (error: any) {
      const message = String(error?.message || error);
      if (!message.startsWith('YOUTUBE_AUTH_FAILED') || !tokens.refresh_token) {
        return [];
      }

      const refreshed = await this.refreshGoogleTokens(tokens.refresh_token);
      const mergedTokens = {
        ...tokens,
        ...refreshed,
        refresh_token: refreshed.refresh_token || tokens.refresh_token,
      };

      await this.prisma.socialAccount.update({
        where: { id: account.id },
        data: {
          encryptedTokens: encrypt(JSON.stringify(mergedTokens)),
          lastSyncAt: new Date(),
        },
      });

      if (!mergedTokens.access_token || typeof mergedTokens.access_token !== 'string') {
        return [];
      }

      return this.fetchYouTubeFeed(account, mergedTokens.access_token);
    }
  }

  private async fetchYouTubeFeed(account: any, accessToken: string): Promise<SocialFeedItem[]> {
    const channelResponse = await fetch('https://www.googleapis.com/youtube/v3/channels?part=contentDetails&mine=true', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (channelResponse.status === 401) {
      throw new Error(`YOUTUBE_AUTH_FAILED: ${await channelResponse.text()}`);
    }

    if (!channelResponse.ok) {
      throw new Error(`YouTube channel lookup failed (${channelResponse.status}): ${await channelResponse.text()}`);
    }

    const channelData = await channelResponse.json() as {
      items?: Array<{
        contentDetails?: {
          relatedPlaylists?: {
            uploads?: string;
          };
        };
      }>;
    };

    const uploadsPlaylistId = channelData.items?.[0]?.contentDetails?.relatedPlaylists?.uploads;
    if (!uploadsPlaylistId) return [];

    const playlistResponse = await fetch(
      `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet,contentDetails&maxResults=5&playlistId=${encodeURIComponent(uploadsPlaylistId)}`,
      { headers: { Authorization: `Bearer ${accessToken}` } },
    );

    if (playlistResponse.status === 401) {
      throw new Error(`YOUTUBE_AUTH_FAILED: ${await playlistResponse.text()}`);
    }

    if (!playlistResponse.ok) {
      throw new Error(`YouTube feed lookup failed (${playlistResponse.status}): ${await playlistResponse.text()}`);
    }

    const playlistData = await playlistResponse.json() as {
      items?: Array<{
        contentDetails?: { videoId?: string; videoPublishedAt?: string };
        snippet?: { title?: string };
      }>;
    };

    const videoIds = (playlistData.items || [])
      .map((item) => item.contentDetails?.videoId)
      .filter((value): value is string => Boolean(value));

    if (videoIds.length === 0) return [];

    const statsResponse = await fetch(
      `https://www.googleapis.com/youtube/v3/videos?part=statistics&id=${videoIds.map((id) => encodeURIComponent(id)).join(',')}`,
      { headers: { Authorization: `Bearer ${accessToken}` } },
    );

    if (statsResponse.status === 401) {
      throw new Error(`YOUTUBE_AUTH_FAILED: ${await statsResponse.text()}`);
    }

    if (!statsResponse.ok) {
      throw new Error(`YouTube video stats failed (${statsResponse.status}): ${await statsResponse.text()}`);
    }

    const statsData = await statsResponse.json() as {
      items?: Array<{
        id?: string;
        statistics?: {
          viewCount?: string;
          likeCount?: string;
          commentCount?: string;
        };
      }>;
    };

    const statsById = new Map(
      (statsData.items || []).map((item) => [
        item.id,
        {
          views: item.statistics?.viewCount ? Number(item.statistics.viewCount) : null,
          likes: item.statistics?.likeCount ? Number(item.statistics.likeCount) : null,
          comments: item.statistics?.commentCount ? Number(item.statistics.commentCount) : null,
        },
      ]),
    );

    return (playlistData.items || []).map((item) => {
      const videoId = item.contentDetails?.videoId || `youtube-${Date.now()}`;
      const stats = statsById.get(videoId);

      return {
        id: videoId,
        platform: 'YouTube',
        title: item.snippet?.title || account.accountName || 'YouTube upload',
        publishedAt: item.contentDetails?.videoPublishedAt || null,
        views: stats?.views ?? null,
        likes: stats?.likes ?? null,
        comments: stats?.comments ?? null,
        url: `https://www.youtube.com/watch?v=${videoId}`,
      };
    });
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
}
