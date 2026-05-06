'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { useState } from 'react';
import { api } from '@/lib/api';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  ArrowUpRight,
  BarChart3,
  Calendar,
  CheckCircle2,
  Eye,
  Globe,
  Heart,
  Loader2,
  MessageSquare,
  Plus,
  Share2,
  Sparkles,
  TrendingUp,
  Unlink,
  Users,
  Zap,
} from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

const platformStats = [
  { id: 'linkedin', platform: 'LinkedIn', followers: '12.4K', engagement: '4.2%', posts: 156, focus: 'Thought leadership', brandColor: 'bg-[#2563eb]', logo: 'linkedin' },
  { id: 'meta', platform: 'Meta', followers: '34.7K', engagement: '3.8%', posts: 312, focus: 'Community campaigns', brandColor: 'bg-[#3b82f6]', logo: 'meta' },
  { id: 'youtube', platform: 'YouTube', followers: '8.2K', engagement: '5.1%', posts: 48, focus: 'Long-form product stories', brandColor: 'bg-[#ef4444]', logo: 'youtube' },
  { id: 'x', platform: 'X', followers: '21.3K', engagement: '2.9%', posts: 524, focus: 'Fast commentary', brandColor: 'bg-[#0f172a]', logo: 'x' },
  { id: 'tiktok', platform: 'TikTok', followers: '15.6K', engagement: '7.2%', posts: 89, focus: 'Short-form reach', brandColor: 'bg-black', logo: 'tiktok' },
];

type SocialAccount = {
  id: string;
  platform: string;
  platformAccountId: string;
  accountName: string;
  accountAvatar?: string | null;
  isActive: boolean;
  lastSyncAt?: string | null;
  createdAt?: string;
};

type PlatformMetrics = {
  platform: string;
  connected: boolean;
  followers: number | null;
  posts: number | null;
  views: number | null;
  engagementRate: number | null;
  lastSyncedAt: string | null;
};

type PostRecord = {
  id: string;
  content: string;
  status: string;
  createdAt: string;
  publishedAt?: string | null;
  scheduledAt?: string | null;
  targets?: Array<{
    platform?: string;
    accountName?: string;
    status?: string;
  }>;
};

type SocialFeedItem = {
  id: string;
  platform: string;
  title: string;
  publishedAt: string | null;
  views: number | null;
  likes: number | null;
  comments: number | null;
  url: string | null;
};

const formatCompactNumber = (value: number | null | undefined) => {
  if (value === null || value === undefined || Number.isNaN(value)) return '--';
  return new Intl.NumberFormat('en', {
    notation: 'compact',
    maximumFractionDigits: value >= 10000 ? 1 : 0,
  }).format(value);
};

const formatRelativeTime = (value: string | null | undefined) => {
  if (!value) return 'Just now';
  const date = new Date(value);
  const diffMs = Date.now() - date.getTime();
  if (!Number.isFinite(diffMs)) return 'Just now';
  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`;
  const days = Math.floor(hours / 24);
  return `${days} day${days === 1 ? '' : 's'} ago`;
};

function PlatformLogo({ platform }: { platform: string }) {
  if (platform === 'linkedin') {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4 fill-current">
        <path d="M6.94 8.5H3.56V20h3.38V8.5ZM5.25 3A2.06 2.06 0 1 0 5.3 7.12 2.06 2.06 0 0 0 5.25 3ZM20.44 13.1c0-3.47-1.85-5.08-4.31-5.08-1.99 0-2.88 1.1-3.38 1.87V8.5H9.37c.04.92 0 11.5 0 11.5h3.38v-6.42c0-.34.02-.68.12-.92.27-.68.88-1.38 1.9-1.38 1.35 0 1.88 1.03 1.88 2.54V20H20V13.1h.44Z" />
      </svg>
    );
  }

  if (platform === 'meta') {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4 fill-none stroke-current stroke-[1.9]">
        <path d="M4 15.5c0-4.8 2.22-8 4.92-8 3.27 0 4.06 3.38 5.08 5.61.69 1.51 1.28 2.39 2.34 2.39 1.34 0 2.66-1.63 3.66-4.89" />
        <path d="M20 8.5c0 4.8-2.22 8-4.92 8-3.27 0-4.06-3.38-5.08-5.61-.69-1.51-1.28-2.39-2.34-2.39-1.34 0-2.66 1.63-3.66 4.89" />
      </svg>
    );
  }

  if (platform === 'youtube') {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4 fill-current">
        <path d="M21.58 7.19a2.78 2.78 0 0 0-1.95-1.97C17.9 4.75 12 4.75 12 4.75s-5.9 0-7.63.47A2.78 2.78 0 0 0 2.42 7.2 29.4 29.4 0 0 0 2 12a29.4 29.4 0 0 0 .42 4.81 2.78 2.78 0 0 0 1.95 1.97c1.73.47 7.63.47 7.63.47s5.9 0 7.63-.47a2.78 2.78 0 0 0 1.95-1.97A29.4 29.4 0 0 0 22 12a29.4 29.4 0 0 0-.42-4.81ZM10 15.5v-7l6 3.5-6 3.5Z" />
      </svg>
    );
  }

  if (platform === 'x') {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4 fill-current">
        <path d="M18.9 3H21l-6.87 7.86L22.2 21h-6.32l-4.95-6.47L5.26 21H3.15l7.35-8.4L2.8 3h6.48l4.47 5.92L18.9 3Zm-1.11 16.1h1.17L8.65 4.84H7.39L17.79 19.1Z" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4 fill-current">
      <path d="M14.75 3h-5.6A6.15 6.15 0 0 0 3 9.15v5.7A6.15 6.15 0 0 0 9.15 21h5.7A6.15 6.15 0 0 0 21 14.85v-5.7A6.15 6.15 0 0 0 14.85 3h-.1Zm-.48 7.32c.92.58 1.97.95 3.08 1.03v2.33a7.4 7.4 0 0 1-2.87-.8v2.58a4.12 4.12 0 1 1-4.12-4.12c.31 0 .6.04.9.1v2.28a1.86 1.86 0 1 0 1.36 1.8V3.96h2.15c.2 1 .78 1.87 1.65 2.36Z" />
    </svg>
  );
}

export default function SocialMediaPage() {
  const queryClient = useQueryClient();
  const [disconnectingId, setDisconnectingId] = useState<string | null>(null);

  const { data: accounts, isLoading: accountsLoading } = useQuery({
    queryKey: ['social-accounts'],
    queryFn: () => api.get<SocialAccount[]>('/social/accounts'),
  });

  const { data: metrics } = useQuery({
    queryKey: ['social-metrics'],
    queryFn: () => api.get<Record<string, PlatformMetrics>>('/social/metrics'),
  });

  const { data: postsData } = useQuery({
    queryKey: ['social-posts-summary'],
    queryFn: () => api.get<{ data: PostRecord[]; total: number }>('/posts?limit=100'),
  });

  const { data: socialFeed } = useQuery({
    queryKey: ['social-feed'],
    queryFn: () => api.get<SocialFeedItem[]>('/social/feed'),
  });

  const activeAccounts = accounts?.filter((account: any) => account.isActive) || [];
  const workspacePosts = postsData?.data || [];
  const connectedPlatforms = new Set(activeAccounts.map((account) => account.platform)).size;
  const connectedCount = connectedPlatforms;
  const metricsList = Object.values(metrics || {});
  const totalFollowers = metricsList.reduce((sum, metric) => sum + (metric.followers || 0), 0);
  const totalViews = metricsList.reduce((sum, metric) => sum + (metric.views || 0), 0);
  const publishedWorkspacePosts = workspacePosts.filter((post) => post.status === 'PUBLISHED');
  const publishedPosts = publishedWorkspacePosts.length;
  const scheduledPosts = workspacePosts.filter((post) => post.status === 'SCHEDULED').length;
  const failedPosts = workspacePosts.filter((post) => post.status === 'FAILED').length;
  const totalFeedLikes = (socialFeed || []).reduce((sum, item) => sum + (item.likes || 0), 0);
  const totalFeedComments = (socialFeed || []).reduce((sum, item) => sum + (item.comments || 0), 0);
  const latestSync = metricsList
    .map((metric) => metric.lastSyncedAt)
    .filter((value): value is string => Boolean(value))
    .sort()
    .at(-1);
  const liveFeedItems = (socialFeed || []).slice(0, 5);
  const recentWorkspaceItems = workspacePosts.slice(0, 5);
  const recentItems = liveFeedItems.length > 0
    ? liveFeedItems.map((item) => ({
        id: item.id,
        platform: item.platform,
        content: item.title,
        likes: item.likes,
        comments: item.comments,
        views: item.views,
        time: formatRelativeTime(item.publishedAt),
        tone: 'Live upload',
        href: item.url,
      }))
    : recentWorkspaceItems.map((post) => ({
        id: post.id,
        platform: post.targets?.[0]?.platform || 'Workspace',
        content: post.content,
        likes: null,
        comments: null,
        views: null,
        time: formatRelativeTime(post.publishedAt || post.createdAt),
        tone: post.status,
        href: null,
      }));
  const largestAudiencePlatform = metricsList
    .filter((metric) => metric.followers !== null)
    .sort((a, b) => (b.followers || 0) - (a.followers || 0))[0];
  const highestVolumePlatform = metricsList
    .filter((metric) => metric.posts !== null)
    .sort((a, b) => (b.posts || 0) - (a.posts || 0))[0];
  const bestViewsPlatform = metricsList
    .filter((metric) => metric.views !== null)
    .sort((a, b) => (b.views || 0) - (a.views || 0))[0];
  const chartMetrics = platformStats.map((platform) => ({
    label: platform.platform.slice(0, 3).toUpperCase(),
    value: metrics?.[platform.id]?.followers || metrics?.[platform.id]?.views || 0,
  }));
  const chartMax = Math.max(...chartMetrics.map((item) => item.value), 1);
  const summaryCards = [
    { label: 'Live audience', value: connectedCount > 0 ? formatCompactNumber(totalFollowers) : '--', detail: 'Combined followers/subscribers across connected accounts', icon: Eye },
    { label: 'Channel views', value: connectedCount > 0 ? formatCompactNumber(totalViews) : '--', detail: 'Live video/channel views from connected platforms', icon: Heart },
    { label: 'Published posts', value: String(publishedPosts), detail: `${scheduledPosts} scheduled, ${failedPosts} failed`, icon: MessageSquare },
    { label: 'Live feed items', value: String(liveFeedItems.length), detail: liveFeedItems.length > 0 ? 'Recent uploads pulled from connected social platforms' : 'No live social uploads available yet', icon: Share2 },
  ];
  const quickSignals = [
    {
      label: 'Latest sync',
      value: latestSync ? new Date(latestSync).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }) : 'Not synced yet',
      detail: latestSync ? 'Most recent successful platform refresh' : 'Connect a platform to start live sync',
    },
    {
      label: 'Largest audience',
      value: largestAudiencePlatform ? `${largestAudiencePlatform.platform}` : 'No live data',
      detail: largestAudiencePlatform ? `${formatCompactNumber(largestAudiencePlatform.followers)} followers/subscribers` : 'Audience size appears after live metrics load',
    },
    {
      label: 'Most recent publish',
      value: publishedWorkspacePosts[0]?.publishedAt ? formatRelativeTime(publishedWorkspacePosts[0].publishedAt) : 'No published posts',
      detail: publishedWorkspacePosts[0]?.targets?.[0]?.platform || 'Publish from Post Composer to build the history',
    },
  ];
  const liveHeroCards = [
    {
      label: 'Connected platforms',
      value: String(connectedCount),
      detail: 'Ready for scheduling, publishing, and reporting.',
    },
    {
      label: 'Live subscribers',
      value: connectedCount > 0 ? formatCompactNumber(totalFollowers) : '--',
      detail: connectedCount > 0 ? 'Pulled from connected account metrics.' : 'Connect an account to load live audience data.',
    },
    {
      label: 'Channel views',
      value: connectedCount > 0 ? formatCompactNumber(totalViews) : '--',
      detail: connectedCount > 0 ? `${publishedPosts} published post${publishedPosts === 1 ? '' : 's'} in this workspace.` : 'Live platform performance appears here once connected.',
    },
  ];
  const getPlatformAccounts = (platform: string) => activeAccounts.filter((account) => account.platform === platform);
  const platformCards = platformStats.map((stat) => {
    const connectedAccounts = getPlatformAccounts(stat.id);
    const liveMetrics = metrics?.[stat.id];
    const hasLiveFollowers = liveMetrics?.followers !== null && liveMetrics?.followers !== undefined;
    const hasLiveViews = liveMetrics?.views !== null && liveMetrics?.views !== undefined;
    const hasLivePosts = liveMetrics?.posts !== null && liveMetrics?.posts !== undefined;

    return {
      ...stat,
      connectedAccounts,
      isConnected: connectedAccounts.length > 0,
      metricValue: stat.id === 'youtube' && hasLiveFollowers ? formatCompactNumber(liveMetrics?.followers) : stat.followers,
      metricCaption: stat.id === 'youtube' && hasLiveFollowers ? 'live subscribers' : 'benchmark followers',
      engagementLabel: stat.id === 'youtube' && hasLiveViews ? 'Views' : 'Engagement',
      engagementValue: stat.id === 'youtube' && hasLiveViews ? formatCompactNumber(liveMetrics?.views) : stat.engagement,
      postsValue: stat.id === 'youtube' && hasLivePosts ? liveMetrics?.posts : stat.posts,
    };
  });

  const disconnectMutation = useMutation({
    mutationFn: (accountId: string) => api.delete(`/integrations/oauth/${accountId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['social-accounts'] });
      queryClient.invalidateQueries({ queryKey: ['social-metrics'] });
      queryClient.invalidateQueries({ queryKey: ['social-feed'] });
      queryClient.invalidateQueries({ queryKey: ['social-posts-summary'] });
    },
    onSettled: () => {
      setDisconnectingId(null);
    },
  });

  const handleConnect = (platform: string) => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('agentos-token') : null;

    if (!token) {
      window.location.href = '/login';
      return;
    }

    window.location.href = `${API_URL}/integrations/oauth/${platform}/connect?token=${encodeURIComponent(token)}`;
  };

  const handleDisconnect = (accountId: string) => {
    setDisconnectingId(accountId);
    disconnectMutation.mutate(accountId);
  };

  return (
    <div className="space-y-8 pb-6">
      <section className="surface-glow animate-fade-up relative overflow-hidden rounded-[2rem] border border-white/60 bg-slate-950 px-6 py-7 text-white shadow-2xl sm:px-8 sm:py-8">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(34,197,94,0.28),transparent_24%),radial-gradient(circle_at_85%_20%,rgba(59,130,246,0.34),transparent_30%),linear-gradient(135deg,rgba(15,23,42,0.98),rgba(30,41,59,0.96)_35%,rgba(37,99,235,0.88),rgba(20,184,166,0.78))]" />
        <div className="absolute right-0 top-0 h-52 w-52 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute bottom-0 left-1/3 h-36 w-36 rounded-full bg-emerald-300/20 blur-3xl" />
        <div className="relative z-10 grid gap-8 xl:grid-cols-[minmax(0,1.5fr)_360px]">
          <div className="space-y-6">
            <div className="flex flex-wrap items-center gap-2">
              <Badge className="border-white/10 bg-white/12 px-3 py-1 text-white backdrop-blur-sm">
                <Sparkles className="mr-1.5 h-3 w-3" />
                Social command center
              </Badge>
              <Badge className="border-white/10 bg-white/12 px-3 py-1 text-white backdrop-blur-sm">
                {connectedCount} active connection{connectedCount === 1 ? '' : 's'}
              </Badge>
            </div>
            <div className="max-w-3xl space-y-4">
              <h1 className="text-3xl font-semibold tracking-tight sm:text-5xl">Run your social engine from one calm surface.</h1>
              <p className="max-w-2xl text-base leading-7 text-slate-200 sm:text-lg">
                Track platform momentum, spot what is landing, and move directly into publishing without jumping between tools.
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              {liveHeroCards.map((card) => (
                <div key={card.label} className="rounded-2xl border border-white/12 bg-white/10 p-4 backdrop-blur-sm">
                  <p className="text-xs uppercase tracking-[0.22em] text-slate-300">{card.label}</p>
                  <p className="mt-2 text-3xl font-semibold text-white">{card.value}</p>
                  <p className="mt-1 text-sm text-slate-200">{card.detail}</p>
                </div>
              ))}
            </div>
            <div className="flex flex-wrap gap-3">
              <Link href="/post-composer">
                <Button className="h-12 rounded-2xl bg-white text-slate-950 hover:bg-slate-100">
                  <Calendar className="mr-2 h-4 w-4" />
                  Create Post
                </Button>
              </Link>
              <Link href="/integrations">
                <Button variant="outline" className="h-12 rounded-2xl border-white/20 bg-white/10 px-5 text-white hover:bg-white/15 hover:text-white">
                  <Globe className="mr-2 h-4 w-4" />
                  Manage Connections
                </Button>
              </Link>
            </div>
          </div>
          <div className="rounded-[1.75rem] border border-white/12 bg-white/10 p-5 backdrop-blur-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-100">Connected account health</p>
                <p className="text-xs text-slate-300">A quick read on what your social stack is ready for.</p>
              </div>
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/12">
                <Zap className="h-5 w-5 text-cyan-200" />
              </div>
            </div>
            <div className="mt-5 space-y-3">
              {connectedCount === 0 ? (
                <div className="rounded-[1.35rem] border border-white/12 bg-white/8 p-4 text-sm leading-6 text-slate-100">
                  No active platforms are connected yet. Once accounts are linked, this panel can become your quick launch point for planning and distribution.
                </div>
              ) : (
                activeAccounts.slice(0, 4).map((account) => (
                  <div key={account.id} className="flex items-center justify-between rounded-[1.35rem] border border-white/12 bg-white/8 px-4 py-3">
                    <div>
                      <p className="font-medium text-white">{account.accountName}</p>
                      <p className="text-xs text-slate-300">
                        {account.platform}
                        {latestSync ? ` • synced ${new Date(latestSync).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}` : ''}
                      </p>
                    </div>
                    <Badge className="border-0 bg-emerald-400/15 text-emerald-100">Active</Badge>
                  </div>
                ))
              )}
              <div className="rounded-[1.35rem] border border-white/12 bg-black/15 p-4">
                <p className="text-xs uppercase tracking-[0.22em] text-slate-300">Next move</p>
                <p className="mt-2 text-sm leading-6 text-slate-100">
                  {connectedCount === 0
                    ? 'Connect at least one social account, then use Post Composer to publish from the same workspace.'
                    : publishedPosts > 0
                      ? `You have ${publishedPosts} published post${publishedPosts === 1 ? '' : 's'} in this workspace. Build the next one from Post Composer.`
                      : 'Your live account is connected. Publish your first post from Post Composer to start building workspace-level performance data.'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        {platformCards.map((stat) => (
          <Card key={stat.platform} className="surface-glow overflow-hidden border-white/70 bg-white/90 shadow-lg">
            <CardContent className="space-y-4 p-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className={`flex h-8 w-8 items-center justify-center rounded-xl text-white ${stat.brandColor}`}>
                    <PlatformLogo platform={stat.logo} />
                  </div>
                  <span className="font-medium text-slate-900">{stat.platform}</span>
                </div>
                {stat.isConnected ? (
                  <Badge className="border-0 bg-emerald-100 text-emerald-700">
                    <CheckCircle2 className="mr-1 h-3 w-3" />
                    Connected
                  </Badge>
                ) : (
                  <ArrowUpRight className="h-4 w-4 text-slate-400" />
                )}
              </div>
              <div>
                <p className="text-3xl font-semibold tracking-tight text-slate-950">
                  {stat.isConnected ? stat.metricValue : 'Connect'}
                </p>
                <p className="mt-1 text-sm text-slate-500">
                  {stat.isConnected ? stat.metricCaption : 'to enable publishing'}
                </p>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-500">{stat.engagementLabel}</span>
                  <span className={`flex items-center gap-1 font-medium ${stat.isConnected ? 'text-emerald-600' : 'text-slate-400'}`}>
                    <TrendingUp className="h-3.5 w-3.5" />
                    {stat.isConnected ? stat.engagementValue : '--'}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-500">Posts</span>
                  <span className="font-medium text-slate-900">{stat.isConnected ? stat.postsValue : '--'}</span>
                </div>
              </div>
              <div className="rounded-2xl bg-slate-50 px-3 py-3 text-sm text-slate-600">{stat.focus}</div>
              <div className="space-y-2 rounded-2xl border border-slate-200 bg-white p-3">
                {accountsLoading ? (
                  <div className="flex items-center gap-2 text-sm text-slate-500">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Checking connection...
                  </div>
                ) : stat.connectedAccounts.length > 0 ? (
                  stat.connectedAccounts.map((account) => (
                    <div key={account.id} className="flex items-center justify-between gap-3 rounded-xl bg-slate-50 px-3 py-2">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-slate-900">{account.accountName}</p>
                        <p className="text-xs text-slate-500">Ready for publishing</p>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 shrink-0 rounded-full text-slate-500 hover:text-red-600"
                        onClick={() => handleDisconnect(account.id)}
                        disabled={disconnectingId === account.id}
                        aria-label={`Disconnect ${account.accountName}`}
                      >
                        {disconnectingId === account.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Unlink className="h-4 w-4" />}
                      </Button>
                    </div>
                  ))
                ) : (
                  <p className="text-sm leading-6 text-slate-500">No account linked yet. Connect {stat.platform} to use it from this workspace.</p>
                )}
              </div>
              <Button
                type="button"
                className={`w-full rounded-2xl ${stat.isConnected ? 'bg-slate-950 text-white hover:bg-slate-800' : 'bg-blue-600 text-white hover:bg-blue-700'}`}
                onClick={() => handleConnect(stat.id)}
              >
                <Plus className="mr-2 h-4 w-4" />
                {stat.isConnected ? 'Add another account' : `Connect ${stat.platform}`}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="h-auto rounded-2xl border border-slate-200/70 bg-white/80 p-1.5 shadow-sm backdrop-blur">
          <TabsTrigger value="overview" className="rounded-xl px-4 py-2.5 data-[state=active]:bg-slate-950 data-[state=active]:text-white">Overview</TabsTrigger>
          <TabsTrigger value="analytics" className="rounded-xl px-4 py-2.5 data-[state=active]:bg-slate-950 data-[state=active]:text-white">Analytics</TabsTrigger>
          <TabsTrigger value="audience" className="rounded-xl px-4 py-2.5 data-[state=active]:bg-slate-950 data-[state=active]:text-white">Audience</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {summaryCards.map((metric) => {
              const Icon = metric.icon;

              return (
                <Card key={metric.label} className="overflow-hidden border-slate-200 bg-white/90">
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-sm font-medium text-slate-500">{metric.label}</p>
                        <p className="mt-3 text-4xl font-semibold tracking-tight text-slate-950">{metric.value}</p>
                        <p className="mt-2 text-sm text-slate-500">{metric.detail}</p>
                      </div>
                      <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-100 text-slate-600">
                        <Icon className="h-5 w-5" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          <div className="grid gap-6 xl:grid-cols-[minmax(0,1.45fr)_360px]">
            <Card className="surface-glow overflow-hidden border-white/70 bg-white/92 shadow-lg">
              <CardHeader className="border-b border-slate-100 pb-5">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <CardTitle className="text-xl">Recent posts</CardTitle>
                    <CardDescription>See what just shipped and how audiences are reacting.</CardDescription>
                  </div>
                  <Link href="/post-composer">
                    <Button variant="outline" className="rounded-2xl border-slate-300">
                      Open composer
                    </Button>
                  </Link>
                </div>
              </CardHeader>
              <CardContent className="space-y-4 p-6">
                {recentItems.length > 0 ? recentItems.map((post) => (
                  <div key={post.id} className="rounded-[1.5rem] border border-slate-200 bg-slate-50/75 p-5">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                      <div className="min-w-0 flex-1">
                        <div className="mb-3 flex flex-wrap items-center gap-2">
                          <Badge variant="outline" className="rounded-full border-slate-300 bg-white text-[10px] uppercase tracking-[0.18em]">
                            {post.platform}
                          </Badge>
                          <Badge className="border-0 bg-slate-900/5 text-slate-600">{post.tone}</Badge>
                          <span className="text-xs text-slate-500">{post.time}</span>
                        </div>
                        {post.href ? (
                          <a href={post.href} target="_blank" rel="noreferrer" className="text-base leading-7 text-slate-900 hover:text-blue-700">
                            {post.content}
                          </a>
                        ) : (
                          <p className="text-base leading-7 text-slate-900">{post.content}</p>
                        )}
                      </div>
                      <div className="grid shrink-0 grid-cols-3 gap-2 lg:w-[260px]">
                        <div className="rounded-2xl bg-white px-3 py-3 text-center">
                          <Heart className="mx-auto h-4 w-4 text-slate-500" />
                          <p className="mt-2 text-lg font-semibold text-slate-900">{formatCompactNumber(post.likes)}</p>
                          <p className="text-[11px] uppercase tracking-[0.18em] text-slate-400">Likes</p>
                        </div>
                        <div className="rounded-2xl bg-white px-3 py-3 text-center">
                          <MessageSquare className="mx-auto h-4 w-4 text-slate-500" />
                          <p className="mt-2 text-lg font-semibold text-slate-900">{formatCompactNumber(post.comments)}</p>
                          <p className="text-[11px] uppercase tracking-[0.18em] text-slate-400">Comments</p>
                        </div>
                        <div className="rounded-2xl bg-white px-3 py-3 text-center">
                          <Eye className="mx-auto h-4 w-4 text-slate-500" />
                          <p className="mt-2 text-lg font-semibold text-slate-900">{formatCompactNumber(post.views)}</p>
                          <p className="text-[11px] uppercase tracking-[0.18em] text-slate-400">Views</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )) : (
                  <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50/75 p-5 text-sm text-slate-500">
                    No live social uploads or workspace posts yet. Publish from Post Composer or connect a platform with recent activity.
                  </div>
                )}
              </CardContent>
            </Card>

            <div className="space-y-6">
              <Card className="overflow-hidden border-slate-200 bg-white/90">
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg">Quick signals</CardTitle>
                  <CardDescription>Useful cues for what to post next.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {quickSignals.map((signal) => (
                    <div key={signal.label} className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
                      <p className="text-xs uppercase tracking-[0.18em] text-slate-400">{signal.label}</p>
                      <p className="mt-2 text-lg font-semibold text-slate-900">{signal.value}</p>
                      <p className="mt-1 text-sm leading-6 text-slate-500">{signal.detail}</p>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card className="overflow-hidden border-slate-200 bg-[linear-gradient(135deg,#f8fafc,#eef6ff,#ecfeff)]">
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg">Next campaign move</CardTitle>
                  <CardDescription>Generated from the current live workspace state.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="rounded-2xl bg-white/80 p-4">
                    <p className="text-sm leading-6 text-slate-700">
                      {connectedCount === 0
                        ? 'Connect a social account first so the page can pull live platform data and guide your next campaign with real signals.'
                        : publishedPosts > 0
                          ? `You already have ${publishedPosts} published post${publishedPosts === 1 ? '' : 's'}. Reuse the strongest theme from your recent output and schedule the next follow-up post.`
                          : 'Your live account is connected but there are no published workspace posts yet. Create the first post to start building real campaign history.'}
                    </p>
                  </div>
                  <Link href="/post-composer">
                    <Button className="w-full rounded-2xl bg-slate-950 text-white hover:bg-slate-800">
                      Build the next post
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <div className="grid gap-6 xl:grid-cols-[minmax(0,1.3fr)_360px]">
            <Card className="overflow-hidden border-slate-200 bg-white/92">
              <CardHeader>
                <CardTitle className="text-xl">Performance snapshot</CardTitle>
                <CardDescription>Live summary of the currently connected social accounts and workspace publishing history.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="rounded-2xl bg-slate-50 p-4">
                    <p className="text-sm text-slate-500">Most viewed channel</p>
                    <p className="mt-2 text-2xl font-semibold text-slate-950">{bestViewsPlatform ? bestViewsPlatform.platform : 'No live data'}</p>
                    <p className="mt-1 text-sm text-emerald-600">{bestViewsPlatform ? `${formatCompactNumber(bestViewsPlatform.views)} views` : 'Connect a live social account'}</p>
                  </div>
                  <div className="rounded-2xl bg-slate-50 p-4">
                    <p className="text-sm text-slate-500">Largest audience</p>
                    <p className="mt-2 text-2xl font-semibold text-slate-950">{largestAudiencePlatform ? largestAudiencePlatform.platform : 'No live data'}</p>
                    <p className="mt-1 text-sm text-slate-500">{largestAudiencePlatform ? `${formatCompactNumber(largestAudiencePlatform.followers)} followers/subscribers` : 'Audience appears after metrics load'}</p>
                  </div>
                  <div className="rounded-2xl bg-slate-50 p-4">
                    <p className="text-sm text-slate-500">Highest volume</p>
                    <p className="mt-2 text-2xl font-semibold text-slate-950">{highestVolumePlatform ? highestVolumePlatform.platform : 'Workspace'}</p>
                    <p className="mt-1 text-sm text-slate-500">{highestVolumePlatform ? `${formatCompactNumber(highestVolumePlatform.posts)} live posts/videos` : `${publishedPosts} published workspace posts`}</p>
                  </div>
                </div>
                <div className="rounded-[1.7rem] border border-slate-200 bg-[linear-gradient(180deg,#f8fafc,#ffffff)] p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-slate-900">Cross-channel momentum</p>
                      <p className="text-sm text-slate-500">Live comparison using connected platform metrics.</p>
                    </div>
                    <BarChart3 className="h-5 w-5 text-slate-400" />
                  </div>
                  <div className="mt-6 grid grid-cols-7 items-end gap-3">
                    {chartMetrics.map((item) => (
                      <div key={item.label} className="space-y-2">
                        <div
                          className="rounded-t-2xl bg-[linear-gradient(180deg,#0f172a,#2563eb,#14b8a6)]"
                          style={{ height: `${Math.max((item.value / chartMax) * 130, item.value > 0 ? 18 : 8)}px` }}
                        />
                        <p className="text-center text-xs text-slate-400">{item.label}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="overflow-hidden border-slate-200 bg-white/90">
              <CardHeader>
                <CardTitle className="text-lg">Live coverage</CardTitle>
                <CardDescription>What this page is currently reading from live sources.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-slate-600">
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  Connected account status is live for every supported platform.
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  YouTube subscribers, views, video count, and recent uploads are now live.
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  Workspace post history is live from AgentOS and fills the remaining summaries.
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="audience" className="space-y-6">
          <div className="grid gap-6 xl:grid-cols-[minmax(0,1.3fr)_360px]">
            <Card className="overflow-hidden border-slate-200 bg-white/92">
              <CardHeader>
                <CardTitle className="text-xl">Audience signals</CardTitle>
                <CardDescription>Live audience view based on the data currently available from connected platforms.</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-4 md:grid-cols-2">
                <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-5">
                  <Users className="h-5 w-5 text-slate-500" />
                  <p className="mt-4 text-lg font-semibold text-slate-900">Connected audience</p>
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    {connectedCount > 0 ? `${formatCompactNumber(totalFollowers)} total followers/subscribers are visible across your connected accounts.` : 'Connect at least one social account to expose live audience size.'}
                  </p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-5">
                  <TrendingUp className="h-5 w-5 text-slate-500" />
                  <p className="mt-4 text-lg font-semibold text-slate-900">Current activity</p>
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    {liveFeedItems.length > 0 ? `${liveFeedItems.length} recent live social upload${liveFeedItems.length === 1 ? '' : 's'} are available for review on this page.` : 'No live social uploads are available yet from connected platforms.'}
                  </p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-5">
                  <Globe className="h-5 w-5 text-slate-500" />
                  <p className="mt-4 text-lg font-semibold text-slate-900">Channel leader</p>
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    {largestAudiencePlatform ? `${largestAudiencePlatform.platform} currently has the largest visible audience in the connected stack.` : 'A channel leader appears once live platform metrics are available.'}
                  </p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-5">
                  <Share2 className="h-5 w-5 text-slate-500" />
                  <p className="mt-4 text-lg font-semibold text-slate-900">Content cue</p>
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    {publishedPosts > 0 ? `You have ${publishedPosts} published workspace post${publishedPosts === 1 ? '' : 's'} to learn from. Reuse the strongest recent theme in the next campaign.` : 'Publish the first post to create a live content trail the audience page can build on.'}
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="overflow-hidden border-slate-200 bg-white/90">
              <CardHeader>
                <CardTitle className="text-lg">Audience readiness</CardTitle>
                <CardDescription>Operational snapshot from live data.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="rounded-2xl bg-slate-50 p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Reach size</p>
                  <p className="mt-2 text-2xl font-semibold text-slate-950">{connectedCount > 0 ? formatCompactNumber(totalFollowers) : '--'}</p>
                </div>
                <div className="rounded-2xl bg-slate-50 p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Visible engagement</p>
                  <p className="mt-2 text-2xl font-semibold text-slate-950">{formatCompactNumber(totalFeedLikes + totalFeedComments)}</p>
                </div>
                <div className="rounded-2xl bg-slate-50 p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Next content basis</p>
                  <p className="mt-2 text-2xl font-semibold text-slate-950">{recentItems[0]?.platform || 'No live signal yet'}</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
