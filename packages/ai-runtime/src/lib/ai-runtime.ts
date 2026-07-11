import { config } from '@hiveforge/config';
import { AIProvider, CompletionOptions, CompletionResult } from '../types';
import { OpenAIProvider } from '../providers/openai';
import { FireworksProvider } from '../providers/fireworks';
import { MockAIProvider } from '../providers/mock';
import { LocalROCmProvider } from '../providers/local-rocm';

export class AIRuntime {
  private defaultProvider: AIProvider;
  private providers = new Map<string, AIProvider>();

  constructor() {
    const mockProvider = new MockAIProvider();
    this.providers.set('mock', mockProvider);

    const rocmProvider = new LocalROCmProvider();
    this.providers.set('rocm', rocmProvider);
    this.defaultProvider = rocmProvider;

    const fireworksKey = config.FIREWORKS_API_KEY;
    if (fireworksKey) {
      const fwProvider = new FireworksProvider(fireworksKey);
      this.providers.set('fireworks', fwProvider);
      this.defaultProvider = fwProvider;
    }

    const openAiKey = process.env['OPENAI_API_KEY'] || '';
    if (openAiKey) {
      this.providers.set('openai', new OpenAIProvider(openAiKey));
      if (!this.defaultProvider || this.defaultProvider.id === 'rocm') {
        this.defaultProvider = this.providers.get('openai')!;
      }
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
