import { Controller, Get, Post, Body, Req, UseGuards, Param, Query, Res } from '@nestjs/common';
import { PoeService, PoeMessageRequest, PoeVideoRequest } from './poe.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Request, Response } from 'express';
import { IsArray, IsIn, IsNumber, IsOptional, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

class ChatMessageDto {
  @IsIn(['user', 'assistant', 'system'])
  role!: 'user' | 'assistant' | 'system';

  @IsString()
  content!: string;
}

class ChatRequestDto {
  @IsString()
  model!: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ChatMessageDto)
  messages!: Array<{ role: 'user' | 'assistant' | 'system'; content: string }>;

  @IsOptional()
  @IsNumber()
  temperature?: number;

  @IsOptional()
  @IsNumber()
  maxTokens?: number;
}

class VideoRequestDto {
  @IsString()
  model!: string;

  @IsString()
  prompt!: string;

  @IsOptional()
  @IsNumber()
  duration?: number;

  @IsOptional()
  @IsString()
  resolution?: string;

  @IsOptional()
  @IsString()
  aspectRatio?: string;

  @IsOptional()
  @IsString()
  referenceImage?: string;
}

class ImageRequestDto {
  @IsString()
  model!: string;

  @IsString()
  prompt!: string;

  @IsOptional()
  @IsNumber()
  width?: number;

  @IsOptional()
  @IsNumber()
  height?: number;
}

@Controller('poe')
export class PoeController {
  constructor(private poeService: PoeService) {}

  @Get('models')
  getModels(@Query('category') category?: string) {
    if (category) {
      return this.poeService.getModelsByCategory(category);
    }
    return this.poeService.getAvailableModels();
  }

  @Get('models/:id')
  getModel(@Param('id') id: string) {
    return this.poeService.getModelById(id);
  }

  @Post('chat')
  @UseGuards(JwtAuthGuard)
  async chat(@Body() dto: ChatRequestDto, @Req() req: Request) {
    return this.poeService.sendMessage((req.user as any).id, dto);
  }

  @Post('video/generate')
  @UseGuards(JwtAuthGuard)
  async generateVideo(@Body() dto: VideoRequestDto, @Req() req: Request) {
    return this.poeService.generateVideo((req.user as any).id, dto);
  }

  @Get('videos/:id')
  @UseGuards(JwtAuthGuard)
  async getVideoStatus(@Param('id') id: string, @Req() req: Request) {
    return this.poeService.getVideoStatus((req.user as any).id, id);
  }

  @Get('videos/:id/content')
  @UseGuards(JwtAuthGuard)
  async getVideoContent(@Param('id') id: string, @Req() req: Request, @Res() res: Response) {
    const { buffer, contentType } = await this.poeService.getVideoContent((req.user as any).id, id);
    res.setHeader('Content-Type', contentType);
    res.setHeader('Cache-Control', 'private, max-age=300');
    res.send(buffer);
  }

  @Get('videos/:id/preview')
  @UseGuards(JwtAuthGuard)
  async getVideoPreview(@Param('id') id: string, @Req() req: Request, @Res() res: Response) {
    const { buffer, contentType } = await this.poeService.getVideoPreviewContent((req.user as any).id, id);
    res.setHeader('Content-Type', contentType);
    res.setHeader('Cache-Control', 'private, max-age=300');
    res.send(buffer);
  }

  @Post('image/generate')
  @UseGuards(JwtAuthGuard)
  async generateImage(@Body() dto: ImageRequestDto, @Req() req: Request) {
    return this.poeService.generateImage(
      (req.user as any).id,
      dto.model,
      dto.prompt,
      { width: dto.width, height: dto.height },
    );
  }
}
