# Workspace Storage vs Workspace Files - Detailed Explanation

## The Confusion

When we say "workspace storage," there are actually **TWO completely different things**:

1. **VS Code Workspace Storage API** - Virtual key-value store managed by VS Code
2. **Workspace Files** - Actual files in your project directory (like `.claude/`, `.windsurf/`)

Let's break down each approach with concrete examples.

---

## Option 1: VS Code Workspace Storage API

### What It Is
A key-value storage API provided by VS Code that stores data **outside** your project directory, managed internally by VS Code.

### Where Data Lives
**NOT in your project folder!** Data is stored in VS Code's internal storage location:
- **Linux**: `~/.config/Code/User/workspaceStorage/<workspace-id>/`
- **macOS**: `~/Library/Application Support/Code/User/workspaceStorage/<workspace-id>/`
- **Windows**: `%APPDATA%\Code\User\workspaceStorage\<workspace-id>\`

### Example: Setting Project Rules
```typescript
// In your VS Code extension/fork code
import * as vscode from 'vscode';

// Save data to workspace storage
async function saveProjectRules(context: vscode.ExtensionContext) {
  const rules = {
    aiInstructions: "Always use TypeScript strict mode",
    ignoredPaths: ["node_modules", "dist"],
    preferredAgents: ["claude", "v0"]
  };

  // This does NOT create a file in your project!
  await context.workspaceState.update('missionControlRules', rules);
}

// Load data from workspace storage
async function loadProjectRules(context: vscode.ExtensionContext) {
  const rules = context.workspaceState.get('missionControlRules');
  console.log(rules); // Your saved rules
}
```

### What Your Project Directory Looks Like
```
my-project/
├── src/
├── package.json
└── README.md

NO .missioncontrol folder!
NO settings files visible!
```

### Pros
- ✅ No clutter in your project directory
- ✅ Not committed to git (automatically excluded)
- ✅ VS Code handles persistence automatically
- ✅ Can sync across machines with Settings Sync
- ✅ Automatic cleanup when workspace is removed

### Cons
- ❌ Not visible to users (can't edit directly)
- ❌ Not version controlled (can't share with team)
- ❌ Not portable outside VS Code
- ❌ Harder to inspect/debug (hidden storage)

### Use Cases
- Per-workspace settings that shouldn't be shared
- Temporary workspace state
- Cache data
- User-specific workspace preferences

---

## Option 2: Workspace Files (`.claude` / `.windsurf` Style)

### What It Is
Actual files and directories **inside** your project folder that store configuration.

### Where Data Lives
**IN your project folder** - visible to everyone, can be committed to git:
```
my-project/
├── .missioncontrol/           ← ACTUAL FOLDER
│   ├── rules.md               ← ACTUAL FILE
│   ├── workflows.json         ← ACTUAL FILE
│   └── context.json           ← ACTUAL FILE
├── src/
├── package.json
└── README.md
```

### Example: Setting Project Rules
```typescript
// In your VS Code extension/fork code
import * as fs from 'fs/promises';
import * as path from 'path';

async function saveProjectRules(workspacePath: string) {
  const rulesDir = path.join(workspacePath, '.missioncontrol');
  const rulesFile = path.join(rulesDir, 'rules.md');

  const rules = `# Mission Control Rules

## AI Instructions
- Always use TypeScript strict mode
- Prefer functional components in React

## Ignored Paths
- node_modules
- dist
- .env

## Preferred Agents
- claude: For complex refactoring
- v0: For UI component generation
`;

  // Create actual files in the project
  await fs.mkdir(rulesDir, { recursive: true });
  await fs.writeFile(rulesFile, rules, 'utf-8');
}

async function loadProjectRules(workspacePath: string) {
  const rulesFile = path.join(workspacePath, '.missioncontrol', 'rules.md');
  const content = await fs.readFile(rulesFile, 'utf-8');
  return content; // Parse markdown, etc.
}
```

### What Your Project Directory Looks Like
```
my-project/
├── .missioncontrol/           ← Visible folder
│   ├── rules.md               ← Can open in VS Code
│   ├── workflows.json         ← Can edit directly
│   └── context.json           ← Visible in file tree
├── src/
├── package.json
└── README.md
```

### Pros
- ✅ Visible and inspectable
- ✅ Can be version controlled (shareable with team)
- ✅ Easy to edit directly (just open the file)
- ✅ Portable (works with any editor/tool)
- ✅ Self-documenting (especially with markdown files)

### Cons
- ❌ Clutters project directory
- ❌ Can be accidentally committed if not in `.gitignore`
- ❌ Team members might have different local settings
- ❌ Manual file handling (create dirs, write files, parse formats)

### Use Cases
- Team-shared configuration
- Project-specific AI instructions everyone should follow
- Version-controlled workflows
- Documentation of project context for AI

---

## Real-World Examples

### Claude Desktop Extension (`.claude/`)
Creates **actual files** in your project:
```
my-project/
└── .claude/
    └── settings.json    ← Real file you can open
```

**Why?** So teams can share Claude settings via git:
```json
{
  "contextFiles": ["docs/architecture.md"],
  "ignoredPaths": ["test/__snapshots__"],
  "customInstructions": "Follow the coding style in CONTRIBUTING.md"
}
```

### Windsurf IDE (`.windsurf/`)
Creates **actual files** for rules and workflows:
```
my-project/
└── .windsurf/
    ├── rules.md         ← Team-wide AI rules
    └── workflows.json   ← Project-specific workflows
```

**Example `.windsurf/rules.md`:**
```markdown
# Windsurf Rules for This Project

## Code Style
- Use 2-space indentation
- Prefer async/await over promises

## Testing
- Write tests for all new features
- Use Jest for unit tests
```

### Cursor IDE
Uses **both approaches**:
1. **Workspace Storage API** for user-specific state (cursor position, open tabs)
2. **No visible files** - keeps project clean

**Why?** Cursor focuses on individual developer experience, not team sharing.

---

## Our Decision for Mission Control

### Recommended Hybrid Approach

#### Use VS Code Workspace Storage API For:
1. **Temporary workspace state**
   - Current task planning session
   - Which agents are active
   - UI state (expanded panels, etc.)

2. **User-specific preferences**
   - "I prefer Claude for this project"
   - Custom dashboard layout
   - Personal workflow preferences

#### Use Workspace Files (`.missioncontrol/`) For:
1. **Team-shared rules** (optional, user-created)
   - Project-specific AI instructions
   - Technology guidelines
   - Coding standards for AI to follow

2. **Version-controlled context** (optional)
   - Important files for AI to reference
   - Project architecture documentation
   - Custom workflows

### Implementation Strategy

```typescript
// Check if .missioncontrol/ exists in workspace
const missionControlDir = path.join(workspacePath, '.missioncontrol');
const hasConfigFiles = await fs.exists(missionControlDir);

if (hasConfigFiles) {
  // Load from files (team-shared config)
  const rules = await loadRulesFromFile(missionControlDir);
} else {
  // Load from workspace storage (personal config)
  const rules = context.workspaceState.get('missionControlRules');
}

// Always save working state to workspace storage
context.workspaceState.update('currentSession', sessionData);
```

### File Structure (if user chooses to create it)
```
my-project/
├── .missioncontrol/              ← Optional, user-created
│   ├── rules.md                  ← AI instructions
│   ├── context.md                ← Project overview
│   └── .gitignore                ← Ignore generated files
├── src/
└── package.json
```

### Workspace Storage Structure (automatic)
```
~/.config/Code/User/workspaceStorage/<id>/
└── state.vscdb                   ← VS Code's internal storage
    ├── missionControlRules       ← Key-value pairs
    ├── currentSession
    └── dashboardLayout
```

---

## Key Differences Summary

| Feature | Workspace Storage API | Workspace Files |
|---------|----------------------|-----------------|
| **Location** | VS Code internal storage | Project directory |
| **Visibility** | Hidden from user | Visible in file tree |
| **Version Control** | Never committed | Can be committed |
| **Team Sharing** | No (user-specific) | Yes (if committed) |
| **Editability** | Via code only | Direct file editing |
| **Persistence** | VS Code manages | Developer manages |
| **Cleanup** | Automatic | Manual |
| **Portability** | VS Code only | Any tool can read |

---

## Examples in Code

### Scenario 1: Personal Dashboard Layout (Workspace Storage)
```typescript
// User resizes Mission Control dashboard panels
async function saveDashboardLayout(context: vscode.ExtensionContext) {
  const layout = {
    taskPanelHeight: 300,
    agentPanelWidth: 250,
    collapsedSections: ['history']
  };

  // Saves to VS Code's internal storage
  // NOT visible in project directory
  await context.workspaceState.update('dashboardLayout', layout);
}
```

### Scenario 2: Team AI Rules (Workspace File)
```typescript
// Team wants to share AI instructions for this project
async function createTeamRules(workspacePath: string) {
  const rulesPath = path.join(workspacePath, '.missioncontrol', 'rules.md');

  const rules = `# AI Instructions for This Project

## Always
- Use TypeScript with strict mode
- Write tests for business logic
- Follow the architecture in docs/ARCHITECTURE.md

## Never
- Modify files in legacy/ directory without approval
- Use any dependencies without checking DEPENDENCIES.md
`;

  // Creates ACTUAL FILE in project
  // Team can commit this to git
  // Other developers see the same rules
  await fs.writeFile(rulesPath, rules, 'utf-8');
}
```

### Scenario 3: Current Task Session (Workspace Storage)
```typescript
// Track current work session (temporary, user-specific)
async function saveCurrentSession(context: vscode.ExtensionContext) {
  const session = {
    taskId: 'task-123',
    activeAgents: ['claude'],
    startTime: Date.now(),
    breakdownSteps: ['analyze', 'plan', 'implement']
  };

  // Workspace storage - not shared, not visible
  await context.workspaceState.update('currentSession', session);
}
```

---

## Recommendation for Mission Control

### Phase 1 (Now): Use Workspace Storage API Only
- Simplest to implement
- No file management complexity
- Good for initial testing
- User-specific settings work immediately

### Phase 2 (Later): Add Optional File Support
- Allow users to create `.missioncontrol/` if they want
- Detect and load from files if present
- Fall back to workspace storage if not
- Give users choice: personal vs team config

### Phase 3 (Future): Hybrid Intelligence
- Load team rules from `.missioncontrol/rules.md` (if exists)
- Override with personal preferences from workspace storage
- Best of both worlds: team standards + personal customization

---

## Questions This Answers

**Q: "Where does the data actually go?"**
- **Workspace Storage API**: VS Code's internal database (hidden)
- **Workspace Files**: Your project directory (visible)

**Q: "Can my team see my settings?"**
- **Workspace Storage API**: No (user-specific, not committed)
- **Workspace Files**: Yes (if committed to git)

**Q: "What happens if I delete my project?"**
- **Workspace Storage API**: VS Code cleans it up automatically
- **Workspace Files**: Deleted with your project

**Q: "Can I edit the settings in a text editor?"**
- **Workspace Storage API**: No (binary database)
- **Workspace Files**: Yes (they're just files!)

**Q: "Does it clutter my project?"**
- **Workspace Storage API**: No (invisible)
- **Workspace Files**: Yes (visible folder)

---

**Created**: 2025-10-27
**Status**: Explained in Detail
