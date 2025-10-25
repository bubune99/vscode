# Multi-Cloud API Framework for Unified Ecosystem

**Comprehensive guide for balancing function and cost across multiple AI providers**

---

## Executive Summary

This document defines the **Multi-Cloud API Framework** for the unified AI development ecosystem. The framework intelligently routes requests across **6 AI providers** based on task requirements, cost constraints, and quality needs.

### Supported Providers (Initial Framework)

1. **Local Models** (Minisforum NAS) - Free, private, fast
2. **Fireworks.ai** - Cost-effective cloud inference
3. **Claude (Anthropic)** - Best reasoning and architecture
4. **Gemini 2.0 Flash (Google)** - Massive context, multimodal
5. **OpenAI Codex** - Code completion and generation
6. **v0 (Vercel)** - UI component generation

The framework is **extensible by design**, making it easy to add new providers (Groq, Together.ai, Replicate, etc.) as needed.

---

## Table of Contents

1. [Provider Comparison Matrix](#provider-comparison-matrix)
2. [Agent Selection Logic](#agent-selection-logic)
3. [Cost Optimization Strategy](#cost-optimization-strategy)
4. [Provider Integration Patterns](#provider-integration-patterns)
5. [Fallback and Redundancy](#fallback-and-redundancy)
6. [API Key Management](#api-key-management)
7. [Rate Limiting and Quotas](#rate-limiting-and-quotas)
8. [Implementation Examples](#implementation-examples)

---

## Provider Comparison Matrix

### Complete Provider Breakdown

| Provider | Best Use Case | Speed | Cost (1M tokens) | Context | Quality | Privacy |
|----------|--------------|-------|------------------|---------|---------|---------|
| **Local (Minisforum)** | Routine tasks, code completion | 20-60 tok/s | $0 (free) | 8-64K | ★★★★☆ | ✅ Full |
| **Fireworks.ai** | Balanced tasks, high throughput | 200-300 tok/s | $0.28-$1.14 | 64-128K | ★★★★★ | ⚠️ API logs |
| **Claude Sonnet 4.5** | Complex reasoning, architecture | 80-100 tok/s | $3.00-$15.00 | 200K | ★★★★★ | ⚠️ API logs |
| **Gemini 2.0 Flash** | Massive context, multimodal | 100-120 tok/s | $0.075-$0.30 | 1M | ★★★★☆ | ⚠️ API logs |
| **OpenAI Codex** | Code completion, generation | 60-80 tok/s | $0 (free tier) | 8K | ★★★★☆ | ⚠️ API logs |
| **v0 API** | UI component generation | Specialized | Per generation | Custom | ★★★★★ | ⚠️ API logs |

---

### Detailed Provider Analysis

#### 1. Local Models (Minisforum NAS)

**Models Available**:
- Llama 3.3 70B (Q4_K_M, 40GB)
- DeepSeek-V3 (FP16, 85GB)
- Qwen 2.5 72B (Q4_K_M, 42GB)
- Mistral Large 2 (Q4_K_M, 45GB)

**Strengths**:
- ✅ **Zero cost** (after hardware investment)
- ✅ **Complete privacy** (data never leaves network)
- ✅ **Low latency** (10GbE network, 50-100ms)
- ✅ **No rate limits** (use as much as needed)
- ✅ **Offline capable** (works without internet)

**Weaknesses**:
- ❌ **Limited by hardware** (slower than cloud on complex tasks)
- ❌ **Requires maintenance** (model updates, Docker management)
- ❌ **Initial investment** ($2,150 for Minisforum setup)

**Best For**:
- Code completion and simple refactoring
- Documentation generation
- Simple bug fixes
- Repetitive tasks
- Privacy-sensitive code

**Usage Percentage**: 60-70% of all requests

---

#### 2. Fireworks.ai

**Models Available**:
- DeepSeek-V3 ($0.28 input / $1.14 output)
- DeepSeek R1 ($0.70 input / $2.50 output)
- Llama 3.3 70B (~$0.50 / ~$2.00)
- Llama 3.1 405B ($3.00 / $12.00)
- Qwen 2.5 72B (~$0.50 / ~$2.00)
- Mistral Large 2 (~$0.50 / ~$2.00)

**Strengths**:
- ✅ **5-10× cheaper** than Claude/GPT-4
- ✅ **Blazing fast** (300 tokens/sec)
- ✅ **Wide model selection** (6+ models)
- ✅ **OpenAI-compatible API** (easy migration)
- ✅ **Batch inference** (50% discount)
- ✅ **FireAttention engine** (4× faster than vLLM)

**Weaknesses**:
- ❌ **Newer provider** (less established than OpenAI/Anthropic)
- ❌ **API logs retained** (privacy concerns)
- ❌ **Limited documentation** (compared to major providers)

**Best For**:
- Medium-complexity code generation
- Refactoring and code reviews
- High-throughput parallel tasks
- Cost-sensitive workloads
- When local is busy/overloaded

**Usage Percentage**: 15-20% of all requests

---

#### 3. Claude (Anthropic)

**Models Available**:
- Claude Sonnet 4.5 ($3.00 input / $15.00 output, 200K context)
- Claude Opus 4 ($15.00 input / $75.00 output, 200K context)
- Claude Haiku 3.5 ($0.80 input / $4.00 output, 200K context)

**Strengths**:
- ✅ **Best reasoning** (industry-leading for complex tasks)
- ✅ **Excellent code quality** (clean, well-structured output)
- ✅ **200K context** (handles large codebases)
- ✅ **Strong safety** (less prone to unsafe code)
- ✅ **Conversational memory** (maintains context well)

**Weaknesses**:
- ❌ **Expensive** ($3-$15 per 1M tokens)
- ❌ **Slower** (80-100 tok/s vs. 300 on Fireworks)
- ❌ **Rate limits** (can be strict on free tier)

**Best For**:
- Complex architecture decisions
- System design and refactoring
- Security-critical code reviews
- High-stakes production code
- When quality matters more than cost

**Usage Percentage**: 5-10% of all requests

---

#### 4. Gemini 2.0 Flash (Google)

**Models Available**:
- Gemini 2.0 Flash ($0.075 input / $0.30 output, 1M context)
- Gemini 2.0 Flash Thinking ($0.075 input / $0.30 output, 1M context)
- Gemini 2.0 Pro ($1.25 input / $5.00 output, 2M context)

**Strengths**:
- ✅ **Massive context** (1M tokens = entire large codebase)
- ✅ **Multimodal** (text, images, video, audio)
- ✅ **Very cheap** ($0.075 input, comparable to Fireworks)
- ✅ **Fast** (100-120 tok/s)
- ✅ **Good reasoning** (Flash Thinking mode)

**Weaknesses**:
- ❌ **Inconsistent quality** (sometimes verbose or off-topic)
- ❌ **Less popular** for code (vs. Claude/GPT)
- ❌ **API quirks** (different from OpenAI standard)

**Best For**:
- Analyzing entire codebases (1M token context!)
- Multimodal tasks (screenshot analysis, video)
- Cost-effective high-volume tasks
- Diagram/flowchart generation
- When context size is critical

**Usage Percentage**: 5-10% of all requests

---

#### 5. OpenAI Codex

**Models Available**:
- Codex (code-davinci-002) - Free tier available
- GPT-4 Turbo ($10.00 input / $30.00 output, 128K context)
- GPT-4o ($5.00 input / $15.00 output, 128K context)
- GPT-3.5 Turbo ($0.50 input / $1.50 output, 16K context)

**Strengths**:
- ✅ **Codex free tier** (limited but useful)
- ✅ **Best code completion** (industry standard)
- ✅ **Function calling** (excellent for structured output)
- ✅ **Well-documented API** (extensive examples)
- ✅ **GPT-4o multimodal** (images, audio)

**Weaknesses**:
- ❌ **Expensive** (GPT-4: $10-$30 per 1M tokens)
- ❌ **Rate limits** (strict on free tier)
- ❌ **Codex deprecated** (transitioning to GPT-4)

**Best For**:
- Code completion (Codex)
- Function calling and structured output (GPT-4)
- Quick prototyping (GPT-3.5 Turbo)
- When OpenAI API is required by tools

**Usage Percentage**: 3-5% of all requests

---

#### 6. v0 (Vercel)

**Models Available**:
- v0 Model API (proprietary, UI-specialized)

**Pricing**:
- Pay-per-generation (varies by complexity)
- Subscription plans available

**Strengths**:
- ✅ **Best UI generation** (purpose-built for React/Next.js)
- ✅ **Design system aware** (Tailwind, shadcn/ui)
- ✅ **Interactive preview** (live editing)
- ✅ **Optimized components** (production-ready)

**Weaknesses**:
- ❌ **Specialized** (only for UI components)
- ❌ **Proprietary** (not open-source)
- ❌ **Cost per generation** (can add up)

**Best For**:
- UI component generation
- React/Next.js frontend work
- Design system implementation
- Rapid prototyping

**Usage Percentage**: 3-5% of all requests (UI-specific)

---

## Agent Selection Logic

### Decision Tree

```
User Request Arrives
    ↓
┌─────────────────────────────────────────────────────┐
│ Step 1: Task Classification                         │
│ • Parse intent                                       │
│ • Estimate complexity (1-10)                        │
│ • Identify task type                                │
│ • Check privacy requirements                        │
└─────────────────────────────────────────────────────┘
    ↓
┌─────────────────────────────────────────────────────┐
│ Step 2: Check Budget                                │
│ • Daily spent: $X / $5.00 limit                     │
│ • Remaining budget: $Y                              │
│ • Estimated request cost: $Z                        │
└─────────────────────────────────────────────────────┘
    ↓
┌─────────────────────────────────────────────────────┐
│ Step 3: Apply Selection Rules                       │
│ (See flowchart below)                               │
└─────────────────────────────────────────────────────┘
```

---

### Detailed Selection Flowchart

```
┌─────────────────────────────────────┐
│ Privacy-sensitive code?             │
│ (API keys, credentials, proprietary)│
└─────────────────────────────────────┘
         ↓ YES                    ↓ NO
    ┌────────┐                    │
    │ LOCAL  │                    │
    │ ONLY   │                    │
    └────────┘                    │
                                  ↓
┌─────────────────────────────────────┐
│ Task Type = UI Component?           │
└─────────────────────────────────────┘
         ↓ YES                    ↓ NO
    ┌────────┐                    │
    │ v0 API │                    │
    └────────┘                    │
                                  ↓
┌─────────────────────────────────────┐
│ Complexity ≤ 3?                     │
│ (Simple completion, docs, format)   │
└─────────────────────────────────────┘
         ↓ YES                    ↓ NO
    ┌────────┐                    │
    │ LOCAL  │                    │
    │ (Free) │                    │
    └────────┘                    │
                                  ↓
┌─────────────────────────────────────┐
│ Budget exhausted (>$5/day)?         │
└─────────────────────────────────────┘
         ↓ YES                    ↓ NO
    ┌────────┐                    │
    │ LOCAL  │                    │
    │(forced)│                    │
    └────────┘                    │
                                  ↓
┌─────────────────────────────────────┐
│ Context size > 100K tokens?         │
└─────────────────────────────────────┘
         ↓ YES                    ↓ NO
    ┌────────────┐                │
    │ GEMINI     │                │
    │ 2.0 FLASH  │                │
    │ (1M ctx)   │                │
    └────────────┘                │
                                  ↓
┌─────────────────────────────────────┐
│ Task Type = Code Completion?        │
└─────────────────────────────────────┘
         ↓ YES                    ↓ NO
    ┌────────────┐                │
    │ CODEX or   │                │
    │ LOCAL      │                │
    └────────────┘                │
                                  ↓
┌─────────────────────────────────────┐
│ Complexity 4-6?                     │
│ (Medium: features, refactoring)     │
└─────────────────────────────────────┘
         ↓ YES                    ↓ NO
    ┌────────────┐                │
    │ FIREWORKS  │                │
    │ (DeepSeek) │                │
    │ $0.28 in   │                │
    └────────────┘                │
                                  ↓
┌─────────────────────────────────────┐
│ Complexity 7-8?                     │
│ (Complex: architecture, debugging)  │
└─────────────────────────────────────┘
         ↓ YES                    ↓ NO
    ┌────────────┐                │
    │ CLAUDE     │                │
    │ SONNET 4.5 │                │
    │ (Best)     │                │
    └────────────┘                │
                                  ↓
┌─────────────────────────────────────┐
│ Complexity 9-10?                    │
│ (Very complex: system design)       │
└─────────────────────────────────────┘
         ↓ YES
    ┌────────────┐
    │ CLAUDE     │
    │ OPUS 4     │
    │ (Premium)  │
    └────────────┘
```

---

### Task Type to Provider Mapping

| Task Type | Primary | Secondary | Tertiary |
|-----------|---------|-----------|----------|
| **Code Completion** | Local (Llama) | Codex | Fireworks (Llama) |
| **Simple Refactoring** | Local (DeepSeek) | Fireworks (DeepSeek) | Claude Haiku |
| **Complex Refactoring** | Fireworks (DeepSeek) | Claude Sonnet | Local (DeepSeek) |
| **Bug Fixes** | Local (DeepSeek) | Fireworks (DeepSeek) | Codex |
| **Architecture Design** | Claude Sonnet | Fireworks (DeepSeek) | Gemini Flash |
| **System Design** | Claude Opus | Claude Sonnet | Fireworks (DeepSeek) |
| **Code Review** | Claude Sonnet | Fireworks (DeepSeek) | Local (DeepSeek) |
| **Documentation** | Local (Llama) | Gemini Flash | Fireworks (Llama) |
| **UI Components** | v0 API | Claude Sonnet | Fireworks (Llama) |
| **Testing** | Local (DeepSeek) | Fireworks (DeepSeek) | Codex |
| **Multimodal** | Gemini 2.0 Flash | GPT-4o | Claude (Opus 4) |
| **Massive Context** | Gemini 2.0 Flash | Claude Sonnet | Fireworks (Llama) |

---

## Cost Optimization Strategy

### Target Distribution

Based on typical development workload:

```
┌─────────────────────────────────────────────┐
│ Provider Distribution (Daily Average)       │
├─────────────────────────────────────────────┤
│ Local (Minisforum):   65%  (65 requests)   │
│ Fireworks.ai:         20%  (20 requests)   │
│ Claude:                8%  ( 8 requests)   │
│ Gemini:                4%  ( 4 requests)   │
│ Codex/GPT:             2%  ( 2 requests)   │
│ v0:                    1%  ( 1 request)    │
├─────────────────────────────────────────────┤
│ Total:               100%  (100 requests)   │
└─────────────────────────────────────────────┘
```

---

### Daily Cost Breakdown

**Assumptions**:
- 100 requests per day (8 hours of development)
- Average request: 2,000 input tokens, 500 output tokens

**Cost Calculation**:

```typescript
// Local (65 requests)
const localCost = 0;  // Free!

// Fireworks.ai (20 requests, DeepSeek V3)
const fireworksCost = (
  (20 * 2000 / 1_000_000 * 0.28) +  // Input
  (20 * 500 / 1_000_000 * 1.14)     // Output
) = 0.0112 + 0.0114 = $0.0226

// Claude (8 requests, Sonnet 4.5)
const claudeCost = (
  (8 * 2000 / 1_000_000 * 3.00) +   // Input
  (8 * 500 / 1_000_000 * 15.00)     // Output
) = 0.048 + 0.060 = $0.108

// Gemini (4 requests, Flash)
const geminiCost = (
  (4 * 2000 / 1_000_000 * 0.075) +  // Input
  (4 * 500 / 1_000_000 * 0.30)      // Output
) = 0.0006 + 0.0006 = $0.0012

// Codex/GPT (2 requests, GPT-3.5 Turbo)
const codexCost = (
  (2 * 2000 / 1_000_000 * 0.50) +   // Input
  (2 * 500 / 1_000_000 * 1.50)      // Output
) = 0.002 + 0.0015 = $0.0035

// v0 (1 request, estimate $0.10 per generation)
const v0Cost = 0.10;

// Total Daily Cost
const totalCost =
  localCost +
  fireworksCost +
  claudeCost +
  geminiCost +
  codexCost +
  v0Cost;

console.log(`Total daily cost: $${totalCost.toFixed(2)}`);
// Output: Total daily cost: $0.24
```

**Monthly/Yearly Costs**:
```
Daily:   $0.24
Monthly: $0.24 × 22 workdays = $5.28
Yearly:  $5.28 × 12 = $63.36
```

**Cost Breakdown by Provider**:
```
Fireworks.ai:  $0.0226  (9%)
Claude:        $0.1080  (45%)
Gemini:        $0.0012  (1%)
Codex/GPT:     $0.0035  (1%)
v0:            $0.1000  (42%)
────────────────────────────
Total:         $0.2353
```

**Key Insight**: Claude and v0 account for **87% of costs** despite being only **9% of requests**. Optimize these first!

---

### Budget Tiers

**Tier 1: Minimal ($1/day = $22/month)**
```
Local:       80% (use more local)
Fireworks:   15% (reduce cloud)
Claude:       3% (only critical)
Gemini:       1%
Codex:        0% (skip, use local)
v0:           1% (minimize UI gen)
```

**Tier 2: Standard ($3/day = $66/month)**
```
Local:       70%
Fireworks:   18%
Claude:       7%
Gemini:       3%
Codex:        1%
v0:           1%
```

**Tier 3: Premium ($5/day = $110/month)**
```
Local:       60%
Fireworks:   20%
Claude:      10%
Gemini:       5%
Codex:        3%
v0:           2%
```

**Tier 4: Unlimited (No budget limit)**
```
Local:       50% (still use for privacy)
Fireworks:   20%
Claude:      15%
Gemini:      10%
Codex:        3%
v0:           2%
```

---

## Provider Integration Patterns

### Unified Client Interface

**Base Agent Interface** (`base-agent.ts`):
```typescript
export interface AgentMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface AgentResponse {
  content: string;
  usage: {
    inputTokens: number;
    outputTokens: number;
    cost: number;
  };
  model: string;
  provider: string;
  latency: number;  // milliseconds
}

export interface StreamChunk {
  content: string;
  done: boolean;
}

export abstract class BaseAgent {
  abstract chat(
    messages: AgentMessage[],
    options?: AgentOptions
  ): Promise<AgentResponse>;

  abstract chatStream(
    messages: AgentMessage[],
    options?: AgentOptions
  ): AsyncIterable<StreamChunk>;

  abstract estimateCost(
    inputTokens: number,
    outputTokens: number
  ): number;
}

export interface AgentOptions {
  temperature?: number;
  maxTokens?: number;
  topP?: number;
  model?: string;
}
```

---

### Provider Implementations

#### 1. Local Agent (Minisforum)

```typescript
import OpenAI from 'openai';

export class LocalAgent extends BaseAgent {
  private client: OpenAI;

  constructor(baseUrl: string = 'http://10.0.0.10:11434/v1') {
    super();
    this.client = new OpenAI({
      apiKey: 'ollama',  // Ollama doesn't require key
      baseURL: baseUrl,
    });
  }

  async chat(
    messages: AgentMessage[],
    options?: AgentOptions
  ): Promise<AgentResponse> {
    const startTime = Date.now();

    const response = await this.client.chat.completions.create({
      model: options?.model || 'llama3.3:70b-instruct-q4_K_M',
      messages: messages,
      temperature: options?.temperature || 0.7,
      max_tokens: options?.maxTokens || 4096,
    });

    const latency = Date.now() - startTime;

    return {
      content: response.choices[0].message.content || '',
      usage: {
        inputTokens: response.usage?.prompt_tokens || 0,
        outputTokens: response.usage?.completion_tokens || 0,
        cost: 0,  // Local is free!
      },
      model: response.model,
      provider: 'local',
      latency,
    };
  }

  async *chatStream(
    messages: AgentMessage[],
    options?: AgentOptions
  ): AsyncIterable<StreamChunk> {
    const stream = await this.client.chat.completions.create({
      model: options?.model || 'llama3.3:70b-instruct-q4_K_M',
      messages: messages,
      temperature: options?.temperature || 0.7,
      max_tokens: options?.maxTokens || 4096,
      stream: true,
    });

    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content;
      if (content) {
        yield { content, done: false };
      }
    }

    yield { content: '', done: true };
  }

  estimateCost(inputTokens: number, outputTokens: number): number {
    return 0;  // Always free
  }
}
```

---

#### 2. Fireworks.ai Agent

```typescript
import OpenAI from 'openai';

export class FireworksAgent extends BaseAgent {
  private client: OpenAI;
  private pricing = {
    'accounts/fireworks/models/deepseek-v3': { input: 0.28, output: 1.14 },
    'accounts/fireworks/models/llama-v3p3-70b-instruct': { input: 0.50, output: 2.00 },
  };

  constructor(apiKey: string) {
    super();
    this.client = new OpenAI({
      apiKey: apiKey,
      baseURL: 'https://api.fireworks.ai/inference/v1',
    });
  }

  async chat(
    messages: AgentMessage[],
    options?: AgentOptions
  ): Promise<AgentResponse> {
    const startTime = Date.now();
    const model = options?.model || 'accounts/fireworks/models/deepseek-v3';

    const response = await this.client.chat.completions.create({
      model: model,
      messages: messages,
      temperature: options?.temperature || 0.7,
      max_tokens: options?.maxTokens || 4096,
    });

    const latency = Date.now() - startTime;
    const usage = response.usage!;
    const cost = this.estimateCost(usage.prompt_tokens, usage.completion_tokens);

    return {
      content: response.choices[0].message.content || '',
      usage: {
        inputTokens: usage.prompt_tokens,
        outputTokens: usage.completion_tokens,
        cost,
      },
      model: response.model,
      provider: 'fireworks',
      latency,
    };
  }

  async *chatStream(
    messages: AgentMessage[],
    options?: AgentOptions
  ): AsyncIterable<StreamChunk> {
    const model = options?.model || 'accounts/fireworks/models/deepseek-v3';

    const stream = await this.client.chat.completions.create({
      model: model,
      messages: messages,
      temperature: options?.temperature || 0.7,
      max_tokens: options?.maxTokens || 4096,
      stream: true,
    });

    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content;
      if (content) {
        yield { content, done: false };
      }
    }

    yield { content: '', done: true };
  }

  estimateCost(inputTokens: number, outputTokens: number): number {
    // Default to DeepSeek V3 pricing
    const pricing = this.pricing['accounts/fireworks/models/deepseek-v3'];
    return (inputTokens / 1_000_000 * pricing.input) +
           (outputTokens / 1_000_000 * pricing.output);
  }
}
```

---

#### 3. Claude Agent

```typescript
import Anthropic from '@anthropic-ai/sdk';

export class ClaudeAgent extends BaseAgent {
  private client: Anthropic;
  private pricing = {
    'claude-sonnet-4.5': { input: 3.00, output: 15.00 },
    'claude-opus-4': { input: 15.00, output: 75.00 },
    'claude-haiku-3.5': { input: 0.80, output: 4.00 },
  };

  constructor(apiKey: string) {
    super();
    this.client = new Anthropic({ apiKey });
  }

  async chat(
    messages: AgentMessage[],
    options?: AgentOptions
  ): Promise<AgentResponse> {
    const startTime = Date.now();
    const model = options?.model || 'claude-sonnet-4.5-20241022';

    // Extract system message
    const systemMessage = messages.find(m => m.role === 'system')?.content || '';
    const userMessages = messages.filter(m => m.role !== 'system');

    const response = await this.client.messages.create({
      model: model,
      max_tokens: options?.maxTokens || 4096,
      temperature: options?.temperature || 0.7,
      system: systemMessage,
      messages: userMessages.map(m => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      })),
    });

    const latency = Date.now() - startTime;
    const usage = response.usage;
    const cost = this.estimateCost(usage.input_tokens, usage.output_tokens);

    return {
      content: response.content[0].type === 'text' ? response.content[0].text : '',
      usage: {
        inputTokens: usage.input_tokens,
        outputTokens: usage.output_tokens,
        cost,
      },
      model: response.model,
      provider: 'claude',
      latency,
    };
  }

  async *chatStream(
    messages: AgentMessage[],
    options?: AgentOptions
  ): AsyncIterable<StreamChunk> {
    const model = options?.model || 'claude-sonnet-4.5-20241022';

    const systemMessage = messages.find(m => m.role === 'system')?.content || '';
    const userMessages = messages.filter(m => m.role !== 'system');

    const stream = await this.client.messages.stream({
      model: model,
      max_tokens: options?.maxTokens || 4096,
      temperature: options?.temperature || 0.7,
      system: systemMessage,
      messages: userMessages.map(m => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      })),
    });

    for await (const chunk of stream) {
      if (chunk.type === 'content_block_delta' && chunk.delta.type === 'text_delta') {
        yield { content: chunk.delta.text, done: false };
      }
    }

    yield { content: '', done: true };
  }

  estimateCost(inputTokens: number, outputTokens: number): number {
    const pricing = this.pricing['claude-sonnet-4.5'];
    return (inputTokens / 1_000_000 * pricing.input) +
           (outputTokens / 1_000_000 * pricing.output);
  }
}
```

---

#### 4. Gemini Agent

```typescript
import { GoogleGenerativeAI } from '@google/generative-ai';

export class GeminiAgent extends BaseAgent {
  private client: GoogleGenerativeAI;
  private pricing = {
    'gemini-2.0-flash-exp': { input: 0.075, output: 0.30 },
    'gemini-2.0-flash-thinking-exp-1219': { input: 0.075, output: 0.30 },
    'gemini-2.0-pro-exp': { input: 1.25, output: 5.00 },
  };

  constructor(apiKey: string) {
    super();
    this.client = new GoogleGenerativeAI(apiKey);
  }

  async chat(
    messages: AgentMessage[],
    options?: AgentOptions
  ): Promise<AgentResponse> {
    const startTime = Date.now();
    const modelName = options?.model || 'gemini-2.0-flash-exp';

    const model = this.client.getGenerativeModel({ model: modelName });

    // Convert messages to Gemini format
    const prompt = messages.map(m => `${m.role}: ${m.content}`).join('\n\n');

    const result = await model.generateContent(prompt);
    const response = result.response;

    const latency = Date.now() - startTime;

    // Estimate tokens (Gemini doesn't always provide token counts)
    const inputTokens = Math.ceil(prompt.length / 4);
    const outputTokens = Math.ceil(response.text().length / 4);
    const cost = this.estimateCost(inputTokens, outputTokens);

    return {
      content: response.text(),
      usage: {
        inputTokens,
        outputTokens,
        cost,
      },
      model: modelName,
      provider: 'gemini',
      latency,
    };
  }

  async *chatStream(
    messages: AgentMessage[],
    options?: AgentOptions
  ): AsyncIterable<StreamChunk> {
    const modelName = options?.model || 'gemini-2.0-flash-exp';
    const model = this.client.getGenerativeModel({ model: modelName });

    const prompt = messages.map(m => `${m.role}: ${m.content}`).join('\n\n');

    const result = await model.generateContentStream(prompt);

    for await (const chunk of result.stream) {
      const text = chunk.text();
      if (text) {
        yield { content: text, done: false };
      }
    }

    yield { content: '', done: true };
  }

  estimateCost(inputTokens: number, outputTokens: number): number {
    const pricing = this.pricing['gemini-2.0-flash-exp'];
    return (inputTokens / 1_000_000 * pricing.input) +
           (outputTokens / 1_000_000 * pricing.output);
  }
}
```

---

#### 5. OpenAI/Codex Agent

```typescript
import OpenAI from 'openai';

export class OpenAIAgent extends BaseAgent {
  private client: OpenAI;
  private pricing = {
    'gpt-4-turbo': { input: 10.00, output: 30.00 },
    'gpt-4o': { input: 5.00, output: 15.00 },
    'gpt-3.5-turbo': { input: 0.50, output: 1.50 },
    'code-davinci-002': { input: 0, output: 0 },  // Free tier (if available)
  };

  constructor(apiKey: string) {
    super();
    this.client = new OpenAI({ apiKey });
  }

  async chat(
    messages: AgentMessage[],
    options?: AgentOptions
  ): Promise<AgentResponse> {
    const startTime = Date.now();
    const model = options?.model || 'gpt-3.5-turbo';

    const response = await this.client.chat.completions.create({
      model: model,
      messages: messages,
      temperature: options?.temperature || 0.7,
      max_tokens: options?.maxTokens || 4096,
    });

    const latency = Date.now() - startTime;
    const usage = response.usage!;
    const cost = this.estimateCost(usage.prompt_tokens, usage.completion_tokens);

    return {
      content: response.choices[0].message.content || '',
      usage: {
        inputTokens: usage.prompt_tokens,
        outputTokens: usage.completion_tokens,
        cost,
      },
      model: response.model,
      provider: 'openai',
      latency,
    };
  }

  async *chatStream(
    messages: AgentMessage[],
    options?: AgentOptions
  ): AsyncIterable<StreamChunk> {
    const model = options?.model || 'gpt-3.5-turbo';

    const stream = await this.client.chat.completions.create({
      model: model,
      messages: messages,
      temperature: options?.temperature || 0.7,
      max_tokens: options?.maxTokens || 4096,
      stream: true,
    });

    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content;
      if (content) {
        yield { content, done: false };
      }
    }

    yield { content: '', done: true };
  }

  estimateCost(inputTokens: number, outputTokens: number): number {
    const pricing = this.pricing['gpt-3.5-turbo'];
    return (inputTokens / 1_000_000 * pricing.input) +
           (outputTokens / 1_000_000 * pricing.output);
  }
}
```

---

#### 6. v0 Agent

```typescript
export class V0Agent extends BaseAgent {
  private apiKey: string;
  private baseUrl = 'https://api.v0.dev';

  constructor(apiKey: string) {
    super();
    this.apiKey = apiKey;
  }

  async chat(
    messages: AgentMessage[],
    options?: AgentOptions
  ): Promise<AgentResponse> {
    const startTime = Date.now();

    // v0 expects a single prompt
    const prompt = messages[messages.length - 1].content;

    const response = await fetch(`${this.baseUrl}/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        prompt: prompt,
        framework: 'nextjs',
        styling: 'tailwind',
      }),
    });

    const data = await response.json();
    const latency = Date.now() - startTime;

    // v0 charges per generation, not per token
    const cost = 0.10;  // Estimate $0.10 per generation

    return {
      content: data.code || '',
      usage: {
        inputTokens: Math.ceil(prompt.length / 4),
        outputTokens: Math.ceil((data.code || '').length / 4),
        cost,
      },
      model: 'v0',
      provider: 'v0',
      latency,
    };
  }

  async *chatStream(
    messages: AgentMessage[],
    options?: AgentOptions
  ): AsyncIterable<StreamChunk> {
    // v0 doesn't support streaming, fallback to non-streaming
    const response = await this.chat(messages, options);
    yield { content: response.content, done: true };
  }

  estimateCost(inputTokens: number, outputTokens: number): number {
    return 0.10;  // Flat rate per generation
  }
}
```

---

### Agent Factory

**Unified Factory Pattern** (`agent-factory.ts`):
```typescript
export class AgentFactory {
  private agents: Map<string, BaseAgent> = new Map();

  constructor(config: {
    localUrl?: string;
    fireworksKey?: string;
    claudeKey?: string;
    geminiKey?: string;
    openaiKey?: string;
    v0Key?: string;
  }) {
    // Initialize available agents
    if (config.localUrl) {
      this.agents.set('local', new LocalAgent(config.localUrl));
    }
    if (config.fireworksKey) {
      this.agents.set('fireworks', new FireworksAgent(config.fireworksKey));
    }
    if (config.claudeKey) {
      this.agents.set('claude', new ClaudeAgent(config.claudeKey));
    }
    if (config.geminiKey) {
      this.agents.set('gemini', new GeminiAgent(config.geminiKey));
    }
    if (config.openaiKey) {
      this.agents.set('openai', new OpenAIAgent(config.openaiKey));
    }
    if (config.v0Key) {
      this.agents.set('v0', new V0Agent(config.v0Key));
    }
  }

  getAgent(provider: string): BaseAgent | undefined {
    return this.agents.get(provider);
  }

  hasAgent(provider: string): boolean {
    return this.agents.has(provider);
  }

  listProviders(): string[] {
    return Array.from(this.agents.keys());
  }
}
```

---

## Fallback and Redundancy

### Fallback Chain Strategy

```typescript
interface FallbackChain {
  primary: string;
  secondary: string;
  tertiary: string;
}

const FALLBACK_CHAINS: Record<string, FallbackChain> = {
  'code-completion': {
    primary: 'local',
    secondary: 'fireworks',
    tertiary: 'openai',
  },
  'architecture': {
    primary: 'claude',
    secondary: 'fireworks',
    tertiary: 'local',
  },
  'ui-generation': {
    primary: 'v0',
    secondary: 'claude',
    tertiary: 'fireworks',
  },
  'massive-context': {
    primary: 'gemini',
    secondary: 'claude',
    tertiary: 'fireworks',
  },
};

export class ResilientOrchestrator {
  private factory: AgentFactory;
  private maxRetries = 3;

  async executeWithFallback(
    taskType: string,
    messages: AgentMessage[],
    options?: AgentOptions
  ): Promise<AgentResponse> {
    const chain = FALLBACK_CHAINS[taskType] || FALLBACK_CHAINS['code-completion'];

    // Try primary
    try {
      const agent = this.factory.getAgent(chain.primary);
      if (agent) {
        return await agent.chat(messages, options);
      }
    } catch (error) {
      console.warn(`Primary agent (${chain.primary}) failed:`, error);
    }

    // Try secondary
    try {
      const agent = this.factory.getAgent(chain.secondary);
      if (agent) {
        return await agent.chat(messages, options);
      }
    } catch (error) {
      console.warn(`Secondary agent (${chain.secondary}) failed:`, error);
    }

    // Try tertiary (last resort)
    const agent = this.factory.getAgent(chain.tertiary);
    if (agent) {
      return await agent.chat(messages, options);
    }

    throw new Error('All agents in fallback chain failed');
  }
}
```

---

## API Key Management

### Secure Key Storage (VS Code Secrets)

```typescript
import { ExtensionContext, SecretStorage } from 'vscode';

export class APIKeyManager {
  private secrets: SecretStorage;

  constructor(context: ExtensionContext) {
    this.secrets = context.secrets;
  }

  async setKey(provider: string, key: string): Promise<void> {
    await this.secrets.store(`api.${provider}`, key);
  }

  async getKey(provider: string): Promise<string | undefined> {
    return await this.secrets.get(`api.${provider}`);
  }

  async hasKey(provider: string): Promise<boolean> {
    const key = await this.getKey(provider);
    return key !== undefined && key.length > 0;
  }

  async deleteKey(provider: string): Promise<void> {
    await this.secrets.delete(`api.${provider}`);
  }

  async listProviders(): Promise<string[]> {
    const providers = ['local', 'fireworks', 'claude', 'gemini', 'openai', 'v0'];
    const available: string[] = [];

    for (const provider of providers) {
      if (await this.hasKey(provider)) {
        available.push(provider);
      }
    }

    return available;
  }
}
```

---

## Rate Limiting and Quotas

### Per-Provider Rate Limiter

```typescript
interface RateLimitConfig {
  requests: number;
  window: number;  // milliseconds
}

const RATE_LIMITS: Record<string, RateLimitConfig> = {
  local: { requests: Infinity, window: 0 },  // No limit
  fireworks: { requests: 100, window: 60 * 1000 },  // 100/min
  claude: { requests: 50, window: 60 * 1000 },  // 50/min
  gemini: { requests: 360, window: 60 * 1000 },  // 360/min
  openai: { requests: 90, window: 60 * 1000 },  // 90/min
  v0: { requests: 10, window: 60 * 1000 },  // 10/min (conservative)
};

export class RateLimiter {
  private requests: Map<string, number[]> = new Map();

  async canMakeRequest(provider: string): Promise<boolean> {
    const limit = RATE_LIMITS[provider];
    if (limit.requests === Infinity) {
      return true;
    }

    const now = Date.now();
    const recent = (this.requests.get(provider) || [])
      .filter(t => now - t < limit.window);

    return recent.length < limit.requests;
  }

  async waitForSlot(provider: string): Promise<void> {
    while (!(await this.canMakeRequest(provider))) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    // Record request
    const now = Date.now();
    const recent = (this.requests.get(provider) || [])
      .filter(t => now - t < RATE_LIMITS[provider].window);
    recent.push(now);
    this.requests.set(provider, recent);
  }
}
```

---

## Implementation Examples

### Complete Orchestrator with All Providers

```typescript
export class MultiCloudOrchestrator {
  private factory: AgentFactory;
  private budgetManager: BudgetManager;
  private rateLimiter: RateLimiter;
  private memoryAgent: MemoryAgent;

  async handleRequest(
    request: string,
    projectId: string
  ): Promise<AgentResponse> {
    // 1. Load context from Memory-Agent
    const context = await this.memoryAgent.retrieveContext({
      projectId,
      layers: [1, 2],
    });

    // 2. Classify task
    const classification = await this.classifyTask(request);

    // 3. Check privacy requirements
    if (classification.privacySensitive) {
      return await this.executeLocal(request, context);
    }

    // 4. Check budget
    if (!this.budgetManager.canUseCloud()) {
      return await this.executeLocal(request, context);
    }

    // 5. Select provider based on task type
    let provider: string;

    if (classification.taskType === 'ui-component') {
      provider = 'v0';
    } else if (classification.contextSize > 100000) {
      provider = 'gemini';
    } else if (classification.taskType === 'code-completion') {
      provider = classification.complexity <= 3 ? 'local' : 'fireworks';
    } else if (classification.complexity <= 4) {
      provider = 'local';
    } else if (classification.complexity <= 7) {
      provider = 'fireworks';
    } else {
      provider = 'claude';
    }

    // 6. Check rate limits
    await this.rateLimiter.waitForSlot(provider);

    // 7. Execute with fallback
    const agent = this.factory.getAgent(provider);
    if (!agent) {
      return await this.executeLocal(request, context);
    }

    try {
      const response = await agent.chat([
        { role: 'system', content: context },
        { role: 'user', content: request },
      ]);

      // 8. Track cost
      await this.budgetManager.trackRequest(
        provider,
        response.usage.inputTokens,
        response.usage.outputTokens,
        response.usage.cost
      );

      // 9. Store in Memory-Agent
      await this.memoryAgent.storeContext({
        projectId,
        contextType: 'agent_response',
        content: { request, response: response.content, provider },
        layer: 2,
      });

      return response;

    } catch (error) {
      console.error(`${provider} failed, falling back to local`, error);
      return await this.executeLocal(request, context);
    }
  }

  private async executeLocal(request: string, context: string): Promise<AgentResponse> {
    const agent = this.factory.getAgent('local')!;
    return await agent.chat([
      { role: 'system', content: context },
      { role: 'user', content: request },
    ]);
  }

  private async classifyTask(request: string): Promise<TaskClassification> {
    // Use fast local model to classify
    const agent = this.factory.getAgent('local')!;
    const response = await agent.chat([
      {
        role: 'system',
        content: 'Classify this task. Respond with JSON: {taskType, complexity, contextSize, privacySensitive}',
      },
      { role: 'user', content: request },
    ]);

    return JSON.parse(response.content);
  }
}
```

---

## Conclusion

This **Multi-Cloud API Framework** provides a robust, cost-effective, and flexible foundation for the unified AI development ecosystem:

**6 Providers, One Interface**:
- ✅ Local (Minisforum) - free, private, always available
- ✅ Fireworks.ai - 5-10× cheaper than premium providers
- ✅ Claude - best reasoning for critical tasks
- ✅ Gemini - massive context window, multimodal
- ✅ OpenAI Codex - code completion standard
- ✅ v0 - specialized UI generation

**Intelligent Routing**:
- Task classification → optimal provider
- Budget-aware fallback to local when needed
- Privacy-sensitive tasks stay local
- Rate limiting prevents API throttling

**Cost Optimization**:
- **65% local** (free)
- **20% Fireworks** (cheap)
- **8% Claude** (quality)
- **4% Gemini** (context)
- **2% Codex** (completion)
- **1% v0** (UI)
- **Total: ~$0.24/day = $63/year**

**Extensible Design**:
- Easy to add new providers (Groq, Together, Replicate)
- Unified interface (BaseAgent)
- Fallback chains for reliability
- Flexible routing rules

This framework **balances function and cost** perfectly for a homelab-centric unified ecosystem! 🚀
