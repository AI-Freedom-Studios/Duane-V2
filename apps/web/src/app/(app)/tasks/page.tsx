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
} from 'lucide-react';
import { useState } from 'react';

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

export default function TasksPage() {
  const queryClient = useQueryClient();
  const [createOpen, setCreateOpen] = useState(false);
  const [newTask, setNewTask] = useState({ title: '', description: '' });

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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      setCreateOpen(false);
      setNewTask({ title: '', description: '' });
    },
  });

  const tasks = tasksData?.data || [];

  const pendingTasks = tasks.filter((t: any) => t.status === 'PENDING');
  const inProgressTasks = tasks.filter((t: any) => t.status === 'IN_PROGRESS');
  const completedTasks = tasks.filter((t: any) => t.status === 'COMPLETED' || t.status === 'FAILED');

  const TaskCard = ({ task }: { task: any }) => {
    const StatusIcon = statusIcons[task.status] || Clock;
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
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
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
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button>
              <Button
                onClick={() => createMutation.mutate(newTask)}
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
