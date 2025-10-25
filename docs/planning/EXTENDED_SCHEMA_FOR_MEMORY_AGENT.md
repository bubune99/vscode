# Extended Schema for Memory-Agent Integration

## Overview
This document defines the additional database tables needed to integrate the VS Code fork's **Project Manager** and **Office Integration** features with the existing Memory-Agent PostgreSQL database.

---

## Integration Strategy

### Existing Memory-Agent Database: `cascade_memory`

The Memory-Agent already has a comprehensive 5W+H schema with 60+ tables. We will **extend** this database with additional tables for:

1. **Project Manager** - Vercel templates, project scaffolding, git integration
2. **Office Integration** - Microsoft Office document tracking, MCP tool usage
3. **VS Code Integration** - Editor state, file interactions, telemetry

---

## New Tables for Project Manager

### 1. `vscode_projects`
Main projects table for the VS Code Project Manager.

```sql
CREATE TABLE vscode_projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_path TEXT UNIQUE NOT NULL,
    project_name TEXT NOT NULL,

    -- Template information
    template_id UUID REFERENCES vscode_templates(id),
    template_name TEXT,
    template_version TEXT,

    -- Git integration
    git_remote TEXT,
    git_branch TEXT DEFAULT 'main',
    git_initialized BOOLEAN DEFAULT false,

    -- Database branching (Neon support)
    db_branch_enabled BOOLEAN DEFAULT false,
    db_branch_id TEXT,  -- Neon branch ID

    -- Project metadata
    framework TEXT,  -- 'nextjs', 'react', 'vue', etc.
    package_manager TEXT DEFAULT 'npm',  -- 'npm', 'pnpm', 'yarn'
    dependencies_installed BOOLEAN DEFAULT false,

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    last_opened TIMESTAMPTZ,
    last_built TIMESTAMPTZ,

    -- Link to Memory-Agent
    memory_agent_project_id VARCHAR(100),  -- References project_structures.project_id

    -- Additional metadata
    metadata JSONB DEFAULT '{}'::jsonb,

    CONSTRAINT fk_memory_agent
        FOREIGN KEY (memory_agent_project_id)
        REFERENCES project_structures(project_id)
);

CREATE INDEX idx_vscode_projects_workspace ON vscode_projects(workspace_path);
CREATE INDEX idx_vscode_projects_template ON vscode_projects(template_id);
CREATE INDEX idx_vscode_projects_last_opened ON vscode_projects(last_opened DESC);
CREATE INDEX idx_vscode_projects_memory_agent ON vscode_projects(memory_agent_project_id);
```

### 2. `vscode_templates`
Vercel and custom templates catalog.

```sql
CREATE TABLE vscode_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Source information
    source TEXT NOT NULL,  -- 'vercel', 'github', 'custom'
    external_id TEXT UNIQUE,  -- Vercel template ID or GitHub repo

    -- Template details
    name TEXT NOT NULL,
    display_name TEXT NOT NULL,
    description TEXT,
    repo_url TEXT NOT NULL,
    demo_url TEXT,

    -- Categorization
    framework TEXT NOT NULL,  -- 'nextjs', 'react', 'vue', etc.
    category TEXT,  -- 'ecommerce', 'blog', 'dashboard', etc.
    tags TEXT[],

    -- Popularity metrics
    stars INTEGER DEFAULT 0,
    downloads INTEGER DEFAULT 0,
    last_used TIMESTAMPTZ,
    usage_count INTEGER DEFAULT 0,

    -- Template metadata
    version TEXT,
    min_node_version TEXT,
    required_tools TEXT[],  -- ['git', 'docker', etc.]

    -- Update tracking
    last_updated TIMESTAMPTZ,
    last_checked TIMESTAMPTZ,
    update_available BOOLEAN DEFAULT false,
    latest_version TEXT,

    -- Template content
    scaffold_config JSONB,  -- Template-specific configuration
    environment_vars JSONB,  -- Required env vars

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_vscode_templates_source ON vscode_templates(source);
CREATE INDEX idx_vscode_templates_framework ON vscode_templates(framework);
CREATE INDEX idx_vscode_templates_category ON vscode_templates(category);
CREATE INDEX idx_vscode_templates_external_id ON vscode_templates(external_id);
CREATE INDEX idx_vscode_templates_usage ON vscode_templates(usage_count DESC);
```

### 3. `vscode_project_templates`
Many-to-many relationship tracking which projects used which templates.

```sql
CREATE TABLE vscode_project_templates (
    project_id UUID REFERENCES vscode_projects(id) ON DELETE CASCADE,
    template_id UUID REFERENCES vscode_templates(id),

    -- Import details
    imported_at TIMESTAMPTZ DEFAULT NOW(),
    template_version TEXT,
    modifications_made JSONB,  -- What was customized after import

    -- Success tracking
    import_successful BOOLEAN DEFAULT true,
    build_successful BOOLEAN,
    first_deployment_date TIMESTAMPTZ,

    PRIMARY KEY (project_id, template_id)
);

CREATE INDEX idx_project_templates_project ON vscode_project_templates(project_id);
CREATE INDEX idx_project_templates_template ON vscode_project_templates(template_id);
```

### 4. `vscode_project_tasks`
Task runner integration (npm scripts, build tasks).

```sql
CREATE TABLE vscode_project_tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES vscode_projects(id) ON DELETE CASCADE,

    -- Task details
    task_name TEXT NOT NULL,
    task_type TEXT NOT NULL,  -- 'npm', 'build', 'test', 'deploy', 'custom'
    command TEXT NOT NULL,
    description TEXT,

    -- Execution tracking
    last_run TIMESTAMPTZ,
    last_duration_ms INTEGER,
    success_rate FLOAT DEFAULT 1.0,
    total_runs INTEGER DEFAULT 0,
    failed_runs INTEGER DEFAULT 0,

    -- Configuration
    auto_run_on TEXT[],  -- ['save', 'startup', 'git-commit']
    requires_confirmation BOOLEAN DEFAULT false,

    created_at TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE(project_id, task_name)
);

CREATE INDEX idx_project_tasks_project ON vscode_project_tasks(project_id);
CREATE INDEX idx_project_tasks_type ON vscode_project_tasks(task_type);
```

### 5. `vscode_git_branches`
Track git branches and their associated database branches.

```sql
CREATE TABLE vscode_git_branches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES vscode_projects(id) ON DELETE CASCADE,

    -- Git branch details
    branch_name TEXT NOT NULL,
    is_active BOOLEAN DEFAULT false,
    parent_branch TEXT,

    -- Database branching (Neon)
    db_branch_id TEXT,  -- Neon branch ID
    db_branch_created_at TIMESTAMPTZ,
    db_branch_synced BOOLEAN DEFAULT false,

    -- Branch metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    last_checkout TIMESTAMPTZ,
    commits_ahead INTEGER DEFAULT 0,
    commits_behind INTEGER DEFAULT 0,

    -- Link to Memory-Agent decision tracking
    decision_episode_id VARCHAR(64) REFERENCES decision_episodes(id),

    UNIQUE(project_id, branch_name)
);

CREATE INDEX idx_git_branches_project ON vscode_git_branches(project_id);
CREATE INDEX idx_git_branches_active ON vscode_git_branches(is_active) WHERE is_active = true;
```

---

## New Tables for Office Integration

### 6. `vscode_office_documents`
Track Microsoft Office documents opened/edited in VS Code.

```sql
CREATE TABLE vscode_office_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- File details
    file_path TEXT UNIQUE NOT NULL,
    file_name TEXT NOT NULL,
    document_type TEXT NOT NULL,  -- 'word', 'excel', 'powerpoint'
    file_size_bytes BIGINT,
    content_hash TEXT,

    -- Project association
    project_id UUID REFERENCES vscode_projects(id) ON DELETE SET NULL,
    workspace_path TEXT,

    -- Access tracking
    first_opened TIMESTAMPTZ DEFAULT NOW(),
    last_opened TIMESTAMPTZ DEFAULT NOW(),
    last_modified TIMESTAMPTZ,
    open_count INTEGER DEFAULT 1,
    edit_count INTEGER DEFAULT 0,

    -- Version tracking
    document_version TEXT,
    office_version TEXT,

    -- Metadata
    author TEXT,
    title TEXT,
    tags TEXT[],
    metadata JSONB DEFAULT '{}'::jsonb,

    -- AI interaction tracking
    ai_edits_count INTEGER DEFAULT 0,
    last_ai_interaction TIMESTAMPTZ,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_office_docs_path ON vscode_office_documents(file_path);
CREATE INDEX idx_office_docs_type ON vscode_office_documents(document_type);
CREATE INDEX idx_office_docs_project ON vscode_office_documents(project_id);
CREATE INDEX idx_office_docs_last_opened ON vscode_office_documents(last_opened DESC);
```

### 7. `vscode_office_mcp_tools`
Track MCP tool usage for Office automation.

```sql
CREATE TABLE vscode_office_mcp_tools (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Tool details
    tool_name TEXT NOT NULL,
    tool_category TEXT NOT NULL,  -- 'word', 'excel', 'powerpoint'
    tool_action TEXT NOT NULL,  -- 'append', 'format', 'chart', etc.

    -- Tool metadata
    display_name TEXT NOT NULL,
    description TEXT,
    required_params JSONB,
    optional_params JSONB,

    -- Usage tracking
    total_executions INTEGER DEFAULT 0,
    successful_executions INTEGER DEFAULT 0,
    failed_executions INTEGER DEFAULT 0,
    avg_execution_time_ms INTEGER,

    -- Popularity
    last_used TIMESTAMPTZ,
    usage_trend TEXT,  -- 'increasing', 'decreasing', 'stable'

    -- Link to MCP schema
    mcp_tool_id UUID,  -- References mcp_tools.id if exists

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE(tool_name)
);

CREATE INDEX idx_office_mcp_tools_category ON vscode_office_mcp_tools(tool_category);
CREATE INDEX idx_office_mcp_tools_usage ON vscode_office_mcp_tools(total_executions DESC);
```

### 8. `vscode_office_tool_executions`
Log of every Office MCP tool execution.

```sql
CREATE TABLE vscode_office_tool_executions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Execution context
    tool_id UUID REFERENCES vscode_office_mcp_tools(id),
    tool_name TEXT NOT NULL,
    document_id UUID REFERENCES vscode_office_documents(id) ON DELETE SET NULL,

    -- Execution details
    executed_at TIMESTAMPTZ DEFAULT NOW(),
    execution_time_ms INTEGER,
    success BOOLEAN NOT NULL,
    error_message TEXT,

    -- Input/Output
    input_params JSONB,
    output_result JSONB,

    -- User context
    user_id TEXT,  -- If multi-user
    agent_type TEXT,  -- 'claude', 'gpt', 'gemini', 'v0', etc.

    -- Telemetry
    session_id TEXT,
    interaction_id TEXT
);

CREATE INDEX idx_office_executions_tool ON vscode_office_tool_executions(tool_id);
CREATE INDEX idx_office_executions_document ON vscode_office_tool_executions(document_id);
CREATE INDEX idx_office_executions_time ON vscode_office_tool_executions(executed_at DESC);
CREATE INDEX idx_office_executions_success ON vscode_office_tool_executions(success);
```

---

## New Tables for VS Code Integration

### 9. `vscode_file_interactions`
Track file opens, edits, and interactions for Memory-Agent learning.

```sql
CREATE TABLE vscode_file_interactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- File details
    file_path TEXT NOT NULL,
    project_id UUID REFERENCES vscode_projects(id) ON DELETE CASCADE,

    -- Interaction type
    action_type TEXT NOT NULL,  -- 'open', 'edit', 'save', 'close', 'delete', 'rename'
    timestamp TIMESTAMPTZ DEFAULT NOW(),

    -- Context
    file_extension TEXT,
    file_size_bytes BIGINT,
    lines_changed INTEGER,

    -- Time tracking
    time_spent_seconds INTEGER,

    -- Link to Memory-Agent
    memory_agent_file_id INTEGER,  -- References implementation_details.id

    -- Additional context
    triggered_by TEXT,  -- 'user', 'ai', 'auto-save', 'refactor'
    metadata JSONB DEFAULT '{}'::jsonb
);

CREATE INDEX idx_file_interactions_path ON vscode_file_interactions(file_path);
CREATE INDEX idx_file_interactions_project ON vscode_file_interactions(project_id);
CREATE INDEX idx_file_interactions_timestamp ON vscode_file_interactions(timestamp DESC);
CREATE INDEX idx_file_interactions_action ON vscode_file_interactions(action_type);
```

### 10. `vscode_ai_agent_sessions`
Track AI agent (v0, Claude, Gemini, GPT) usage sessions.

```sql
CREATE TABLE vscode_ai_agent_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Session details
    agent_type TEXT NOT NULL,  -- 'v0', 'claude', 'gemini', 'gpt'
    session_id TEXT UNIQUE NOT NULL,
    project_id UUID REFERENCES vscode_projects(id) ON DELETE CASCADE,

    -- Session timing
    started_at TIMESTAMPTZ DEFAULT NOW(),
    ended_at TIMESTAMPTZ,
    duration_seconds INTEGER,

    -- Usage metrics
    prompt_count INTEGER DEFAULT 0,
    tokens_used INTEGER DEFAULT 0,
    files_modified INTEGER DEFAULT 0,
    files_created INTEGER DEFAULT 0,

    -- Task tracking
    task_description TEXT,
    task_completed BOOLEAN DEFAULT false,
    task_category TEXT,  -- 'feature', 'bug-fix', 'refactor', 'documentation'

    -- Quality metrics
    validation_passed BOOLEAN,
    tests_passed INTEGER,
    tests_failed INTEGER,

    -- Link to Memory-Agent decisions
    decision_episode_id VARCHAR(64) REFERENCES decision_episodes(id),

    -- Metadata
    metadata JSONB DEFAULT '{}'::jsonb
);

CREATE INDEX idx_ai_sessions_agent ON vscode_ai_agent_sessions(agent_type);
CREATE INDEX idx_ai_sessions_project ON vscode_ai_agent_sessions(project_id);
CREATE INDEX idx_ai_sessions_started ON vscode_ai_agent_sessions(started_at DESC);
CREATE INDEX idx_ai_sessions_task_category ON vscode_ai_agent_sessions(task_category);
```

### 11. `vscode_telemetry_events`
Privacy-conscious telemetry for analytics (opt-in).

```sql
CREATE TABLE vscode_telemetry_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Event details
    event_type TEXT NOT NULL,  -- 'template_import', 'office_tool_used', 'ai_agent_selected', etc.
    event_category TEXT NOT NULL,  -- 'project_manager', 'office_integration', 'ai_orchestrator'
    timestamp TIMESTAMPTZ DEFAULT NOW(),

    -- Context
    project_id UUID REFERENCES vscode_projects(id) ON DELETE SET NULL,

    -- Anonymous user ID (hashed)
    user_id_hash TEXT,

    -- Event metadata (sanitized, no sensitive data)
    metadata JSONB DEFAULT '{}'::jsonb,

    -- Privacy flags
    anonymized BOOLEAN DEFAULT true,
    collected_with_consent BOOLEAN DEFAULT false
);

CREATE INDEX idx_telemetry_type ON vscode_telemetry_events(event_type);
CREATE INDEX idx_telemetry_category ON vscode_telemetry_events(event_category);
CREATE INDEX idx_telemetry_timestamp ON vscode_telemetry_events(timestamp DESC);
CREATE INDEX idx_telemetry_project ON vscode_telemetry_events(project_id);
```

---

## Cross-Schema Integration Views

### Comprehensive Project View

```sql
CREATE VIEW vscode_project_overview AS
SELECT
    vp.id as project_id,
    vp.project_name,
    vp.workspace_path,
    vp.framework,
    vt.display_name as template_name,

    -- Memory-Agent integration
    ps.folder_structure,
    ps.architecture_patterns,

    -- Activity metrics
    vp.last_opened,
    COUNT(DISTINCT vfi.id) as total_interactions,
    COUNT(DISTINCT vod.id) as office_documents_count,
    COUNT(DISTINCT ais.id) as ai_sessions_count,

    -- Git status
    vp.git_branch,
    vp.git_initialized,

    vp.created_at
FROM vscode_projects vp
LEFT JOIN vscode_templates vt ON vp.template_id = vt.id
LEFT JOIN project_structures ps ON vp.memory_agent_project_id = ps.project_id
LEFT JOIN vscode_file_interactions vfi ON vp.id = vfi.project_id
LEFT JOIN vscode_office_documents vod ON vp.id = vod.project_id
LEFT JOIN vscode_ai_agent_sessions ais ON vp.id = ais.project_id
GROUP BY vp.id, vt.display_name, ps.folder_structure, ps.architecture_patterns;
```

### Office Document Activity View

```sql
CREATE VIEW vscode_office_activity AS
SELECT
    vod.id,
    vod.file_name,
    vod.document_type,
    vod.last_opened,
    vod.open_count,
    vod.ai_edits_count,

    -- Tool usage for this document
    COUNT(DISTINCT vote.id) as tool_executions,
    COUNT(DISTINCT vote.id) FILTER (WHERE vote.success = true) as successful_executions,

    -- Project context
    vp.project_name
FROM vscode_office_documents vod
LEFT JOIN vscode_office_tool_executions vote ON vod.id = vote.document_id
LEFT JOIN vscode_projects vp ON vod.project_id = vp.id
GROUP BY vod.id, vp.project_name;
```

### AI Agent Performance View

```sql
CREATE VIEW vscode_ai_agent_performance AS
SELECT
    agent_type,
    COUNT(*) as total_sessions,
    AVG(duration_seconds) as avg_duration_seconds,
    SUM(tokens_used) as total_tokens,
    AVG(tokens_used) as avg_tokens_per_session,
    SUM(files_modified) as total_files_modified,
    SUM(files_created) as total_files_created,

    -- Success metrics
    COUNT(*) FILTER (WHERE task_completed = true) as completed_tasks,
    COUNT(*) FILTER (WHERE validation_passed = true) as validated_tasks,
    AVG(tests_passed::float / NULLIF(tests_passed + tests_failed, 0)) as avg_test_pass_rate
FROM vscode_ai_agent_sessions
GROUP BY agent_type;
```

---

## Migration Script

### Step 1: Backup Existing Database

```bash
pg_dump cascade_memory > backup_before_vscode_integration_$(date +%Y%m%d).sql
```

### Step 2: Apply Extensions Schema

```sql
-- Execute this file in the cascade_memory database
\i EXTENDED_SCHEMA_FOR_MEMORY_AGENT.sql
```

### Step 3: Populate Initial Data

```sql
-- Insert default templates from Vercel
INSERT INTO vscode_templates (source, external_id, name, display_name, description, repo_url, framework, category)
VALUES
    ('vercel', 'nextjs-starter', 'nextjs-starter', 'Next.js Starter', 'A basic Next.js template', 'https://github.com/vercel/next.js/tree/canary/examples/hello-world', 'nextjs', 'starter'),
    ('vercel', 'nextjs-commerce', 'nextjs-commerce', 'Next.js Commerce', 'E-commerce template with Shopify', 'https://github.com/vercel/commerce', 'nextjs', 'ecommerce'),
    ('vercel', 'nextjs-blog', 'nextjs-blog', 'Next.js Blog', 'Blog template with MDX', 'https://github.com/vercel/next.js/tree/canary/examples/blog-starter', 'nextjs', 'blog');

-- Insert Office MCP tools
INSERT INTO vscode_office_mcp_tools (tool_name, tool_category, tool_action, display_name, description)
VALUES
    ('word_com_append', 'word', 'append', 'Append Text', 'Append text to Word document'),
    ('word_com_format', 'word', 'format', 'Format Text', 'Apply formatting to Word text'),
    ('excel_com_write', 'excel', 'write', 'Write Data', 'Write data to Excel sheet'),
    ('excel_com_chart', 'excel', 'chart', 'Create Chart', 'Create chart in Excel'),
    ('ppt_com_add_slide', 'powerpoint', 'add_slide', 'Add Slide', 'Add new slide to PowerPoint');
```

---

## Usage Examples

### Creating a New Project

```typescript
// In VS Code fork
const result = await db.query(`
    INSERT INTO vscode_projects (
        workspace_path,
        project_name,
        template_id,
        framework,
        memory_agent_project_id
    )
    VALUES ($1, $2, $3, $4, $5)
    RETURNING id
`, [
    '/home/user/projects/my-app',
    'My App',
    templateId,
    'nextjs',
    memoryAgentProjectId
]);
```

### Tracking File Interaction

```typescript
// When user opens a file
await db.query(`
    INSERT INTO vscode_file_interactions (
        file_path,
        project_id,
        action_type,
        file_extension
    )
    VALUES ($1, $2, 'open', $3)
`, [filePath, projectId, fileExt]);
```

### Recording AI Agent Session

```typescript
// When AI agent starts work
const sessionId = await db.query(`
    INSERT INTO vscode_ai_agent_sessions (
        agent_type,
        session_id,
        project_id,
        task_description,
        task_category
    )
    VALUES ($1, $2, $3, $4, $5)
    RETURNING id
`, [
    'claude',
    generateSessionId(),
    projectId,
    'Implement user authentication',
    'feature'
]);
```

---

## Benefits of This Integration

### 1. Unified Memory
- All project data in one database
- Cross-reference between Memory-Agent insights and VS Code usage
- Consistent backup and migration strategy

### 2. AI Context Enhancement
- AI agents can query project history from Memory-Agent
- Office documents linked to code projects
- Decision rationale available to all agents

### 3. Analytics & Insights
- Which templates are most successful?
- Which Office tools are most used?
- Which AI agents are most effective?
- How do developers actually use the IDE?

### 4. Privacy-First
- Telemetry opt-in only
- No code content in telemetry
- Anonymous user IDs
- Clear data retention policies

---

## Next Steps

1. **Review this schema** with stakeholders
2. **Test migration** on a backup database
3. **Implement database connection** in VS Code fork
4. **Create repository layer** for these new tables
5. **Integrate with existing services** (ProjectManager, OfficeService, MemoryService)
6. **Add data retention policies** and cleanup jobs
7. **Create monitoring dashboard** for analytics

---

**Document Created:** 2025-10-24
**Status:** Ready for Review
**Target Database:** `cascade_memory` (PostgreSQL 12+)
