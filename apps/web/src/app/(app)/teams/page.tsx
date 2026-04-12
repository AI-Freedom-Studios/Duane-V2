'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Sparkles, Users, Zap } from 'lucide-react';

/* Agent emoji/icon mapping per Figma */
const agentEmoji: Record<string, string> = {
  ARIA: '\uD83E\uDDE0',
  ATLAS: '\uD83D\uDD39',
  NEXUS: '\u26A1',
  SYNTH: '\uD83D\uDE80',
  PIXEL: '\uD83C\uDFA8',
  SENTINEL: '\uD83D\uDEE1\uFE0F',
  SCOUT: '\uD83D\uDD0D',
  'AG-VP': '\uD83C\uDFAF',
  'AG-MANAGER': '\u2699\uFE0F',
  'AG-ENGINEER': '\uD83E\uDD16',
};

const agentAvatarBg: Record<string, string> = {
  ARIA: 'bg-pink-100 dark:bg-pink-900/30',
  ATLAS: 'bg-blue-100 dark:bg-blue-900/30',
  NEXUS: 'bg-orange-100 dark:bg-orange-900/30',
  SYNTH: 'bg-purple-100 dark:bg-purple-900/30',
  PIXEL: 'bg-pink-100 dark:bg-pink-900/30',
  SENTINEL: 'bg-sky-100 dark:bg-sky-900/30',
  SCOUT: 'bg-cyan-100 dark:bg-cyan-900/30',
  'AG-VP': 'bg-rose-100 dark:bg-rose-900/30',
  'AG-MANAGER': 'bg-gray-100 dark:bg-gray-800/50',
  'AG-ENGINEER': 'bg-slate-100 dark:bg-slate-800/50',
};

const activityNameColors: Record<string, string> = {
  ATLAS: 'text-blue-600 dark:text-blue-400',
  PIXEL: 'text-pink-600 dark:text-pink-400',
  SENTINEL: 'text-sky-600 dark:text-sky-400',
  'AG-ENGINEER': 'text-slate-600 dark:text-slate-400',
  NEXUS: 'text-orange-600 dark:text-orange-400',
  SYNTH: 'text-purple-600 dark:text-purple-400',
  ARIA: 'text-violet-600 dark:text-violet-400',
  SCOUT: 'text-cyan-600 dark:text-cyan-400',
  'AG-VP': 'text-rose-600 dark:text-rose-400',
  'AG-MANAGER': 'text-gray-600 dark:text-gray-400',
};

const recentActivity = [
  { agent: 'ATLAS', action: 'Completed architecture review', time: '5 min ago' },
  { agent: 'PIXEL', action: 'Deployed UI components', time: '12 min ago' },
  { agent: 'SENTINEL', action: 'Security scan in progress', time: '18 min ago' },
  { agent: 'AG-ENGINEER', action: 'Generated campaign assets', time: '25 min ago' },
  { agent: 'NEXUS', action: 'Pipeline optimization complete', time: '32 min ago' },
  { agent: 'SYNTH', action: 'Model training completed', time: '45 min ago' },
];

export default function TeamsPage() {
  const { data: teams, isLoading } = useQuery({
    queryKey: ['teams'],
    queryFn: () => api.get<any[]>('/agents/teams'),
  });

  const totalTeams = teams?.length || 0;
  const totalAgents = teams?.reduce((sum: number, team: any) => sum + (team.agents?.length || 0), 0) || 0;
  const orchestratorCount =
    teams?.reduce(
      (sum: number, team: any) => sum + (team.agents?.filter((agent: any) => agent.isOrchestrator).length || 0),
      0,
    ) || 0;

  return (
    <div className="space-y-8 pb-6">
      <section className="surface-glow animate-fade-up relative overflow-hidden rounded-[2rem] border border-white/60 bg-slate-950 px-6 py-7 text-white shadow-2xl sm:px-8 sm:py-8">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,0.34),transparent_24%),radial-gradient(circle_at_85%_20%,rgba(168,85,247,0.3),transparent_28%),linear-gradient(135deg,rgba(15,23,42,0.98),rgba(29,78,216,0.88),rgba(124,58,237,0.82))]" />
        <div className="absolute right-0 top-0 h-52 w-52 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute bottom-0 left-1/3 h-36 w-36 rounded-full bg-cyan-300/20 blur-3xl" />

        <div className="relative z-10 grid gap-8 xl:grid-cols-[minmax(0,1.5fr)_360px]">
          <div className="space-y-6">
            <div className="flex flex-wrap items-center gap-2">
              <Badge className="border-white/10 bg-white/12 px-3 py-1 text-white backdrop-blur-sm">
                <Sparkles className="mr-1.5 h-3 w-3" />
                Agent organization map
              </Badge>
              <Badge className="border-white/10 bg-white/12 px-3 py-1 text-white backdrop-blur-sm">
                {totalTeams} team{totalTeams === 1 ? '' : 's'}
              </Badge>
            </div>

            <div className="max-w-3xl space-y-4">
              <h1 className="text-3xl font-semibold tracking-tight sm:text-5xl">See how AgentOS organizes specialists into execution teams.</h1>
              <p className="max-w-2xl text-base leading-7 text-slate-200 sm:text-lg">
                Leadership, engineering, and specialist agents are grouped here so you can understand who is orchestrating, who is executing, and what the system is doing right now.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border border-white/12 bg-white/10 p-4 backdrop-blur-sm">
                <p className="text-xs uppercase tracking-[0.22em] text-slate-300">Teams</p>
                <p className="mt-2 text-3xl font-semibold text-white">{totalTeams}</p>
                <p className="mt-1 text-sm text-slate-200">Functional groups coordinating platform work.</p>
              </div>
              <div className="rounded-2xl border border-white/12 bg-white/10 p-4 backdrop-blur-sm">
                <p className="text-xs uppercase tracking-[0.22em] text-slate-300">Agents</p>
                <p className="mt-2 text-3xl font-semibold text-white">{totalAgents}</p>
                <p className="mt-1 text-sm text-slate-200">Named specialists currently mapped into teams.</p>
              </div>
              <div className="rounded-2xl border border-white/12 bg-white/10 p-4 backdrop-blur-sm">
                <p className="text-xs uppercase tracking-[0.22em] text-slate-300">Orchestrators</p>
                <p className="mt-2 text-3xl font-semibold text-white">{orchestratorCount}</p>
                <p className="mt-1 text-sm text-slate-200">Leadership agents handling coordination and routing.</p>
              </div>
            </div>
          </div>

          <div className="rounded-[1.75rem] border border-white/12 bg-white/10 p-5 backdrop-blur-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-100">Operating posture</p>
                <p className="text-xs text-slate-300">A quick read on how the org is structured.</p>
              </div>
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/12">
                <Users className="h-5 w-5 text-cyan-200" />
              </div>
            </div>

            <div className="mt-5 space-y-3">
              {[
                'Executive orchestrators define priorities and route work into teams.',
                'Engineering and specialist agents carry execution across infrastructure, UI, security, and campaigns.',
                'Recent activity gives a live narrative of what the system is doing right now.',
              ].map((item, index) => (
                <div key={item} className="flex items-start gap-3 rounded-[1.35rem] border border-white/12 bg-white/8 px-4 py-3">
                  <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white/14 text-xs font-semibold">
                    {index + 1}
                  </div>
                  <p className="text-sm leading-6 text-slate-100">{item}</p>
                </div>
              ))}

              <div className="rounded-[1.35rem] border border-white/12 bg-black/15 p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-slate-300">What this page is for</p>
                <p className="mt-2 text-sm leading-6 text-slate-100">
                  Teams is the organization view for your AI workforce, showing structure and live momentum in the same place.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
      {/* Teams Column */}
      <div className="space-y-6">
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="animate-pulse overflow-hidden border-white/70 bg-white/92">
                <CardContent className="h-48 p-6" />
              </Card>
            ))}
          </div>
        ) : (
          teams?.map((team: any) => (
            <Card key={team.id} className="surface-glow overflow-hidden border-white/70 bg-white/92 shadow-lg">
              <CardContent className="p-8">
                {/* Team Header */}
                <div className="mb-6 flex items-start justify-between gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="rounded-full border-slate-300 bg-slate-50 text-[10px] uppercase tracking-[0.18em] text-slate-500">
                        Team cluster
                      </Badge>
                    </div>
                    <h2 className="text-3xl font-semibold tracking-tight text-slate-950">{team.name}</h2>
                    <p className="max-w-2xl text-base text-slate-500">{team.description}</p>
                  </div>
                  <Badge
                    variant="outline"
                    className="rounded-full border-blue-200 bg-blue-50 px-4 py-1 text-sm font-medium text-blue-700 dark:border-blue-800 dark:bg-blue-950 dark:text-blue-300"
                  >
                    {team.agents?.length || 0} Agent{team.agents?.length !== 1 ? 's' : ''}
                  </Badge>
                </div>

                {/* Agent Cards */}
                <div className="space-y-3">
                  {/* Orchestrator agents get a special gradient card */}
                  {team.agents
                    ?.filter((a: any) => a.isOrchestrator)
                    .map((agent: any) => (
                      <div
                        key={agent.id}
                        className="flex items-center gap-4 rounded-[1.6rem] bg-[linear-gradient(135deg,#2563eb,#4f46e5,#9333ea)] p-5 text-white shadow-lg"
                      >
                        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/20 text-2xl">
                          {agentEmoji[agent.name] || '\uD83E\uDD16'}
                        </div>
                        <div className="flex-1">
                          <p className="text-lg font-bold">{agent.name}</p>
                          <p className="text-sm text-white/80">{agent.role}</p>
                        </div>
                        <Badge className="rounded-full bg-white/20 text-white border-0 gap-1.5">
                          <span className="h-2 w-2 rounded-full bg-green-400" />
                          Active
                        </Badge>
                      </div>
                    ))}

                  {/* Non-orchestrator agents in 2-column grid */}
                  <div className="grid gap-3 sm:grid-cols-2">
                    {team.agents
                      ?.filter((a: any) => !a.isOrchestrator)
                      .map((agent: any) => (
                        <div
                          key={agent.id}
                          className="flex items-center gap-3 rounded-[1.25rem] border border-slate-200 bg-slate-50/80 p-4 transition hover:-translate-y-0.5 hover:bg-white"
                        >
                          <div
                            className={`flex h-11 w-11 items-center justify-center rounded-xl text-xl ${agentAvatarBg[agent.name] || 'bg-muted'}`}
                          >
                            {agentEmoji[agent.name] || '\uD83E\uDD16'}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="font-bold text-sm text-slate-900">{agent.name}</p>
                            <p className="text-xs text-muted-foreground truncate">{agent.role}</p>
                          </div>
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-slate-400">
                            <Zap className="h-3.5 w-3.5" />
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Activity Feed */}
      <div>
        <Card className="sticky top-20 overflow-hidden border-white/70 bg-white/92 shadow-lg">
          <CardHeader className="border-b border-slate-100">
            <CardTitle className="text-2xl">Recent Activity</CardTitle>
            <CardDescription>Live agent updates</CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <div className="mb-5 rounded-[1.4rem] bg-slate-50 px-4 py-4">
              <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Activity rail</p>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                This stream shows what agents have recently completed, deployed, or started across the org.
              </p>
            </div>

            <div className="space-y-6">
              {recentActivity.map((item, i) => (
                <div key={i} className="flex items-start gap-3 rounded-[1.2rem] border border-slate-200 bg-slate-50/80 p-3">
                  <div
                    className={`flex h-9 w-9 items-center justify-center rounded-xl text-base shrink-0 ${agentAvatarBg[item.agent] || 'bg-muted'}`}
                  >
                    {agentEmoji[item.agent] || '\uD83E\uDD16'}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm">
                      <span className={`font-bold ${activityNameColors[item.agent] || ''}`}>
                        {item.agent}
                      </span>
                      <span className="ml-1.5 inline-block h-2 w-2 rounded-full bg-green-400" />
                    </p>
                    <p className="text-sm text-muted-foreground">{item.action}</p>
                    <p className="text-xs text-muted-foreground/70 mt-0.5">{item.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
      </div>
    </div>
  );
}
