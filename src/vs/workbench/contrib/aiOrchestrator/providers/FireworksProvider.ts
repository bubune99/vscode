/**
 * Fireworks.ai Provider
 *
 * Primary cloud provider - cheap, fast, excellent tool calling
 *
 * Models:
 * - llama-v3p3-70b-instruct: $0.90/1M tokens (coding)
 * - deepseek-v3: $1.14/1M tokens (reasoning)
 * - llama-v3p1-8b-instruct: $0.20/1M tokens (quick tasks)
 */

import { BaseProvider } from './BaseProvider.js';
import { AIRequest, AIResponse, ToolCall } from '../types/index.js';

export class FireworksProvider extends BaseProvider {
  name = 'fireworks';
  supportsToolCalling = true;
  supportsStreaming = true;
  maxContextTokens = 128000;
  costPer1MTokens = { input: 0.90, output: 0.90 }; // Llama 70B

  private apiKey: string;
  private baseUrl = 'https://api.fireworks.ai/inference/v1';
  private model: string;

  constructor(apiKey: string, model: 'quick' | 'coding' | 'reasoning' = 'coding') {
    super();
    this.apiKey = apiKey;

    // Select model
    switch (model) {
      case 'quick':
        this.model = 'accounts/fireworks/models/llama-v3p1-8b-instruct';
        this.costPer1MTokens = { input: 0.20, output: 0.20 };
        break;
      case 'reasoning':
        this.model = 'accounts/fireworks/models/deepseek-v3';
        this.costPer1MTokens = { input: 1.14, output: 1.14 };
        break;
      case 'coding':
      default:
        this.model = 'accounts/fireworks/models/llama-v3p3-70b-instruct';
        this.costPer1MTokens = { input: 0.90, output: 0.90 };
    }
  }

  /**
   * Execute AI request via Fireworks.ai API
   */
  async execute(request: AIRequest): Promise<AIResponse> {
    const startTime = Date.now();

    try {
      // Build messages
      const messages = this.buildMessages(request);

      // Build request body
      const body: any = {
        model: this.model,
        messages,
        temperature: request.temperature ?? 0.7,
        max_tokens: request.maxTokens ?? 4096,
        stream: request.stream ?? false
      };

      // Add tools if provided
      if (request.tools && request.tools.length > 0) {
        body.tools = this.formatTools(request.tools);
        body.tool_choice = 'auto';
      }

      // Make API request
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify(body)
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Fireworks API error: ${response.status} - ${error}`);
      }

      const data = await response.json();
      const latency = Date.now() - startTime;

      // Parse response
      const choice = data.choices[0];
      const content = choice.message.content || '';
      const toolCalls = this.parseToolCalls(choice.message.tool_calls);

      // Calculate cost
      const usage = data.usage;
      const cost =
        (usage.prompt_tokens / 1_000_000) * this.costPer1MTokens.input +
        (usage.completion_tokens / 1_000_000) * this.costPer1MTokens.output;

      return {
        content,
        toolCalls,
        usage: {
          inputTokens: usage.prompt_tokens,
          outputTokens: usage.completion_tokens,
          cost
        },
        latency,
        model: this.model,
        provider: this.name
      };
    } catch (error) {
      console.error('Fireworks execution error:', error);
      throw error;
    }
  }

  /**
   * Build messages array from request
   */
  private buildMessages(request: AIRequest): any[] {
    const messages: any[] = [];

    // Add context as system message
    if (request.context && request.context.length > 0) {
      messages.push({
        role: 'system',
        content: this.buildContextString(request.context)
      });
    }

    // Add user prompt
    messages.push({
      role: 'user',
      content: request.prompt
    });

    return messages;
  }

  /**
   * Parse tool calls from API response
   */
  private parseToolCalls(toolCalls?: any[]): ToolCall[] | undefined {
    if (!toolCalls || toolCalls.length === 0) return undefined;

    return toolCalls.map(tc => ({
      tool: tc.function.name,
      arguments: JSON.parse(tc.function.arguments)
    }));
  }

  /**
   * Override cost estimation with accurate Fireworks pricing
   */
  override estimateCost(request: AIRequest): number {
    const inputTokens = this.estimateTokens(
      request.prompt + this.buildContextString(request.context)
    );
    const outputTokens = request.maxTokens || 2048;

    const inputCost = (inputTokens / 1_000_000) * this.costPer1MTokens.input;
    const outputCost = (outputTokens / 1_000_000) * this.costPer1MTokens.output;

    return inputCost + outputCost;
  }
}

/**
 * Factory functions for different Fireworks models
 */
export class FireworksFactory {
  static createQuick(apiKey: string): FireworksProvider {
    return new FireworksProvider(apiKey, 'quick');
  }

  static createCoding(apiKey: string): FireworksProvider {
    return new FireworksProvider(apiKey, 'coding');
  }

  static createReasoning(apiKey: string): FireworksProvider {
    return new FireworksProvider(apiKey, 'reasoning');
  }
}
