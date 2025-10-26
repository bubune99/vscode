/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { Disposable } from '../../../../base/common/lifecycle.js';
import { Emitter, Event } from '../../../../base/common/event.js';
import type { AgentType } from './aiOrchestratorService.js';
import type {
	IChatProvider,
	IChatRequest,
	IChatResponse,
	IChatResponseChunk
} from './chatService.js';

/**
 * Abstract base class for all chat providers
 * Provides common functionality and enforces interface implementation
 */
export abstract class BaseChatProvider extends Disposable implements IChatProvider {
	private readonly _onDidChangeAvailability = this._register(new Emitter<boolean>());
	public readonly onDidChangeAvailability: Event<boolean> = this._onDidChangeAvailability.event;

	private _isAvailable: boolean = false;

	constructor(
		public readonly agentType: AgentType,
		public readonly displayName: string
	) {
		super();
	}

	/**
	 * Get whether the provider is currently available
	 */
	get isAvailable(): boolean {
		return this._isAvailable;
	}

	/**
	 * Set availability and fire change event
	 * @param available Whether the provider is available
	 */
	protected setAvailability(available: boolean): void {
		if (this._isAvailable !== available) {
			this._isAvailable = available;
			this._onDidChangeAvailability.fire(available);
		}
	}

	/**
	 * Send a chat message and get a response
	 * Must be implemented by subclasses
	 * @param request The chat request
	 * @returns Promise resolving to the chat response
	 */
	abstract sendMessage(request: IChatRequest): Promise<IChatResponse>;

	/**
	 * Stream a chat message
	 * Must be implemented by subclasses
	 * @param request The chat request
	 * @returns AsyncIterable of response chunks
	 */
	abstract streamMessage(request: IChatRequest): AsyncIterableIterator<IChatResponseChunk>;

	/**
	 * Validate a chat request before sending
	 * Can be overridden by subclasses for custom validation
	 * @param request The request to validate
	 * @throws Error if validation fails
	 */
	protected validateRequest(request: IChatRequest): void {
		if (!request.messages || request.messages.length === 0) {
			throw new Error('Chat request must contain at least one message');
		}

		// Validate temperature if provided
		if (request.temperature !== undefined) {
			if (request.temperature < 0 || request.temperature > 1) {
				throw new Error('Temperature must be between 0 and 1');
			}
		}

		// Validate maxTokens if provided
		if (request.maxTokens !== undefined) {
			if (request.maxTokens < 1) {
				throw new Error('Max tokens must be greater than 0');
			}
		}
	}

	/**
	 * Build system prompt from request
	 * Can be overridden by subclasses for custom system prompt handling
	 * @param request The chat request
	 * @returns The system prompt, or undefined
	 */
	protected buildSystemPrompt(request: IChatRequest): string | undefined {
		return request.systemPrompt;
	}

	/**
	 * Handle errors from the provider
	 * Can be overridden by subclasses for custom error handling
	 * @param error The error that occurred
	 * @returns A user-friendly error message
	 */
	protected handleError(error: unknown): Error {
		if (error instanceof Error) {
			return error;
		}
		return new Error(String(error));
	}

	override dispose(): void {
		super.dispose();
	}
}
