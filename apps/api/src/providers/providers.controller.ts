import { Controller, Get, Post, Put, Delete, Param, Body, Req, UseGuards } from '@nestjs/common';
import { ProvidersService } from './providers.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Request } from 'express';
import { IsObject, IsOptional, IsString, MaxLength } from 'class-validator';

class AddKeyDto {
  @IsString()
  providerSlug!: string;

  @IsString()
  @MaxLength(100)
  label!: string;

  @IsString()
  apiKey!: string;

  @IsOptional()
  @IsObject()
  additionalFields?: Record<string, string>;
}

class UpdateKeyDto {
  @IsOptional()
  @IsString()
  @MaxLength(100)
  label?: string;

  @IsOptional()
  @IsString()
  apiKey?: string;

  @IsOptional()
  @IsObject()
  additionalFields?: Record<string, string>;
}

@Controller('providers')
export class ProvidersController {
  constructor(private service: ProvidersService) {}

  @Get('registry')
  getRegistry() {
    return this.service.getAvailableProviders();
  }

  @Get('keys')
  @UseGuards(JwtAuthGuard)
  getKeys(@Req() req: Request) {
    return this.service.getUserKeys((req.user as any).id);
  }

  @Post('keys')
  @UseGuards(JwtAuthGuard)
  addKey(@Body() dto: AddKeyDto, @Req() req: Request) {
    return this.service.addKey((req.user as any).id, dto.providerSlug, dto.label, dto.apiKey, dto.additionalFields, req.ip);
  }

  @Put('keys/:id')
  @UseGuards(JwtAuthGuard)
  updateKey(@Param('id') id: string, @Body() dto: UpdateKeyDto, @Req() req: Request) {
    return this.service.updateKey((req.user as any).id, id, dto, req.ip);
  }

  @Delete('keys/:id')
  @UseGuards(JwtAuthGuard)
  deleteKey(@Param('id') id: string, @Req() req: Request) {
    return this.service.deleteKey((req.user as any).id, id, req.ip);
  }

  @Post('keys/:id/test')
  @UseGuards(JwtAuthGuard)
  testKey(@Param('id') id: string, @Req() req: Request) {
    return this.service.testKey((req.user as any).id, id, req.ip);
  }
}
