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
 * Chat provider for Google Gemini models
 */
export class GeminiChatProvider extends BaseChatProvider {

	constructor(
		@ILanguageModelsService private readonly languageModelsService: ILanguageModelsService,
		@ILogService private readonly logService: ILogService
	) {
		super('gemini', 'Gemini (Google)');
		this.checkAvailability();
	}

	private async checkAvailability(): Promise<void> {
		try {
			const models = await this.languageModelsService.getLanguageModelIds();
			const geminiAvailable = models.some(id =>
				id.includes('gemini') ||
				id.includes('google')
			);
			this.setAvailability(geminiAvailable);
			this.logService.info(`[GeminiChatProvider] Availability: ${geminiAvailable}`);
		} catch (error) {
			this.logService.error('[GeminiChatProvider] Error checking availability:', error);
			this.setAvailability(false);
		}
	}

	private async selectModel(token: CancellationToken): Promise<any> {
		const mapping = AGENT_MODEL_MAPPING['gemini'];

		try {
			const models = await this.languageModelsService.getLanguageModelIds();
			const geminiModels = models.filter(id =>
				id.includes('gemini') ||
				id.includes('google')
			);

			if (geminiModels.length === 0) {
				throw new Error('No Gemini models available');
			}

			// Prefer Gemini 2.0, then 1.5 Pro, then any Gemini model
			const preferredModel =
				geminiModels.find(id => id.includes('gemini-2.0')) ||
				geminiModels.find(id => id.includes('gemini-1.5-pro')) ||
				geminiModels.find(id => id.includes('gemini-pro')) ||
				geminiModels[0];

			this.logService.info(`[GeminiChatProvider] Selected model: ${preferredModel}`);

			return await this.languageModelsService.selectLanguageModels({
				vendor: mapping.vendor,
				family: mapping.family,
				id: preferredModel
			});
		} catch (error) {
			this.logService.error('[GeminiChatProvider] Error selecting model:', error);
			throw error;
		}
	}

	private convertMessages(request: IChatRequest): VSCodeChatMessage[] {
		const messages: VSCodeChatMessage[] = [];

		if (request.systemPrompt) {
			messages.push({
				role: ChatMessageRole.System,
				content: [{ type: 'text', value: request.systemPrompt }]
			});
		}

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

	async sendMessage(request: IChatRequest): Promise<IChatResponse> {
		this.validateRequest(request);

		try {
			const model = await this.selectModel(CancellationToken.None);
			const messages = this.convertMessages(request);

			const response = await model.sendChatRequest(
				messages,
				undefined,
				{
					temperature: request.temperature,
					maxTokens: request.maxTokens
				},
				CancellationToken.None
			);

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
					model: 'gemini',
					finishReason: 'stop'
				}
			};
		} catch (error) {
			this.logService.error('[GeminiChatProvider] Error sending message:', error);
			throw this.handleError(error);
		}
	}

	async *streamMessage(request: IChatRequest): AsyncIterableIterator<IChatResponseChunk> {
		this.validateRequest(request);

		try {
			const model = await this.selectModel(CancellationToken.None);
			const messages = this.convertMessages(request);

			const response = await model.sendChatRequest(
				messages,
				undefined,
				{
					temperature: request.temperature,
					maxTokens: request.maxTokens
				},
				CancellationToken.None
			);

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

			yield {
				content: '',
				done: true,
				metadata: {
					finishReason: 'stop'
				}
			};
		} catch (error) {
			this.logService.error('[GeminiChatProvider] Error streaming message:', error);
			throw this.handleError(error);
		}
	}
}
