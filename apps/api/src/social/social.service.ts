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

    const xAccount = accounts.find((account) => account.platform.toLowerCase() === 'x');
    if (xAccount) {
      metricsByPlatform.x = await this.getXMetrics(xAccount);
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

    const xAccount = accounts.find((account) => account.platform.toLowerCase() === 'x');
    if (xAccount) {
      items.push(...await this.getXFeed(xAccount));
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

  private async getXMetrics(account: any): Promise<PlatformMetrics> {
    const tokens = JSON.parse(decrypt(account.encryptedTokens)) as OAuthTokens;

    if (!tokens.access_token) {
      return {
        ...this.emptyMetrics('x'),
        connected: true,
        lastSyncedAt: account.lastSyncAt?.toISOString() || null,
      };
    }

    try {
      return await this.fetchXMetrics(account, tokens.access_token);
    } catch (error: any) {
      const message = String(error?.message || error);
      if (!message.startsWith('X_AUTH_FAILED') || !tokens.refresh_token) {
        return {
          ...this.emptyMetrics('x'),
          connected: true,
          lastSyncedAt: account.lastSyncAt?.toISOString() || null,
        };
      }

      const refreshed = await this.refreshXTokens(tokens.refresh_token);
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
          ...this.emptyMetrics('x'),
          connected: true,
          lastSyncedAt: new Date().toISOString(),
        };
      }

      return this.fetchXMetrics(account, mergedTokens.access_token);
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

  private async fetchXMetrics(account: any, accessToken: string): Promise<PlatformMetrics> {
    const userResponse = await fetch(
      'https://api.x.com/2/users/me?user.fields=public_metrics,profile_image_url,username',
      { headers: { Authorization: `Bearer ${accessToken}` } },
    );

    if (userResponse.status === 401) {
      throw new Error(`X_AUTH_FAILED: ${await userResponse.text()}`);
    }

    if (!userResponse.ok) {
      throw new Error(`X metrics user lookup failed (${userResponse.status}): ${await userResponse.text()}`);
    }

    const userData = await userResponse.json() as {
      data?: {
        id?: string;
        public_metrics?: {
          followers_count?: number;
          tweet_count?: number;
        };
      };
    };

    const userId = userData.data?.id || account.platformAccountId;
    const followers = userData.data?.public_metrics?.followers_count ?? null;
    const posts = userData.data?.public_metrics?.tweet_count ?? null;

    let engagementRate: number | null = null;
    if (userId) {
      const tweetsResponse = await fetch(
        `https://api.x.com/2/users/${encodeURIComponent(userId)}/tweets?max_results=10&exclude=retweets,replies&tweet.fields=public_metrics,created_at`,
        { headers: { Authorization: `Bearer ${accessToken}` } },
      );

      if (tweetsResponse.status === 401) {
        throw new Error(`X_AUTH_FAILED: ${await tweetsResponse.text()}`);
      }

      if (tweetsResponse.ok) {
        const tweetsData = await tweetsResponse.json() as {
          data?: Array<{
            public_metrics?: {
              like_count?: number;
              reply_count?: number;
              retweet_count?: number;
              quote_count?: number;
            };
          }>;
        };

        const tweets = tweetsData.data || [];
        if (tweets.length > 0 && followers && followers > 0) {
          const totalEngagement = tweets.reduce((sum, tweet) => {
            const metrics = tweet.public_metrics;
            return sum
              + (metrics?.like_count || 0)
              + (metrics?.reply_count || 0)
              + (metrics?.retweet_count || 0)
              + (metrics?.quote_count || 0);
          }, 0);

          engagementRate = Number((((totalEngagement / tweets.length) / followers) * 100).toFixed(1));
        }
      }
    }

    return {
      platform: 'x',
      connected: true,
      followers,
      posts,
      views: null,
      engagementRate,
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

  private async getXFeed(account: any): Promise<SocialFeedItem[]> {
    const tokens = JSON.parse(decrypt(account.encryptedTokens)) as OAuthTokens;

    if (!tokens.access_token) return [];

    try {
      return await this.fetchXFeed(account, tokens.access_token);
    } catch (error: any) {
      const message = String(error?.message || error);
      if (!message.startsWith('X_AUTH_FAILED') || !tokens.refresh_token) {
        return [];
      }

      const refreshed = await this.refreshXTokens(tokens.refresh_token);
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

      return this.fetchXFeed(account, mergedTokens.access_token);
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

  private async fetchXFeed(account: any, accessToken: string): Promise<SocialFeedItem[]> {
    const userResponse = await fetch(
      'https://api.x.com/2/users/me?user.fields=username',
      { headers: { Authorization: `Bearer ${accessToken}` } },
    );

    if (userResponse.status === 401) {
      throw new Error(`X_AUTH_FAILED: ${await userResponse.text()}`);
    }

    if (!userResponse.ok) {
      throw new Error(`X feed user lookup failed (${userResponse.status}): ${await userResponse.text()}`);
    }

    const userData = await userResponse.json() as {
      data?: {
        id?: string;
        username?: string;
      };
    };

    const userId = userData.data?.id || account.platformAccountId;
    if (!userId) return [];

    const tweetsResponse = await fetch(
      `https://api.x.com/2/users/${encodeURIComponent(userId)}/tweets?max_results=5&exclude=retweets,replies&tweet.fields=created_at,public_metrics`,
      { headers: { Authorization: `Bearer ${accessToken}` } },
    );

    if (tweetsResponse.status === 401) {
      throw new Error(`X_AUTH_FAILED: ${await tweetsResponse.text()}`);
    }

    if (!tweetsResponse.ok) {
      throw new Error(`X feed lookup failed (${tweetsResponse.status}): ${await tweetsResponse.text()}`);
    }

    const tweetsData = await tweetsResponse.json() as {
      data?: Array<{
        id?: string;
        text?: string;
        created_at?: string;
        public_metrics?: {
          like_count?: number;
          reply_count?: number;
          retweet_count?: number;
          quote_count?: number;
        };
      }>;
    };

    return (tweetsData.data || []).map((tweet) => ({
      id: tweet.id || `x-${Date.now()}`,
      platform: 'X',
      title: tweet.text || account.accountName || 'X post',
      publishedAt: tweet.created_at || null,
      views: null,
      likes: tweet.public_metrics?.like_count ?? null,
      comments: tweet.public_metrics?.reply_count ?? null,
      url: tweet.id ? `https://x.com/i/web/status/${tweet.id}` : null,
    }));
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
}
