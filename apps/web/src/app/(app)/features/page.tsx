'use client';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  BarChart3,
  Bot,
  Brain,
  Globe,
  Layers,
  Lock,
  Megaphone,
  Puzzle,
  Share2,
  Shield,
  Sparkles,
  Video,
  Zap,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

type FeatureStatus = 'active' | 'coming_soon';

type Feature = {
  icon: LucideIcon;
  title: string;
  description: string;
  status: FeatureStatus;
  category: string;
  highlight: string;
};

const features: Feature[] = [
  {
    icon: Bot,
    title: 'AI Agent Teams',
    description: 'Deploy specialized AI agents organized into teams for strategic planning, content creation, and campaign management.',
    status: 'active',
    category: 'Core workspace',
    highlight: 'Multi-agent execution',
  },
  {
    icon: Video,
    title: 'Video Studio',
    description: 'Generate AI videos using multiple providers including Runway, Replicate, and Stability AI.',
    status: 'active',
    category: 'Creative tools',
    highlight: 'Unified video generation',
  },
  {
    icon: Share2,
    title: 'Social Media Management',
    description: 'Connect and manage all your social media accounts from a single dashboard.',
    status: 'active',
    category: 'Distribution',
    highlight: 'Connected social control',
  },
  {
    icon: Megaphone,
    title: 'Post Composer',
    description: 'Create, schedule, and publish content across multiple platforms simultaneously.',
    status: 'active',
    category: 'Distribution',
    highlight: 'Cross-platform publishing',
  },
  {
    icon: Puzzle,
    title: 'Provider Hub',
    description: 'Plug-and-play architecture for AI providers. Add new models without code changes.',
    status: 'active',
    category: 'Infrastructure',
    highlight: 'Provider flexibility',
  },
  {
    icon: Brain,
    title: 'ARIA Orchestrator',
    description: 'AI orchestration agent that intelligently delegates tasks to specialized agents.',
    status: 'active',
    category: 'Core workspace',
    highlight: 'Delegation engine',
  },
  {
    icon: Shield,
    title: 'Enterprise Security',
    description: 'Encrypted API keys, OAuth 2.0, RBAC, and comprehensive audit logging.',
    status: 'active',
    category: 'Security',
    highlight: 'Operational trust layer',
  },
  {
    icon: BarChart3,
    title: 'Analytics Dashboard',
    description: 'Track engagement, reach, and performance across all connected platforms.',
    status: 'coming_soon',
    category: 'Insights',
    highlight: 'Unified reporting',
  },
  {
    icon: Layers,
    title: 'Campaign Manager',
    description: 'End-to-end campaign lifecycle management with AI-powered optimization.',
    status: 'coming_soon',
    category: 'Planning',
    highlight: 'Campaign orchestration',
  },
  {
    icon: Globe,
    title: 'Ads Manager',
    description: 'Manage advertising campaigns across Google, Meta, LinkedIn, TikTok, and X.',
    status: 'coming_soon',
    category: 'Distribution',
    highlight: 'Paid media layer',
  },
  {
    icon: Lock,
    title: 'Advanced RBAC',
    description: 'Granular role-based access control with custom permission sets.',
    status: 'coming_soon',
    category: 'Security',
    highlight: 'Permission precision',
  },
  {
    icon: Zap,
    title: 'Workflow Automation',
    description: 'Create automated workflows triggered by events, schedules, or AI decisions.',
    status: 'coming_soon',
    category: 'Automation',
    highlight: 'Event-driven operations',
  },
];

const activeFeatures = features.filter((feature) => feature.status === 'active');
const upcomingFeatures = features.filter((feature) => feature.status === 'coming_soon');
const categories = Array.from(new Set(features.map((feature) => feature.category)));

export default function FeaturesPage() {
  return (
    <div className="space-y-8 pb-6">
      <section className="surface-glow animate-fade-up relative overflow-hidden rounded-[2rem] border border-white/60 bg-slate-950 px-6 py-7 text-white shadow-2xl sm:px-8 sm:py-8">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,0.34),transparent_24%),radial-gradient(circle_at_85%_20%,rgba(20,184,166,0.3),transparent_28%),linear-gradient(135deg,rgba(15,23,42,0.98),rgba(29,78,216,0.88),rgba(15,118,110,0.82))]" />
        <div className="absolute right-0 top-0 h-52 w-52 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute bottom-0 left-1/3 h-36 w-36 rounded-full bg-cyan-300/20 blur-3xl" />

        <div className="relative z-10 grid gap-8 xl:grid-cols-[minmax(0,1.5fr)_360px]">
          <div className="space-y-6">
            <div className="flex flex-wrap items-center gap-2">
              <Badge className="border-white/10 bg-white/12 px-3 py-1 text-white backdrop-blur-sm">
                <Sparkles className="mr-1.5 h-3 w-3" />
                Product capabilities
              </Badge>
              <Badge className="border-white/10 bg-white/12 px-3 py-1 text-white backdrop-blur-sm">
                {activeFeatures.length} active
              </Badge>
              <Badge className="border-white/10 bg-white/12 px-3 py-1 text-white backdrop-blur-sm">
                {upcomingFeatures.length} upcoming
              </Badge>
            </div>

            <div className="max-w-3xl space-y-4">
              <h1 className="text-3xl font-semibold tracking-tight sm:text-5xl">See AgentOS as a connected operating layer, not a loose tool list.</h1>
              <p className="max-w-2xl text-base leading-7 text-slate-200 sm:text-lg">
                This page now shows what is already live, what is coming next, and how the platform is organized across creation, orchestration, distribution, security, and analytics.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border border-white/12 bg-white/10 p-4 backdrop-blur-sm">
                <p className="text-xs uppercase tracking-[0.22em] text-slate-300">Live modules</p>
                <p className="mt-2 text-3xl font-semibold text-white">{activeFeatures.length}</p>
                <p className="mt-1 text-sm text-slate-200">Already available across the current workspace.</p>
              </div>
              <div className="rounded-2xl border border-white/12 bg-white/10 p-4 backdrop-blur-sm">
                <p className="text-xs uppercase tracking-[0.22em] text-slate-300">Roadmap modules</p>
                <p className="mt-2 text-3xl font-semibold text-white">{upcomingFeatures.length}</p>
                <p className="mt-1 text-sm text-slate-200">Queued for rollout as the platform deepens.</p>
              </div>
              <div className="rounded-2xl border border-white/12 bg-white/10 p-4 backdrop-blur-sm">
                <p className="text-xs uppercase tracking-[0.22em] text-slate-300">Capability groups</p>
                <p className="mt-2 text-3xl font-semibold text-white">{categories.length}</p>
                <p className="mt-1 text-sm text-slate-200">Structured around the full operating workflow.</p>
              </div>
            </div>
          </div>

          <div className="rounded-[1.75rem] border border-white/12 bg-white/10 p-5 backdrop-blur-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-100">Release posture</p>
                <p className="text-xs text-slate-300">A quick view of what this platform already covers.</p>
              </div>
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/12">
                <Zap className="h-5 w-5 text-cyan-200" />
              </div>
            </div>

            <div className="mt-5 space-y-3">
              {[
                'Creation and publishing workflows are already active.',
                'Security and provider infrastructure are already in place.',
                'Analytics, ads, and advanced permissions are staged next.',
              ].map((item, index) => (
                <div key={item} className="flex items-start gap-3 rounded-[1.35rem] border border-white/12 bg-white/8 px-4 py-3">
                  <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white/14 text-xs font-semibold">
                    {index + 1}
                  </div>
                  <p className="text-sm leading-6 text-slate-100">{item}</p>
                </div>
              ))}

              <div className="rounded-[1.35rem] border border-white/12 bg-black/15 p-4">
                <p className="text-xs uppercase tracking-[0.22em] text-slate-300">Best interpretation</p>
                <p className="mt-2 text-sm leading-6 text-slate-100">
                  Think of Features as the platform map: what users can already do today and where the next expansion areas are headed.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-slate-950">Active now</h2>
            <p className="text-sm text-slate-500">Capabilities already available in the current workspace.</p>
          </div>
          <Badge className="border-0 bg-emerald-100 text-emerald-700">{activeFeatures.length} live</Badge>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {activeFeatures.map((feature) => (
            <Card key={feature.title} className="surface-glow overflow-hidden border-white/70 bg-white/92 shadow-lg">
              <CardContent className="space-y-4 p-6">
                <div className="flex items-start justify-between">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,#0f172a,#2563eb,#14b8a6)] text-white">
                    <feature.icon className="h-5 w-5" />
                  </div>
                  <Badge className="border-0 bg-emerald-100 text-emerald-700">Active</Badge>
                </div>
                <div className="space-y-2">
                  <Badge variant="outline" className="rounded-full border-slate-300 bg-slate-50 text-[10px] uppercase tracking-[0.18em] text-slate-500">
                    {feature.category}
                  </Badge>
                  <h3 className="text-xl font-semibold text-slate-950">{feature.title}</h3>
                  <p className="text-sm leading-6 text-slate-600">{feature.description}</p>
                </div>
                <div className="rounded-2xl bg-slate-50 px-4 py-3 text-sm font-medium text-slate-700">{feature.highlight}</div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-slate-950">Coming soon</h2>
            <p className="text-sm text-slate-500">Expansion areas already framed into the roadmap.</p>
          </div>
          <Badge variant="outline" className="rounded-full border-slate-300 bg-white text-slate-600">
            {upcomingFeatures.length} planned
          </Badge>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {upcomingFeatures.map((feature) => (
            <Card key={feature.title} className="overflow-hidden border-slate-200 bg-white/85">
              <CardContent className="space-y-4 p-6">
                <div className="flex items-start justify-between">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-500">
                    <feature.icon className="h-5 w-5" />
                  </div>
                  <Badge variant="secondary" className="bg-slate-100 text-slate-600">
                    Coming Soon
                  </Badge>
                </div>
                <div className="space-y-2">
                  <Badge variant="outline" className="rounded-full border-slate-300 bg-slate-50 text-[10px] uppercase tracking-[0.18em] text-slate-500">
                    {feature.category}
                  </Badge>
                  <h3 className="text-xl font-semibold text-slate-800">{feature.title}</h3>
                  <p className="text-sm leading-6 text-slate-500">{feature.description}</p>
                </div>
                <div className="rounded-2xl bg-slate-50 px-4 py-3 text-sm font-medium text-slate-600">{feature.highlight}</div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
}
