# Office Document Checkout/Checkin System - VS Code Integration

**Date**: 2025-10-26
**Source**: Extracted from Windsurf Office MCP
**Purpose**: Enable smooth AI-human collaborative editing with RAG operations

---

## The Problem

When AI edits Office documents while a user has them open:
- **Cursor jumping** - User's cursor moves unexpectedly
- **Screen flashing** - Each edit causes visual disruption
- **Input blocking** - User can't type during AI edits
- **Data conflicts** - Concurrent edits cause inconsistencies
- **Poor UX** - Frustrating for users watching AI work

---

## The Solution: Checkout/Checkin Pattern

Think of it like **version control for live documents**:

1. **CHECKOUT** - AI "locks" the document for editing
   - User can watch but not edit
   - Screen updating disabled for smooth batching
   - Status bar shows "AI is editing..."

2. **EDIT** - AI queues all changes
   - Changes batched in memory
   - No immediate application to document
   - Fast, no visual disruption

3. **CHECKIN** - Apply all changes at once and release
   - All edits applied atomically
   - Screen refreshes once
   - User regains control
   - Document saved (optional)

---

## Architecture Overview

### Components (from Windsurf MCP):

1. **SessionManager** - Prevents conflicts between multiple agents
2. **WordComBatchHandler** - Manages checkout/checkin for Word
3. **Edit Queue** - Stores pending operations
4. **PowerShell COM Integration** - Controls Office application

### Key Concepts:

**Session**:
```typescript
interface Session {
  id: string;
  created: number;
  lastActivity: number;
  checkedOutApps: Set<string>;  // 'word', 'excel', 'powerpoint'
}
```

**App State**:
```typescript
interface AppState {
  checkedOut: boolean;
  checkedOutBy: string | null;  // Session ID
  instance: any;                 // COM instance
  lastActivity: number | null;
  processId: number | null;
}
```

**Edit Operation**:
```typescript
interface EditOperation {
  type: 'append' | 'replace' | 'insert' | 'highlight';
  params: {
    text?: string;
    find?: string;
    replace?: string;
    bold?: boolean;
    color?: string;
  };
}
```

---

## Implementation for VS Code

### File Structure:

```
src/vs/workbench/contrib/officeIntegration/
├── common/
│   ├── officeCheckoutService.ts          # Service interface
│   └── officeSessionManager.ts           # Session management
└── node/
    ├── officeCheckoutServiceImpl.ts      # Implementation
    └── wordBatchHandler.ts               # Word-specific batching
```

### 1. Session Manager (`officeSessionManager.ts`)

```typescript
/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

/**
 * Session Management for Office Document Checkout/Checkin
 * Prevents conflicts between multiple AI agents or users
 */

export interface IOfficeSession {
	id: string;
	created: number;
	lastActivity: number;
	checkedOutApps: Set<string>;  // 'word', 'excel', 'powerpoint'
	pendingEdits: Map<string, IEditOperation[]>;
}

export interface IAppState {
	checkedOut: boolean;
	checkedOutBy: string | null;
	instance: any;  // COM instance
	lastActivity: number | null;
	processId: number | null;
}

export interface IEditOperation {
	type: 'append' | 'replace' | 'insert' | 'highlight' | 'format';
	params: any;
}

export class OfficeSessionManager {
	private sessions: Map<string, IOfficeSession> = new Map();
	private appStates: Map<string, IAppState> = new Map();
	private readonly SESSION_TIMEOUT = 30 * 60 * 1000; // 30 minutes
	private cleanupInterval: NodeJS.Timeout | undefined;

	constructor() {
		// Initialize app states
		['word', 'excel', 'powerpoint'].forEach(app => {
			this.appStates.set(app, {
				checkedOut: false,
				checkedOutBy: null,
				instance: null,
				lastActivity: null,
				processId: null
			});
		});

		// Start cleanup interval
		this.cleanupInterval = setInterval(() => this.cleanupInactiveSessions(), 60000);
	}

	/**
	 * Create or get a session
	 */
	getOrCreateSession(sessionId?: string): string {
		if (!sessionId) {
			sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
		}

		if (!this.sessions.has(sessionId)) {
			this.sessions.set(sessionId, {
				id: sessionId,
				created: Date.now(),
				lastActivity: Date.now(),
				checkedOutApps: new Set(),
				pendingEdits: new Map()
			});
		} else {
			const session = this.sessions.get(sessionId)!;
			session.lastActivity = Date.now();
		}

		return sessionId;
	}

	/**
	 * Check out an app for exclusive use
	 */
	checkOutApp(appType: string, sessionId: string): boolean {
		const appState = this.appStates.get(appType);
		if (!appState) {
			return false;
		}

		const session = this.sessions.get(sessionId);
		if (!session) {
			return false;
		}

		// If already checked out by another session
		if (appState.checkedOut && appState.checkedOutBy !== sessionId) {
			// Check if the owning session is still active
			const ownerSession = this.sessions.get(appState.checkedOutBy!);
			if (ownerSession && Date.now() - ownerSession.lastActivity < this.SESSION_TIMEOUT) {
				return false; // App is legitimately checked out
			}
			// Release stale checkout
			this.releaseApp(appType);
		}

		// Check out the app
		appState.checkedOut = true;
		appState.checkedOutBy = sessionId;
		appState.lastActivity = Date.now();
		session.checkedOutApps.add(appType);
		session.lastActivity = Date.now();

		return true;
	}

	/**
	 * Queue an edit operation for a checked-out app
	 */
	queueEdit(appType: string, sessionId: string, edit: IEditOperation): boolean {
		const session = this.sessions.get(sessionId);
		if (!session) {
			return false;
		}

		const appState = this.appStates.get(appType);
		if (!appState || appState.checkedOutBy !== sessionId) {
			return false;
		}

		if (!session.pendingEdits.has(appType)) {
			session.pendingEdits.set(appType, []);
		}

		session.pendingEdits.get(appType)!.push(edit);
		session.lastActivity = Date.now();
		appState.lastActivity = Date.now();

		return true;
	}

	/**
	 * Get pending edits for an app
	 */
	getPendingEdits(appType: string, sessionId: string): IEditOperation[] {
		const session = this.sessions.get(sessionId);
		if (!session) {
			return [];
		}

		return session.pendingEdits.get(appType) || [];
	}

	/**
	 * Clear pending edits after checkin
	 */
	clearPendingEdits(appType: string, sessionId: string): void {
		const session = this.sessions.get(sessionId);
		if (session) {
			session.pendingEdits.delete(appType);
		}
	}

	/**
	 * Release an app
	 */
	releaseApp(appType: string): void {
		const appState = this.appStates.get(appType);
		if (!appState) {
			return;
		}

		if (appState.checkedOutBy) {
			const session = this.sessions.get(appState.checkedOutBy);
			if (session) {
				session.checkedOutApps.delete(appType);
				session.pendingEdits.delete(appType);
			}
		}

		appState.checkedOut = false;
		appState.checkedOutBy = null;
		appState.instance = null;
		appState.lastActivity = null;
		appState.processId = null;
	}

	/**
	 * Release all apps checked out by a session
	 */
	releaseSession(sessionId: string): void {
		const session = this.sessions.get(sessionId);
		if (!session) {
			return;
		}

		for (const appType of session.checkedOutApps) {
			this.releaseApp(appType);
		}

		this.sessions.delete(sessionId);
	}

	/**
	 * Get session status
	 */
	getStatus(): any {
		const status = {
			sessions: Array.from(this.sessions.keys()),
			appStates: {} as any
		};

		for (const [app, state] of this.appStates.entries()) {
			status.appStates[app] = {
				checkedOut: state.checkedOut,
				checkedOutBy: state.checkedOutBy,
				lastActivity: state.lastActivity
			};
		}

		return status;
	}

	/**
	 * Clean up inactive sessions
	 */
	private cleanupInactiveSessions(): void {
		const now = Date.now();

		for (const [sessionId, session] of this.sessions.entries()) {
			if (now - session.lastActivity > this.SESSION_TIMEOUT) {
				this.releaseSession(sessionId);
			}
		}

		// Also check for stale app checkouts
		for (const [appType, appState] of this.appStates.entries()) {
			if (appState.checkedOut && appState.lastActivity &&
				now - appState.lastActivity > this.SESSION_TIMEOUT) {
				this.releaseApp(appType);
			}
		}
	}

	/**
	 * Cleanup on shutdown
	 */
	dispose(): void {
		if (this.cleanupInterval) {
			clearInterval(this.cleanupInterval);
		}

		// Release all sessions
		for (const sessionId of this.sessions.keys()) {
			this.releaseSession(sessionId);
		}
	}
}
```

### 2. Word Batch Handler (`wordBatchHandler.ts`)

```typescript
/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { exec } from 'child_process';
import { promisify } from 'util';
import * as path from 'path';
import * as fs from 'fs/promises';
import { IEditOperation } from '../common/officeSessionManager.js';

const execAsync = promisify(exec);

/**
 * Word Batch Handler - Manages checkout/checkin with PowerShell COM
 */
export class WordBatchHandler {

	/**
	 * Execute PowerShell script
	 */
	private async executePowerShell(script: string): Promise<string> {
		const tempScript = path.join(process.env.TEMP || '/tmp', `word_batch_${Date.now()}.ps1`);
		await fs.writeFile(tempScript, script);

		const { stdout, stderr } = await execAsync(
			`powershell -ExecutionPolicy Bypass -File "${tempScript}"`,
			{ encoding: 'utf8' }
		);

		try {
			await fs.unlink(tempScript);
		} catch (e) {
			// Ignore cleanup errors
		}

		if (stderr && !stderr.includes('Warning')) {
			throw new Error(stderr);
		}

		return stdout;
	}

	/**
	 * Checkout document - disable user input, prepare for batch edits
	 */
	async checkout(): Promise<boolean> {
		const script = `
			try {
				$word = [System.Runtime.InteropServices.Marshal]::GetActiveObject("Word.Application")
				if ($word.ActiveDocument) {
					# Disable screen updating for smooth batch edits
					$word.ScreenUpdating = $false

					# Save current cursor position
					$global:savedSelection = $word.Selection.Range

					# Disable user input temporarily
					$word.Options.AllowClickAndTypeMouse = $false

					# Show status message
					$word.StatusBar = "AI Assistant is editing document..."

					Write-Output "success"
				} else {
					Write-Output "No active document"
				}
			} catch {
				Write-Output "Error: $_"
			}
		`;

		const result = await this.executePowerShell(script);
		return result.trim() === 'success';
	}

	/**
	 * Checkin document - apply all edits, re-enable user input
	 */
	async checkin(save: boolean = false): Promise<boolean> {
		const script = `
			try {
				$word = [System.Runtime.InteropServices.Marshal]::GetActiveObject("Word.Application")
				if ($word.ActiveDocument) {
					${save ? '# Save changes\n\t\t\t\t\t$word.ActiveDocument.Save()' : ''}

					# Re-enable screen updating
					$word.ScreenUpdating = $true

					# Re-enable user input
					$word.Options.AllowClickAndTypeMouse = $true

					# Clear status message
					$word.StatusBar = "Ready"

					# Force refresh
					$word.ActiveDocument.ActiveWindow.View.Type = 1  # Print Layout
					$word.ActiveDocument.ActiveWindow.Repaginate()

					# Restore saved selection if possible
					if ($global:savedSelection) {
						$global:savedSelection.Select()
					}

					Write-Output "success"
				} else {
					Write-Output "No active document"
				}
			} catch {
				Write-Output "Error: $_"
			}
		`;

		const result = await this.executePowerShell(script);
		return result.trim() === 'success';
	}

	/**
	 * Execute a batch of edits while checked out
	 */
	async executeBatch(edits: IEditOperation[]): Promise<number> {
		// Build PowerShell script with all edits
		let editScript = `
			try {
				$word = [System.Runtime.InteropServices.Marshal]::GetActiveObject("Word.Application")
				if ($word.ActiveDocument) {
					$doc = $word.ActiveDocument
					$successCount = 0
		`;

		for (const edit of edits) {
			switch (edit.type) {
				case 'append':
					const appendText = this.escapeForPowerShell(edit.params.text);
					editScript += `
					# Append operation
					$range = $doc.Content
					$range.Collapse([Microsoft.Office.Interop.Word.WdCollapseDirection]::wdCollapseEnd)
					$range.InsertParagraphAfter()
					$range.InsertAfter("${appendText}")
					`;
					if (edit.params.bold) {
						editScript += `$range.Font.Bold = $true\n`;
					}
					editScript += `$successCount++\n`;
					break;

				case 'replace':
					const findText = this.escapeForPowerShell(edit.params.find);
					const replaceText = this.escapeForPowerShell(edit.params.replace);
					editScript += `
					# Replace operation
					$findObject = $doc.Content.Find
					$findObject.ClearFormatting()
					$findObject.Replacement.ClearFormatting()
					$findObject.Text = "${findText}"
					$findObject.Replacement.Text = "${replaceText}"
					$findObject.Execute([ref]$null, [ref]$null, [ref]$null, [ref]$null, [ref]$null,
					                  [ref]$null, [ref]$null, [ref]$null, [ref]$null, [ref]$null, 2)
					$successCount++
					`;
					break;

				case 'insert':
					const insertText = this.escapeForPowerShell(edit.params.text);
					editScript += `
					# Insert at cursor
					$selection = $word.Selection
					`;
					if (edit.params.bold) {
						editScript += `$selection.Font.Bold = $true\n`;
					}
					editScript += `
					$selection.TypeText("${insertText}")
					`;
					if (edit.params.bold) {
						editScript += `$selection.Font.Bold = $false\n`;
					}
					editScript += `$successCount++\n`;
					break;

				case 'highlight':
					const highlightText = this.escapeForPowerShell(edit.params.text);
					const colorIndex = this.getColorIndex(edit.params.color || 'Yellow');
					editScript += `
					# Highlight operation
					$findObject = $doc.Content.Find
					$findObject.ClearFormatting()
					$findObject.Text = "${highlightText}"
					while ($findObject.Execute()) {
						$findObject.Parent.HighlightColorIndex = ${colorIndex}
					}
					$successCount++
					`;
					break;
			}
		}

		editScript += `
					Write-Output $successCount
				} else {
					Write-Output "0"
				}
			} catch {
				Write-Output "0"
			}
		`;

		// Execute all edits at once
		const result = await this.executePowerShell(editScript);
		return parseInt(result.trim()) || 0;
	}

	/**
	 * Escape text for PowerShell
	 */
	private escapeForPowerShell(text: string): string {
		return text
			.replace(/\\/g, '\\\\')
			.replace(/"/g, '`"')
			.replace(/\$/g, '`$')
			.replace(/\n/g, '`n')
			.replace(/\r/g, '`r');
	}

	/**
	 * Get color index for highlighting
	 */
	private getColorIndex(color: string): number {
		switch (color.toLowerCase()) {
			case 'yellow': return 7;
			case 'green': return 4;
			case 'blue': return 2;
			case 'red': return 6;
			case 'pink': return 5;
			default: return 7;
		}
	}
}
```

---

## Usage Examples

### Simple Checkout/Checkin:

```typescript
// 1. Create session
const sessionId = sessionManager.getOrCreateSession();

// 2. Checkout Word
const checked = sessionManager.checkOutApp('word', sessionId);
if (!checked) {
  throw new Error('Document already checked out');
}

await wordBatchHandler.checkout();

// 3. Queue edits
sessionManager.queueEdit('word', sessionId, {
  type: 'append',
  params: { text: 'Hello World', bold: true }
});

sessionManager.queueEdit('word', sessionId, {
  type: 'replace',
  params: { find: 'old', replace: 'new' }
});

// 4. Apply all edits
const edits = sessionManager.getPendingEdits('word', sessionId);
await wordBatchHandler.executeBatch(edits);

// 5. Checkin and save
await wordBatchHandler.checkin(true);
sessionManager.clearPendingEdits('word', sessionId);
sessionManager.releaseApp('word');
```

### With RAG Operations:

```typescript
// Use case: AI summarizes document sections and adds highlights

// 1. Checkout
const sessionId = sessionManager.getOrCreateSession();
sessionManager.checkOutApp('word', sessionId);
await wordBatchHandler.checkout();

// 2. Read document content (RAG retrieval)
const content = await officeService.executeMCPTool('word_get_text', {});

// 3. AI processes content
const sections = await aiModel.extractSections(content);

// 4. Queue highlights for key sections
for (const section of sections) {
  sessionManager.queueEdit('word', sessionId, {
    type: 'highlight',
    params: { text: section.keyPhrase, color: 'yellow' }
  });
}

// 5. Add summary at end
sessionManager.queueEdit('word', sessionId, {
  type: 'append',
  params: { text: `\n\n## AI Summary\n${sections.summary}`, bold: true }
});

// 6. Apply all at once
const edits = sessionManager.getPendingEdits('word', sessionId);
await wordBatchHandler.executeBatch(edits);
await wordBatchHandler.checkin(true);

sessionManager.clearPendingEdits('word', sessionId);
sessionManager.releaseApp('word');
```

---

## Benefits for RAG Operations

1. **Atomic Updates** - All RAG-based edits applied together
2. **No Visual Disruption** - User watches smooth single refresh
3. **Conflict Prevention** - Session management prevents collisions
4. **Error Recovery** - Failed operations don't leave document in bad state
5. **Performance** - Batch operations much faster than individual edits

---

## Next Steps for Integration

1. Create `officeCheckoutService.ts` interface
2. Implement `officeCheckoutServiceImpl.ts`
3. Add checkout/checkin tools to tool registry
4. Update Office tools to support checkout/checkin pattern
5. Test with RAG workflows

---

## Tool Definitions

```typescript
// New tools to add:

office_checkout({app: 'word' | 'excel' | 'powerpoint'}): Promise<{sessionId: string}>
office_checkin({sessionId: string, save?: boolean}): Promise<{editsApplied: number}>
office_queue_edit({sessionId: string, edit: IEditOperation}): Promise<{queued: number}>
office_checkout_status({sessionId: string}): Promise<{checkedOut: boolean, pendingEdits: number}>
```

This provides smooth AI-human collaboration with RAG-powered intelligence!
