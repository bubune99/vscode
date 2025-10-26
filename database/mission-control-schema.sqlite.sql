-- ==================================================================
-- MISSION CONTROL DATABASE SCHEMA - SQLite Version
-- Blueprint-First Development System
-- ==================================================================
--
-- PHILOSOPHY: Modeled after construction industry workflow
-- - Orchestrator = Architect + General Contractor
-- - Specialist Agents = Trades (plumber, electrician, etc.)
-- - Complete project blueprint created BEFORE any code
-- - Hierarchical structure: Project → Phases → Features → Tasks
-- - Pivot management with automatic pause and impact analysis
-- - Quality checkpoints built into the process
--
-- ==================================================================

-- Enable foreign key constraints
PRAGMA foreign_keys = ON;

-- Enable JSON functions (SQLite 3.38.0+)
-- SELECT json_valid('{"test": 1}'); -- Should return 1

-- ==================================================================
-- TIER 1: PROJECT & BLUEPRINT MANAGEMENT
-- ==================================================================

-- Projects - Top-level entity (the "construction site")
CREATE TABLE projects (
    id TEXT PRIMARY KEY, -- UUID as TEXT
    name TEXT NOT NULL,
    description TEXT NOT NULL,
    workspace_path TEXT UNIQUE NOT NULL,
    tech_stack TEXT DEFAULT '[]' CHECK(json_valid(tech_stack)), -- JSON array
    execution_mode TEXT NOT NULL DEFAULT 'semi_autonomous'
        CHECK(execution_mode IN ('fully_autonomous', 'semi_autonomous', 'hands_on', 'parallel')),
    status TEXT NOT NULL DEFAULT 'planning'
        CHECK(status IN ('planning', 'approved', 'in_progress', 'paused', 'completed', 'cancelled')),
    blueprint_version INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    approved_at TEXT,
    started_at TEXT,
    completed_at TEXT,
    metadata TEXT DEFAULT '{}' CHECK(json_valid(metadata))
    -- metadata structure:
    -- {
    --   "target_completion": "2025-12-31T23:59:59Z",
    --   "team_composition": {"v0": "UI", "claude": "Backend"},
    --   "deployment_target": "vercel",
    --   "estimated_cost": {"dev_hours": 120, "api_cost_usd": 50},
    --   "business_requirements": {"must_haves": [...], "nice_to_haves": [...]}
    -- }
);

-- Blueprint Versions - For pivot management (architectural plan revisions)
CREATE TABLE blueprint_versions (
    id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    version_number INTEGER NOT NULL,
    created_by TEXT NOT NULL CHECK (created_by IN ('user', 'orchestrator')),
    reason_for_change TEXT NOT NULL,
    impact_analysis TEXT NOT NULL CHECK(json_valid(impact_analysis)),
    approved INTEGER NOT NULL DEFAULT 0 CHECK(approved IN (0, 1)), -- Boolean
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    approved_at TEXT,
    changes TEXT NOT NULL DEFAULT '{}' CHECK(json_valid(changes)),
    -- changes structure:
    -- {
    --   "added_phases": [{phase_id: "...", name: "..."}],
    --   "removed_phases": [{phase_id: "...", reason: "..."}],
    --   "modified_tasks": [{task_id: "...", old_agent: "...", new_agent: "..."}],
    --   "dependency_changes": [...]
    -- }
    UNIQUE (project_id, version_number)
);

-- System Architecture - Technical blueprint (structural/electrical plans)
CREATE TABLE system_architecture (
    id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    blueprint_version INTEGER NOT NULL,
    architecture_type TEXT NOT NULL
        CHECK (architecture_type IN ('frontend', 'backend', 'infrastructure', 'integration')),
    component_name TEXT NOT NULL,
    description TEXT NOT NULL,
    tech_choices TEXT NOT NULL DEFAULT '{}' CHECK(json_valid(tech_choices)),
    design_rationale TEXT NOT NULL,
    related_docs TEXT DEFAULT '[]' CHECK(json_valid(related_docs)),
    metadata TEXT DEFAULT '{}' CHECK(json_valid(metadata)),
    UNIQUE (project_id, blueprint_version, component_name)
);

-- ==================================================================
-- TIER 2: WORK BREAKDOWN STRUCTURE
-- ==================================================================

-- Project Phases - Construction-style phases (Foundation, Framing, Finishing)
CREATE TABLE project_phases (
    id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    blueprint_version INTEGER NOT NULL,
    phase_number INTEGER NOT NULL,
    name TEXT NOT NULL,
    description TEXT NOT NULL,
    target_start_date TEXT,
    target_end_date TEXT,
    actual_start_date TEXT,
    actual_end_date TEXT,
    status TEXT NOT NULL DEFAULT 'planned'
        CHECK(status IN ('planned', 'in_progress', 'paused', 'completed', 'skipped')),
    completion_percentage INTEGER NOT NULL DEFAULT 0
        CHECK (completion_percentage >= 0 AND completion_percentage <= 100),
    requires_user_approval INTEGER NOT NULL DEFAULT 0 CHECK(requires_user_approval IN (0, 1)),
    metadata TEXT DEFAULT '{}' CHECK(json_valid(metadata)),
    UNIQUE (project_id, blueprint_version, phase_number)
);

-- Features/Epics - Major deliverables within a phase
CREATE TABLE features (
    id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    phase_id TEXT NOT NULL REFERENCES project_phases(id) ON DELETE CASCADE,
    blueprint_version INTEGER NOT NULL,
    feature_number TEXT NOT NULL,
    name TEXT NOT NULL,
    description TEXT NOT NULL,
    business_value TEXT NOT NULL,
    acceptance_criteria TEXT NOT NULL DEFAULT '[]' CHECK(json_valid(acceptance_criteria)),
    priority TEXT NOT NULL CHECK (priority IN ('critical', 'high', 'medium', 'low')),
    status TEXT NOT NULL DEFAULT 'backlog'
        CHECK(status IN ('backlog', 'planned', 'in_progress', 'review', 'done', 'blocked')),
    estimated_effort_hours INTEGER,
    actual_effort_hours INTEGER,
    assigned_primary_agent TEXT CHECK(assigned_primary_agent IN ('v0', 'claude', 'gemini', 'gpt')),
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    started_at TEXT,
    completed_at TEXT,
    metadata TEXT DEFAULT '{}' CHECK(json_valid(metadata)),
    -- metadata structure:
    -- {
    --   "technical_approach": "...",
    --   "related_files": [...],
    --   "ui_specs": {...},
    --   "api_endpoints": [...]
    -- }
    UNIQUE (project_id, blueprint_version, feature_number)
);

-- Tasks - Atomic units of work (what each agent actually executes)
CREATE TABLE tasks (
    id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    feature_id TEXT NOT NULL REFERENCES features(id) ON DELETE CASCADE,
    parent_task_id TEXT REFERENCES tasks(id) ON DELETE SET NULL,
    blueprint_version INTEGER NOT NULL,
    task_number TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    task_type TEXT NOT NULL
        CHECK(task_type IN ('setup', 'implementation', 'testing', 'documentation', 'integration', 'bug_fix', 'refactoring')),
    assigned_agent TEXT NOT NULL CHECK(assigned_agent IN ('v0', 'claude', 'gemini', 'gpt', 'orchestrator')),
    status TEXT NOT NULL DEFAULT 'todo'
        CHECK(status IN ('todo', 'in_progress', 'blocked', 'review', 'done', 'skipped')),
    priority INTEGER NOT NULL CHECK (priority >= 1 AND priority <= 5),
    estimated_time_minutes INTEGER,
    actual_time_minutes INTEGER,
    success_criteria TEXT NOT NULL DEFAULT '[]' CHECK(json_valid(success_criteria)),
    context_for_agent TEXT NOT NULL DEFAULT '{}' CHECK(json_valid(context_for_agent)),
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    assigned_at TEXT,
    started_at TEXT,
    completed_at TEXT,
    validated_at TEXT,
    metadata TEXT DEFAULT '{}' CHECK(json_valid(metadata)),
    -- metadata structure:
    -- {
    --   "blocking_reason": "...",
    --   "files_to_create": [...],
    --   "files_to_modify": [...],
    --   "related_docs": [...],
    --   "validation_notes": "..."
    -- }
    UNIQUE (project_id, blueprint_version, task_number),
    CHECK (id != parent_task_id)
);

-- Task Dependencies - The dependency graph
CREATE TABLE task_dependencies (
    id TEXT PRIMARY KEY,
    task_id TEXT NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    depends_on_task_id TEXT NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    dependency_type TEXT NOT NULL
        CHECK(dependency_type IN ('blocks', 'requires', 'follows', 'related')),
    is_satisfied INTEGER NOT NULL DEFAULT 0 CHECK(is_satisfied IN (0, 1)),
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    notes TEXT,
    CHECK (task_id != depends_on_task_id),
    UNIQUE (task_id, depends_on_task_id)
);

-- ==================================================================
-- TIER 3: ORCHESTRATOR & AGENT COORDINATION
-- ==================================================================

-- Orchestrator Sessions - The general contractor's work log
CREATE TABLE orchestrator_sessions (
    id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    session_type TEXT NOT NULL
        CHECK(session_type IN ('planning', 'coordination', 'validation', 'pivot_analysis')),
    started_at TEXT NOT NULL DEFAULT (datetime('now')),
    ended_at TEXT,
    orchestrator_model TEXT NOT NULL,
    decisions_made TEXT DEFAULT '[]' CHECK(json_valid(decisions_made)),
    issues_identified TEXT DEFAULT '[]' CHECK(json_valid(issues_identified)),
    user_consultations TEXT DEFAULT '[]' CHECK(json_valid(user_consultations)),
    metadata TEXT DEFAULT '{}' CHECK(json_valid(metadata))
);

-- Orchestrator Decisions - Design decisions and rationale (the WHY layer)
CREATE TABLE orchestrator_decisions (
    id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    session_id TEXT NOT NULL REFERENCES orchestrator_sessions(id) ON DELETE CASCADE,
    decision_type TEXT NOT NULL
        CHECK(decision_type IN ('architecture', 'agent_assignment', 'task_sequence', 'pivot', 'quality_gate')),
    decision_context TEXT NOT NULL,
    decision_made TEXT NOT NULL,
    rationale TEXT NOT NULL,
    alternatives_considered TEXT DEFAULT '[]' CHECK(json_valid(alternatives_considered)),
    user_approved INTEGER, -- null = auto, 0/1 = user decision
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    metadata TEXT DEFAULT '{}' CHECK(json_valid(metadata))
);

-- Agent Work Sessions - Each trade's work log
CREATE TABLE agent_work_sessions (
    id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    task_id TEXT NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    conversation_id TEXT,  -- FK added after conversations table
    agent_type TEXT NOT NULL CHECK(agent_type IN ('v0', 'claude', 'gemini', 'gpt', 'orchestrator')),
    model_used TEXT NOT NULL,
    context_provided TEXT NOT NULL DEFAULT '{}' CHECK(json_valid(context_provided)),
    started_at TEXT NOT NULL DEFAULT (datetime('now')),
    last_activity_at TEXT NOT NULL DEFAULT (datetime('now')),
    ended_at TEXT,
    status TEXT NOT NULL DEFAULT 'active'
        CHECK(status IN ('active', 'paused', 'completed', 'failed')),
    output_summary TEXT,
    files_created TEXT DEFAULT '[]' CHECK(json_valid(files_created)),
    files_modified TEXT DEFAULT '[]' CHECK(json_valid(files_modified)),
    tokens_used INTEGER DEFAULT 0,
    cost_usd REAL,
    metadata TEXT DEFAULT '{}' CHECK(json_valid(metadata))
);

-- ==================================================================
-- TIER 4: CONVERSATIONS & MESSAGES
-- ==================================================================

-- Conversations - Chat sessions (project-wide or task-specific)
CREATE TABLE conversations (
    id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    task_id TEXT REFERENCES tasks(id) ON DELETE SET NULL,
    conversation_type TEXT NOT NULL
        CHECK(conversation_type IN ('planning', 'execution', 'review', 'pivot', 'general')),
    title TEXT NOT NULL,
    active_agent TEXT CHECK(active_agent IN ('v0', 'claude', 'gemini', 'gpt', 'orchestrator')),
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    last_message_at TEXT,
    metadata TEXT DEFAULT '{}' CHECK(json_valid(metadata))
);

-- Messages - Individual chat messages
CREATE TABLE messages (
    id TEXT PRIMARY KEY,
    conversation_id TEXT NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    agent_type TEXT CHECK(agent_type IN ('v0', 'claude', 'gemini', 'gpt', 'orchestrator')), -- null = user
    role TEXT NOT NULL CHECK(role IN ('user', 'assistant', 'orchestrator', 'system')),
    content TEXT NOT NULL,
    model_used TEXT,
    tokens_input INTEGER,
    tokens_output INTEGER,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    parent_message_id TEXT REFERENCES messages(id) ON DELETE SET NULL,
    metadata TEXT DEFAULT '{}' CHECK(json_valid(metadata))
    -- metadata structure:
    -- {
    --   "context_snapshot": {...},
    --   "attachments": [...],
    --   "referenced_tasks": [...]
    -- }
);

-- ==================================================================
-- TIER 5: DOCUMENTATION & ARTIFACTS
-- ==================================================================

-- Project Documentation - Linked docs (requirements, designs, specs)
CREATE TABLE project_documentation (
    id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    phase_id TEXT REFERENCES project_phases(id) ON DELETE SET NULL,
    feature_id TEXT REFERENCES features(id) ON DELETE SET NULL,
    doc_type TEXT NOT NULL
        CHECK(doc_type IN ('requirements', 'design', 'architecture', 'api_spec', 'user_story', 'test_plan')),
    title TEXT NOT NULL,
    file_path TEXT,
    content TEXT,
    url TEXT,
    tags TEXT DEFAULT '[]' CHECK(json_valid(tags)),
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Project Artifacts - Code files, deployments, test results
CREATE TABLE project_artifacts (
    id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    task_id TEXT REFERENCES tasks(id) ON DELETE SET NULL,
    artifact_type TEXT NOT NULL
        CHECK(artifact_type IN ('source_code', 'test', 'deployment', 'build', 'documentation')),
    file_path TEXT NOT NULL,
    created_by_agent TEXT CHECK(created_by_agent IN ('v0', 'claude', 'gemini', 'gpt', 'orchestrator')),
    git_commit_hash TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    last_modified_at TEXT NOT NULL DEFAULT (datetime('now')),
    metadata TEXT DEFAULT '{}' CHECK(json_valid(metadata))
    -- metadata structure:
    -- {
    --   "lines_of_code": 1234,
    --   "test_coverage": 85.5,
    --   "review_status": "approved",
    --   "deployment_url": "https://..."
    -- }
);

-- ==================================================================
-- TIER 6: QUALITY & VALIDATION
-- ==================================================================

-- Quality Checkpoints - Built-in validation points
CREATE TABLE quality_checkpoints (
    id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    phase_id TEXT REFERENCES project_phases(id) ON DELETE SET NULL,
    feature_id TEXT REFERENCES features(id) ON DELETE SET NULL,
    task_id TEXT REFERENCES tasks(id) ON DELETE SET NULL,
    checkpoint_type TEXT NOT NULL
        CHECK(checkpoint_type IN ('unit_test', 'integration_test', 'code_review', 'spec_validation', 'user_acceptance')),
    status TEXT NOT NULL DEFAULT 'pending'
        CHECK(status IN ('pending', 'running', 'passed', 'failed')),
    validation_criteria TEXT NOT NULL DEFAULT '{}' CHECK(json_valid(validation_criteria)),
    results TEXT DEFAULT '{}' CHECK(json_valid(results)),
    validated_by TEXT NOT NULL CHECK (validated_by IN ('orchestrator', 'automated', 'user')),
    validated_at TEXT,
    metadata TEXT DEFAULT '{}' CHECK(json_valid(metadata))
);

-- Project Issues - Problems encountered during execution
CREATE TABLE project_issues (
    id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    task_id TEXT REFERENCES tasks(id) ON DELETE SET NULL,
    issue_type TEXT NOT NULL
        CHECK(issue_type IN ('blocker', 'missing_requirement', 'technical_issue', 'dependency', 'pivot_needed')),
    severity TEXT NOT NULL CHECK(severity IN ('critical', 'high', 'medium', 'low')),
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    detected_by TEXT NOT NULL CHECK(detected_by IN ('v0', 'claude', 'gemini', 'gpt', 'orchestrator')),
    status TEXT NOT NULL DEFAULT 'open'
        CHECK(status IN ('open', 'consulting_user', 'resolved', 'wont_fix')),
    resolution TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    resolved_at TEXT,
    metadata TEXT DEFAULT '{}' CHECK(json_valid(metadata))
);

-- ==================================================================
-- TIER 7: MEMORY-AGENT INTEGRATION
-- ==================================================================

-- Project Context Snapshots - Link to Memory-Agent analysis
CREATE TABLE project_context_snapshots (
    id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    memory_agent_project_id TEXT,  -- FK to Memory-Agent DB (external)
    snapshot_type TEXT NOT NULL CHECK(snapshot_type IN ('initial', 'milestone', 'pivot', 'final')),
    code_patterns_detected TEXT DEFAULT '[]' CHECK(json_valid(code_patterns_detected)),
    architecture_analysis TEXT DEFAULT '{}' CHECK(json_valid(architecture_analysis)),
    tech_debt_score REAL,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    metadata TEXT DEFAULT '{}' CHECK(json_valid(metadata))
);

-- ==================================================================
-- INDEXES FOR PERFORMANCE
-- ==================================================================

-- Projects
CREATE INDEX idx_projects_workspace_path ON projects(workspace_path);
CREATE INDEX idx_projects_status ON projects(status);

-- Blueprint Versions
CREATE INDEX idx_blueprint_versions_project ON blueprint_versions(project_id, version_number);

-- System Architecture
CREATE INDEX idx_system_architecture_project_version ON system_architecture(project_id, blueprint_version);

-- Project Phases
CREATE INDEX idx_project_phases_project ON project_phases(project_id, blueprint_version);
CREATE INDEX idx_project_phases_status ON project_phases(status);

-- Features
CREATE INDEX idx_features_project ON features(project_id, blueprint_version);
CREATE INDEX idx_features_phase ON features(phase_id);
CREATE INDEX idx_features_status ON features(status);
CREATE INDEX idx_features_assigned_agent ON features(assigned_primary_agent);

-- Tasks
CREATE INDEX idx_tasks_project ON tasks(project_id, blueprint_version);
CREATE INDEX idx_tasks_feature ON tasks(feature_id);
CREATE INDEX idx_tasks_parent ON tasks(parent_task_id);
CREATE INDEX idx_tasks_assigned_agent ON tasks(assigned_agent);
CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_tasks_priority ON tasks(priority);

-- Task Dependencies
CREATE INDEX idx_task_dependencies_task ON task_dependencies(task_id);
CREATE INDEX idx_task_dependencies_depends_on ON task_dependencies(depends_on_task_id);
CREATE INDEX idx_task_dependencies_satisfied ON task_dependencies(is_satisfied);

-- Orchestrator Sessions
CREATE INDEX idx_orchestrator_sessions_project ON orchestrator_sessions(project_id);
CREATE INDEX idx_orchestrator_sessions_type ON orchestrator_sessions(session_type);

-- Orchestrator Decisions
CREATE INDEX idx_orchestrator_decisions_project ON orchestrator_decisions(project_id);
CREATE INDEX idx_orchestrator_decisions_session ON orchestrator_decisions(session_id);

-- Agent Work Sessions
CREATE INDEX idx_agent_work_sessions_project ON agent_work_sessions(project_id);
CREATE INDEX idx_agent_work_sessions_task ON agent_work_sessions(task_id);
CREATE INDEX idx_agent_work_sessions_agent ON agent_work_sessions(agent_type);
CREATE INDEX idx_agent_work_sessions_status ON agent_work_sessions(status);

-- Conversations
CREATE INDEX idx_conversations_project ON conversations(project_id);
CREATE INDEX idx_conversations_task ON conversations(task_id);
CREATE INDEX idx_conversations_type ON conversations(conversation_type);

-- Messages
CREATE INDEX idx_messages_conversation ON messages(conversation_id);
CREATE INDEX idx_messages_created_at ON messages(created_at);

-- Project Documentation
CREATE INDEX idx_project_documentation_project ON project_documentation(project_id);
CREATE INDEX idx_project_documentation_phase ON project_documentation(phase_id);
CREATE INDEX idx_project_documentation_feature ON project_documentation(feature_id);

-- Project Artifacts
CREATE INDEX idx_project_artifacts_project ON project_artifacts(project_id);
CREATE INDEX idx_project_artifacts_task ON project_artifacts(task_id);
CREATE INDEX idx_project_artifacts_type ON project_artifacts(artifact_type);

-- Quality Checkpoints
CREATE INDEX idx_quality_checkpoints_project ON quality_checkpoints(project_id);
CREATE INDEX idx_quality_checkpoints_task ON quality_checkpoints(task_id);
CREATE INDEX idx_quality_checkpoints_status ON quality_checkpoints(status);

-- Project Issues
CREATE INDEX idx_project_issues_project ON project_issues(project_id);
CREATE INDEX idx_project_issues_task ON project_issues(task_id);
CREATE INDEX idx_project_issues_status ON project_issues(status);
CREATE INDEX idx_project_issues_severity ON project_issues(severity);

-- Project Context Snapshots
CREATE INDEX idx_project_context_snapshots_project ON project_context_snapshots(project_id);

-- ==================================================================
-- SETUP COMPLETE
-- ==================================================================
