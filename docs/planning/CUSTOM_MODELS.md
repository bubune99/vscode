# Custom Model Support - Fine-Tuned & Custom Models

**Date:** October 24, 2025

---

## Overview

Users can configure custom models from any provider, including:
- **Fine-tuned models** (your own models trained on Fireworks, OpenAI, etc.)
- **Other Fireworks models** (Codex, Mixtral, Qwen, etc.)
- **Custom endpoints** (self-hosted, enterprise deployments)
- **Future providers** (Anthropic fine-tunes, Google custom models, etc.)

---

## Configuration Approach

### **Option 1: Configure in VS Code Settings (Recommended)**

Users specify custom models directly in settings.json - we handle the API calls.

**Benefits:**
- Simple for users
- No code changes needed for new models
- We manage the API integration
- Users just need API key + model name

### **Option 2: Bring Your Own API**

Users configure entire endpoints - for self-hosted or custom deployments.

**Benefits:**
- Maximum flexibility
- Works with any OpenAI-compatible API
- Enterprise deployments
- Local models with custom servers

---

## Settings Schema

```json
{
  "aiOrchestrator.providers.fireworks": {
    "apiKey": "...",
    "enabled": true,

    // Built-in models (presets)
    "defaultModel": "llama-v3p3-70b-instruct",

    // Custom models
    "customModels": [
      {
        "id": "my-finetuned-codex",
        "displayName": "My Fine-Tuned Codex",
        "modelPath": "accounts/mycompany/models/codex-finetuned-v1",
        "contextWindow": 16384,
        "cost": {
          "input": 1.20,
          "output": 1.20
        },
        "description": "Fine-tuned Codex for our codebase patterns"
      },
      {
        "id": "mixtral-8x22b",
        "displayName": "Mixtral 8x22B",
        "modelPath": "accounts/fireworks/models/mixtral-8x22b-instruct",
        "contextWindow": 65536,
        "cost": {
          "input": 1.20,
          "output": 1.20
        },
        "description": "Large context Mixtral model"
      }
    ]
  },

  // Custom provider endpoint
  "aiOrchestrator.providers.custom": [
    {
      "id": "my-local-llama",
      "displayName": "Local Llama 3.1 70B",
      "type": "openai-compatible",
      "endpoint": "http://localhost:8000/v1",
      "apiKey": "not-needed",
      "modelName": "meta-llama/llama-3.1-70b-instruct",
      "contextWindow": 128000,
      "cost": {
        "input": 0.0,
        "output": 0.0
      },
      "description": "Self-hosted Llama running on our server"
    },
    {
      "id": "enterprise-claude",
      "displayName": "Enterprise Claude (Private Cloud)",
      "type": "anthropic",
      "endpoint": "https://claude.mycompany.internal/v1",
      "apiKey": "${SECRET:enterprise-claude-key}",
      "modelName": "claude-sonnet-4.5-enterprise",
      "contextWindow": 200000,
      "cost": {
        "input": 0.0,
        "output": 0.0
      },
      "description": "Claude deployed on our private infrastructure"
    }
  ]
}
```

---

## How It Works

### 1. **Fireworks Custom Models**

Users add custom Fireworks models to their config:

```json
{
  "aiOrchestrator.providers.fireworks.customModels": [
    {
      "id": "my-coding-agent",
      "displayName": "My Coding Agent",
      "modelPath": "accounts/mycompany/models/llama-70b-coding-v2",
      "contextWindow": 32768,
      "cost": {
        "input": 0.90,
        "output": 0.90
      }
    }
  ]
}
```

**Then assign to agents:**

```json
{
  "aiOrchestrator.agents.providerAssignment": {
    "planning": "auto",
    "code": "custom:my-coding-agent",  // Use custom model
    "review": "claude",
    "test": "auto",
    "document": "fireworks-8b",
    "architecture": "auto"
  }
}
```

### 2. **Self-Hosted / Local Models**

For local or self-hosted models (vLLM, Ollama, LM Studio, etc.):

```json
{
  "aiOrchestrator.providers.custom": [
    {
      "id": "local-deepseek",
      "type": "openai-compatible",
      "endpoint": "http://localhost:11434/v1",  // Ollama
      "modelName": "deepseek-coder:33b",
      "contextWindow": 16384,
      "cost": { "input": 0.0, "output": 0.0 }
    }
  ]
}
```

**Then use it:**

```json
{
  "aiOrchestrator.agents.providerAssignment": {
    "code": "custom:local-deepseek"
  }
}
```

### 3. **Enterprise Custom Endpoints**

For enterprise deployments with custom infrastructure:

```json
{
  "aiOrchestrator.providers.custom": [
    {
      "id": "azure-openai-enterprise",
      "type": "azure-openai",
      "endpoint": "https://mycompany.openai.azure.com",
      "apiKey": "${SECRET:azure-key}",
      "deploymentName": "gpt-4-turbo-enterprise",
      "contextWindow": 128000,
      "cost": { "input": 0.0, "output": 0.0 }
    }
  ]
}
```

---

## Implementation

### Provider Resolution

```typescript
interface CustomModel {
  id: string;
  displayName: string;

  // For Fireworks custom models
  modelPath?: string;  // e.g., "accounts/mycompany/models/my-model"

  // For custom endpoints
  type?: 'openai-compatible' | 'anthropic' | 'azure-openai' | 'google-vertex';
  endpoint?: string;
  modelName?: string;
  deploymentName?: string;  // Azure specific

  // Common
  contextWindow: number;
  cost: { input: number; output: number };
  description?: string;

  // Advanced
  temperature?: number;
  topP?: number;
  maxTokens?: number;
}

export class CustomModelProvider extends BaseProvider {
  constructor(private config: CustomModel) {
    super();
  }

  async execute(request: AIRequest): Promise<AIResponse> {
    // Route based on type
    switch (this.config.type) {
      case 'openai-compatible':
        return this.executeOpenAICompatible(request);

      case 'anthropic':
        return this.executeAnthropic(request);

      case 'azure-openai':
        return this.executeAzureOpenAI(request);

      default:
        // Fireworks custom model (use Fireworks API)
        return this.executeFireworks(request);
    }
  }

  private async executeOpenAICompatible(request: AIRequest): Promise<AIResponse> {
    const response = await fetch(`${this.config.endpoint}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.config.apiKey}`
      },
      body: JSON.stringify({
        model: this.config.modelName,
        messages: this.buildMessages(request),
        tools: request.tools ? this.formatTools(request.tools) : undefined,
        max_tokens: this.config.maxTokens || request.maxTokens,
        temperature: this.config.temperature,
        top_p: this.config.topP
      })
    });

    return this.parseResponse(response);
  }

  private async executeFireworks(request: AIRequest): Promise<AIResponse> {
    // Use Fireworks API with custom model path
    const response = await fetch('https://api.fireworks.ai/inference/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.fireworksApiKey}`
      },
      body: JSON.stringify({
        model: this.config.modelPath,  // e.g., "accounts/mycompany/models/my-model"
        messages: this.buildMessages(request),
        tools: request.tools ? this.formatTools(request.tools) : undefined
      })
    });

    return this.parseResponse(response);
  }
}
```

### Model Registry

```typescript
export class ModelRegistry {
  private models: Map<string, CustomModel> = new Map();

  constructor(private config: vscode.WorkspaceConfiguration) {
    this.loadBuiltInModels();
    this.loadCustomModels();
  }

  private loadBuiltInModels() {
    // Load preset models
    this.models.set('fireworks-8b', {
      id: 'fireworks-8b',
      displayName: 'Fireworks Llama 8B',
      modelPath: 'accounts/fireworks/models/llama-v3p1-8b-instruct',
      contextWindow: 128000,
      cost: { input: 0.20, output: 0.20 }
    });

    this.models.set('fireworks-70b', {
      id: 'fireworks-70b',
      displayName: 'Fireworks Llama 70B',
      modelPath: 'accounts/fireworks/models/llama-v3p3-70b-instruct',
      contextWindow: 128000,
      cost: { input: 0.90, output: 0.90 }
    });

    // Add all built-in models...
  }

  private loadCustomModels() {
    // Load Fireworks custom models
    const fireworksCustom = this.config.get<CustomModel[]>('providers.fireworks.customModels', []);
    for (const model of fireworksCustom) {
      this.models.set(`custom:${model.id}`, model);
    }

    // Load custom endpoints
    const customProviders = this.config.get<CustomModel[]>('providers.custom', []);
    for (const model of customProviders) {
      this.models.set(`custom:${model.id}`, model);
    }
  }

  getModel(id: string): CustomModel | undefined {
    return this.models.get(id);
  }

  getAllModels(): CustomModel[] {
    return Array.from(this.models.values());
  }

  // Get models available for a specific agent
  getModelsForAgent(agent: AgentRole): CustomModel[] {
    // Filter based on capabilities, context window, etc.
    return this.getAllModels().filter(model => {
      // Only show models with tool calling for agents that need it
      if (agent === 'code' || agent === 'test') {
        // Check if model supports tool calling (OpenAI-compatible assumed to support)
        return model.type === 'openai-compatible' || model.modelPath?.includes('llama');
      }
      return true;
    });
  }
}
```

---

## UI Updates

### Settings UI - Custom Models Section

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ CUSTOM MODELS                                                                │
│ ───────────────────────────────────────────────────────────────────────────│
│                                                                              │
│ Fireworks Custom Models                                  [+ Add Model]      │
│ ┌────────────────────────────────────────────────────────────────────────┐ │
│ │ My Fine-Tuned Codex                                         [Edit] [×] │ │
│ │ Model: accounts/mycompany/models/codex-finetuned-v1                    │ │
│ │ Context: 16K tokens │ Cost: $1.20/1M tokens                            │ │
│ │ Fine-tuned Codex for our codebase patterns                             │ │
│ └────────────────────────────────────────────────────────────────────────┘ │
│                                                                              │
│ ┌────────────────────────────────────────────────────────────────────────┐ │
│ │ Mixtral 8x22B                                               [Edit] [×] │ │
│ │ Model: accounts/fireworks/models/mixtral-8x22b-instruct                │ │
│ │ Context: 64K tokens │ Cost: $1.20/1M tokens                            │ │
│ │ Large context Mixtral model                                            │ │
│ └────────────────────────────────────────────────────────────────────────┘ │
│                                                                              │
│ Custom Endpoints                                         [+ Add Endpoint]   │
│ ┌────────────────────────────────────────────────────────────────────────┐ │
│ │ Local Llama 3.1 70B                                         [Edit] [×] │ │
│ │ Type: OpenAI-Compatible │ Endpoint: http://localhost:8000/v1           │ │
│ │ Context: 128K tokens │ Cost: Free                                      │ │
│ │ Self-hosted Llama running on our server                                │ │
│ └────────────────────────────────────────────────────────────────────────┘ │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Add Custom Model Dialog

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ Add Custom Model                                                             │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│ Model Type:                                                                  │
│   (•) Fireworks Fine-Tuned Model                                             │
│   ( ) Custom Endpoint (OpenAI-Compatible)                                    │
│   ( ) Custom Endpoint (Anthropic)                                            │
│   ( ) Azure OpenAI Deployment                                                │
│                                                                              │
│ ═══════════════════════════════════════════════════════════════════════════│
│                                                                              │
│ Display Name: [My Fine-Tuned Model________________]                          │
│                                                                              │
│ Model ID/Path: [accounts/mycompany/models/my-model_]                        │
│   Example: accounts/yourname/models/model-name                              │
│                                                                              │
│ Context Window: [32768___]  tokens                                          │
│                                                                              │
│ Cost (per 1M tokens):                                                        │
│   Input:  [$0.90_____]                                                      │
│   Output: [$0.90_____]                                                      │
│                                                                              │
│ Description: [Fine-tuned for our codebase patterns__]                       │
│                                                                              │
│                                        [Cancel]  [Add Model]                 │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Agent Assignment Dropdown (Updated)

```
Planning Agent Provider: [▼]

Built-in:
  • Auto (smart routing)
  • Fireworks 8B ($0.20/1M)
  • Fireworks 70B ($0.90/1M)
  • Fireworks DeepSeek ($1.14/1M)
  • Claude Sonnet 4.5 ($3-15/1M)
  • Gemini 2.0 Flash ($0.10-0.40/1M)

Your Custom Models:
  • My Fine-Tuned Codex ($1.20/1M) ⭐ Fireworks
  • Mixtral 8x22B ($1.20/1M) 🔥 Fireworks
  • Local Llama 3.1 70B (Free) 💻 Local
  • Enterprise Claude (Free) 🏢 Private
```

---

## Use Cases

### Use Case 1: Fine-Tuned Coding Model

**Scenario:** You've fine-tuned Llama 70B on your company's codebase.

**Steps:**
1. Train model on Fireworks (or elsewhere)
2. Add to settings:
```json
{
  "aiOrchestrator.providers.fireworks.customModels": [{
    "id": "company-coder",
    "displayName": "Company Coding Assistant",
    "modelPath": "accounts/mycompany/models/llama-70b-company-v1",
    "contextWindow": 32768,
    "cost": { "input": 0.90, "output": 0.90 }
  }]
}
```
3. Assign to Code Agent:
```json
{
  "aiOrchestrator.agents.providerAssignment": {
    "code": "custom:company-coder"
  }
}
```

**Result:** Code Agent uses your fine-tuned model that knows your patterns!

---

### Use Case 2: Self-Hosted Local Model

**Scenario:** Running Llama locally with Ollama for privacy.

**Steps:**
1. Start Ollama: `ollama serve`
2. Add to settings:
```json
{
  "aiOrchestrator.providers.custom": [{
    "id": "local-llama",
    "type": "openai-compatible",
    "endpoint": "http://localhost:11434/v1",
    "modelName": "llama3.1:70b",
    "contextWindow": 128000,
    "cost": { "input": 0.0, "output": 0.0 }
  }]
}
```
3. Use unified mode:
```json
{
  "aiOrchestrator.agents.useUnifiedProvider": true,
  "aiOrchestrator.agents.unifiedProviderChoice": "custom:local-llama"
}
```

**Result:** All agents use your local model, zero cloud costs, complete privacy!

---

### Use Case 3: Mix Everything

**Scenario:** Use fine-tuned for code, Claude for review, local for docs.

```json
{
  "aiOrchestrator.agents.providerAssignment": {
    "planning": "auto",
    "code": "custom:my-finetuned-coder",    // Your model
    "review": "claude",                     // Premium quality
    "test": "fireworks-deepseek",          // Good reasoning
    "document": "custom:local-llama",      // Free local
    "architecture": "gemini"               // Large context
  }
}
```

**Result:** Optimal mix - your expertise where it matters, premium where quality matters, free where it doesn't!

---

## Available Fireworks Models

Beyond our defaults, users can add:

### Code-Specialized:
- `starcoder2-15b`
- `wizardcoder-python-34b-v1.0`
- `deepseek-coder-33b-instruct`

### Reasoning:
- `mixtral-8x7b-instruct`
- `mixtral-8x22b-instruct`
- `qwen2.5-72b-instruct`

### General:
- `llama-v3p2-90b-vision-instruct` (vision capable)
- `llama-v3p1-405b-instruct` (massive model)

### Your Fine-Tunes:
- `accounts/YOUR_NAME/models/YOUR_MODEL`

Full list: https://fireworks.ai/models

---

## Configuration Examples

### Example 1: Simple Fine-Tune

```json
{
  "aiOrchestrator.providers.fireworks.customModels": [
    {
      "id": "my-code-model",
      "modelPath": "accounts/john/models/llama-coding-v1",
      "contextWindow": 32768,
      "cost": { "input": 0.90, "output": 0.90 }
    }
  ],
  "aiOrchestrator.agents.providerAssignment": {
    "code": "custom:my-code-model"
  }
}
```

### Example 2: Local + Cloud Hybrid

```json
{
  "aiOrchestrator.providers.custom": [
    {
      "id": "local-llama",
      "type": "openai-compatible",
      "endpoint": "http://localhost:8000/v1",
      "modelName": "meta-llama/llama-3.1-70b",
      "contextWindow": 128000,
      "cost": { "input": 0.0, "output": 0.0 }
    }
  ],
  "aiOrchestrator.agents.providerAssignment": {
    "planning": "custom:local-llama",     // Free
    "code": "custom:local-llama",         // Free
    "review": "claude",                   // Quality
    "test": "custom:local-llama",         // Free
    "document": "custom:local-llama",     // Free
    "architecture": "gemini"              // Large context
  }
}
```

**Monthly Cost:** ~$10 (only Claude reviews + Gemini architecture)

---

## Recommendations

### When to Use Custom Models:

✅ **Fine-Tuned for Code:**
- You have proprietary codebase patterns
- Domain-specific terminology
- Company coding standards

✅ **Self-Hosted for Privacy:**
- Medical/legal sensitive data
- Enterprise compliance
- Air-gapped environments

✅ **Cost Optimization:**
- High volume usage
- Local models for simple tasks
- Cloud for complex only

❌ **When NOT to Use:**
- Just starting out (use Auto mode)
- Low volume (<500 requests/month)
- No special requirements

---

## Implementation Status

- [ ] Add custom models configuration schema
- [ ] Implement ModelRegistry
- [ ] Support Fireworks custom models
- [ ] Support OpenAI-compatible endpoints
- [ ] Add UI for managing custom models
- [ ] Test with Ollama, vLLM, LM Studio
- [ ] Add validation for custom endpoints
- [ ] Document API compatibility requirements

---

**Status:** Design complete, ready for implementation ✅

**Answer to your question:** We configure custom models in our system (VS Code settings), not in Fireworks. You just provide the model path (e.g., `accounts/yourname/models/your-model`) and we call Fireworks API with that path. Simple and flexible!
