/*---------------------------------------------------------------------------------------------
 *  Vercel v0 Language Model Provider
 *  Provides v0 UI generation capabilities
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

export class VercelLanguageModelProvider extends BaseLanguageModelProvider {

	private static readonly EXTENSION_ID = new ExtensionIdentifier('vscode.vercel');
	private static readonly CONFIG_KEY = 'aiOrchestrator.vercel';

	private client: any;

	constructor(
		logService: ILogService,
		configurationService: IConfigurationService
	) {
		super(VercelLanguageModelProvider.CONFIG_KEY, logService, configurationService);
	}

	protected getEnvVarName(): string {
		return 'VERCEL_API_TOKEN';
	}

	protected getProviderName(): string {
		return 'Vercel';
	}

	private getClient(): any {
		if (!this.client) {
			const config = this.getConfig();
			if (!config.apiKey) {
				throw new Error('Vercel API token not configured');
			}

			this.log('Creating Vercel v0 client');
			// Mock for now - v0 has a different API structure
			this.client = {
				chat: {
					completions: {
						create: async (params: any) => {
							// Mock streaming response
							return {
								async *[Symbol.asyncIterator]() {
									yield {
										choices: [{
											delta: {
												content: 'Mock response from v0. Will generate UI components when SDK is integrated.'
											}
										}]
									};
								}
							};
						}
					}
				}
			};

			/*
			// Real implementation will use v0 SDK or API
			// v0 typically uses a specialized API for UI generation
			const response = await fetch('https://v0.dev/api/generate', {
				method: 'POST',
				headers: {
					'Authorization': `Bearer ${config.apiKey}`,
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					prompt: userPrompt,
					stream: true
				})
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

		this.log('Providing Vercel v0 models');

		return [
			{
				identifier: 'vercel-v0',
				metadata: {
					extension: VercelLanguageModelProvider.EXTENSION_ID,
					name: 'v0 UI Generator',
					id: 'v0',
					vendor: 'vercel',
					version: '1.0.0',
					family: 'v0',
					maxInputTokens: 8000,
					maxOutputTokens: 4096,
					isUserSelectable: true,
					modelPickerCategory: { label: 'Vercel', order: 4 }
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

			// v0 typically expects a prompt focused on UI generation
			// Extract the user's latest request
			const userMessages = messages
				.filter(m => m.role === ChatMessageRole.User)
				.map(m => m.content
					.filter(p => p.type === 'text')
					.map(p => (p as any).value)
					.join('\n')
				);

			const prompt = userMessages[userMessages.length - 1] || 'Generate a React component';

			// Add system context for UI generation
			const systemPrompt = `You are v0, an expert UI generator. Generate React/Next.js components with:
- Modern, clean design using Tailwind CSS
- Responsive layouts
- Accessible components
- TypeScript types
- Best practices

User request: ${prompt}`;

			// Send request (v0 uses streaming)
			const stream = await client.chat.completions.create({
				model: 'v0',
				messages: [
					{ role: 'system', content: systemPrompt },
					{ role: 'user', content: prompt }
				],
				stream: true,
				temperature: options.temperature || 0.7,
				max_tokens: options.maxTokens || 4096,
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
}
