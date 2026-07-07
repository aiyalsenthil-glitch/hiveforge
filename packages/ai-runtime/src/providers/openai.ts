import { AIProvider, CompletionOptions, CompletionResult } from '../types';
import { AIProviderError } from '@hiveforge/errors';

export class OpenAIProvider implements AIProvider {
  public readonly id = 'openai';
  private readonly apiKey: string;
  private readonly baseUrl: string;

  constructor(apiKey: string, baseUrl = 'https://api.openai.com/v1') {
    this.apiKey = apiKey;
    this.baseUrl = baseUrl;
  }

  async generateCompletion(options: CompletionOptions): Promise<CompletionResult> {
    const model = options.model || 'gpt-4o-mini';
    const body: any = {
      model,
      messages: options.messages,
      temperature: options.temperature ?? 0.7,
      max_tokens: options.maxTokens,
    };

    if (options.jsonMode) {
      body.response_format = { type: 'json_object' };
    }

    try {
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new AIProviderError(`OpenAI API request failed: ${response.status} ${response.statusText} - ${errorText}`);
      }

      const data = await response.json() as any;
      const content = data.choices?.[0]?.message?.content || '';
      const promptTokens = data.usage?.prompt_tokens || 0;
      const completionTokens = data.usage?.completion_tokens || 0;
      const totalTokens = data.usage?.total_tokens || 0;

      return {
        content,
        usage: {
          promptTokens,
          completionTokens,
          totalTokens,
        },
        provider: this.id,
        model,
      };
    } catch (error: any) {
      if (error instanceof AIProviderError) throw error;
      throw new AIProviderError(`Failed to fetch OpenAI completion: ${error.message}`, error);
    }
  }
}
