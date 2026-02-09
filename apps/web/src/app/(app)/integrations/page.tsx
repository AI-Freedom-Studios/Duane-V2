'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
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
} from 'lucide-react';
import { useState } from 'react';

const platformInfo: Record<string, { name: string; color: string }> = {
  meta: { name: 'Meta (Facebook/Instagram)', color: 'bg-blue-500' },
  linkedin: { name: 'LinkedIn', color: 'bg-blue-700' },
  youtube: { name: 'YouTube', color: 'bg-red-500' },
  tiktok: { name: 'TikTok', color: 'bg-black dark:bg-white' },
  x: { name: 'X (Twitter)', color: 'bg-black dark:bg-white' },
};

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export default function IntegrationsPage() {
  const queryClient = useQueryClient();
  const [addKeyOpen, setAddKeyOpen] = useState(false);
  const [newKey, setNewKey] = useState({ providerSlug: '', label: '', apiKey: '' });
  const [testingId, setTestingId] = useState<string | null>(null);

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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['provider-keys'] });
      setTestingId(null);
    },
    onError: () => setTestingId(null),
  });

  const groupedProviders = registry?.reduce((acc: Record<string, any[]>, p: any) => {
    if (!acc[p.category]) acc[p.category] = [];
    acc[p.category].push(p);
    return acc;
  }, {} as Record<string, any[]>) || {};

  const handleConnect = (platform: string) => {
    const token = localStorage.getItem('agentos-token');
    window.location.href = `${API_URL}/integrations/oauth/${platform}/connect?token=${token}`;
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Integrations Hub</h1>
          <p className="text-muted-foreground">Manage API providers and social platform connections</p>
        </div>
      </div>

      <Tabs defaultValue="providers" className="space-y-6">
        <TabsList>
          <TabsTrigger value="providers">
            <Key className="mr-2 h-4 w-4" /> API Providers
          </TabsTrigger>
          <TabsTrigger value="social">
            <Globe className="mr-2 h-4 w-4" /> Social Platforms
          </TabsTrigger>
        </TabsList>

        {/* API Providers Tab */}
        <TabsContent value="providers" className="space-y-6">
          <div className="flex justify-end">
            <Dialog open={addKeyOpen} onOpenChange={setAddKeyOpen}>
              <DialogTrigger asChild>
                <Button><Plus className="mr-2 h-4 w-4" /> Add API Key</Button>
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
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Your API Keys</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {keys.map((key: any) => {
                    const provider = registry?.find((p: any) => p.slug === key.providerSlug);
                    return (
                      <div key={key.id} className="flex items-center gap-4 rounded-lg border p-4">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
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
                          onClick={() => { setTestingId(key.id); testKeyMutation.mutate(key.id); }}
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
              <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">{category}</h3>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {(providers as any[]).map((provider: any) => {
                  const hasKey = keys?.some((k: any) => k.providerSlug === provider.slug);
                  return (
                    <Card key={provider.slug} className={hasKey ? 'border-primary/30' : ''}>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">{provider.name}</p>
                            <p className="text-xs text-muted-foreground">{provider.description}</p>
                          </div>
                          {hasKey ? (
                            <Badge variant="success" className="text-[10px]">Active</Badge>
                          ) : (
                            <Badge variant="outline" className="text-[10px]">Not configured</Badge>
                          )}
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
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Object.entries(platformInfo).map(([platform, info]) => {
              const connectedAccounts = accounts?.filter((a: any) => a.platform === platform && a.isActive) || [];
              return (
                <Card key={platform}>
                  <CardContent className="p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <div className={`h-10 w-10 rounded-lg ${info.color} flex items-center justify-center`}>
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

                    {connectedAccounts.map((account: any) => (
                      <div key={account.id} className="mb-2 flex items-center justify-between rounded-md bg-muted/50 p-2 text-sm">
                        <span>{account.accountName}</span>
                        <Button variant="ghost" size="sm" className="h-7 text-xs text-destructive">
                          <Unlink className="mr-1 h-3 w-3" /> Disconnect
                        </Button>
                      </div>
                    ))}

                    <Button
                      variant={connectedAccounts.length > 0 ? 'outline' : 'default'}
                      className="w-full mt-2"
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
            <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Advertising Platforms</h3>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {[
                { name: 'Google Ads', slug: 'google_ads' },
                { name: 'Meta Ads', slug: 'meta_ads' },
                { name: 'LinkedIn Ads', slug: 'linkedin_ads' },
                { name: 'TikTok Ads', slug: 'tiktok_ads' },
                { name: 'X Ads', slug: 'x_ads' },
              ].map((adsPlatform) => (
                <Card key={adsPlatform.slug} className="opacity-75">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center">
                        <Globe className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="font-semibold">{adsPlatform.name}</p>
                        <p className="text-xs text-muted-foreground">Coming soon</p>
                      </div>
                    </div>
                    <Button variant="outline" className="w-full" size="sm" disabled>
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
