/**
 * Claude (Anthropic) Provider
 *
 * Used for: Critical decisions, security reviews, high-stakes tasks
 *
 * Model: Claude Sonnet 4.5
 * Cost: $3.00/1M input, $15.00/1M output
 * Context: 200K tokens
 */

import { BaseProvider } from './BaseProvider.js';
import { AIRequest, AIResponse, ToolCall } from '../types/index.js';

export class ClaudeProvider extends BaseProvider {
  name = 'claude';
  supportsToolCalling = true;
  supportsStreaming = true;
  maxContextTokens = 200000;
  costPer1MTokens = { input: 3.00, output: 15.00 };

  private apiKey: string;
  private baseUrl = 'https://api.anthropic.com/v1';
  private model = 'claude-sonnet-4-20250514';
  private version = '2023-06-01';

  constructor(apiKey: string) {
    super();
    this.apiKey = apiKey;
  }

  async execute(request: AIRequest): Promise<AIResponse> {
    const startTime = Date.now();

    try {
      // Build messages
      const messages = this.buildMessages(request);

      // Build request body
      const body: any = {
        model: this.model,
        messages,
        max_tokens: request.maxTokens ?? 4096,
        temperature: request.temperature ?? 0.7
      };

      // Add system prompt from context
      if (request.context && request.context.length > 0) {
        body.system = this.buildContextString(request.context);
      }

      // Add tools if provided
      if (request.tools && request.tools.length > 0) {
        body.tools = this.formatClaudeTools(request.tools);
      }

      // Make API request
      const response = await fetch(`${this.baseUrl}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.apiKey,
          'anthropic-version': this.version
        },
        body: JSON.stringify(body)
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Claude API error: ${response.status} - ${error}`);
      }

      const data = await response.json();
      const latency = Date.now() - startTime;

      // Parse response
      const content = data.content
        .filter((c: any) => c.type === 'text')
        .map((c: any) => c.text)
        .join('\n');

      const toolCalls = this.parseClaudeToolCalls(
        data.content.filter((c: any) => c.type === 'tool_use')
      );

      // Calculate cost
      const usage = data.usage;
      const cost =
        (usage.input_tokens / 1_000_000) * this.costPer1MTokens.input +
        (usage.output_tokens / 1_000_000) * this.costPer1MTokens.output;

      return {
        content,
        toolCalls,
        usage: {
          inputTokens: usage.input_tokens,
          outputTokens: usage.output_tokens,
          cost
        },
        latency,
        model: this.model,
        provider: this.name
      };
    } catch (error) {
      console.error('Claude execution error:', error);
      throw error;
    }
  }

  private buildMessages(request: AIRequest): any[] {
    return [
      {
        role: 'user',
        content: request.prompt
      }
    ];
  }

  private formatClaudeTools(tools: any[]): any[] {
    return tools.map(tool => ({
      name: tool.name,
      description: tool.description,
      input_schema: {
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
    }));
  }

  private parseClaudeToolCalls(toolUses: any[]): ToolCall[] | undefined {
    if (!toolUses || toolUses.length === 0) return undefined;

    return toolUses.map(tu => ({
      tool: tu.name,
      arguments: tu.input
    }));
  }
}
