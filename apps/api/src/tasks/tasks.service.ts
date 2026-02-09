import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { AuditAction } from '@agentos/shared';

@Injectable()
export class TasksService {
  constructor(
    private prisma: PrismaService,
    private audit: AuditService,
  ) {}

  async create(userId: string, data: { title: string; description?: string; assignedAgentId?: string | null; parentTaskId?: string | null }, ip?: string) {
    const task = await this.prisma.task.create({
      data: { ...data, userId } as any,
      include: { assignedAgent: true },
    });
    await this.audit.log(userId, AuditAction.TASK_CREATE, { taskId: task.id, title: task.title }, ip);
    return task;
  }

  async list(userId: string, page = 1, limit = 20) {
    const [data, total] = await Promise.all([
      this.prisma.task.findMany({
        where: { userId },
        include: { assignedAgent: true, subtasks: true },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.task.count({ where: { userId } }),
    ]);
    return { data, total, page, limit };
  }

  async getById(userId: string, id: string) {
    const task = await this.prisma.task.findFirst({
      where: { id, userId },
      include: { assignedAgent: true, subtasks: { include: { assignedAgent: true } } },
    });
    if (!task) throw new NotFoundException('Task not found');
    return task;
  }

  async updateStatus(userId: string, id: string, status: string, result?: string) {
    const task = await this.prisma.task.findFirst({ where: { id, userId } });
    if (!task) throw new NotFoundException('Task not found');
    return this.prisma.task.update({
      where: { id },
      data: { status: status as any, result },
      include: { assignedAgent: true },
    });
  }

  async assign(userId: string, taskId: string, agentId: string, ip?: string) {
    const task = await this.prisma.task.findFirst({ where: { id: taskId, userId } });
    if (!task) throw new NotFoundException('Task not found');
    const updated = await this.prisma.task.update({
      where: { id: taskId },
      data: { assignedAgentId: agentId },
      include: { assignedAgent: true },
    });
    await this.audit.log(userId, AuditAction.TASK_ASSIGN, { taskId, agentId }, ip);
    return updated;
  }
}
