/*---------------------------------------------------------------------------------------------
 *  OpenAI Language Model Provider
 *  Provides GPT-4, GPT-3.5, and other OpenAI models
 *--------------------------------------------------------------------------------------------*/

import { CancellationToken } from '../../../../../base/common/cancellation.js';
import { ExtensionIdentifier } from '../../../../../platform/extensions/common/extensions.js';
import { ILogService } from '../../../../../platform/log/common/log.js';
import { IConfigurationService } from '../../../../../platform/configuration/common/configuration.js';
import {
	ILanguageModelChatResponse,
	ILanguageModelChatMetadataAndIdentifier,
	IChatMessage,
	IChatResponseTextPart,
	ChatMessageRole
} from '../../../chat/common/languageModels.js';
import { BaseLanguageModelProvider } from './baseProvider.js';

// Will be imported from SDK
// import OpenAI from 'openai';

export class OpenAILanguageModelProvider extends BaseLanguageModelProvider {

	private static readonly EXTENSION_ID = new ExtensionIdentifier('vscode.openai');
	private static readonly CONFIG_KEY = 'aiOrchestrator.openai';

	// OpenAI client instance (lazy loaded)
	private client: any; // OpenAI instance

	constructor(
		logService: ILogService,
		configurationService: IConfigurationService
	) {
		super(OpenAILanguageModelProvider.CONFIG_KEY, logService, configurationService);
	}

	protected getEnvVarName(): string {
		return 'OPENAI_API_KEY';
	}

	protected getProviderName(): string {
		return 'OpenAI';
	}

	private getClient(): any {
		if (!this.client) {
			const config = this.getConfig();
			if (!config.apiKey) {
				throw new Error('OpenAI API key not configured');
			}

			// TODO: Import and instantiate OpenAI SDK
			// For now, return mock
			this.log('Creating OpenAI client');
			this.client = {
				chat: {
					completions: {
						create: async (params: any) => {
							// Mock response for now
							return {
								id: 'mock-id',
								choices: [{
									message: {
										content: 'This is a mock response from OpenAI provider. SDK will be integrated soon.'
									}
								}]
							};
						}
					}
				}
			};

			/*
			// Real implementation:
			const OpenAI = require('openai');
			this.client = new OpenAI({
				apiKey: config.apiKey,
				baseURL: config.baseURL
			});
			*/
		}
		return this.client;
	}

	async provideLanguageModelChatInfo(
		options: { silent: boolean },
		token: CancellationToken
	): Promise<ILanguageModelChatMetadataAndIdentifier[]> {

		if (!this.isConfigured()) {
			if (!options.silent) {
				this.log('Not configured, skipping');
			}
			return [];
		}

		this.log('Providing OpenAI models');

		return [
			{
				identifier: 'openai-gpt4',
				metadata: {
					extension: OpenAILanguageModelProvider.EXTENSION_ID,
					name: 'GPT-4',
					id: 'gpt-4',
					vendor: 'openai',
					version: '1.0.0',
					family: 'gpt',
					maxInputTokens: 8192,
					maxOutputTokens: 4096,
					isUserSelectable: true,
					modelPickerCategory: { label: 'OpenAI', order: 1 }
				}
			},
			{
				identifier: 'openai-gpt4-turbo',
				metadata: {
					extension: OpenAILanguageModelProvider.EXTENSION_ID,
					name: 'GPT-4 Turbo',
					id: 'gpt-4-turbo-preview',
					vendor: 'openai',
					version: '1.0.0',
					family: 'gpt',
					maxInputTokens: 128000,
					maxOutputTokens: 4096,
					isUserSelectable: true,
					modelPickerCategory: { label: 'OpenAI', order: 1 }
				}
			},
			{
				identifier: 'openai-gpt35-turbo',
				metadata: {
					extension: OpenAILanguageModelProvider.EXTENSION_ID,
					name: 'GPT-3.5 Turbo',
					id: 'gpt-3.5-turbo',
					vendor: 'openai',
					version: '1.0.0',
					family: 'gpt',
					maxInputTokens: 16384,
					maxOutputTokens: 4096,
					isUserSelectable: true,
					modelPickerCategory: { label: 'OpenAI', order: 1 }
				}
			}
		];
	}

	async sendChatRequest(
		modelId: string,
		messages: IChatMessage[],
		from: any,
		options: { [name: string]: any },
		token: CancellationToken
	): Promise<ILanguageModelChatResponse> {

		this.log(`Sending chat request to ${modelId}`);

		try {
			const client = this.getClient();

			// Convert VS Code messages to OpenAI format
			const openaiMessages = messages.map(msg => ({
				role: this.convertRole(msg.role),
				content: msg.content
					.filter(p => p.type === 'text')
					.map(p => (p as any).value)
					.join('\n')
			}));

			// Send request (streaming)
			const stream = await client.chat.completions.create({
				model: this.getModelName(modelId),
				messages: openaiMessages,
				stream: true,
				temperature: options.temperature || 0.7,
				max_tokens: options.maxTokens || 2048,
				...options
			});

			// Convert to VS Code response format
			const responseStream = this.streamToAsyncIterable(
				stream,
				(chunk: any) => {
					const content = chunk.choices?.[0]?.delta?.content;
					if (content) {
						return {
							type: 'text',
							value: content
						} as IChatResponseTextPart;
					}
					return null;
				}
			);

			return {
				stream: responseStream,
				result: Promise.resolve({})
			};

		} catch (error) {
			this.logError('Error sending chat request', error);
			throw error;
		}
	}

	private convertRole(role: ChatMessageRole): string {
		switch (role) {
			case ChatMessageRole.System: return 'system';
			case ChatMessageRole.User: return 'user';
			case ChatMessageRole.Assistant: return 'assistant';
			default: return 'user';
		}
	}

	private getModelName(modelId: string): string {
		// Map our IDs to OpenAI model names
		const mapping: Record<string, string> = {
			'openai-gpt4': 'gpt-4',
			'openai-gpt4-turbo': 'gpt-4-turbo-preview',
			'openai-gpt35-turbo': 'gpt-3.5-turbo'
		};
		return mapping[modelId] || 'gpt-4';
	}
}
