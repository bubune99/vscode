/**
 * Provider Selector
 *
 * Smart routing logic to select the most cost-effective provider
 * that meets quality requirements
 */

import { AIProvider, AIRequest, ProviderSelection } from '../types/index.js';

export class ProviderSelector {
  private providers: Map<string, AIProvider>;
  private localAvailable: boolean = false;

  constructor(providers: Map<string, AIProvider>) {
    this.providers = providers;
  }

  /**
   * Select best provider for request
   */
  select(request: AIRequest): ProviderSelection {
    const {
      complexity = 5,
      requiresReasoning = false,
      requiresToolCalling = false,
      critical = false,
      securityRelated = false
    } = request;

    const contextSize = this.estimateContextSize(request);

    // Ultra-simple: Local NPU (when available)
    if (this.localAvailable && complexity <= 2 && contextSize < 2000 && !requiresToolCalling) {
      return {
        provider: this.providers.get('local-npu')!,
        model: 'phi3:3b-mini',
        estimatedCost: 0.0001,
        estimatedLatency: 50,
        reasoning: 'Simple task, local NPU is fastest and free'
      };
    }

    // Simple-Medium: Local RAM (when available)
    if (this.localAvailable && complexity <= 5 && contextSize < 8000 && !requiresToolCalling) {
      return {
        provider: this.providers.get('local-ram')!,
        model: 'llama3.1:8b',
        estimatedCost: 0.001,
        estimatedLatency: 200,
        reasoning: 'Medium task, local RAM is fast and nearly free'
      };
    }

    // Heavy OR requires tool calling: Fireworks.ai
    if (complexity <= 8 || requiresToolCalling) {
      const provider = this.providers.get('fireworks')!;
      const model = requiresReasoning ? 'deepseek-v3' : 'llama-v3p3-70b';
      const cost = requiresReasoning ? 0.015 : 0.012;

      return {
        provider,
        model,
        estimatedCost: cost,
        estimatedLatency: requiresReasoning ? 3000 : 2000,
        reasoning: requiresReasoning
          ? 'Complex reasoning task, DeepSeek-V3 specialized for this'
          : 'Heavy task or tool calling needed, Fireworks has excellent tool calling'
      };
    }

    // Critical: Claude (expensive but best)
    if (critical || securityRelated) {
      return {
        provider: this.providers.get('claude')!,
        model: 'claude-sonnet-4.5',
        estimatedCost: 0.075,
        estimatedLatency: 2500,
        reasoning: 'Critical or security-related task, Claude provides highest quality'
      };
    }

    // Large context: Gemini 2.0 Flash (1M context window)
    if (contextSize > 100000) {
      return {
        provider: this.providers.get('gemini')!,
        model: 'gemini-2.0-flash',
        estimatedCost: 0.020,
        estimatedLatency: 1500,
        reasoning: 'Large context window needed (1M tokens), Gemini excels at this'
      };
    }

    // Default: Fireworks Llama 70B (good balance)
    return {
      provider: this.providers.get('fireworks')!,
      model: 'llama-v3p3-70b',
      estimatedCost: 0.012,
      estimatedLatency: 2000,
      reasoning: 'Default choice - excellent balance of cost, quality, and speed'
    };
  }

  /**
   * Estimate total context size in tokens
   */
  private estimateContextSize(request: AIRequest): number {
    const promptTokens = Math.ceil(request.prompt.length / 4);
    const contextTokens = request.context.reduce(
      (sum, ctx) => sum + Math.ceil(ctx.length / 4),
      0
    );
    return promptTokens + contextTokens;
  }

  /**
   * Set local provider availability
   */
  setLocalAvailable(available: boolean): void {
    this.localAvailable = available;
  }

  /**
   * Get all available providers
   */
  getAvailableProviders(): string[] {
    return Array.from(this.providers.keys());
  }

  /**
   * Check if specific provider is available
   */
  hasProvider(name: string): boolean {
    return this.providers.has(name);
  }
}
