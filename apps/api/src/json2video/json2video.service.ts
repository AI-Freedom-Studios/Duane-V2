import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { decrypt } from '../common/crypto';

export interface Json2VideoRequest {
  prompt: string;
  duration?: number;
  resolution?: string;
}

export interface Json2VideoResult {
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
export class Json2VideoService {
  private readonly logger = new Logger(Json2VideoService.name);
  private readonly API_BASE = 'https://api.json2video.com/v2';
  private readonly jobs = new Map<string, Json2VideoResult & { projectId?: string }>();

  constructor(private prisma: PrismaService) {}

  private async getUserApiKey(userId: string): Promise<string | null> {
    const key = await this.prisma.providerKey.findFirst({
      where: { userId, providerSlug: 'json2video' },
      orderBy: { createdAt: 'desc' },
    });

    return key ? decrypt(key.encryptedKey) : null;
  }

  private mapResolution(resolution?: string) {
    if (resolution === '1920x1080') return 'full-hd';
    return 'hd';
  }

  private cleanText(value: string) {
    return value.replace(/\s+/g, ' ').trim();
  }

  private truncate(value: string, maxLength: number) {
    const clean = this.cleanText(value);
    return clean.length > maxLength ? `${clean.slice(0, maxLength - 3)}...` : clean;
  }

  private parsePrompt(prompt: string) {
    const lines = prompt
      .split(/\r?\n|(?=\b(?:title|scene\s*\d+|cta|outro|style)\s*:)/gi)
      .map((line) => this.cleanText(line))
      .filter(Boolean);
    const scenes: string[] = [];
    let title = '';
    let cta = '';
    let style = '';

    for (const line of lines) {
      const titleMatch = line.match(/^title\s*:\s*(.+)$/i);
      const sceneMatch = line.match(/^scene\s*\d+\s*:\s*(.+)$/i);
      const ctaMatch = line.match(/^(cta|outro)\s*:\s*(.+)$/i);
      const styleMatch = line.match(/^style\s*:\s*(.+)$/i);

      if (titleMatch) {
        title = titleMatch[1];
      } else if (sceneMatch) {
        scenes.push(sceneMatch[1]);
      } else if (ctaMatch) {
        cta = ctaMatch[2];
      } else if (styleMatch) {
        style = styleMatch[1];
      }
    }

    if (!title) {
      const quotedTitle = prompt.match(/titled\s+["“](.+?)["”]/i)?.[1];
      title = quotedTitle || scenes[0] || this.cleanText(prompt).split(/[.!?]/)[0] || 'AgentOS Video';
    }

    if (scenes.length === 0) {
      const sentenceParts = prompt
        .replace(/create\s+a\s+\d+[-\s]?second\s+\w+\s+video\s+(about|for)\s+/i, '')
        .split(/[.!?]+/)
        .map((part) => part.replace(/^(start with|add|use|make it|and)\s+/i, '').trim())
        .filter((part) => part.length > 8);

      scenes.push(...sentenceParts.slice(0, 4));
    }

    const uniqueScenes = Array.from(new Set(scenes.map((scene) => this.cleanText(scene)))).slice(0, 5);
    if (cta && !uniqueScenes.some((scene) => scene.toLowerCase() === cta.toLowerCase())) {
      uniqueScenes.push(cta);
    }

    return {
      title: this.truncate(title, 54),
      scenes: uniqueScenes.length > 0 ? uniqueScenes.map((scene) => this.truncate(scene, 82)) : [this.truncate(prompt, 82)],
      cta: cta ? this.truncate(cta, 54) : 'Generated with AgentOS',
      style,
    };
  }

  private getPalette(style: string) {
    const lower = style.toLowerCase();
    if (lower.includes('neon') || lower.includes('cyber')) {
      return { backgrounds: ['#020617', '#111827', '#312e81', '#164e63'], accent: '#22d3ee', muted: '#a5f3fc' };
    }
    if (lower.includes('warm') || lower.includes('gold')) {
      return { backgrounds: ['#1c1917', '#451a03', '#78350f', '#292524'], accent: '#fbbf24', muted: '#fed7aa' };
    }
    return { backgrounds: ['#020617', '#0f172a', '#1d4ed8', '#0f766e'], accent: '#67e8f9', muted: '#bfdbfe' };
  }

  private buildScene(
    text: string,
    duration: number,
    index: number,
    total: number,
    palette: { backgrounds: string[]; accent: string; muted: string },
  ) {
    const isOpening = index === 0;
    const isClosing = index === total - 1 && total > 1;
    const background = palette.backgrounds[index % palette.backgrounds.length];
    const headlineSize = isOpening ? '70px' : isClosing ? '60px' : '54px';
    const eyebrow = isOpening ? 'AI OPERATING LAYER' : isClosing ? 'CALL TO ACTION' : `SCENE ${String(index + 1).padStart(2, '0')}`;
    const kicker = isOpening ? 'AGENTOS' : isClosing ? 'READY TO LAUNCH' : 'WORKFLOW HIGHLIGHT';

    return {
      duration,
      'background-color': background,
      elements: [
        {
          type: 'text',
          text: eyebrow,
          x: 80,
          y: 70,
          width: 1120,
          height: 60,
          settings: {
            'font-size': '22px',
            'font-color': palette.accent,
            'font-family': 'Arial',
            'text-align': 'center',
          },
        },
        {
          type: 'text',
          text: kicker,
          x: 120,
          y: 150,
          width: 1040,
          height: 60,
          settings: {
            'font-size': '24px',
            'font-color': palette.muted,
            'font-family': 'Arial',
            'text-align': 'center',
          },
        },
        {
          type: 'text',
          text,
          x: 120,
          y: 270,
          width: 1040,
          height: 260,
          settings: {
            'font-size': headlineSize,
            'font-color': '#ffffff',
            'font-family': 'Arial',
            'font-weight': '700',
            'text-align': 'center',
          },
        },
        {
          type: 'text',
          text: isClosing ? 'agentos.ai  |  Generated with AgentOS' : 'Generated with AgentOS',
          x: 120,
          y: 620,
          width: 1040,
          height: 40,
          settings: {
            'font-size': '22px',
            'font-color': '#cbd5e1',
            'font-family': 'Arial',
            'text-align': 'center',
          },
        },
      ],
    };
  }

  private buildMovie(prompt: string, duration: number, resolution?: string) {
    const parsed = this.parsePrompt(prompt);
    const palette = this.getPalette(parsed.style);
    const sceneTexts = [parsed.title, ...parsed.scenes];
    if (!sceneTexts.some((scene) => scene.toLowerCase() === parsed.cta.toLowerCase())) {
      sceneTexts.push(parsed.cta);
    }
    const scenes = sceneTexts.slice(0, 6);
    const sceneDuration = Math.max(2, Math.round(duration / scenes.length));

    return {
      resolution: this.mapResolution(resolution),
      quality: 'high',
      scenes: scenes.map((scene, index) => this.buildScene(scene, sceneDuration, index, scenes.length, palette)),
    };
  }

  private extractProjectId(data: any) {
    return data?.project || data?.projectId || data?.id || data?.movie?.project || data?.movie?.id || null;
  }

  private extractVideoUrl(data: any): string | null {
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
      candidates.find((url) => /download|movie|video|json2video/i.test(url)) ||
      null
    );
  }

  private mapStatus(data: any): 'processing' | 'completed' | 'failed' {
    const status = String(data?.status || data?.movie?.status || data?.data?.status || '').toLowerCase();
    if (['done', 'completed', 'complete', 'success', 'finished'].includes(status)) return 'completed';
    if (['failed', 'error', 'cancelled', 'canceled'].includes(status)) return 'failed';
    return 'processing';
  }

  async generateVideo(userId: string, request: Json2VideoRequest): Promise<Json2VideoResult> {
    const apiKey = await this.getUserApiKey(userId);
    if (!apiKey) {
      throw new BadRequestException('No JSON2Video API key configured. Add one in Integrations Hub.');
    }

    const duration = Math.max(3, Math.min(Number(request.duration || 8), 60));
    const response = await fetch(`${this.API_BASE}/movies`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
      },
      body: JSON.stringify(this.buildMovie(request.prompt, duration, request.resolution)),
    });

    if (!response.ok) {
      const errorText = await response.text();
      this.logger.error(`JSON2Video create failed: ${response.status} ${errorText}`);
      throw new BadRequestException(`JSON2Video generation failed: ${errorText || response.statusText}`);
    }

    const data = await response.json();
    const projectId = this.extractProjectId(data);
    if (!projectId) {
      throw new BadRequestException('JSON2Video accepted the request but did not return a project id.');
    }

    const result: Json2VideoResult & { projectId: string } = {
      id: `json2video-${projectId}`,
      projectId,
      model: 'json2video-template',
      provider: 'JSON2Video',
      status: 'processing',
      videoUrl: this.extractVideoUrl(data),
      thumbnailUrl: null,
      content: 'JSON2Video render is running in the background.',
      prompt: request.prompt,
      duration,
      resolution: request.resolution || '1280x720',
      createdAt: new Date().toISOString(),
      error: null,
    };

    if (result.videoUrl) result.status = 'completed';
    this.jobs.set(result.id, result);
    return result;
  }

  async getVideoStatus(userId: string, videoId: string): Promise<Json2VideoResult> {
    const apiKey = await this.getUserApiKey(userId);
    if (!apiKey) {
      throw new BadRequestException('No JSON2Video API key configured. Add one in Integrations Hub.');
    }

    const job = this.jobs.get(videoId);
    const projectId = job?.projectId || videoId.replace(/^json2video-/, '');

    const response = await fetch(`${this.API_BASE}/movies?project=${encodeURIComponent(projectId)}`, {
      headers: { 'x-api-key': apiKey },
    });

    if (!response.ok) {
      const errorText = await response.text();
      this.logger.error(`JSON2Video status failed: ${response.status} ${errorText}`);
      throw new BadRequestException(`JSON2Video status failed: ${errorText || response.statusText}`);
    }

    const data = await response.json();
    const status = this.mapStatus(data);
    const videoUrl = this.extractVideoUrl(data);
    const next: Json2VideoResult & { projectId: string } = {
      id: videoId,
      projectId,
      model: 'json2video-template',
      provider: 'JSON2Video',
      status: videoUrl ? 'completed' : status,
      videoUrl,
      thumbnailUrl: null,
      content: videoUrl ? 'JSON2Video render is ready.' : 'JSON2Video render is still processing.',
      prompt: job?.prompt,
      duration: job?.duration,
      resolution: job?.resolution || '1280x720',
      createdAt: job?.createdAt || new Date().toISOString(),
      error: status === 'failed' ? JSON.stringify(data?.error || data?.message || data) : null,
    };

    this.jobs.set(videoId, next);
    return next;
  }
}
