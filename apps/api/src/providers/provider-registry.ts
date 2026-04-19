import { Injectable } from '@nestjs/common';
import { ProviderCategory } from '@agentos/shared';

export interface ProviderDefinition {
  slug: string;
  name: string;
  category: ProviderCategory;
  description: string;
  website: string;
  requiredFields: string[];
  testEndpoint?: string;
  testFn?: (apiKey: string, fields?: Record<string, string>) => Promise<boolean>;
}

@Injectable()
export class ProviderRegistry {
  private providers = new Map<string, ProviderDefinition>();

  constructor() {
    this.registerDefaults();
  }

  register(def: ProviderDefinition) {
    this.providers.set(def.slug, def);
  }

  get(slug: string): ProviderDefinition | undefined {
    return this.providers.get(slug);
  }

  getAll(): ProviderDefinition[] {
    return Array.from(this.providers.values());
  }

  getByCategory(category: ProviderCategory): ProviderDefinition[] {
    return this.getAll().filter((p) => p.category === category);
  }

  private registerDefaults() {
    // LLM Providers
    this.register({
      slug: 'openai',
      name: 'OpenAI',
      category: ProviderCategory.LLM,
      description: 'GPT-4, GPT-3.5, DALL-E, Whisper',
      website: 'https://platform.openai.com',
      requiredFields: ['apiKey'],
      testEndpoint: 'https://api.openai.com/v1/models',
      testFn: async (apiKey) => {
        const res = await fetch('https://api.openai.com/v1/models', {
          headers: { Authorization: `Bearer ${apiKey}` },
        });
        return res.ok;
      },
    });

    this.register({
      slug: 'anthropic',
      name: 'Anthropic',
      category: ProviderCategory.LLM,
      description: 'Claude models',
      website: 'https://console.anthropic.com',
      requiredFields: ['apiKey'],
      testFn: async (apiKey) => {
        const res = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: {
            'x-api-key': apiKey,
            'anthropic-version': '2023-06-01',
            'content-type': 'application/json',
          },
          body: JSON.stringify({ model: 'claude-3-haiku-20240307', max_tokens: 1, messages: [{ role: 'user', content: 'hi' }] }),
        });
        return res.ok;
      },
    });

    this.register({
      slug: 'google',
      name: 'Google (Gemini)',
      category: ProviderCategory.LLM,
      description: 'Gemini Pro, Gemini Ultra',
      website: 'https://ai.google.dev',
      requiredFields: ['apiKey'],
      testFn: async (apiKey) => {
        const res = await fetch(`https://generativelanguage.googleapis.com/v1/models?key=${apiKey}`);
        return res.ok;
      },
    });

    this.register({
      slug: 'mistral',
      name: 'Mistral',
      category: ProviderCategory.LLM,
      description: 'Mistral, Mixtral models',
      website: 'https://console.mistral.ai',
      requiredFields: ['apiKey'],
      testFn: async (apiKey) => {
        const res = await fetch('https://api.mistral.ai/v1/models', {
          headers: { Authorization: `Bearer ${apiKey}` },
        });
        return res.ok;
      },
    });

    this.register({
      slug: 'cohere',
      name: 'Cohere',
      category: ProviderCategory.LLM,
      description: 'Command, Embed, Rerank models',
      website: 'https://dashboard.cohere.com',
      requiredFields: ['apiKey'],
      testFn: async (apiKey) => {
        const res = await fetch('https://api.cohere.ai/v1/models', {
          headers: { Authorization: `Bearer ${apiKey}` },
        });
        return res.ok;
      },
    });

    // Video Providers
    this.register({
      slug: 'runway',
      name: 'Runway',
      category: ProviderCategory.VIDEO,
      description: 'Gen-2 video generation',
      website: 'https://runwayml.com',
      requiredFields: ['apiKey'],
    });

    this.register({
      slug: 'replicate',
      name: 'Replicate',
      category: ProviderCategory.VIDEO,
      description: 'Open-source model hosting',
      website: 'https://replicate.com',
      requiredFields: ['apiKey'],
      testFn: async (apiKey) => {
        const res = await fetch('https://api.replicate.com/v1/models', {
          headers: { Authorization: `Token ${apiKey}` },
        });
        return res.ok;
      },
    });

    this.register({
      slug: 'stability',
      name: 'Stability AI',
      category: ProviderCategory.VIDEO,
      description: 'Stable Diffusion, Stable Video',
      website: 'https://platform.stability.ai',
      requiredFields: ['apiKey'],
      testFn: async (apiKey) => {
        const res = await fetch('https://api.stability.ai/v1/engines/list', {
          headers: { Authorization: `Bearer ${apiKey}` },
        });
        return res.ok;
      },
    });

    this.register({
      slug: 'pika',
      name: 'Pika',
      category: ProviderCategory.VIDEO,
      description: 'AI video generation',
      website: 'https://pika.art',
      requiredFields: ['apiKey'],
    });

    this.register({
      slug: 'heygen',
      name: 'HeyGen',
      category: ProviderCategory.VIDEO,
      description: 'AI avatar video generation',
      website: 'https://heygen.com',
      requiredFields: ['apiKey'],
    });

    this.register({
      slug: 'json2video',
      name: 'JSON2Video',
      category: ProviderCategory.VIDEO,
      description: 'Template-based video rendering from JSON scenes',
      website: 'https://json2video.com',
      requiredFields: ['apiKey'],
      testFn: async (apiKey) => {
        const res = await fetch('https://api.json2video.com/v2/movies', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': apiKey,
          },
          body: JSON.stringify({
            draft: true,
            resolution: 'sd',
            scenes: [
              {
                duration: 1,
                'background-color': '#020617',
                elements: [
                  {
                    type: 'text',
                    text: 'AgentOS connection test',
                    settings: {
                      'font-size': '32px',
                      'font-color': '#ffffff',
                      'horizontal-position': 'center',
                      'vertical-position': 'center',
                    },
                  },
                ],
              },
            ],
          }),
        });
        return res.ok;
      },
    });

    this.register({
      slug: 'generic_http',
      name: 'Generic HTTP Provider',
      category: ProviderCategory.VIDEO,
      description: 'Custom HTTP-based video API',
      website: '',
      requiredFields: ['apiKey', 'baseUrl'],
    });

    // Audio
    this.register({
      slug: 'elevenlabs',
      name: 'ElevenLabs',
      category: ProviderCategory.AUDIO,
      description: 'Text-to-speech and voice cloning',
      website: 'https://elevenlabs.io',
      requiredFields: ['apiKey'],
      testFn: async (apiKey) => {
        const res = await fetch('https://api.elevenlabs.io/v1/voices', {
          headers: { 'xi-api-key': apiKey },
        });
        return res.ok;
      },
    });

    // Aggregator — Primary Provider
    this.register({
      slug: 'poe',
      name: 'Poe by Quora',
      category: ProviderCategory.AGGREGATOR,
      description: '600+ AI models — GPT-4o, Claude, Gemini, Sora 2, Veo 3, Kling, DALL-E 3, and more',
      website: 'https://poe.com',
      requiredFields: ['apiKey'],
      testFn: async (apiKey) => {
        // Verify the key against Poe's account-level usage endpoint instead of a
        // specific model call. This avoids false negatives when a particular
        // model handle changes or the account lacks credits for that model.
        const res = await fetch('https://api.poe.com/usage/current_balance', {
          headers: {
            'Authorization': `Bearer ${apiKey}`,
          },
        });
        return res.ok;
      },
    });
  }
}
