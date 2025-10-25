# Project Manager Integration Plan
## Integrating AI Project Planner with VS Code Fork

**Document Version**: 1.0
**Date**: 2025-01-25
**Status**: Planning Phase

---

## Executive Summary

This document outlines the strategy for integrating the standalone Next.js AI Project Planner application into the VS Code fork as native UI panels. The integration will transform React components into VS Code webview panels while maintaining the core project management, contextual AI assistance, and progress tracking functionality.

---

## 1. Current State Analysis

### AI Project Planner (Standalone Next.js App)

**Architecture**:
- **Frontend**: Next.js 15 with App Router
- **UI Framework**: React 18 + TypeScript
- **Component Library**: Radix UI + Tailwind CSS + shadcn/ui
- **State Management**: React hooks (useState, useEffect)
- **Layout**: Dashboard with sidebar navigation

**Key Features**:
1. **Project Overview**
   - Project metadata (name, description, status)
   - Progress tracking (65% complete, 31/47 tasks)
   - Team information
   - GitHub integration
   - Tech stack visualization

2. **AI Assistant** (Contextual)
   - Selection-aware: Detects text selection
   - View-aware: Knows current tab/view
   - Highlight mode: Interactive element selection
   - Chat history with context preservation
   - Quick action badges

3. **Dashboard Components**
   - Header with search and actions
   - Collapsible sidebar
   - Project execution view
   - Tech stack documentation
   - Progress tracker

**Current Tech Stack**:
```json
{
  "framework": "Next.js 14.2.16",
  "react": "^18",
  "ui": "@radix-ui/* components",
  "styling": "Tailwind CSS 4.1.9",
  "charts": "recharts 2.15.4",
  "flow": "@xyflow/react",
  "forms": "react-hook-form + zod"
}
```

### VS Code Fork (Target Environment)

**Architecture**:
- **Platform**: VS Code desktop application (Electron)
- **UI System**: Webview panels + native VS Code components
- **State**: Extension API + workspace state
- **Language**: TypeScript
- **Styling**: VS Code CSS variables + custom CSS

**Existing Features**:
- AI Orchestrator panel with agent buttons
- Office Integration panel
- Chat system (built-in)
- File explorer integration
- Git integration (built-in)

**Integration Points**:
- `ViewPane` - Base class for panels
- `IInstantiationService` - Dependency injection
- `ICommandService` - Command execution
- `IAIOrchestratorService` - AI orchestration
- `IWorkspaceContextService` - Workspace access
- Webview API - HTML/React content

---

## 2. Integration Strategy

### Phase 1: Component Migration (Week 1-2)

**Goal**: Convert Next.js React components to VS Code webview panels

#### 1.1 Create Webview Infrastructure

**New Files**:
```
src/vs/workbench/contrib/projectManager/
├── browser/
│   ├── projectManagerPanel.ts          # Main panel container
│   ├── projectManagerWebview.ts        # Webview controller
│   └── projectManager.contribution.ts  # Registration
├── common/
│   ├── projectManagerService.ts        # Interface
│   └── projectTypes.ts                 # Type definitions
└── node/
    └── projectManagerServiceImpl.ts    # Implementation
```

#### 1.2 Convert React Components to Webview HTML

**Strategy**: Bundle React components for webview consumption

**Approach**:
1. **Bundle with esbuild**: Create separate webview bundle
2. **React → Webview**: Keep React, render in webview iframe
3. **Message passing**: VS Code Extension API ↔ Webview

**Key Files to Migrate**:
```typescript
// Original Next.js components → VS Code webviews
components/dashboard/project-overview.tsx     → projectOverviewWebview.ts
components/dashboard/ai-assistant.tsx         → aiAssistantWebview.ts
components/dashboard/progress-tracker.tsx     → progressTrackerWebview.ts
components/dashboard/tech-stack-documentation.tsx → techStackWebview.ts
components/dashboard/project-execution-view.tsx   → projectExecutionWebview.ts
```

#### 1.3 Webview HTML Structure

```html
<!DOCTYPE html>
<html>
<head>
    <meta http-equiv="Content-Security-Policy"
          content="default-src 'none'; style-src ${cspSource} 'unsafe-inline';
                   script-src ${cspSource}; img-src ${cspSource} https:;">
    <link rel="stylesheet" href="${styleUri}">
</head>
<body>
    <div id="root"></div>
    <script src="${scriptUri}"></script>
    <script>
        const vscode = acquireVsCodeApi();
        // Message passing bridge
        window.addEventListener('message', event => {
            const message = event.data;
            // Handle messages from extension
        });
    </script>
</body>
</html>
```

---

### Phase 2: Data Integration (Week 3-4)

**Goal**: Connect project manager to VS Code workspace and AI Orchestrator

#### 2.1 Workspace Integration

**IProjectManagerService Interface**:
```typescript
export interface IProjectManagerService {
    // Project data
    getCurrentProject(): Promise<IProject | undefined>;
    updateProject(project: IProject): Promise<void>;

    // Task management
    getTasks(): Promise<ITask[]>;
    createTask(task: Omit<ITask, 'id'>): Promise<ITask>;
    updateTask(taskId: string, updates: Partial<ITask>): Promise<void>;
    deleteTask(taskId: string): Promise<void>;

    // Git integration
    getGitStatus(): Promise<IGitStatus>;
    getBranchInfo(): Promise<IBranchInfo>;
    getRecentCommits(): Promise<ICommit[]>;

    // Progress tracking
    calculateProgress(): Promise<IProgressMetrics>;

    // Events
    onDidChangeProject: Event<IProject>;
    onDidChangeTask: Event<ITask>;
}
```

#### 2.2 AI Orchestrator Integration

**Connect to IAIOrchestratorService**:
```typescript
export class ProjectManagerService implements IProjectManagerService {
    constructor(
        @IAIOrchestratorService private readonly aiOrchestrator: IAIOrchestratorService,
        @IWorkspaceContextService private readonly workspaceContext: IWorkspaceContextService,
        @IGitService private readonly gitService: IGitService
    ) {}

    async createTaskFromAI(prompt: string): Promise<ITask> {
        // Use AI Orchestrator to plan task
        const context = await this.getProjectContext();
        const plan = await this.aiOrchestrator.planTasks(prompt, context, CancellationToken.None);

        // Convert first task in plan to project manager task
        const task = plan.tasks[0];
        return this.createTask({
            title: task.description,
            agent: task.agent,
            instructions: task.instructions,
            priority: task.priority,
            status: 'pending'
        });
    }
}
```

#### 2.3 File Watcher Integration

**Auto-detect project changes**:
```typescript
export class ProjectFileWatcher extends Disposable {
    private readonly _onDidChangeProject = this._register(new Emitter<void>());
    readonly onDidChangeProject = this._onDidChangeProject.event;

    constructor(
        @IFileService private readonly fileService: IFileService
    ) {
        super();
        this.watchProjectFiles();
    }

    private watchProjectFiles(): void {
        // Watch package.json, tsconfig.json, git commits, etc.
        const watcher = this.fileService.watch(
            URI.file(workspace.rootPath + '/package.json')
        );

        this._register(watcher);
        this._register(watcher.onDidChange(() => {
            this._onDidChangeProject.fire();
        }));
    }
}
```

---

### Phase 3: Contextual AI Integration (Week 5-6)

**Goal**: Implement VS Code-native contextual awareness

#### 3.1 Selection Context Provider

**Replicate AI Assistant selection awareness in VS Code**:
```typescript
export class ContextualAIProvider extends Disposable {

    constructor(
        @IEditorService private readonly editorService: IEditorService,
        @ITextModelService private readonly textModelService: ITextModelService
    ) {
        super();
        this.trackActiveEditor();
    }

    async getContext(): Promise<IContextualInfo> {
        const editor = this.editorService.activeTextEditorControl;

        if (!editor) {
            return { currentView: 'Explorer' };
        }

        const model = editor.getModel();
        const selection = editor.getSelection();

        return {
            currentView: 'Editor',
            activeFile: model?.uri.toString(),
            selectedText: selection ? model?.getValueInRange(selection) : undefined,
            cursorPosition: editor.getPosition(),
            language: model?.getLanguageId()
        };
    }
}
```

#### 3.2 Chat Integration

**Connect Project Manager AI to VS Code Chat**:
```typescript
export class ProjectManagerChatParticipant implements IChatParticipant {

    async handleChatRequest(
        request: IChatRequest,
        context: IChatContext,
        progress: IChatProgress,
        token: CancellationToken
    ): Promise<IChatResponse> {

        // Get contextual info
        const projectContext = await this.contextProvider.getContext();

        // Build enhanced prompt with project context
        const enhancedPrompt = `
Project: ${this.project?.name}
Current Phase: ${this.project?.currentPhase}
Selected: ${projectContext.selectedText || 'none'}
Active File: ${projectContext.activeFile || 'none'}

User Request: ${request.message}
`;

        // Delegate to AI Orchestrator
        const plan = await this.aiOrchestrator.planTasks(
            enhancedPrompt,
            projectContext,
            token
        );

        // Stream response to chat
        for (const task of plan.tasks) {
            progress.report({ content: `Task: ${task.description}\n` });
        }

        return { metadata: { plan } };
    }
}
```

---

### Phase 4: Git Integration (Week 7-8)

**Goal**: Real-time git monitoring and Film Roll timeline

#### 4.1 Git Commit Watcher

```typescript
export class GitCommitWatcher extends Disposable {

    private lastCommitSha: string | undefined;

    constructor(
        @IGitService private readonly gitService: IGitService,
        @IProjectManagerService private readonly projectManager: IProjectManagerService
    ) {
        super();
        this.startWatching();
    }

    private startWatching(): void {
        // Poll git log every 5 seconds
        setInterval(async () => {
            const commits = await this.gitService.getLog({ limit: 1 });
            const latest = commits[0];

            if (latest && latest.sha !== this.lastCommitSha) {
                this.lastCommitSha = latest.sha;
                await this.onNewCommit(latest);
            }
        }, 5000);
    }

    private async onNewCommit(commit: ICommit): Promise<void> {
        // Update project progress
        await this.projectManager.addCommit({
            sha: commit.sha,
            message: commit.message,
            author: commit.author,
            timestamp: commit.timestamp,
            filesChanged: await this.getChangedFiles(commit)
        });

        // Fire event for Film Roll update
        this._onDidCommit.fire(commit);
    }
}
```

#### 4.2 Film Roll Timeline View

**Visual commit timeline integrated with project phases**:
```typescript
export class FilmRollTimelineWebview extends Disposable {

    private webview: vscode.Webview;

    renderTimeline(commits: ICommit[], milestones: IMilestone[]): void {
        // Render React Flow diagram
        const html = `
            <div id="timeline-root"></div>
            <script>
                const commits = ${JSON.stringify(commits)};
                const milestones = ${JSON.stringify(milestones)};

                // Render @xyflow/react timeline
                ReactFlow.render(
                    <Timeline commits={commits} milestones={milestones} />,
                    document.getElementById('timeline-root')
                );
            </script>
        `;

        this.webview.html = html;
    }
}
```

---

### Phase 5: Progress Tracking & Analytics (Week 9-10)

**Goal**: Real-time metrics and visualization

#### 5.1 Progress Calculator

```typescript
export class ProgressCalculator {

    async calculateProjectMetrics(project: IProject): Promise<IProgressMetrics> {
        const tasks = await this.projectManager.getTasks();
        const commits = await this.gitService.getLog({ limit: 100 });

        return {
            // Task-based progress
            taskProgress: {
                total: tasks.length,
                completed: tasks.filter(t => t.status === 'completed').length,
                inProgress: tasks.filter(t => t.status === 'in_progress').length,
                blocked: tasks.filter(t => t.status === 'blocked').length
            },

            // Commit-based progress
            commitVelocity: {
                daily: this.calculateDailyCommits(commits),
                weekly: this.calculateWeeklyCommits(commits),
                trend: this.calculateTrend(commits)
            },

            // File-based progress
            fileMetrics: {
                filesCreated: await this.countFilesCreated(),
                filesModified: await this.countFilesModified(),
                linesOfCode: await this.countLinesOfCode()
            },

            // AI agent usage
            agentMetrics: {
                tasksPerAgent: this.groupTasksByAgent(tasks),
                successRate: this.calculateSuccessRate(tasks),
                averageCompletionTime: this.calculateAvgTime(tasks)
            }
        };
    }
}
```

#### 5.2 Recharts Integration

**Embed charts in webview**:
```typescript
export class ProgressChartsWebview extends Disposable {

    renderCharts(metrics: IProgressMetrics): void {
        const html = `
            <div id="charts-root"></div>
            <script src="https://cdn.jsdelivr.net/npm/recharts@2.15.4/dist/Recharts.js"></script>
            <script>
                const { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } = Recharts;

                // Commit velocity chart
                const velocityData = ${JSON.stringify(metrics.commitVelocity.daily)};

                ReactDOM.render(
                    <LineChart width={600} height={300} data={velocityData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Line type="monotone" dataKey="commits" stroke="#8884d8" />
                    </LineChart>,
                    document.getElementById('charts-root')
                );
            </script>
        `;

        this.webview.html = html;
    }
}
```

---

## 3. Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                       VS Code UI Layer                          │
├─────────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐         │
│  │   Project    │  │ AI Assistant │  │  Film Roll   │         │
│  │  Overview    │  │   Webview    │  │   Timeline   │         │
│  │   Webview    │  └──────────────┘  └──────────────┘         │
│  └──────────────┘         │                   │                │
│         │                 │                   │                │
├─────────────────────────────────────────────────────────────────┤
│                   Message Passing Bridge                        │
├─────────────────────────────────────────────────────────────────┤
│  ┌──────────────────────────────────────────────────────┐      │
│  │        IProjectManagerService (Extension Host)       │      │
│  └──────────────────────────────────────────────────────┘      │
│         │                 │                   │                │
│  ┌──────▼──────┐  ┌──────▼──────┐    ┌──────▼──────┐         │
│  │   AI        │  │    Git      │    │  Workspace  │         │
│  │ Orchestrator│  │  Watcher    │    │   Context   │         │
│  │  Service    │  │   Service   │    │   Service   │         │
│  └─────────────┘  └─────────────┘    └─────────────┘         │
├─────────────────────────────────────────────────────────────────┤
│                    VS Code Core APIs                            │
│  • IFileService  • IGitService  • IEditorService               │
│  • ILanguageModelsService  • IChatService                      │
└─────────────────────────────────────────────────────────────────┘
```

---

## 4. UI Component Mapping

### Standalone → VS Code Integration

| Next.js Component | VS Code Equivalent | Integration Method |
|-------------------|-------------------|-------------------|
| DashboardHeader | Custom ViewPane header | Native VS Code component |
| DashboardSidebar | Activity Bar + Side Bar | Register view container |
| ProjectOverview | Webview Panel | React bundle in webview |
| AIAssistant | Chat Participant + Webview | IChatParticipant + webview |
| ProgressTracker | Webview Panel | Recharts in webview |
| ProjectExecutionView | Webview Panel | React Flow in webview |
| TechStackDocumentation | Tree View + Webview | Native tree + webview details |

---

## 5. Data Flow

### Project State Management

```typescript
// Central state store
export class ProjectState {
    private _project: IProject | undefined;
    private _tasks: Map<string, ITask> = new Map();
    private _commits: ICommit[] = [];

    private readonly _onDidChange = new Emitter<void>();
    readonly onDidChange = this._onDidChange.event;

    // Persistence
    async save(): Promise<void> {
        const state = {
            project: this._project,
            tasks: Array.from(this._tasks.values()),
            commits: this._commits
        };

        await this.fileService.writeFile(
            URI.file(workspace.rootPath + '/.vscode/project-state.json'),
            VSBuffer.fromString(JSON.stringify(state, null, 2))
        );
    }

    async load(): Promise<void> {
        const file = await this.fileService.readFile(
            URI.file(workspace.rootPath + '/.vscode/project-state.json')
        );

        const state = JSON.parse(file.value.toString());
        this._project = state.project;
        this._tasks = new Map(state.tasks.map(t => [t.id, t]));
        this._commits = state.commits;

        this._onDidChange.fire();
    }
}
```

### Webview ↔ Extension Communication

```typescript
// Extension side
webview.postMessage({
    type: 'updateProject',
    payload: { project: currentProject }
});

webview.onDidReceiveMessage(message => {
    switch (message.type) {
        case 'createTask':
            this.projectManager.createTask(message.payload);
            break;
        case 'getContext':
            const context = await this.contextProvider.getContext();
            webview.postMessage({ type: 'context', payload: context });
            break;
    }
});

// Webview side
window.addEventListener('message', event => {
    const { type, payload } = event.data;

    switch (type) {
        case 'updateProject':
            setProject(payload.project);
            break;
        case 'context':
            setContextInfo(payload);
            break;
    }
});

function sendToExtension(type: string, payload: any) {
    vscode.postMessage({ type, payload });
}
```

---

## 6. Key Integration Challenges & Solutions

### Challenge 1: React in Webview

**Problem**: Next.js uses server components, VS Code needs client-only webviews

**Solution**:
- Bundle React components with esbuild
- Use `client` directive for all components
- Serve bundled JS/CSS from extension resources
- Use VS Code theming CSS variables

### Challenge 2: State Synchronization

**Problem**: Webview and extension host have separate JS contexts

**Solution**:
- Single source of truth: Extension host
- Webview sends actions, extension updates state
- Extension broadcasts state changes to all webviews
- Debounce updates to reduce message volume

### Challenge 3: Styling

**Problem**: Tailwind classes won't match VS Code theme

**Solution**:
```css
/* Map Tailwind to VS Code theme */
:root {
    --primary: var(--vscode-button-background);
    --primary-foreground: var(--vscode-button-foreground);
    --background: var(--vscode-editor-background);
    --foreground: var(--vscode-editor-foreground);
    --border: var(--vscode-panel-border);
    --card: var(--vscode-sideBar-background);
    --muted: var(--vscode-input-background);
}
```

### Challenge 4: Git Integration

**Problem**: Need real-time git monitoring without polling

**Solution**:
- Use VS Code's built-in `IGitService`
- Subscribe to `onDidChangeRepository` event
- Use `IFileService` watchers for `.git/` directory
- Leverage `scm` API for change detection

### Challenge 5: AI Context Awareness

**Problem**: Browser selection API doesn't work in webviews

**Solution**:
- Track active editor in extension host
- Send editor selection to webview on change
- Use `IEditorService.onDidActiveEditorChange`
- Webview renders selection info from extension

---

## 7. Implementation Checklist

### Phase 1: Infrastructure (Week 1-2)
- [ ] Create `projectManager` contribution directory structure
- [ ] Set up webview infrastructure with esbuild bundling
- [ ] Implement `IProjectManagerService` interface
- [ ] Create basic webview panel container
- [ ] Set up message passing bridge
- [ ] Register view containers and panels
- [ ] Implement VS Code theme CSS mapping

### Phase 2: Component Migration (Week 3-4)
- [ ] Convert `ProjectOverview` component to webview
- [ ] Convert `AIAssistant` component to webview
- [ ] Convert `ProgressTracker` component to webview
- [ ] Convert `TechStackDocumentation` to tree view
- [ ] Implement state synchronization
- [ ] Add persistence layer (project-state.json)

### Phase 3: Integration (Week 5-6)
- [ ] Connect to `IAIOrchestratorService`
- [ ] Implement `ContextualAIProvider`
- [ ] Create chat participant for project manager
- [ ] Integrate with `IWorkspaceContextService`
- [ ] Implement selection tracking
- [ ] Add quick action commands

### Phase 4: Git Features (Week 7-8)
- [ ] Implement `GitCommitWatcher`
- [ ] Create Film Roll timeline webview
- [ ] Integrate `@xyflow/react` for timeline
- [ ] Add commit → task linking
- [ ] Implement branch visualization
- [ ] Add rollback suggestions

### Phase 5: Analytics (Week 9-10)
- [ ] Implement `ProgressCalculator`
- [ ] Create charts webview with Recharts
- [ ] Add agent usage metrics
- [ ] Implement commit velocity tracking
- [ ] Add file metrics collection
- [ ] Create dashboard summary view

### Phase 6: Testing & Polish (Week 11-12)
- [ ] Unit tests for services
- [ ] Integration tests for webviews
- [ ] Performance profiling
- [ ] Memory leak detection
- [ ] UI polish and animations
- [ ] Documentation and examples

---

## 8. Timeline to Production

### Aggressive Timeline (3 months)
- **Month 1**: Phase 1-2 (Infrastructure + Components)
- **Month 2**: Phase 3-4 (Integration + Git)
- **Month 3**: Phase 5-6 (Analytics + Testing)

### Realistic Timeline (4-5 months)
- **Month 1**: Phase 1 (Infrastructure only)
- **Month 2**: Phase 2 (Component migration)
- **Month 3**: Phase 3-4 (Integration + Git)
- **Month 4**: Phase 5 (Analytics)
- **Month 5**: Phase 6 (Testing + Polish)

### Conservative Timeline (6 months)
- **Month 1-2**: Phase 1-2 (Solid foundation)
- **Month 3-4**: Phase 3-4 (Feature-complete integration)
- **Month 5**: Phase 5 (Analytics)
- **Month 6**: Phase 6 (Production-ready)

---

## 9. Success Metrics

### Technical Metrics
- [ ] 0 TypeScript compilation errors
- [ ] < 500ms webview render time
- [ ] < 100ms message passing latency
- [ ] < 50MB extension memory footprint
- [ ] 100% test coverage for services

### User Experience Metrics
- [ ] Seamless theme switching (light/dark)
- [ ] Real-time updates (< 1s delay)
- [ ] Contextual AI responds to selection in < 2s
- [ ] Git commit detected within 5s
- [ ] Charts render in < 1s

### Feature Completeness
- [ ] All Next.js components migrated
- [ ] AI context awareness working
- [ ] Git integration functional
- [ ] Progress tracking accurate
- [ ] Film Roll timeline interactive

---

## 10. Next Steps

### Immediate (This Week)
1. Create project manager directory structure
2. Set up webview bundling with esbuild
3. Implement basic `IProjectManagerService`
4. Test message passing between extension and webview
5. Validate React rendering in webview

### Short-term (Next 2 Weeks)
1. Migrate first component (ProjectOverview)
2. Implement state persistence
3. Connect to AI Orchestrator service
4. Create chat participant
5. Begin git watcher implementation

### Medium-term (Month 2-3)
1. Complete all component migrations
2. Implement full git integration
3. Add Film Roll timeline
4. Build analytics dashboard
5. Comprehensive testing

---

## 11. Risk Mitigation

### Risk 1: Performance Issues
**Mitigation**:
- Profile early and often
- Use lazy loading for webviews
- Implement efficient message batching
- Cache computed metrics

### Risk 2: Webview Complexity
**Mitigation**:
- Start with simplest components
- Build robust message passing abstraction
- Extensive error handling
- Fallback to native views if needed

### Risk 3: State Synchronization Bugs
**Mitigation**:
- Single source of truth pattern
- Immutable state updates
- Event-driven architecture
- Comprehensive state tests

### Risk 4: Git Integration Reliability
**Mitigation**:
- Use built-in VS Code git services
- Graceful degradation if git unavailable
- Robust error handling
- Manual refresh option

---

## 12. Open Questions

1. **Should we use React or native web components for webviews?**
   - **Recommendation**: Keep React for faster migration, consider native later

2. **How do we handle multi-workspace scenarios?**
   - **Recommendation**: One project manager per workspace, switch context on workspace change

3. **Should we persist project state in `.vscode/` or extension storage?**
   - **Recommendation**: `.vscode/project-state.json` for version control, extension storage for user prefs

4. **How do we integrate with Memory Agent?**
   - **Recommendation**: Phase 2 feature after core integration complete

5. **Should Film Roll be a separate panel or integrated into project overview?**
   - **Recommendation**: Separate panel in activity bar, can be docked

---

## Conclusion

This integration plan provides a comprehensive roadmap for transforming the standalone Next.js AI Project Planner into a fully integrated VS Code extension. The phased approach ensures we build a solid foundation before adding advanced features, while the risk mitigation strategies help us anticipate and address potential issues.

The key to success is maintaining the core user experience of the project manager while leveraging VS Code's powerful extension APIs and built-in services. With proper execution, this integration will create a seamless, production-ready AI-assisted development environment.

**Next Action**: Begin Phase 1 implementation with webview infrastructure setup.
