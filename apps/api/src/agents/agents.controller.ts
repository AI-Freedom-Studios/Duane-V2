import { Controller, Get, Post, Put, Delete, Param, Body, Req, UseGuards } from '@nestjs/common';
import { AgentsService } from './agents.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Request } from 'express';

class CreateAgentDto {
  name!: string;
  role!: string;
  description?: string;
  promptTemplate?: string;
  tools?: string[];
  isOrchestrator?: boolean;
  teamId?: string | null;
}

class DelegateDto {
  taskTitle!: string;
  taskDescription!: string;
  targetAgentIds!: string[];
}

@Controller('agents')
@UseGuards(JwtAuthGuard)
export class AgentsController {
  constructor(private service: AgentsService) {}

  @Get()
  getAll() {
    return this.service.getAll();
  }

  @Get('teams')
  getTeams() {
    return this.service.getTeams();
  }

  @Get(':id')
  getById(@Param('id') id: string) {
    return this.service.getById(id);
  }

  @Post()
  create(@Body() dto: CreateAgentDto, @Req() req: Request) {
    return this.service.create((req.user as any).id, dto);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() dto: Partial<CreateAgentDto>, @Req() req: Request) {
    return this.service.update((req.user as any).id, id, dto);
  }

  @Delete(':id')
  delete(@Param('id') id: string) {
    return this.service.delete(id);
  }

  @Post(':id/delegate')
  delegate(@Param('id') id: string, @Body() dto: DelegateDto, @Req() req: Request) {
    return this.service.delegate(id, (req.user as any).id, dto.taskTitle, dto.taskDescription, dto.targetAgentIds);
  }
}
