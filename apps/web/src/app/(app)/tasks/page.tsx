'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  ListTodo,
  Plus,
  Clock,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Bot,
  ArrowRight,
  Check,
} from 'lucide-react';
import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

const statusIcons: Record<string, any> = {
  PENDING: Clock,
  IN_PROGRESS: Loader2,
  COMPLETED: CheckCircle2,
  FAILED: AlertCircle,
};

const statusColors: Record<string, string> = {
  PENDING: 'secondary',
  IN_PROGRESS: 'default',
  COMPLETED: 'success',
  FAILED: 'destructive',
};

function TasksContent() {
  const queryClient = useQueryClient();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [createOpen, setCreateOpen] = useState(false);
  const [newTask, setNewTask] = useState({ title: '', description: '', assignedAgentId: '' });
  const [createError, setCreateError] = useState('');

  useEffect(() => {
    if (searchParams.get('create') === '1') {
      setCreateOpen(true);
    }
  }, [searchParams]);

  const { data: tasksData, isLoading } = useQuery({
    queryKey: ['tasks'],
    queryFn: () => api.get<any>('/tasks'),
  });

  const { data: agents } = useQuery({
    queryKey: ['agents'],
    queryFn: () => api.get<any[]>('/agents'),
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => api.post('/tasks', data),
    onSuccess: (createdTask: any) => {
      queryClient.setQueryData(['tasks'], (current: any) => {
        if (!current?.data) {
          return { data: [createdTask], total: 1, page: 1, limit: 20 };
        }

        return {
          ...current,
          data: [createdTask, ...current.data],
          total: (current.total || current.data.length || 0) + 1,
        };
      });
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      setCreateOpen(false);
      setNewTask({ title: '', description: '', assignedAgentId: '' });
      setCreateError('');
      router.replace('/tasks');
    },
    onError: (error: Error) => {
      setCreateError(error.message || 'Failed to create task');
    },
  });

  const assignMutation = useMutation({
    mutationFn: ({ taskId, agentId }: { taskId: string; agentId: string }) =>
      api.put(`/tasks/${taskId}/assign`, { agentId }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tasks'] }),
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ taskId, status }: { taskId: string; status: string }) =>
      api.put(`/tasks/${taskId}/status`, { status }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tasks'] }),
  });

  const handleCreateOpenChange = (open: boolean) => {
    setCreateOpen(open);
    if (!open) {
      setCreateError('');
    }
    if (!open && searchParams.get('create') === '1') {
      router.replace('/tasks');
    }
  };

  const tasks = tasksData?.data || [];

  const pendingTasks = tasks.filter((t: any) => t.status === 'PENDING');
  const inProgressTasks = tasks.filter((t: any) => t.status === 'IN_PROGRESS');
  const completedTasks = tasks.filter((t: any) => t.status === 'COMPLETED' || t.status === 'FAILED');

  const activeAgents = agents || [];

  const handleCreateTask = () => {
    if (!newTask.title.trim()) {
      setCreateError('Title is required');
      return;
    }

    setCreateError('');
    createMutation.mutate({
      title: newTask.title.trim(),
      description: newTask.description.trim(),
      assignedAgentId: newTask.assignedAgentId || null,
    });
  };

  const TaskCard = ({ task }: { task: any }) => {
    const StatusIcon = statusIcons[task.status] || Clock;
    const nextStatus =
      task.status === 'PENDING'
        ? 'IN_PROGRESS'
        : task.status === 'IN_PROGRESS'
          ? 'COMPLETED'
          : null;
    const nextStatusLabel =
      task.status === 'PENDING'
        ? 'Start Task'
        : task.status === 'IN_PROGRESS'
          ? 'Mark Complete'
          : null;

    return (
      <div className="rounded-lg border p-4 transition-colors hover:bg-accent/30">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <p className="font-medium text-sm">{task.title}</p>
            {task.description && (
              <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{task.description}</p>
            )}
          </div>
          <Badge variant={statusColors[task.status] as any} className="text-[10px] shrink-0">
            <StatusIcon className={`mr-1 h-3 w-3 ${task.status === 'IN_PROGRESS' ? 'animate-spin' : ''}`} />
            {task.status}
          </Badge>
        </div>
        {task.assignedAgent && (
          <div className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
            <Bot className="h-3 w-3" />
            Assigned to {task.assignedAgent.name}
          </div>
        )}
        <p className="mt-1 text-[10px] text-muted-foreground">
          {new Date(task.createdAt).toLocaleString()}
        </p>

        <div className="mt-3 space-y-2">
          <div className="space-y-1">
            <Label className="text-[11px] text-muted-foreground">Assigned Agent</Label>
            <select
              className="flex h-9 w-full rounded-md border border-input bg-background px-3 text-xs"
              value={task.assignedAgent?.id || '__unassigned__'}
              onChange={(e) => {
                if (e.target.value === '__unassigned__') return;
                assignMutation.mutate({
                  taskId: task.id,
                  agentId: e.target.value,
                });
              }}
              disabled={assignMutation.isPending}
            >
              <option value="__unassigned__">Unassigned</option>
              {activeAgents.map((agent: any) => (
                <option key={agent.id} value={agent.id}>
                  {agent.name} - {agent.role}
                </option>
              ))}
            </select>
          </div>

          {nextStatus ? (
            <Button
              size="sm"
              variant="outline"
              className="w-full"
              onClick={() => updateStatusMutation.mutate({ taskId: task.id, status: nextStatus })}
              disabled={updateStatusMutation.isPending}
            >
              {updateStatusMutation.isPending ? (
                <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
              ) : nextStatus === 'COMPLETED' ? (
                <Check className="mr-2 h-3.5 w-3.5" />
              ) : (
                <ArrowRight className="mr-2 h-3.5 w-3.5" />
              )}
              {nextStatusLabel}
            </Button>
          ) : null}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Tasks</h1>
          <p className="text-muted-foreground">Manage and track agent tasks</p>
        </div>
        <Dialog open={createOpen} onOpenChange={handleCreateOpenChange}>
          <DialogTrigger asChild>
            <Button><Plus className="mr-2 h-4 w-4" /> New Task</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Task</DialogTitle>
              <DialogDescription>Create a new task and optionally assign it to an agent.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Title</Label>
                <Input
                  placeholder="Task title"
                  value={newTask.title}
                  onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea
                  placeholder="Describe the task..."
                  value={newTask.description}
                  onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Assign to Agent (optional)</Label>
                <select
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={newTask.assignedAgentId}
                  onChange={(e) => setNewTask({ ...newTask, assignedAgentId: e.target.value })}
                >
                  <option value="">Unassigned</option>
                  {activeAgents.map((agent: any) => (
                    <option key={agent.id} value={agent.id}>
                      {agent.name} - {agent.role}
                    </option>
                  ))}
                </select>
              </div>
              {createError ? (
                <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                  {createError}
                </div>
              ) : null}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button>
              <Button
                onClick={handleCreateTask}
                disabled={!newTask.title || createMutation.isPending}
              >
                {createMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Create Task
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Kanban-style columns */}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-yellow-500" />
            <h3 className="font-semibold text-sm">Pending</h3>
            <Badge variant="secondary" className="text-[10px]">{pendingTasks.length}</Badge>
          </div>
          <div className="space-y-2">
            {pendingTasks.map((task: any) => <TaskCard key={task.id} task={task} />)}
            {pendingTasks.length === 0 && (
              <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
                No pending tasks
              </div>
            )}
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-blue-500" />
            <h3 className="font-semibold text-sm">In Progress</h3>
            <Badge variant="secondary" className="text-[10px]">{inProgressTasks.length}</Badge>
          </div>
          <div className="space-y-2">
            {inProgressTasks.map((task: any) => <TaskCard key={task.id} task={task} />)}
            {inProgressTasks.length === 0 && (
              <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
                No tasks in progress
              </div>
            )}
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-green-500" />
            <h3 className="font-semibold text-sm">Completed</h3>
            <Badge variant="secondary" className="text-[10px]">{completedTasks.length}</Badge>
          </div>
          <div className="space-y-2">
            {completedTasks.map((task: any) => <TaskCard key={task.id} task={task} />)}
            {completedTasks.length === 0 && (
              <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
                No completed tasks
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function TasksPage() {
  return (
    <Suspense fallback={null}>
      <TasksContent />
    </Suspense>
  );
}
