'use client';

import { useMutation } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import {
  CheckCircle2,
  Download,
  Film,
  Globe,
  Loader2,
  Play,
  Sparkles,
  Upload,
  Video,
  Wand2,
  Zap,
} from 'lucide-react';

const poeVideoModels = [
  { id: 'sora-2', name: 'Sora 2', provider: 'OpenAI', quality: '8K', badge: 'Top Pick', badgeColor: 'bg-amber-500' },
  { id: 'veo-3', name: 'Veo 3', provider: 'Google', quality: '4K', badge: 'New', badgeColor: 'bg-emerald-500' },
  { id: 'kling-2.1-master', name: 'Kling 2.1 Master', provider: 'Kuaishou', quality: '4K', badge: 'Popular', badgeColor: 'bg-sky-500' },
  { id: 'runway-gen-4.5', name: 'Runway Gen-4.5', provider: 'Runway', quality: '4K', badge: 'Cinematic', badgeColor: 'bg-slate-700' },
  { id: 'minimax-video', name: 'MiniMax Video', provider: 'MiniMax', quality: '1080p', badge: 'Fast', badgeColor: 'bg-violet-500' },
  { id: 'pika-2.0', name: 'Pika 2.0', provider: 'Pika', quality: '1080p', badge: null, badgeColor: '' },
  { id: 'luma-dream-machine', name: 'Dream Machine', provider: 'Luma Labs', quality: '1080p', badge: null, badgeColor: '' },
  { id: 'stable-video-diffusion', name: 'Stable Video', provider: 'Stability', quality: '1080p', badge: 'Open Source', badgeColor: 'bg-orange-500' },
  { id: 'json2video', name: 'JSON2Video', provider: 'JSON2Video', quality: 'Template', badge: 'Automation', badgeColor: 'bg-cyan-500' },
];

const quickPrompts = [
  'Create a cinematic launch teaser for a new AI product, moody lighting, bold typography, smooth camera movement.',
  'Show a founder walking through a futuristic workspace, holographic dashboards, premium brand feel, 16:9 ad format.',
  'Generate a product demo montage with macro UI shots, ambient glow, energetic cuts, and a clean tech soundtrack vibe.',
  'Produce a social ad of a creator recording in a neon studio, subtle depth of field, strong hook in the first 3 seconds.',
];

const studioSignals = [
  { label: 'Ready models', value: '8', detail: 'curated from your Poe access' },
  { label: 'Fastest turn', value: '< 2 min', detail: 'for lighter 1080p concepts' },
  { label: 'Best output', value: '8K', detail: 'with cinematic model picks' },
];

const workflowSteps = [
  'Frame the visual goal with camera style, subject, and pacing.',
  'Pick the model that matches fidelity versus speed.',
  'Export a first pass, then refine with tighter art direction.',
];

const defaultDurationOptions = [
  { value: '4', label: '4 seconds' },
  { value: '8', label: '8 seconds' },
  { value: '16', label: '16 seconds' },
  { value: '30', label: '30 seconds' },
  { value: '60', label: '60 seconds' },
];

const modelDurationOptions: Record<string, Array<{ value: string; label: string }>> = {
  'sora-2': [
    { value: '4', label: '4 seconds' },
    { value: '8', label: '8 seconds' },
    { value: '12', label: '12 seconds' },
  ],
  'veo-3': [
    { value: '4', label: '4 seconds' },
    { value: '6', label: '6 seconds' },
    { value: '8', label: '8 seconds' },
  ],
  'kling-2.1-master': [
    { value: '5', label: '5 seconds' },
    { value: '10', label: '10 seconds' },
  ],
  'runway-gen-4.5': [
    { value: '5', label: '5 seconds' },
    { value: '8', label: '8 seconds' },
    { value: '10', label: '10 seconds' },
  ],
  'minimax-video': [{ value: '6', label: '6 seconds' }],
  'pika-2.0': [
    { value: '5', label: '5 seconds' },
    { value: '10', label: '10 seconds' },
  ],
  'luma-dream-machine': [
    { value: '5', label: '5 seconds' },
    { value: '9', label: '9 seconds' },
  ],
  'stable-video-diffusion': [{ value: '18', label: '18 seconds' }],
  json2video: [
    { value: '8', label: '8 seconds' },
    { value: '15', label: '15 seconds' },
    { value: '30', label: '30 seconds' },
  ],
};

const videoLibraryStorageKey = 'agentos-video-library';

type VideoLibraryItem = {
  id: string;
  title: string;
  prompt: string;
  model: string;
  modelName: string;
  provider: string;
  status: 'processing' | 'completed' | 'failed';
  videoUrl?: string | null;
  thumbnailUrl?: string | null;
  duration?: number;
  resolution?: string;
  createdAt: string;
  error?: string | null;
};

const formatLibraryDate = (value: string) => {
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return 'Just now';
  return date.toLocaleString([], {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
};

export default function VideoStudioPage() {
  const [prompt, setPrompt] = useState('');
  const [selectedModel, setSelectedModel] = useState('sora-2');
  const [duration, setDuration] = useState('4');
  const [resolution, setResolution] = useState('1280x720');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationError, setGenerationError] = useState<string | null>(null);
  const [generatedVideo, setGeneratedVideo] = useState<any | null>(null);
  const [videoPreviewUrl, setVideoPreviewUrl] = useState<string | null>(null);
  const [videoPreviewError, setVideoPreviewError] = useState<string | null>(null);
  const [referenceImage, setReferenceImage] = useState<string | null>(null);
  const [referenceImageName, setReferenceImageName] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('create');
  const [libraryVideos, setLibraryVideos] = useState<VideoLibraryItem[]>([]);
  const [isLibraryLoaded, setIsLibraryLoaded] = useState(false);
  const readableGenerationError = generationError?.replace(
    /(\w[\w\s.-]+) generation failed\. \1 requires more Poe credits for this request\./,
    '$1 requires more Poe credits for this request.',
  );
  const selectedModelInfo = poeVideoModels.find((model) => model.id === selectedModel);
  const durationOptions = modelDurationOptions[selectedModel] || defaultDurationOptions;
  const visibleGenerationError =
    readableGenerationError && readableGenerationError.length > 260
      ? `${readableGenerationError.slice(0, 260)}...`
      : readableGenerationError;

  const upsertLibraryVideo = (video: any, fallback?: Partial<VideoLibraryItem>) => {
    const id = String(video?.id || fallback?.id || `video-${Date.now()}`);
    const nextItem: VideoLibraryItem = {
      id,
      title: fallback?.title || video?.prompt?.slice(0, 56) || prompt.slice(0, 56) || 'Untitled video',
      prompt: fallback?.prompt || video?.prompt || prompt,
      model: video?.model || fallback?.model || selectedModel,
      modelName: fallback?.modelName || selectedModelInfo?.name || video?.model || 'Video model',
      provider: fallback?.provider || selectedModelInfo?.provider || video?.provider || 'Poe',
      status: video?.status || fallback?.status || 'processing',
      videoUrl: video?.videoUrl ?? fallback?.videoUrl ?? null,
      thumbnailUrl: video?.thumbnailUrl ?? fallback?.thumbnailUrl ?? null,
      duration: video?.duration || fallback?.duration || Number(duration),
      resolution: video?.resolution || fallback?.resolution || resolution,
      createdAt: fallback?.createdAt || video?.createdAt || new Date().toISOString(),
      error: video?.error ?? fallback?.error ?? null,
    };

    setLibraryVideos((current) => {
      const existing = current.find((item) => item.id === id);
      const merged = existing ? { ...existing, ...nextItem, title: existing.title, prompt: existing.prompt } : nextItem;
      return [merged, ...current.filter((item) => item.id !== id)].slice(0, 30);
    });
  };

  const generateMutation = useMutation({
    mutationFn: (data: { model: string; prompt: string; duration: number; resolution: string; referenceImage?: string | null }) =>
      data.model === 'json2video'
        ? api.post('/json2video/video/generate', {
            prompt: data.prompt,
            duration: data.duration,
            resolution: data.resolution,
          })
        : api.post('/poe/video/generate', data),
    onMutate: () => {
      setIsGenerating(true);
      setGenerationError(null);
      setVideoPreviewUrl(null);
      setVideoPreviewError(null);
    },
    onSuccess: (data) => {
      setGeneratedVideo(data);
      upsertLibraryVideo(data, {
        title: prompt.slice(0, 56) || `${selectedModelInfo?.name || 'Video'} run`,
        prompt,
        modelName: selectedModelInfo?.name,
        provider: selectedModelInfo?.provider,
        duration: Number(duration),
        resolution,
      });
    },
    onError: (error) => {
      setGenerationError(error instanceof Error ? error.message : 'Video generation failed');
    },
    onSettled: () => setIsGenerating(false),
  });

  const handleReferenceImageChange = (file: File | null) => {
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      setReferenceImage(typeof reader.result === 'string' ? reader.result : null);
      setReferenceImageName(file.name);
      setGenerationError(null);
    };
    reader.onerror = () => setGenerationError('Unable to read reference image');
    reader.readAsDataURL(file);
  };

  const handleDownloadVideo = async (video: any = generatedVideo) => {
    if (!video?.id && !video?.videoUrl) return;
    const downloadName = `${(video?.modelName || selectedModelInfo?.name || 'generated-video').toLowerCase().replace(/\s+/g, '-')}-${Date.now()}.mp4`;

    if (video?.videoUrl && typeof video.videoUrl === 'string' && video.videoUrl.startsWith('http')) {
      try {
        const response = await fetch(video.videoUrl);

        if (!response.ok) {
          throw new Error('Unable to fetch generated video');
        }

        const responseBlob = await response.blob();
        const contentType = response.headers.get('content-type') || responseBlob.type || 'video/mp4';
        const blob = responseBlob.type ? responseBlob : new Blob([responseBlob], { type: contentType });
        const objectUrl = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = objectUrl;
        link.download = downloadName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(objectUrl);
        return;
      } catch (error) {
        setGenerationError(error instanceof Error ? error.message : 'Unable to download generated video');
        return;
      }
    }

    if (video?.videoUrl && typeof video.videoUrl === 'string') {
      const link = document.createElement('a');
      link.href = video.videoUrl;
      link.download = downloadName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      return;
    }

    try {
      const token = window.localStorage.getItem('agentos-token');
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
      const response = await fetch(`${apiUrl}/poe/videos/${video.id}/content`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      if (!response.ok) {
        throw new Error('Unable to download generated video');
      }

      const responseBlob = await response.blob();
      const contentType = response.headers.get('content-type') || responseBlob.type || 'video/mp4';
      const blob = responseBlob.type ? responseBlob : new Blob([responseBlob], { type: contentType });
      const objectUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = objectUrl;
      link.download = downloadName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(objectUrl);
    } catch (error) {
      setGenerationError(error instanceof Error ? error.message : 'Unable to download generated video');
    }
  };

  const openLibraryVideo = (video: VideoLibraryItem) => {
    setGeneratedVideo(video);
    setVideoPreviewUrl(null);
    setVideoPreviewError(null);
    setGenerationError(video.status === 'failed' ? video.error || 'Video generation failed' : null);
    setActiveTab('create');
  };

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(videoLibraryStorageKey);
      if (!stored) {
        setIsLibraryLoaded(true);
        return;
      }
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed)) {
        setLibraryVideos(parsed.filter((item) => item?.id).slice(0, 30));
      }
    } catch {
      setLibraryVideos([]);
    } finally {
      setIsLibraryLoaded(true);
    }
  }, []);

  useEffect(() => {
    if (!isLibraryLoaded) return;
    window.localStorage.setItem(videoLibraryStorageKey, JSON.stringify(libraryVideos));
  }, [isLibraryLoaded, libraryVideos]);

  useEffect(() => {
    if (!generatedVideo?.id || generatedVideo.status !== 'processing') return;

    const interval = window.setInterval(async () => {
      try {
        const statusPath = generatedVideo.provider === 'JSON2Video' || String(generatedVideo.id).startsWith('json2video-')
          ? `/json2video/videos/${generatedVideo.id}`
          : `/poe/videos/${generatedVideo.id}`;
        const next = await api.get<any>(statusPath);
        setGeneratedVideo(next);
        upsertLibraryVideo(next);
        if (next.status === 'failed') {
          setGenerationError(next.error || 'Video generation failed');
          window.clearInterval(interval);
        }
        if (next.status === 'completed') {
          window.clearInterval(interval);
        }
      } catch (error) {
        setGenerationError(error instanceof Error ? error.message : 'Video status failed');
        window.clearInterval(interval);
      }
    }, 5000);

    return () => window.clearInterval(interval);
  }, [generatedVideo?.id, generatedVideo?.status]);

  useEffect(() => {
    if (!durationOptions.some((option) => option.value === duration)) {
      setDuration(durationOptions[durationOptions.length - 1].value);
    }
  }, [duration, durationOptions]);

  useEffect(() => {
    if (selectedModel === 'minimax-video' && resolution !== '1280x720') {
      setResolution('1280x720');
    }
  }, [resolution, selectedModel]);

  useEffect(() => {
    if (!generatedVideo?.id || generatedVideo.status !== 'completed') return;
    if (videoPreviewUrl) return;

    if (generatedVideo?.videoUrl && typeof generatedVideo.videoUrl === 'string' && generatedVideo.videoUrl.startsWith('http')) {
      setVideoPreviewError(null);
      setVideoPreviewUrl(generatedVideo.videoUrl);
      return;
    }

    let objectUrl: string | null = null;

    const loadVideo = async () => {
      try {
        const token = window.localStorage.getItem('agentos-token');
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
        const response = await fetch(`${apiUrl}/poe/videos/${generatedVideo.id}/preview`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });

        if (!response.ok) {
          throw new Error('Unable to load generated video');
        }

        const responseBlob = await response.blob();
        const contentType = response.headers.get('content-type') || responseBlob.type || 'video/mp4';
        const blob = responseBlob.type ? responseBlob : new Blob([responseBlob], { type: contentType });
        objectUrl = URL.createObjectURL(blob);
        setVideoPreviewError(null);
        setVideoPreviewUrl(objectUrl);
      } catch (error) {
        setVideoPreviewError(error instanceof Error ? error.message : 'Unable to load generated video');
      }
    };

    void loadVideo();

    return () => {
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [generatedVideo?.id, generatedVideo?.status, videoPreviewUrl]);

  return (
    <div className="space-y-8 pb-6">
      <section className="surface-glow animate-fade-up relative overflow-hidden rounded-[2rem] border border-white/60 bg-slate-950 px-6 py-7 text-white shadow-2xl sm:px-8 sm:py-8">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(56,189,248,0.3),transparent_26%),radial-gradient(circle_at_85%_20%,rgba(168,85,247,0.35),transparent_28%),linear-gradient(135deg,rgba(15,23,42,0.98),rgba(29,78,216,0.82)_42%,rgba(124,58,237,0.9))]" />
        <div className="absolute -right-10 top-8 h-48 w-48 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute bottom-0 left-1/3 h-32 w-32 rounded-full bg-cyan-300/20 blur-3xl" />
        <div className="relative z-10 grid gap-8 xl:grid-cols-[minmax(0,1.55fr)_340px]">
          <div className="space-y-6">
            <div className="flex flex-wrap items-center gap-2">
              <Badge className="border-white/15 bg-white/12 px-3 py-1 text-white backdrop-blur-sm">
                <Zap className="mr-1.5 h-3 w-3" />
                Poe video workspace
              </Badge>
              <Badge className="border-white/15 bg-white/12 px-3 py-1 text-white backdrop-blur-sm">
                600+ AI models
              </Badge>
            </div>

            <div className="max-w-3xl space-y-4">
              <h1 className="text-3xl font-semibold tracking-tight sm:text-5xl">
                Build launch-ready AI videos from one studio rail.
              </h1>
              <p className="max-w-2xl text-base leading-7 text-slate-200 sm:text-lg">
                Move from prompt to polished concept with a calmer workflow: sharper model picking, cleaner generation controls,
                and a preview rail that keeps the current shot plan visible.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              {studioSignals.map((signal) => (
                <div
                  key={signal.label}
                  className="rounded-2xl border border-white/12 bg-white/10 p-4 backdrop-blur-sm"
                >
                  <p className="text-xs uppercase tracking-[0.24em] text-slate-300">{signal.label}</p>
                  <p className="mt-2 text-2xl font-semibold text-white">{signal.value}</p>
                  <p className="mt-1 text-sm text-slate-200">{signal.detail}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[1.75rem] border border-white/14 bg-white/10 p-5 backdrop-blur-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-100">Live shot brief</p>
                <p className="text-xs text-slate-300">Current scene recipe for the selected run.</p>
              </div>
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/14">
                <Video className="h-5 w-5 text-cyan-200" />
              </div>
            </div>

            <div className="mt-5 space-y-4">
              <div className="aspect-video overflow-hidden rounded-[1.5rem] border border-white/10 bg-[linear-gradient(135deg,rgba(15,23,42,0.96),rgba(37,99,235,0.55),rgba(168,85,247,0.72))] p-5">
                <div className="flex h-full flex-col justify-between rounded-[1.15rem] border border-white/10 bg-black/15 p-4">
                  <div className="flex items-center justify-between">
                    <Badge className="border-0 bg-emerald-400/15 text-emerald-100">Scene planning</Badge>
                    <span className="text-xs uppercase tracking-[0.28em] text-slate-200">Preview rail</span>
                  </div>
                  <div>
                    <p className="text-lg font-semibold text-white">
                      {prompt ? prompt.slice(0, 92) : 'Your next concept will show up here once the brief is written.'}
                      {prompt.length > 92 ? '...' : ''}
                    </p>
                    <div className="mt-4 flex flex-wrap gap-2 text-xs text-slate-100">
                      <span className="rounded-full bg-white/12 px-3 py-1">{selectedModelInfo?.name}</span>
                      <span className="rounded-full bg-white/12 px-3 py-1">{resolution}</span>
                      <span className="rounded-full bg-white/12 px-3 py-1">{duration}s runtime</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid gap-2.5">
                {workflowSteps.map((step, index) => (
                  <div key={step} className="flex items-start gap-3 rounded-2xl border border-white/10 bg-white/8 px-3 py-3">
                    <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white/16 text-xs font-semibold">
                      {index + 1}
                    </div>
                    <p className="text-sm leading-6 text-slate-100">{step}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="h-auto rounded-2xl border border-slate-200/70 bg-white/80 p-1.5 shadow-sm backdrop-blur">
          <TabsTrigger value="create" className="rounded-xl px-4 py-2.5 data-[state=active]:bg-slate-950 data-[state=active]:text-white">
            <Wand2 className="mr-2 h-4 w-4" />
            Create
          </TabsTrigger>
          <TabsTrigger value="library" className="rounded-xl px-4 py-2.5 data-[state=active]:bg-slate-950 data-[state=active]:text-white">
            <Film className="mr-2 h-4 w-4" />
            Library
          </TabsTrigger>
          <TabsTrigger value="models" className="rounded-xl px-4 py-2.5 data-[state=active]:bg-slate-950 data-[state=active]:text-white">
            <Globe className="mr-2 h-4 w-4" />
            Models
          </TabsTrigger>
        </TabsList>

        <TabsContent value="create" className="space-y-6">
          <div className="grid gap-6 xl:grid-cols-[minmax(0,1.45fr)_360px]">
            <Card className="surface-glow animate-fade-up overflow-hidden border-white/70 bg-white/90 shadow-lg">
              <CardHeader className="border-b border-slate-100 bg-[linear-gradient(180deg,rgba(248,250,252,0.96),rgba(255,255,255,0.9))]">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="space-y-2">
                    <CardTitle className="text-2xl">Direct the next video run</CardTitle>
                    <CardDescription className="max-w-2xl text-sm leading-6">
                      Write a stronger shot brief, pick the model that fits the look, and keep your scene choices visible
                      before you generate.
                    </CardDescription>
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                    <p className="text-xs uppercase tracking-[0.22em] text-slate-500">Selected engine</p>
                    <p className="mt-1 text-sm font-semibold text-slate-900">{selectedModelInfo?.name}</p>
                    <p className="text-xs text-slate-500">{selectedModelInfo?.provider} • {selectedModelInfo?.quality}</p>
                    {selectedModel === 'json2video' ? (
                      <p className="mt-2 text-xs leading-5 text-cyan-700">
                        Renders a branded template-style video from your brief using your JSON2Video API key.
                      </p>
                    ) : null}
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-7 p-6">
                <div className="grid gap-3 lg:grid-cols-2">
                  {quickPrompts.map((starter) => (
                    <button
                      key={starter}
                      type="button"
                      onClick={() => setPrompt(starter)}
                      className="rounded-2xl border border-slate-200 bg-slate-50/90 px-4 py-4 text-left text-sm leading-6 text-slate-700 transition hover:-translate-y-0.5 hover:border-slate-300 hover:bg-white"
                    >
                      {starter}
                    </button>
                  ))}
                </div>

                <div className="overflow-hidden rounded-[1.7rem] border border-cyan-300/80 bg-[linear-gradient(135deg,#0f172a,#1d4ed8_48%,#06b6d4)] p-1 shadow-xl shadow-blue-950/10">
                  <div className="rounded-[1.45rem] bg-white p-4">
                    <div className="mb-3 flex items-center justify-between gap-3 rounded-2xl bg-slate-950 px-4 py-3 text-white">
                      <div>
                        <Label className="text-base font-semibold text-white">Video brief</Label>
                        <p className="mt-1 text-xs text-cyan-100">
                          Describe the scene, camera, mood, lighting, and motion.
                        </p>
                      </div>
                      <Badge className="rounded-full border-0 bg-cyan-300 px-3 py-1 text-[11px] uppercase tracking-[0.16em] text-slate-950">
                        Required
                      </Badge>
                    </div>
                  <Textarea
                    placeholder="Describe the scene, subject, camera style, pacing, lighting, and overall mood. Example: cinematic founder reveal inside a futuristic command center, low-angle dolly, soft haze, premium brand feel, 16:9 trailer cut."
                    rows={6}
                    value={prompt}
                    onChange={(event) => setPrompt(event.target.value)}
                    className="min-h-[190px] rounded-2xl border-cyan-300 bg-cyan-50/60 px-5 py-4 text-base leading-7 text-slate-950 shadow-inner outline-none ring-1 ring-cyan-100 transition placeholder:text-slate-500 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-cyan-200"
                  />
                    <div className="mt-3 flex flex-wrap items-center justify-between gap-2 rounded-2xl bg-cyan-50 px-4 py-2 text-xs text-slate-600">
                      <span>Tip: mention shot type, environment, movement, and brand tone in one sentence.</span>
                      <span className="font-semibold text-cyan-800">{prompt.length} characters</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <Label>Model rail</Label>
                  <div className="grid gap-3 lg:grid-cols-2">
                    {poeVideoModels.map((model) => (
                      <button
                        key={model.id}
                        type="button"
                        onClick={() => setSelectedModel(model.id)}
                        className={`rounded-[1.4rem] border p-4 text-left transition ${
                          selectedModel === model.id
                            ? 'border-slate-900 bg-slate-950 text-white shadow-lg'
                            : 'border-slate-200 bg-white hover:-translate-y-0.5 hover:border-slate-300 hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl text-xs font-semibold ${
                            selectedModel === model.id
                              ? 'bg-white/14 text-white'
                              : 'bg-[linear-gradient(135deg,#0f172a,#2563eb,#7c3aed)] text-white'
                          }`}>
                            {model.name.slice(0, 2).toUpperCase()}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <p className="font-semibold">{model.name}</p>
                              {model.badge ? (
                                <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium text-white ${model.badgeColor}`}>
                                  {model.badge}
                                </span>
                              ) : null}
                            </div>
                            <p className={`mt-1 text-sm ${selectedModel === model.id ? 'text-slate-300' : 'text-slate-500'}`}>
                              {model.provider} • {model.quality}
                            </p>
                          </div>
                          {selectedModel === model.id ? <CheckCircle2 className="mt-1 h-4 w-4 shrink-0 text-cyan-300" /> : null}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Duration</Label>
                    <select
                      className="flex h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm shadow-sm outline-none transition focus:border-slate-400"
                      value={duration}
                      onChange={(event) => setDuration(event.target.value)}
                    >
                      {durationOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label>Resolution</Label>
                    <select
                      className="flex h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm shadow-sm outline-none transition focus:border-slate-400"
                      value={resolution}
                      onChange={(event) => setResolution(event.target.value)}
                    >
                      <option value="1280x720">720p (1280x720)</option>
                      <option value="1920x1080">1080p (1920x1080)</option>
                      <option value="2560x1440">1440p (2560x1440)</option>
                      <option value="3840x2160">4K (3840x2160)</option>
                    </select>
                  </div>
                </div>

                <div className="rounded-[1.6rem] border border-dashed border-slate-300 bg-slate-50/80 p-5">
                  <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div className="flex items-start gap-3">
                      <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-900 text-white">
                        <Upload className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="font-medium text-slate-900">Reference image</p>
                        <p className="text-sm leading-6 text-slate-500">
                          {selectedModel === 'stable-video-diffusion'
                            ? 'Stable Video uses this uploaded image as the first frame/composition anchor.'
                            : 'Keep this as a composition anchor for future image-to-video workflows.'}
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      {referenceImageName ? (
                        <Badge className="w-fit rounded-full border-0 bg-emerald-100 px-3 py-1 text-[11px] uppercase tracking-[0.18em] text-emerald-700">
                          {referenceImageName.slice(0, 24)}
                        </Badge>
                      ) : null}
                      <label className="inline-flex cursor-pointer items-center rounded-full border border-slate-300 bg-white px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-slate-700 transition hover:bg-slate-50">
                        Upload image
                        <input
                          type="file"
                          accept="image/png,image/jpeg,image/webp"
                          className="sr-only"
                          onChange={(event) => handleReferenceImageChange(event.target.files?.[0] || null)}
                        />
                      </label>
                      {referenceImage ? (
                        <button
                          type="button"
                          className="rounded-full border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-red-700"
                          onClick={() => {
                            setReferenceImage(null);
                            setReferenceImageName(null);
                          }}
                        >
                          Remove
                        </button>
                      ) : null}
                    </div>
                  </div>
                  {referenceImage ? (
                    <div className="mt-4 overflow-hidden rounded-2xl border border-slate-200 bg-white p-2">
                      <img src={referenceImage} alt="Reference preview" className="max-h-56 w-full rounded-xl object-cover" />
                    </div>
                  ) : null}
                </div>

                <div className="flex flex-col gap-3 sm:flex-row">
                  <Button
                    className="h-12 flex-1 rounded-2xl bg-[linear-gradient(135deg,#0f172a,#2563eb,#7c3aed)] text-white shadow-lg transition hover:brightness-110"
                    disabled={!prompt || isGenerating}
                    onClick={() =>
                      generateMutation.mutate({
                        model: selectedModel,
                        prompt,
                        duration: Number(duration),
                        resolution,
                        referenceImage,
                      })
                    }
                  >
                    {isGenerating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
                    {isGenerating ? 'Generating concept...' : 'Generate video'}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className="h-12 rounded-2xl border-slate-300 px-5"
                    onClick={() => {
                      setPrompt('');
                      setGenerationError(null);
                      setGeneratedVideo(null);
                      setVideoPreviewUrl(null);
                      setVideoPreviewError(null);
                      setReferenceImage(null);
                      setReferenceImageName(null);
                    }}
                  >
                    Clear brief
                  </Button>
                </div>

                {generationError ? (
                  <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    {visibleGenerationError}
                  </div>
                ) : null}
              </CardContent>
            </Card>

            <div className="space-y-6">
              <Card className="surface-glow animate-fade-up-delay overflow-hidden border-white/70 bg-white/90 shadow-lg">
                <CardHeader className="pb-3">
                  <CardTitle>Preview rail</CardTitle>
                  <CardDescription>Keep the selected look and run settings visible while you compose.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="relative aspect-video overflow-hidden rounded-[1.7rem] border border-slate-200 bg-[linear-gradient(135deg,#0f172a,#1d4ed8,#7c3aed)] p-5">
                    {videoPreviewUrl ? (
                      <video
                        key={videoPreviewUrl}
                        src={videoPreviewUrl}
                        controls
                        preload="metadata"
                        className="relative h-full w-full rounded-[1.25rem] object-cover"
                        onLoadedData={() => setVideoPreviewError(null)}
                        onError={() => setVideoPreviewError('Preview playback failed, but the video file is ready to download.')}
                      />
                    ) : (
                      <>
                        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.22),transparent_34%),linear-gradient(180deg,transparent,rgba(15,23,42,0.42))]" />
                        <div className="relative flex h-full flex-col justify-between rounded-[1.25rem] border border-white/12 bg-black/15 p-4">
                          <div className="flex items-center justify-between text-white">
                            <Badge className="border-0 bg-white/14 text-white">Queued concept</Badge>
                            <Play className="h-4 w-4 text-slate-100" />
                          </div>
                          <div className="space-y-3 text-white">
                            <p className="text-xl font-semibold">
                              {selectedModelInfo?.name} ready for a {duration}s {resolution} pass
                            </p>
                            <p className="text-sm leading-6 text-slate-100/85">
                              {prompt || 'Write a brief on the left to shape your next scene. The preview rail updates instantly.'}
                            </p>
                          </div>
                        </div>
                      </>
                    )}
                  </div>

                  {generatedVideo ? (
                    <div
                      className={`space-y-3 rounded-[1.6rem] border p-4 ${
                        generatedVideo.status === 'failed'
                          ? 'border-red-200 bg-red-50/80'
                          : 'border-emerald-200 bg-emerald-50/80'
                      }`}
                    >
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-slate-500">Status</span>
                        <span
                          className={`font-medium capitalize ${
                            generatedVideo.status === 'failed' ? 'text-red-700' : 'text-emerald-700'
                          }`}
                        >
                          {generatedVideo.status || 'submitted'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-slate-500">Model</span>
                        <span className="text-slate-900">{generatedVideo.model || selectedModelInfo?.name}</span>
                      </div>
                      {videoPreviewUrl ? (
                        <div className="space-y-2">
                          <div className="flex flex-wrap gap-2">
                            <span className="inline-flex rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white">
                              Video ready in preview rail
                            </span>
                            <button
                              type="button"
                              onClick={handleDownloadVideo}
                              className="inline-flex items-center rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-900 transition hover:bg-slate-50"
                            >
                              <Download className="mr-2 h-4 w-4" />
                              Download video
                            </button>
                          </div>
                          {videoPreviewError ? (
                            <p className="text-sm text-amber-700">{videoPreviewError}</p>
                          ) : null}
                        </div>
                      ) : generatedVideo.videoUrl ? (
                        <a
                          href={generatedVideo.videoUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800"
                        >
                          Open generated video
                        </a>
                      ) : (
                        <p className={`text-sm ${generatedVideo.status === 'failed' ? 'text-red-700' : 'text-slate-600'}`}>
                          {generatedVideo.status === 'failed'
                            ? (generatedVideo.error || 'Video generation failed.').slice(0, 260)
                            : generatedVideo.content ||
                              'The request was accepted. This run may still be processing, so there is no video URL yet.'}
                        </p>
                      )}
                    </div>
                  ) : null}

                  <div className="space-y-3 rounded-[1.6rem] border border-slate-200 bg-slate-50/80 p-4">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-500">Model</span>
                      <span className="font-medium text-slate-900">{selectedModelInfo?.name}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-500">Provider</span>
                      <span className="text-slate-900">{selectedModelInfo?.provider}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-500">Quality target</span>
                      <span className="text-slate-900">{selectedModelInfo?.quality}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-500">Runtime</span>
                      <span className="text-slate-900">{duration}s</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-500">Delivery</span>
                      <span className="text-slate-900">{resolution}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="overflow-hidden border-slate-200 bg-white/85">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Studio notes</CardTitle>
                  <CardDescription>What this setup is optimized for right now.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3 text-sm text-slate-600">
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    Use richer prompts for cinematic models. They respond better when you specify camera movement and art direction.
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    Shorter durations usually get you to a viable concept faster before you scale to longer exports.
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    The generate action still uses your existing Poe endpoint, so the improved UI stays compatible with the current backend.
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="library" className="space-y-6">
          {libraryVideos.length === 0 ? (
            <Card className="border-dashed border-slate-300 bg-white/80">
              <CardContent className="flex min-h-72 flex-col items-center justify-center p-8 text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-950 text-white">
                  <Film className="h-6 w-6" />
                </div>
                <h3 className="mt-5 text-xl font-semibold text-slate-950">No generated videos yet</h3>
                <p className="mt-2 max-w-md text-sm leading-6 text-slate-500">
                  Create a video first, and it will appear here automatically with its status, preview, and download action.
                </p>
                <Button
                  type="button"
                  className="mt-5 rounded-2xl bg-slate-950 text-white"
                  onClick={() => setActiveTab('create')}
                >
                  Create first video
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 lg:grid-cols-3">
              {libraryVideos.map((video) => (
                <Card
                  key={video.id}
                  className="overflow-hidden border-slate-200 bg-white/90 transition hover:-translate-y-1 hover:shadow-lg"
                >
                  <CardContent className="p-0">
                    <button
                      type="button"
                      onClick={() => openLibraryVideo(video)}
                      className="group relative block aspect-video w-full overflow-hidden bg-[linear-gradient(135deg,#0f172a,#1d4ed8,#06b6d4)] p-4 text-left"
                    >
                      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.22),transparent_30%)]" />
                      {video.videoUrl && video.status === 'completed' ? (
                        <video
                          src={video.videoUrl}
                          muted
                          playsInline
                          preload="metadata"
                          className="absolute inset-4 h-[calc(100%-2rem)] w-[calc(100%-2rem)] rounded-[1.3rem] object-cover opacity-70"
                        />
                      ) : null}
                      <div className="relative flex h-full items-end justify-between rounded-[1.3rem] border border-white/12 bg-black/20 p-4">
                        <Badge
                          variant={video.status === 'completed' ? 'success' : video.status === 'failed' ? 'destructive' : 'warning'}
                          className="border-0 text-[10px] capitalize"
                        >
                          {video.status}
                        </Badge>
                        <span className="flex h-11 w-11 items-center justify-center rounded-full bg-white text-slate-900 shadow-lg transition group-hover:scale-105">
                          {video.status === 'processing' ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Play className="ml-0.5 h-4 w-4" />
                          )}
                        </span>
                      </div>
                    </button>
                    <div className="space-y-4 p-5">
                      <div>
                        <p className="line-clamp-2 text-lg font-semibold text-slate-900">{video.title}</p>
                        <p className="mt-1 text-sm text-slate-500">
                          {video.modelName} • {video.provider}
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-2 text-xs text-slate-500">
                        <span className="rounded-full bg-slate-100 px-3 py-1">{video.duration || '-'}s</span>
                        <span className="rounded-full bg-slate-100 px-3 py-1">{video.resolution || '1280x720'}</span>
                        <span className="rounded-full bg-slate-100 px-3 py-1">{formatLibraryDate(video.createdAt)}</span>
                      </div>
                      {video.status === 'failed' && video.error ? (
                        <p className="line-clamp-2 rounded-2xl bg-red-50 p-3 text-xs leading-5 text-red-700">{video.error}</p>
                      ) : null}
                      <div className="flex gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          className="flex-1 rounded-2xl border-slate-300"
                          onClick={() => openLibraryVideo(video)}
                        >
                          Open
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          className="rounded-2xl border-slate-300 px-4"
                          disabled={video.status !== 'completed'}
                          onClick={() => handleDownloadVideo(video)}
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="models" className="space-y-6">
          <Card className="overflow-hidden border-0 bg-[linear-gradient(135deg,rgba(15,23,42,0.98),rgba(29,78,216,0.84),rgba(6,182,212,0.82))] text-white shadow-xl">
            <CardContent className="grid gap-6 p-6 lg:grid-cols-[minmax(0,1.2fr)_280px]">
              <div className="space-y-3">
                <Badge className="w-fit border-white/10 bg-white/12 text-white">
                  <Zap className="mr-1.5 h-3 w-3" />
                  Powered by Poe
                </Badge>
                <h3 className="text-2xl font-semibold">One access layer for your full video model stack.</h3>
                <p className="max-w-2xl text-sm leading-6 text-slate-100/85">
                  You do not need a separate surface for each provider here. This studio keeps the model catalog visible while
                  the actual generation continues to route through your existing Poe integration.
                </p>
              </div>
              <div className="rounded-[1.6rem] border border-white/12 bg-white/10 p-5 backdrop-blur-sm">
                <p className="text-xs uppercase tracking-[0.24em] text-slate-200">Catalog snapshot</p>
                <div className="mt-4 space-y-3 text-sm text-slate-100">
                  <div className="flex items-center justify-between">
                    <span>Premium cinematic</span>
                    <span>4 models</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Fast concepting</span>
                    <span>3 models</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Open workflows</span>
                    <span>1 model</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {poeVideoModels.map((model) => (
              <Card
                key={model.id}
                className={`overflow-hidden border-slate-200 bg-white/92 transition hover:-translate-y-1 hover:shadow-lg ${
                  selectedModel === model.id ? 'ring-2 ring-slate-900/80' : ''
                }`}
              >
                <CardContent className="space-y-4 p-5">
                  <div className="flex items-center justify-between">
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,#0f172a,#2563eb,#7c3aed)] text-xs font-semibold text-white">
                      {model.name.slice(0, 2).toUpperCase()}
                    </div>
                    {model.badge ? (
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium text-white ${model.badgeColor}`}>
                        {model.badge}
                      </span>
                    ) : null}
                  </div>
                  <div>
                    <p className="text-lg font-semibold text-slate-900">{model.name}</p>
                    <p className="mt-1 text-sm text-slate-500">{model.provider}</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="outline" className="rounded-full border-slate-300 bg-slate-50 text-[10px] uppercase tracking-[0.18em]">
                      {model.quality}
                    </Badge>
                    <Badge variant="outline" className="rounded-full border-slate-300 bg-slate-50 text-[10px] uppercase tracking-[0.18em]">
                      Video
                    </Badge>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full rounded-2xl border-slate-300"
                    onClick={() => setSelectedModel(model.id)}
                  >
                    {selectedModel === model.id ? 'Selected' : 'Use this model'}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

