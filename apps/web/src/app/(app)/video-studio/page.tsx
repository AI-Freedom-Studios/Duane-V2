'use client';

import { useQuery, useMutation } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Video,
  Play,
  Upload,
  Wand2,
  Clock,
  Film,
  Settings,
  Sparkles,
  Loader2,
  Zap,
  Globe,
  CheckCircle2,
} from 'lucide-react';
import { useState } from 'react';

const poeVideoModels = [
  { id: 'sora-2', name: 'Sora 2', provider: 'OpenAI', quality: '8K', badge: 'Top Pick', badgeColor: 'bg-yellow-500' },
  { id: 'veo-3', name: 'Veo 3', provider: 'Google', quality: '4K', badge: 'New', badgeColor: 'bg-green-500' },
  { id: 'kling-1.6', name: 'Kling 1.6', provider: 'Kuaishou', quality: '4K', badge: 'Popular', badgeColor: 'bg-blue-500' },
  { id: 'runway-gen3', name: 'Runway Gen-3', provider: 'Runway', quality: '4K', badge: null, badgeColor: '' },
  { id: 'minimax-video', name: 'MiniMax Video', provider: 'MiniMax', quality: '1080p', badge: 'Fast', badgeColor: 'bg-purple-500' },
  { id: 'pika-2.0', name: 'Pika 2.0', provider: 'Pika', quality: '1080p', badge: null, badgeColor: '' },
  { id: 'luma-dream-machine', name: 'Dream Machine', provider: 'Luma Labs', quality: '1080p', badge: null, badgeColor: '' },
  { id: 'stable-video-diffusion', name: 'Stable Video', provider: 'Stability', quality: '1080p', badge: 'Open Source', badgeColor: 'bg-orange-500' },
];

const recentVideos = [
  { title: 'Product Launch Teaser', duration: '0:30', model: 'Sora 2', status: 'completed', createdAt: '2 hours ago' },
  { title: 'Brand Story - Episode 1', duration: '1:00', model: 'Veo 3', status: 'processing', createdAt: '5 hours ago' },
  { title: 'Social Ad Variant A', duration: '0:15', model: 'Kling 1.6', status: 'completed', createdAt: '1 day ago' },
  { title: 'Tutorial Intro', duration: '0:10', model: 'Runway Gen-3', status: 'completed', createdAt: '2 days ago' },
];

export default function VideoStudioPage() {
  const [prompt, setPrompt] = useState('');
  const [selectedModel, setSelectedModel] = useState('sora-2');
  const [duration, setDuration] = useState('4');
  const [resolution, setResolution] = useState('1280x720');
  const [isGenerating, setIsGenerating] = useState(false);

  const generateMutation = useMutation({
    mutationFn: (data: { model: string; prompt: string; duration: number; resolution: string }) =>
      api.post('/poe/video/generate', data),
    onMutate: () => setIsGenerating(true),
    onSettled: () => setIsGenerating(false),
  });

  const selectedModelInfo = poeVideoModels.find((m) => m.id === selectedModel);

  return (
    <div className="space-y-8">
      {/* Hero Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-violet-600 via-purple-600 to-pink-500 p-8 text-white">
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-2">
            <Badge className="bg-white/20 text-white border-0 gap-1">
              <Zap className="h-3 w-3" /> Powered by Poe.com API
            </Badge>
            <Badge className="bg-white/20 text-white border-0">600+ AI Models</Badge>
          </div>
          <h1 className="text-3xl font-bold">AI Video Studio</h1>
          <p className="mt-2 text-white/80 max-w-2xl">
            Create stunning videos with the world&apos;s best AI models — Sora 2, Veo 3, Kling, Runway, and more — all through a single Poe.com API key.
          </p>
        </div>
        <div className="absolute right-8 top-1/2 -translate-y-1/2 opacity-10">
          <Video className="h-40 w-40" />
        </div>
      </div>

      <Tabs defaultValue="create" className="space-y-6">
        <TabsList>
          <TabsTrigger value="create"><Wand2 className="mr-2 h-4 w-4" /> Create</TabsTrigger>
          <TabsTrigger value="library"><Film className="mr-2 h-4 w-4" /> Library</TabsTrigger>
          <TabsTrigger value="models"><Globe className="mr-2 h-4 w-4" /> Models</TabsTrigger>
        </TabsList>

        {/* Create Tab */}
        <TabsContent value="create" className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2 space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Generate Video</CardTitle>
                  <CardDescription>Describe your video and select an AI model to generate it via Poe</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Video Prompt</Label>
                    <Textarea
                      placeholder="Describe the video you want to create... e.g., 'A cinematic shot of a sunrise over mountains with fog rolling through the valleys, drone footage, 4K quality'"
                      rows={4}
                      value={prompt}
                      onChange={(e) => setPrompt(e.target.value)}
                    />
                  </div>

                  {/* Model Selector - Grid */}
                  <div className="space-y-2">
                    <Label>AI Model</Label>
                    <div className="grid gap-2 sm:grid-cols-2">
                      {poeVideoModels.map((model) => (
                        <button
                          key={model.id}
                          type="button"
                          onClick={() => setSelectedModel(model.id)}
                          className={`flex items-center gap-3 rounded-xl border p-3 text-left transition-all ${
                            selectedModel === model.id
                              ? 'border-primary bg-primary/5 ring-1 ring-primary'
                              : 'hover:bg-accent/50'
                          }`}
                        >
                          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 text-white text-xs font-bold">
                            {model.name.slice(0, 2).toUpperCase()}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="font-semibold text-sm">{model.name}</p>
                              {model.badge && (
                                <span className={`text-[10px] px-1.5 py-0.5 rounded-full text-white ${model.badgeColor}`}>
                                  {model.badge}
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground">{model.provider} &middot; {model.quality}</p>
                          </div>
                          {selectedModel === model.id && (
                            <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
                          )}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Duration</Label>
                      <select
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                        value={duration}
                        onChange={(e) => setDuration(e.target.value)}
                      >
                        <option value="4">4 seconds</option>
                        <option value="8">8 seconds</option>
                        <option value="16">16 seconds</option>
                        <option value="30">30 seconds</option>
                        <option value="60">60 seconds</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <Label>Resolution</Label>
                      <select
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                        value={resolution}
                        onChange={(e) => setResolution(e.target.value)}
                      >
                        <option value="1280x720">720p (1280x720)</option>
                        <option value="1920x1080">1080p (1920x1080)</option>
                        <option value="2560x1440">1440p (2560x1440)</option>
                        <option value="3840x2160">4K (3840x2160)</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Reference Image (optional)</Label>
                    <div className="flex items-center justify-center rounded-lg border-2 border-dashed p-6">
                      <div className="text-center">
                        <Upload className="mx-auto h-8 w-8 text-muted-foreground" />
                        <p className="mt-2 text-sm text-muted-foreground">Drag & drop or click to upload</p>
                      </div>
                    </div>
                  </div>

                  <Button
                    className="w-full bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700"
                    size="lg"
                    disabled={!prompt || isGenerating}
                    onClick={() =>
                      generateMutation.mutate({
                        model: selectedModel,
                        prompt,
                        duration: parseInt(duration),
                        resolution,
                      })
                    }
                  >
                    {isGenerating ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Sparkles className="mr-2 h-4 w-4" />
                    )}
                    {isGenerating ? 'Generating...' : 'Generate Video'}
                  </Button>
                </CardContent>
              </Card>
            </div>

            <div className="space-y-4">
              <h3 className="font-semibold">Preview</h3>
              <Card>
                <CardContent className="flex aspect-video items-center justify-center rounded-lg bg-muted/50 p-6">
                  <div className="text-center">
                    <Video className="mx-auto h-12 w-12 text-muted-foreground/50" />
                    <p className="mt-2 text-sm text-muted-foreground">Video preview will appear here</p>
                  </div>
                </CardContent>
              </Card>

              <h3 className="font-semibold">Generation Settings</h3>
              <Card>
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Model</span>
                    <span className="font-medium">{selectedModelInfo?.name}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Provider</span>
                    <span>{selectedModelInfo?.provider}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Resolution</span>
                    <span>{resolution}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Duration</span>
                    <span>{duration}s</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Quality</span>
                    <span>{selectedModelInfo?.quality}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">API</span>
                    <Badge variant="outline" className="text-[10px] gap-1"><Zap className="h-2.5 w-2.5" /> Poe.com</Badge>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* Library Tab */}
        <TabsContent value="library" className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {recentVideos.map((video, i) => (
              <Card key={i}>
                <CardContent className="p-0">
                  <div className="relative aspect-video bg-muted flex items-center justify-center rounded-t-xl">
                    <Play className="h-10 w-10 text-muted-foreground/50" />
                    <Badge
                      variant={video.status === 'completed' ? 'success' : 'warning'}
                      className="absolute right-2 top-2 text-[10px]"
                    >
                      {video.status}
                    </Badge>
                  </div>
                  <div className="p-4">
                    <p className="font-medium">{video.title}</p>
                    <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {video.duration}</span>
                      <span>{video.model}</span>
                      <span>{video.createdAt}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Models Tab */}
        <TabsContent value="models" className="space-y-6">
          <Card className="border-0 bg-gradient-to-r from-violet-50 to-purple-50 dark:from-violet-950/30 dark:to-purple-950/30">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 text-white">
                  <Zap className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="font-bold text-lg">Powered by Poe.com API</h3>
                  <p className="text-sm text-muted-foreground">Access 600+ AI models with a single API key. All video models below are available through your Poe subscription.</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {poeVideoModels.map((model) => (
              <Card key={model.id} className="overflow-hidden">
                <CardContent className="p-5">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 text-white text-xs font-bold">
                      {model.name.slice(0, 2).toUpperCase()}
                    </div>
                    {model.badge && (
                      <span className={`text-[10px] px-2 py-0.5 rounded-full text-white ${model.badgeColor}`}>
                        {model.badge}
                      </span>
                    )}
                  </div>
                  <p className="font-bold">{model.name}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{model.provider}</p>
                  <div className="mt-3 flex items-center gap-2">
                    <Badge variant="outline" className="text-[10px]">{model.quality}</Badge>
                    <Badge variant="outline" className="text-[10px]">Video</Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
