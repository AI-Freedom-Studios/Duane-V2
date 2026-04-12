import { Controller, Get, Post, Put, Param, Body, Query, Req, UseGuards } from '@nestjs/common';
import { TasksService } from './tasks.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Request } from 'express';
import { IsOptional, IsString, MaxLength } from 'class-validator';

class CreateTaskDto {
  @IsString()
  @MaxLength(200)
  title!: string;

  @IsOptional()
  @IsString()
  @MaxLength(5000)
  description?: string;

  @IsOptional()
  @IsString()
  assignedAgentId?: string | null;

  @IsOptional()
  @IsString()
  parentTaskId?: string | null;
}

class UpdateStatusDto {
  @IsString()
  status!: string;

  @IsOptional()
  @IsString()
  result?: string;
}

class AssignDto {
  @IsString()
  agentId!: string;
}

@Controller('tasks')
@UseGuards(JwtAuthGuard)
export class TasksController {
  constructor(private service: TasksService) {}

  @Post()
  create(@Body() dto: CreateTaskDto, @Req() req: Request) {
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

  @Put(':id/status')
  updateStatus(@Param('id') id: string, @Body() dto: UpdateStatusDto, @Req() req: Request) {
    return this.service.updateStatus((req.user as any).id, id, dto.status, dto.result);
  }

  @Put(':id/assign')
  assign(@Param('id') id: string, @Body() dto: AssignDto, @Req() req: Request) {
    return this.service.assign((req.user as any).id, id, dto.agentId, req.ip);
  }
}
