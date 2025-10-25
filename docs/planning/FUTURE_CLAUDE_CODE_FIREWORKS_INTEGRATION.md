# Future: Claude Code & Fireworks AI Integration

**Status:** Planned for Phase 4+
**Priority:** High
**Date:** 2025-10-25

---

## Overview

Two key additions to the AI Orchestrator agent ecosystem:

1. **Claude Code as Sub-Agent** - Enable the Orchestrator to delegate complex coding tasks to Claude Code
2. **Fireworks AI Provider** - Add Fireworks AI as a fast, cost-effective model provider

---

## 1. Claude Code Sub-Agent

### Concept

Claude Code should be callable as a specialist sub-agent, giving the Orchestrator access to Claude Code's full tool suite (file editing, bash execution, search, etc.).

### Architecture

```
Orchestrator (GPT-4)
       ↓
   Task: "Refactor authentication system"
       ↓
   Delegates to: claude-code agent
       ↓
Claude Code executes with full tools:
  - Read files
  - Edit code
  - Run tests
  - Git operations
  - Search codebase
       ↓
   Returns results to Orchestrator
       ↓
   Orchestrator continues with next task
```

### Implementation Options

#### Option A: CLI Integration
```typescript
export class ClaudeCodeLanguageModelProvider extends BaseLanguageModelProvider {

  async sendChatRequest(modelId, messages, from, options, token) {
    // Execute Claude Code CLI
    const process = spawn('claude-code', [
      '--task', JSON.stringify(messages),
      '--workspace', context.workspace.fsPath
    ]);

    // Stream output back
    return {
      stream: this.streamProcessOutput(process),
      result: this.waitForProcessCompletion(process)
    };
  }
}
```

#### Option B: API Integration
```typescript
export class ClaudeCodeLanguageModelProvider extends BaseLanguageModelProvider {

  async sendChatRequest(modelId, messages, from, options, token) {
    // Call Claude Code API (if available)
    const response = await fetch('https://api.anthropic.com/claude-code', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        messages,
        workspace: context.workspace,
        tools: ['read', 'write', 'edit', 'bash', 'search']
      })
    });

    return response.body; // Streaming response
  }
}
```

#### Option C: Embedded Integration (Best)
```typescript
// Import Claude Code's core functionality directly
import { ClaudeCodeEngine } from 'claude-code-engine';

export class ClaudeCodeLanguageModelProvider extends BaseLanguageModelProvider {

  private engine: ClaudeCodeEngine;

  constructor(...) {
    super(...);
    this.engine = new ClaudeCodeEngine({
      workspace: context.workspace,
      tools: this.getToolRegistry()
    });
  }

  async sendChatRequest(modelId, messages, from, options, token) {
    // Execute directly within VS Code process
    const stream = await this.engine.executeTask(messages, {
      enableTools: ['read', 'write', 'edit', 'bash', 'search', 'git'],
      streaming: true,
      token
    });

    return {
      stream: this.convertEngineStream(stream),
      result: stream.result
    };
  }
}
```

### Agent Type Definition

```typescript
// Update aiOrchestratorService.ts
export type AgentType =
  | 'v0'         // UI generation
  | 'claude'     // General Claude API
  | 'claude-code' // Claude Code with tools ✨ NEW
  | 'gemini'     // Multimodal analysis
  | 'gpt'        // GPT models
  | 'fireworks'; // Fast inference

// Update AGENT_MODEL_MAPPING
const AGENT_MODEL_MAPPING = {
  'claude-code': {
    vendor: 'anthropic',
    family: 'claude-code',
    capabilities: ['read', 'write', 'edit', 'bash', 'search', 'git']
  }
};

// Update AGENT_CAPABILITIES
const AGENT_CAPABILITIES = {
  'claude-code': {
    name: 'Claude Code',
    description: 'Advanced coding agent with full tool access',
    specialties: [
      'Complex refactoring',
      'Bug fixing with context',
      'Test generation',
      'Code search and analysis',
      'Git operations',
      'Multi-file changes'
    ],
    maxComplexity: 'very-high'
  }
};
```

### Orchestrator Planning Example

```typescript
// User request: "Refactor the auth system to use JWT tokens"

const plan = await orchestrator.planTasks(request, context);

// Orchestrator creates plan:
{
  analysis: "Need to refactor authentication. Claude Code can handle this complex multi-file change.",
  tasks: [
    {
      id: '1',
      agent: 'claude-code', // ✨ Delegates to Claude Code
      description: 'Refactor auth system to use JWT',
      instructions: `
        1. Read current auth implementation
        2. Replace session-based auth with JWT
        3. Update all endpoints
        4. Add JWT middleware
        5. Update tests
        6. Verify changes work
      `,
      priority: 1
    }
  ]
}
```

### Benefits

✅ **Full Tool Access** - Claude Code gets all its normal capabilities
✅ **Complex Tasks** - Can handle multi-file refactoring, testing, git ops
✅ **Context Aware** - Has access to full workspace context
✅ **Proven Reliability** - Claude Code's tool use is battle-tested
✅ **Best of Both** - Orchestrator planning + Claude Code execution

---

## 2. Fireworks AI Provider

### Concept

Add Fireworks AI as a fast, cost-effective provider for high-volume or low-latency use cases.

### Models Available

- **Llama models** (Llama 3.1, Llama 3.2)
- **DeepSeek models** (DeepSeek Coder, DeepSeek Chat)
- **Mixtral models** (Mixtral 8x7B, Mixtral 8x22B)
- **Qwen models** (Qwen 2.5 Coder)

### Implementation

```typescript
// fireworksProvider.ts
export class FireworksLanguageModelProvider extends BaseLanguageModelProvider {

  private static readonly CONFIG_KEY = 'aiOrchestrator.fireworks';

  protected getEnvVarName(): string {
    return 'FIREWORKS_API_KEY';
  }

  protected getProviderName(): string {
    return 'Fireworks';
  }

  async provideLanguageModelChatInfo() {
    return [
      {
        identifier: 'fireworks-llama-3-1-70b',
        metadata: {
          name: 'Llama 3.1 70B',
          id: 'accounts/fireworks/models/llama-v3p1-70b-instruct',
          vendor: 'fireworks',
          family: 'llama',
          maxInputTokens: 128000,
          maxOutputTokens: 4096
        }
      },
      {
        identifier: 'fireworks-deepseek-coder',
        metadata: {
          name: 'DeepSeek Coder 33B',
          id: 'accounts/fireworks/models/deepseek-coder-33b-instruct',
          vendor: 'fireworks',
          family: 'deepseek',
          maxInputTokens: 16000,
          maxOutputTokens: 4096
        }
      }
      // ... more models
    ];
  }

  async sendChatRequest(modelId, messages, from, options, token) {
    // Fireworks uses OpenAI-compatible API
    const response = await fetch('https://api.fireworks.ai/inference/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.getConfig().apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: this.getModelName(modelId),
        messages: this.convertMessages(messages),
        stream: true,
        temperature: options.temperature || 0.7,
        max_tokens: options.maxTokens || 4096
      })
    });

    return {
      stream: this.streamToAsyncIterable(response.body, ...),
      result: Promise.resolve({})
    };
  }
}
```

### Agent Type

```typescript
// Add to AGENT_MODEL_MAPPING
const AGENT_MODEL_MAPPING = {
  'fireworks': {
    vendor: 'fireworks',
    family: 'llama' // or 'deepseek', 'mixtral', etc.
  }
};

// Add to AGENT_CAPABILITIES
const AGENT_CAPABILITIES = {
  'fireworks': {
    name: 'Fireworks AI',
    description: 'Fast, cost-effective inference',
    specialties: [
      'High-volume tasks',
      'Low-latency responses',
      'Code completion',
      'Quick analysis'
    ],
    maxComplexity: 'medium'
  }
};
```

### Use Cases

**When to use Fireworks:**
- ✅ High-volume code generation
- ✅ Quick syntax checks
- ✅ Simple refactoring
- ✅ Code completion
- ✅ Low-latency interactions
- ✅ Cost optimization for non-critical tasks

**When NOT to use Fireworks:**
- ❌ Complex reasoning (use GPT-4/Claude)
- ❌ Multimodal tasks (use Gemini)
- ❌ UI generation (use v0)
- ❌ Tool usage (use Claude Code)

### Configuration

```json
{
  "aiOrchestrator.fireworks": {
    "apiKey": "fw_...",
    "defaultModel": "llama-v3p1-70b-instruct",
    "enabled": true
  }
}
```

Or:
```bash
export FIREWORKS_API_KEY=fw_...
```

### Cost Comparison

| Provider | Model | Input ($/1M tokens) | Output ($/1M tokens) |
|----------|-------|---------------------|---------------------|
| OpenAI | GPT-4 Turbo | $10 | $30 |
| Anthropic | Claude 3.5 Sonnet | $3 | $15 |
| Google | Gemini 1.5 Pro | $1.25 | $5 |
| **Fireworks** | Llama 3.1 70B | **$0.90** | **$0.90** |
| **Fireworks** | DeepSeek Coder | **$0.20** | **$0.20** |

**Potential Savings:** 10-50x for high-volume tasks!

---

## Integration Timeline

### Phase 4 (Short-term):
- [ ] Add Fireworks provider
- [ ] Test with Llama and DeepSeek models
- [ ] Benchmark performance vs other providers
- [ ] Update Orchestrator to consider cost in planning

### Phase 5 (Medium-term):
- [ ] Design Claude Code integration approach
- [ ] Implement Claude Code provider
- [ ] Add tool registry and permission system
- [ ] Test complex multi-file refactoring

### Phase 6 (Long-term):
- [ ] Optimize agent selection based on task complexity + cost
- [ ] Add agent performance metrics
- [ ] Implement fallback chains (try Fireworks first, fall back to Claude if needed)
- [ ] Add user preference controls

---

## Example: Intelligent Agent Selection

```typescript
// Orchestrator considers multiple factors:
const selectAgent = (task: ITask) => {
  const factors = {
    complexity: analyzeComplexity(task),
    toolsNeeded: detectRequiredTools(task),
    budget: getUserBudget(),
    latency: getLatencyRequirement(),
    multimodal: hasImages(task)
  };

  if (factors.toolsNeeded.length > 0) {
    return 'claude-code'; // Needs tools
  }

  if (factors.multimodal) {
    return 'gemini'; // Needs vision
  }

  if (task.description.includes('UI') || task.description.includes('component')) {
    return 'v0'; // UI generation
  }

  if (factors.complexity === 'low' && factors.budget === 'constrained') {
    return 'fireworks'; // Fast + cheap
  }

  if (factors.complexity === 'high') {
    return 'claude'; // Complex reasoning
  }

  return 'gpt'; // Default
};
```

---

## Notes

- **Claude Code integration is critical** - Its tool usage capabilities are unmatched
- **Fireworks is a great addition** - Massive cost savings for appropriate tasks
- **Agent swapping is easy** - Architecture designed for pluggability
- **Orchestrator gets smarter** - Can optimize for cost, speed, and quality

**Status:** Ready to implement when Phase 1-2 are complete! 🚀
