'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Video,
  Share2,
  Bot,
  Zap,
  Shield,
  BarChart3,
  Puzzle,
  Megaphone,
  Brain,
  Layers,
  Lock,
  Globe,
} from 'lucide-react';

const features = [
  {
    icon: Bot,
    title: 'AI Agent Teams',
    description: 'Deploy specialized AI agents organized into teams for strategic planning, content creation, and campaign management.',
    status: 'active',
  },
  {
    icon: Video,
    title: 'Video Studio',
    description: 'Generate AI videos using multiple providers including Runway, Replicate, and Stability AI.',
    status: 'active',
  },
  {
    icon: Share2,
    title: 'Social Media Management',
    description: 'Connect and manage all your social media accounts from a single dashboard.',
    status: 'active',
  },
  {
    icon: Megaphone,
    title: 'Post Composer',
    description: 'Create, schedule, and publish content across multiple platforms simultaneously.',
    status: 'active',
  },
  {
    icon: Puzzle,
    title: 'Provider Hub',
    description: 'Plug-and-play architecture for AI providers. Add new models without code changes.',
    status: 'active',
  },
  {
    icon: Brain,
    title: 'ARIA Orchestrator',
    description: 'AI orchestration agent that intelligently delegates tasks to specialized agents.',
    status: 'active',
  },
  {
    icon: Shield,
    title: 'Enterprise Security',
    description: 'Encrypted API keys, OAuth 2.0, RBAC, and comprehensive audit logging.',
    status: 'active',
  },
  {
    icon: BarChart3,
    title: 'Analytics Dashboard',
    description: 'Track engagement, reach, and performance across all connected platforms.',
    status: 'coming_soon',
  },
  {
    icon: Layers,
    title: 'Campaign Manager',
    description: 'End-to-end campaign lifecycle management with AI-powered optimization.',
    status: 'coming_soon',
  },
  {
    icon: Globe,
    title: 'Ads Manager',
    description: 'Manage advertising campaigns across Google, Meta, LinkedIn, TikTok, and X.',
    status: 'coming_soon',
  },
  {
    icon: Lock,
    title: 'Advanced RBAC',
    description: 'Granular role-based access control with custom permission sets.',
    status: 'coming_soon',
  },
  {
    icon: Zap,
    title: 'Workflow Automation',
    description: 'Create automated workflows triggered by events, schedules, or AI decisions.',
    status: 'coming_soon',
  },
];

export default function FeaturesPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Features</h1>
        <p className="text-muted-foreground">Explore the capabilities of AgentOS</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {features.map((feature) => (
          <Card key={feature.title} className={feature.status === 'coming_soon' ? 'opacity-70' : ''}>
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <feature.icon className="h-5 w-5 text-primary" />
                </div>
                <Badge variant={feature.status === 'active' ? 'success' : 'secondary'}>
                  {feature.status === 'active' ? 'Active' : 'Coming Soon'}
                </Badge>
              </div>
              <h3 className="font-semibold">{feature.title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{feature.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
