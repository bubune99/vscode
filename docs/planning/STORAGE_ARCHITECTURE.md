# Storage Architecture

## Overview
Hybrid storage approach combining SQLite database, VS Code global storage, and workspace storage for different data types based on scope and usage patterns.

## Storage Layers

### 1. SQLite Database (Mission Control Analytics)
**Location**: `~/.missioncontrol/missioncontrol.db` (global, cross-workspace)
**Purpose**: Structured analytics and historical tracking
**Use Cases**:
- **5W+H Analytics** (Who, What, When, Where, Why, How)
  - Which agents worked on what tasks
  - Task execution timelines
  - Project relationships
  - Decision rationale tracking
  - Success/failure patterns
- **Cross-project insights**
  - Agent performance metrics
  - Task pattern analysis
  - Technology stack correlations
  - Time estimation improvements
- **Mission Control dashboard data**
  - Project overview statistics
  - Agent utilization charts
  - Task completion trends
  - Resource allocation history

**Schema** (existing):
```sql
-- Projects table
CREATE TABLE projects (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  workspace_path TEXT NOT NULL UNIQUE,
  tech_stack TEXT,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

-- Tasks table
CREATE TABLE tasks (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL,
  description TEXT NOT NULL,
  agent TEXT NOT NULL,
  status TEXT NOT NULL,
  result TEXT,
  created_at INTEGER NOT NULL,
  completed_at INTEGER,
  FOREIGN KEY (project_id) REFERENCES projects(id)
);

-- Future: Add analytics tables
-- agent_metrics, task_patterns, execution_logs, etc.
```

**Why SQLite?**
- Structured relational queries for analytics
- Cross-project aggregation
- Historical trend analysis
- Data integrity with foreign keys
- Efficient indexing for complex queries

---

### 2. Global Storage (VS Code Storage API)
**Location**: VS Code's global storage (varies by OS)
**Purpose**: User-level, cross-workspace data
**Use Cases**:
- **Chat conversation history**
  - All chat messages across all workspaces
  - Not tied to specific project
  - Persists when switching workspaces
- **User preferences** (future)
  - Preferred agents
  - Default task planning behavior
  - UI customization settings
- **API keys and credentials** (future)
  - OpenAI API key
  - Anthropic API key
  - Google API key

**API Usage**:
```typescript
// Extension context provides global storage
const chatHistory = context.globalState.get<ChatMessage[]>('chatHistory', []);
context.globalState.update('chatHistory', [...chatHistory, newMessage]);
```

**Why Global Storage?**
- Simple key-value storage for serializable data
- Built-in VS Code persistence
- No database overhead for simple data
- Survives workspace changes
- Suitable for user-level settings

---

### 3. Workspace Storage (VS Code Storage API)
**Location**: VS Code's workspace storage (per-workspace)
**Purpose**: Project-specific configuration and state
**Use Cases**:
- **Mission Control planning state** (future consideration)
  - Current task breakdown
  - Active agent assignments
  - Project-specific settings
- **Workspace-specific rules** (like Windsurf)
  - Custom agent instructions for this project
  - Technology-specific guidelines
  - Team conventions
- **Project context** (like `.claude` config)
  - Ignored files patterns
  - Important directories
  - Project-specific prompts

**API Usage**:
```typescript
// Workspace storage is scoped to current workspace
const projectState = context.workspaceState.get<ProjectState>('missionControlState');
context.workspaceState.update('missionControlState', updatedState);
```

**Not file-based** (like `.claude` or `.windsurf`):
- No actual files created in project directory
- VS Code manages storage internally
- Not committed to version control
- Portable across machines (with settings sync)

**Why Workspace Storage?**
- Project-specific without polluting repository
- Automatic cleanup when workspace removed
- Scoped to project naturally
- Simple API for configuration data

---

## Data Flow Examples

### Example 1: User Sends Chat Message
```
User types in AI Chat panel
    ↓
1. Save to Global Storage (chat history)
2. Send to Orchestrator Service for processing
    ↓
3. Orchestrator creates Task Plan
4. Save tasks to SQLite Database (analytics)
    ↓
5. Execute tasks via agents
6. Stream responses to chat UI
    ↓
7. Update SQLite with task completion
8. Save assistant response to Global Storage (chat history)
```

### Example 2: Open Mission Control Dashboard
```
User opens Mission Control
    ↓
1. Query SQLite for project analytics
   - Task counts by status
   - Agent utilization
   - Recent activity timeline
    ↓
2. Query Workspace Storage for project state (if needed)
   - Current planning status
   - Active tasks
    ↓
3. Render dashboard with data
```

### Example 3: Workspace Opens
```
VS Code opens workspace
    ↓
1. Initialize SQLite database (global)
2. Check if project exists in database
    ↓
3. If not exists: Create new project record
4. Load Workspace Storage for project config
    ↓
5. Ready for chat and Mission Control
```

---

## Comparison to Other Tools

### Cline (Extension)
- **Global Storage**: Settings, API keys
- **Workspace Storage**: Task memory, file context
- **No Database**: Simple key-value sufficient

### Windsurf (VS Code Fork)
- **File-based Config**: `.windsurf/` directory
  - `rules.md` - Project-specific AI rules
  - `memory.json` - Project context
- **Global Settings**: User preferences
- **Chat History**: Likely global storage

### Claude Desktop (Extension)
- **File-based Config**: `.claude/` directory
  - Settings and preferences for project
- **Global Storage**: Chat history
- **No Database**: Extension-level simplicity

### Our Approach (VS Code Fork)
- **SQLite Database**: Mission Control analytics (unique)
- **Global Storage**: Chat history
- **Workspace Storage**: Project config (not files)
- **Why different?**: Mission Control requires rich analytics

---

## Decision Rationale

### Why SQLite for Mission Control?
Mission Control is not just a chat interface - it's an **analytics and coordination dashboard**:
- Need to answer questions like:
  - "Which agent is most successful at React tasks?"
  - "What's the average time to complete authentication features?"
  - "What patterns emerge from failed tasks?"
- These queries require **relational database capabilities**
- Simple storage can't efficiently aggregate cross-project data

### Why Global Storage for Chat?
Chat history is **user-centric, not project-centric**:
- Users want conversation history across all projects
- No need for complex queries
- Simple append-only data structure
- Built-in VS Code persistence

### Why Workspace Storage for Config?
Project settings should be **workspace-specific but not version-controlled**:
- Different teams may have different AI instructions
- Settings shouldn't pollute git repository
- VS Code's workspace storage solves this elegantly
- Can sync across machines with VS Code settings sync

---

## Implementation Status

### ✅ Completed
- SQLite database with projects and tasks tables
- Database service implementation
- Database initialization on workspace open
- Mission Control webview dashboard (basic)

### 🚧 In Progress
- AI Chat panel in secondary sidebar
- Chat message handling
- Task execution with streaming

### 📋 Next Steps
1. Implement global storage for chat history
2. Add chat history persistence and loading
3. Implement workspace storage for project config
4. Add analytics queries to Mission Control dashboard
5. Create settings UI for workspace-specific rules

---

## Migration Path

If we later want to add file-based config (like `.missioncontrol/`):
1. Workspace storage can **export** to files
2. Files can **import** into workspace storage
3. Gives users choice: VS Code storage OR version-controlled files
4. Best of both worlds

**Example structure**:
```
.missioncontrol/
  ├── rules.md          # AI instructions for this project
  ├── workflows.json    # Custom task workflows
  └── .gitignore        # Optional: ignore generated files
```

---

**Created**: 2025-10-27
**Status**: Architecture Defined
