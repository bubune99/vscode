-- ==================================================================
-- MISSION CONTROL DATABASE SCHEMA
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

-- ==================================================================
-- ENUMS & TYPES
-- ==================================================================

CREATE TYPE agent_type AS ENUM ('v0', 'claude', 'gemini', 'gpt', 'orchestrator');

CREATE TYPE execution_mode AS ENUM (
    'fully_autonomous',  -- Orchestrator builds entire project
    'semi_autonomous',   -- User approval at phase/feature boundaries
    'hands_on',         -- User approval for each task
    'parallel'          -- Multiple agents working simultaneously
);

CREATE TYPE project_status AS ENUM (
    'planning',      -- Blueprint creation in progress
    'approved',      -- Blueprint approved, ready to start
    'in_progress',   -- Active development
    'paused',        -- Work paused (pivot, blocker, or user pause)
    'completed',     -- Project finished
    'cancelled'      -- Project terminated
);

CREATE TYPE phase_status AS ENUM (
    'planned',       -- Defined in blueprint
    'in_progress',   -- Currently executing
    'paused',        -- Temporarily stopped
    'completed',     -- Phase finished
    'skipped'        -- Skipped due to pivot
);

CREATE TYPE feature_status AS ENUM (
    'backlog',       -- Not yet scheduled
    'planned',       -- Scheduled in blueprint
    'in_progress',   -- Currently being worked on
    'review',        -- Ready for validation
    'done',          -- Completed and validated
    'blocked'        -- Cannot proceed (dependency/issue)
);

CREATE TYPE task_status AS ENUM (
    'todo',          -- Ready to be assigned
    'in_progress',   -- Agent actively working
    'blocked',       -- Cannot proceed
    'review',        -- Awaiting orchestrator validation
    'done',          -- Completed and validated
    'skipped'        -- Skipped due to pivot
);

CREATE TYPE task_type AS ENUM (
    'setup',         -- Environment/tooling setup
    'implementation', -- Feature implementation
    'testing',       -- Test creation/execution
    'documentation', -- Doc writing
    'integration',   -- Connecting components
    'bug_fix',       -- Fixing issues
    'refactoring'    -- Code improvement
);

CREATE TYPE session_type AS ENUM (
    'planning',      -- Blueprint creation
    'coordination',  -- Agent coordination
    'validation',    -- Quality checking
    'pivot_analysis' -- Change impact analysis
);

CREATE TYPE decision_type AS ENUM (
    'architecture',    -- System design decisions
    'agent_assignment', -- Which agent for which task
    'task_sequence',   -- Execution order
    'pivot',           -- Change approval
    'quality_gate'     -- Validation decisions
);

CREATE TYPE conversation_type AS ENUM (
    'planning',   -- Blueprint discussion
    'execution',  -- Task execution chat
    'review',     -- Code/work review
    'pivot',      -- Change discussion
    'general'     -- General chat
);

CREATE TYPE chat_role AS ENUM (
    'user',        -- User messages
    'assistant',   -- Agent responses
    'orchestrator', -- Orchestrator coordination
    'system'       -- System notifications
);

CREATE TYPE doc_type AS ENUM (
    'requirements',  -- Business requirements
    'design',        -- Design documents
    'architecture',  -- Technical architecture
    'api_spec',      -- API specifications
    'user_story',    -- User stories
    'test_plan'      -- Testing plans
);

CREATE TYPE artifact_type AS ENUM (
    'source_code',   -- Code files
    'test',          -- Test files
    'deployment',    -- Deployment artifacts
    'build',         -- Build outputs
    'documentation'  -- Generated docs
);

CREATE TYPE checkpoint_type AS ENUM (
    'unit_test',         -- Unit testing
    'integration_test',  -- Integration testing
    'code_review',       -- Code quality review
    'spec_validation',   -- Requirements validation
    'user_acceptance'    -- User approval
);

CREATE TYPE checkpoint_status AS ENUM (
    'pending',   -- Not yet run
    'running',   -- In progress
    'passed',    -- Validation passed
    'failed'     -- Validation failed
);

CREATE TYPE issue_type AS ENUM (
    'blocker',            -- Blocking progress
    'missing_requirement', -- Unclear requirements
    'technical_issue',    -- Technical problem
    'dependency',         -- Dependency issue
    'pivot_needed'        -- Change required
);

CREATE TYPE issue_severity AS ENUM (
    'critical',  -- Project-blocking
    'high',      -- Phase/feature blocking
    'medium',    -- Task blocking
    'low'        -- Minor issue
);

CREATE TYPE issue_status AS ENUM (
    'open',            -- Active issue
    'consulting_user', -- Escalated to user
    'resolved',        -- Fixed
    'wont_fix'        -- Accepted/deferred
);

CREATE TYPE snapshot_type AS ENUM (
    'initial',    -- Project start
    'milestone',  -- Major checkpoint
    'pivot',      -- After blueprint change
    'final'       -- Project completion
);

CREATE TYPE dependency_type AS ENUM (
    'blocks',    -- Hard blocker
    'requires',  -- Must complete first
    'follows',   -- Should complete after
    'related'    -- Soft relationship
);

CREATE TYPE agent_session_status AS ENUM (
    'active',     -- Currently working
    'paused',     -- Temporarily stopped
    'completed',  -- Work finished
    'failed'      -- Work failed
);

-- ==================================================================
-- TIER 1: PROJECT & BLUEPRINT MANAGEMENT
-- ==================================================================

-- Projects - Top-level entity (the "construction site")
CREATE TABLE projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT NOT NULL,
    workspace_path TEXT UNIQUE NOT NULL,
    tech_stack JSONB DEFAULT '[]'::jsonb,
    execution_mode execution_mode NOT NULL DEFAULT 'semi_autonomous',
    status project_status NOT NULL DEFAULT 'planning',
    blueprint_version INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMP NOT NULL DEFAULT now(),
    approved_at TIMESTAMP,
    started_at TIMESTAMP,
    completed_at TIMESTAMP,
    metadata JSONB DEFAULT '{}'::jsonb
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
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    version_number INTEGER NOT NULL,
    created_by TEXT NOT NULL CHECK (created_by IN ('user', 'orchestrator')),
    reason_for_change TEXT NOT NULL,
    impact_analysis JSONB NOT NULL,
    approved BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP NOT NULL DEFAULT now(),
    approved_at TIMESTAMP,
    changes JSONB NOT NULL DEFAULT '{}'::jsonb,
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
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    blueprint_version INTEGER NOT NULL,
    architecture_type TEXT NOT NULL CHECK (architecture_type IN ('frontend', 'backend', 'infrastructure', 'integration')),
    component_name TEXT NOT NULL,
    description TEXT NOT NULL,
    tech_choices JSONB NOT NULL DEFAULT '{}'::jsonb,
    design_rationale TEXT NOT NULL,
    related_docs JSONB DEFAULT '[]'::jsonb,
    metadata JSONB DEFAULT '{}'::jsonb,
    UNIQUE (project_id, blueprint_version, component_name)
);

-- ==================================================================
-- TIER 2: WORK BREAKDOWN STRUCTURE
-- ==================================================================

-- Project Phases - Construction-style phases (Foundation, Framing, Finishing)
CREATE TABLE project_phases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    blueprint_version INTEGER NOT NULL,
    phase_number INTEGER NOT NULL,
    name TEXT NOT NULL,
    description TEXT NOT NULL,
    target_start_date TIMESTAMP,
    target_end_date TIMESTAMP,
    actual_start_date TIMESTAMP,
    actual_end_date TIMESTAMP,
    status phase_status NOT NULL DEFAULT 'planned',
    completion_percentage INTEGER NOT NULL DEFAULT 0 CHECK (completion_percentage >= 0 AND completion_percentage <= 100),
    requires_user_approval BOOLEAN NOT NULL DEFAULT false,
    metadata JSONB DEFAULT '{}'::jsonb,
    UNIQUE (project_id, blueprint_version, phase_number)
);

-- Features/Epics - Major deliverables within a phase
CREATE TABLE features (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    phase_id UUID NOT NULL REFERENCES project_phases(id) ON DELETE CASCADE,
    blueprint_version INTEGER NOT NULL,
    feature_number TEXT NOT NULL,
    name TEXT NOT NULL,
    description TEXT NOT NULL,
    business_value TEXT NOT NULL,
    acceptance_criteria JSONB NOT NULL DEFAULT '[]'::jsonb,
    priority TEXT NOT NULL CHECK (priority IN ('critical', 'high', 'medium', 'low')),
    status feature_status NOT NULL DEFAULT 'backlog',
    estimated_effort_hours INTEGER,
    actual_effort_hours INTEGER,
    assigned_primary_agent agent_type,
    created_at TIMESTAMP NOT NULL DEFAULT now(),
    started_at TIMESTAMP,
    completed_at TIMESTAMP,
    metadata JSONB DEFAULT '{}'::jsonb,
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
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    feature_id UUID NOT NULL REFERENCES features(id) ON DELETE CASCADE,
    parent_task_id UUID REFERENCES tasks(id) ON DELETE SET NULL,
    blueprint_version INTEGER NOT NULL,
    task_number TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    task_type task_type NOT NULL,
    assigned_agent agent_type NOT NULL,
    status task_status NOT NULL DEFAULT 'todo',
    priority INTEGER NOT NULL CHECK (priority >= 1 AND priority <= 5),
    estimated_time_minutes INTEGER,
    actual_time_minutes INTEGER,
    success_criteria JSONB NOT NULL DEFAULT '[]'::jsonb,
    context_for_agent JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMP NOT NULL DEFAULT now(),
    assigned_at TIMESTAMP,
    started_at TIMESTAMP,
    completed_at TIMESTAMP,
    validated_at TIMESTAMP,
    metadata JSONB DEFAULT '{}'::jsonb,
    -- metadata structure:
    -- {
    --   "blocking_reason": "...",
    --   "files_to_create": [...],
    --   "files_to_modify": [...],
    --   "related_docs": [...],
    --   "validation_notes": "..."
    -- }
    UNIQUE (project_id, blueprint_version, task_number)
);

-- Task Dependencies - The dependency graph
CREATE TABLE task_dependencies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    depends_on_task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    dependency_type dependency_type NOT NULL,
    is_satisfied BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP NOT NULL DEFAULT now(),
    notes TEXT,
    CHECK (task_id != depends_on_task_id),
    UNIQUE (task_id, depends_on_task_id)
);

-- ==================================================================
-- TIER 3: ORCHESTRATOR & AGENT COORDINATION
-- ==================================================================

-- Orchestrator Sessions - The general contractor's work log
CREATE TABLE orchestrator_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    session_type session_type NOT NULL,
    started_at TIMESTAMP NOT NULL DEFAULT now(),
    ended_at TIMESTAMP,
    orchestrator_model TEXT NOT NULL,
    decisions_made JSONB DEFAULT '[]'::jsonb,
    issues_identified JSONB DEFAULT '[]'::jsonb,
    user_consultations JSONB DEFAULT '[]'::jsonb,
    metadata JSONB DEFAULT '{}'::jsonb
);

-- Orchestrator Decisions - Design decisions and rationale (the WHY layer)
CREATE TABLE orchestrator_decisions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    session_id UUID NOT NULL REFERENCES orchestrator_sessions(id) ON DELETE CASCADE,
    decision_type decision_type NOT NULL,
    decision_context TEXT NOT NULL,
    decision_made TEXT NOT NULL,
    rationale TEXT NOT NULL,
    alternatives_considered JSONB DEFAULT '[]'::jsonb,
    user_approved BOOLEAN,  -- null = auto, true/false = user decision
    created_at TIMESTAMP NOT NULL DEFAULT now(),
    metadata JSONB DEFAULT '{}'::jsonb
);

-- Agent Work Sessions - Each trade's work log
CREATE TABLE agent_work_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    conversation_id UUID,  -- FK added after conversations table
    agent_type agent_type NOT NULL,
    model_used TEXT NOT NULL,
    context_provided JSONB NOT NULL DEFAULT '{}'::jsonb,
    started_at TIMESTAMP NOT NULL DEFAULT now(),
    last_activity_at TIMESTAMP NOT NULL DEFAULT now(),
    ended_at TIMESTAMP,
    status agent_session_status NOT NULL DEFAULT 'active',
    output_summary TEXT,
    files_created JSONB DEFAULT '[]'::jsonb,
    files_modified JSONB DEFAULT '[]'::jsonb,
    tokens_used INTEGER DEFAULT 0,
    cost_usd DECIMAL(10, 4),
    metadata JSONB DEFAULT '{}'::jsonb
);

-- ==================================================================
-- TIER 4: CONVERSATIONS & MESSAGES
-- ==================================================================

-- Conversations - Chat sessions (project-wide or task-specific)
CREATE TABLE conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    task_id UUID REFERENCES tasks(id) ON DELETE SET NULL,
    conversation_type conversation_type NOT NULL,
    title TEXT NOT NULL,
    active_agent agent_type,
    created_at TIMESTAMP NOT NULL DEFAULT now(),
    last_message_at TIMESTAMP,
    metadata JSONB DEFAULT '{}'::jsonb
);

-- Messages - Individual chat messages
CREATE TABLE messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    agent_type agent_type,  -- null = user message
    role chat_role NOT NULL,
    content TEXT NOT NULL,
    model_used TEXT,
    tokens_input INTEGER,
    tokens_output INTEGER,
    created_at TIMESTAMP NOT NULL DEFAULT now(),
    parent_message_id UUID REFERENCES messages(id) ON DELETE SET NULL,
    metadata JSONB DEFAULT '{}'::jsonb
    -- metadata structure:
    -- {
    --   "context_snapshot": {...},
    --   "attachments": [...],
    --   "referenced_tasks": [...]
    -- }
);

-- Add foreign key constraint for conversation_id in agent_work_sessions
ALTER TABLE agent_work_sessions
ADD CONSTRAINT fk_agent_work_sessions_conversation
FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE SET NULL;

-- ==================================================================
-- TIER 5: DOCUMENTATION & ARTIFACTS
-- ==================================================================

-- Project Documentation - Linked docs (requirements, designs, specs)
CREATE TABLE project_documentation (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    phase_id UUID REFERENCES project_phases(id) ON DELETE SET NULL,
    feature_id UUID REFERENCES features(id) ON DELETE SET NULL,
    doc_type doc_type NOT NULL,
    title TEXT NOT NULL,
    file_path TEXT,
    content TEXT,
    url TEXT,
    tags JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP NOT NULL DEFAULT now(),
    updated_at TIMESTAMP NOT NULL DEFAULT now()
);

-- Project Artifacts - Code files, deployments, test results
CREATE TABLE project_artifacts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    task_id UUID REFERENCES tasks(id) ON DELETE SET NULL,
    artifact_type artifact_type NOT NULL,
    file_path TEXT NOT NULL,
    created_by_agent agent_type,
    git_commit_hash TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT now(),
    last_modified_at TIMESTAMP NOT NULL DEFAULT now(),
    metadata JSONB DEFAULT '{}'::jsonb
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
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    phase_id UUID REFERENCES project_phases(id) ON DELETE SET NULL,
    feature_id UUID REFERENCES features(id) ON DELETE SET NULL,
    task_id UUID REFERENCES tasks(id) ON DELETE SET NULL,
    checkpoint_type checkpoint_type NOT NULL,
    status checkpoint_status NOT NULL DEFAULT 'pending',
    validation_criteria JSONB NOT NULL DEFAULT '{}'::jsonb,
    results JSONB DEFAULT '{}'::jsonb,
    validated_by TEXT NOT NULL CHECK (validated_by IN ('orchestrator', 'automated', 'user')),
    validated_at TIMESTAMP,
    metadata JSONB DEFAULT '{}'::jsonb
);

-- Project Issues - Problems encountered during execution
CREATE TABLE project_issues (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    task_id UUID REFERENCES tasks(id) ON DELETE SET NULL,
    issue_type issue_type NOT NULL,
    severity issue_severity NOT NULL,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    detected_by agent_type NOT NULL,
    status issue_status NOT NULL DEFAULT 'open',
    resolution TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT now(),
    resolved_at TIMESTAMP,
    metadata JSONB DEFAULT '{}'::jsonb
);

-- ==================================================================
-- TIER 7: MEMORY-AGENT INTEGRATION
-- ==================================================================

-- Project Context Snapshots - Link to Memory-Agent analysis
CREATE TABLE project_context_snapshots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    memory_agent_project_id UUID,  -- FK to Memory-Agent DB (external)
    snapshot_type snapshot_type NOT NULL,
    code_patterns_detected JSONB DEFAULT '[]'::jsonb,
    architecture_analysis JSONB DEFAULT '{}'::jsonb,
    tech_debt_score DECIMAL(5, 2),
    created_at TIMESTAMP NOT NULL DEFAULT now(),
    metadata JSONB DEFAULT '{}'::jsonb
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
-- COMMENTS FOR DOCUMENTATION
-- ==================================================================

COMMENT ON TABLE projects IS 'Top-level project entity - the construction site';
COMMENT ON TABLE blueprint_versions IS 'Architectural plan revisions for pivot management';
COMMENT ON TABLE system_architecture IS 'Technical blueprint components';
COMMENT ON TABLE project_phases IS 'Construction-style phases (Foundation, Framing, Finishing)';
COMMENT ON TABLE features IS 'Major deliverables/epics within phases';
COMMENT ON TABLE tasks IS 'Atomic units of work assigned to agents';
COMMENT ON TABLE task_dependencies IS 'Dependency graph - plumbing before drywall';
COMMENT ON TABLE orchestrator_sessions IS 'General contractor work log';
COMMENT ON TABLE orchestrator_decisions IS 'Design decisions and rationale - the WHY layer';
COMMENT ON TABLE agent_work_sessions IS 'Individual agent work tracking';
COMMENT ON TABLE conversations IS 'Chat sessions - project-wide or task-specific';
COMMENT ON TABLE messages IS 'Individual chat messages';
COMMENT ON TABLE project_documentation IS 'Linked requirements, designs, specs';
COMMENT ON TABLE project_artifacts IS 'Code files, deployments, test results';
COMMENT ON TABLE quality_checkpoints IS 'Built-in validation points';
COMMENT ON TABLE project_issues IS 'Blockers and problems';
COMMENT ON TABLE project_context_snapshots IS 'Link to Memory-Agent code analysis';

-- ==================================================================
-- SETUP COMPLETE
-- ==================================================================
