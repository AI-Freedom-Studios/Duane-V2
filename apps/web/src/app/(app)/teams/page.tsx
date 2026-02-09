'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Users, Bot, Shield, Cpu, Megaphone, Activity, Plus, ChevronRight } from 'lucide-react';

const teamIcons: Record<string, any> = {
  'Executive Leadership': Shield,
  'Platform Engineering': Cpu,
  'Campaign Production': Megaphone,
};

const agentColors: Record<string, string> = {
  ARIA: 'bg-violet-500/15 text-violet-700 dark:text-violet-400',
  ATLAS: 'bg-blue-500/15 text-blue-700 dark:text-blue-400',
  NEXUS: 'bg-cyan-500/15 text-cyan-700 dark:text-cyan-400',
  SYNTH: 'bg-green-500/15 text-green-700 dark:text-green-400',
  PIXEL: 'bg-pink-500/15 text-pink-700 dark:text-pink-400',
  SENTINEL: 'bg-red-500/15 text-red-700 dark:text-red-400',
  SCOUT: 'bg-amber-500/15 text-amber-700 dark:text-amber-400',
  'AG-VP': 'bg-indigo-500/15 text-indigo-700 dark:text-indigo-400',
  'AG-MANAGER': 'bg-teal-500/15 text-teal-700 dark:text-teal-400',
  'AG-ENGINEER': 'bg-orange-500/15 text-orange-700 dark:text-orange-400',
};

const recentAgentActivity = [
  { agent: 'ARIA', action: 'Delegated campaign brief to SYNTH and PIXEL', time: '5 min ago' },
  { agent: 'SYNTH', action: 'Generated 3 post drafts for LinkedIn', time: '12 min ago' },
  { agent: 'SENTINEL', action: 'Reviewed and approved campaign content', time: '25 min ago' },
  { agent: 'NEXUS', action: 'Synced Meta page analytics', time: '1 hour ago' },
  { agent: 'SCOUT', action: 'Completed competitor analysis report', time: '2 hours ago' },
  { agent: 'PIXEL', action: 'Created video brief for product launch', time: '3 hours ago' },
  { agent: 'AG-MANAGER', action: 'Updated sprint backlog priorities', time: '4 hours ago' },
  { agent: 'ATLAS', action: 'Published Q1 strategic plan', time: '5 hours ago' },
];

export default function TeamsPage() {
  const { data: teams, isLoading } = useQuery({
    queryKey: ['teams'],
    queryFn: () => api.get<any[]>('/agents/teams'),
  });

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Teams & Agents</h1>
          <p className="text-muted-foreground">Manage your AI agent teams and their assignments</p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" /> Add Agent
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Teams Column */}
        <div className="lg:col-span-2 space-y-6">
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <Card key={i} className="animate-pulse">
                  <CardContent className="h-48 p-6" />
                </Card>
              ))}
            </div>
          ) : (
            teams?.map((team: any) => {
              const TeamIcon = teamIcons[team.name] || Users;
              return (
                <Card key={team.id}>
                  <CardHeader className="pb-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                        <TeamIcon className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">{team.name}</CardTitle>
                        <p className="text-sm text-muted-foreground">{team.description}</p>
                      </div>
                      <Badge variant="secondary" className="ml-auto">
                        {team.agents?.length || 0} agents
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-3 sm:grid-cols-2">
                      {team.agents?.map((agent: any) => (
                        <div
                          key={agent.id}
                          className="flex items-center gap-3 rounded-lg border p-3 transition-colors hover:bg-accent/50"
                        >
                          <Avatar className="h-9 w-9">
                            <AvatarFallback className={agentColors[agent.name] || 'bg-muted'}>
                              {agent.name.substring(0, 2)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold">{agent.name}</p>
                            <p className="text-xs text-muted-foreground truncate">{agent.role}</p>
                          </div>
                          {agent.isOrchestrator && (
                            <Badge variant="default" className="text-[10px]">Orchestrator</Badge>
                          )}
                          <ChevronRight className="h-4 w-4 text-muted-foreground" />
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>

        {/* Activity Feed */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Activity className="h-4 w-4" /> Activity Feed
          </h2>
          <Card>
            <CardContent className="p-4">
              <div className="space-y-4">
                {recentAgentActivity.map((item, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <Avatar className="h-7 w-7 mt-0.5">
                      <AvatarFallback className={`text-[10px] ${agentColors[item.agent] || 'bg-muted'}`}>
                        {item.agent.substring(0, 2)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm">
                        <span className="font-medium">{item.agent}</span>{' '}
                        <span className="text-muted-foreground">{item.action}</span>
                      </p>
                      <p className="text-xs text-muted-foreground">{item.time}</p>
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
