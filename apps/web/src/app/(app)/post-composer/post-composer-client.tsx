'use client';

import { useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  AlertCircle,
  Calendar,
  CheckCircle2,
  Clock,
  FileText,
  Globe,
  Image as ImageIcon,
  Loader2,
  Save,
  Send,
  Sparkles,
  Trash2,
  Users,
} from 'lucide-react';

type SocialAccount = {
  id: string;
  platform: string;
  accountName: string;
  isActive: boolean;
};

type PostTarget = {
  id: string;
  accountId: string;
  accountName?: string;
  platform?: string;
  status: string;
  errorMessage?: string | null;
};

type Post = {
  id: string;
  content: string;
  mediaUrls: string[];
  status: string;
  scheduledAt: string | null;
  publishedAt: string | null;
  targets: PostTarget[];
  createdAt: string;
};

type UploadedMedia = {
  url: string;
  filename: string;
  originalName: string;
  size: number;
  mimeType: string;
};

const statusStyles: Record<string, string> = {
  DRAFT: 'border-slate-200 bg-slate-100 text-slate-700',
  SCHEDULED: 'border-amber-200 bg-amber-100 text-amber-800',
  PUBLISHING: 'border-blue-200 bg-blue-100 text-blue-800',
  PUBLISHED: 'border-emerald-200 bg-emerald-100 text-emerald-800',
  FAILED: 'border-red-200 bg-red-100 text-red-800',
};

const platformLabels: Record<string, string> = {
  youtube: 'YouTube',
  linkedin: 'LinkedIn',
  meta: 'Meta',
  x: 'X',
  tiktok: 'TikTok',
};

function formatDate(value?: string | null) {
  if (!value) return '';
  return new Date(value).toLocaleString([], {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function PostComposerClient() {
  const queryClient = useQueryClient();
  const [content, setContent] = useState('');
  const [scheduledAt, setScheduledAt] = useState('');
  const [selectedAccounts, setSelectedAccounts] = useState<string[]>([]);
  const [mediaUrls, setMediaUrls] = useState<string[]>([]);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const { data: accounts, isLoading: accountsLoading } = useQuery({
    queryKey: ['social-accounts'],
    queryFn: () => api.get<SocialAccount[]>('/social/accounts'),
  });

  const { data: postsData, isLoading: postsLoading } = useQuery({
    queryKey: ['posts'],
    queryFn: () => api.get<{ data: Post[]; total: number }>('/posts'),
    refetchInterval: (query) => {
      const posts = query.state.data?.data || [];
      return posts.some((post) => post.status === 'PUBLISHING') ? 2500 : false;
    },
  });

  const activeAccounts = useMemo(() => accounts?.filter((account) => account.isActive) || [], [accounts]);
  const selectedAccountObjects = activeAccounts.filter((account) => selectedAccounts.includes(account.id));
  const hasContent = content.trim().length > 0;
  const canSubmit = hasContent && selectedAccounts.length > 0;

  const createPostMutation = useMutation({
    mutationFn: (data: any) => api.post<Post>('/posts', data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['posts'] }),
  });

  const publishMutation = useMutation({
    mutationFn: (postId: string) => api.post(`/posts/${postId}/publish`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['posts'] }),
  });

  const deleteMutation = useMutation({
    mutationFn: (postId: string) => api.delete(`/posts/${postId}`),
    onSuccess: () => {
      setMessage('Post deleted from AgentOS and connected platforms.');
      queryClient.invalidateQueries({ queryKey: ['posts'] });
    },
    onError: (err: any) => setError(err.message || 'Could not delete post'),
  });

  const uploadMediaMutation = useMutation({
    mutationFn: (file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      return api.upload<UploadedMedia>('/media/upload', formData);
    },
    onSuccess: (uploaded) => {
      setMediaUrls((prev) => [...prev, uploaded.url]);
      setMessage(`Uploaded ${uploaded.originalName}.`);
      setError('');
    },
    onError: (err: any) => setError(err.message || 'Could not upload media'),
  });

  const resetComposer = () => {
    setContent('');
    setScheduledAt('');
    setSelectedAccounts([]);
    setMediaUrls([]);
  };

  const toggleAccount = (id: string) => {
    setSelectedAccounts((prev) => (prev.includes(id) ? prev.filter((accountId) => accountId !== id) : [...prev, id]));
  };

  const uploadLocalFile = (file?: File) => {
    if (!file) return;

    if (!file.type.startsWith('video/')) {
      setError('Choose a video file from your computer.');
      return;
    }

    uploadMediaMutation.mutate(file);
  };

  const createPost = async (mode: 'draft' | 'schedule' | 'publish') => {
    setError('');
    setMessage('');

    if (!canSubmit) {
      setError('Write content and select at least one target account.');
      return;
    }

    if (mode === 'schedule' && !scheduledAt) {
      setError('Choose a schedule time first.');
      return;
    }

    if (mode === 'schedule' && new Date(scheduledAt).getTime() < Date.now()) {
      setError('Schedule time must be in the future.');
      return;
    }

    const isPublishingToYouTube = mode === 'publish' && selectedAccountObjects.some((account) => account.platform.toLowerCase() === 'youtube');
    if (isPublishingToYouTube && mediaUrls.length === 0) {
      setError('YouTube publishing needs a direct public video URL before it can upload to your channel.');
      return;
    }

    try {
      const post = await createPostMutation.mutateAsync({
        content: content.trim(),
        targetAccountIds: selectedAccounts,
        mediaUrls,
        scheduledAt: mode === 'schedule' ? new Date(scheduledAt).toISOString() : undefined,
      });

      if (mode === 'publish') {
        await publishMutation.mutateAsync(post.id);
        setMessage('Post queued for real publishing. Recent posts will update with the platform result.');
      } else if (mode === 'schedule') {
        setMessage('Post scheduled successfully.');
      } else {
        setMessage('Draft saved successfully.');
      }

      resetComposer();
    } catch (err: any) {
      setError(err.message || 'Could not save post');
    }
  };

  const posts = postsData?.data || [];
  const isWorking = createPostMutation.isPending || publishMutation.isPending || uploadMediaMutation.isPending;

  return (
    <div className="space-y-8 pb-6">
      <section className="surface-glow animate-fade-up relative overflow-hidden rounded-[2rem] border border-white/60 bg-slate-950 px-6 py-7 text-white shadow-2xl sm:px-8">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,0.36),transparent_24%),radial-gradient(circle_at_86%_24%,rgba(20,184,166,0.26),transparent_32%),linear-gradient(135deg,rgba(15,23,42,0.98),rgba(30,41,59,0.95)_34%,rgba(37,99,235,0.86),rgba(6,182,212,0.72))]" />
        <div className="relative z-10 grid gap-6 xl:grid-cols-[minmax(0,1.4fr)_360px]">
          <div className="space-y-4">
            <Badge className="w-fit border-white/10 bg-white/12 px-3 py-1 text-white backdrop-blur-sm">
              <Sparkles className="mr-1.5 h-3 w-3" />
              Publishing workspace
            </Badge>
            <div>
              <h1 className="text-3xl font-semibold tracking-tight sm:text-5xl">Compose once, route to every connected channel.</h1>
              <p className="mt-4 max-w-2xl text-base leading-7 text-slate-200">
                Draft, schedule, and queue posts against your connected social accounts. Current publishing adapters run through the backend queue and mark results in recent posts.
              </p>
            </div>
          </div>
          <div className="rounded-[1.5rem] border border-white/12 bg-white/10 p-5 backdrop-blur">
            <p className="text-xs uppercase tracking-[0.22em] text-slate-300">Readiness</p>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <div className="rounded-2xl bg-white/10 p-4">
                <p className="text-3xl font-semibold">{activeAccounts.length}</p>
                <p className="text-sm text-slate-200">Connected accounts</p>
              </div>
              <div className="rounded-2xl bg-white/10 p-4">
                <p className="text-3xl font-semibold">{postsData?.total || 0}</p>
                <p className="text-sm text-slate-200">Saved posts</p>
              </div>
            </div>
            <p className="mt-4 text-sm leading-6 text-slate-200">
              {activeAccounts.length === 0
                ? 'Connect at least one social account before composing.'
                : 'Select one or more connected accounts below to create a targeted publishing run.'}
            </p>
          </div>
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.35fr)_440px]">
        <Card className="surface-glow overflow-hidden border-white/70 bg-white/95 shadow-lg">
          <CardHeader className="border-b border-slate-100">
            <CardTitle className="text-2xl">New post</CardTitle>
            <CardDescription>Prepare content, choose platforms, then save, schedule, or publish immediately.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 p-6">
            {message ? (
              <div className="flex items-start gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
                {message}
              </div>
            ) : null}
            {error ? (
              <div className="flex items-start gap-2 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                {error}
              </div>
            ) : null}

            <div className="space-y-2">
              <Label htmlFor="content">Content</Label>
              <Textarea
                id="content"
                placeholder="Write the post you want to publish..."
                rows={8}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="resize-y rounded-2xl text-base leading-7"
              />
              <div className="flex flex-wrap justify-between gap-2 text-xs text-muted-foreground">
                <span>{content.length} characters</span>
                <span className={content.length > 280 && selectedAccountObjects.some((account) => account.platform === 'x') ? 'text-amber-600' : ''}>
                  Recommended: 280 for X, 3000 for LinkedIn
                </span>
              </div>
            </div>

            <div className="space-y-3">
              <Label>Media</Label>
              <div className="rounded-[1.5rem] border border-dashed border-slate-300 bg-slate-50/80 p-4">
                <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-slate-200 bg-white p-3">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="video/*"
                    className="hidden"
                    onChange={(event) => {
                      uploadLocalFile(event.target.files?.[0]);
                      event.target.value = '';
                    }}
                  />
                  <Button type="button" variant="secondary" onClick={() => fileInputRef.current?.click()} disabled={uploadMediaMutation.isPending}>
                    {uploadMediaMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ImageIcon className="mr-2 h-4 w-4" />}
                    Upload from computer
                  </Button>
                  <p className="text-xs leading-5 text-slate-500">
                    Pick a video from your media gallery. AgentOS will host it locally and use that URL for YouTube upload.
                  </p>
                </div>
                <p className="mt-3 text-xs text-slate-500">
                  Local video upload is recommended for YouTube publishing.
                </p>
                {mediaUrls.length > 0 ? (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {mediaUrls.map((url) => (
                      <Badge key={url} variant="outline" className="max-w-full gap-2 rounded-full bg-white px-3 py-1">
                        <ImageIcon className="h-3 w-3" />
                        <span className="max-w-[260px] truncate">{url}</span>
                        <button type="button" className="text-slate-400 hover:text-red-600" onClick={() => setMediaUrls((prev) => prev.filter((item) => item !== url))}>
                          x
                        </button>
                      </Badge>
                    ))}
                  </div>
                ) : null}
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between gap-3">
                <Label>Target accounts</Label>
                {activeAccounts.length > 0 ? (
                  <Button type="button" variant="ghost" size="sm" onClick={() => setSelectedAccounts(activeAccounts.map((account) => account.id))}>
                    Select all
                  </Button>
                ) : null}
              </div>
              {accountsLoading ? (
                <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-500">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Loading connected accounts...
                </div>
              ) : activeAccounts.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-5 text-sm text-slate-600">
                  No connected accounts yet. <Link href="/integrations" className="font-medium text-primary hover:underline">Connect accounts</Link> first.
                </div>
              ) : (
                <div className="grid gap-3 md:grid-cols-2">
                  {activeAccounts.map((account) => {
                    const selected = selectedAccounts.includes(account.id);
                    return (
                      <button
                        key={account.id}
                        type="button"
                        onClick={() => toggleAccount(account.id)}
                        className={`rounded-2xl border p-4 text-left transition ${
                          selected ? 'border-blue-500 bg-blue-50 shadow-sm' : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <div className={`flex h-10 w-10 items-center justify-center rounded-2xl ${selected ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-500'}`}>
                              <Globe className="h-4 w-4" />
                            </div>
                            <div>
                              <p className="font-medium text-slate-950">{account.accountName}</p>
                              <p className="text-xs text-slate-500">{platformLabels[account.platform] || account.platform}</p>
                            </div>
                          </div>
                          {selected ? <CheckCircle2 className="h-5 w-5 text-blue-600" /> : null}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_220px]">
              <div className="space-y-2">
                <Label htmlFor="scheduledAt">Schedule time</Label>
                <Input id="scheduledAt" type="datetime-local" value={scheduledAt} onChange={(e) => setScheduledAt(e.target.value)} />
              </div>
              <div className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-600">
                <p className="font-medium text-slate-900">Selected run</p>
                <p className="mt-1">{selectedAccounts.length} account{selectedAccounts.length === 1 ? '' : 's'} targeted</p>
              </div>
            </div>

            <div className="flex flex-wrap gap-3 border-t border-slate-100 pt-5">
              <Button variant="outline" onClick={() => createPost('draft')} disabled={!canSubmit || isWorking}>
                <Save className="mr-2 h-4 w-4" />
                Save draft
              </Button>
              <Button variant="secondary" onClick={() => createPost('schedule')} disabled={!canSubmit || !scheduledAt || isWorking}>
                <Clock className="mr-2 h-4 w-4" />
                Schedule
              </Button>
              <Button onClick={() => createPost('publish')} disabled={!canSubmit || isWorking} className="bg-slate-950 text-white hover:bg-slate-800">
                {isWorking ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                Publish now
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="h-fit border-slate-200 bg-white/95 shadow-lg">
          <CardHeader>
            <div className="flex items-center justify-between gap-3">
              <div>
                <CardTitle>Recent posts</CardTitle>
                <CardDescription>Drafts, scheduled posts, and publish results.</CardDescription>
              </div>
              <Badge variant="outline" className="rounded-full">
                {posts.length} shown
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            {postsLoading ? (
              <div className="flex items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 p-8 text-sm text-slate-500">
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Loading posts...
              </div>
            ) : posts.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
                <FileText className="mx-auto h-8 w-8 text-slate-400" />
                <p className="mt-2 text-sm text-slate-500">No posts yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {posts.map((post) => (
                  <div key={post.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                    <div className="flex items-start justify-between gap-3">
                      <p className="line-clamp-3 text-sm leading-6 text-slate-800">{post.content}</p>
                      <Badge className={`shrink-0 border ${statusStyles[post.status] || statusStyles.DRAFT}`}>{post.status}</Badge>
                    </div>
                    <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                      <span className="flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        {post.targets.length} target{post.targets.length === 1 ? '' : 's'}
                      </span>
                      {post.scheduledAt ? (
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {formatDate(post.scheduledAt)}
                        </span>
                      ) : null}
                      {post.publishedAt ? (
                        <span className="flex items-center gap-1">
                          <CheckCircle2 className="h-3 w-3" />
                          {formatDate(post.publishedAt)}
                        </span>
                      ) : null}
                    </div>
                    {post.targets.length > 0 ? (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {post.targets.map((target) => (
                          <Badge key={target.id} variant="outline" className="rounded-full bg-slate-50">
                            {target.accountName || 'Account'} - {platformLabels[target.platform || ''] || target.platform}
                          </Badge>
                        ))}
                      </div>
                    ) : null}
                    {post.targets.some((target) => target.errorMessage) ? (
                      <div className="mt-3 rounded-xl border border-red-100 bg-red-50 p-3 text-xs leading-5 text-red-700">
                        {post.targets.map((target) => target.errorMessage).filter(Boolean).join(' ')}
                      </div>
                    ) : null}
                    <div className="mt-3 flex gap-2">
                      {post.status === 'DRAFT' || post.status === 'FAILED' ? (
                        <Button size="sm" variant="outline" onClick={() => publishMutation.mutate(post.id)} disabled={publishMutation.isPending}>
                          <Send className="mr-1 h-3 w-3" />
                          Publish
                        </Button>
                      ) : null}
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-red-600 hover:text-red-700"
                        onClick={() => deleteMutation.mutate(post.id)}
                        disabled={deleteMutation.isPending}
                      >
                        <Trash2 className="mr-1 h-3 w-3" />
                        Delete
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
