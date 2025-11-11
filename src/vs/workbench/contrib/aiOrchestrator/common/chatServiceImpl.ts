/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { Disposable } from '../../../../base/common/lifecycle.js';
import { ILogService } from '../../../../platform/log/common/log.js';
import type { IChatService } from './chatService.js';
import { IDatabaseService } from './databaseService.js';

/**
 * Chat service implementation - persists chat data to database
 * Note: Chat UI uses VS Code's native chat panel, not custom providers
 */
export class ChatService extends Disposable implements IChatService {
	readonly _serviceBrand: undefined;

	// Track current conversation and project for database persistence
	private currentProjectId: string | null = null;
	private currentConversationId: string | null = null;

	constructor(
		@ILogService private readonly logService: ILogService,
		@IDatabaseService private readonly databaseService: IDatabaseService
	) {
		super();
		this.logService.info('[ChatService] Service initialized');
	}

	/**
	 * Set the current project context for message persistence
	 */
	setCurrentProject(projectId: string): void {
		this.currentProjectId = projectId;
		this.logService.info(`[ChatService] Current project set to: ${projectId}`);
	}

	/**
	 * Set the current conversation for message persistence
	 */
	setCurrentConversation(conversationId: string): void {
		this.currentConversationId = conversationId;
		this.logService.info(`[ChatService] Current conversation set to: ${conversationId}`);
	}

	/**
	 * Create a new conversation
	 */
	createConversation(title: string, conversationType: 'planning' | 'execution' | 'review' | 'pivot' | 'general' = 'general'): string | null {
		if (!this.databaseService.isInitialized() || !this.currentProjectId) {
			this.logService.warn('[ChatService] Cannot create conversation: database not initialized or no project set');
			return null;
		}

		try {
			const conversation = this.databaseService.createConversation({
				project_id: this.currentProjectId,
				conversation_type: conversationType,
				title
			});

			this.currentConversationId = conversation.id;
			this.logService.info(`[ChatService] Created conversation: ${conversation.id}`);
			return conversation.id;
		} catch (error) {
			this.logService.error('[ChatService] Error creating conversation:', error);
			return null;
		}
	}

	/**
	 * Get the current conversation ID
	 * @returns The current conversation ID, or null if not set
	 */
	getCurrentConversationId(): string | null {
		return this.currentConversationId;
	}

	/**
	 * Get the current project ID
	 * @returns The current project ID, or null if not set
	 */
	getCurrentProjectId(): string | null {
		return this.currentProjectId;
	}

	override dispose(): void {
		super.dispose();
	}
}
