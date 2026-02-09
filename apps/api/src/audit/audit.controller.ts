import { Controller, Get, Query, Req, UseGuards } from '@nestjs/common';
import { AuditService } from './audit.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Request } from 'express';

@Controller('audit')
@UseGuards(JwtAuthGuard)
export class AuditController {
  constructor(private audit: AuditService) {}

  @Get()
  list(@Req() req: Request, @Query('page') page?: string, @Query('limit') limit?: string) {
    const userId = (req.user as any).id;
    return this.audit.getByUser(userId, page ? parseInt(page) : 1, limit ? parseInt(limit) : 50);
  }
}
