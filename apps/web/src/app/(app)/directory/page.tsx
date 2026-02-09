'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Bot, Search } from 'lucide-react';
import { useState } from 'react';

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

export default function DirectoryPage() {
  const [search, setSearch] = useState('');

  const { data: agents, isLoading } = useQuery({
    queryKey: ['agents'],
    queryFn: () => api.get<any[]>('/agents'),
  });

  const filtered = agents?.filter(
    (a: any) =>
      a.name.toLowerCase().includes(search.toLowerCase()) ||
      a.role.toLowerCase().includes(search.toLowerCase()) ||
      a.description.toLowerCase().includes(search.toLowerCase()),
  ) || [];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Agent Directory</h1>
        <p className="text-muted-foreground">Browse all AI agents and their capabilities</p>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search agents by name, role, or description..."
          className="pl-9"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((agent: any) => (
          <Card key={agent.id} className="transition-all hover:shadow-md">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <Avatar className="h-12 w-12">
                  <AvatarFallback className={`text-sm font-bold ${agentColors[agent.name] || 'bg-muted'}`}>
                    {agent.name.substring(0, 2)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-bold">{agent.name}</p>
                  <p className="text-sm text-muted-foreground">{agent.role}</p>
                </div>
                {agent.isOrchestrator && (
                  <Badge className="ml-auto">Orchestrator</Badge>
                )}
              </div>
              <p className="text-sm text-muted-foreground">{agent.description}</p>
              {agent.tools && agent.tools.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1">
                  {agent.tools.map((tool: string) => (
                    <Badge key={tool} variant="outline" className="text-[10px]">{tool}</Badge>
                  ))}
                </div>
              )}
              {agent.team && (
                <div className="mt-3 flex items-center gap-1 text-xs text-muted-foreground">
                  <Bot className="h-3 w-3" /> {agent.team.name}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {filtered.length === 0 && !isLoading && (
        <div className="rounded-lg border border-dashed p-12 text-center">
          <Bot className="mx-auto h-10 w-10 text-muted-foreground/30" />
          <p className="mt-3 text-muted-foreground">No agents found matching your search</p>
        </div>
      )}
    </div>
  );
}
