# Settings Architecture - API Key Management

**Date:** October 24, 2025

---

## Overview

Users need a secure, intuitive way to:
1. Register API keys for multiple AI providers
2. Configure provider preferences and routing rules
3. Set cost limits and usage quotas
4. Manage project-specific context settings

---

## VS Code Settings Structure

### Configuration Schema

VS Code settings will be defined in `package.json` of our contribution:

```json
{
  "contributes": {
    "configuration": {
      "title": "AI Orchestrator",
      "properties": {
        "aiOrchestrator.providers.fireworks.apiKey": {
          "type": "string",
          "default": "",
          "description": "Fireworks.ai API key for primary AI operations",
          "markdownDescription": "Get your API key from [Fireworks.ai](https://fireworks.ai)",
          "scope": "application"
        },
        "aiOrchestrator.providers.fireworks.enabled": {
          "type": "boolean",
          "default": true,
          "description": "Enable Fireworks.ai provider",
          "scope": "application"
        },
        "aiOrchestrator.providers.fireworks.defaultModel": {
          "type": "string",
          "default": "accounts/fireworks/models/llama-v3p3-70b-instruct",
          "enum": [
            "accounts/fireworks/models/llama-v3p1-8b-instruct",
            "accounts/fireworks/models/llama-v3p3-70b-instruct",
            "accounts/fireworks/models/deepseek-v3"
          ],
          "description": "Default Fireworks.ai model",
          "scope": "application"
        },

        "aiOrchestrator.providers.claude.apiKey": {
          "type": "string",
          "default": "",
          "description": "Anthropic Claude API key for critical decisions",
          "markdownDescription": "Get your API key from [Anthropic Console](https://console.anthropic.com)",
          "scope": "application"
        },
        "aiOrchestrator.providers.claude.enabled": {
          "type": "boolean",
          "default": false,
          "description": "Enable Claude provider for critical decisions",
          "scope": "application"
        },
        "aiOrchestrator.providers.claude.model": {
          "type": "string",
          "default": "claude-sonnet-4.5-20250514",
          "enum": [
            "claude-sonnet-4.5-20250514",
            "claude-sonnet-4-20241029",
            "claude-opus-4-20241029"
          ],
          "description": "Claude model version",
          "scope": "application"
        },

        "aiOrchestrator.providers.gemini.apiKey": {
          "type": "string",
          "default": "",
          "description": "Google Gemini API key for large context operations",
          "markdownDescription": "Get your API key from [Google AI Studio](https://aistudio.google.com)",
          "scope": "application"
        },
        "aiOrchestrator.providers.gemini.enabled": {
          "type": "boolean",
          "default": false,
          "description": "Enable Gemini provider for large context",
          "scope": "application"
        },
        "aiOrchestrator.providers.gemini.model": {
          "type": "string",
          "default": "gemini-2.0-flash-exp",
          "enum": [
            "gemini-2.0-flash-exp",
            "gemini-1.5-pro-latest",
            "gemini-1.5-flash-latest"
          ],
          "description": "Gemini model version",
          "scope": "application"
        },

        "aiOrchestrator.routing.strategy": {
          "type": "string",
          "default": "cost-optimized",
          "enum": [
            "cost-optimized",
            "quality-first",
            "speed-first",
            "manual"
          ],
          "enumDescriptions": [
            "Automatically select the cheapest provider that meets requirements",
            "Prefer higher-quality (more expensive) providers",
            "Prefer faster providers regardless of cost",
            "Manually specify provider for each request"
          ],
          "description": "Provider routing strategy",
          "scope": "application"
        },

        "aiOrchestrator.routing.costLimit.daily": {
          "type": "number",
          "default": 1.0,
          "description": "Daily cost limit in USD (0 = unlimited)",
          "minimum": 0,
          "scope": "application"
        },

        "aiOrchestrator.routing.costLimit.monthly": {
          "type": "number",
          "default": 15.0,
          "description": "Monthly cost limit in USD (0 = unlimited)",
          "minimum": 0,
          "scope": "application"
        },

        "aiOrchestrator.agents.enabled": {
          "type": "array",
          "default": ["planning", "code", "review", "test", "document", "architecture"],
          "items": {
            "type": "string",
            "enum": ["planning", "code", "review", "test", "document", "architecture"]
          },
          "description": "Enabled agent types",
          "scope": "application"
        },

        "aiOrchestrator.agents.providerAssignment": {
          "type": "object",
          "default": {
            "planning": "auto",
            "code": "auto",
            "review": "auto",
            "test": "auto",
            "document": "auto",
            "architecture": "auto"
          },
          "properties": {
            "planning": {
              "type": "string",
              "enum": ["auto", "fireworks-8b", "fireworks-70b", "fireworks-deepseek", "claude", "gemini"],
              "default": "auto"
            },
            "code": {
              "type": "string",
              "enum": ["auto", "fireworks-8b", "fireworks-70b", "fireworks-deepseek", "claude", "gemini"],
              "default": "auto"
            },
            "review": {
              "type": "string",
              "enum": ["auto", "fireworks-8b", "fireworks-70b", "fireworks-deepseek", "claude", "gemini"],
              "default": "auto"
            },
            "test": {
              "type": "string",
              "enum": ["auto", "fireworks-8b", "fireworks-70b", "fireworks-deepseek", "claude", "gemini"],
              "default": "auto"
            },
            "document": {
              "type": "string",
              "enum": ["auto", "fireworks-8b", "fireworks-70b", "fireworks-deepseek", "claude", "gemini"],
              "default": "auto"
            },
            "architecture": {
              "type": "string",
              "enum": ["auto", "fireworks-8b", "fireworks-70b", "fireworks-deepseek", "claude", "gemini"],
              "default": "auto"
            }
          },
          "description": "Assign specific providers to agent roles (auto = use smart routing)",
          "scope": "application"
        },

        "aiOrchestrator.agents.useUnifiedProvider": {
          "type": "boolean",
          "default": false,
          "description": "Use a single provider for all agents (overrides per-agent assignments)",
          "scope": "application"
        },

        "aiOrchestrator.agents.unifiedProviderChoice": {
          "type": "string",
          "default": "fireworks-70b",
          "enum": ["fireworks-8b", "fireworks-70b", "fireworks-deepseek", "claude", "gemini"],
          "description": "Which provider to use when unified mode is enabled",
          "scope": "application"
        },

        "aiOrchestrator.agents.multiAgentConsultation": {
          "type": "boolean",
          "default": true,
          "description": "Enable multi-agent consultation for complex problems",
          "scope": "application"
        },

        "aiOrchestrator.agents.consultation.minAgents": {
          "type": "number",
          "default": 2,
          "minimum": 2,
          "maximum": 6,
          "description": "Minimum agents for consultation",
          "scope": "application"
        },

        "aiOrchestrator.agents.consultation.allowDifferentProviders": {
          "type": "boolean",
          "default": true,
          "description": "Allow different agents in consultation to use different providers (for diverse perspectives)",
          "scope": "application"
        },

        "aiOrchestrator.context.autoSave": {
          "type": "boolean",
          "default": true,
          "description": "Automatically save project context",
          "scope": "workspace"
        },

        "aiOrchestrator.context.maxTokens": {
          "type": "number",
          "default": 100000,
          "description": "Maximum context tokens to include in requests",
          "minimum": 10000,
          "maximum": 1000000,
          "scope": "application"
        },

        "aiOrchestrator.testing.autoGenerate": {
          "type": "boolean",
          "default": true,
          "description": "Automatically generate Playwright tests for UI changes",
          "scope": "workspace"
        },

        "aiOrchestrator.testing.comprehensiveMode": {
          "type": "boolean",
          "default": true,
          "description": "Generate comprehensive tests (every button, click, hover)",
          "scope": "workspace"
        },

        "aiOrchestrator.iteration.unlimited": {
          "type": "boolean",
          "default": true,
          "description": "Allow unlimited iterations for bug fixes (sanity limit: 100)",
          "scope": "application"
        },

        "aiOrchestrator.iteration.maxAttempts": {
          "type": "number",
          "default": 100,
          "description": "Maximum fix attempts before human escalation",
          "minimum": 3,
          "maximum": 1000,
          "scope": "application"
        }
      }
    }
  }
}
```

---

## Agent Provider Assignment

### Three Configuration Modes

#### 1. **Auto Mode (Default - Recommended)**
Each agent uses smart routing based on task complexity:

```json
{
  "aiOrchestrator.agents.providerAssignment": {
    "planning": "auto",      // → Fireworks 70B for most, Claude for critical
    "code": "auto",          // → Fireworks 70B
    "review": "auto",        // → Claude for security, Fireworks 70B otherwise
    "test": "auto",          // → Fireworks 70B
    "document": "auto",      // → Fireworks 8B (simple task)
    "architecture": "auto"   // → Claude or Gemini (needs deep reasoning)
  }
}
```

**Cost:** ~$0.012 per complex task (optimal)

#### 2. **Per-Agent Assignment (Power User)**
Manually assign specific providers to each agent:

```json
{
  "aiOrchestrator.agents.providerAssignment": {
    "planning": "claude",           // Use Claude for planning (high quality)
    "code": "fireworks-70b",        // Use Fireworks 70B for coding (cost-effective)
    "review": "claude",             // Use Claude for reviews (thorough)
    "test": "fireworks-deepseek",   // Use DeepSeek for test generation (reasoning)
    "document": "fireworks-8b",     // Use Fireworks 8B for docs (fast, cheap)
    "architecture": "gemini"        // Use Gemini for architecture (large context)
  }
}
```

**Cost:** Varies based on assignments (~$0.05-0.15 per task)
**Use Case:** When you want specific expertise for each role

#### 3. **Unified Mode (Simplicity)**
Use one provider for everything:

```json
{
  "aiOrchestrator.agents.useUnifiedProvider": true,
  "aiOrchestrator.agents.unifiedProviderChoice": "fireworks-70b"
}
```

**Options:**
- `fireworks-8b` - Fastest, cheapest ($0.0002/task) - good for simple projects
- `fireworks-70b` - Balanced ($0.012/task) - **recommended default**
- `fireworks-deepseek` - Best reasoning ($0.015/task) - complex logic
- `claude` - Highest quality ($0.075/task) - production critical code
- `gemini` - Large context ($0.020/task) - massive codebases

**Cost:** Depends on choice (fixed per provider)
**Use Case:** Simplicity, consistent behavior, or working with a single API key

### Multi-Agent Consultation with Different Providers

When enabled, consultation can use different providers for diverse perspectives:

```json
{
  "aiOrchestrator.agents.multiAgentConsultation": true,
  "aiOrchestrator.agents.consultation.allowDifferentProviders": true
}
```

**Example Consultation:**
- **Bug:** Complex authentication issue
- **Agents Consulted:**
  - Planning Agent (Fireworks 70B): "Let's check JWT validation"
  - Code Agent (Fireworks DeepSeek): "Token expiry logic looks wrong"
  - Review Agent (Claude): "Security: Use constant-time comparison"
  - Architecture Agent (Gemini): "Based on full codebase, this impacts 12 files"

**Benefit:** Different models = different perspectives = better solutions
**Cost:** ~$0.10 for 4-agent consultation (vs single agent: $0.012)

---

## Provider Assignment Logic

```typescript
export class AgentProviderResolver {
  constructor(
    private config: vscode.WorkspaceConfiguration,
    private providerSelector: ProviderSelector
  ) {}

  resolveProvider(agentRole: AgentRole, task: Task): ProviderSelection {
    // Mode 1: Unified Provider
    if (this.config.get<boolean>('agents.useUnifiedProvider')) {
      const choice = this.config.get<string>('agents.unifiedProviderChoice');
      return this.getProviderByChoice(choice);
    }

    // Mode 2: Per-Agent Assignment
    const assignments = this.config.get<Record<string, string>>('agents.providerAssignment');
    const assignment = assignments[agentRole];

    if (assignment && assignment !== 'auto') {
      return this.getProviderByChoice(assignment);
    }

    // Mode 3: Auto (Smart Routing)
    return this.providerSelector.select({
      complexity: this.estimateComplexity(agentRole, task),
      requiresToolCalling: true,
      critical: this.isCriticalTask(agentRole, task),
      contextSize: task.contextSize
    });
  }

  private estimateComplexity(role: AgentRole, task: Task): number {
    // Role-based complexity heuristics
    const roleComplexity = {
      planning: 7,      // Complex: needs reasoning
      code: 8,          // Complex: needs tool calling
      review: 7,        // Complex: needs thorough analysis
      test: 6,          // Moderate: structured output
      document: 3,      // Simple: text generation
      architecture: 9   // Very complex: system-level thinking
    };

    return roleComplexity[role];
  }

  private isCriticalTask(role: AgentRole, task: Task): boolean {
    // Security reviews and architecture changes are always critical
    if (role === 'review' && task.type === 'security') return true;
    if (role === 'architecture') return true;

    // Check task metadata
    return task.critical || false;
  }

  private getProviderByChoice(choice: string): ProviderSelection {
    const map = {
      'fireworks-8b': { provider: 'fireworks', model: 'llama-v3p1-8b-instruct' },
      'fireworks-70b': { provider: 'fireworks', model: 'llama-v3p3-70b-instruct' },
      'fireworks-deepseek': { provider: 'fireworks', model: 'deepseek-v3' },
      'claude': { provider: 'claude', model: 'claude-sonnet-4.5-20250514' },
      'gemini': { provider: 'gemini', model: 'gemini-2.0-flash-exp' }
    };

    return map[choice] || map['fireworks-70b'];
  }
}
```

---

## Use Case Examples

### Example 1: Budget-Conscious Developer
"I want the cheapest option that still works well"

```json
{
  "aiOrchestrator.agents.useUnifiedProvider": true,
  "aiOrchestrator.agents.unifiedProviderChoice": "fireworks-70b",
  "aiOrchestrator.routing.costLimit.daily": 0.50,
  "aiOrchestrator.routing.costLimit.monthly": 10.00
}
```

**Monthly Cost:** ~$5-8

### Example 2: Quality-First Developer
"I want the best results, cost is secondary"

```json
{
  "aiOrchestrator.agents.providerAssignment": {
    "planning": "claude",
    "code": "claude",
    "review": "claude",
    "test": "fireworks-deepseek",
    "document": "fireworks-8b",
    "architecture": "claude"
  }
}
```

**Monthly Cost:** ~$25-35

### Example 3: Balanced Developer (Recommended)
"I want smart routing that optimizes cost and quality"

```json
{
  "aiOrchestrator.agents.providerAssignment": {
    "planning": "auto",
    "code": "auto",
    "review": "auto",
    "test": "auto",
    "document": "auto",
    "architecture": "auto"
  },
  "aiOrchestrator.routing.strategy": "cost-optimized"
}
```

**Monthly Cost:** ~$9-12

### Example 4: Enterprise Developer
"I need Claude for everything due to compliance"

```json
{
  "aiOrchestrator.agents.useUnifiedProvider": true,
  "aiOrchestrator.agents.unifiedProviderChoice": "claude",
  "aiOrchestrator.routing.costLimit.monthly": 100.00
}
```

**Monthly Cost:** ~$40-60

### Example 5: Large Codebase Developer
"I need full repository context often"

```json
{
  "aiOrchestrator.agents.providerAssignment": {
    "planning": "auto",
    "code": "fireworks-70b",
    "review": "claude",
    "test": "fireworks-70b",
    "document": "fireworks-8b",
    "architecture": "gemini"  // 1M context for full codebase
  }
}
```

**Monthly Cost:** ~$12-18

---

## Security Considerations

### 1. API Key Storage

**VS Code Secret Storage API:**
```typescript
import * as vscode from 'vscode';

export class SecureCredentialStore {
  constructor(private context: vscode.ExtensionContext) {}

  async storeApiKey(provider: string, apiKey: string): Promise<void> {
    await this.context.secrets.store(`aiOrchestrator.${provider}.apiKey`, apiKey);
  }

  async getApiKey(provider: string): Promise<string | undefined> {
    return await this.context.secrets.get(`aiOrchestrator.${provider}.apiKey`);
  }

  async deleteApiKey(provider: string): Promise<void> {
    await this.context.secrets.delete(`aiOrchestrator.${provider}.apiKey`);
  }
}
```

**Why Secret Storage?**
- Encrypted at rest
- OS-level keychain integration (Windows Credential Manager, macOS Keychain, Linux Secret Service)
- Not stored in settings.json (prevents accidental git commits)
- Syncs across devices if Settings Sync is enabled

### 2. Migration from Settings.json

If users accidentally put API keys in settings:

```typescript
export async function migrateApiKeysToSecrets(
  context: vscode.ExtensionContext
): Promise<void> {
  const config = vscode.workspace.getConfiguration('aiOrchestrator');
  const providers = ['fireworks', 'claude', 'gemini'];

  for (const provider of providers) {
    const key = `providers.${provider}.apiKey`;
    const apiKey = config.get<string>(key);

    if (apiKey && apiKey.length > 0) {
      // Migrate to secrets
      await context.secrets.store(`aiOrchestrator.${provider}.apiKey`, apiKey);

      // Clear from settings
      await config.update(key, '', vscode.ConfigurationTarget.Global);

      vscode.window.showInformationMessage(
        `Migrated ${provider} API key to secure storage`
      );
    }
  }
}
```

---

## UI Components

### 1. Welcome Screen (First Time Setup)

```typescript
export class WelcomePanel {
  static show(context: vscode.ExtensionContext) {
    const panel = vscode.window.createWebviewPanel(
      'aiOrchestratorWelcome',
      'AI Orchestrator Setup',
      vscode.ViewColumn.One,
      { enableScripts: true }
    );

    panel.webview.html = this.getWebviewContent();

    panel.webview.onDidReceiveMessage(async message => {
      switch (message.command) {
        case 'saveApiKey':
          await context.secrets.store(
            `aiOrchestrator.${message.provider}.apiKey`,
            message.apiKey
          );
          vscode.window.showInformationMessage(
            `${message.provider} API key saved securely!`
          );
          break;
      }
    });
  }
}
```

**Webview HTML:**
```html
<!DOCTYPE html>
<html>
<head>
  <style>
    .provider-card {
      border: 1px solid var(--vscode-panel-border);
      padding: 20px;
      margin: 10px 0;
      border-radius: 8px;
    }
    .required { color: var(--vscode-errorForeground); }
    .optional { color: var(--vscode-descriptionForeground); }
  </style>
</head>
<body>
  <h1>🤖 Welcome to AI Orchestrator</h1>

  <p>To get started, configure at least one AI provider:</p>

  <div class="provider-card">
    <h2>🔥 Fireworks.ai <span class="required">(Required)</span></h2>
    <p>Primary provider - Most cost-effective for daily coding</p>
    <p><strong>Cost:</strong> $0.20-1.14 per 1M tokens</p>
    <input type="password" id="fireworks-key" placeholder="Enter API key">
    <button onclick="saveKey('fireworks')">Save</button>
    <p><a href="https://fireworks.ai">Get API Key →</a></p>
  </div>

  <div class="provider-card">
    <h2>🧠 Claude <span class="optional">(Optional - Critical Tasks)</span></h2>
    <p>For critical decisions and security reviews</p>
    <p><strong>Cost:</strong> $3-15 per 1M tokens</p>
    <input type="password" id="claude-key" placeholder="Enter API key">
    <button onclick="saveKey('claude')">Save</button>
    <p><a href="https://console.anthropic.com">Get API Key →</a></p>
  </div>

  <div class="provider-card">
    <h2>✨ Gemini <span class="optional">(Optional - Large Context)</span></h2>
    <p>For full codebase analysis (1M context window)</p>
    <p><strong>Cost:</strong> $0.10-0.40 per 1M tokens</p>
    <input type="password" id="gemini-key" placeholder="Enter API key">
    <button onclick="saveKey('gemini')">Save</button>
    <p><a href="https://aistudio.google.com">Get API Key →</a></p>
  </div>

  <button onclick="finish()" style="margin-top: 20px;">Finish Setup</button>

  <script>
    const vscode = acquireVsCodeApi();

    function saveKey(provider) {
      const input = document.getElementById(`${provider}-key`);
      const apiKey = input.value.trim();

      if (!apiKey) {
        alert('Please enter an API key');
        return;
      }

      vscode.postMessage({
        command: 'saveApiKey',
        provider: provider,
        apiKey: apiKey
      });

      input.value = '';
    }

    function finish() {
      vscode.postMessage({ command: 'finishSetup' });
    }
  </script>
</body>
</html>
```

### 2. Settings Page (Ongoing Management)

Command: `AI Orchestrator: Open Settings`

Opens a webview with:
- **Provider Status** (configured, enabled, test connection)
- **Cost Dashboard** (daily/monthly usage)
- **Routing Strategy** selector
- **Agent Configuration**
- **Context Settings**

### 3. Status Bar Item

```typescript
const statusBarItem = vscode.window.createStatusBarItem(
  vscode.StatusBarAlignment.Right,
  100
);

statusBarItem.text = '$(robot) AI: Ready';
statusBarItem.tooltip = 'AI Orchestrator Status\n\nFireworks: ✓\nClaude: ✓\nGemini: ✗\n\nToday: $0.12 / $1.00';
statusBarItem.command = 'aiOrchestrator.openDashboard';
statusBarItem.show();
```

---

## Configuration File Structure

### User Settings (`.vscode/settings.json`)

```json
{
  "aiOrchestrator.routing.strategy": "cost-optimized",
  "aiOrchestrator.routing.costLimit.daily": 1.0,
  "aiOrchestrator.routing.costLimit.monthly": 15.0,
  "aiOrchestrator.agents.enabled": [
    "planning",
    "code",
    "review",
    "test",
    "document",
    "architecture"
  ],
  "aiOrchestrator.agents.multiAgentConsultation": true,
  "aiOrchestrator.context.autoSave": true,
  "aiOrchestrator.testing.autoGenerate": true,
  "aiOrchestrator.testing.comprehensiveMode": true
}
```

### Project Context (`.vscode/ai-context.json`)

```json
{
  "version": "1.0.0",
  "project": {
    "name": "vscode-fork",
    "type": "electron-app",
    "languages": ["typescript", "javascript"],
    "frameworks": ["electron", "vs-code"],
    "architecture": "multi-tier"
  },
  "memory": {
    "codebaseStructure": "...",
    "recentDecisions": [],
    "commonPatterns": [],
    "criticalFiles": []
  },
  "routing": {
    "preferredProvider": "fireworks",
    "overrides": {
      "security-reviews": "claude",
      "full-codebase-analysis": "gemini"
    }
  }
}
```

---

## Implementation Plan

### Phase 1: Basic Settings (Week 1)
1. Define configuration schema in `package.json`
2. Implement `SecureCredentialStore` class
3. Create settings migration script
4. Build welcome screen webview

### Phase 2: Provider Configuration (Week 2)
1. Implement provider settings UI
2. Add connection testing
3. Build status bar integration
4. Create cost tracking dashboard

### Phase 3: Advanced Settings (Week 3)
1. Implement routing strategy selector
2. Add cost limits and quotas
3. Build agent configuration UI
4. Create project context manager

### Phase 4: Polish (Week 4)
1. Add settings validation
2. Implement settings sync
3. Create troubleshooting guide
4. Add inline documentation

---

## API Key Validation

```typescript
export class ProviderValidator {
  static async validateFireworks(apiKey: string): Promise<boolean> {
    try {
      const response = await fetch('https://api.fireworks.ai/inference/v1/models', {
        headers: { 'Authorization': `Bearer ${apiKey}` }
      });
      return response.ok;
    } catch {
      return false;
    }
  }

  static async validateClaude(apiKey: string): Promise<boolean> {
    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
          'content-type': 'application/json'
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4.5-20250514',
          max_tokens: 1,
          messages: [{ role: 'user', content: 'test' }]
        })
      });
      return response.status !== 401;
    } catch {
      return false;
    }
  }

  static async validateGemini(apiKey: string): Promise<boolean> {
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`
      );
      return response.ok;
    } catch {
      return false;
    }
  }
}
```

---

## User Flow

### First Time Setup
1. User installs VS Code fork
2. Opens Command Palette → "AI Orchestrator: Setup"
3. Welcome screen appears
4. User enters at least Fireworks.ai API key
5. System validates key
6. User optionally adds Claude + Gemini keys
7. Setup complete → AI Orchestrator ready

### Adding a New Provider
1. Command Palette → "AI Orchestrator: Add Provider"
2. Select provider from list
3. Enter API key
4. System validates
5. Provider enabled automatically

### Changing Settings
1. Command Palette → "AI Orchestrator: Open Settings"
2. OR click status bar item → "Settings"
3. Webview dashboard opens
4. User modifies settings
5. Changes saved immediately

---

## Cost Tracking

```typescript
export class CostTracker {
  private costs: Map<string, number> = new Map();

  async recordRequest(
    provider: string,
    inputTokens: number,
    outputTokens: number,
    cost: number
  ): Promise<void> {
    const today = new Date().toISOString().split('T')[0];
    const key = `${provider}:${today}`;

    const currentCost = this.costs.get(key) || 0;
    this.costs.set(key, currentCost + cost);

    // Check limits
    const dailyLimit = vscode.workspace.getConfiguration('aiOrchestrator')
      .get<number>('routing.costLimit.daily', 1.0);

    if (dailyLimit > 0 && currentCost + cost > dailyLimit) {
      vscode.window.showWarningMessage(
        `Daily cost limit reached: $${(currentCost + cost).toFixed(2)} / $${dailyLimit}`
      );
    }
  }

  getDailyCost(): number {
    const today = new Date().toISOString().split('T')[0];
    let total = 0;

    for (const [key, cost] of this.costs.entries()) {
      if (key.endsWith(today)) {
        total += cost;
      }
    }

    return total;
  }
}
```

---

## Settings UI Mockup

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ AI Orchestrator Settings                                     [Presets ▼]    │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│ PROVIDERS                                                                    │
│ ───────────────────────────────────────────────────────────────────────────│
│                                                                              │
│ 🔥 Fireworks.ai                              [✓] Enabled                    │
│    Status: Connected                         [Test Connection]              │
│    Default Model: llama-v3p3-70b-instruct   [▼]                            │
│    Cost: $0.90/1M tokens                                                    │
│    [Change API Key]                                                         │
│                                                                              │
│ 🧠 Claude                                    [✓] Enabled                    │
│    Status: Connected                         [Test Connection]              │
│    Model: claude-sonnet-4.5-20250514        [▼]                            │
│    Cost: $3-15/1M tokens                                                    │
│    [Change API Key]                                                         │
│                                                                              │
│ ✨ Gemini                                    [  ] Disabled                   │
│    Status: Not configured                    [Test Connection]              │
│    [Add API Key]                                                            │
│                                                                              │
│ ROUTING                                                                      │
│ ───────────────────────────────────────────────────────────────────────────│
│                                                                              │
│ Strategy: [Cost-Optimized ▼]  (Auto, Quality-First, Speed-First, Manual)   │
│ Daily Limit: $1.00    Today: $0.12 (12%)   [████──────]                    │
│ Monthly Limit: $15.00  This Month: $3.45 (23%) [████████──]                │
│                                                                              │
│ AGENT CONFIGURATION                                                          │
│ ───────────────────────────────────────────────────────────────────────────│
│                                                                              │
│ Provider Mode:                                                               │
│   ( ) Unified - Use one provider for all agents                             │
│       Provider: [Fireworks 70B ▼]                                           │
│                                                                              │
│   (•) Per-Agent - Assign providers to specific agents                       │
│       ┌──────────────────┬──────────────────────┬─────────────────┐        │
│       │ Agent            │ Provider             │ Est. Cost/Use   │        │
│       ├──────────────────┼──────────────────────┼─────────────────┤        │
│       │ 🎯 Planning      │ [Auto ▼]            │ $0.010-0.015    │        │
│       │ 💻 Code          │ [Fireworks 70B ▼]   │ $0.012          │        │
│       │ 🔍 Review        │ [Claude ▼]          │ $0.075          │        │
│       │ 🧪 Test          │ [Fireworks DeepSeek ▼] │ $0.015       │        │
│       │ 📝 Document      │ [Fireworks 8B ▼]    │ $0.0002         │        │
│       │ 🏗️ Architecture   │ [Gemini ▼]          │ $0.020          │        │
│       └──────────────────┴──────────────────────┴─────────────────┘        │
│                                                                              │
│       Estimated monthly cost with above config: $12.50                      │
│                                                                              │
│   Available providers:                                                       │
│   • Auto (smart routing based on task)                                      │
│   • Fireworks 8B ($0.20/1M) - Fast & cheap                                 │
│   • Fireworks 70B ($0.90/1M) - Balanced ⭐ Recommended                      │
│   • Fireworks DeepSeek ($1.14/1M) - Best reasoning                         │
│   • Claude ($3-15/1M) - Highest quality                                    │
│   • Gemini ($0.10-0.40/1M) - Large context (1M tokens)                     │
│                                                                              │
│ Multi-Agent Consultation:                                                    │
│   [✓] Enable consultation for complex problems                              │
│   [✓] Allow different providers per agent (diverse perspectives)            │
│   Minimum agents: [2 ▼]    Maximum agents: [4 ▼]                           │
│                                                                              │
│ TESTING                                                                      │
│ ───────────────────────────────────────────────────────────────────────────│
│                                                                              │
│ [✓] Auto-generate Playwright tests for UI changes                           │
│ [✓] Comprehensive mode (test every button, click, hover)                    │
│ [✓] Generate tests before making changes (TDD mode)                         │
│                                                                              │
│ ITERATION                                                                    │
│ ───────────────────────────────────────────────────────────────────────────│
│                                                                              │
│ [✓] Allow unlimited iterations for bug fixes                                │
│     Max attempts before escalation: [100]                                   │
│ [✓] Detect infinite loops and escalate automatically                        │
│                                                                              │
│ CONTEXT                                                                      │
│ ───────────────────────────────────────────────────────────────────────────│
│                                                                              │
│ [✓] Auto-save project context to .vscode/ai-context.json                    │
│ Max context tokens: [100000]  (10K - 1M)                                    │
│ [✓] Enable Memory-Agent (MLP) for 70-85% token reduction                    │
│                                                                              │
│                                                                              │
│                           [Save Settings]  [Reset to Defaults]              │
└─────────────────────────────────────────────────────────────────────────────┘

PRESETS:
┌─────────────────────────────────────────────────────────────────────────────┐
│ Quick Presets                                                                │
├─────────────────────────────────────────────────────────────────────────────┤
│ • Balanced (Recommended)     - Auto routing, $9-12/mo                        │
│ • Budget Mode                - Fireworks 70B unified, $5-8/mo                │
│ • Quality First              - Claude for critical, $25-35/mo                │
│ • Enterprise                 - Claude unified, $40-60/mo                     │
│ • Large Codebase            - Gemini for architecture, $12-18/mo            │
│ • Custom                     - Your current configuration                    │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Next Steps

1. **Define package.json configuration** (after build completes)
2. **Implement SecureCredentialStore**
3. **Build welcome screen**
4. **Add provider validation**
5. **Create settings dashboard**

---

**Status:** Ready to implement after successful build ✅
