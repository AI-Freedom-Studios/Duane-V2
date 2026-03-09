import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { decrypt } from '../common/crypto';

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
}

@Injectable()
export class PoeService {
  private readonly logger = new Logger(PoeService.name);
  private readonly POE_API_BASE = 'https://api.poe.com/v1';

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
      { id: 'claude-3.5-sonnet', name: 'Claude 3.5 Sonnet', category: 'llm', description: 'Anthropic Claude 3.5 Sonnet — best for code & reasoning', provider: 'Anthropic' },
      { id: 'claude-3-opus', name: 'Claude 3 Opus', category: 'llm', description: 'Anthropic Claude 3 Opus — highest capability', provider: 'Anthropic' },
      { id: 'gemini-1.5-pro', name: 'Gemini 1.5 Pro', category: 'llm', description: 'Google Gemini 1.5 Pro — long context window', provider: 'Google' },
      { id: 'gemini-2.0-flash', name: 'Gemini 2.0 Flash', category: 'llm', description: 'Google Gemini 2.0 Flash — fast & efficient', provider: 'Google' },
      { id: 'llama-3.1-405b', name: 'Llama 3.1 405B', category: 'llm', description: 'Meta Llama 3.1 — largest open model', provider: 'Meta' },
      { id: 'llama-3.1-70b', name: 'Llama 3.1 70B', category: 'llm', description: 'Meta Llama 3.1 70B — balanced open model', provider: 'Meta' },
      { id: 'mixtral-8x22b', name: 'Mixtral 8x22B', category: 'llm', description: 'Mistral Mixtral MoE — fast & efficient', provider: 'Mistral' },
      { id: 'command-r-plus', name: 'Command R+', category: 'llm', description: 'Cohere Command R+ — enterprise RAG', provider: 'Cohere' },
      { id: 'qwen-2.5-72b', name: 'Qwen 2.5 72B', category: 'llm', description: 'Alibaba Qwen 2.5 — multilingual', provider: 'Alibaba' },
      { id: 'deepseek-v3', name: 'DeepSeek V3', category: 'llm', description: 'DeepSeek V3 — strong reasoning', provider: 'DeepSeek' },

      // Video Models
      { id: 'sora-2', name: 'Sora 2', category: 'video', description: 'OpenAI Sora 2 — cinematic video generation', provider: 'OpenAI', isDefault: true },
      { id: 'veo-3', name: 'Veo 3', category: 'video', description: 'Google Veo 3 — high-fidelity video', provider: 'Google' },
      { id: 'kling-1.6', name: 'Kling 1.6', category: 'video', description: 'Kuaishou Kling 1.6 — realistic motion', provider: 'Kuaishou' },
      { id: 'runway-gen3', name: 'Runway Gen-3', category: 'video', description: 'Runway Gen-3 Alpha — creative video', provider: 'Runway' },
      { id: 'minimax-video', name: 'MiniMax Video', category: 'video', description: 'MiniMax — fast video generation', provider: 'MiniMax' },
      { id: 'pika-2.0', name: 'Pika 2.0', category: 'video', description: 'Pika 2.0 — expressive video AI', provider: 'Pika' },
      { id: 'luma-dream-machine', name: 'Luma Dream Machine', category: 'video', description: 'Luma Labs — dreamy video generation', provider: 'Luma' },
      { id: 'stable-video-diffusion', name: 'Stable Video', category: 'video', description: 'Stability AI — open video model', provider: 'Stability' },

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
    return this.getAvailableModels().find((m) => m.id === modelId);
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

    const model = this.getModelById(request.model);
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
          model: request.model,
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
        model: data.model || request.model,
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
  async generateVideo(userId: string, request: PoeVideoRequest) {
    const apiKey = await this.getUserApiKey(userId);
    if (!apiKey) {
      throw new BadRequestException('No Poe API key configured. Add one in Integrations Hub.');
    }

    const model = this.getModelById(request.model);
    if (!model || model.category !== 'video') {
      throw new BadRequestException(`Invalid video model: ${request.model}`);
    }

    try {
      const response = await fetch(`${this.POE_API_BASE}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: request.model,
          messages: [
            {
              role: 'user',
              content: `Generate a video: ${request.prompt}\nDuration: ${request.duration || 4}s\nResolution: ${request.resolution || '1280x720'}\nAspect ratio: ${request.aspectRatio || '16:9'}`,
            },
          ],
          temperature: 0.7,
          max_tokens: 4096,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        this.logger.error(`Poe Video API error: ${response.status} ${errorText}`);
        throw new BadRequestException(`Video generation failed: ${response.statusText}`);
      }

      const data = await response.json();
      const choice = data.choices?.[0];
      const content = choice?.message?.content || '';

      // Extract video URL from response content if present
      const videoUrlMatch = content.match(/https?:\/\/[^\s"']+\.(mp4|webm|mov)/i);

      return {
        id: data.id || `poe-video-${Date.now()}`,
        model: data.model || request.model,
        provider: model.provider,
        status: videoUrlMatch ? 'completed' : 'processing',
        videoUrl: videoUrlMatch?.[0] || null,
        thumbnailUrl: null,
        content,
        prompt: request.prompt,
        duration: request.duration || 4,
        resolution: request.resolution || '1280x720',
        createdAt: new Date().toISOString(),
      };
    } catch (error: any) {
      if (error instanceof BadRequestException) throw error;
      this.logger.error(`Poe Video generation failed: ${error.message}`);
      throw new BadRequestException(`Video generation failed: ${error.message}`);
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

    const modelDef = this.getModelById(model);
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
          model,
          messages: [
            {
              role: 'user',
              content: `Generate an image: ${prompt}\nSize: ${options?.width || 1024}x${options?.height || 1024}`,
            },
          ],
          temperature: 0.7,
          max_tokens: 4096,
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
        model: data.model || model,
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
