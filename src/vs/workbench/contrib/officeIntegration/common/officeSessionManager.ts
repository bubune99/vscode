/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { randomUUID } from 'crypto';

/**
 * Edit operation types
 */
export type EditOperationType = 'append' | 'replace' | 'insert' | 'highlight' | 'format' | 'delete';

/**
 * Single edit operation
 */
export interface IEditOperation {
	type: EditOperationType;
	params: any;
}

/**
 * Office application session
 */
export interface IOfficeSession {
	id: string;
	appType: 'word' | 'excel' | 'powerpoint';
	checkedOut: boolean;
	checkedOutAt?: Date;
	pendingEdits: IEditOperation[];
}

/**
 * Application state tracking
 */
export interface IAppState {
	activeSessionId: string | null;
	isLocked: boolean;
}

/**
 * Office Session Manager - Manages checkout/checkin sessions for Office documents
 *
 * This prevents cursor jumping and screen flashing during AI edits by:
 * 1. Locking the document (checkout)
 * 2. Queuing all edit operations
 * 3. Applying all edits at once (checkin)
 *
 * Usage:
 * ```typescript
 * // 1. Checkout
 * const sessionId = sessionManager.getOrCreateSession();
 * sessionManager.checkOutApp('word', sessionId);
 *
 * // 2. Queue edits
 * sessionManager.queueEdit('word', sessionId, {
 *   type: 'append',
 *   params: { text: 'Hello', bold: true }
 * });
 *
 * // 3. Checkin (apply all)
 * const edits = sessionManager.getPendingEdits('word', sessionId);
 * // Apply edits via COM batch handler
 * sessionManager.releaseApp('word');
 * ```
 */
export class OfficeSessionManager {
	private sessions: Map<string, IOfficeSession> = new Map();
	private appStates: Map<string, IAppState> = new Map();

	constructor() {
		// Initialize app states
		this.appStates.set('word', { activeSessionId: null, isLocked: false });
		this.appStates.set('excel', { activeSessionId: null, isLocked: false });
		this.appStates.set('powerpoint', { activeSessionId: null, isLocked: false });
	}

	/**
	 * Get or create a new session
	 */
	getOrCreateSession(): string {
		const sessionId = randomUUID();
		return sessionId;
	}

	/**
	 * Check out an Office application for exclusive editing
	 * Returns false if app is already checked out by another session
	 */
	checkOutApp(appType: 'word' | 'excel' | 'powerpoint', sessionId: string): boolean {
		const appState = this.appStates.get(appType);
		if (!appState) {
			throw new Error(`Unknown app type: ${appType}`);
		}

		// Check if app is already locked by different session
		if (appState.isLocked && appState.activeSessionId !== sessionId) {
			return false;
		}

		// Create or update session
		let session = this.sessions.get(sessionId);
		if (!session) {
			session = {
				id: sessionId,
				appType,
				checkedOut: true,
				checkedOutAt: new Date(),
				pendingEdits: []
			};
			this.sessions.set(sessionId, session);
		} else {
			session.checkedOut = true;
			session.checkedOutAt = new Date();
		}

		// Lock app
		appState.isLocked = true;
		appState.activeSessionId = sessionId;

		return true;
	}

	/**
	 * Queue an edit operation for later execution
	 */
	queueEdit(appType: 'word' | 'excel' | 'powerpoint', sessionId: string, edit: IEditOperation): boolean {
		const appState = this.appStates.get(appType);
		if (!appState) {
			throw new Error(`Unknown app type: ${appType}`);
		}

		// Verify session owns the lock
		if (!appState.isLocked || appState.activeSessionId !== sessionId) {
			return false;
		}

		const session = this.sessions.get(sessionId);
		if (!session || !session.checkedOut) {
			return false;
		}

		session.pendingEdits.push(edit);
		return true;
	}

	/**
	 * Get all pending edits for a session
	 */
	getPendingEdits(appType: 'word' | 'excel' | 'powerpoint', sessionId: string): IEditOperation[] {
		const appState = this.appStates.get(appType);
		if (!appState || appState.activeSessionId !== sessionId) {
			return [];
		}

		const session = this.sessions.get(sessionId);
		if (!session) {
			return [];
		}

		return session.pendingEdits;
	}

	/**
	 * Release app lock and clean up session
	 */
	releaseApp(appType: 'word' | 'excel' | 'powerpoint'): void {
		const appState = this.appStates.get(appType);
		if (!appState) {
			throw new Error(`Unknown app type: ${appType}`);
		}

		// Clean up session
		if (appState.activeSessionId) {
			const session = this.sessions.get(appState.activeSessionId);
			if (session) {
				session.checkedOut = false;
				session.pendingEdits = [];
			}
		}

		// Unlock app
		appState.isLocked = false;
		appState.activeSessionId = null;
	}

	/**
	 * Check if app is currently checked out
	 */
	isAppCheckedOut(appType: 'word' | 'excel' | 'powerpoint'): boolean {
		const appState = this.appStates.get(appType);
		return appState?.isLocked || false;
	}

	/**
	 * Get session status
	 */
	getSessionStatus(sessionId: string): IOfficeSession | null {
		return this.sessions.get(sessionId) || null;
	}

	/**
	 * Clear all sessions (for cleanup)
	 */
	clearAllSessions(): void {
		this.sessions.clear();
		this.appStates.forEach(state => {
			state.isLocked = false;
			state.activeSessionId = null;
		});
	}
}
