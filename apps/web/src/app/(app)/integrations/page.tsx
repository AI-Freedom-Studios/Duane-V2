'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Key,
  Plus,
  Trash2,
  TestTube,
  CheckCircle2,
  XCircle,
  ExternalLink,
  Loader2,
  Link as LinkIcon,
  Unlink,
  Globe,
  Sparkles,
  Shield,
  Zap,
} from 'lucide-react';
import { useState } from 'react';

const platformInfo: Record<string, { name: string; color: string; note: string }> = {
  meta: { name: 'Meta (Facebook/Instagram)', color: 'bg-blue-500', note: 'Meta business and creator surfaces' },
  linkedin: { name: 'LinkedIn', color: 'bg-blue-700', note: 'Professional publishing and company updates' },
  youtube: { name: 'YouTube', color: 'bg-red-500', note: 'Long-form video and channel publishing' },
  tiktok: { name: 'TikTok', color: 'bg-black dark:bg-white', note: 'Short-form creator-first distribution' },
  x: { name: 'X (Twitter)', color: 'bg-black dark:bg-white', note: 'Fast commentary and real-time posts' },
};

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export default function IntegrationsPage() {
  const queryClient = useQueryClient();
  const searchParams = useSearchParams();
  const [addKeyOpen, setAddKeyOpen] = useState(false);
  const [newKey, setNewKey] = useState({ providerSlug: '', label: '', apiKey: '' });
  const [testingId, setTestingId] = useState<string | null>(null);
  const [testMessage, setTestMessage] = useState<string | null>(null);

  const { data: registry } = useQuery({
    queryKey: ['provider-registry'],
    queryFn: () => api.get<any[]>('/providers/registry'),
  });

  const { data: keys, isLoading: keysLoading } = useQuery({
    queryKey: ['provider-keys'],
    queryFn: () => api.get<any[]>('/providers/keys'),
  });

  const { data: accounts } = useQuery({
    queryKey: ['social-accounts'],
    queryFn: () => api.get<any[]>('/social/accounts'),
  });

  const addKeyMutation = useMutation({
    mutationFn: (data: any) => api.post('/providers/keys', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['provider-keys'] });
      setAddKeyOpen(false);
      setNewKey({ providerSlug: '', label: '', apiKey: '' });
    },
  });

  const deleteKeyMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/providers/keys/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['provider-keys'] }),
  });

  const testKeyMutation = useMutation({
    mutationFn: (id: string) => api.post<{ success: boolean; message: string }>(`/providers/keys/${id}/test`),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['provider-keys'] });
      setTestMessage(data.message);
      setTestingId(null);
    },
    onError: (error) => {
      setTestMessage(error instanceof Error ? error.message : 'Connection test failed');
      setTestingId(null);
    },
  });

  const groupedProviders = registry?.reduce((acc: Record<string, any[]>, p: any) => {
    if (!acc[p.category]) acc[p.category] = [];
    acc[p.category].push(p);
    return acc;
  }, {} as Record<string, any[]>) || {};

  const configuredKeys = keys?.length || 0;
  const testedKeys = keys?.filter((key: any) => key.lastTestStatus === true).length || 0;
  const connectedAccounts = accounts?.filter((account: any) => account.isActive).length || 0;
  const registryCount = registry?.length || 0;
  const connectedPlatform = searchParams.get('connected');
  const oauthError = searchParams.get('error');

  const handleConnect = (platform: string) => {
    const token = localStorage.getItem('agentos-token');
    window.location.href = `${API_URL}/integrations/oauth/${platform}/connect?token=${token}`;
  };

  return (
    <div className="space-y-8 pb-6">
      {connectedPlatform ? (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800">
          {connectedPlatform} connected successfully. If the card still looks stale, refresh the page once.
        </div>
      ) : null}
      {oauthError ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
          OAuth connection failed: {oauthError}
        </div>
      ) : null}

      <section className="surface-glow animate-fade-up relative overflow-hidden rounded-[2rem] border border-white/60 bg-slate-950 px-6 py-7 text-white shadow-2xl sm:px-8 sm:py-8">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,0.34),transparent_24%),radial-gradient(circle_at_85%_20%,rgba(20,184,166,0.28),transparent_30%),linear-gradient(135deg,rgba(15,23,42,0.98),rgba(30,41,59,0.96)_34%,rgba(37,99,235,0.88),rgba(15,118,110,0.78))]" />
        <div className="absolute right-0 top-0 h-52 w-52 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute bottom-0 left-1/3 h-36 w-36 rounded-full bg-cyan-300/20 blur-3xl" />

        <div className="relative z-10 grid gap-8 xl:grid-cols-[minmax(0,1.5fr)_360px]">
          <div className="space-y-6">
            <div className="flex flex-wrap items-center gap-2">
              <Badge className="border-white/10 bg-white/12 px-3 py-1 text-white backdrop-blur-sm">
                <Sparkles className="mr-1.5 h-3 w-3" />
                Integration control plane
              </Badge>
              <Badge className="border-white/10 bg-white/12 px-3 py-1 text-white backdrop-blur-sm">
                {registryCount} providers in registry
              </Badge>
            </div>

            <div className="max-w-3xl space-y-4">
              <h1 className="text-3xl font-semibold tracking-tight sm:text-5xl">Connect providers and platforms from one operational hub.</h1>
              <p className="max-w-2xl text-base leading-7 text-slate-200 sm:text-lg">
                Keep API keys, test health, and social OAuth connections visible in the same place so the rest of AgentOS stays ready to run.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border border-white/12 bg-white/10 p-4 backdrop-blur-sm">
                <p className="text-xs uppercase tracking-[0.22em] text-slate-300">Configured keys</p>
                <p className="mt-2 text-3xl font-semibold text-white">{configuredKeys}</p>
                <p className="mt-1 text-sm text-slate-200">Provider credentials saved in the workspace.</p>
              </div>
              <div className="rounded-2xl border border-white/12 bg-white/10 p-4 backdrop-blur-sm">
                <p className="text-xs uppercase tracking-[0.22em] text-slate-300">Healthy keys</p>
                <p className="mt-2 text-3xl font-semibold text-white">{testedKeys}</p>
                <p className="mt-1 text-sm text-slate-200">Most recent successful connection tests.</p>
              </div>
              <div className="rounded-2xl border border-white/12 bg-white/10 p-4 backdrop-blur-sm">
                <p className="text-xs uppercase tracking-[0.22em] text-slate-300">Social accounts</p>
                <p className="mt-2 text-3xl font-semibold text-white">{connectedAccounts}</p>
                <p className="mt-1 text-sm text-slate-200">Active connected channels for publishing flows.</p>
              </div>
            </div>
          </div>

          <div className="rounded-[1.75rem] border border-white/12 bg-white/10 p-5 backdrop-blur-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-100">Readiness signals</p>
                <p className="text-xs text-slate-300">Quick operational cues for the integration layer.</p>
              </div>
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/12">
                <Shield className="h-5 w-5 text-cyan-200" />
              </div>
            </div>

            <div className="mt-5 space-y-3">
              <div className="rounded-[1.35rem] border border-white/12 bg-white/8 p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-slate-300">Keys</p>
                <p className="mt-2 text-sm leading-6 text-slate-100">
                  {configuredKeys === 0
                    ? 'No provider keys configured yet. Add at least one to unlock model-backed workflows.'
                    : `${configuredKeys} key${configuredKeys === 1 ? '' : 's'} configured, with ${testedKeys} recently verified.`}
                </p>
              </div>
              <div className="rounded-[1.35rem] border border-white/12 bg-white/8 p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-slate-300">OAuth</p>
                <p className="mt-2 text-sm leading-6 text-slate-100">
                  {connectedAccounts === 0
                    ? 'No active social accounts are connected yet. Social publishing will stay gated until OAuth is completed.'
                    : `${connectedAccounts} active social account${connectedAccounts === 1 ? '' : 's'} connected for distribution flows.`}
                </p>
              </div>
              <div className="rounded-[1.35rem] border border-white/12 bg-black/15 p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-slate-300">Best next step</p>
                <p className="mt-2 text-sm leading-6 text-slate-100">
                  Start by adding and testing your core provider keys, then connect social platforms so creative and publishing workspaces become fully live.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Tabs defaultValue="providers" className="space-y-6">
        <TabsList className="h-auto rounded-2xl border border-slate-200/70 bg-white/80 p-1.5 shadow-sm backdrop-blur">
          <TabsTrigger value="providers" className="rounded-xl px-4 py-2.5 data-[state=active]:bg-slate-950 data-[state=active]:text-white">
            <Key className="mr-2 h-4 w-4" /> API Providers
          </TabsTrigger>
          <TabsTrigger value="social" className="rounded-xl px-4 py-2.5 data-[state=active]:bg-slate-950 data-[state=active]:text-white">
            <Globe className="mr-2 h-4 w-4" /> Social Platforms
          </TabsTrigger>
        </TabsList>

        {/* API Providers Tab */}
        <TabsContent value="providers" className="space-y-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold text-slate-950">Provider credentials</h2>
              <p className="text-sm text-slate-500">Manage API keys, connection tests, and provider availability.</p>
            </div>
            <Dialog open={addKeyOpen} onOpenChange={setAddKeyOpen}>
              <DialogTrigger asChild>
                <Button className="rounded-2xl bg-[linear-gradient(135deg,#2563eb,#1d4ed8,#0f766e)] text-white hover:brightness-110">
                  <Plus className="mr-2 h-4 w-4" /> Add API Key
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add API Key</DialogTitle>
                  <DialogDescription>Add an API key for a provider to enable its features.</DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Provider</Label>
                    <select
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      value={newKey.providerSlug}
                      onChange={(e) => setNewKey({ ...newKey, providerSlug: e.target.value })}
                    >
                      <option value="">Select a provider...</option>
                      {registry?.map((p: any) => (
                        <option key={p.slug} value={p.slug}>{p.name} ({p.category})</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label>Label</Label>
                    <Input
                      placeholder="e.g., Production Key"
                      value={newKey.label}
                      onChange={(e) => setNewKey({ ...newKey, label: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>API Key</Label>
                    <Input
                      type="password"
                      placeholder="sk-..."
                      value={newKey.apiKey}
                      onChange={(e) => setNewKey({ ...newKey, apiKey: e.target.value })}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setAddKeyOpen(false)}>Cancel</Button>
                  <Button
                    onClick={() => addKeyMutation.mutate(newKey)}
                    disabled={!newKey.providerSlug || !newKey.label || !newKey.apiKey || addKeyMutation.isPending}
                  >
                    {addKeyMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                    Add Key
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          {/* Existing Keys */}
          {keys && keys.length > 0 && (
            <Card className="surface-glow overflow-hidden border-white/70 bg-white/92 shadow-lg">
              <CardHeader className="border-b border-slate-100">
                <CardTitle className="text-lg">Configured provider keys</CardTitle>
                <CardDescription>Test, review, and remove credentials without leaving the hub.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {keys.map((key: any) => {
                    const provider = registry?.find((p: any) => p.slug === key.providerSlug);
                    return (
                      <div key={key.id} className="flex items-center gap-4 rounded-[1.4rem] border border-slate-200 bg-slate-50/80 p-4">
                        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-900 text-white">
                          <Key className="h-4 w-4" />
                        </div>
                        <div className="flex-1">
                          <p className="font-medium">{key.label}</p>
                          <p className="text-sm text-muted-foreground">{provider?.name || key.providerSlug}</p>
                        </div>
                        {key.lastTestStatus === true && (
                          <Badge variant="success"><CheckCircle2 className="mr-1 h-3 w-3" /> Connected</Badge>
                        )}
                        {key.lastTestStatus === false && (
                          <Badge variant="destructive"><XCircle className="mr-1 h-3 w-3" /> Failed</Badge>
                        )}
                        {key.lastTestStatus === null && (
                          <Badge variant="secondary">Not tested</Badge>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => { setTestMessage(null); setTestingId(key.id); testKeyMutation.mutate(key.id); }}
                          disabled={testingId === key.id}
                        >
                          {testingId === key.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <TestTube className="h-4 w-4" />}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteKeyMutation.mutate(key.id)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                        {testingId === key.id ? null : testMessage ? (
                          <span className="max-w-56 truncate text-xs text-slate-500">{testMessage}</span>
                        ) : null}
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Provider Categories */}
          {Object.entries(groupedProviders).map(([category, providers]) => (
            <div key={category} className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">{category}</h3>
                <Badge variant="outline" className="rounded-full border-slate-300 bg-white text-slate-600">
                  {(providers as any[]).length} provider{(providers as any[]).length === 1 ? '' : 's'}
                </Badge>
              </div>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {(providers as any[]).map((provider: any) => {
                  const hasKey = keys?.some((k: any) => k.providerSlug === provider.slug);
                  return (
                    <Card key={provider.slug} className={`overflow-hidden bg-white/90 ${hasKey ? 'border-emerald-300 shadow-md' : 'border-slate-200'}`}>
                      <CardContent className="space-y-4 p-5">
                        <div className="flex items-start justify-between gap-3">
                          <div className="space-y-1">
                            <p className="font-medium">{provider.name}</p>
                            <p className="text-sm text-muted-foreground">{provider.description}</p>
                          </div>
                          {hasKey ? (
                            <Badge variant="success" className="text-[10px]">Active</Badge>
                          ) : (
                            <Badge variant="outline" className="text-[10px]">Not configured</Badge>
                          )}
                        </div>
                        <div className="rounded-2xl bg-slate-50 px-3 py-3 text-xs text-slate-500">
                          {hasKey ? 'A credential already exists for this provider.' : 'Add a key to make this provider available to the workspace.'}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          ))}
        </TabsContent>

        {/* Social Platforms Tab */}
        <TabsContent value="social" className="space-y-6">
          <div>
            <h2 className="text-xl font-semibold text-slate-950">Social connections</h2>
            <p className="text-sm text-slate-500">Manage OAuth account links for publishing and reporting workflows.</p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Object.entries(platformInfo).map(([platform, info]) => {
              const connectedAccounts = accounts?.filter((a: any) => a.platform === platform && a.isActive) || [];
              return (
                <Card key={platform} className="overflow-hidden border-slate-200 bg-white/92">
                  <CardContent className="space-y-4 p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <div className={`flex h-11 w-11 rounded-2xl ${info.color} items-center justify-center`}>
                        <Globe className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <p className="font-semibold">{info.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {connectedAccounts.length > 0
                            ? `${connectedAccounts.length} account(s) connected`
                            : 'Not connected'}
                        </p>
                      </div>
                    </div>

                    <div className="rounded-2xl bg-slate-50 px-3 py-3 text-sm text-slate-600">
                      {info.note}
                    </div>

                    {connectedAccounts.map((account: any) => (
                      <div key={account.id} className="mb-2 flex items-center justify-between rounded-xl bg-muted/50 p-3 text-sm">
                        <span>{account.accountName}</span>
                        <Button variant="ghost" size="sm" className="h-7 text-xs text-destructive">
                          <Unlink className="mr-1 h-3 w-3" /> Disconnect
                        </Button>
                      </div>
                    ))}

                    <Button
                      variant={connectedAccounts.length > 0 ? 'outline' : 'default'}
                      className="mt-2 w-full rounded-2xl"
                      size="sm"
                      onClick={() => handleConnect(platform)}
                    >
                      <LinkIcon className="mr-2 h-4 w-4" />
                      {connectedAccounts.length > 0 ? 'Add Another Account' : 'Connect'}
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Ads Platforms (Scaffold) */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Advertising Platforms</h3>
              <Badge variant="outline" className="rounded-full border-slate-300 bg-white text-slate-600">Phase 2</Badge>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {[
                { name: 'Google Ads', slug: 'google_ads' },
                { name: 'Meta Ads', slug: 'meta_ads' },
                { name: 'LinkedIn Ads', slug: 'linkedin_ads' },
                { name: 'TikTok Ads', slug: 'tiktok_ads' },
                { name: 'X Ads', slug: 'x_ads' },
              ].map((adsPlatform) => (
                <Card key={adsPlatform.slug} className="border-slate-200 bg-white/80 opacity-80">
                  <CardContent className="space-y-4 p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="flex h-11 w-11 rounded-2xl bg-muted items-center justify-center">
                        <Globe className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="font-semibold">{adsPlatform.name}</p>
                        <p className="text-xs text-muted-foreground">Coming soon</p>
                      </div>
                    </div>
                    <div className="rounded-2xl bg-slate-50 px-3 py-3 text-sm text-slate-600">
                      Paid media integrations will live alongside organic channels once the ad management surface is ready.
                    </div>
                    <Button variant="outline" className="w-full rounded-2xl" size="sm" disabled>
                      Connect (Phase 2)
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
