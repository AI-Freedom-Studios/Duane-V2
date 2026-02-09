import { Injectable, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { AuditAction } from '@agentos/shared';
import { encrypt, decrypt } from '../common/crypto';
import { v4 as uuidv4 } from 'uuid';

interface OAuthConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  authUrl: string;
  tokenUrl: string;
  scopes: string[];
}

@Injectable()
export class IntegrationsService {
  private oauthStates = new Map<string, { userId: string; platform: string; expiresAt: number }>();

  constructor(
    private prisma: PrismaService,
    private config: ConfigService,
    private audit: AuditService,
  ) {}

  private getOAuthConfig(platform: string): OAuthConfig {
    switch (platform) {
      case 'meta':
        return {
          clientId: this.config.get('META_CLIENT_ID') || '',
          clientSecret: this.config.get('META_CLIENT_SECRET') || '',
          redirectUri: this.config.get('META_REDIRECT_URI') || 'http://localhost:4000/integrations/oauth/meta/callback',
          authUrl: 'https://www.facebook.com/v19.0/dialog/oauth',
          tokenUrl: 'https://graph.facebook.com/v19.0/oauth/access_token',
          scopes: ['pages_show_list', 'pages_manage_posts', 'instagram_basic', 'instagram_content_publish'],
        };
      case 'linkedin':
        return {
          clientId: this.config.get('LINKEDIN_CLIENT_ID') || '',
          clientSecret: this.config.get('LINKEDIN_CLIENT_SECRET') || '',
          redirectUri: this.config.get('LINKEDIN_REDIRECT_URI') || 'http://localhost:4000/integrations/oauth/linkedin/callback',
          authUrl: 'https://www.linkedin.com/oauth/v2/authorization',
          tokenUrl: 'https://www.linkedin.com/oauth/v2/accessToken',
          scopes: ['openid', 'profile', 'w_member_social'],
        };
      case 'youtube':
        return {
          clientId: this.config.get('YOUTUBE_CLIENT_ID') || '',
          clientSecret: this.config.get('YOUTUBE_CLIENT_SECRET') || '',
          redirectUri: this.config.get('YOUTUBE_REDIRECT_URI') || 'http://localhost:4000/integrations/oauth/youtube/callback',
          authUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
          tokenUrl: 'https://oauth2.googleapis.com/token',
          scopes: ['https://www.googleapis.com/auth/youtube', 'https://www.googleapis.com/auth/youtube.upload'],
        };
      case 'tiktok':
        return {
          clientId: this.config.get('TIKTOK_CLIENT_ID') || '',
          clientSecret: this.config.get('TIKTOK_CLIENT_SECRET') || '',
          redirectUri: this.config.get('TIKTOK_REDIRECT_URI') || 'http://localhost:4000/integrations/oauth/tiktok/callback',
          authUrl: 'https://www.tiktok.com/v2/auth/authorize/',
          tokenUrl: 'https://open.tiktokapis.com/v2/oauth/token/',
          scopes: ['user.info.basic', 'video.publish'],
        };
      case 'x':
        return {
          clientId: this.config.get('X_CLIENT_ID') || '',
          clientSecret: this.config.get('X_CLIENT_SECRET') || '',
          redirectUri: this.config.get('X_REDIRECT_URI') || 'http://localhost:4000/integrations/oauth/x/callback',
          authUrl: 'https://twitter.com/i/oauth2/authorize',
          tokenUrl: 'https://api.twitter.com/2/oauth2/token',
          scopes: ['tweet.read', 'tweet.write', 'users.read', 'offline.access'],
        };
      default:
        throw new BadRequestException(`Unsupported platform: ${platform}`);
    }
  }

  getConnectUrl(userId: string, platform: string): string {
    const config = this.getOAuthConfig(platform);
    if (!config.clientId) {
      throw new BadRequestException(`OAuth not configured for ${platform}. Set ${platform.toUpperCase()}_CLIENT_ID env var.`);
    }

    const state = uuidv4();
    this.oauthStates.set(state, { userId, platform, expiresAt: Date.now() + 600000 });

    const params = new URLSearchParams({
      client_id: config.clientId,
      redirect_uri: config.redirectUri,
      scope: config.scopes.join(' '),
      response_type: 'code',
      state,
    });

    return `${config.authUrl}?${params.toString()}`;
  }

  async handleCallback(platform: string, code: string, state: string, ip?: string) {
    const stateData = this.oauthStates.get(state);
    if (!stateData || stateData.platform !== platform || stateData.expiresAt < Date.now()) {
      throw new BadRequestException('Invalid or expired OAuth state');
    }
    this.oauthStates.delete(state);

    const config = this.getOAuthConfig(platform);

    // Exchange code for tokens
    const tokenResponse = await fetch(config.tokenUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: config.redirectUri,
        client_id: config.clientId,
        client_secret: config.clientSecret,
      }).toString(),
    });

    if (!tokenResponse.ok) {
      throw new BadRequestException(`Token exchange failed for ${platform}`);
    }

    const tokens = await tokenResponse.json();
    const encryptedTokens = encrypt(JSON.stringify(tokens));

    // Get user profile from platform
    const profile = await this.fetchProfile(platform, tokens.access_token);

    const account = await this.prisma.socialAccount.upsert({
      where: {
        userId_platform_platformAccountId: {
          userId: stateData.userId,
          platform,
          platformAccountId: profile.id,
        },
      },
      update: {
        accountName: profile.name,
        accountAvatar: profile.avatar,
        encryptedTokens,
        isActive: true,
        lastSyncAt: new Date(),
      },
      create: {
        userId: stateData.userId,
        platform,
        platformAccountId: profile.id,
        accountName: profile.name,
        accountAvatar: profile.avatar,
        encryptedTokens,
        lastSyncAt: new Date(),
      },
    });

    await this.audit.log(stateData.userId, AuditAction.OAUTH_CONNECT, { platform, accountName: profile.name }, ip);

    return account;
  }

  private async fetchProfile(platform: string, accessToken: string): Promise<{ id: string; name: string; avatar?: string }> {
    // Platform-specific profile fetching
    switch (platform) {
      case 'meta': {
        const res = await fetch(`https://graph.facebook.com/v19.0/me?fields=id,name,picture&access_token=${accessToken}`);
        const data = await res.json();
        return { id: data.id, name: data.name, avatar: data.picture?.data?.url };
      }
      case 'linkedin': {
        const res = await fetch('https://api.linkedin.com/v2/userinfo', {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        const data = await res.json();
        return { id: data.sub, name: data.name, avatar: data.picture };
      }
      default:
        return { id: 'unknown', name: `${platform} account` };
    }
  }

  async disconnect(userId: string, accountId: string, ip?: string) {
    const account = await this.prisma.socialAccount.findFirst({ where: { id: accountId, userId } });
    if (!account) throw new BadRequestException('Account not found');

    await this.prisma.socialAccount.update({
      where: { id: accountId },
      data: { isActive: false },
    });

    await this.audit.log(userId, AuditAction.OAUTH_DISCONNECT, { platform: account.platform, accountName: account.accountName }, ip);
  }
}
