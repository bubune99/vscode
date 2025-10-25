/*---------------------------------------------------------------------------------------------
 *  Google AI Language Model Provider
 *  Provides Gemini models (Pro, Flash, Ultra)
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

export class GoogleLanguageModelProvider extends BaseLanguageModelProvider {

	private static readonly EXTENSION_ID = new ExtensionIdentifier('vscode.google');
	private static readonly CONFIG_KEY = 'aiOrchestrator.google';

	private client: any;

	constructor(
		logService: ILogService,
		configurationService: IConfigurationService
	) {
		super(GoogleLanguageModelProvider.CONFIG_KEY, logService, configurationService);
	}

	protected getEnvVarName(): string {
		return 'GOOGLE_API_KEY';
	}

	protected getProviderName(): string {
		return 'Google';
	}

	private getClient(): any {
		if (!this.client) {
			const config = this.getConfig();
			if (!config.apiKey) {
				throw new Error('Google API key not configured');
			}

			this.log('Creating Google AI client');
			// Mock
			this.client = {
				generateContentStream: async (params: any) => {
					return {
						stream: {
							async *[Symbol.asyncIterator]() {
								yield {
									text: () => 'Mock response from Gemini. SDK will be integrated soon.'
								};
							}
						}
					};
				}
			};
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

		this.log('Providing Google models');

		return [
			{
				identifier: 'google-gemini-pro',
				metadata: {
					extension: GoogleLanguageModelProvider.EXTENSION_ID,
					name: 'Gemini Pro',
					id: 'gemini-pro',
					vendor: 'google',
					version: '1.0.0',
					family: 'gemini',
					maxInputTokens: 32000,
					maxOutputTokens: 8192,
					isUserSelectable: true,
					modelPickerCategory: { label: 'Google', order: 3 }
				}
			},
			{
				identifier: 'google-gemini-flash',
				metadata: {
					extension: GoogleLanguageModelProvider.EXTENSION_ID,
					name: 'Gemini Flash',
					id: 'gemini-1.5-flash',
					vendor: 'google',
					version: '1.0.0',
					family: 'gemini',
					maxInputTokens: 1000000,
					maxOutputTokens: 8192,
					isUserSelectable: true,
					modelPickerCategory: { label: 'Google', order: 3 }
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

			// Convert messages to Gemini format
			const contents = messages
				.filter(m => m.role !== ChatMessageRole.System)
				.map(msg => ({
					role: msg.role === ChatMessageRole.User ? 'user' : 'model',
					parts: msg.content
						.filter(p => p.type === 'text')
						.map(p => ({ text: (p as any).value }))
				}));

			const response = await client.generateContentStream({
				contents,
				generationConfig: {
					temperature: options.temperature || 0.7,
					maxOutputTokens: options.maxTokens || 8192
				}
			});

			const responseStream = this.streamToAsyncIterable(
				response.stream,
				(chunk: any) => {
					const text = chunk.text?.() || chunk.candidates?.[0]?.content?.parts?.[0]?.text;
					if (text) {
						return {
							type: 'text',
							value: text
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
}
