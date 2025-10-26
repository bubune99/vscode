/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { CancellationToken } from '../../../../../base/common/cancellation.js';
import { ILogService } from '../../../../../platform/log/common/log.js';
import { BaseChatProvider } from '../baseChatProvider.js';
import type { IChatRequest, IChatResponse, IChatResponseChunk } from '../chatService.js';
import { ILanguageModelsService, ChatMessageRole, type IChatMessage as VSCodeChatMessage } from '../../../chat/common/languageModels.js';
import { AGENT_MODEL_MAPPING } from '../aiOrchestratorService.js';

/**
 * Chat provider for Anthropic Claude models
 */
export class ClaudeChatProvider extends BaseChatProvider {

	constructor(
		@ILanguageModelsService private readonly languageModelsService: ILanguageModelsService,
		@ILogService private readonly logService: ILogService
	) {
		super('claude', 'Claude (Anthropic)');
		this.checkAvailability();
	}

	/**
	 * Check if Claude models are available
	 */
	private async checkAvailability(): Promise<void> {
		try {
			const models = await this.languageModelsService.getLanguageModelIds();
			const claudeAvailable = models.some(id =>
				id.includes('claude') ||
				id.includes('anthropic')
			);
			this.setAvailability(claudeAvailable);
			this.logService.info(`[ClaudeChatProvider] Availability: ${claudeAvailable}`);
		} catch (error) {
			this.logService.error('[ClaudeChatProvider] Error checking availability:', error);
			this.setAvailability(false);
		}
	}

	/**
	 * Select the best available Claude model
	 */
	private async selectModel(token: CancellationToken): Promise<any> {
		const mapping = AGENT_MODEL_MAPPING['claude'];

		try {
			// Get all available models
			const models = await this.languageModelsService.getLanguageModelIds();

			// Find Claude models (prefer newer versions)
			const claudeModels = models.filter(id =>
				id.includes('claude') ||
				id.includes('anthropic')
			);

			if (claudeModels.length === 0) {
				throw new Error('No Claude models available');
			}

			// Prefer Claude 3.5 Sonnet, then Claude 3 Opus, then any Claude model
			const preferredModel =
				claudeModels.find(id => id.includes('claude-3-5-sonnet')) ||
				claudeModels.find(id => id.includes('claude-3-opus')) ||
				claudeModels.find(id => id.includes('claude-3-sonnet')) ||
				claudeModels[0];

			this.logService.info(`[ClaudeChatProvider] Selected model: ${preferredModel}`);

			return await this.languageModelsService.selectLanguageModels({
				vendor: mapping.vendor,
				family: mapping.family,
				id: preferredModel
			});
		} catch (error) {
			this.logService.error('[ClaudeChatProvider] Error selecting model:', error);
			throw error;
		}
	}

	/**
	 * Convert our chat messages to VS Code format
	 */
	private convertMessages(request: IChatRequest): VSCodeChatMessage[] {
		const messages: VSCodeChatMessage[] = [];

		// Add system prompt if provided
		if (request.systemPrompt) {
			messages.push({
				role: ChatMessageRole.System,
				content: [{ type: 'text', value: request.systemPrompt }]
			});
		}

		// Convert request messages
		for (const msg of request.messages) {
			let role: ChatMessageRole;
			switch (msg.role) {
				case 'system':
					role = ChatMessageRole.System;
					break;
				case 'assistant':
					role = ChatMessageRole.Assistant;
					break;
				case 'user':
				default:
					role = ChatMessageRole.User;
					break;
			}

			messages.push({
				role,
				content: [{ type: 'text', value: msg.content }]
			});
		}

		return messages;
	}

	/**
	 * Send a message and get a complete response
	 */
	async sendMessage(request: IChatRequest): Promise<IChatResponse> {
		this.validateRequest(request);

		try {
			const model = await this.selectModel(CancellationToken.None);
			const messages = this.convertMessages(request);

			// Send request
			const response = await model.sendChatRequest(
				messages,
				undefined,
				{
					temperature: request.temperature,
					maxTokens: request.maxTokens
				},
				CancellationToken.None
			);

			// Collect response
			let content = '';
			for await (const part of response.stream) {
				if (Array.isArray(part)) {
					for (const p of part) {
						if (p.type === 'text') {
							content += p.value;
						}
					}
				} else if (part.type === 'text') {
					content += part.value;
				}
			}

			return {
				content,
				metadata: {
					model: 'claude',
					finishReason: 'stop'
				}
			};
		} catch (error) {
			this.logService.error('[ClaudeChatProvider] Error sending message:', error);
			throw this.handleError(error);
		}
	}

	/**
	 * Stream a message response
	 */
	async *streamMessage(request: IChatRequest): AsyncIterableIterator<IChatResponseChunk> {
		this.validateRequest(request);

		try {
			const model = await this.selectModel(CancellationToken.None);
			const messages = this.convertMessages(request);

			// Send request
			const response = await model.sendChatRequest(
				messages,
				undefined,
				{
					temperature: request.temperature,
					maxTokens: request.maxTokens
				},
				CancellationToken.None
			);

			// Stream response
			for await (const part of response.stream) {
				if (Array.isArray(part)) {
					for (const p of part) {
						if (p.type === 'text') {
							yield {
								content: p.value,
								done: false
							};
						}
					}
				} else if (part.type === 'text') {
					yield {
						content: part.value,
						done: false
					};
				}
			}

			// Final chunk
			yield {
				content: '',
				done: true,
				metadata: {
					finishReason: 'stop'
				}
			};
		} catch (error) {
			this.logService.error('[ClaudeChatProvider] Error streaming message:', error);
			throw this.handleError(error);
		}
	}
}
