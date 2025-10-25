# AI Orchestrator Refactoring Plan

## Current Problems

### 1. **Next.js Backend Dependency** ❌
- Service calls `http://localhost:3000`
- Requires separate server running
- Adds unnecessary complexity
- Not integrated with VS Code ecosystem

### 2. **Generic Task List** ⚠️ (Keep but Refactor)
- ✅ Keep: Task delegation system
- ❌ Remove: Manual task creation
- ✅ Add: Orchestrator auto-creates tasks
- ✅ Add: Project-aware task tracking
- ✅ Add: Memory Agent integration

### 3. **No Chat Integration** ❌
- Panel only has buttons
- No conversational interface
- Not using VS Code's built-in chat system

---

## New Architecture ✅

### **Leverage VS Code's Existing Infrastructure**

VS Code already has everything we need:

1. **ILanguageModelsService** - Abstract LLM provider
   - Pluggable model providers
   - Token counting
   - Streaming responses
   - Multi-model selection

2. **Chat System** - Full chat UI
   - Message history
   - Markdown rendering
   - Code blocks
   - Streaming
   - Undo/revert system (**critical for your needs!**)

3. **Extension System** - For AI providers
   - OpenAI extension
   - Anthropic extension
   - Google AI extension
   - Custom providers

---

## Refactoring Strategy

### Phase 1: Remove Next.js Backend (NOW)

**Files to Modify:**
1. `src/vs/workbench/contrib/aiOrchestrator/node/aiOrchestratorServiceImpl.ts`
   - ❌ Remove: `fetch()` calls to localhost:3000
   - ✅ Add: Direct `ILanguageModelsService` integration
   - ✅ Add: Model selection logic (v0, Claude, Gemini, GPT)

2. `src/vs/workbench/contrib/aiOrchestrator/common/aiOrchestratorService.ts`
   - ❌ Remove: Task-based API (runV0Agent, runClaudeAgent, etc.)
   - ✅ Add: Chat-based API (sendMessage, streamResponse, etc.)
   - ❌ Remove: TaskStatus interface (from old project)
   - ✅ Add: Project-aware context interface

3. `src/vs/workbench/contrib/aiOrchestrator/browser/aiOrchestratorPanel.ts`
   - ❌ Remove: Agent buttons + task list UI
   - ✅ Add: Chat participant registration
   - ✅ Add: Integration with VS Code chat widget

---

### Phase 2: Chat System Integration

**Create Chat Providers:**

```typescript
// src/vs/workbench/contrib/aiOrchestrator/browser/aiChatProviders.ts

export class V0ChatProvider implements IChatProvider {
  async sendMessage(
    message: string,
    context: IProjectContext
  ): AsyncIterable<IChatResponsePart> {
    const model = await this.languageModelsService.selectLanguageModels({
      vendor: 'vercel',
      family: 'v0'
    });

    // Stream response from v0
    return model.sendChatRequest(messages, ...);
  }
}

export class ClaudeChatProvider implements IChatProvider {
  // Similar but for Claude
}

// etc for Gemini, GPT
```

**Register Chat Participants:**

```typescript
// Each AI agent becomes a chat participant
chatParticipantRegistry.register({
  id: 'vscode.v0',
  name: 'v0',
  description: 'UI generation agent',
  handler: new V0ChatProvider(...)
});
```

---

### Phase 3: Orchestrator Agent + Task Delegation

**Orchestrator Meta-Agent Pattern:**

```typescript
// src/vs/workbench/contrib/aiOrchestrator/common/orchestratorAgent.ts

export interface IOrchestratorAgent {
  // Analyze user request and create task plan
  planTasks(request: string, context: IMemoryContext): Promise<ITaskPlan>;

  // Delegate tasks to specialist agents
  delegateTask(task: ITask): Promise<ITaskResult>;

  // Monitor and report progress
  trackProgress(taskId: string): AsyncIterable<ITaskProgress>;
}

export interface ITaskPlan {
  analysis: string;
  tasks: ITask[];
  estimatedDuration: number;
}

export interface ITask {
  id: string;
  agent: 'v0' | 'claude' | 'gemini' | 'gpt';
  description: string;
  priority: number;
  dependencies: string[]; // Task IDs this depends on
  context: IMemoryContext;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
}
```

**Task Delegation Flow:**

```typescript
// User talks to Orchestrator
const chat = await chatService.startChat('vscode.orchestrator');

// Orchestrator analyzes request
const plan = await orchestrator.planTasks(
  "Build login page with auth",
  memoryContext
);

// Plan looks like:
{
  analysis: "Need UI component + backend auth logic",
  tasks: [
    {
      id: "task-1",
      agent: "v0",
      description: "Create login UI component",
      priority: 1,
      dependencies: []
    },
    {
      id: "task-2",
      agent: "claude",
      description: "Implement authentication logic",
      priority: 2,
      dependencies: ["task-1"]
    },
    {
      id: "task-3",
      agent: "claude",
      description: "Add JWT token validation",
      priority: 3,
      dependencies: ["task-2"]
    }
  ]
}

// Orchestrator executes tasks in order
for (const task of plan.tasks) {
  await orchestrator.delegateTask(task);
}
```

### Phase 4: Project Manager Integration

**Enhance Tasks with Project-Aware System:**

```typescript
// src/vs/workbench/contrib/projectManager/common/projectManagerService.ts

export interface IProjectGoal {
  id: string;
  title: string;
  description: string;
  status: 'active' | 'completed' | 'blocked';

  // Decomposed sub-goals
  subGoals: IProjectGoal[];

  // Linked to actual code changes
  relatedFiles: URI[];
  relatedCommits: string[];

  // Memory Agent context
  context: IMemoryContext;

  // Undo checkpoints
  checkpoints: ICheckpoint[];
}

export interface ICheckpoint {
  id: string;
  name: string;
  timestamp: Date;
  filesChanged: Map<URI, IFileSnapshot>;
  canRevert: boolean;
}
```

**Key Features:**
1. **Goal Decomposition**: Break down high-level goals into tasks
2. **Code Tracking**: Link goals to actual file changes
3. **Memory Integration**: Use Memory Agent for context
4. **Checkpoint System**: Named save points for easy reversion
5. **Progress Tracking**: Visual progress based on code completion

---

### Phase 4: Memory Agent Integration

**Connect to PostgreSQL Memory:**

```typescript
// src/vs/workbench/contrib/memoryAgent/common/memoryAgentService.ts

export interface IMemoryContext {
  // 5W+H Framework
  where: IProjectStructure;      // WHERE: Project location, files
  what: IModuleRelationship[];   // WHAT: Components, modules
  how: IImplementationDetail[];  // HOW: Code patterns
  why: IDecisionEpisode[];       // WHY: Design decisions
  who: IResponsibility[];        // WHO: Ownership
  when: ITimeline[];             // WHEN: History
}

export interface IMemoryAgentService {
  // Retrieve context for current workspace
  getProjectContext(workspaceUri: URI): Promise<IMemoryContext>;

  // Update context as code changes
  updateContext(changes: IFileChange[]): Promise<void>;

  // Query for relevant context
  findRelevantContext(query: string): Promise<IMemoryContext>;
}
```

**Usage in Chat:**

```typescript
// When user sends message to AI agent
const context = await memoryAgent.getProjectContext(workspace);

const messages = [
  { role: 'system', content: buildSystemPrompt(context) },
  { role: 'user', content: userMessage }
];

const response = await model.sendChatRequest(messages);
```

---

## Implementation Steps

### Step 1: Refactor Service Layer (Day 1)

```bash
# 1. Update service interface
# Remove: Task-based API
# Add: Chat-based API with Memory Agent context

# 2. Implement direct LLM calls
# Use ILanguageModelsService instead of HTTP fetch

# 3. Add model mapping
v0 → { vendor: 'vercel', family: 'v0' }
Claude → { vendor: 'anthropic', family: 'claude' }
Gemini → { vendor: 'google', family: 'gemini' }
GPT → { vendor: 'openai', family: 'gpt' }
```

### Step 2: Chat UI Integration (Day 2)

```bash
# 1. Remove old panel UI (buttons + task list)
# 2. Register chat participants for each agent
# 3. Connect to VS Code chat widget
# 4. Test basic chat interaction
```

### Step 3: Orchestrator Agent (Day 3)

```bash
# 1. Create Orchestrator Agent
# 2. Implement task planning (analyze user request)
# 3. Add task delegation logic
# 4. Register as main chat participant
# 5. Test: User → Orchestrator → v0/Claude/Gemini/GPT
```

### Step 4: Memory Agent Connection (Day 4)

```bash
# 1. Create Memory Agent service
# 2. Connect to PostgreSQL database
# 3. Implement context retrieval
# 4. Inject context into Orchestrator planning
```

### Step 5: Project Manager (Day 5-6)

```bash
# 1. Enhance tasks with project tracking
# 2. Link tasks to file changes
# 3. Add checkpoint system
# 4. Build progress tracking UI
# 5. Rich project planning features (later)
```

### Step 5: Enhanced Reversion (Day 6)

```bash
# 1. Named checkpoints
# 2. Multi-file selective undo
# 3. Undo history tree
# 4. Git integration (commit from checkpoint)
```

---

## File Structure (After Refactor)

```
src/vs/workbench/contrib/
├── aiOrchestrator/
│   ├── common/
│   │   ├── aiOrchestratorService.ts      # Refactored: Chat-based API
│   │   └── types.ts                       # New: Shared types
│   ├── node/
│   │   └── aiOrchestratorServiceImpl.ts  # Refactored: LLM service integration
│   ├── browser/
│   │   ├── aiChatProviders.ts            # New: Chat providers for each agent
│   │   ├── aiChatParticipants.ts         # New: Register participants
│   │   └── aiOrchestrator.contribution.ts # Updated: Register chat stuff
│   └── README.md                          # Updated
│
├── memoryAgent/
│   ├── common/
│   │   ├── memoryAgentService.ts         # New: Memory Agent service
│   │   ├── memoryContext.ts               # New: Context types
│   │   └── memoryDb.ts                    # New: PostgreSQL connection
│   └── browser/
│       └── memoryAgent.contribution.ts    # New: Register service
│
└── projectManager/
    ├── common/
    │   ├── projectManagerService.ts       # New: Project management
    │   ├── projectGoals.ts                # New: Goal tracking
    │   └── checkpointService.ts           # New: Checkpoint system
    └── browser/
        ├── projectManagerPanel.ts         # New: UI for goals/progress
        ├── undoHistoryView.ts             # New: Visual undo tree
        └── projectManager.contribution.ts # New: Register everything
```

---

## API Design Examples

### Old Way (Remove):
```typescript
// ❌ Task-based, requires Next.js backend
const taskId = await orchestrator.runV0Agent(prompt, workspace);
const status = await orchestrator.getTaskStatus(taskId);
```

### New Way (Implement):
```typescript
// ✅ Chat-based, integrated with VS Code
const chat = await chatService.startChat('vscode.v0');
const response = chat.sendMessage(prompt, {
  workspace,
  memoryContext: await memoryAgent.getContext()
});

for await (const part of response.stream) {
  // Render streaming response
}
```

### Project Manager:
```typescript
// Create goal from chat
const goal = await projectManager.createGoal({
  title: 'Build user authentication',
  fromChat: chatSessionId,
  context: memoryContext
});

// AI helps decompose
const subGoals = await v0Agent.decomposeGoal(goal);

// Track progress
for (const subGoal of subGoals) {
  subGoal.onProgress(event => {
    // Update UI, check code changes
  });
}

// Create checkpoint
const checkpoint = await projectManager.createCheckpoint({
  name: 'Auth MVP complete',
  goal: goal.id
});

// Revert if needed
await projectManager.revertToCheckpoint(checkpoint.id);
```

---

## Migration Checklist

- [ ] **Phase 1: Remove Next.js Backend**
  - [ ] Remove fetch() calls
  - [ ] Integrate ILanguageModelsService
  - [ ] Add model selection
  - [ ] Test with dummy chat

- [ ] **Phase 2: Chat Integration**
  - [ ] Remove old panel UI
  - [ ] Create chat providers
  - [ ] Register chat participants
  - [ ] Test basic chat flow

- [ ] **Phase 3: Memory Agent**
  - [ ] Create Memory Agent service
  - [ ] Connect PostgreSQL
  - [ ] Implement context retrieval
  - [ ] Test context injection

- [ ] **Phase 4: Project Manager**
  - [ ] Create service
  - [ ] Implement goals
  - [ ] Add checkpoints
  - [ ] Build UI

- [ ] **Phase 5: Enhanced Reversion**
  - [ ] Named checkpoints
  - [ ] Selective undo
  - [ ] History tree
  - [ ] Git integration

---

## Benefits of New Architecture

### ✅ **No External Dependencies**
- No Next.js backend needed
- Self-contained in VS Code
- Easier to distribute

### ✅ **Native Integration**
- Uses VS Code's chat system
- Leverages existing LLM infrastructure
- Familiar UI for users

### ✅ **Project-Aware**
- Understands your codebase (Memory Agent)
- Tracks real code changes
- Links goals to files

### ✅ **Powerful Reversion**
- Named checkpoints
- Undo tree visualization
- Git integration
- Multi-file selective undo

### ✅ **Scalable**
- Easy to add new AI models
- Extensible goal system
- Pluggable memory providers

---

## Updated Architecture Summary

### **How It Works:**

```
User: "Build me a login page with authentication"
  ↓
Orchestrator Agent (Meta-agent)
  ├─ Analyzes request + Memory context
  ├─ Creates task plan
  └─ Delegates to specialists
       ↓
  ┌────┴─────┬─────────┬─────────┐
  ↓          ↓         ↓         ↓
v0 Agent  Claude   Gemini     GPT
(UI gen)  (Code)   (Multi)   (General)
  ↓          ↓         ↓         ↓
Task 1   Task 2    Task 3   Task 4
  ↓          ↓         ↓         ↓
Progress tracking + Checkpoints
  ↓
Memory Agent updates context
  ↓
User sees results in chat
```

### **Key Components:**

1. **Orchestrator Agent** (Main entry point)
   - User talks to this
   - Plans tasks intelligently
   - Delegates to specialists

2. **Specialist Agents** (v0, Claude, Gemini, GPT)
   - Execute specific tasks
   - Report back to Orchestrator
   - Update Memory context

3. **Task System** (Orchestrator-managed)
   - Auto-created from user requests
   - Project-aware
   - Dependency tracking
   - Progress monitoring

4. **Memory Agent** (Context provider)
   - Informs Orchestrator's planning
   - Updated as tasks complete
   - Tracks project evolution

5. **Project Manager** (Enhanced later)
   - Rich planning features
   - Milestone tracking
   - Team collaboration
   - Advanced checkpoints

---

## Next Steps

1. ✅ **Plan approved** (updated with Orchestrator model)
2. Start Phase 1: Remove Next.js backend
3. Start Phase 2: Chat integration
4. Start Phase 3: Build Orchestrator Agent
5. Iterate and enhance

Ready to start Phase 1 refactoring?
