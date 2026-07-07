import { config } from '@hiveforge/config';
import { AIProvider, CompletionOptions, CompletionResult } from '../types';
import { OpenAIProvider } from '../providers/openai';
import { FireworksProvider } from '../providers/fireworks';
import { MockAIProvider } from '../providers/mock';

export class AIRuntime {
  private defaultProvider: AIProvider;
  private providers = new Map<string, AIProvider>();

  constructor() {
    const mockProvider = new MockAIProvider();
    this.providers.set('mock', mockProvider);

    const fireworksKey = config.FIREWORKS_API_KEY;
    if (fireworksKey) {
      const fwProvider = new FireworksProvider(fireworksKey);
      this.providers.set('fireworks', fwProvider);
      this.defaultProvider = fwProvider;
    } else {
      this.defaultProvider = mockProvider;
    }

    const openAiKey = process.env['OPENAI_API_KEY'] || '';
    if (openAiKey) {
      this.providers.set('openai', new OpenAIProvider(openAiKey));
      if (!this.defaultProvider || this.defaultProvider.id === 'mock') {
        this.defaultProvider = this.providers.get('openai')!;
      }
    }

    if (config.MOCK_AI) {
      this.defaultProvider = mockProvider;
    }
  }

  async generateCompletion(
    options: CompletionOptions,
    providerId?: string
  ): Promise<CompletionResult> {
    const provider = providerId ? this.providers.get(providerId) : this.defaultProvider;
    if (!provider) {
      throw new Error(`AI Provider "${providerId}" not configured or supported.`);
    }
    return provider.generateCompletion(options);
  }

  getDefaultProviderId(): string {
    return this.defaultProvider.id;
  }
}

export const ai = new AIRuntime();
