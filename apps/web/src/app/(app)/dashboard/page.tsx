'use client';

import { useQueries } from '@tanstack/react-query';
import { useAuth } from '@/lib/auth';
import { api } from '@/lib/api';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Video,
  Share2,
  Plug,
  Users,
  Zap,
  TrendingUp,
  ArrowUpRight,
  Target,
  Sparkles,
  CheckCircle2,
  MessageSquare,
  Activity,
  ShieldCheck,
  Workflow,
  BrainCircuit,
  ChevronRight,
  Clock3,
} from 'lucide-react';
import Link from 'next/link';

const baseMetrics = [
  {
    label: 'AI MODELS',
    value: '600+',
    subtitle: 'Via Poe.com API',
    detail: '+48 model endpoints synced this week',
    icon: Zap,
    iconBg: 'from-violet-500 to-indigo-500',
  },
  {
    label: 'TOTAL AGENTS',
    value: '10',
    subtitle: '+2 this month',
    detail: 'Executive, Engineering, Campaign',
    icon: Users,
    iconBg: 'from-amber-500 to-orange-500',
  },
  {
    label: 'ACTIVE NOW',
    value: '8',
    subtitle: '92% uptime',
    detail: '2 queued tasks about to dispatch',
    icon: Target,
    iconBg: 'from-emerald-500 to-teal-500',
  },
  {
    label: 'CAMPAIGN TEAM',
    value: '3',
    subtitle: '3 producers',
    detail: '4 launches in progress',
    icon: TrendingUp,
    iconBg: 'from-fuchsia-500 to-purple-500',
  },
];

const workstreams = [
  {
    title: 'Autonomous delivery',
    body: 'Task routing, campaign handoffs, and publishing flows are staged from one focused control layer.',
    icon: Workflow,
  },
  {
    title: 'Provider resilience',
    body: 'API keys, encrypted secrets, and fallback providers stay visible before anything breaks.',
    icon: ShieldCheck,
  },
  {
    title: 'Creative throughput',
    body: 'Chat, video, and social workspaces feel like one studio instead of disconnected tools.',
    icon: BrainCircuit,
  },
];

const hubCards = [
  {
    title: 'AI Chat',
    description: 'Draft copy, brainstorm launches, and compare models without leaving the command layer.',
    tags: ['600+ Models', 'Poe.com API'],
    href: '/ai-chat',
    cta: 'Open AI Chat',
    icon: MessageSquare,
    accent: Zap,
    tone: 'from-blue-700 via-blue-600 to-cyan-500',
    buttonTone: 'text-blue-700',
  },
  {
    title: 'AI Video Studio',
    description: 'Move from concept to cinematic generation with a faster creative pipeline and model presets.',
    tags: ['Veo 3, Sora 2, Kling', '8K Quality'],
    href: '/video-studio',
    cta: 'Open Video Studio',
    icon: Video,
    accent: Sparkles,
    tone: 'from-fuchsia-600 via-violet-600 to-indigo-600',
    buttonTone: 'text-violet-700',
  },
  {
    title: 'Social Media Hub',
    description: 'Coordinate channels, approvals, and scheduling from a single campaign rhythm board.',
    tags: ['OAuth 2.0', '8+ Platforms'],
    href: '/social-media',
    cta: 'Manage Social Media',
    icon: Share2,
    accent: Activity,
    tone: 'from-teal-600 via-cyan-500 to-emerald-400',
    buttonTone: 'text-teal-700',
  },
  {
    title: 'Integrations Hub',
    description: 'Keep command-center connections, providers, and secret health visible before teams need them.',
    tags: ['Poe.com API', 'Command Center'],
    href: '/integrations',
    cta: 'Manage Integrations',
    icon: Plug,
    badge: '12 Connected',
    accent: ShieldCheck,
    tone: 'from-indigo-700 via-violet-600 to-fuchsia-500',
    buttonTone: 'text-violet-700',
  },
];

export default function DashboardPage() {
  const { user } = useAuth();
  const [healthQuery, tasksQuery, agentsQuery, providerKeysQuery, socialAccountsQuery] = useQueries({
    queries: [
      {
        queryKey: ['dashboard-heartbeat', 'health'],
        queryFn: () => api.get<{ status: string; timestamp: string }>('/health'),
        refetchInterval: 5000,
        retry: 1,
      },
      {
        queryKey: ['dashboard-heartbeat', 'tasks'],
        queryFn: () => api.get<{ data: any[]; total: number }>('/tasks'),
        refetchInterval: 5000,
      },
      {
        queryKey: ['dashboard-heartbeat', 'agents'],
        queryFn: () => api.get<any[]>('/agents'),
        refetchInterval: 10000,
      },
      {
        queryKey: ['dashboard-heartbeat', 'provider-keys'],
        queryFn: () => api.get<any[]>('/providers/keys'),
        refetchInterval: 10000,
      },
      {
        queryKey: ['dashboard-heartbeat', 'social-accounts'],
        queryFn: () => api.get<any[]>('/social/accounts'),
        refetchInterval: 10000,
      },
    ],
  });

  const tasks = tasksQuery.data?.data || [];
  const agents = agentsQuery.data || [];
  const providerKeys = providerKeysQuery.data || [];
  const socialAccounts = socialAccountsQuery.data || [];

  const pendingTaskCount = tasks.filter((task: any) => task.status === 'PENDING').length;
  const inProgressTaskCount = tasks.filter((task: any) => task.status === 'IN_PROGRESS').length;
  const completedTaskCount = tasks.filter((task: any) => task.status === 'COMPLETED').length;
  const failedTaskCount = tasks.filter((task: any) => task.status === 'FAILED').length;
  const activeSocialAccounts = socialAccounts.filter((account: any) => account.isActive).length;
  const healthyProviderKeys = providerKeys.filter((key: any) => key.lastTestStatus === true).length;

  const heartbeatSignals = [
    healthQuery.data?.status === 'ok',
    failedTaskCount === 0,
    agents.length > 0,
    socialAccounts.length === 0 || activeSocialAccounts > 0,
    providerKeys.length === 0 || healthyProviderKeys === providerKeys.length,
  ];
  const healthySignalCount = heartbeatSignals.filter(Boolean).length;
  const heartbeatPercent = Math.round((healthySignalCount / heartbeatSignals.length) * 100);
  const heartbeatSummary =
    healthQuery.data?.status === 'ok'
      ? `${inProgressTaskCount} tasks running, ${pendingTaskCount} queued`
      : 'API unavailable';

  const pulseItems = [
    {
      label: healthQuery.data?.status === 'ok' ? 'API health endpoint responding' : 'API health endpoint unreachable',
      meta: healthQuery.data?.timestamp
        ? new Date(healthQuery.data.timestamp).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
        : 'now',
      tone: healthQuery.data?.status === 'ok' ? 'bg-emerald-500' : 'bg-rose-500',
    },
    {
      label:
        inProgressTaskCount > 0
          ? `${inProgressTaskCount} task${inProgressTaskCount === 1 ? '' : 's'} currently in progress`
          : 'No tasks currently in progress',
      meta: `${pendingTaskCount} queued`,
      tone: inProgressTaskCount > 0 ? 'bg-sky-500' : 'bg-slate-400',
    },
    {
      label:
        activeSocialAccounts > 0
          ? `${activeSocialAccounts} social account${activeSocialAccounts === 1 ? '' : 's'} connected`
          : 'No active social accounts connected',
      meta: `${healthyProviderKeys}/${providerKeys.length} provider keys healthy`,
      tone: activeSocialAccounts > 0 || healthyProviderKeys > 0 ? 'bg-violet-500' : 'bg-amber-500',
    },
  ];

  const metrics = baseMetrics.map((metric) => {
    if (metric.label === 'TOTAL AGENTS') {
      return {
        ...metric,
        value: String(agents.length || 0),
        subtitle: `${healthyProviderKeys} healthy provider key${healthyProviderKeys === 1 ? '' : 's'}`,
        detail: `${completedTaskCount} completed, ${failedTaskCount} failed task${failedTaskCount === 1 ? '' : 's'}`,
      };
    }

    if (metric.label === 'ACTIVE NOW') {
      return {
        ...metric,
        value: String(inProgressTaskCount),
        subtitle: `${heartbeatPercent}% heartbeat`,
        detail: heartbeatSummary,
      };
    }

    if (metric.label === 'CAMPAIGN TEAM') {
      return {
        ...metric,
        value: String(activeSocialAccounts),
        subtitle: `${socialAccounts.length} total connected account${socialAccounts.length === 1 ? '' : 's'}`,
        detail: `${pendingTaskCount} pending task${pendingTaskCount === 1 ? '' : 's'} waiting for action`,
      };
    }

    return metric;
  });

  const handleExportReport = () => {
    const exportedAt = new Date();
    const fileSafeDate = exportedAt.toISOString().slice(0, 10);
    const reportLines = [
      'AgentOS Dashboard Report',
      `Owner: ${user?.name || 'Founder'}`,
      `Role: ${user?.role || 'OWNER'}`,
      `Generated: ${exportedAt.toLocaleString()}`,
      '',
      'Metrics',
      ...metrics.map(
        (metric) => `- ${metric.label}: ${metric.value} | ${metric.subtitle} | ${metric.detail}`,
      ),
      '',
      'Operational Pulse',
      ...pulseItems.map((item) => `- ${item.label} (${item.meta})`),
      '',
      'Core Workspaces',
      ...hubCards.map((card) => `- ${card.title}: ${card.description}`),
    ];

    const blob = new Blob([reportLines.join('\n')], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `agentos-dashboard-report-${fileSafeDate}.txt`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-8 pb-10">
      <section className="animate-fade-up grid gap-6 xl:grid-cols-[1.6fr_0.85fr]">
        <Card className="surface-glow overflow-hidden border-white/70 bg-white/75">
          <CardContent className="relative p-0">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(59,130,246,0.16),_transparent_28%),radial-gradient(circle_at_70%_35%,_rgba(14,165,233,0.12),_transparent_24%),linear-gradient(135deg,_rgba(255,255,255,0.92),_rgba(248,250,252,0.72))]" />
            <div className="relative grid gap-8 p-7 lg:grid-cols-[1.4fr_0.9fr] lg:p-8">
              <div>
                <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-blue-200/80 bg-blue-50/80 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-blue-700">
                  <Sparkles className="h-3.5 w-3.5" />
                  Founder Command Surface
                </div>
                <h1 className="max-w-3xl text-4xl font-bold tracking-tight text-slate-950 sm:text-5xl">
                  Welcome back, {user?.name || 'Founder'}
                </h1>
                <p className="mt-4 max-w-2xl text-base leading-7 text-slate-600 sm:text-lg">
                  Your AI workforce is live, connected, and ready to move across chat, video, campaigns, and publishing from one control plane.
                </p>
                <div className="mt-8 flex flex-wrap gap-3">
                  <Button
                    size="lg"
                    className="surface-glow gap-2 rounded-2xl px-6"
                    onClick={handleExportReport}
                  >
                    Export Report
                    <ArrowUpRight className="h-4 w-4" />
                  </Button>
                  <Link href="/tasks?create=1">
                    <Button variant="outline" size="lg" className="rounded-2xl border-slate-200 bg-white/80 px-6">
                      Launch New Task
                      <ChevronRight className="ml-1 h-4 w-4" />
                    </Button>
                  </Link>
                </div>
              </div>

              <div className="grid gap-3">
                {workstreams.map((item) => (
                  <div key={item.title} className="rounded-3xl border border-white/80 bg-white/80 p-4 shadow-sm">
                    <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-950 text-white">
                      <item.icon className="h-5 w-5" />
                    </div>
                    <h2 className="text-base font-semibold text-slate-900">{item.title}</h2>
                    <p className="mt-1 text-sm leading-6 text-slate-600">{item.body}</p>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="surface-glow animate-fade-up-delay overflow-hidden border-white/70 bg-slate-950 text-white">
          <CardContent className="relative p-6">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(56,189,248,0.18),_transparent_34%),radial-gradient(circle_at_bottom_right,_rgba(16,185,129,0.14),_transparent_28%)]" />
            <div className="relative">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-sky-200/80">Live Pulse</p>
                  <h2 className="mt-2 text-2xl font-semibold">Operational heartbeat</h2>
                </div>
                <div className="rounded-2xl bg-white/10 p-3">
                  <Activity className="h-5 w-5 text-sky-200" />
                </div>
              </div>
              <div className="mt-6 rounded-3xl border border-white/10 bg-white/5 p-5">
                <p className="text-4xl font-bold">{heartbeatPercent}%</p>
                <p className="mt-2 text-sm text-slate-300">
                  {heartbeatSummary}. Live data refreshes every few seconds from the running platform.
                </p>
              </div>
              <div className="mt-5 space-y-3">
                {pulseItems.map((item) => (
                  <div key={item.label} className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                    <div className="flex items-center gap-3">
                      <span className={`h-2.5 w-2.5 rounded-full ${item.tone}`} />
                      <span className="text-sm text-slate-100">{item.label}</span>
                    </div>
                    <span className="flex items-center gap-1 text-xs text-slate-400">
                      <Clock3 className="h-3.5 w-3.5" />
                      {item.meta}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        {metrics.map((metric) => (
          <Card key={metric.label} className="surface-glow overflow-hidden border-white/70 bg-white/80 transition-transform duration-300 hover:-translate-y-1">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className={`flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br ${metric.iconBg}`}>
                  <metric.icon className="h-6 w-6 text-white" />
                </div>
                <ArrowUpRight className="h-5 w-5 text-slate-300" />
              </div>
              <div className="mt-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">{metric.label}</p>
                <p className="mt-1 text-4xl font-bold text-slate-950">{metric.value}</p>
                <p className="mt-1 text-sm font-medium text-slate-600">{metric.subtitle}</p>
                <p className="mt-3 text-sm leading-6 text-slate-500">{metric.detail}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </section>

      <section className="space-y-4">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">Core Workspaces</p>
            <h2 className="mt-2 text-3xl font-bold tracking-tight text-slate-950">Move from strategy to execution faster</h2>
          </div>
          <Link href="/directory" className="hidden text-sm font-medium text-slate-500 transition-colors hover:text-slate-900 md:inline-flex">
            Browse the full tool directory
          </Link>
        </div>

        <div className="grid gap-5 lg:grid-cols-2 2xl:grid-cols-4">
          {hubCards.map((card) => (
            <Card key={card.title} className={`surface-glow overflow-hidden border-0 bg-gradient-to-br ${card.tone} text-white`}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/18">
                    <card.icon className="h-6 w-6" />
                  </div>
                  {card.badge ? (
                    <span className="rounded-full bg-emerald-300 px-3 py-1 text-xs font-semibold text-emerald-950">{card.badge}</span>
                  ) : (
                    <card.accent className="h-5 w-5 opacity-70" />
                  )}
                </div>

                <div className="mt-7">
                  <h3 className="text-2xl font-bold">{card.title}</h3>
                  <p className="mt-3 text-sm leading-6 text-white/82">{card.description}</p>
                </div>

                <div className="mt-5 flex flex-wrap gap-3">
                  {card.tags.map((tag) => (
                    <span key={tag} className="flex items-center gap-1 text-xs text-white/78">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      {tag}
                    </span>
                  ))}
                </div>

                <Link href={card.href}>
                  <Button variant="secondary" className={`mt-6 w-full rounded-2xl bg-white font-semibold hover:bg-white/90 ${card.buttonTone}`}>
                    {card.cta}
                    <ArrowUpRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
}
