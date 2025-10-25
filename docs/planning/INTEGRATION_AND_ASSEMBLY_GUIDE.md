# Integration & Assembly Guide

**Step-by-step guide for putting all the pieces together**

---

## Table of Contents

1. [Overview](#overview)
2. [Prerequisites](#prerequisites)
3. [Phase 1: VS Code Fork Setup](#phase-1-vs-code-fork-setup)
4. [Phase 2: Basic Orchestrator](#phase-2-basic-orchestrator)
5. [Phase 3: Memory-Agent Integration](#phase-3-memory-agent-integration)
6. [Phase 4: Project Manager Integration](#phase-4-project-manager-integration)
7. [Phase 5: Complete System](#phase-5-complete-system)
8. [Testing Strategy](#testing-strategy)
9. [Troubleshooting](#troubleshooting)

---

## Overview

This guide walks you through assembling the unified AI development ecosystem from all the documented components.

### What You're Building

```
┌────────────────────────────────────────────────────────┐
│  VS Code Fork (Electron)                               │
│  ┌──────────────────────────────────────────────────┐ │
│  │  Activity Bar Icons                              │ │
│  │  • 🤖 AI Assistant (Orchestrator)               │ │
│  │  • 📄 Office AI (Office embedding)              │ │
│  │  • 📊 Project Manager (Planning)                │ │
│  └──────────────────────────────────────────────────┘ │
│                                                        │
│  ┌──────────────────────────────────────────────────┐ │
│  │  Unified Agent Orchestrator                      │ │
│  │  • Intent parsing                                │ │
│  │  • Agent selection (local/cloud)                 │ │
│  │  • Context loading (Memory-Agent)                │ │
│  │  • Budget tracking                               │ │
│  └──────────────────────────────────────────────────┘ │
└────────────────────────────────────────────────────────┘
                         ↓
┌────────────────────────────────────────────────────────┐
│  External Services                                     │
│  • Memory-Agent (PostgreSQL + MCP)                    │
│  • Local Models (Minisforum NAS / Ollama)            │
│  • Cloud APIs (Fireworks, Claude, Gemini, OpenAI, v0)│
└────────────────────────────────────────────────────────┘
```

---

## Prerequisites

### Required Software

```bash
# 1. Node.js (18+)
node --version  # Should be 18.x or higher

# 2. Git
git --version

# 3. Python (for VS Code build)
python --version  # 3.x

# 4. Docker Desktop (for PostgreSQL, Ollama)
docker --version
docker-compose --version

# 5. VS Code (optional, for reference)
code --version
```

### Required Accounts (API Keys)

1. **Fireworks.ai**: https://fireworks.ai/
   - Sign up → Settings → API Keys
   - Create key, save securely

2. **Anthropic Claude**: https://console.anthropic.com/
   - Sign up → API Keys
   - Create key, save securely

3. **Google Gemini**: https://aistudio.google.com/
   - Sign up → Get API Key
   - Create key, save securely

4. **OpenAI**: https://platform.openai.com/
   - Sign up → API Keys
   - Create key, save securely

5. **Vercel v0** (optional): https://v0.dev/
   - Sign up → Settings → API Keys
   - Create key, save securely

### Directory Structure Setup

```bash
# Create workspace
mkdir -p ~/unified-ecosystem
cd ~/unified-ecosystem

# You'll clone/copy these:
# - vscode/ (VS Code fork)
# - coding-agent-template/ (this repo)
# - Memory-Agent/ (if not already present)
```

---

## Phase 1: VS Code Fork Setup

### Step 1.1: Clone VS Code

```bash
cd ~/unified-ecosystem

# Clone VS Code (use stable release branch)
git clone https://github.com/microsoft/vscode.git
cd vscode

# Checkout stable release (1.85 recommended)
git checkout release/1.85

# Verify
git branch  # Should show release/1.85
```

**Time**: 5-10 minutes (depending on internet speed)

---

### Step 1.2: Install Dependencies

```bash
cd ~/unified-ecosystem/vscode

# Install dependencies (this takes 10-15 minutes)
yarn

# Verify installation
ls node_modules/  # Should see thousands of packages
```

**Time**: 10-15 minutes

---

### Step 1.3: Build VS Code

```bash
cd ~/unified-ecosystem/vscode

# Build (first build takes 20-30 minutes)
yarn watch  # Starts watch mode, builds continuously

# Wait for "Finished compilation" message
# Keep this terminal running!
```

**Time**: 20-30 minutes (first build)

---

### Step 1.4: Test VS Code Fork

Open a **new terminal** (keep `yarn watch` running):

```bash
cd ~/unified-ecosystem/vscode

# Run VS Code in development mode
./scripts/code.sh  # Linux/Mac
# or
.\scripts\code.bat  # Windows

# VS Code should open
# Verify: Help → About → Version should show "Code - OSS"
```

**✅ Checkpoint**: VS Code fork runs successfully

---

### Step 1.5: Create Contribution Directories

```bash
cd ~/unified-ecosystem/vscode/src/vs/workbench/contrib

# Create directories for our integrations
mkdir -p aiAgent/{common,node,browser}
mkdir -p office/{common,node,browser}
mkdir -p projectManager/{common,node,browser}
mkdir -p unifiedAgent/{common,node,browser}

# Verify
ls -la
# Should see: aiAgent, office, projectManager, unifiedAgent
```

---

## Phase 2: Basic Orchestrator

### Step 2.1: Copy AI Agent Files

```bash
# Copy from coding-agent-template
cd ~/unified-ecosystem

cp coding-agent-template/vscode-ai-orchestrator-files/common/*.ts \
   vscode/src/vs/workbench/contrib/aiAgent/common/

cp coding-agent-template/vscode-ai-orchestrator-files/node/*.ts \
   vscode/src/vs/workbench/contrib/aiAgent/node/

cp coding-agent-template/vscode-ai-orchestrator-files/browser/*.ts \
   vscode/src/vs/workbench/contrib/aiAgent/browser/

# Verify
ls vscode/src/vs/workbench/contrib/aiAgent/common/
# Should see: aiOrchestratorService.ts

ls vscode/src/vs/workbench/contrib/aiAgent/browser/
# Should see: aiOrchestrator.contribution.ts, aiOrchestratorPanel.ts
```

---

### Step 2.2: Copy Office Files

```bash
cd ~/unified-ecosystem

cp coding-agent-template/vscode-office-fork-files/common/*.ts \
   vscode/src/vs/workbench/contrib/office/common/

cp coding-agent-template/vscode-office-fork-files/node/*.ts \
   vscode/src/vs/workbench/contrib/office/node/

cp coding-agent-template/vscode-office-fork-files/browser/*.ts \
   vscode/src/vs/workbench/contrib/office/browser/

# Verify
ls vscode/src/vs/workbench/contrib/office/browser/
# Should see: office.contribution.ts, officeEditor.ts, etc.
```

---

### Step 2.3: Register Contributions

Edit `vscode/src/vs/workbench/workbench.common.main.ts`:

```typescript
// Add at the end of the imports section (around line 200-250)

// AI Agent Integration
import 'vs/workbench/contrib/aiAgent/browser/aiOrchestrator.contribution';

// Office Integration
import 'vs/workbench/contrib/office/browser/office.contribution';
```

**Save the file.** The `yarn watch` process will detect changes and rebuild.

---

### Step 2.4: Create Unified Orchestrator

Create `vscode/src/vs/workbench/contrib/unifiedAgent/common/unifiedOrchestrator.ts`:

```typescript
import { IInstantiationService } from 'vs/platform/instantiation/common/instantiation';

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
  latency: number;
}

export interface TaskClassification {
  taskType: string;
  complexity: number;  // 1-10
  contextSize: number;
  privacySensitive: boolean;
}

export class UnifiedOrchestrator {
  constructor(
    @IInstantiationService private readonly instantiationService: IInstantiationService
  ) {}

  async handleRequest(request: string, projectId: string): Promise<AgentResponse> {
    // 1. Classify task
    const classification = await this.classifyTask(request);

    // 2. Select agent
    const provider = this.selectProvider(classification);

    // 3. Load context (placeholder for Memory-Agent integration)
    const context = await this.loadContext(projectId, classification.complexity);

    // 4. Execute request
    const response = await this.executeRequest(provider, request, context);

    return response;
  }

  private async classifyTask(request: string): Promise<TaskClassification> {
    // TODO: Implement task classification
    // For now, simple heuristics
    return {
      taskType: 'code-generation',
      complexity: 5,
      contextSize: 2000,
      privacySensitive: false,
    };
  }

  private selectProvider(classification: TaskClassification): string {
    // Simple selection logic (expand later)
    if (classification.privacySensitive) {
      return 'local';
    }

    if (classification.complexity <= 4) {
      return 'local';
    }

    if (classification.complexity <= 7) {
      return 'fireworks';
    }

    return 'claude';
  }

  private async loadContext(projectId: string, complexity: number): Promise<string> {
    // TODO: Integrate with Memory-Agent
    // For now, return minimal context
    return `Project: ${projectId}\nComplexity: ${complexity}`;
  }

  private async executeRequest(
    provider: string,
    request: string,
    context: string
  ): Promise<AgentResponse> {
    // TODO: Implement actual agent calls
    // For now, return mock response
    return {
      content: `Mock response from ${provider} for: ${request}`,
      usage: {
        inputTokens: 100,
        outputTokens: 50,
        cost: 0.001,
      },
      model: provider,
      provider: provider,
      latency: 1000,
    };
  }
}
```

---

### Step 2.5: Implement Provider Clients

Create `vscode/src/vs/workbench/contrib/unifiedAgent/common/providers/`:

```bash
cd ~/unified-ecosystem/vscode/src/vs/workbench/contrib/unifiedAgent/common
mkdir -p providers

# Create base agent
cat > providers/baseAgent.ts << 'EOF'
export abstract class BaseAgent {
  abstract chat(
    messages: AgentMessage[],
    options?: AgentOptions
  ): Promise<AgentResponse>;

  abstract estimateCost(
    inputTokens: number,
    outputTokens: number
  ): number;
}
EOF

# Create Fireworks agent
cat > providers/fireworksAgent.ts << 'EOF'
import OpenAI from 'openai';
import { BaseAgent } from './baseAgent';

export class FireworksAgent extends BaseAgent {
  private client: OpenAI;

  constructor(apiKey: string) {
    super();
    this.client = new OpenAI({
      apiKey: apiKey,
      baseURL: 'https://api.fireworks.ai/inference/v1',
    });
  }

  async chat(messages: AgentMessage[], options?: AgentOptions): Promise<AgentResponse> {
    const response = await this.client.chat.completions.create({
      model: 'accounts/fireworks/models/deepseek-v3',
      messages: messages,
      temperature: options?.temperature || 0.7,
      max_tokens: options?.maxTokens || 4096,
    });

    return {
      content: response.choices[0].message.content || '',
      usage: {
        inputTokens: response.usage?.prompt_tokens || 0,
        outputTokens: response.usage?.completion_tokens || 0,
        cost: this.estimateCost(
          response.usage?.prompt_tokens || 0,
          response.usage?.completion_tokens || 0
        ),
      },
      model: response.model,
      provider: 'fireworks',
      latency: 0,  // Calculate if needed
    };
  }

  estimateCost(inputTokens: number, outputTokens: number): number {
    return (inputTokens / 1_000_000 * 0.28) + (outputTokens / 1_000_000 * 1.14);
  }
}
EOF
```

Repeat for Claude, Gemini, OpenAI agents (see `MULTI_CLOUD_API_FRAMEWORK.md` for complete implementations).

---

### Step 2.6: Install Dependencies

```bash
cd ~/unified-ecosystem/vscode

# Install OpenAI SDK (works with Fireworks.ai too)
yarn add openai

# Install Anthropic SDK
yarn add @anthropic-ai/sdk

# Install Google Generative AI SDK
yarn add @google/generative-ai

# Verify
cat package.json | grep openai
cat package.json | grep anthropic
```

---

### Step 2.7: Test Basic Orchestrator

Rebuild VS Code:

```bash
# yarn watch should auto-rebuild
# Wait for "Finished compilation"

# Run VS Code
./scripts/code.sh
```

Open VS Code, look for:
- 🤖 AI Assistant icon in activity bar
- 📄 Office AI icon in activity bar

Click icons to verify panels open (they'll be empty for now).

**✅ Checkpoint**: Basic UI working, orchestrator skeleton in place

---

## Phase 3: Memory-Agent Integration

### Step 3.1: Set Up PostgreSQL

```bash
cd ~/unified-ecosystem

# Create docker-compose.yml for services
cat > docker-compose.yml << 'EOF'
version: '3.8'

services:
  postgres:
    image: postgres:16-alpine
    container_name: memory-agent-db
    restart: unless-stopped
    environment:
      POSTGRES_USER: memory_agent
      POSTGRES_PASSWORD: your_password_here
      POSTGRES_DB: memory_agent
    volumes:
      - postgres-data:/var/lib/postgresql/data
    ports:
      - "5432:5432"

volumes:
  postgres-data:
EOF

# Start PostgreSQL
docker-compose up -d

# Verify
docker ps  # Should see memory-agent-db running
```

---

### Step 3.2: Initialize Memory-Agent Database

```bash
cd ~/unified-ecosystem/Memory-Agent

# Install dependencies (if not already done)
npm install

# Create .env file
cat > .env << 'EOF'
DATABASE_URL=postgresql://memory_agent:your_password_here@localhost:5432/memory_agent
NODE_ENV=development
EOF

# Run database migrations
npm run db:migrate

# Verify
docker exec -it memory-agent-db psql -U memory_agent -d memory_agent -c "\dt"
# Should see 60+ tables
```

---

### Step 3.3: Start Memory-Agent MCP Server

```bash
cd ~/unified-ecosystem/Memory-Agent

# Build if needed
npm run build

# Start MCP server
node dist/unified-mcp-server.js

# Keep this running in a separate terminal
# Or run in background:
# nohup node dist/unified-mcp-server.js > mcp-server.log 2>&1 &
```

**✅ Checkpoint**: Memory-Agent MCP server running on stdio

---

### Step 3.4: Integrate Memory-Agent with VS Code

Create `vscode/src/vs/workbench/contrib/unifiedAgent/node/memoryAgentClient.ts`:

```typescript
import { spawn, ChildProcess } from 'child_process';

export interface ContextRetrievalOptions {
  projectId: string;
  layers: number[];  // [1, 2, 3]
  componentPath?: string;
}

export class MemoryAgentClient {
  private mcpProcess: ChildProcess | null = null;
  private requestId = 0;

  async connect(mcpServerPath: string): Promise<void> {
    this.mcpProcess = spawn('node', [mcpServerPath], {
      stdio: ['pipe', 'pipe', 'pipe'],
    });

    // Wait for server to be ready
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }

  async retrieveContext(options: ContextRetrievalOptions): Promise<any> {
    if (!this.mcpProcess) {
      throw new Error('MCP server not connected');
    }

    const request = {
      jsonrpc: '2.0',
      id: ++this.requestId,
      method: 'tools/call',
      params: {
        name: 'retrieve_context',
        arguments: {
          project_id: options.projectId,
          layers: options.layers,
          component_path: options.componentPath,
        },
      },
    };

    // Send request
    this.mcpProcess.stdin!.write(JSON.stringify(request) + '\n');

    // Wait for response
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Memory-Agent request timeout'));
      }, 5000);

      this.mcpProcess!.stdout!.once('data', (data) => {
        clearTimeout(timeout);
        const response = JSON.parse(data.toString());
        resolve(response.result);
      });
    });
  }

  async storeContext(context: any): Promise<void> {
    if (!this.mcpProcess) {
      throw new Error('MCP server not connected');
    }

    const request = {
      jsonrpc: '2.0',
      id: ++this.requestId,
      method: 'tools/call',
      params: {
        name: 'store_context',
        arguments: context,
      },
    };

    this.mcpProcess.stdin!.write(JSON.stringify(request) + '\n');

    // Wait for ack
    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  disconnect(): void {
    if (this.mcpProcess) {
      this.mcpProcess.kill();
      this.mcpProcess = null;
    }
  }
}
```

---

### Step 3.5: Update Orchestrator to Use Memory-Agent

Edit `vscode/src/vs/workbench/contrib/unifiedAgent/common/unifiedOrchestrator.ts`:

```typescript
import { MemoryAgentClient } from '../node/memoryAgentClient';

export class UnifiedOrchestrator {
  private memoryAgent: MemoryAgentClient;

  constructor(
    @IInstantiationService private readonly instantiationService: IInstantiationService
  ) {
    this.memoryAgent = new MemoryAgentClient();
  }

  async initialize(mcpServerPath: string): Promise<void> {
    await this.memoryAgent.connect(mcpServerPath);
  }

  private async loadContext(projectId: string, complexity: number): Promise<string> {
    // Determine which layers to load based on complexity
    const layers = complexity <= 3 ? [1] :
                   complexity <= 6 ? [1, 2] :
                   [1, 2, 3];

    const context = await this.memoryAgent.retrieveContext({
      projectId,
      layers,
    });

    // Format context for agent
    return this.formatContext(context);
  }

  private formatContext(context: any): string {
    let formatted = `# Project: ${context.project?.name || 'Unknown'}\n\n`;

    if (context.layer1) {
      formatted += `## File Structure (Layer 1)\n`;
      formatted += `\`\`\`\n${context.layer1.fileTree}\n\`\`\`\n\n`;
    }

    if (context.layer2) {
      formatted += `## Components (Layer 2)\n`;
      formatted += context.layer2.components.map((c: any) =>
        `### ${c.name}\n${c.signature}\n`
      ).join('\n');
      formatted += `\n\n`;
    }

    if (context.layer3) {
      formatted += `## Implementation (Layer 3)\n`;
      formatted += `\`\`\`typescript\n${context.layer3.code}\n\`\`\`\n\n`;
    }

    return formatted;
  }
}
```

**✅ Checkpoint**: Memory-Agent connected and loading context

---

## Phase 4: Project Manager Integration

### Step 4.1: Port React Components to VS Code

This is the most time-consuming part. You need to convert React components to VS Code webviews.

**Strategy**:
1. Start with simple components (project-overview.tsx)
2. Replace React hooks with VS Code webview message passing
3. Convert Tailwind CSS to inline styles or VS Code CSS variables

**Example Conversion**:

React Component (`ai-project-planner/components/dashboard/project-overview.tsx`):
```tsx
export function ProjectOverview({ project }: Props) {
  return (
    <div className="bg-white rounded-lg p-6">
      <h2 className="text-2xl font-bold">{project.name}</h2>
      <p className="text-gray-600">{project.progress}% complete</p>
    </div>
  );
}
```

VS Code Webview (`vscode/src/vs/workbench/contrib/projectManager/browser/projectOverviewPanel.ts`):
```typescript
export class ProjectOverviewPanel extends Disposable implements IView {
  private _view?: vscode.Webview;

  getHtml(project: Project): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          .overview {
            background: var(--vscode-editor-background);
            padding: 16px;
            border-radius: 8px;
          }
          .title {
            font-size: 24px;
            font-weight: bold;
            color: var(--vscode-foreground);
          }
          .progress {
            color: var(--vscode-descriptionForeground);
          }
        </style>
      </head>
      <body>
        <div class="overview">
          <h2 class="title">${project.name}</h2>
          <p class="progress">${project.progress}% complete</p>
        </div>
      </body>
      </html>
    `;
  }

  render(): void {
    if (this._view) {
      this._view.html = this.getHtml(this.project);
    }
  }
}
```

**Repeat for all components** (this takes 3-4 weeks).

---

### Step 4.2: Implement Git Commit Watcher

Create `vscode/src/vs/workbench/contrib/projectManager/node/gitWatcher.ts`:

```typescript
import * as fs from 'fs';
import * as path from 'path';

export class GitWatcher {
  private watcher: fs.FSWatcher | null = null;

  startWatching(workspaceRoot: string, onChange: (files: string[]) => void): void {
    const gitDir = path.join(workspaceRoot, '.git');
    const headFile = path.join(gitDir, 'HEAD');

    this.watcher = fs.watch(headFile, (eventType) => {
      if (eventType === 'change') {
        // New commit detected
        this.getChangedFiles(workspaceRoot).then(onChange);
      }
    });
  }

  private async getChangedFiles(workspaceRoot: string): Promise<string[]> {
    // Use git command to get files in last commit
    const { execSync } = require('child_process');
    const output = execSync('git diff-tree --no-commit-id --name-only -r HEAD', {
      cwd: workspaceRoot,
      encoding: 'utf-8',
    });

    return output.trim().split('\n').filter(Boolean);
  }

  stopWatching(): void {
    if (this.watcher) {
      this.watcher.close();
      this.watcher = null;
    }
  }
}
```

---

### Step 4.3: Implement Auto-Sync

Create `vscode/src/vs/workbench/contrib/projectManager/node/autoSync.ts`:

```typescript
export class AutoSync {
  private gitWatcher: GitWatcher;

  constructor() {
    this.gitWatcher = new GitWatcher();
  }

  start(workspaceRoot: string): void {
    this.gitWatcher.startWatching(workspaceRoot, async (files) => {
      // 1. Analyze changed files
      const analysis = await this.analyzeChanges(files);

      // 2. Map to tasks
      const tasks = await this.mapToTasks(analysis);

      // 3. Update progress
      await this.updateProgress(tasks);

      // 4. Store in Memory-Agent
      await this.storeUpdate(tasks);

      // 5. Notify UI
      this.notifyUI(tasks);
    });
  }

  private async analyzeChanges(files: string[]): Promise<ChangeAnalysis> {
    // TODO: Use local LLM to analyze changes
    return {
      filesChanged: files,
      impact: 'medium',
      features: ['checkout-flow'],
    };
  }

  private async mapToTasks(analysis: ChangeAnalysis): Promise<Task[]> {
    // TODO: Query Memory-Agent for tasks related to changed files
    return [];
  }

  private async updateProgress(tasks: Task[]): Promise<void> {
    // TODO: Calculate new progress percentages
  }

  private async storeUpdate(tasks: Task[]): Promise<void> {
    // TODO: Store in Memory-Agent
  }

  private notifyUI(tasks: Task[]): void {
    // TODO: Send event to Project Manager panel
  }
}
```

**✅ Checkpoint**: Git commits trigger auto-updates

---

## Phase 5: Complete System

### Step 5.1: Implement Document Automation

Create `vscode/src/vs/workbench/contrib/documentAutomation/`:

```typescript
export class DocumentAutomationEngine {
  async generateWeeklyReport(projectId: string): Promise<string> {
    // 1. Gather data
    const data = await this.gatherReportData(projectId);

    // 2. Generate PowerPoint
    const pptPath = await this.generatePowerPoint(data);

    // 3. Notify user
    return pptPath;
  }

  private async gatherReportData(projectId: string): Promise<ReportData> {
    // TODO: Query Memory-Agent, Project Manager, Git
    return {
      projectName: 'E-Commerce Platform',
      progress: 82,
      completedThisWeek: ['Login', 'Dashboard'],
      upcoming: ['Payment Integration'],
      commits: 47,
    };
  }

  private async generatePowerPoint(data: ReportData): Promise<string> {
    // TODO: Use MCP Office tools to create PowerPoint
    const officeService = this.getOfficeService();

    await officeService.executeMCPTool('ppt_com_create', {});
    await officeService.executeMCPTool('ppt_com_add_slide', {
      title: 'Weekly Status Report',
      content: `Progress: ${data.progress}%`,
    });
    // ... add more slides

    const path = `reports/weekly-${new Date().toISOString().split('T')[0]}.pptx`;
    await officeService.executeMCPTool('ppt_com_save', { path });

    return path;
  }
}
```

---

### Step 5.2: Implement Scheduled Tasks

Create `vscode/src/vs/workbench/contrib/automation/scheduler.ts`:

```typescript
export class AutomationScheduler {
  private intervals: Map<string, NodeJS.Timeout> = new Map();

  scheduleWeeklyReport(projectId: string): void {
    // Friday at 5 PM
    const schedule = this.getNextFriday5PM();

    const interval = setInterval(async () => {
      const engine = new DocumentAutomationEngine();
      const reportPath = await engine.generateWeeklyReport(projectId);

      // Notify user
      vscode.window.showInformationMessage(
        `Weekly report generated: ${reportPath}`,
        'Open Report'
      ).then((action) => {
        if (action === 'Open Report') {
          vscode.commands.executeCommand('office.openPowerPoint', reportPath);
        }
      });
    }, 7 * 24 * 60 * 60 * 1000);  // Every week

    this.intervals.set('weekly-report', interval);
  }

  private getNextFriday5PM(): Date {
    const now = new Date();
    const daysUntilFriday = (5 - now.getDay() + 7) % 7 || 7;
    const nextFriday = new Date(now);
    nextFriday.setDate(now.getDate() + daysUntilFriday);
    nextFriday.setHours(17, 0, 0, 0);
    return nextFriday;
  }
}
```

---

### Step 5.3: Add Settings UI

Create settings panel for API keys and configuration:

```typescript
export class SettingsPanel {
  getHtml(): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          .settings {
            padding: 20px;
          }
          .setting-group {
            margin-bottom: 20px;
          }
          label {
            display: block;
            margin-bottom: 5px;
            font-weight: bold;
          }
          input {
            width: 100%;
            padding: 8px;
            border: 1px solid var(--vscode-input-border);
            background: var(--vscode-input-background);
            color: var(--vscode-input-foreground);
          }
        </style>
      </head>
      <body>
        <div class="settings">
          <h1>Unified Ecosystem Settings</h1>

          <div class="setting-group">
            <label>Fireworks.ai API Key</label>
            <input type="password" id="fireworks-key" placeholder="Enter API key">
          </div>

          <div class="setting-group">
            <label>Anthropic Claude API Key</label>
            <input type="password" id="claude-key" placeholder="Enter API key">
          </div>

          <div class="setting-group">
            <label>Daily Budget ($)</label>
            <input type="number" id="daily-budget" value="5.00" step="0.50">
          </div>

          <button onclick="saveSettings()">Save Settings</button>
        </div>

        <script>
          const vscode = acquireVsCodeApi();

          function saveSettings() {
            const settings = {
              fireworksKey: document.getElementById('fireworks-key').value,
              claudeKey: document.getElementById('claude-key').value,
              dailyBudget: parseFloat(document.getElementById('daily-budget').value),
            };

            vscode.postMessage({ command: 'saveSettings', settings });
          }
        </script>
      </body>
      </html>
    `;
  }
}
```

---

## Testing Strategy

### Unit Tests

```bash
cd ~/unified-ecosystem/vscode

# Run tests
yarn test

# Run specific test
yarn test --grep "UnifiedOrchestrator"
```

---

### Integration Tests

Create `vscode/src/vs/workbench/contrib/unifiedAgent/test/integration.test.ts`:

```typescript
suite('Unified Orchestrator Integration', () => {
  test('should select correct agent for simple task', async () => {
    const orchestrator = new UnifiedOrchestrator();
    const response = await orchestrator.handleRequest('Format this code', 'project-1');

    assert.strictEqual(response.provider, 'local');
  });

  test('should use Claude for complex architecture', async () => {
    const orchestrator = new UnifiedOrchestrator();
    const response = await orchestrator.handleRequest(
      'Design a microservices architecture',
      'project-1'
    );

    assert.strictEqual(response.provider, 'claude');
  });
});
```

---

### E2E Tests

```bash
# Use existing Playwright setup
cd ~/unified-ecosystem/coding-agent-template

# Run E2E tests
pnpm exec playwright test
```

---

## Troubleshooting

### Issue: VS Code won't build

**Solution**:
```bash
# Clean and rebuild
yarn gulp clean
rm -rf node_modules
yarn
yarn watch
```

---

### Issue: Memory-Agent connection fails

**Solution**:
```bash
# Check PostgreSQL is running
docker ps | grep memory-agent-db

# Check MCP server is running
ps aux | grep unified-mcp-server

# Test connection manually
docker exec -it memory-agent-db psql -U memory_agent -c "SELECT 1"
```

---

### Issue: API rate limits hit

**Solution**:
```typescript
// Increase retry delays
const rateLimiter = new RateLimiter();
await rateLimiter.waitForSlot('fireworks');  // Waits if limit hit
```

---

### Issue: Office embedding not working

**Solution**:
```bash
# Run VS Code as Administrator (Windows)
# Check MCP server path is correct
# Verify Office is installed
```

---

## Summary

### Phase Checklist

- [ ] **Phase 1**: VS Code fork built and running
- [ ] **Phase 2**: Basic orchestrator with cloud providers
- [ ] **Phase 3**: Memory-Agent integrated
- [ ] **Phase 4**: Project Manager integrated
- [ ] **Phase 5**: Document automation complete

### Total Time Estimate

- **Phase 1**: 1 week
- **Phase 2**: 2-3 weeks
- **Phase 3**: 2-3 weeks
- **Phase 4**: 3-4 weeks
- **Phase 5**: 2-3 weeks

**Total**: 10-14 weeks (2.5-3.5 months)

### Next Steps

1. Clone VS Code
2. Set up development environment
3. Get API keys
4. Start Phase 1

**The architecture is complete. Now build it step by step!** 🚀
