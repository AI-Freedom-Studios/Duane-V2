import { Controller, Get, Post, Delete, Param, Query, Req, Res, UseGuards } from '@nestjs/common';
import { IntegrationsService } from './integrations.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Request, Response } from 'express';

@Controller('integrations')
export class IntegrationsController {
  constructor(private service: IntegrationsService) {}

  @Get('oauth/:platform/connect')
  @UseGuards(JwtAuthGuard)
  connect(@Param('platform') platform: string, @Req() req: Request, @Res() res: Response) {
    const url = this.service.getConnectUrl((req.user as any).id, platform);
    res.redirect(url);
  }

  @Get('oauth/:platform/callback')
  async callback(
    @Param('platform') platform: string,
    @Query('code') code: string,
    @Query('state') state: string,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    try {
      await this.service.handleCallback(platform, code, state, req.ip);
      res.redirect(`${process.env.CORS_ORIGIN || 'http://localhost:3000'}/integrations?connected=${platform}`);
    } catch (error: any) {
      res.redirect(`${process.env.CORS_ORIGIN || 'http://localhost:3000'}/integrations?error=${encodeURIComponent(error.message)}`);
    }
  }

  @Delete('oauth/:accountId')
  @UseGuards(JwtAuthGuard)
  disconnect(@Param('accountId') accountId: string, @Req() req: Request) {
    return this.service.disconnect((req.user as any).id, accountId, req.ip);
  }
}
