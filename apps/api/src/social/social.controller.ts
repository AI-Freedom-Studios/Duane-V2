import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { SocialService } from './social.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Request } from 'express';

@Controller('social')
@UseGuards(JwtAuthGuard)
export class SocialController {
  constructor(private service: SocialService) {}

  @Get('accounts')
  getAccounts(@Req() req: Request) {
    return this.service.getAccounts((req.user as any).id);
  }

  @Get('metrics')
  getMetrics(@Req() req: Request) {
    return this.service.getMetrics((req.user as any).id);
  }

  @Get('feed')
  getFeed(@Req() req: Request) {
    return this.service.getFeed((req.user as any).id);
  }
}
