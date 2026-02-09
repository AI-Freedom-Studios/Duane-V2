'use client';

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
} from 'lucide-react';
import { useState } from 'react';

const videoProviders = [
  { name: 'Runway', slug: 'runway', description: 'Gen-2 video generation', status: 'available' },
  { name: 'Replicate', slug: 'replicate', description: 'Open-source models', status: 'available' },
  { name: 'Stability AI', slug: 'stability', description: 'Stable Video Diffusion', status: 'available' },
  { name: 'Pika', slug: 'pika', description: 'AI video creation', status: 'coming_soon' },
  { name: 'HeyGen', slug: 'heygen', description: 'AI avatar videos', status: 'coming_soon' },
];

const recentVideos = [
  { title: 'Product Launch Teaser', duration: '0:30', provider: 'Runway', status: 'completed', createdAt: '2 hours ago' },
  { title: 'Brand Story - Episode 1', duration: '1:00', provider: 'Replicate', status: 'processing', createdAt: '5 hours ago' },
  { title: 'Social Ad Variant A', duration: '0:15', provider: 'Stability', status: 'completed', createdAt: '1 day ago' },
];

export default function VideoStudioPage() {
  const [prompt, setPrompt] = useState('');
  const [selectedProvider, setSelectedProvider] = useState('runway');

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Video Studio</h1>
        <p className="text-muted-foreground">Create AI-powered videos using multiple providers</p>
      </div>

      <Tabs defaultValue="create" className="space-y-6">
        <TabsList>
          <TabsTrigger value="create"><Wand2 className="mr-2 h-4 w-4" /> Create</TabsTrigger>
          <TabsTrigger value="library"><Film className="mr-2 h-4 w-4" /> Library</TabsTrigger>
          <TabsTrigger value="providers"><Settings className="mr-2 h-4 w-4" /> Providers</TabsTrigger>
        </TabsList>

        <TabsContent value="create" className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2 space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Generate Video</CardTitle>
                  <CardDescription>Describe your video and select a provider to generate it</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Video Prompt</Label>
                    <Textarea
                      placeholder="Describe the video you want to create... e.g., 'A cinematic shot of a sunrise over mountains with fog rolling through the valleys'"
                      rows={4}
                      value={prompt}
                      onChange={(e) => setPrompt(e.target.value)}
                    />
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Provider</Label>
                      <select
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                        value={selectedProvider}
                        onChange={(e) => setSelectedProvider(e.target.value)}
                      >
                        {videoProviders
                          .filter((p) => p.status === 'available')
                          .map((p) => (
                            <option key={p.slug} value={p.slug}>{p.name}</option>
                          ))}
                      </select>
                    </div>
                    <div className="space-y-2">
                      <Label>Duration</Label>
                      <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                        <option value="4">4 seconds</option>
                        <option value="8">8 seconds</option>
                        <option value="16">16 seconds</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Reference Image (optional)</Label>
                    <div className="flex items-center justify-center rounded-lg border-2 border-dashed p-8">
                      <div className="text-center">
                        <Upload className="mx-auto h-8 w-8 text-muted-foreground" />
                        <p className="mt-2 text-sm text-muted-foreground">Drag & drop or click to upload</p>
                      </div>
                    </div>
                  </div>

                  <Button className="w-full" size="lg" disabled={!prompt}>
                    <Sparkles className="mr-2 h-4 w-4" /> Generate Video
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
                    <span className="text-muted-foreground">Resolution</span>
                    <span>1280x768</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">FPS</span>
                    <span>24</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Seed</span>
                    <span>Random</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

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
                      <span>{video.provider}</span>
                      <span>{video.createdAt}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="providers" className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {videoProviders.map((provider) => (
              <Card key={provider.slug}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-2">
                    <p className="font-semibold">{provider.name}</p>
                    <Badge variant={provider.status === 'available' ? 'success' : 'secondary'}>
                      {provider.status === 'available' ? 'Available' : 'Coming Soon'}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{provider.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
