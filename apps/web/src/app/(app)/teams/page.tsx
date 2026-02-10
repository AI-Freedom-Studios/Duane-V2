'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

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

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
      {/* Teams Column */}
      <div className="space-y-6">
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="h-48 p-6" />
              </Card>
            ))}
          </div>
        ) : (
          teams?.map((team: any) => (
            <Card key={team.id} className="overflow-hidden">
              <CardContent className="p-8">
                {/* Team Header */}
                <div className="flex items-center justify-between mb-1">
                  <h2 className="text-2xl font-bold">{team.name}</h2>
                  <Badge
                    variant="outline"
                    className="rounded-full border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-800 dark:bg-blue-950 dark:text-blue-300 px-4 py-1 text-sm font-medium"
                  >
                    {team.agents?.length || 0} Agent{team.agents?.length !== 1 ? 's' : ''}
                  </Badge>
                </div>
                <p className="text-muted-foreground mb-6">{team.description}</p>

                {/* Agent Cards */}
                <div className="space-y-3">
                  {/* Orchestrator agents get a special gradient card */}
                  {team.agents
                    ?.filter((a: any) => a.isOrchestrator)
                    .map((agent: any) => (
                      <div
                        key={agent.id}
                        className="flex items-center gap-4 rounded-2xl bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 p-5 text-white"
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
                          className="flex items-center gap-3 rounded-xl border bg-card p-4 transition-colors hover:bg-accent/30"
                        >
                          <div
                            className={`flex h-11 w-11 items-center justify-center rounded-xl text-xl ${agentAvatarBg[agent.name] || 'bg-muted'}`}
                          >
                            {agentEmoji[agent.name] || '\uD83E\uDD16'}
                          </div>
                          <div className="min-w-0">
                            <p className="font-bold text-sm">{agent.name}</p>
                            <p className="text-xs text-muted-foreground truncate">{agent.role}</p>
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
        <Card className="sticky top-20">
          <CardContent className="p-6">
            <h2 className="text-xl font-bold">Recent Activity</h2>
            <p className="text-sm text-muted-foreground mb-6">Live agent updates</p>

            <div className="space-y-6">
              {recentActivity.map((item, i) => (
                <div key={i} className="flex items-start gap-3">
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
  );
}
