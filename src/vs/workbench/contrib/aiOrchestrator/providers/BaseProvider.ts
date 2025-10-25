/**
 * Base Provider Class
 *
 * Abstract base class that all AI providers extend
 */

import { AIProvider, AIRequest, AIResponse } from '../types/index.js';

export abstract class BaseProvider implements AIProvider {
  abstract name: string;
  abstract supportsToolCalling: boolean;
  abstract supportsStreaming: boolean;
  abstract maxContextTokens: number;
  abstract costPer1MTokens: { input: number; output: number };

  /**
   * Execute an AI request
   */
  abstract execute(request: AIRequest): Promise<AIResponse>;

  /**
   * Estimate cost for a request
   */
  estimateCost(request: AIRequest): number {
    // Estimate tokens (rough approximation: 1 token ≈ 4 characters)
    const inputTokens = this.estimateTokens(
      request.prompt + request.context.join('\n')
    );
    const outputTokens = request.maxTokens || 2048;

    const inputCost = (inputTokens / 1_000_000) * this.costPer1MTokens.input;
    const outputCost = (outputTokens / 1_000_000) * this.costPer1MTokens.output;

    return inputCost + outputCost;
  }

  /**
   * Check if provider is available
   */
  async checkAvailability(): Promise<boolean> {
    try {
      // Simple health check
      const response = await this.execute({
        prompt: 'Hello',
        context: [],
        maxTokens: 10
      });
      return !!response.content;
    } catch (error) {
      console.error(`${this.name} availability check failed:`, error);
      return false;
    }
  }

  /**
   * Estimate token count from text
   */
  protected estimateTokens(text: string): number {
    // Rough approximation: 1 token ≈ 4 characters
    return Math.ceil(text.length / 4);
  }

  /**
   * Build context string from array
   */
  protected buildContextString(context: string[]): string {
    if (context.length === 0) return '';
    return '\n\n<context>\n' + context.join('\n\n') + '\n</context>\n\n';
  }

  /**
   * Format tool definitions for API
   */
  protected formatTools(tools?: any[]): any[] {
    if (!tools || tools.length === 0) return [];

    return tools.map(tool => ({
      type: 'function',
      function: {
        name: tool.name,
        description: tool.description,
        parameters: {
          type: 'object',
          properties: tool.parameters.reduce((acc: any, param: any) => {
            acc[param.name] = {
              type: param.type,
              description: param.description
            };
            return acc;
          }, {}),
          required: tool.parameters
            .filter((p: any) => p.required)
            .map((p: any) => p.name)
        }
      }
    }));
  }
}
