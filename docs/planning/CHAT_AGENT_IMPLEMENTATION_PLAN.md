# Chat Agent Provider Implementation Plan

**Date:** October 25, 2025
**Status:** Planning Phase

---

## Overview

This document outlines the technical implementation plan for integrating chat agent providers (Claude, Gemini, GPT, v0) with the Mission Control dashboard in VS Code's AI Orchestrator.

---

## Architecture Summary

```
┌─────────────────────────────────────────────────────────────┐
│                    Mission Control UI (React)                │
│         Location: src/vs/workbench/contrib/                 │
│         aiOrchestrator/browser/media/mission-control/        │
└───────────────────┬─────────────────────────────────────────┘
                    │ Message Passing
                    ↓
┌─────────────────────────────────────────────────────────────┐
│            Mission Control Webview Panel                     │
│   Location: src/vs/workbench/contrib/aiOrchestrator/       │
│   browser/missionControlWebview.ts                          │
└───────────────────┬─────────────────────────────────────────┘
                    │ VS Code DI
                    ↓
┌─────────────────────────────────────────────────────────────┐
│            AI Orchestrator Service (Main Entry)              │
│   Location: src/vs/workbench/contrib/aiOrchestrator/       │
│   browser/aiOrchestratorService.ts                          │
│   Interface: IAIOrchestratorService                          │
└───────────────────┬─────────────────────────────────────────┘
                    │
        ┌───────────┴───────────┬──────────────┬──────────────┐
        ↓                       ↓              ↓              ↓
┌──────────────┐     ┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│Claude Provider│     │Gemini Provider│  │  GPT Provider│  │  v0 Provider │
│              │     │              │  │              │  │              │
└──────────────┘     └──────────────┘  └──────────────┘  └──────────────┘
        │                       │              │              │
        └───────────┬───────────┴──────────────┴──────────────┘
                    │
                    ↓
         ┌────────────────────────┐
         │ VS Code Language Model │
         │     Chat Provider      │
         │  (ILanguageModels API) │
         └────────────────────────┘
```

---

## Phase 1: Core Chat Infrastructure

### 1.1 Chat Service Interface

**Location:** `src/vs/workbench/contrib/aiOrchestrator/common/chatService.ts`

```typescript
export const IChatService = createDecorator<IChatService>('chatService');

export interface IChatService {
    /**
     * Send a message to an AI agent and get streaming response
     */
    sendMessage(
        agent: AgentType,
        message: string,
        context: IProjectContext,
        token: CancellationToken
    ): Promise<AsyncIterable<IChatResponsePart>>;

    /**
     * Get available models for an agent type
     */
    getAvailableModels(agent: AgentType): Promise<IModelInfo[]>;

    /**
     * Get chat history for current session
     */
    getChatHistory(): IChatMessage[];

    /**
     * Clear chat history
     */
    clearHistory(): void;
}

export interface IChatMessage {
    id: string;
    agent: AgentType;
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
    model?: string;
}

export interface IModelInfo {
    id: string;
    name: string;
    vendor: string;
    contextWindow: number;
    supportsStreaming: boolean;
    cost?: {
        input: number;  // per 1M tokens
        output: number; // per 1M tokens
    };
}
```

### 1.2 Base Chat Provider

**Location:** `src/vs/workbench/contrib/aiOrchestrator/common/baseChatProvider.ts`

```typescript
/**
 * Abstract base class for all chat providers
 * Handles common functionality like message formatting, streaming, error handling
 */
export abstract class BaseChatProvider {
    constructor(
        protected readonly languageModelService: ILanguageModelsService,
        protected readonly configurationService: IConfigurationService
    ) {}

    abstract get agentType(): AgentType;
    abstract get modelFamily(): string;
    abstract get vendor(): string;

    /**
     * Send message and stream response
     */
    async sendMessage(
        message: string,
        context: IProjectContext,
        token: CancellationToken
    ): Promise<AsyncIterable<IChatResponsePart>> {
        // 1. Get model configuration
        const model = await this.selectModel();

        // 2. Build prompt with context
        const prompt = this.buildPrompt(message, context);

        // 3. Create chat request
        const request = this.createChatRequest(prompt, model);

        // 4. Send to VS Code language model service
        const response = await this.languageModelService.sendChatRequest(
            model.vendor,
            model.family,
            request,
            token
        );

        // 5. Return streaming response
        return response;
    }

    /**
     * Select appropriate model based on config and task
     */
    protected abstract selectModel(): Promise<{ vendor: string; family: string; id: string }>;

    /**
     * Build prompt with context injection
     */
    protected buildPrompt(message: string, context: IProjectContext): string {
        let prompt = '';

        // Add workspace context
        if (context.workspace) {
            prompt += `Workspace: ${context.workspace.fsPath}\n`;
        }

        // Add active file context
        if (context.activeFile) {
            prompt += `Active file: ${context.activeFile.fsPath}\n`;
        }

        // Add selection context
        if (context.selection) {
            prompt += `Selected text:\n\`\`\`\n${context.selection.text}\n\`\`\`\n`;
        }

        // Add user message
        prompt += `\nUser request: ${message}`;

        return prompt;
    }

    /**
     * Create chat request for VS Code language model API
     */
    protected createChatRequest(prompt: string, model: any): any {
        return {
            messages: [
                {
                    role: 'user',
                    content: prompt
                }
            ],
            ...this.getModelOptions()
        };
    }

    /**
     * Get model-specific options (temperature, max tokens, etc.)
     */
    protected getModelOptions(): any {
        const config = this.configurationService.getValue<any>(
            `aiOrchestrator.providers.${this.agentType}`
        );

        return {
            temperature: config?.temperature ?? 0.7,
            max_tokens: config?.maxTokens ?? 4096
        };
    }
}
```

---

## Phase 2: Individual Provider Implementations

### 2.1 Claude Provider

**Location:** `src/vs/workbench/contrib/aiOrchestrator/browser/providers/claudeProvider.ts`

```typescript
export class ClaudeProvider extends BaseChatProvider {
    get agentType(): AgentType { return 'claude'; }
    get modelFamily(): string { return 'claude'; }
    get vendor(): string { return 'anthropic'; }

    protected async selectModel() {
        const config = this.configurationService.getValue<any>(
            'aiOrchestrator.providers.claude'
        );

        return {
            vendor: 'anthropic',
            family: 'claude',
            id: config?.defaultModel ?? 'claude-sonnet-3-5'
        };
    }

    protected buildPrompt(message: string, context: IProjectContext): string {
        // Claude-specific prompt engineering
        const systemPrompt = `You are Claude, an AI coding assistant. You help with:
- Writing clean, maintainable code
- Refactoring and code reviews
- Bug fixing and debugging
- Writing documentation

Always provide working code with explanations.`;

        return `${systemPrompt}\n\n${super.buildPrompt(message, context)}`;
    }
}
```

### 2.2 Gemini Provider

**Location:** `src/vs/workbench/contrib/aiOrchestrator/browser/providers/geminiProvider.ts`

```typescript
export class GeminiProvider extends BaseChatProvider {
    get agentType(): AgentType { return 'gemini'; }
    get modelFamily(): string { return 'gemini'; }
    get vendor(): string { return 'google'; }

    protected async selectModel() {
        const config = this.configurationService.getValue<any>(
            'aiOrchestrator.providers.gemini'
        );

        return {
            vendor: 'google',
            family: 'gemini',
            id: config?.defaultModel ?? 'gemini-1.5-pro'
        };
    }

    protected buildPrompt(message: string, context: IProjectContext): string {
        // Gemini-specific prompt with multimodal capabilities
        const systemPrompt = `You are Gemini, a multimodal AI assistant. You excel at:
- Analyzing code and UI together
- Understanding complex systems with large context
- Reasoning about architectural decisions
- Providing comprehensive solutions

Use your long context window to understand the full codebase.`;

        return `${systemPrompt}\n\n${super.buildPrompt(message, context)}`;
    }
}
```

### 2.3 GPT Provider

**Location:** `src/vs/workbench/contrib/aiOrchestrator/browser/providers/gptProvider.ts`

```typescript
export class GPTProvider extends BaseChatProvider {
    get agentType(): AgentType { return 'gpt'; }
    get modelFamily(): string { return 'gpt'; }
    get vendor(): string { return 'openai'; }

    protected async selectModel() {
        const config = this.configurationService.getValue<any>(
            'aiOrchestrator.providers.gpt'
        );

        return {
            vendor: 'openai',
            family: 'gpt',
            id: config?.defaultModel ?? 'gpt-4o'
        };
    }

    protected buildPrompt(message: string, context: IProjectContext): string {
        // GPT-specific prompt
        const systemPrompt = `You are GPT, a general-purpose AI coding assistant. You help with:
- Explaining code and concepts
- Planning and architecture
- Research and documentation
- General programming tasks

Provide clear, step-by-step explanations.`;

        return `${systemPrompt}\n\n${super.buildPrompt(message, context)}`;
    }
}
```

### 2.4 v0 Provider

**Location:** `src/vs/workbench/contrib/aiOrchestrator/browser/providers/v0Provider.ts`

```typescript
export class V0Provider extends BaseChatProvider {
    get agentType(): AgentType { return 'v0'; }
    get modelFamily(): string { return 'v0'; }
    get vendor(): string { return 'vercel'; }

    protected async selectModel() {
        return {
            vendor: 'vercel',
            family: 'v0',
            id: 'v0-default' // v0 doesn't have multiple models
        };
    }

    protected buildPrompt(message: string, context: IProjectContext): string {
        // v0-specific prompt for UI generation
        const systemPrompt = `You are v0, a UI generation specialist. You create:
- Beautiful React components
- Tailwind CSS styling
- shadcn/ui integration
- Responsive, accessible interfaces

Always provide complete, production-ready components with proper TypeScript types.`;

        return `${systemPrompt}\n\n${super.buildPrompt(message, context)}`;
    }
}
```

---

## Phase 3: Chat Service Implementation

**Location:** `src/vs/workbench/contrib/aiOrchestrator/browser/chatService.ts`

```typescript
export class ChatService implements IChatService {
    private readonly providers: Map<AgentType, BaseChatProvider>;
    private readonly chatHistory: IChatMessage[] = [];

    constructor(
        @ILanguageModelsService private readonly languageModelService: ILanguageModelsService,
        @IConfigurationService private readonly configurationService: IConfigurationService
    ) {
        // Initialize all providers
        this.providers = new Map([
            ['claude', new ClaudeProvider(languageModelService, configurationService)],
            ['gemini', new GeminiProvider(languageModelService, configurationService)],
            ['gpt', new GPTProvider(languageModelService, configurationService)],
            ['v0', new V0Provider(languageModelService, configurationService)]
        ]);
    }

    async sendMessage(
        agent: AgentType,
        message: string,
        context: IProjectContext,
        token: CancellationToken
    ): Promise<AsyncIterable<IChatResponsePart>> {
        const provider = this.providers.get(agent);
        if (!provider) {
            throw new Error(`Unknown agent type: ${agent}`);
        }

        // Add user message to history
        this.chatHistory.push({
            id: generateUuid(),
            agent,
            role: 'user',
            content: message,
            timestamp: new Date()
        });

        // Get streaming response
        const response = await provider.sendMessage(message, context, token);

        // Collect response and add to history
        let fullResponse = '';
        for await (const part of response) {
            if (part.kind === 'text') {
                fullResponse += part.text;
            }
        }

        this.chatHistory.push({
            id: generateUuid(),
            agent,
            role: 'assistant',
            content: fullResponse,
            timestamp: new Date()
        });

        return response;
    }

    async getAvailableModels(agent: AgentType): Promise<IModelInfo[]> {
        // Return model info based on agent type
        // This would query VS Code's language model service
        return [];
    }

    getChatHistory(): IChatMessage[] {
        return [...this.chatHistory];
    }

    clearHistory(): void {
        this.chatHistory.length = 0;
    }
}
```

---

## Phase 4: Webview Integration

### 4.1 Update Mission Control Webview

**Location:** `src/vs/workbench/contrib/aiOrchestrator/browser/missionControlWebview.ts`

Add message handlers for chat operations:

```typescript
private handleMessage(message: any): void {
    switch (message.type) {
        case 'sendChatMessage':
            this.handleSendChatMessage(message);
            break;
        case 'getChatHistory':
            this.handleGetChatHistory();
            break;
        case 'clearChatHistory':
            this.handleClearChatHistory();
            break;
        // ... existing handlers
    }
}

private async handleSendChatMessage(message: any): Promise<void> {
    const { agent, text, context } = message;

    try {
        // Get chat service via DI
        const chatService = this.instantiationService.invokeFunction(
            accessor => accessor.get(IChatService)
        );

        // Send message and stream response
        const response = await chatService.sendMessage(
            agent,
            text,
            context,
            CancellationToken.None
        );

        // Stream response parts back to React UI
        for await (const part of response) {
            this.webview?.postMessage({
                type: 'chatResponsePart',
                data: part
            });
        }

        // Signal completion
        this.webview?.postMessage({
            type: 'chatResponseComplete'
        });
    } catch (error) {
        this.webview?.postMessage({
            type: 'chatError',
            error: error.message
        });
    }
}
```

### 4.2 Update React Dashboard

**Location:** `src/vs/workbench/contrib/aiOrchestrator/browser/media/mission-control/src/App.tsx`

Add chat interface components:

```tsx
// Chat message interface
interface ChatMessage {
    id: string;
    agent: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
}

// Chat state
const [messages, setMessages] = useState<ChatMessage[]>([]);
const [currentAgent, setCurrentAgent] = useState<AgentType>('claude');
const [inputText, setInputText] = useState('');

// Send message handler
const handleSendMessage = () => {
    if (!inputText.trim()) return;

    // Add user message to UI immediately
    const userMessage: ChatMessage = {
        id: generateId(),
        agent: currentAgent,
        role: 'user',
        content: inputText,
        timestamp: new Date()
    };
    setMessages(prev => [...prev, userMessage]);

    // Send to VS Code
    window.vscodeApi.postMessage({
        type: 'sendChatMessage',
        agent: currentAgent,
        text: inputText,
        context: getCurrentContext()
    });

    setInputText('');
};

// Listen for response parts
useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
        const message = event.data;

        if (message.type === 'chatResponsePart') {
            // Stream assistant response
            // Update UI with streaming text
        } else if (message.type === 'chatResponseComplete') {
            // Finalize message
        } else if (message.type === 'chatError') {
            // Handle error
        }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
}, []);
```

---

## Phase 5: Configuration & Settings

### 5.1 VS Code Settings

Add to `package.json` contribution points:

```json
{
    "contributes": {
        "configuration": {
            "title": "AI Orchestrator",
            "properties": {
                "aiOrchestrator.providers.claude": {
                    "type": "object",
                    "description": "Claude provider configuration",
                    "properties": {
                        "enabled": { "type": "boolean", "default": true },
                        "defaultModel": { "type": "string", "default": "claude-sonnet-3-5" },
                        "temperature": { "type": "number", "default": 0.7 },
                        "maxTokens": { "type": "number", "default": 4096 }
                    }
                },
                "aiOrchestrator.providers.gemini": {
                    "type": "object",
                    "description": "Gemini provider configuration"
                    // Similar structure
                },
                "aiOrchestrator.providers.gpt": {
                    "type": "object",
                    "description": "GPT provider configuration"
                    // Similar structure
                },
                "aiOrchestrator.providers.v0": {
                    "type": "object",
                    "description": "v0 provider configuration"
                    // Similar structure
                }
            }
        }
    }
}
```

---

## Implementation Checklist

### Phase 1: Core Infrastructure (Day 1-2)
- [ ] Create `IChatService` interface
- [ ] Implement `BaseChatProvider` abstract class
- [ ] Set up message passing between webview and service
- [ ] Add DI registration for chat service

### Phase 2: Provider Implementation (Day 2-3)
- [ ] Implement `ClaudeProvider`
- [ ] Implement `GeminiProvider`
- [ ] Implement `GPTProvider`
- [ ] Implement `V0Provider`
- [ ] Test each provider individually

### Phase 3: Service Integration (Day 3-4)
- [ ] Implement `ChatService` with all providers
- [ ] Add chat history management
- [ ] Integrate with AI Orchestrator Service
- [ ] Add error handling and retries

### Phase 4: UI Integration (Day 4-5)
- [ ] Update webview message handlers
- [ ] Build React chat interface components
- [ ] Add agent selector UI
- [ ] Implement streaming message display
- [ ] Add chat history viewer

### Phase 5: Testing & Polish (Day 5-6)
- [ ] Test all four providers
- [ ] Test streaming responses
- [ ] Test error handling
- [ ] Add loading states
- [ ] Add configuration UI
- [ ] Write documentation

---

## Technical Considerations

### VS Code Language Model API Integration

VS Code provides `ILanguageModelsService` which handles:
- Model registration and discovery
- Chat request formatting
- Streaming responses
- Token counting
- Rate limiting

Our providers will use this service rather than calling APIs directly.

### Security & API Keys

- API keys stored in VS Code secrets storage
- Never exposed to webview
- Accessed only by backend services

### Error Handling

- Network errors: Retry with exponential backoff
- Rate limits: Queue requests and respect limits
- Invalid responses: Fallback to error message
- Model unavailable: Suggest alternative agent

### Performance

- Stream responses to UI for better UX
- Cache model info to reduce API calls
- Debounce rapid message sends
- Lazy load provider implementations

---

## Next Steps

1. **Review this plan** - Verify architecture makes sense
2. **Start Phase 1** - Build core infrastructure
3. **Implement one provider** - Use as template for others
4. **Test integration** - Verify end-to-end flow
5. **Complete remaining providers** - Follow established pattern
6. **Polish UI** - Add finishing touches

---

## Questions for Consideration

1. **Model Selection Strategy**: Should we auto-select based on task type or let user choose?
2. **Context Management**: How much context to include in prompts? Need to balance relevance vs token usage.
3. **Chat History**: Store in memory only or persist to disk?
4. **Rate Limiting**: Should we implement our own rate limiting or rely on VS Code's?
5. **Fallback Behavior**: If preferred agent fails, automatically try another?

---

## References

- [VS Code Language Models API](https://code.visualstudio.com/api/extension-guides/language-model)
- [Anthropic Claude API](https://docs.anthropic.com/claude/reference)
- [Google Gemini API](https://ai.google.dev/docs)
- [OpenAI GPT API](https://platform.openai.com/docs/api-reference)
- [Vercel v0 API](https://v0.dev/docs)
