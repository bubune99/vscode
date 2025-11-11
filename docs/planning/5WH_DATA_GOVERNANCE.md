# 5W+H Data Governance & Storage Rules

## Storage Architecture Summary

Based on our strategic discussion:

| Data Type | Storage Location | Scope | Reason |
|-----------|-----------------|-------|--------|
| **Chat History** | Workspace Storage | Per-workspace | User's conversation with AI for this project |
| **Mission Control State** | Workspace Storage | Per-workspace | Current tasks, planning, active agents |
| **5W+H Analytics** | SQLite Database | Global, cross-workspace | Learning from all projects |
| **Code Snippets** | SQLite Database | Global, cross-workspace | Reusable patterns across projects |
| **Agent Performance** | SQLite Database | Global, cross-workspace | Which agents work best for what |

---

## Performance: Workspace Storage vs SQLite

### Workspace Storage API
```typescript
// Read operation
const chatHistory = context.workspaceState.get<ChatMessage[]>('chatHistory', []);
```
- **Latency**: ~1-5ms (in-memory cache)
- **Read**: Extremely fast (cached by VS Code)
- **Write**: Fast (~5-10ms, async write-behind)
- **Best for**: Frequent reads, simple data structures

### SQLite Database
```typescript
// Query operation
const results = db.prepare('SELECT * FROM tasks WHERE project_id = ?').all(projectId);
```
- **Latency**: ~5-20ms (disk I/O + query execution)
- **Read**: Fast with indexes (~10-50ms for complex queries)
- **Write**: Moderate (~10-30ms, ACID guarantees)
- **Best for**: Complex queries, relational data, analytics

### Comparison Table

| Operation | Workspace Storage | SQLite Database |
|-----------|------------------|-----------------|
| Single read | 1-5ms | 5-20ms |
| Write | 5-10ms | 10-30ms |
| Complex query | N/A (manual filtering) | 10-50ms (indexed) |
| Aggregation | Slow (in-memory) | Fast (SQL) |
| Data size | Small (<10MB) | Large (>100MB+) |

### Verdict: Latency Difference is Negligible

**For Mission Control use case**:
- Chat history: ~10-100 messages → Workspace Storage (1ms read)
- 5W+H analytics: ~1000s of records → SQLite (20ms query)
- **User won't notice the difference!** Both are <50ms

**Rule of thumb**:
- If you need it **immediately on every keystroke** → Workspace Storage
- If you query it **on-demand or periodically** → SQLite is fine

---

## 5W+H Framework: What Data to Capture

The 5W+H framework helps us learn from every development session:

### Who (Agent Performance)
**What to track**:
- Which AI agent worked on the task
- Success/failure rate per agent
- Time taken by each agent
- Agent-specific strengths

**Example data**:
```sql
INSERT INTO agent_metrics (agent, task_type, success, duration_ms, timestamp)
VALUES ('claude', 'refactoring', 1, 45000, 1635724800000);
```

**Use case**: "Claude is 85% successful at refactoring tasks, avg 45 seconds"

---

### What (Task Patterns)
**What to track**:
- Task descriptions and categories
- Task decomposition patterns
- Common task sequences
- Task dependencies

**Example data**:
```sql
INSERT INTO task_patterns (description, category, parent_task, files_modified)
VALUES ('Add authentication', 'feature', NULL, 'auth.ts,user.ts');
```

**Use case**: "Authentication tasks usually touch 5 files and take 3 subtasks"

---

### When (Timing & Scheduling)
**What to track**:
- Task start/completion times
- Time of day patterns
- Session duration
- Peak productivity periods

**Example data**:
```sql
INSERT INTO task_timing (task_id, started_at, completed_at, time_of_day)
VALUES ('task-123', 1635724800000, 1635728400000, 'afternoon');
```

**Use case**: "Refactoring tasks take 2x longer in mornings"

---

### Where (File & Project Context)
**What to track**:
- Which files were modified
- Which directories were touched
- Technology stack used
- Project structure patterns

**Example data**:
```sql
INSERT INTO file_context (task_id, file_path, lines_changed, tech_stack)
VALUES ('task-123', 'src/auth/login.ts', 45, 'typescript,react');
```

**Use case**: "React authentication changes usually modify 3-5 components"

---

### Why (Decision Rationale)
**What to track**:
- Why certain approaches were chosen
- Why tasks failed
- User feedback on results
- Alternative approaches considered

**Example data**:
```sql
INSERT INTO decision_log (task_id, decision, rationale, alternatives)
VALUES ('task-123', 'use JWT', 'stateless auth for API', 'sessions,oauth');
```

**Use case**: "JWT was chosen over sessions 80% of the time for APIs"

---

### How (Implementation Details & Code Snippets)
**What to track**:
- Successful code patterns
- Reusable snippets
- Solution templates
- Error fix patterns

**Example data**:
```sql
INSERT INTO code_snippets (pattern_name, language, code, usage_count, success_rate)
VALUES (
  'react-auth-hook',
  'typescript',
  'const { user, login, logout } = useAuth();',
  45,
  0.92
);
```

**Use case**: "This auth hook pattern was successful in 45 tasks (92% success rate)"

---

## Data Capture Rules: What Files to Track

### ✅ ALWAYS Track These Files

1. **Source Code** (`.ts`, `.tsx`, `.js`, `.jsx`, `.py`, `.java`, etc.)
   - All application logic
   - Components and modules
   - API endpoints and services

2. **Configuration** (`package.json`, `tsconfig.json`, `.env.example`)
   - Project setup changes
   - Dependency additions
   - Build configuration

3. **Documentation** (`README.md`, `/docs/**`)
   - Architecture decisions
   - API documentation
   - Setup instructions

4. **Tests** (`*.test.ts`, `*.spec.ts`)
   - Test patterns
   - Coverage improvements

### ⚠️ CONDITIONALLY Track These Files

5. **Styles** (`.css`, `.scss`, `.less`)
   - Only if significant design patterns emerge
   - Skip minor color changes

6. **Database Migrations** (`migrations/*.sql`)
   - Schema changes only
   - Not seed data

### ❌ NEVER Track These Files

7. **Generated Files**
   - `/dist/**`, `/build/**`, `/out/**`
   - Compiled output
   - Bundled code

8. **Dependencies**
   - `/node_modules/**`
   - `/vendor/**`
   - Third-party libraries

9. **Temporary Files**
   - `*.log`, `*.tmp`
   - Cache files
   - Editor swap files

10. **Secrets & Credentials**
    - `.env` (with real values)
    - API keys
    - Passwords or tokens

11. **Binary Files**
    - Images (`.png`, `.jpg`)
    - Videos
    - PDFs (unless documentation)

12. **Lock Files** (usually)
    - `package-lock.json`, `yarn.lock`
    - Only track when explicitly updated for dependency management

---

## Implementation: File Tracking Filter

```typescript
/**
 * Determines if a file should be tracked in 5W+H analytics
 */
function shouldTrackFile(filePath: string): boolean {
  // Always track: Source code
  const sourceExtensions = ['.ts', '.tsx', '.js', '.jsx', '.py', '.java', '.go', '.rs', '.cpp', '.c', '.h'];
  if (sourceExtensions.some(ext => filePath.endsWith(ext))) {
    return true;
  }

  // Always track: Configuration
  const configFiles = ['package.json', 'tsconfig.json', 'webpack.config.js', 'vite.config.ts'];
  const fileName = filePath.split('/').pop() || '';
  if (configFiles.includes(fileName)) {
    return true;
  }

  // Always track: Documentation
  if (filePath.endsWith('.md') && !filePath.includes('node_modules')) {
    return true;
  }

  // Always track: Tests
  if (filePath.includes('.test.') || filePath.includes('.spec.')) {
    return true;
  }

  // Never track: Generated files
  const ignorePaths = ['/dist/', '/build/', '/out/', '/node_modules/', '/.git/'];
  if (ignorePaths.some(path => filePath.includes(path))) {
    return false;
  }

  // Never track: Binary/media files
  const binaryExtensions = ['.png', '.jpg', '.jpeg', '.gif', '.pdf', '.zip', '.tar', '.mp4'];
  if (binaryExtensions.some(ext => filePath.endsWith(ext))) {
    return false;
  }

  // Never track: Lock files (usually)
  if (filePath.endsWith('package-lock.json') || filePath.endsWith('yarn.lock')) {
    return false;
  }

  // Default: Track everything else (be inclusive for learning)
  return true;
}
```

---

## Code Snippet Extraction Rules

### When to Save a Snippet

Only save code snippets when:

1. **Reusable Pattern Identified**
   - Used successfully in 2+ tasks
   - Solves a common problem
   - Clear, self-contained logic

2. **High Success Rate**
   - Task completed successfully
   - User didn't request changes
   - No errors reported

3. **Meaningful Size**
   - Not too small (<5 lines = trivial)
   - Not too large (>50 lines = not reusable)
   - Sweet spot: 10-30 lines

4. **Well-Defined Context**
   - Clear purpose
   - Minimal dependencies
   - Technology stack tagged

### Example: Good Snippet to Save

```typescript
// Pattern: React Authentication Hook
// Success Rate: 92% (45 uses)
// Tags: react, typescript, authentication
// Average Duration: 30s

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);

  const login = async (email: string, password: string) => {
    const response = await fetch('/api/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });
    const data = await response.json();
    setUser(data.user);
  };

  const logout = () => setUser(null);

  return { user, login, logout };
}
```

### Example: Bad Snippet (Don't Save)

```typescript
// Too trivial
const x = 5;

// Too project-specific
const API_KEY = 'abc123xyz'; // Never save secrets!

// Too large (>50 lines)
function massiveComponentWithEverything() { /* ... 200 lines ... */ }
```

---

## Database Schema for 5W+H

```sql
-- Agent Performance (Who)
CREATE TABLE agent_metrics (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  agent TEXT NOT NULL,
  task_type TEXT NOT NULL,
  success INTEGER NOT NULL, -- 0 or 1
  duration_ms INTEGER NOT NULL,
  timestamp INTEGER NOT NULL,
  error_message TEXT
);

-- Task Patterns (What)
CREATE TABLE task_patterns (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  description TEXT NOT NULL,
  category TEXT NOT NULL, -- 'feature', 'bug', 'refactor', etc.
  parent_task_id INTEGER,
  files_modified TEXT, -- JSON array
  tech_stack TEXT, -- JSON array
  success INTEGER NOT NULL,
  created_at INTEGER NOT NULL
);

-- Timing Analysis (When)
CREATE TABLE task_timing (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  task_id INTEGER NOT NULL,
  started_at INTEGER NOT NULL,
  completed_at INTEGER NOT NULL,
  time_of_day TEXT, -- 'morning', 'afternoon', 'evening', 'night'
  day_of_week TEXT,
  duration_ms INTEGER NOT NULL
);

-- File Context (Where)
CREATE TABLE file_context (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  task_id INTEGER NOT NULL,
  file_path TEXT NOT NULL,
  lines_added INTEGER,
  lines_removed INTEGER,
  tech_stack TEXT, -- 'typescript', 'react', etc.
  directory TEXT
);

-- Decision Log (Why)
CREATE TABLE decision_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  task_id INTEGER NOT NULL,
  decision TEXT NOT NULL,
  rationale TEXT NOT NULL,
  alternatives TEXT, -- JSON array
  outcome TEXT, -- 'success', 'failure', 'pending'
  timestamp INTEGER NOT NULL
);

-- Code Snippets (How)
CREATE TABLE code_snippets (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  pattern_name TEXT NOT NULL,
  language TEXT NOT NULL,
  code TEXT NOT NULL,
  description TEXT,
  tags TEXT, -- JSON array: ['react', 'auth', 'hook']
  usage_count INTEGER DEFAULT 1,
  success_rate REAL DEFAULT 1.0,
  average_duration_ms INTEGER,
  created_at INTEGER NOT NULL,
  last_used_at INTEGER NOT NULL,
  UNIQUE(pattern_name, language)
);

-- Indexes for performance
CREATE INDEX idx_agent_metrics_agent ON agent_metrics(agent);
CREATE INDEX idx_task_patterns_category ON task_patterns(category);
CREATE INDEX idx_code_snippets_tags ON code_snippets(tags);
CREATE INDEX idx_file_context_tech ON file_context(tech_stack);
```

---

## Data Collection Workflow

### During Task Execution

```typescript
// 1. Task starts
const taskId = await database.createTask({
  description: 'Add authentication',
  agent: 'claude',
  project_id: currentProject.id
});

// Track start time
await database.recordTaskTiming({
  task_id: taskId,
  started_at: Date.now(),
  time_of_day: getTimeOfDay() // 'morning', 'afternoon', etc.
});

// 2. Files are modified
const modifiedFiles = await getModifiedFiles();
for (const file of modifiedFiles) {
  if (shouldTrackFile(file.path)) {
    await database.recordFileContext({
      task_id: taskId,
      file_path: file.path,
      lines_added: file.additions,
      lines_removed: file.deletions,
      tech_stack: detectTechStack(file.path)
    });
  }
}

// 3. Decision made
await database.recordDecision({
  task_id: taskId,
  decision: 'Use JWT for authentication',
  rationale: 'Stateless API, better for microservices',
  alternatives: ['Sessions', 'OAuth only']
});

// 4. Code pattern emerges
const codeSnippet = extractReusablePattern(modifiedFiles);
if (isReusablePattern(codeSnippet)) {
  await database.saveCodeSnippet({
    pattern_name: 'react-auth-hook',
    language: 'typescript',
    code: codeSnippet.code,
    tags: ['react', 'auth', 'hook']
  });
}

// 5. Task completes
await database.completeTask({
  task_id: taskId,
  completed_at: Date.now(),
  success: true
});

// 6. Calculate metrics
await database.recordAgentMetric({
  agent: 'claude',
  task_type: 'feature',
  success: 1,
  duration_ms: Date.now() - startTime
});
```

---

## Data Usage: Mission Control Insights

### Dashboard Queries

```typescript
// Show agent performance
const agentStats = await database.query(`
  SELECT agent,
         COUNT(*) as tasks,
         AVG(success) as success_rate,
         AVG(duration_ms) as avg_duration
  FROM agent_metrics
  GROUP BY agent
  ORDER BY success_rate DESC
`);

// Show common patterns
const topPatterns = await database.query(`
  SELECT category,
         COUNT(*) as count,
         AVG(success) as success_rate
  FROM task_patterns
  GROUP BY category
  ORDER BY count DESC
  LIMIT 10
`);

// Show reusable snippets
const snippets = await database.query(`
  SELECT pattern_name,
         language,
         usage_count,
         success_rate,
         tags
  FROM code_snippets
  ORDER BY usage_count DESC
  LIMIT 20
`);

// Show file hotspots
const hotspots = await database.query(`
  SELECT file_path,
         COUNT(*) as modification_count
  FROM file_context
  GROUP BY file_path
  ORDER BY modification_count DESC
  LIMIT 10
`);
```

---

## Summary: Storage Decision Matrix

| Data Type | Storage | Reason | Read Frequency | Write Frequency |
|-----------|---------|--------|---------------|-----------------|
| Chat messages (current workspace) | Workspace Storage | Fast access, workspace-scoped | Every message | Every message |
| Mission Control state | Workspace Storage | UI state, temporary | Every render | On change |
| Agent performance metrics | SQLite | Analytics, cross-project | Dashboard load | Task completion |
| Code snippets | SQLite | Reusable library | On-demand | Pattern detection |
| File context | SQLite | Analytics | Dashboard queries | Task completion |
| Decision logs | SQLite | Historical learning | Rare | Task milestones |

**Key Insight**: Workspace Storage for **hot path** (chat, UI), SQLite for **cold path** (analytics, history).

---

**Created**: 2025-10-27
**Status**: Governance Rules Defined
