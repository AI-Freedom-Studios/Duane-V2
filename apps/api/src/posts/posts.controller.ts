import { Controller, Get, Post, Put, Delete, Param, Body, Query, Req, UseGuards } from '@nestjs/common';
import { PostsService } from './posts.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Request } from 'express';
import { ArrayNotEmpty, IsArray, IsISO8601, IsOptional, IsString, IsUrl, MinLength } from 'class-validator';

class CreatePostDto {
  @IsString()
  @MinLength(1)
  content!: string;

  @IsOptional()
  @IsArray()
  @IsUrl({ require_tld: false }, { each: true })
  mediaUrls?: string[];

  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  targetAccountIds!: string[];

  @IsOptional()
  @IsISO8601()
  scheduledAt?: string;
}

class UpdatePostDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  content?: string;

  @IsOptional()
  @IsArray()
  @IsUrl({ require_tld: false }, { each: true })
  mediaUrls?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  targetAccountIds?: string[];

  @IsOptional()
  @IsISO8601()
  scheduledAt?: string | null;
}

@Controller('posts')
@UseGuards(JwtAuthGuard)
export class PostsController {
  constructor(private service: PostsService) {}

  @Post()
  create(@Body() dto: CreatePostDto, @Req() req: Request) {
    return this.service.create((req.user as any).id, dto, req.ip);
  }

  @Get()
  list(@Req() req: Request, @Query('page') page?: string, @Query('limit') limit?: string) {
    return this.service.list((req.user as any).id, page ? parseInt(page) : 1, limit ? parseInt(limit) : 20);
  }

  @Get(':id')
  getById(@Param('id') id: string, @Req() req: Request) {
    return this.service.getById((req.user as any).id, id);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() dto: UpdatePostDto, @Req() req: Request) {
    return this.service.update((req.user as any).id, id, dto);
  }

  @Delete(':id')
  delete(@Param('id') id: string, @Req() req: Request) {
    return this.service.delete((req.user as any).id, id);
  }

  @Post(':id/publish')
  publish(@Param('id') id: string, @Req() req: Request) {
    return this.service.publishNow((req.user as any).id, id, req.ip);
  }
}
