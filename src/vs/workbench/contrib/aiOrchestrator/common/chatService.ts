/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { createDecorator } from '../../../../platform/instantiation/common/instantiation.js';
import { Event } from '../../../../base/common/event.js';
import type { AgentType } from './aiOrchestratorService.js';

export const IChatService = createDecorator<IChatService>('chatService');

/**
 * Message role in a chat conversation
 */
export type ChatRole = 'user' | 'assistant' | 'system';

/**
 * A single message in a chat conversation
 */
export interface IChatMessage {
	/**
	 * Role of the message sender
	 */
	role: ChatRole;

	/**
	 * Content of the message
	 */
	content: string;

	/**
	 * Optional timestamp for the message
	 */
	timestamp?: number;
}

/**
 * Chat request options
 */
export interface IChatRequest {
	/**
	 * The chat messages to send
	 */
	messages: IChatMessage[];

	/**
	 * Optional system prompt to prepend
	 */
	systemPrompt?: string;

	/**
	 * Temperature for response generation (0.0 - 1.0)
	 */
	temperature?: number;

	/**
	 * Maximum tokens in the response
	 */
	maxTokens?: number;

	/**
	 * Whether to stream the response
	 */
	stream?: boolean;
}

/**
 * Response chunk from a streaming chat request
 */
export interface IChatResponseChunk {
	/**
	 * The content delta in this chunk
	 */
	content: string;

	/**
	 * Whether this is the final chunk
	 */
	done: boolean;

	/**
	 * Optional metadata about the response
	 */
	metadata?: {
		tokens?: number;
		finishReason?: string;
	};
}

/**
 * Complete chat response
 */
export interface IChatResponse {
	/**
	 * The complete response content
	 */
	content: string;

	/**
	 * Metadata about the response
	 */
	metadata?: {
		tokens?: number;
		finishReason?: string;
		model?: string;
	};
}

/**
 * Chat provider interface - implemented by each AI provider
 */
export interface IChatProvider {
	/**
	 * The type of agent this provider supports
	 */
	readonly agentType: AgentType;

	/**
	 * Display name of the provider
	 */
	readonly displayName: string;

	/**
	 * Whether this provider is currently available
	 */
	readonly isAvailable: boolean;

	/**
	 * Event fired when availability changes
	 */
	readonly onDidChangeAvailability: Event<boolean>;

	/**
	 * Send a chat request and get a response
	 * @param request The chat request
	 * @returns Promise resolving to the chat response
	 */
	sendMessage(request: IChatRequest): Promise<IChatResponse>;

	/**
	 * Send a chat request and stream the response
	 * @param request The chat request
	 * @returns AsyncIterable of response chunks
	 */
	streamMessage(request: IChatRequest): AsyncIterableIterator<IChatResponseChunk>;

	/**
	 * Dispose of the provider and clean up resources
	 */
	dispose(): void;
}

/**
 * Chat service - manages chat conversations and database persistence
 * Note: Chat UI uses VS Code's native chat panel with registered participants
 */
export interface IChatService {
	readonly _serviceBrand: undefined;

	/**
	 * Set the current project context for message persistence
	 * @param projectId The project ID
	 */
	setCurrentProject(projectId: string): void;

	/**
	 * Set the current conversation for message persistence
	 * @param conversationId The conversation ID
	 */
	setCurrentConversation(conversationId: string): void;

	/**
	 * Create a new conversation
	 * @param title The conversation title
	 * @param conversationType The type of conversation
	 * @returns The conversation ID, or null if creation failed
	 */
	createConversation(title: string, conversationType?: 'planning' | 'execution' | 'review' | 'pivot' | 'general'): string | null;

	/**
	 * Get the current conversation ID
	 * @returns The current conversation ID, or null if not set
	 */
	getCurrentConversationId(): string | null;

	/**
	 * Get the current project ID
	 * @returns The current project ID, or null if not set
	 */
	getCurrentProjectId(): string | null;
}
