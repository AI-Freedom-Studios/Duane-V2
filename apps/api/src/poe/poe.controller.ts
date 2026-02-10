import { Controller, Get, Post, Body, Req, UseGuards, Param, Query } from '@nestjs/common';
import { PoeService, PoeMessageRequest, PoeVideoRequest } from './poe.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Request } from 'express';

class ChatRequestDto {
  model!: string;
  messages!: Array<{ role: 'user' | 'assistant' | 'system'; content: string }>;
  temperature?: number;
  maxTokens?: number;
}

class VideoRequestDto {
  model!: string;
  prompt!: string;
  duration?: number;
  resolution?: string;
  aspectRatio?: string;
}

class ImageRequestDto {
  model!: string;
  prompt!: string;
  width?: number;
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
