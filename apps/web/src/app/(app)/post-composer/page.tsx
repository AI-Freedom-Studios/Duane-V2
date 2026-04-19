'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import PostComposerClient from './post-composer-client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Send,
  Clock,
  Image as ImageIcon,
  Calendar,
  CheckCircle2,
  Globe,
  Loader2,
  Save,
  FileText,
} from 'lucide-react';

export default PostComposerClient;

function LegacyPostComposerPage() {
  const queryClient = useQueryClient();
  const [content, setContent] = useState('');
  const [scheduledAt, setScheduledAt] = useState('');
  const [selectedAccounts, setSelectedAccounts] = useState<string[]>([]);

  const { data: accounts } = useQuery({
    queryKey: ['social-accounts'],
    queryFn: () => api.get<any[]>('/social/accounts'),
  });

  const { data: postsData } = useQuery({
    queryKey: ['posts'],
    queryFn: () => api.get<any>('/posts'),
  });

  const createPostMutation = useMutation({
    mutationFn: (data: any) => api.post('/posts', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['posts'] });
      setContent('');
      setScheduledAt('');
      setSelectedAccounts([]);
    },
  });

  const publishMutation = useMutation({
    mutationFn: (postId: string) => api.post(`/posts/${postId}/publish`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['posts'] }),
  });

  const activeAccounts = accounts?.filter((a: any) => a.isActive) || [];

  const toggleAccount = (id: string) => {
    setSelectedAccounts((prev) =>
      prev.includes(id) ? prev.filter((a) => a !== id) : [...prev, id],
    );
  };

  const handleSaveDraft = () => {
    if (!content || selectedAccounts.length === 0) return;
    createPostMutation.mutate({
      content,
      targetAccountIds: selectedAccounts,
      mediaUrls: [],
    });
  };

  const handleSchedule = () => {
    if (!content || selectedAccounts.length === 0 || !scheduledAt) return;
    createPostMutation.mutate({
      content,
      targetAccountIds: selectedAccounts,
      scheduledAt: new Date(scheduledAt).toISOString(),
      mediaUrls: [],
    });
  };

  const handlePublishNow = () => {
    if (!content || selectedAccounts.length === 0) return;
    createPostMutation.mutate({
      content,
      targetAccountIds: selectedAccounts,
      mediaUrls: [],
    });
  };

  const statusColors: Record<string, string> = {
    DRAFT: 'secondary',
    SCHEDULED: 'warning',
    PUBLISHING: 'default',
    PUBLISHED: 'success',
    FAILED: 'destructive',
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Post Composer</h1>
        <p className="text-muted-foreground">Create, schedule, and publish posts across platforms</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Composer */}
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>New Post</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Content</Label>
                <Textarea
                  placeholder="Write your post content here..."
                  rows={6}
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>{content.length} characters</span>
                  <span>Recommended: 280 for X, 3000 for LinkedIn</span>
                </div>
              </div>

              {/* Media Upload */}
              <div className="space-y-2">
                <Label>Media</Label>
                <div className="flex items-center justify-center rounded-lg border-2 border-dashed p-6">
                  <div className="text-center">
                    <ImageIcon className="mx-auto h-8 w-8 text-muted-foreground/50" />
                    <p className="mt-2 text-sm text-muted-foreground">Drag & drop images or videos</p>
                    <Button variant="outline" size="sm" className="mt-2">Browse Files</Button>
                  </div>
                </div>
              </div>

              {/* Target Accounts */}
              <div className="space-y-2">
                <Label>Target Accounts</Label>
                {activeAccounts.length === 0 ? (
                  <div className="rounded-lg border p-4 text-center text-sm text-muted-foreground">
                    No connected accounts. <a href="/integrations" className="text-primary hover:underline">Connect accounts</a> first.
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {activeAccounts.map((account: any) => (
                      <button
                        key={account.id}
                        onClick={() => toggleAccount(account.id)}
                        className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm transition-colors ${
                          selectedAccounts.includes(account.id)
                            ? 'border-primary bg-primary/10 text-primary'
                            : 'hover:bg-accent'
                        }`}
                      >
                        <Globe className="h-3 w-3" />
                        {account.accountName}
                        <Badge variant="outline" className="text-[10px]">{account.platform}</Badge>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Schedule */}
              <div className="space-y-2">
                <Label>Schedule (optional)</Label>
                <Input
                  type="datetime-local"
                  value={scheduledAt}
                  onChange={(e) => setScheduledAt(e.target.value)}
                />
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-3 pt-2">
                <Button
                  variant="outline"
                  onClick={handleSaveDraft}
                  disabled={!content || selectedAccounts.length === 0 || createPostMutation.isPending}
                >
                  <Save className="mr-2 h-4 w-4" /> Save Draft
                </Button>
                <Button
                  variant="secondary"
                  onClick={handleSchedule}
                  disabled={!content || selectedAccounts.length === 0 || !scheduledAt || createPostMutation.isPending}
                >
                  <Clock className="mr-2 h-4 w-4" /> Schedule
                </Button>
                <Button
                  onClick={handlePublishNow}
                  disabled={!content || selectedAccounts.length === 0 || createPostMutation.isPending}
                >
                  {createPostMutation.isPending ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="mr-2 h-4 w-4" />
                  )}
                  Publish Now
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Posts */}
        <div className="space-y-4">
          <h3 className="font-semibold">Recent Posts</h3>
          {postsData?.data?.length === 0 ? (
            <Card>
              <CardContent className="flex items-center justify-center p-8 text-center">
                <div>
                  <FileText className="mx-auto h-8 w-8 text-muted-foreground/50" />
                  <p className="mt-2 text-sm text-muted-foreground">No posts yet</p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {postsData?.data?.map((post: any) => (
                <Card key={post.id}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm line-clamp-2">{post.content}</p>
                      <Badge variant={statusColors[post.status] as any || 'secondary'} className="shrink-0 text-[10px]">
                        {post.status}
                      </Badge>
                    </div>
                    <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                      {post.scheduledAt && (
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {new Date(post.scheduledAt).toLocaleString()}
                        </span>
                      )}
                      {post.targets?.length > 0 && (
                        <span>{post.targets.length} platform(s)</span>
                      )}
                    </div>
                    {post.status === 'DRAFT' && (
                      <Button
                        size="sm"
                        className="mt-2 w-full"
                        variant="outline"
                        onClick={() => publishMutation.mutate(post.id)}
                      >
                        <Send className="mr-1 h-3 w-3" /> Publish
                      </Button>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
