'use client';

import { useAuth } from '@/lib/auth';
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
} from 'lucide-react';
import Link from 'next/link';

const metrics = [
  { label: 'TOTAL AGENTS', value: '10', subtitle: '+2 this month', icon: Users, iconBg: 'bg-orange-500' },
  { label: 'ACTIVE NOW', value: '8', subtitle: '92% uptime', icon: Zap, iconBg: 'bg-green-500' },
  { label: 'ENGINEERING', value: '6', subtitle: '6 specialists', icon: Target, iconBg: 'bg-purple-500' },
  { label: 'CAMPAIGN TEAM', value: '3', subtitle: '3 producers', icon: TrendingUp, iconBg: 'bg-violet-500' },
];

export default function DashboardPage() {
  const { user } = useAuth();

  return (
    <div className="space-y-8">
      {/* Hero */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Welcome back, {user?.name || 'Founder'}</h1>
          <p className="mt-1 text-muted-foreground">Here&apos;s what&apos;s happening with your AI workforce today.</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" size="lg">Export Report</Button>
          <Link href="/tasks">
            <Button size="lg" className="gap-2">New Task <ArrowUpRight className="h-4 w-4" /></Button>
          </Link>
        </div>
      </div>

      {/* Metrics */}
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {metrics.map((metric) => (
          <Card key={metric.label} className="overflow-hidden">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${metric.iconBg}`}>
                  <metric.icon className="h-6 w-6 text-white" />
                </div>
                <ArrowUpRight className="h-5 w-5 text-muted-foreground/40" />
              </div>
              <div className="mt-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{metric.label}</p>
                <p className="mt-1 text-4xl font-bold">{metric.value}</p>
                <p className="mt-1 text-sm text-muted-foreground">{metric.subtitle}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Hub Cards */}
      <div className="grid gap-5 lg:grid-cols-3">
        {/* AI Video Studio */}
        <Card className="overflow-hidden border-0 bg-gradient-to-br from-violet-600 via-purple-600 to-pink-500 text-white">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/20"><Video className="h-6 w-6" /></div>
              <Sparkles className="h-6 w-6 opacity-60" />
            </div>
            <div className="mt-6">
              <h3 className="text-2xl font-bold">AI Video Studio</h3>
              <p className="mt-2 text-sm text-white/80">Create stunning videos with 600+ AI models powered by Poe.com API</p>
            </div>
            <div className="mt-4 flex flex-wrap gap-3">
              <span className="flex items-center gap-1 text-xs text-white/70"><CheckCircle2 className="h-3 w-3" /> Veo 3, Sora 2, Kling</span>
              <span className="flex items-center gap-1 text-xs text-white/70"><CheckCircle2 className="h-3 w-3" /> 8K Quality</span>
            </div>
            <Link href="/video-studio">
              <Button variant="secondary" className="mt-5 w-full bg-white text-purple-700 hover:bg-white/90 font-semibold">
                Open Video Studio <ArrowUpRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* Social Media Hub */}
        <Card className="overflow-hidden border-0 bg-gradient-to-br from-teal-500 via-cyan-500 to-emerald-400 text-white">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/20"><Share2 className="h-6 w-6" /></div>
              <svg className="h-6 w-6 opacity-60" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
              </svg>
            </div>
            <div className="mt-6">
              <h3 className="text-2xl font-bold">Social Media Hub</h3>
              <p className="mt-2 text-sm text-white/80">Connect &amp; manage Meta, YouTube, LinkedIn, TikTok, X, and more</p>
            </div>
            <div className="mt-4 flex flex-wrap gap-3">
              <span className="flex items-center gap-1 text-xs text-white/70"><CheckCircle2 className="h-3 w-3" /> OAuth 2.0</span>
              <span className="flex items-center gap-1 text-xs text-white/70"><CheckCircle2 className="h-3 w-3" /> 8+ Platforms</span>
            </div>
            <Link href="/social-media">
              <Button variant="secondary" className="mt-5 w-full bg-white text-teal-700 hover:bg-white/90 font-semibold">
                Manage Social Media <ArrowUpRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* Integrations Hub */}
        <Card className="overflow-hidden border-0 bg-gradient-to-br from-purple-600 via-violet-600 to-indigo-700 text-white">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/20"><Plug className="h-6 w-6" /></div>
              <span className="rounded-full bg-green-400 px-3 py-1 text-xs font-semibold text-green-900">12 Connected</span>
            </div>
            <div className="mt-6">
              <h3 className="text-2xl font-bold">Integrations Hub</h3>
              <p className="mt-2 text-sm text-white/80">Connect with Founder Command Center and other essential tools</p>
            </div>
            <div className="mt-4 flex flex-wrap gap-3">
              <span className="flex items-center gap-1 text-xs text-white/70"><CheckCircle2 className="h-3 w-3" /> Poe.com API</span>
              <span className="flex items-center gap-1 text-xs text-white/70"><CheckCircle2 className="h-3 w-3" /> Command Center</span>
            </div>
            <Link href="/integrations">
              <Button variant="secondary" className="mt-5 w-full bg-white text-violet-700 hover:bg-white/90 font-semibold">
                Manage Integrations <ArrowUpRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
