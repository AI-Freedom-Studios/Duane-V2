import { Controller, Get } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Controller()
export class HealthController {
  constructor(private config: ConfigService) {}

  @Get('health')
  health() {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }

  @Get('health/oauth-config')
  oauthConfig() {
    const youtubeClientId = this.config.get<string>('YOUTUBE_CLIENT_ID') || '';
    const youtubeClientSecret = this.config.get<string>('YOUTUBE_CLIENT_SECRET') || '';
    const youtubeRedirectUri = this.config.get<string>('YOUTUBE_REDIRECT_URI') || '';

    return {
      youtube: {
        hasClientId: youtubeClientId.length > 0,
        clientIdSuffix: youtubeClientId.slice(-32),
        hasClientSecret: youtubeClientSecret.length > 0,
        clientSecretLength: youtubeClientSecret.length,
        clientSecretPrefix: youtubeClientSecret.slice(0, 6),
        clientSecretSuffix: youtubeClientSecret.slice(-4),
        redirectUri: youtubeRedirectUri,
      },
    };
  }
}
