import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { AuditAction } from '@agentos/shared';

@Injectable()
export class AgentsService {
  constructor(
    private prisma: PrismaService,
    private audit: AuditService,
  ) {}

  async getAll() {
    return this.prisma.agent.findMany({
      include: { team: true },
      orderBy: { createdAt: 'asc' },
    });
  }

  async getById(id: string) {
    const agent = await this.prisma.agent.findUnique({
      where: { id },
      include: { team: true, tasks: { orderBy: { createdAt: 'desc' }, take: 10 } },
    });
    if (!agent) throw new NotFoundException('Agent not found');
    return agent;
  }

  async create(userId: string, data: { name: string; role: string; description?: string; promptTemplate?: string; tools?: string[]; isOrchestrator?: boolean; teamId?: string | null }) {
    const agent = await this.prisma.agent.create({ data: data as any });
    await this.audit.log(userId, AuditAction.AGENT_CREATE, { agentId: agent.id, name: agent.name });
    return agent;
  }

  async update(userId: string, id: string, data: Partial<{ name: string; role: string; description: string; promptTemplate: string; tools: string[]; isOrchestrator: boolean; teamId: string | null }>) {
    const agent = await this.prisma.agent.findUnique({ where: { id } });
    if (!agent) throw new NotFoundException('Agent not found');
    const updated = await this.prisma.agent.update({ where: { id }, data: data as any });
    await this.audit.log(userId, AuditAction.AGENT_UPDATE, { agentId: id, changes: Object.keys(data) });
    return updated;
  }

  async delete(id: string) {
    await this.prisma.agent.delete({ where: { id } });
  }

  async getTeams() {
    return this.prisma.team.findMany({
      include: { agents: true },
      orderBy: { createdAt: 'asc' },
    });
  }

  async delegate(orchestratorId: string, userId: string, taskTitle: string, taskDescription: string, targetAgentIds: string[]) {
    // Create parent task assigned to orchestrator
    const parentTask = await this.prisma.task.create({
      data: {
        title: taskTitle,
        description: taskDescription,
        assignedAgentId: orchestratorId,
        userId,
        status: 'IN_PROGRESS',
      },
    });

    // Create subtasks for each target agent
    const subtasks = await Promise.all(
      targetAgentIds.map((agentId) =>
        this.prisma.task.create({
          data: {
            title: `Subtask of: ${taskTitle}`,
            description: taskDescription,
            assignedAgentId: agentId,
            parentTaskId: parentTask.id,
            userId,
            status: 'PENDING',
          },
        }),
      ),
    );

    return { parentTask, subtasks };
  }
}
