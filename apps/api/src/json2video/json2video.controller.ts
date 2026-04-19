import { Body, Controller, Get, Param, Post, Req, UseGuards } from '@nestjs/common';
import { IsNumber, IsOptional, IsString } from 'class-validator';
import { Request } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Json2VideoService } from './json2video.service';

class Json2VideoRequestDto {
  @IsString()
  prompt!: string;

  @IsOptional()
  @IsNumber()
  duration?: number;

  @IsOptional()
  @IsString()
  resolution?: string;
}

@Controller('json2video')
export class Json2VideoController {
  constructor(private service: Json2VideoService) {}

  @Post('video/generate')
  @UseGuards(JwtAuthGuard)
  generateVideo(@Body() dto: Json2VideoRequestDto, @Req() req: Request) {
    return this.service.generateVideo((req.user as any).id, dto);
  }

  @Get('videos/:id')
  @UseGuards(JwtAuthGuard)
  getVideoStatus(@Param('id') id: string, @Req() req: Request) {
    return this.service.getVideoStatus((req.user as any).id, id);
  }
}
