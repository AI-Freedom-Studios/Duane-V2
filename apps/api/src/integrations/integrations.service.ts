import { Injectable, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { AuditAction } from '@agentos/shared';
import { encrypt, decrypt } from '../common/crypto';
import { v4 as uuidv4 } from 'uuid';
import { createHash, createHmac, randomBytes, timingSafeEqual } from 'crypto';

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
          authUrl: 'https://x.com/i/oauth2/authorize',
          tokenUrl: 'https://api.x.com/2/oauth2/token',
          scopes: ['tweet.read', 'tweet.write', 'users.read', 'offline.access'],
        };
      default:
        throw new BadRequestException(`Unsupported platform: ${platform}`);
    }
  }

  private createState(userId: string, platform: string, extra: Record<string, string> = {}): string {
    const payload = Buffer.from(
      JSON.stringify({
        userId,
        platform,
        expiresAt: Date.now() + 600000,
        nonce: uuidv4(),
        ...extra,
      }),
    ).toString('base64url');
    const signature = createHmac('sha256', this.config.get('JWT_SECRET') || 'dev-secret')
      .update(payload)
      .digest('base64url');

    return `${payload}.${signature}`;
  }

  private createCodeVerifier() {
    return randomBytes(32).toString('base64url');
  }

  private createCodeChallenge(verifier: string) {
    return createHash('sha256').update(verifier).digest('base64url');
  }

  private readState(platform: string, state: string): { userId: string; platform: string; expiresAt: number; codeVerifier?: string } {
    const [payload, signature] = state.split('.');
    if (!payload || !signature) {
      throw new BadRequestException('Invalid OAuth state');
    }

    const expectedSignature = createHmac('sha256', this.config.get('JWT_SECRET') || 'dev-secret')
      .update(payload)
      .digest('base64url');
    const signatureBuffer = Buffer.from(signature);
    const expectedBuffer = Buffer.from(expectedSignature);

    if (signatureBuffer.length !== expectedBuffer.length || !timingSafeEqual(signatureBuffer, expectedBuffer)) {
      throw new BadRequestException('Invalid OAuth state');
    }

    const decoded = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
    if (decoded.platform !== platform || decoded.expiresAt < Date.now()) {
      throw new BadRequestException('Invalid or expired OAuth state');
    }

    return decoded;
  }

  getConnectUrl(userId: string, platform: string): string {
    const config = this.getOAuthConfig(platform);
    if (!config.clientId) {
      throw new BadRequestException(`OAuth not configured for ${platform}. Set ${platform.toUpperCase()}_CLIENT_ID env var.`);
    }

    const needsPkce = platform === 'x' || platform === 'tiktok';
    const codeVerifier = needsPkce ? this.createCodeVerifier() : undefined;
    const state = this.createState(userId, platform, codeVerifier ? { codeVerifier } : {});

    const params = new URLSearchParams();
    params.set(platform === 'tiktok' ? 'client_key' : 'client_id', config.clientId);
    params.set('redirect_uri', config.redirectUri);
    params.set('scope', platform === 'tiktok' ? config.scopes.join(',') : config.scopes.join(' '));
    params.set('response_type', 'code');
    params.set('state', state);

    if (platform === 'youtube') {
      params.set('access_type', 'offline');
      params.set('prompt', 'consent');
      params.set('include_granted_scopes', 'true');
    }

    if (needsPkce && codeVerifier) {
      params.set('code_challenge', this.createCodeChallenge(codeVerifier));
      params.set('code_challenge_method', 'S256');
    }

    return `${config.authUrl}?${params.toString()}`;
  }

  async handleCallback(platform: string, code: string, state: string, ip?: string) {
    const stateData = this.readState(platform, state);

    const config = this.getOAuthConfig(platform);

    // Exchange code for tokens
    const tokenBody = new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: config.redirectUri,
    });
    const tokenHeaders: Record<string, string> = { 'Content-Type': 'application/x-www-form-urlencoded' };

    if (platform === 'x') {
      tokenBody.set('client_id', config.clientId);
      if (!stateData.codeVerifier) {
        throw new BadRequestException('Missing X OAuth code verifier');
      }
      tokenBody.set('code_verifier', stateData.codeVerifier);
      tokenHeaders.Authorization = `Basic ${Buffer.from(`${config.clientId}:${config.clientSecret}`).toString('base64')}`;
    } else if (platform === 'tiktok') {
      tokenBody.set('client_key', config.clientId);
      tokenBody.set('client_secret', config.clientSecret);
      if (!stateData.codeVerifier) {
        throw new BadRequestException('Missing TikTok OAuth code verifier');
      }
      tokenBody.set('code_verifier', stateData.codeVerifier);
    } else {
      tokenBody.set('client_id', config.clientId);
      tokenBody.set('client_secret', config.clientSecret);
    }

    const tokenResponse = await fetch(config.tokenUrl, {
      method: 'POST',
      headers: tokenHeaders,
      body: tokenBody.toString(),
    });

    if (!tokenResponse.ok) {
      const details = await tokenResponse.text().catch(() => '');
      throw new BadRequestException(`Token exchange failed for ${platform}${details ? `: ${details}` : ''}`);
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
    try {
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
        case 'youtube': {
          const res = await fetch('https://www.googleapis.com/youtube/v3/channels?part=snippet&mine=true', {
            headers: { Authorization: `Bearer ${accessToken}` },
          });
          const data = await res.json();
          const channel = data.items?.[0];
          if (channel) {
            return { id: channel.id, name: channel.snippet.title, avatar: channel.snippet.thumbnails?.default?.url };
          }
          return { id: `yt-${Date.now()}`, name: 'YouTube Channel' };
        }
        case 'tiktok': {
          const res = await fetch('https://open.tiktokapis.com/v2/user/info/?fields=open_id,display_name,avatar_url', {
            headers: { Authorization: `Bearer ${accessToken}` },
          });
          const data = await res.json();
          const user = data.data?.user;
          if (user) {
            return { id: user.open_id, name: user.display_name, avatar: user.avatar_url };
          }
          return { id: `tt-${Date.now()}`, name: 'TikTok Account' };
        }
        case 'x': {
          const res = await fetch('https://api.twitter.com/2/users/me?user.fields=profile_image_url', {
            headers: { Authorization: `Bearer ${accessToken}` },
          });
          const data = await res.json();
          if (data.data) {
            return { id: data.data.id, name: data.data.name || data.data.username, avatar: data.data.profile_image_url };
          }
          return { id: `x-${Date.now()}`, name: 'X Account' };
        }
        default:
          return { id: `${platform}-${Date.now()}`, name: `${platform} account` };
      }
    } catch {
      // If profile fetch fails, return a fallback rather than breaking the entire OAuth flow
      return { id: `${platform}-${Date.now()}`, name: `${platform} account` };
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
