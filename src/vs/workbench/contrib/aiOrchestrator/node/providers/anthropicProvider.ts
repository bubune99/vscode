/*---------------------------------------------------------------------------------------------
 *  Anthropic Language Model Provider
 *  Provides Claude models (Opus, Sonnet, Haiku)
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

export class AnthropicLanguageModelProvider extends BaseLanguageModelProvider {

	private static readonly EXTENSION_ID = new ExtensionIdentifier('vscode.anthropic');
	private static readonly CONFIG_KEY = 'aiOrchestrator.anthropic';

	private client: any; // Anthropic client instance

	constructor(
		logService: ILogService,
		configurationService: IConfigurationService
	) {
		super(AnthropicLanguageModelProvider.CONFIG_KEY, logService, configurationService);
	}

	protected getEnvVarName(): string {
		return 'ANTHROPIC_API_KEY';
	}

	protected getProviderName(): string {
		return 'Anthropic';
	}

	private getClient(): any {
		if (!this.client) {
			const config = this.getConfig();
			if (!config.apiKey) {
				throw new Error('Anthropic API key not configured');
			}

			this.log('Creating Anthropic client');
			// Mock for now
			this.client = {
				messages: {
					stream: async (params: any) => {
						// Mock stream
						return {
							async *[Symbol.asyncIterator]() {
								yield {
									type: 'content_block_delta',
									delta: { text: 'Mock response from Claude. SDK will be integrated soon.' }
								};
							}
						};
					}
				}
			};

			/*
			// Real implementation:
			const Anthropic = require('@anthropic-ai/sdk');
			this.client = new Anthropic({
				apiKey: config.apiKey
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

		this.log('Providing Anthropic models');

		return [
			{
				identifier: 'anthropic-claude-opus',
				metadata: {
					extension: AnthropicLanguageModelProvider.EXTENSION_ID,
					name: 'Claude 3 Opus',
					id: 'claude-3-opus-20240229',
					vendor: 'anthropic',
					version: '1.0.0',
					family: 'claude',
					maxInputTokens: 200000,
					maxOutputTokens: 4096,
					isUserSelectable: true,
					modelPickerCategory: { label: 'Anthropic', order: 2 }
				}
			},
			{
				identifier: 'anthropic-claude-sonnet',
				metadata: {
					extension: AnthropicLanguageModelProvider.EXTENSION_ID,
					name: 'Claude 3.5 Sonnet',
					id: 'claude-3-5-sonnet-20241022',
					vendor: 'anthropic',
					version: '1.0.0',
					family: 'claude',
					maxInputTokens: 200000,
					maxOutputTokens: 8192,
					isUserSelectable: true,
					modelPickerCategory: { label: 'Anthropic', order: 2 }
				}
			},
			{
				identifier: 'anthropic-claude-haiku',
				metadata: {
					extension: AnthropicLanguageModelProvider.EXTENSION_ID,
					name: 'Claude 3 Haiku',
					id: 'claude-3-haiku-20240307',
					vendor: 'anthropic',
					version: '1.0.0',
					family: 'claude',
					maxInputTokens: 200000,
					maxOutputTokens: 4096,
					isUserSelectable: true,
					modelPickerCategory: { label: 'Anthropic', order: 2 }
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

			// Separate system message from user/assistant messages
			const systemMessage = messages.find(m => m.role === ChatMessageRole.System);
			const conversationMessages = messages
				.filter(m => m.role !== ChatMessageRole.System)
				.map(msg => ({
					role: msg.role === ChatMessageRole.User ? 'user' : 'assistant',
					content: msg.content
						.filter(p => p.type === 'text')
						.map(p => (p as any).value)
						.join('\n')
				}));

			// Send streaming request
			const stream = await client.messages.stream({
				model: this.getModelName(modelId),
				max_tokens: options.maxTokens || 4096,
				system: systemMessage?.content
					.filter((p: any) => p.type === 'text')
					.map((p: any) => p.value)
					.join('\n'),
				messages: conversationMessages,
				temperature: options.temperature || 0.7,
				...options
			});

			// Convert to VS Code response format
			const responseStream = this.streamToAsyncIterable(
				stream,
				(event: any) => {
					if (event.type === 'content_block_delta' && event.delta?.text) {
						return {
							type: 'text',
							value: event.delta.text
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

	private getModelName(modelId: string): string {
		const mapping: Record<string, string> = {
			'anthropic-claude-opus': 'claude-3-opus-20240229',
			'anthropic-claude-sonnet': 'claude-3-5-sonnet-20241022',
			'anthropic-claude-haiku': 'claude-3-haiku-20240307'
		};
		return mapping[modelId] || 'claude-3-5-sonnet-20241022';
	}
}
