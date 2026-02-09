'use client';

import { useAuth } from '@/lib/auth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Video,
  Share2,
  Puzzle,
  Users,
  TrendingUp,
  BarChart3,
  Zap,
  ArrowRight,
  Activity,
  Eye,
  MessageSquare,
  Calendar,
} from 'lucide-react';
import Link from 'next/link';

const metrics = [
  { label: 'Total Posts', value: '1,247', change: '+12%', icon: MessageSquare, color: 'text-blue-500' },
  { label: 'Engagement Rate', value: '4.8%', change: '+0.3%', icon: TrendingUp, color: 'text-green-500' },
  { label: 'Total Reach', value: '89.2K', change: '+18%', icon: Eye, color: 'text-purple-500' },
  { label: 'Active Agents', value: '10', change: '0', icon: Zap, color: 'text-orange-500' },
];

const quickActions = [
  { label: 'Video Studio', description: 'Create AI-powered videos', icon: Video, href: '/video-studio', gradient: 'from-purple-500/10 to-pink-500/10' },
  { label: 'Social Media Hub', description: 'Manage all platforms', icon: Share2, href: '/social-media', gradient: 'from-blue-500/10 to-cyan-500/10' },
  { label: 'Integrations Hub', description: 'Connect your services', icon: Puzzle, href: '/integrations', gradient: 'from-green-500/10 to-emerald-500/10' },
  { label: 'Agent Teams', description: 'Manage AI agents', icon: Users, href: '/teams', gradient: 'from-orange-500/10 to-yellow-500/10' },
];

const recentActivity = [
  { action: 'ARIA delegated task to SYNTH', time: '2 min ago', type: 'delegation' },
  { action: 'Post published to LinkedIn', time: '15 min ago', type: 'publish' },
  { action: 'New API key added for OpenAI', time: '1 hour ago', type: 'integration' },
  { action: 'PIXEL generated video brief', time: '2 hours ago', type: 'agent' },
  { action: 'Campaign "Q1 Launch" created', time: '3 hours ago', type: 'campaign' },
];

export default function DashboardPage() {
  const { user } = useAuth();

  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <div className="rounded-2xl bg-gradient-to-r from-primary/10 via-primary/5 to-transparent p-8">
        <h1 className="text-3xl font-bold">Welcome back, {user?.name || 'Founder'}</h1>
        <p className="mt-2 text-muted-foreground">
          Here&apos;s what&apos;s happening with your AI agents and campaigns today.
        </p>
      </div>

      {/* Metrics Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {metrics.map((metric) => (
          <Card key={metric.label}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <metric.icon className={`h-5 w-5 ${metric.color}`} />
                <span className="text-xs font-medium text-green-600 dark:text-green-400">{metric.change}</span>
              </div>
              <div className="mt-3">
                <p className="text-2xl font-bold">{metric.value}</p>
                <p className="text-sm text-muted-foreground">{metric.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Actions + Activity */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Quick Actions */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-lg font-semibold">Quick Actions</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {quickActions.map((action) => (
              <Link key={action.href} href={action.href}>
                <Card className="group cursor-pointer transition-all hover:shadow-md">
                  <CardContent className="p-6">
                    <div className={`mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${action.gradient}`}>
                      <action.icon className="h-6 w-6 text-foreground" />
                    </div>
                    <h3 className="font-semibold">{action.label}</h3>
                    <p className="mt-1 text-sm text-muted-foreground">{action.description}</p>
                    <div className="mt-3 flex items-center text-sm text-primary opacity-0 transition-opacity group-hover:opacity-100">
                      Open <ArrowRight className="ml-1 h-3 w-3" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Recent Activity</h2>
          <Card>
            <CardContent className="p-4">
              <div className="space-y-4">
                {recentActivity.map((item, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <div className="mt-1 h-2 w-2 rounded-full bg-primary shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm">{item.action}</p>
                      <p className="text-xs text-muted-foreground">{item.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Upcoming Scheduled */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Upcoming Scheduled Posts</h2>
        <Card>
          <CardContent className="flex items-center justify-center p-12 text-center">
            <div>
              <Calendar className="mx-auto h-10 w-10 text-muted-foreground/50" />
              <p className="mt-3 text-sm text-muted-foreground">No upcoming posts scheduled</p>
              <Link href="/post-composer">
                <Button className="mt-4" size="sm">Create a Post</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
