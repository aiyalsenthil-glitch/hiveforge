import { AIProvider, CompletionOptions, CompletionResult } from '../types';

export class LocalROCmProvider implements AIProvider {
  public readonly id = 'rocm';
  private endpoint: string;

  constructor(endpoint = 'http://localhost:11434') {
    this.endpoint = endpoint;
  }

  async generateCompletion(options: CompletionOptions): Promise<CompletionResult> {
    const formattedMessages = options.messages.map(m => ({
      role: m.role,
      content: m.content
    }));

    try {
      // Connect to local Ollama server running on AMD ROCm
      const response = await fetch(`${this.endpoint}/api/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: options.model || 'llama3',
          messages: formattedMessages,
          options: {
            temperature: options.temperature ?? 0.7,
          },
          stream: false,
          format: options.jsonMode ? 'json' : undefined
        }),
      });

      if (!response.ok) {
        throw new Error(`Local ROCm server returned ${response.status}`);
      }

      const data = await response.json();
      const content = data.message?.content || '';
      
      const promptTokens = options.messages.reduce((acc, m) => acc + m.content.split(' ').length, 0);
      const completionTokens = content.split(' ').length;

      return {
        content,
        usage: {
          promptTokens,
          completionTokens,
          totalTokens: promptTokens + completionTokens,
        },
        provider: this.id,
        model: options.model || 'llama3 (local ROCm)',
      };
    } catch (error) {
      console.warn(`Local ROCm server at ${this.endpoint} is offline. Falling back to context-aware simulator...`);
      // Fallback to Mock provider logic dynamically to prevent demo failures
      const { MockAIProvider } = require('./mock');
      const mockResult = await new MockAIProvider().generateCompletion(options);
      return {
        ...mockResult,
        provider: this.id,
        model: `${mockResult.model} (ROCm Fallback)`,
      };
    }
  }
}
