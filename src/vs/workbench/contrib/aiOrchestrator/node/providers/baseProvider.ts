/*---------------------------------------------------------------------------------------------
 *  Base Language Model Provider
 *  Common functionality for all AI providers
 *--------------------------------------------------------------------------------------------*/

import { CancellationToken } from '../../../../../base/common/cancellation.js';
import { Emitter } from '../../../../../base/common/event.js';
import { Disposable } from '../../../../../base/common/lifecycle.js';
import { ILogService } from '../../../../../platform/log/common/log.js';
import { IConfigurationService } from '../../../../../platform/configuration/common/configuration.js';
import {
	ILanguageModelChatProvider,
	ILanguageModelChatResponse,
	ILanguageModelChatMetadataAndIdentifier,
	IChatMessage,
	IChatResponsePart
} from '../../../chat/common/languageModels.js';

export interface IProviderConfig {
	apiKey?: string;
	baseURL?: string;
	enabled?: boolean;
}

export abstract class BaseLanguageModelProvider extends Disposable implements ILanguageModelChatProvider {

	private readonly _onDidChange = this._register(new Emitter<void>());
	readonly onDidChange = this._onDidChange.event;

	constructor(
		protected readonly configKey: string,
		protected readonly logService: ILogService,
		protected readonly configurationService: IConfigurationService
	) {
		super();

		// Watch for config changes
		this._register(configurationService.onDidChangeConfiguration(e => {
			if (e.affectsConfiguration(this.configKey)) {
				this._onDidChange.fire();
			}
		}));
	}

	/**
	 * Get provider configuration from VS Code settings
	 */
	protected getConfig(): IProviderConfig {
		const config = this.configurationService.getValue<any>(this.configKey) || {};
		return {
			apiKey: config.apiKey || process.env[this.getEnvVarName()],
			baseURL: config.baseURL,
			enabled: config.enabled !== false // Default to enabled
		};
	}

	/**
	 * Check if provider is configured and ready
	 */
	protected isConfigured(): boolean {
		const config = this.getConfig();
		return !!config.apiKey && (config.enabled === true || config.enabled === undefined);
	}

	/**
	 * Get environment variable name for API key
	 */
	protected abstract getEnvVarName(): string;

	/**
	 * Get provider name for logging
	 */
	protected abstract getProviderName(): string;

	/**
	 * Provide available models
	 */
	abstract provideLanguageModelChatInfo(
		options: { silent: boolean },
		token: CancellationToken
	): Promise<ILanguageModelChatMetadataAndIdentifier[]>;

	/**
	 * Send chat request
	 */
	abstract sendChatRequest(
		modelId: string,
		messages: IChatMessage[],
		from: any,
		options: { [name: string]: any },
		token: CancellationToken
	): Promise<ILanguageModelChatResponse>;

	/**
	 * Provide token count
	 */
	async provideTokenCount(
		modelId: string,
		message: string | IChatMessage,
		token: CancellationToken
	): Promise<number> {
		// Simple approximation: ~4 chars per token
		const text = typeof message === 'string'
			? message
			: message.content.map(p => p.type === 'text' ? p.value : '').join('');
		return Math.ceil(text.length / 4);
	}

	/**
	 * Convert streaming response to async iterable
	 */
	protected async *streamToAsyncIterable(
		stream: AsyncIterable<any>,
		converter: (chunk: any) => IChatResponsePart | IChatResponsePart[] | null
	): AsyncIterable<IChatResponsePart | IChatResponsePart[]> {
		try {
			for await (const chunk of stream) {
				const converted = converter(chunk);
				if (converted) {
					yield converted;
				}
			}
		} catch (error) {
			this.logService.error(`[${this.getProviderName()}] Stream error:`, error);
			throw error;
		}
	}

	/**
	 * Log provider action
	 */
	protected log(message: string, ...args: any[]) {
		this.logService.info(`[${this.getProviderName()}] ${message}`, ...args);
	}

	/**
	 * Log provider error
	 */
	protected logError(message: string, error: any) {
		this.logService.error(`[${this.getProviderName()}] ${message}`, error);
	}
}
