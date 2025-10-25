/*---------------------------------------------------------------------------------------------
 *  Language Model Provider Registry
 *  Registers all AI providers with VS Code's ILanguageModelsService
 *--------------------------------------------------------------------------------------------*/

import { Disposable } from '../../../../../base/common/lifecycle.js';
import { ILogService } from '../../../../../platform/log/common/log.js';
import { IConfigurationService } from '../../../../../platform/configuration/common/configuration.js';
import { ILanguageModelsService } from '../../../chat/common/languageModels.js';
import { OpenAILanguageModelProvider } from './openaiProvider.js';
import { AnthropicLanguageModelProvider } from './anthropicProvider.js';
import { GoogleLanguageModelProvider } from './googleProvider.js';
import { VercelLanguageModelProvider } from './vercelProvider.js';

/**
 * Manages registration and lifecycle of all language model providers
 */
export class LanguageModelProviderRegistry extends Disposable {

	private readonly providers: Disposable[] = [];

	constructor(
		@ILanguageModelsService private readonly languageModelsService: ILanguageModelsService,
		@ILogService private readonly logService: ILogService,
		@IConfigurationService private readonly configurationService: IConfigurationService
	) {
		super();
		this.registerProviders();
	}

	private registerProviders(): void {
		this.logService.info('[AI Orchestrator] Registering language model providers...');

		try {
			// Register OpenAI provider (GPT models)
			const openaiProvider = new OpenAILanguageModelProvider(
				this.logService,
				this.configurationService
			);
			this._register(openaiProvider);
			this.languageModelsService.registerLanguageModelProvider('openai', openaiProvider);
			this.providers.push(openaiProvider);
			this.logService.info('[AI Orchestrator] Registered OpenAI provider');

		} catch (error) {
			this.logService.error('[AI Orchestrator] Failed to register OpenAI provider', error);
		}

		try {
			// Register Anthropic provider (Claude models)
			const anthropicProvider = new AnthropicLanguageModelProvider(
				this.logService,
				this.configurationService
			);
			this._register(anthropicProvider);
			this.languageModelsService.registerLanguageModelProvider('anthropic', anthropicProvider);
			this.providers.push(anthropicProvider);
			this.logService.info('[AI Orchestrator] Registered Anthropic provider');

		} catch (error) {
			this.logService.error('[AI Orchestrator] Failed to register Anthropic provider', error);
		}

		try {
			// Register Google provider (Gemini models)
			const googleProvider = new GoogleLanguageModelProvider(
				this.logService,
				this.configurationService
			);
			this._register(googleProvider);
			this.languageModelsService.registerLanguageModelProvider('google', googleProvider);
			this.providers.push(googleProvider);
			this.logService.info('[AI Orchestrator] Registered Google provider');

		} catch (error) {
			this.logService.error('[AI Orchestrator] Failed to register Google provider', error);
		}

		try {
			// Register Vercel provider (v0 UI generation)
			const vercelProvider = new VercelLanguageModelProvider(
				this.logService,
				this.configurationService
			);
			this._register(vercelProvider);
			this.languageModelsService.registerLanguageModelProvider('vercel', vercelProvider);
			this.providers.push(vercelProvider);
			this.logService.info('[AI Orchestrator] Registered Vercel v0 provider');

		} catch (error) {
			this.logService.error('[AI Orchestrator] Failed to register Vercel provider', error);
		}

		this.logService.info(`[AI Orchestrator] Successfully registered ${this.providers.length} language model providers`);
	}

	/**
	 * Get list of all registered providers
	 */
	public getProviders(): Disposable[] {
		return [...this.providers];
	}

	/**
	 * Check if a specific provider is configured and available
	 */
	public async isProviderAvailable(vendor: string): Promise<boolean> {
		const models = await this.languageModelsService.getLanguageModelIds();
		return models.some(id => id.includes(vendor));
	}

	override dispose(): void {
		this.logService.info('[AI Orchestrator] Disposing language model providers...');
		super.dispose();
	}
}
