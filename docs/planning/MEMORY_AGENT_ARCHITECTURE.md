# Memory Agent & Project Manager Architecture

## Overview
This document outlines the complete architecture for the Memory Agent and Project Manager features in the VS Code fork, including storage strategies, cloud sync options, and project template management.

---

## 1. Storage Architecture (Hybrid Approach)

### Three-Tier Storage Strategy

```
┌─────────────────────────────────────────────────────────────┐
│                   Storage Options                            │
└─────────────────────────────────────────────────────────────┘

Option 1: SQLite Local (Default)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📱 User Device
   └── ~/.vscode-fork/memory.db (SQLite)

✅ Features:
  - Privacy-first (all data local)
  - Works offline
  - Zero setup required
  - No authentication needed
  - GDPR compliant by default

❌ Limitations:
  - No cross-device sync
  - No team collaboration
  - Limited vector search capabilities
  - Single-device only


Option 2: Cloud Sync (Opt-in)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📱 User Device                ☁️ Cloud Provider
   └── SQLite (cache) ←→ sync ←→ Neon/Supabase

✅ Features:
  - Cross-device sync
  - Work on multiple machines
  - Cloud backup
  - Selective project sync
  - User-controlled cloud provider

💡 User provides their own cloud credentials:
  - Neon connection string
  - Supabase URL + API key
  - Custom PostgreSQL endpoint


Option 3: Self-Hosted pgvector (Enterprise)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📱 Team Members              🏢 Company Infrastructure
   ├── User 1 ←┐
   ├── User 2 ←┼──→ PostgreSQL + pgvector
   └── User 3 ←┘

✅ Features:
  - Full team collaboration
  - Company data stays internal
  - Advanced vector search (pgvector)
  - Shared project memory
  - Enterprise compliance
  - Full control over data

💡 Perfect for:
  - Companies with security requirements
  - Teams needing shared context
  - Advanced semantic search
```

---

## 2. Configuration Schema

### User Settings (settings.json)

```json
{
  "memoryAgent": {
    "storage": {
      "mode": "local",  // "local" | "cloud" | "self-hosted"
      "localPath": "~/.vscode-fork/memory.db",

      "cloud": {
        "enabled": false,
        "provider": "neon",  // "neon" | "supabase" | "custom"
        "connectionString": "",
        "syncStrategy": "manual",  // "manual" | "auto" | "on-close"
        "syncProjects": []  // Empty = sync all, or specific project paths
      },

      "selfHosted": {
        "enabled": false,
        "host": "localhost",
        "port": 5432,
        "database": "vscode_memory",
        "useSSL": true,
        "pgvectorEnabled": true
      }
    },

    "fileWatcher": {
      "enabled": true,
      "patterns": ["**/*.ts", "**/*.js", "**/*.tsx", "**/*.jsx"],
      "excludePatterns": ["**/node_modules/**", "**/dist/**", "**/.git/**"],
      "debounceMs": 500
    },

    "vectorSearch": {
      "enabled": false,  // Requires cloud or self-hosted with pgvector
      "embeddingModel": "text-embedding-3-small",
      "embeddingProvider": "openai",  // "openai" | "ollama" | "custom"
      "dimensions": 1536
    },

    "telemetry": {
      "enabled": false,
      "anonymous": true,
      "collectUsageStats": false
    }
  },

  "projectManager": {
    "templates": {
      "source": "vercel",  // "vercel" | "github" | "custom"
      "customPath": "~/.vscode-templates",
      "autoUpdate": true,
      "updateCheckInterval": 86400000  // 24 hours
    },

    "git": {
      "autoInitialize": true,
      "defaultBranch": "main",
      "syncDbBranches": false  // Create DB branch on git branch
    }
  }
}
```

---

## 3. Database Schema

### SQLite Schema (Local Storage)

```sql
-- File memories
CREATE TABLE file_memories (
    id TEXT PRIMARY KEY,
    file_path TEXT NOT NULL,
    content_hash TEXT,
    last_accessed INTEGER,  -- Unix timestamp
    access_count INTEGER DEFAULT 0,
    created_at INTEGER,
    updated_at INTEGER
);

CREATE INDEX idx_file_path ON file_memories(file_path);
CREATE INDEX idx_last_accessed ON file_memories(last_accessed);

-- User interactions (telemetry)
CREATE TABLE interactions (
    id TEXT PRIMARY KEY,
    action_type TEXT NOT NULL,
    file_path TEXT,
    metadata TEXT,  -- JSON
    timestamp INTEGER
);

CREATE INDEX idx_action_type ON interactions(action_type);
CREATE INDEX idx_timestamp ON interactions(timestamp);

-- Projects
CREATE TABLE projects (
    id TEXT PRIMARY KEY,
    workspace_path TEXT UNIQUE NOT NULL,
    template_id TEXT,
    template_name TEXT,
    created_at INTEGER,
    last_opened INTEGER,
    metadata TEXT  -- JSON
);

-- Templates
CREATE TABLE templates (
    id TEXT PRIMARY KEY,
    vercel_id TEXT,
    name TEXT NOT NULL,
    description TEXT,
    repo_url TEXT,
    tags TEXT,  -- JSON array
    last_updated INTEGER
);

-- Sync metadata (for cloud sync)
CREATE TABLE sync_metadata (
    key TEXT PRIMARY KEY,
    last_sync INTEGER,
    sync_status TEXT,  -- "pending" | "synced" | "error"
    error_message TEXT
);
```

### PostgreSQL Schema (Cloud/Self-Hosted)

```sql
-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS vector;  -- For pgvector

-- File memories with vector embeddings
CREATE TABLE file_memories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL,
    workspace_id UUID NOT NULL,
    file_path TEXT NOT NULL,
    content_hash TEXT,
    embedding vector(1536),  -- OpenAI embedding size
    last_accessed TIMESTAMPTZ,
    access_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Vector similarity index
CREATE INDEX ON file_memories USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);

-- Path-based index
CREATE INDEX idx_file_path ON file_memories(file_path);
CREATE INDEX idx_user_workspace ON file_memories(user_id, workspace_id);

-- User interactions
CREATE TABLE interactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL,
    workspace_id UUID,
    action_type TEXT NOT NULL,
    file_path TEXT,
    metadata JSONB,
    timestamp TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_interactions_user ON interactions(user_id, timestamp);
CREATE INDEX idx_interactions_type ON interactions(action_type);

-- Workspaces (projects)
CREATE TABLE workspaces (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    owner_id UUID NOT NULL,
    workspace_path TEXT NOT NULL,
    template_id UUID,
    git_remote TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    last_opened TIMESTAMPTZ,
    metadata JSONB
);

-- Workspace members (for team collaboration)
CREATE TABLE workspace_members (
    workspace_id UUID REFERENCES workspaces(id),
    user_id UUID NOT NULL,
    role TEXT NOT NULL,  -- "owner" | "admin" | "member"
    joined_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (workspace_id, user_id)
);

-- Templates
CREATE TABLE templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    vercel_id TEXT UNIQUE,
    name TEXT NOT NULL,
    description TEXT,
    repo_url TEXT,
    tags TEXT[],
    stars INTEGER DEFAULT 0,
    last_updated TIMESTAMPTZ
);

-- Database branching metadata (Neon-specific)
CREATE TABLE db_branches (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workspace_id UUID REFERENCES workspaces(id),
    git_branch TEXT NOT NULL,
    db_branch_id TEXT,  -- Neon branch ID
    created_at TIMESTAMPTZ DEFAULT NOW(),
    active BOOLEAN DEFAULT true
);
```

---

## 4. Service Architecture

### File Structure

```
src/vs/workbench/contrib/
├── memoryAgent/
│   ├── browser/
│   │   ├── memoryPanel.ts                  # UI panel
│   │   ├── vectorSearchView.ts             # Semantic search UI
│   │   └── memoryAgent.contribution.ts     # Registration
│   ├── common/
│   │   ├── memoryService.ts                # IMemoryService interface
│   │   ├── storageStrategy.ts              # Storage abstraction
│   │   ├── fileWatcherService.ts           # File change detection
│   │   └── memoryTypes.ts                  # Type definitions
│   └── node/
│       ├── memoryServiceImpl.ts            # Service implementation
│       ├── storage/
│       │   ├── sqliteStorage.ts            # SQLite implementation
│       │   ├── neonStorage.ts              # Neon cloud storage
│       │   ├── postgresStorage.ts          # Self-hosted Postgres
│       │   └── storageFactory.ts           # Factory pattern
│       ├── sync/
│       │   ├── cloudSync.ts                # Cloud sync logic
│       │   └── conflictResolver.ts         # Handle sync conflicts
│       ├── embeddings/
│       │   ├── embeddingService.ts         # Generate embeddings
│       │   ├── openaiProvider.ts           # OpenAI embeddings
│       │   └── ollamaProvider.ts           # Local embeddings
│       └── fileIndexer.ts                  # Index files on change
│
└── projectManager/
    ├── browser/
    │   ├── projectManagerPanel.ts          # Main UI panel
    │   ├── templateGallery.ts              # Browse templates
    │   ├── templatePreview.ts              # Preview before import
    │   ├── projectExplorer.ts              # Project tree view
    │   └── projectManager.contribution.ts  # Registration
    ├── common/
    │   ├── projectManagerService.ts        # IProjectManagerService
    │   ├── templateService.ts              # ITemplateService
    │   └── projectTypes.ts                 # Type definitions
    └── node/
        ├── projectManagerServiceImpl.ts    # Service implementation
        ├── templateServiceImpl.ts          # Template management
        ├── vercelTemplateClient.ts         # Fetch Vercel templates
        ├── templateImporter.ts             # Clone & scaffold
        └── templateUpgrader.ts             # Check for updates
```

---

## 5. Core Interfaces

### IMemoryService

```typescript
export interface IMemoryService {
    // Storage operations
    storeFileMemory(file: URI, content: string): Promise<void>;
    getFileMemory(file: URI): Promise<FileMemory | null>;
    deleteFileMemory(file: URI): Promise<void>;

    // Interaction tracking
    recordInteraction(action: InteractionType, context: InteractionContext): Promise<void>;
    getRecentInteractions(limit: number): Promise<Interaction[]>;

    // Search operations
    searchFiles(query: string): Promise<FileMemory[]>;
    getMostAccessedFiles(limit: number): Promise<FileMemory[]>;
    getRelatedFiles(file: URI): Promise<FileMemory[]>;

    // Vector search (if enabled)
    semanticSearch(query: string, limit: number): Promise<FileMemory[]>;
    findSimilarFiles(file: URI, limit: number): Promise<FileMemory[]>;

    // Sync operations (if cloud enabled)
    syncToCloud(): Promise<SyncResult>;
    syncFromCloud(): Promise<SyncResult>;
    getSyncStatus(): Promise<SyncStatus>;

    // Configuration
    getStorageMode(): StorageMode;
    switchStorageMode(mode: StorageMode): Promise<void>;
}

export interface FileMemory {
    id: string;
    filePath: string;
    contentHash: string;
    embedding?: number[];
    lastAccessed: Date;
    accessCount: number;
    createdAt: Date;
    updatedAt: Date;
}

export interface Interaction {
    id: string;
    actionType: InteractionType;
    filePath?: string;
    metadata?: any;
    timestamp: Date;
}

export enum InteractionType {
    FileOpen = 'file_open',
    FileEdit = 'file_edit',
    FileClose = 'file_close',
    AIQuery = 'ai_query',
    TemplateImport = 'template_import',
    ProjectCreate = 'project_create'
}

export enum StorageMode {
    Local = 'local',
    Cloud = 'cloud',
    SelfHosted = 'self-hosted'
}
```

### IProjectManagerService

```typescript
export interface IProjectManagerService {
    // Project operations
    createProject(config: ProjectConfig): Promise<Project>;
    openProject(path: string): Promise<Project>;
    getRecentProjects(limit: number): Promise<Project[]>;
    deleteProject(id: string): Promise<void>;

    // Template operations
    getTemplates(filter?: TemplateFilter): Promise<Template[]>;
    importTemplate(templateId: string, targetPath: string): Promise<Project>;
    updateTemplate(templateId: string): Promise<void>;
    checkTemplateUpdates(): Promise<TemplateUpdate[]>;

    // Git integration
    initializeGit(project: Project): Promise<void>;
    createBranch(project: Project, branchName: string): Promise<void>;

    // Database branching (Neon)
    createDbBranch(project: Project, branchName: string): Promise<void>;
    switchDbBranch(project: Project, branchName: string): Promise<void>;
}

export interface Project {
    id: string;
    workspacePath: string;
    templateId?: string;
    templateName?: string;
    gitRemote?: string;
    createdAt: Date;
    lastOpened: Date;
    metadata?: any;
}

export interface Template {
    id: string;
    vercelId?: string;
    name: string;
    description: string;
    repoUrl: string;
    tags: string[];
    stars?: number;
    lastUpdated: Date;
}

export interface ProjectConfig {
    name: string;
    path: string;
    templateId?: string;
    initGit: boolean;
    installDependencies: boolean;
}
```

---

## 6. Cloud Sync Strategy

### Sync Modes

```typescript
export enum SyncStrategy {
    Manual = 'manual',      // User clicks "Sync Now"
    Auto = 'auto',          // Sync every N minutes
    OnClose = 'on-close'    // Sync when VS Code closes
}

export interface CloudSyncConfig {
    enabled: boolean;
    strategy: SyncStrategy;
    syncInterval?: number;  // milliseconds (for auto mode)
    syncProjects: string[]; // Empty = sync all
}
```

### Selective Project Sync

Users can choose which projects to sync to the cloud:

```json
{
  "memoryAgent.storage.cloud.syncProjects": [
    "/home/user/work/project-a",
    "/home/user/personal/project-b"
  ]
}
```

If empty, all projects are synced.

### Cross-Device Workflow

```
Device A (Desktop)                Cloud                Device B (Laptop)
══════════════════                ═════                ═══════════════════

1. Edit file                      →  Sync  →
2. Close VS Code                  →  Push  →
                                               ←  Pull  ← 3. Open VS Code
                                               ←  Sync  ← 4. File appears

User can work on different devices seamlessly!
```

---

## 7. Implementation Phases

### Phase 1: Core Memory Service (SQLite)
- [ ] Create memoryAgent contribution
- [ ] Implement SQLite storage
- [ ] File watcher integration
- [ ] Basic interaction tracking
- [ ] Memory panel UI

### Phase 2: Project Manager (Vercel Templates)
- [ ] Create projectManager contribution
- [ ] Implement template service
- [ ] Vercel API client
- [ ] Template gallery UI
- [ ] Template importer

### Phase 3: Cloud Sync (Optional)
- [ ] Implement cloud storage abstraction
- [ ] Neon storage implementation
- [ ] Supabase storage implementation
- [ ] Sync service
- [ ] Conflict resolution

### Phase 4: Vector Search (pgvector)
- [ ] Embedding service
- [ ] OpenAI embeddings integration
- [ ] Ollama local embeddings
- [ ] Vector search API
- [ ] Semantic search UI

### Phase 5: Self-Hosted (Enterprise)
- [ ] PostgreSQL storage implementation
- [ ] Team collaboration features
- [ ] Workspace sharing
- [ ] Role-based access control

### Phase 6: Advanced Features
- [ ] Database branching (Neon)
- [ ] Template auto-updater
- [ ] Advanced analytics
- [ ] AI-powered project insights

---

## 8. Security & Privacy

### Privacy Principles

1. **Local-First**: Default to SQLite, no data leaves device
2. **Opt-In Cloud**: User explicitly enables cloud sync
3. **User-Controlled**: User provides their own cloud credentials
4. **No Tracking**: Telemetry is opt-in and anonymous
5. **Transparent**: Clear indication when data syncs

### Data Handling

```typescript
// What we STORE:
✅ File paths (hashed if needed)
✅ Access timestamps
✅ File metadata (size, extension)
✅ User preferences
✅ Template usage

// What we NEVER store:
❌ File contents (unless explicitly enabled for embeddings)
❌ Credentials
❌ Environment variables
❌ Personal information
❌ Code snippets (without consent)
```

### Cloud Credentials Storage

```typescript
// Stored securely in VS Code's credential store
interface CloudCredentials {
    provider: 'neon' | 'supabase' | 'custom';
    connectionString: string;  // Encrypted at rest
    apiKey?: string;           // Encrypted at rest
}

// Never logged or transmitted to our servers
// Only used to connect to user's chosen cloud provider
```

---

## 9. Dependencies

### Required npm packages

```json
{
  "dependencies": {
    "better-sqlite3": "^9.0.0",     // SQLite
    "pg": "^8.11.0",                // PostgreSQL client
    "@neondatabase/serverless": "^0.6.0",  // Neon client
    "@supabase/supabase-js": "^2.38.0",    // Supabase (optional)
    "openai": "^4.20.0",            // Embeddings (optional)
    "axios": "^1.6.0",              // HTTP client
    "chokidar": "^3.5.3"            // File watching
  }
}
```

---

## 10. User Experience Flow

### First-Time Setup

```
1. User installs VS Code fork
2. Opens first project
3. Prompt: "Enable Memory Agent?"
   - [Use Local Storage (Private)] ← Default
   - [Set Up Cloud Sync]
   - [Configure Self-Hosted]
   - [Not Now]

4. If "Local Storage":
   ✅ SQLite created at ~/.vscode-fork/memory.db
   ✅ File watching starts
   ✅ Done!

5. If "Cloud Sync":
   → Show setup wizard
   → User chooses provider (Neon/Supabase/Custom)
   → User provides credentials
   → Test connection
   → Setup complete!

6. If "Self-Hosted":
   → Show enterprise setup wizard
   → User provides Postgres connection details
   → Test connection
   → Check pgvector availability
   → Setup complete!
```

### Cloud Sync Setup Wizard

```
Step 1: Choose Provider
┌─────────────────────────────────────────┐
│  Select Cloud Storage Provider          │
│                                          │
│  ○ Neon (Recommended)                   │
│  ○ Supabase                             │
│  ○ Custom PostgreSQL                    │
│                                          │
│  [Next]  [Cancel]                       │
└─────────────────────────────────────────┘

Step 2: Provide Credentials
┌─────────────────────────────────────────┐
│  Neon Connection Details                │
│                                          │
│  Connection String:                     │
│  [postgresql://user:pass@host/db      ]│
│                                          │
│  [Test Connection]                      │
│                                          │
│  [Back]  [Next]  [Cancel]               │
└─────────────────────────────────────────┘

Step 3: Sync Settings
┌─────────────────────────────────────────┐
│  Sync Configuration                     │
│                                          │
│  Sync Strategy:                         │
│  ○ Manual (Sync when I click "Sync")   │
│  ○ Auto (Sync every 5 minutes)         │
│  ○ On Close (Sync when VS Code closes) │
│                                          │
│  Projects to Sync:                      │
│  ☑ All projects                         │
│  ☐ Select specific projects...         │
│                                          │
│  [Back]  [Finish]  [Cancel]             │
└─────────────────────────────────────────┘
```

---

## 11. Next Steps

**Immediate priorities:**
1. Wait for compile to complete
2. Test existing features (AI Orchestrator, Office Integration)
3. Begin Phase 1: Core Memory Service with SQLite

**Questions before implementation:**
- Should we use Vercel's public API or authenticated API for templates?
- Embedding provider preference: OpenAI (cloud) or Ollama (local)?
- Default sync strategy: Manual, Auto, or On-Close?

---

**Document Status**: Draft for Review
**Last Updated**: 2025-10-24
**Author**: Architecture Planning Session
