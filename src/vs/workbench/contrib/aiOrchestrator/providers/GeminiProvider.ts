/**
 * Gemini 2.0 Flash Provider
 *
 * Used for: Large context analysis (1M tokens), full codebase understanding
 *
 * Model: Gemini 2.0 Flash
 * Cost: $0.10/1M input, $0.40/1M output
 * Context: 1M tokens (!)
 */

import { BaseProvider } from './BaseProvider.js';
import { AIRequest, AIResponse } from '../types/index.js';

export class GeminiProvider extends BaseProvider {
  name = 'gemini';
  supportsToolCalling = true;
  supportsStreaming = true;
  maxContextTokens = 1000000; // 1M tokens!
  costPer1MTokens = { input: 0.10, output: 0.40 };

  private apiKey: string;
  private baseUrl = 'https://generativelanguage.googleapis.com/v1beta';
  private model = 'gemini-2.0-flash-exp';

  constructor(apiKey: string) {
    super();
    this.apiKey = apiKey;
  }

  async execute(request: AIRequest): Promise<AIResponse> {
    const startTime = Date.now();

    try {
      // Build contents
      const contents = this.buildContents(request);

      // Build request body
      const body: any = {
        contents,
        generationConfig: {
          temperature: request.temperature ?? 0.7,
          maxOutputTokens: request.maxTokens ?? 4096
        }
      };

      // Add tools if provided (Gemini uses function declarations)
      if (request.tools && request.tools.length > 0) {
        body.tools = [{
          functionDeclarations: this.formatGeminiTools(request.tools)
        }];
      }

      // Make API request
      const response = await fetch(
        `${this.baseUrl}/models/${this.model}:generateContent?key=${this.apiKey}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(body)
        }
      );

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Gemini API error: ${response.status} - ${error}`);
      }

      const data = await response.json();
      const latency = Date.now() - startTime;

      // Parse response
      const candidate = data.candidates[0];
      const content = candidate.content.parts
        .filter((p: any) => p.text)
        .map((p: any) => p.text)
        .join('\n');

      const toolCalls = this.parseGeminiToolCalls(
        candidate.content.parts.filter((p: any) => p.functionCall)
      );

      // Calculate cost (Gemini provides token counts in usageMetadata)
      const usage = data.usageMetadata;
      const cost =
        (usage.promptTokenCount / 1_000_000) * this.costPer1MTokens.input +
        (usage.candidatesTokenCount / 1_000_000) * this.costPer1MTokens.output;

      return {
        content,
        toolCalls,
        usage: {
          inputTokens: usage.promptTokenCount,
          outputTokens: usage.candidatesTokenCount,
          cost
        },
        latency,
        model: this.model,
        provider: this.name
      };
    } catch (error) {
      console.error('Gemini execution error:', error);
      throw error;
    }
  }

  private buildContents(request: AIRequest): any[] {
    const parts: any[] = [];

    // Add context
    if (request.context && request.context.length > 0) {
      parts.push({
        text: this.buildContextString(request.context)
      });
    }

    // Add prompt
    parts.push({
      text: request.prompt
    });

    return [
      {
        role: 'user',
        parts
      }
    ];
  }

  private formatGeminiTools(tools: any[]): any[] {
    return tools.map(tool => ({
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
    }));
  }

  private parseGeminiToolCalls(functionCalls: any[]): any[] | undefined {
    if (!functionCalls || functionCalls.length === 0) return undefined;

    return functionCalls.map(fc => ({
      tool: fc.functionCall.name,
      arguments: fc.functionCall.args
    }));
  }
}
