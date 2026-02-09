'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Share2,
  Users,
  TrendingUp,
  BarChart3,
  Globe,
  Eye,
  Heart,
  MessageSquare,
  ArrowUpRight,
  Calendar,
} from 'lucide-react';
import Link from 'next/link';

const platformStats = [
  { platform: 'LinkedIn', followers: '12.4K', engagement: '4.2%', posts: 156, color: 'bg-blue-600' },
  { platform: 'Meta', followers: '34.7K', engagement: '3.8%', posts: 312, color: 'bg-blue-500' },
  { platform: 'YouTube', followers: '8.2K', engagement: '5.1%', posts: 48, color: 'bg-red-500' },
  { platform: 'X', followers: '21.3K', engagement: '2.9%', posts: 524, color: 'bg-slate-800 dark:bg-slate-200' },
  { platform: 'TikTok', followers: '15.6K', engagement: '7.2%', posts: 89, color: 'bg-black dark:bg-white' },
];

const recentPostsData = [
  { platform: 'LinkedIn', content: 'Excited to announce our new AI-powered campaign tools...', likes: 234, comments: 18, views: 4521, time: '2 hours ago' },
  { platform: 'Meta', content: 'Behind the scenes at our latest product photoshoot...', likes: 567, comments: 34, views: 8932, time: '5 hours ago' },
  { platform: 'X', content: 'Thread: 5 ways AI is transforming content creation...', likes: 189, comments: 42, views: 12340, time: '1 day ago' },
];

export default function SocialMediaPage() {
  const { data: accounts } = useQuery({
    queryKey: ['social-accounts'],
    queryFn: () => api.get<any[]>('/social/accounts'),
  });

  const connectedCount = accounts?.filter((a: any) => a.isActive).length || 0;

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Social Media Hub</h1>
          <p className="text-muted-foreground">
            {connectedCount} platform(s) connected
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/post-composer">
            <Button><Calendar className="mr-2 h-4 w-4" /> Create Post</Button>
          </Link>
          <Link href="/integrations">
            <Button variant="outline"><Globe className="mr-2 h-4 w-4" /> Manage Connections</Button>
          </Link>
        </div>
      </div>

      {/* Platform Overview Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {platformStats.map((stat) => (
          <Card key={stat.platform}>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <div className={`h-3 w-3 rounded-full ${stat.color}`} />
                <span className="text-sm font-medium">{stat.platform}</span>
              </div>
              <p className="text-xl font-bold">{stat.followers}</p>
              <p className="text-xs text-muted-foreground">followers</p>
              <div className="mt-2 flex items-center gap-2 text-xs">
                <span className="flex items-center gap-1 text-green-600 dark:text-green-400">
                  <TrendingUp className="h-3 w-3" /> {stat.engagement}
                </span>
                <span className="text-muted-foreground">{stat.posts} posts</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="audience">Audience</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Summary Metrics */}
          <div className="grid gap-4 sm:grid-cols-4">
            <Card>
              <CardContent className="p-4 text-center">
                <Eye className="mx-auto h-5 w-5 text-muted-foreground mb-1" />
                <p className="text-2xl font-bold">89.2K</p>
                <p className="text-xs text-muted-foreground">Total Reach</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <Heart className="mx-auto h-5 w-5 text-muted-foreground mb-1" />
                <p className="text-2xl font-bold">12.4K</p>
                <p className="text-xs text-muted-foreground">Total Likes</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <MessageSquare className="mx-auto h-5 w-5 text-muted-foreground mb-1" />
                <p className="text-2xl font-bold">2,847</p>
                <p className="text-xs text-muted-foreground">Comments</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <Share2 className="mx-auto h-5 w-5 text-muted-foreground mb-1" />
                <p className="text-2xl font-bold">1,456</p>
                <p className="text-xs text-muted-foreground">Shares</p>
              </CardContent>
            </Card>
          </div>

          {/* Recent Posts */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Recent Posts</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentPostsData.map((post, i) => (
                  <div key={i} className="flex items-start gap-4 rounded-lg border p-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="outline" className="text-[10px]">{post.platform}</Badge>
                        <span className="text-xs text-muted-foreground">{post.time}</span>
                      </div>
                      <p className="text-sm line-clamp-2">{post.content}</p>
                    </div>
                    <div className="flex gap-4 text-xs text-muted-foreground shrink-0">
                      <span className="flex items-center gap-1"><Heart className="h-3 w-3" /> {post.likes}</span>
                      <span className="flex items-center gap-1"><MessageSquare className="h-3 w-3" /> {post.comments}</span>
                      <span className="flex items-center gap-1"><Eye className="h-3 w-3" /> {post.views.toLocaleString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics">
          <Card>
            <CardContent className="flex items-center justify-center p-16">
              <div className="text-center">
                <BarChart3 className="mx-auto h-12 w-12 text-muted-foreground/30" />
                <p className="mt-3 text-muted-foreground">Analytics charts will be populated when connected accounts have data</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="audience">
          <Card>
            <CardContent className="flex items-center justify-center p-16">
              <div className="text-center">
                <Users className="mx-auto h-12 w-12 text-muted-foreground/30" />
                <p className="mt-3 text-muted-foreground">Audience insights will appear after connecting social accounts</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
