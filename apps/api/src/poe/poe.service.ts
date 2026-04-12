import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { decrypt } from '../common/crypto';
import { execFile } from 'child_process';
import { randomUUID } from 'crypto';
import { promises as fs } from 'fs';
import { tmpdir } from 'os';
import path from 'path';
import { promisify } from 'util';

const execFileAsync = promisify(execFile);

export interface PoeModel {
  id: string;
  name: string;
  category: 'llm' | 'video' | 'image' | 'audio';
  description: string;
  provider: string;
  isDefault?: boolean;
}

export interface PoeMessageRequest {
  model: string;
  messages: Array<{ role: 'user' | 'assistant' | 'system'; content: string }>;
  temperature?: number;
  maxTokens?: number;
}

export interface PoeVideoRequest {
  model: string;
  prompt: string;
  duration?: number;
  resolution?: string;
  aspectRatio?: string;
  referenceImage?: string;
}

export interface PoeVideoResult {
  id: string;
  model: string;
  provider: string;
  status: 'processing' | 'completed' | 'failed';
  videoUrl: string | null;
  thumbnailUrl: string | null;
  content?: string;
  prompt?: string;
  duration?: number;
  resolution?: string;
  createdAt: string;
  error?: string | null;
}

@Injectable()
export class PoeService {
  private readonly logger = new Logger(PoeService.name);
  private readonly POE_API_BASE = 'https://api.poe.com/v1';
  private readonly chatVideoJobs = new Map<string, PoeVideoResult>();
  private readonly CHAT_VIDEO_TIMEOUT_MS = 8 * 60 * 1000;
  private readonly MODEL_ALIASES: Record<string, string> = {
    'claude-3.5-sonnet': 'claude-sonnet-4.5',
    'Claude-Sonnet-4.5': 'claude-sonnet-4.5',
    'deepseek-v3': 'DeepSeek-R1',
    'DeepSeek-V3': 'DeepSeek-R1',
    'llama-3.1-405b': 'Llama-3.3-70B',
    'Llama-3.1-405B': 'Llama-3.3-70B',
    'mixtral-8x22b': 'Mixtral8x22b-Inst-FW',
    'qwen-2.5-72b': 'Qwen-2.5-7B-T',
    'Qwen-2.5-72B-T': 'Qwen-2.5-7B-T',
    'Qwen3-32B-CS': 'Qwen-2.5-7B-T',
    'command-r-plus': 'Aya-Expanse-32B',
    'Command-R-Plus': 'Aya-Expanse-32B',
    'Command-R': 'Aya-Expanse-32B',
    'sora-2': 'Sora-2',
    'veo-3': 'Veo-3',
    'kling-2.1-master': 'Kling-2.1-Master',
    'runway-gen-4.5': 'runway-gen-4.5',
    'minimax-video': 'MiniMax',
    'pika-2.0': 'Pika-2.0',
    'luma-dream-machine': 'Dream-Machine',
    'stable-video-diffusion': 'SVI-2.0-Pro',
  };

  constructor(private prisma: PrismaService) {}

  /**
   * Get available models organized by category.
   * Poe aggregates 600+ models from multiple providers.
   */
  getAvailableModels(): PoeModel[] {
    return [
      // LLM Models
      { id: 'gpt-4o', name: 'GPT-4o', category: 'llm', description: 'OpenAI GPT-4o — fast multimodal model', provider: 'OpenAI', isDefault: true },
      { id: 'gpt-4o-mini', name: 'GPT-4o Mini', category: 'llm', description: 'OpenAI GPT-4o Mini — lightweight & fast', provider: 'OpenAI' },
      { id: 'claude-sonnet-4.5', name: 'Claude Sonnet 4.5', category: 'llm', description: 'Anthropic Claude 3.5 Sonnet — best for code & reasoning', provider: 'Anthropic' },
      { id: 'claude-3-opus', name: 'Claude 3 Opus', category: 'llm', description: 'Anthropic Claude 3 Opus — highest capability', provider: 'Anthropic' },
      { id: 'gemini-1.5-pro', name: 'Gemini 1.5 Pro', category: 'llm', description: 'Google Gemini 1.5 Pro — long context window', provider: 'Google' },
      { id: 'gemini-2.0-flash', name: 'Gemini 2.0 Flash', category: 'llm', description: 'Google Gemini 2.0 Flash — fast & efficient', provider: 'Google' },
      { id: 'Llama-3.3-70B', name: 'Llama 3.3 70B', category: 'llm', description: 'Meta Llama 3.1 — largest open model', provider: 'Meta' },
      { id: 'llama-3.1-70b', name: 'Llama 3.1 70B', category: 'llm', description: 'Meta Llama 3.1 70B — balanced open model', provider: 'Meta' },
      { id: 'Mixtral8x22b-Inst-FW', name: 'Mixtral 8x22B', category: 'llm', description: 'Mistral Mixtral MoE — fast & efficient', provider: 'Mistral' },
      { id: 'Aya-Expanse-32B', name: 'Aya Expanse 32B', category: 'llm', description: 'Cohere Command R+ — enterprise RAG', provider: 'Cohere' },
      { id: 'Qwen-2.5-7B-T', name: 'Qwen 2.5 7B', category: 'llm', description: 'Alibaba Qwen 2.5 — multilingual', provider: 'Alibaba' },
      { id: 'DeepSeek-R1', name: 'DeepSeek R1', category: 'llm', description: 'DeepSeek R1 — strong reasoning', provider: 'DeepSeek' },

      // Video Models
      { id: 'Sora-2', name: 'Sora 2', category: 'video', description: 'OpenAI Sora 2 — cinematic video generation', provider: 'OpenAI', isDefault: true },
      { id: 'Veo-3', name: 'Veo 3', category: 'video', description: 'Google Veo 3 — high-fidelity video', provider: 'Google' },
      { id: 'kling-2.1-pro', name: 'Kling 2.1 Pro', category: 'video', description: 'Kuaishou Kling 2.1 Pro — image-to-video generation', provider: 'Kuaishou' },
      { id: 'Kling-2.1-Master', name: 'Kling 2.1 Master', category: 'video', description: 'Kuaishou Kling 2.1 Master — text-to-video fallback', provider: 'Kuaishou' },
      { id: 'runway-gen-4.5', name: 'Runway Gen-4.5', category: 'video', description: 'Runway Gen-4.5 — creative video', provider: 'Runway' },
      { id: 'MiniMax', name: 'MiniMax Video', category: 'video', description: 'MiniMax — fast video generation', provider: 'MiniMax' },
      { id: 'Pika-2.0', name: 'Pika 2.0', category: 'video', description: 'Pika 2.0 — expressive video AI', provider: 'Pika' },
      { id: 'Dream-Machine', name: 'Luma Dream Machine', category: 'video', description: 'Luma Labs — dreamy video generation', provider: 'Luma' },
      { id: 'SVI-2.0-Pro', name: 'Stable Video', category: 'video', description: 'Stable Video Infinity — image-to-video generation', provider: 'Stability' },

      // Image Models
      { id: 'dall-e-3', name: 'DALL-E 3', category: 'image', description: 'OpenAI DALL-E 3 — text-to-image', provider: 'OpenAI' },
      { id: 'midjourney-v6', name: 'Midjourney v6', category: 'image', description: 'Midjourney v6 — artistic image generation', provider: 'Midjourney' },
      { id: 'stable-diffusion-xl', name: 'Stable Diffusion XL', category: 'image', description: 'Stability SDXL — high-res images', provider: 'Stability' },
      { id: 'flux-1.1-pro', name: 'Flux 1.1 Pro', category: 'image', description: 'Black Forest Labs Flux — fast image gen', provider: 'BFL' },
      { id: 'ideogram-v2', name: 'Ideogram v2', category: 'image', description: 'Ideogram v2 — text-in-image specialist', provider: 'Ideogram' },

      // Audio Models
      { id: 'elevenlabs-turbo', name: 'ElevenLabs Turbo', category: 'audio', description: 'ElevenLabs — realistic text-to-speech', provider: 'ElevenLabs' },
      { id: 'bark', name: 'Bark', category: 'audio', description: 'Suno Bark — multilingual TTS', provider: 'Suno' },
      { id: 'musicgen', name: 'MusicGen', category: 'audio', description: 'Meta MusicGen — AI music generation', provider: 'Meta' },
    ];
  }

  getModelsByCategory(category: string): PoeModel[] {
    return this.getAvailableModels().filter((m) => m.category === category);
  }

  getModelById(modelId: string): PoeModel | undefined {
    const canonicalModelId = this.MODEL_ALIASES[modelId] || modelId;
    return this.getAvailableModels().find((m) => m.id === canonicalModelId);
  }

  private normalizeModelId(modelId: string): string {
    return this.MODEL_ALIASES[modelId] || modelId;
  }

  private mapVideoStatus(status?: string): 'processing' | 'completed' | 'failed' {
    const normalized = (status || '').toLowerCase();
    if (normalized === 'completed' || normalized === 'succeeded') return 'completed';
    if (normalized === 'failed' || normalized === 'error' || normalized === 'cancelled') return 'failed';
    return 'processing';
  }

  private shapeVideoResult(
    model: PoeModel,
    data: any,
    fallback: { prompt?: string; duration?: number; resolution?: string } = {},
  ): PoeVideoResult {
    const status = this.mapVideoStatus(data?.status);
    const videoUrl =
      data?.video_url ||
      data?.content_url ||
      data?.output?.video_url ||
      data?.output?.url ||
      null;

    return {
      id: data?.id || `poe-video-${Date.now()}`,
      model: data?.model || model.id,
      provider: model.provider,
      status,
      videoUrl,
      thumbnailUrl: data?.thumbnail_url || data?.output?.thumbnail_url || null,
      content: data?.content || null,
      prompt: data?.prompt || fallback.prompt || '',
      duration: fallback.duration,
      resolution: fallback.resolution || '1280x720',
      createdAt: data?.created_at || new Date().toISOString(),
      error: data?.error?.message || data?.error || null,
    };
  }

  private extractVideoUrlFromPoeResponse(data: any): string | null {
    const candidates: string[] = [];
    const collect = (value: any) => {
      if (!value) return;
      if (typeof value === 'string') {
        candidates.push(...value.match(/https?:\/\/[^\s"'<>)}\]]+/gi) || []);
        return;
      }
      if (Array.isArray(value)) {
        value.forEach(collect);
        return;
      }
      if (typeof value === 'object') {
        Object.values(value).forEach(collect);
      }
    };

    collect(data);
    return (
      candidates.find((url) => /\.(mp4|mov|webm)(\?|#|$)/i.test(url)) ||
      candidates.find((url) => /video|download|attachment|poe/i.test(url)) ||
      null
    );
  }

  private summarizePoeError(errorText: string): string {
    try {
      const parsed = JSON.parse(errorText);
      const message =
        parsed?.error?.message ||
        parsed?.message ||
        parsed?.error ||
        errorText;

      if (typeof message === 'string') return message;
      return JSON.stringify(message);
    } catch {
      return errorText;
    }
  }

  private buildStableVideoPrompt(prompt: string, duration: number, resolution: string): string {
    const singleScenePrompt = prompt
      .replace(/[\r\n]+/g, ', ')
      .replace(/[.!?;:]+/g, ',')
      .replace(/\s+/g, ' ')
      .replace(/,+/g, ',')
      .replace(/^,\s*|\s*,$/g, '')
      .trim();

    return singleScenePrompt || 'cinematic atmospheric scene with smooth natural camera movement';
  }

  private buildStableVideoScenes(prompt: string, duration: number): string {
    const scenePrompt = this.buildStableVideoPrompt(prompt, duration, '1280x720');
    const sceneCount = Math.max(1, Math.round(duration / 4.5));
    return Array.from({ length: sceneCount }, (_, index) => `${index + 1}. ${scenePrompt}`).join('\n');
  }

  private buildChatVideoContent(model: PoeModel, request: PoeVideoRequest, duration: number, resolution: string) {
    if (model.id === 'SVI-2.0-Pro') {
      const stablePrompt = this.buildStableVideoScenes(request.prompt, duration);
      return request.referenceImage
        ? [
            { type: 'text', text: stablePrompt },
            { type: 'image_url', image_url: { url: request.referenceImage } },
          ]
        : stablePrompt;
    }

    if (request.referenceImage && model.id === 'kling-2.1-pro') {
      return [
        { type: 'text', text: `${request.prompt}\n\nCreate a ${duration} second image-to-video clip at ${resolution}. Use the attached reference image as the first frame/composition anchor. Return the video file link when it is ready.` },
        { type: 'image_url', image_url: { url: request.referenceImage } },
      ];
    }

    return `${request.prompt}\n\nCreate a ${duration} second video at ${resolution}. Return the video file link when it is ready.`;
  }

  /**
   * Retrieve the user's Poe API key from the encrypted vault.
   */
  async getUserApiKey(userId: string): Promise<string | null> {
    const key = await this.prisma.providerKey.findFirst({
      where: { userId, providerSlug: 'poe' },
      orderBy: { createdAt: 'desc' },
    });
    if (!key) return null;
    return decrypt(key.encryptedKey);
  }

  /**
   * Send a chat/completion request through the Poe API.
   */
  async sendMessage(userId: string, request: PoeMessageRequest) {
    const apiKey = await this.getUserApiKey(userId);
    if (!apiKey) {
      throw new BadRequestException('No Poe API key configured. Add one in Integrations Hub.');
    }

    const modelId = this.normalizeModelId(request.model);
    const model = this.getModelById(modelId);
    if (!model) {
      throw new BadRequestException(`Unknown model: ${request.model}`);
    }

    try {
      const response = await fetch(`${this.POE_API_BASE}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: modelId,
          messages: request.messages,
          temperature: request.temperature ?? 0.7,
          max_tokens: request.maxTokens ?? 2048,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        this.logger.error(`Poe API error: ${response.status} ${errorText}`);
        throw new BadRequestException(`Poe API error: ${response.statusText}`);
      }

      const data = await response.json();
      const choice = data.choices?.[0];
      return {
        id: data.id || `poe-${Date.now()}`,
        model: data.model || modelId,
        provider: model.provider,
        content: choice?.message?.content || '',
        usage: {
          promptTokens: data.usage?.prompt_tokens || 0,
          completionTokens: data.usage?.completion_tokens || 0,
          totalTokens: data.usage?.total_tokens || 0,
        },
        createdAt: new Date().toISOString(),
      };
    } catch (error: any) {
      if (error instanceof BadRequestException) throw error;
      this.logger.error(`Poe API call failed: ${error.message}`);
      throw new BadRequestException(`Failed to call Poe API: ${error.message}`);
    }
  }

  /**
   * Submit a video generation request through Poe.
   */
  async generateVideo(userId: string, request: PoeVideoRequest): Promise<PoeVideoResult> {
    const apiKey = await this.getUserApiKey(userId);
    if (!apiKey) {
      throw new BadRequestException('No Poe API key configured. Add one in Integrations Hub.');
    }

    const modelId =
      ((request.model === 'kling-2.1-pro' || request.model === 'stable-video-diffusion') && request.referenceImage)
        ? request.model === 'kling-2.1-pro'
          ? 'kling-2.1-pro'
          : 'SVI-2.0-Pro'
        : this.normalizeModelId(request.model);
    const model = this.getModelById(modelId);
    if (!model || model.category !== 'video') {
      throw new BadRequestException(`Invalid video model: ${request.model}`);
    }

    const requestedDuration = request.duration || 4;
    const aspectRatio = request.aspectRatio || '16:9';
    const soraSeconds = requestedDuration >= 12 ? '12' : requestedDuration >= 8 ? '8' : '4';
    const veoSeconds = requestedDuration >= 8 ? 8 : requestedDuration >= 6 ? 6 : 4;
    const klingSeconds = requestedDuration >= 10 ? 10 : 5;
    const runwaySeconds = requestedDuration >= 10 ? 10 : requestedDuration >= 8 ? 8 : 5;
    const miniMaxSeconds = 6;
    const pikaSeconds = requestedDuration >= 10 ? 10 : 5;
    const lumaSeconds = requestedDuration >= 9 ? 9 : 5;
    const stableVideoSeconds = 18;
    const buildBody = (candidateModelId: string) =>
      candidateModelId === 'Sora-2'
        ? {
            model: candidateModelId,
            prompt: request.prompt,
            seconds: soraSeconds,
            size: request.resolution || '1280x720',
          }
        : candidateModelId.startsWith('Veo-')
          ? {
              model: candidateModelId,
              prompt: request.prompt,
              seconds: veoSeconds,
              size: request.resolution || '1280x720',
            }
          : candidateModelId.startsWith('Kling-')
            ? {
                model: candidateModelId,
                prompt: request.prompt,
                seconds: klingSeconds,
                size: request.resolution || '1280x720',
              }
          : candidateModelId.startsWith('SVI-')
            ? {
                model: candidateModelId,
                prompt: this.buildStableVideoPrompt(request.prompt, stableVideoSeconds, request.resolution || '1280x720'),
                seconds: stableVideoSeconds,
                size: request.resolution || '1280x720',
              }
          : {
              model: candidateModelId,
              prompt: request.prompt,
              seconds: requestedDuration,
              size: request.resolution || '1280x720',
              aspect_ratio: aspectRatio,
            };

    const candidateModelIds =
      modelId === 'Veo-3'
        ? ['Veo-3', 'Veo-3-Fast', 'Veo-3.1', 'Veo-3.1-Fast', 'Veo-2']
        : modelId === 'kling-2.1-pro'
          ? ['kling-2.1-pro', 'Kling-2.1-Pro', 'kling-2.1-std']
        : [modelId];

    try {
      if (
        modelId === 'kling-2.1-pro' ||
        modelId === 'runway-gen-4.5' ||
        modelId === 'MiniMax' ||
        modelId === 'Pika-2.0' ||
        modelId === 'Dream-Machine' ||
        modelId === 'SVI-2.0-Pro' ||
        modelId === 'Kling-2.1-Master'
      ) {
        const isRunway = modelId === 'runway-gen-4.5';
        const isMiniMax = modelId === 'MiniMax';
        const isPika = modelId === 'Pika-2.0';
        const isLuma = modelId === 'Dream-Machine';
        const isStableVideo = modelId === 'SVI-2.0-Pro';
        const isKlingMaster = modelId === 'Kling-2.1-Master';
        const chatDuration = isMiniMax
          ? miniMaxSeconds
          : isStableVideo
            ? stableVideoSeconds
            : isLuma
              ? lumaSeconds
              : isPika
                ? pikaSeconds
                : isRunway
                  ? runwaySeconds
                  : klingSeconds;
        const chatCandidateModelIds = isMiniMax
          ? ['MiniMax', 'minimax', 'Hailuo-02', 'MiniMax-Hailuo-02']
          : isKlingMaster
            ? ['Kling-2.1-Master', 'kling-2.1-master', 'Real-Video-Generator']
          : isStableVideo
            ? ['SVI-2.0', 'SVI-2.0-Pro', 'Video-Generator-PRO']
          : isLuma
            ? ['Dream-Machine', 'dream-machine', 'Ray2', 'Luma-Ray2', 'LumaLabs']
          : isPika
            ? ['Pika', 'Pika-2.0', 'pika-2.0', 'PikaVideoMaster', 'Video-Generator-PRO']
            : isRunway
              ? ['runway-gen-4.5', 'Runway-Gen-4.5', 'runway-gen-4-turbo', 'Runway-Gen-4-Turbo', 'runway']
              : [...candidateModelIds, 'kling-v3'];
        const jobId = `chat-video-${Date.now()}-${Math.random().toString(36).slice(2)}`;
        const pendingJob: PoeVideoResult = {
          id: jobId,
          model: modelId,
          provider: model.provider,
          status: 'processing',
          videoUrl: null,
          thumbnailUrl: null,
          content: isMiniMax
            ? 'MiniMax is running in the background. This model often takes about 5 minutes on Poe.'
            : isStableVideo
              ? 'Stable Video is running through Poe bot mode with an 18 second, 4-scene prompt.'
            : `${model.name} generation is running in the background.`,
          prompt: request.prompt,
          duration: chatDuration,
          resolution: request.resolution || '1280x720',
          createdAt: new Date().toISOString(),
          error: null,
        };

        this.chatVideoJobs.set(jobId, pendingJob);
        void this.runChatVideoJob(
          apiKey,
          jobId,
          model,
          chatCandidateModelIds,
          request,
          chatDuration,
          this.CHAT_VIDEO_TIMEOUT_MS,
        );

        return pendingJob;
      }

      let lastError = '';

      for (const candidateModelId of candidateModelIds) {
        const response = await fetch(`${this.POE_API_BASE}/videos`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(buildBody(candidateModelId)),
        });

        if (response.ok) {
          const data = await response.json();
          return this.shapeVideoResult(model, data, {
            prompt: request.prompt,
            duration: requestedDuration,
            resolution: request.resolution,
          });
        }

        const errorText = await response.text();
        lastError = `${response.status} ${response.statusText}: ${errorText}`;
        this.logger.error(`Poe Video API error for ${candidateModelId}: ${lastError}`);

        if (response.status !== 404 || candidateModelIds.length === 1) {
          throw new BadRequestException(`Video generation failed for ${candidateModelId}: ${errorText || response.statusText}`);
        }
      }

      throw new BadRequestException(`Video generation failed: no available Veo model found. ${lastError}`);
    } catch (error: any) {
      if (error instanceof BadRequestException) throw error;
      this.logger.error(`Poe Video generation failed: ${error.message}`);
      throw new BadRequestException(`Video generation failed: ${error.message}`);
    }
  }

  async getVideoStatus(userId: string, videoId: string): Promise<PoeVideoResult> {
    const localJob = this.chatVideoJobs.get(videoId);
    if (localJob) return localJob;

    const apiKey = await this.getUserApiKey(userId);
    if (!apiKey) {
      throw new BadRequestException('No Poe API key configured. Add one in Integrations Hub.');
    }

    try {
      const response = await fetch(`${this.POE_API_BASE}/videos/${videoId}`, {
        headers: {
          Authorization: `Bearer ${apiKey}`,
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        this.logger.error(`Poe Video status error: ${response.status} ${errorText}`);
        throw new BadRequestException(`Video status failed: ${response.statusText}`);
      }

      const data = await response.json();
      const modelId = this.normalizeModelId(data?.model || '');
      const model =
        this.getModelById(modelId) ||
        ({ id: modelId || 'unknown', name: modelId || 'Unknown', category: 'video', description: '', provider: 'Poe' } as PoeModel);

      return this.shapeVideoResult(model, data);
    } catch (error: any) {
      if (error instanceof BadRequestException) throw error;
      throw new BadRequestException(`Video status failed: ${error.message}`);
    }
  }

  private async runChatVideoJob(
    apiKey: string,
    jobId: string,
    model: PoeModel,
    candidateModelIds: string[],
    request: PoeVideoRequest,
    duration: number,
    timeoutMs = this.CHAT_VIDEO_TIMEOUT_MS,
  ) {
    let lastError = '';
    const resolution = request.resolution || '1280x720';

    for (let index = 0; index < candidateModelIds.length; index += 1) {
      const candidateModelId = candidateModelIds[index];
      const isLastCandidate = index === candidateModelIds.length - 1;
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), timeoutMs);
        const response = await fetch(`${this.POE_API_BASE}/chat/completions`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
          signal: controller.signal,
          body: JSON.stringify({
            model: candidateModelId,
            messages: [
              {
                role: 'user',
                content: this.buildChatVideoContent(model, request, duration, resolution),
              },
            ],
            stream: false,
          }),
        });
        clearTimeout(timeout);

        if (response.ok) {
          const data = await response.json();
          const choice = data.choices?.[0];
          const content = choice?.message?.content || '';
          const videoUrl = this.extractVideoUrlFromPoeResponse(data);

          this.chatVideoJobs.set(jobId, {
            id: jobId,
            model: data.model || candidateModelId,
            provider: model.provider,
            status: videoUrl ? 'completed' : 'failed',
            videoUrl,
            thumbnailUrl: null,
            content,
            prompt: request.prompt,
            duration,
            resolution,
            createdAt: new Date().toISOString(),
            error: videoUrl ? null : `${model.name} completed but did not return a video URL. ${content}`,
          });
          return;
        }

        const errorText = await response.text();
        const errorSummary = this.summarizePoeError(errorText);
        lastError = `${response.status} ${response.statusText}: ${errorSummary}`;
        this.logger.error(`Poe ${model.name} chat API error for ${candidateModelId}: ${lastError}`);

        if (/insufficient[_\s-]?credits/i.test(errorSummary)) {
          lastError = `${model.name} requires more Poe credits for this request. Add credits in Poe or choose another video model.`;
          break;
        }

        if (response.status !== 404 && response.status < 500) break;
      } catch (error: any) {
        lastError =
          error?.name === 'AbortError'
            ? `${model.name} did not return a video within ${Math.round(timeoutMs / 60000)} minutes. Poe may still be processing it, or this bot may not be available through your API key.`
            : error.message || 'Unknown generation error';
        this.logger.error(`Poe ${model.name} chat job failed for ${candidateModelId}: ${lastError}`);
        if (isLastCandidate) break;
      }
    }

    this.chatVideoJobs.set(jobId, {
      id: jobId,
      model: model.id,
      provider: model.provider,
      status: 'failed',
      videoUrl: null,
      thumbnailUrl: null,
      content: '',
      prompt: request.prompt,
      duration,
      resolution: request.resolution || '1280x720',
      createdAt: new Date().toISOString(),
      error: `${model.name} generation failed. ${lastError}`,
    });
  }

  async getVideoContent(userId: string, videoId: string): Promise<{ buffer: Buffer; contentType: string }> {
    const apiKey = await this.getUserApiKey(userId);
    if (!apiKey) {
      throw new BadRequestException('No Poe API key configured. Add one in Integrations Hub.');
    }

    try {
      const response = await fetch(`${this.POE_API_BASE}/videos/${videoId}/content`, {
        headers: {
          Authorization: `Bearer ${apiKey}`,
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        this.logger.error(`Poe Video content error: ${response.status} ${errorText}`);
        throw new BadRequestException(`Video content failed: ${response.statusText}`);
      }

      const arrayBuffer = await response.arrayBuffer();
      return {
        buffer: Buffer.from(arrayBuffer),
        contentType: response.headers.get('content-type') || 'video/mp4',
      };
    } catch (error: any) {
      if (error instanceof BadRequestException) throw error;
      throw new BadRequestException(`Video content failed: ${error.message}`);
    }
  }

  async getVideoPreviewContent(userId: string, videoId: string): Promise<{ buffer: Buffer; contentType: string }> {
    const source = await this.getVideoContent(userId, videoId);
    const jobId = randomUUID();
    const inputPath = path.join(tmpdir(), `agentos-video-${jobId}.input`);
    const outputPath = path.join(tmpdir(), `agentos-video-${jobId}.mp4`);

    try {
      await fs.writeFile(inputPath, source.buffer);
      await execFileAsync(process.env.FFMPEG_PATH || 'ffmpeg', [
        '-y',
        '-i',
        inputPath,
        '-c:v',
        'libx264',
        '-pix_fmt',
        'yuv420p',
        '-movflags',
        '+faststart',
        '-c:a',
        'aac',
        '-b:a',
        '128k',
        outputPath,
      ]);

      return {
        buffer: await fs.readFile(outputPath),
        contentType: 'video/mp4',
      };
    } catch (error: any) {
      this.logger.warn(`Video preview transcode failed, returning original content: ${error.message}`);
      return source;
    } finally {
      await fs.rm(inputPath, { force: true }).catch(() => undefined);
      await fs.rm(outputPath, { force: true }).catch(() => undefined);
    }
  }

  /**
   * Generate an image through Poe.
   */
  async generateImage(userId: string, model: string, prompt: string, options?: { width?: number; height?: number }) {
    const apiKey = await this.getUserApiKey(userId);
    if (!apiKey) {
      throw new BadRequestException('No Poe API key configured. Add one in Integrations Hub.');
    }

    const modelId = this.normalizeModelId(model);
    const modelDef = this.getModelById(modelId);
    if (!modelDef || modelDef.category !== 'image') {
      throw new BadRequestException(`Invalid image model: ${model}`);
    }

    try {
      const response = await fetch(`${this.POE_API_BASE}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: modelId,
          messages: [
            {
              role: 'user',
              content: prompt,
            },
          ],
          temperature: 0.7,
          max_tokens: 4096,
          stream: false,
          extra_body: {
            width: options?.width || 1024,
            height: options?.height || 1024,
          },
        }),
      });

      if (!response.ok) {
        throw new BadRequestException(`Image generation failed: ${response.statusText}`);
      }

      const data = await response.json();
      const choice = data.choices?.[0];
      const content = choice?.message?.content || '';

      // Extract image URL from response content if present
      const imageUrlMatch = content.match(/https?:\/\/[^\s"']+\.(png|jpg|jpeg|webp|gif)/i);

      return {
        id: data.id || `poe-image-${Date.now()}`,
        model: data.model || modelId,
        provider: modelDef.provider,
        imageUrl: imageUrlMatch?.[0] || null,
        content,
        prompt,
        createdAt: new Date().toISOString(),
      };
    } catch (error: any) {
      if (error instanceof BadRequestException) throw error;
      throw new BadRequestException(`Image generation failed: ${error.message}`);
    }
  }
}









