# AI Chat Panel Implementation Plan

## Overview
Implement a custom AI chat interface in the secondary sidebar (AuxiliaryBar), similar to how Cursor IDE handles their AI chat panel. This approach avoids the complexity of VS Code's chat participant system while giving us full control over the UI and UX.

## Architecture Decision

### Why Not VS Code Native Chat?
- Chat participants are designed for **extensions**, not core features
- Complex type signature requirements for workbench contributions
- Would require fighting with VS Code's internal chat system
- Limited customization options

### Why Secondary Sidebar (AuxiliaryBar)?
- ✅ **Cursor's proven approach** - they successfully use this pattern
- ✅ **Persistent presence** - always visible, doesn't compete for space
- ✅ **Native panel behavior** - resize, collapse, proper VS Code integration
- ✅ **Independent from Mission Control** - dashboard and chat can coexist
- ✅ **Full control** - we own the entire UI/UX

## Tech Stack Comparison

### VS Code Native Chat (What we're NOT using)
- Pure TypeScript with native VS Code widgets
- 2000+ lines of complex code
- WorkbenchList, WorkbenchObjectTree, DOM manipulation
- Deep integration with VS Code services
- Difficult to customize

### Our Approach: Webview-Based Chat (Cline's Stack)
- **React** for UI components
- **Vite** for fast development builds
- **Tailwind CSS** for styling
- **TypeScript** throughout
- **Storybook** for component development (optional)
- HTML/CSS/JavaScript rendered in webview
- Simple message passing via postMessage API
- Easy to customize and iterate
- Proven pattern for chat interfaces

**Cline's Directory Structure:**
```
/webview-ui          - React app for chat interface
  /src               - React components and logic
  index.html         - Entry point
  vite.config.ts     - Build configuration
  tailwind.config.js - Styling configuration
/src                 - Extension backend
  extension.ts       - Main entry point
  registry.ts        - Provider registrations
```

## Implementation Phases

### Phase 1: Revert & Get Compiling ✅ (Current)
**Goal:** Remove problematic chat participant code and return to working state

**Tasks:**
1. Remove chat participant registration from `aiOrchestrator.node.contribution.ts`
   - Delete `AIOrchestratorAgentRegistration` class
   - Delete `registerWorkbenchContribution2` call
   - Keep only service registrations (DatabaseService, AIOrchestratorService)

2. Remove chat participant code from `aiOrchestrator.contribution.ts`
   - Delete `AIOrchestratorChatParticipantContribution` class
   - Delete participant registration code
   - Keep Mission Control view container and commands

3. Verify compilation succeeds (0 errors)

**Files to Modify:**
- `src/vs/workbench/contrib/aiOrchestrator/node/aiOrchestrator.node.contribution.ts`
- `src/vs/workbench/contrib/aiOrchestrator/browser/aiOrchestrator.contribution.ts`

### Phase 2: Create AI Chat Panel (Next)
**Goal:** Register a new view in the secondary sidebar for AI chat

**Tasks:**
1. Register new view container in AuxiliaryBar
   ```typescript
   const AI_CHAT_VIEW_CONTAINER = Registry.as<IViewContainersRegistry>(ViewExtensions.ViewContainersRegistry)
     .registerViewContainer({
       id: 'workbench.view.aiChat',
       title: { value: 'AI Chat', original: 'AI Chat' },
       icon: ThemeIcon.fromId('comment-discussion'),
       ctorDescriptor: new SyncDescriptor(ViewPaneContainer, ['workbench.view.aiChat', { mergeViewWithContainerWhenSingleView: true }]),
       storageId: 'aiChatViewletState',
       hideIfEmpty: false,
       order: 1
     }, ViewContainerLocation.AuxiliaryBar);
   ```

2. Create webview-based chat view class
   - Extend `ViewPane` or use webview view provider
   - Render chat UI in webview
   - Handle message passing

3. Wire to orchestratorService
   - Send messages from webview to service
   - Stream responses back to webview
   - Display task execution progress

**Files to Create/Modify:**
- `src/vs/workbench/contrib/aiOrchestrator/browser/aiChatView.ts` (NEW)
- `src/vs/workbench/contrib/aiOrchestrator/browser/aiOrchestrator.contribution.ts` (MODIFY)

### Phase 3: Build Chat UI (Future)
**Goal:** Create the actual chat interface in the webview

**Options:**
1. **Copy Cline's UI** (MIT licensed, proven design)
2. **Build custom with React**
3. **Use Web Components**

**Features:**
- Message list (user + AI responses)
- Input box with send button
- Markdown rendering for AI responses
- Task status indicators
- Code block rendering
- File references

### Phase 4: Advanced Features (Future)
**Goal:** Add advanced chat capabilities

**Features:**
- Multi-agent coordination display
- Task breakdown visualization
- File diff previews
- Approval workflows
- Memory/context management
- Custom commands/shortcuts

## Current State

### What Works ✅
- Mission Control dashboard (webview with React bundle)
- Database integration (SQLite)
- Service registrations
- Panel in primary sidebar
- Project scanning
- Webview infrastructure

### What Doesn't Work ❌
- Chat participant registration (type signature issues)
- @orchestrator mention in VS Code chat
- Integration with native chat system

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                     VS Code Workbench                        │
├─────────────────────┬───────────────────┬───────────────────┤
│  Primary Sidebar    │   Editor Area     │  Secondary Sidebar│
│  (Left)             │   (Center)        │  (AuxiliaryBar)   │
├─────────────────────┼───────────────────┼───────────────────┤
│ • Explorer          │                   │ • AI Chat Panel   │
│ • Search            │   Code Editor     │   └─ Webview      │
│ • Source Control    │                   │      └─ Messages  │
│ • Mission Control   │                   │      └─ Input     │
│   └─ Webview        │                   │      └─ Tasks     │
│      └─ Dashboard   │                   │                   │
└─────────────────────┴───────────────────┴───────────────────┘
```

## Communication Flow

```
User Input (Chat)
    ↓
AI Chat Panel (Webview)
    ↓ (postMessage)
AIOrchestratorService
    ↓
- Plan tasks (GPT-4)
- Delegate to agents (v0, Claude, Gemini)
- Execute tasks
    ↓ (streaming response)
AI Chat Panel (Webview)
    ↓
Display to User
```

## Benefits of This Approach

1. **Simplicity** - No complex workbench contribution type signatures
2. **Control** - Full ownership of UI/UX
3. **Flexibility** - Can use any web framework
4. **Proven** - Cursor and Cline use similar approaches
5. **Maintainable** - Easier to understand and modify
6. **Extensible** - Can add features without VS Code limitations

## References

- **Cursor IDE**: Uses secondary sidebar for AI panel
- **Windsurf IDE**: Custom Cascade panel (VS Code fork)
- **Cline Extension**: Webview-based chat in sidebar
- **VS Code Webview API**: https://code.visualstudio.com/api/extension-guides/webview
- **View Containers**: `src/vs/workbench/common/views.ts`

## Next Steps

1. ✅ Complete Phase 1 (revert to working state)
2. Implement Phase 2 (register AI Chat panel)
3. Build Phase 3 (chat UI)
4. Add Phase 4 (advanced features)

---

**Created:** 2025-10-27
**Status:** Phase 1 In Progress
