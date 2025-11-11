/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { IViewDescriptorService } from '../../../common/views.js';
import { IInstantiationService } from '../../../../platform/instantiation/common/instantiation.js';
import { IThemeService } from '../../../../platform/theme/common/themeService.js';
import { IContextKeyService } from '../../../../platform/contextkey/common/contextkey.js';
import { IKeybindingService } from '../../../../platform/keybinding/common/keybinding.js';
import { IConfigurationService } from '../../../../platform/configuration/common/configuration.js';
import { IContextMenuService } from '../../../../platform/contextview/browser/contextView.js';
import { IOpenerService } from '../../../../platform/opener/common/opener.js';
import { ITelemetryService } from '../../../../platform/telemetry/common/telemetry.js';
import { ViewPane } from '../../../browser/parts/views/viewPane.js';
import { IViewletViewOptions } from '../../../browser/parts/views/viewsViewlet.js';
import { IWebviewService, IWebview } from '../../webview/browser/webview.js';
import { IAIOrchestratorService } from '../common/aiOrchestratorService.js';
import { ILogService } from '../../../../platform/log/common/log.js';
import { FileAccess } from '../../../../base/common/network.js';
import { AppResourcePath } from '../../../../base/common/network.js';
import { getWindow } from '../../../../base/browser/dom.js';
import { IWorkspaceContextService } from '../../../../platform/workspace/common/workspace.js';
import { CancellationToken } from '../../../../base/common/cancellation.js';
import { IHoverService } from '../../../../platform/hover/browser/hover.js';

/**
 * AI Chat View Panel - Webview-based chat interface in the secondary sidebar
 */
export class AIChatView extends ViewPane {
	static readonly ID = 'workbench.view.aiChat';
	static readonly TITLE = 'AI Chat';

	private webview: IWebview | undefined;

	constructor(
		options: IViewletViewOptions,
		@IKeybindingService keybindingService: IKeybindingService,
		@IContextMenuService contextMenuService: IContextMenuService,
		@IConfigurationService configurationService: IConfigurationService,
		@IContextKeyService contextKeyService: IContextKeyService,
		@IViewDescriptorService viewDescriptorService: IViewDescriptorService,
		@IInstantiationService instantiationService: IInstantiationService,
		@IOpenerService openerService: IOpenerService,
		@IThemeService themeService: IThemeService,
		@ITelemetryService private readonly telemetryService: ITelemetryService,
		@IHoverService hoverService: IHoverService,
		@IWebviewService private readonly webviewService: IWebviewService,
		@IAIOrchestratorService private readonly orchestratorService: IAIOrchestratorService,
		@IWorkspaceContextService private readonly workspaceService: IWorkspaceContextService,
		@ILogService private readonly logService: ILogService
	) {
		super(options, keybindingService, contextMenuService, configurationService, contextKeyService, viewDescriptorService, instantiationService, openerService, themeService, hoverService);
		this.logService.info('[AI Chat] View created');

		// Track chat view opened
		this.telemetryService.publicLog('aiOrchestrator.chatOpened');
	}

	protected override renderBody(container: HTMLElement): void {
		super.renderBody(container);
		this.logService.info('[AI Chat] Rendering body');
		this.createWebview(container);
	}

	private createWebview(container: HTMLElement): void {
		this.logService.info('[AI Chat] Creating webview');

		// Get media path for webview resources
		const mediaPath: AppResourcePath = 'vs/workbench/contrib/aiOrchestrator/browser/media';
		const mediaUri = FileAccess.asFileUri(mediaPath);

		// Create webview
		const webview = this._register(this.webviewService.createWebviewElement({
			title: 'AI Chat',
			options: {
				enableFindWidget: false,
				tryRestoreScrollPosition: false
			},
			contentOptions: {
				allowScripts: true,
				localResourceRoots: [mediaUri]
			},
			extension: undefined
		}));

		// Mount webview to container
		webview.mountTo(container, getWindow(container));

		// Set HTML content with basic chat UI
		webview.setHtml(this.getWebviewHtml(mediaUri));

		// Handle messages from webview
		this._register(webview.onMessage((message: any) => {
			this.handleWebviewMessage(message);
		}));

		this.webview = webview;
		this.logService.info('[AI Chat] Webview created successfully');
	}

	private getWebviewHtml(mediaUri: any): string {
		// Basic HTML for now - we'll enhance this with React in Phase 3
		return `<!DOCTYPE html>
<html lang="en">
<head>
	<meta charset="UTF-8">
	<meta name="viewport" content="width=device-width, initial-scale=1.0">
	<title>AI Chat</title>
	<style>
		body {
			margin: 0;
			padding: 0;
			font-family: var(--vscode-font-family);
			color: var(--vscode-foreground);
			background-color: var(--vscode-editor-background);
			height: 100vh;
			display: flex;
			flex-direction: column;
		}
		.chat-container {
			flex: 1;
			overflow-y: auto;
			padding: 16px;
			display: flex;
			flex-direction: column;
			gap: 12px;
		}
		.message {
			padding: 12px;
			border-radius: 6px;
			max-width: 85%;
		}
		.message.user {
			background-color: var(--vscode-input-background);
			align-self: flex-end;
		}
		.message.assistant {
			background-color: var(--vscode-editor-inactiveSelectionBackground);
			align-self: flex-start;
		}
		.input-container {
			padding: 16px;
			border-top: 1px solid var(--vscode-panel-border);
			display: flex;
			gap: 8px;
		}
		.input-box {
			flex: 1;
			padding: 8px 12px;
			background-color: var(--vscode-input-background);
			color: var(--vscode-input-foreground);
			border: 1px solid var(--vscode-input-border);
			border-radius: 4px;
			font-family: var(--vscode-font-family);
			font-size: var(--vscode-font-size);
			resize: none;
		}
		.send-button {
			padding: 8px 16px;
			background-color: var(--vscode-button-background);
			color: var(--vscode-button-foreground);
			border: none;
			border-radius: 4px;
			cursor: pointer;
			font-family: var(--vscode-font-family);
		}
		.send-button:hover {
			background-color: var(--vscode-button-hoverBackground);
		}
		.empty-state {
			flex: 1;
			display: flex;
			flex-direction: column;
			align-items: center;
			justify-content: center;
			padding: 32px;
			text-align: center;
			color: var(--vscode-descriptionForeground);
		}
		.empty-state h2 {
			margin: 0 0 8px 0;
			font-size: 20px;
			font-weight: 600;
		}
		.empty-state p {
			margin: 0;
			font-size: 14px;
		}
	</style>
</head>
<body>
	<div class="chat-container" id="chatContainer">
		<div class="empty-state">
			<h2>🚀 AI Orchestrator Chat</h2>
			<p>Ask me to build features, coordinate tasks, or help with your project.</p>
		</div>
	</div>
	<div class="input-container">
		<textarea
			class="input-box"
			id="messageInput"
			placeholder="Ask AI Orchestrator to build something..."
			rows="1"
		></textarea>
		<button class="send-button" id="sendButton">Send</button>
	</div>

	<script>
		const vscode = acquireVsCodeApi();
		const chatContainer = document.getElementById('chatContainer');
		const messageInput = document.getElementById('messageInput');
		const sendButton = document.getElementById('sendButton');

		// Auto-resize textarea
		messageInput.addEventListener('input', function() {
			this.style.height = 'auto';
			this.style.height = Math.min(this.scrollHeight, 150) + 'px';
		});

		// Send message
		function sendMessage() {
			const message = messageInput.value.trim();
			if (!message) return;

			// Remove empty state if present
			const emptyState = chatContainer.querySelector('.empty-state');
			if (emptyState) {
				emptyState.remove();
			}

			// Add user message to UI
			addMessage('user', message);

			// Send to extension
			vscode.postMessage({
				type: 'chat',
				message: message
			});

			// Clear input
			messageInput.value = '';
			messageInput.style.height = 'auto';
		}

		// Add message to chat
		function addMessage(role, content) {
			const messageDiv = document.createElement('div');
			messageDiv.className = 'message ' + role;
			messageDiv.textContent = content;
			chatContainer.appendChild(messageDiv);
			chatContainer.scrollTop = chatContainer.scrollHeight;
		}

		// Handle messages from extension
		let currentAssistantMessage = null;
		window.addEventListener('message', event => {
			const message = event.data;
			if (message.type === 'response') {
				addMessage('assistant', message.content);
				currentAssistantMessage = null;
			} else if (message.type === 'stream') {
				// Append to current assistant message or create new one
				if (!currentAssistantMessage) {
					currentAssistantMessage = document.createElement('div');
					currentAssistantMessage.className = 'message assistant';
					currentAssistantMessage.textContent = message.content;
					chatContainer.appendChild(currentAssistantMessage);
				} else {
					currentAssistantMessage.textContent += message.content;
				}
				chatContainer.scrollTop = chatContainer.scrollHeight;
			}
		});

		// Send on button click
		sendButton.addEventListener('click', sendMessage);

		// Send on Enter (Shift+Enter for new line)
		messageInput.addEventListener('keydown', function(e) {
			if (e.key === 'Enter' && !e.shiftKey) {
				e.preventDefault();
				sendMessage();
			}
		});
	</script>
</body>
</html>`;
	}

	private async handleWebviewMessage(message: any): Promise<void> {
		this.logService.info('[AI Chat] Received message from webview:', message);

		if (message.type === 'chat') {
			const startTime = Date.now();
			try {
				const userMessage = message.message;

				// Track chat message sent
				this.telemetryService.publicLog('aiOrchestrator.chatMessageSent', {
					messageLength: userMessage.length
				});

				// Get workspace context
				const workspace = this.workspaceService.getWorkspace();
				if (!workspace.folders || workspace.folders.length === 0) {
					this.webview?.postMessage({
						type: 'response',
						content: '⚠️ Please open a workspace folder to use AI Orchestrator.'
					});

					this.telemetryService.publicLog('aiOrchestrator.chatError', {
						error: 'noWorkspace'
					});
					return;
				}

				const projectContext = {
					workspace: workspace.folders[0].uri,
					recentFiles: [],
					openFiles: [],
					activeFile: undefined,
					selection: undefined
				};

				// Send planning status
				this.webview?.postMessage({
					type: 'response',
					content: '🤖 Planning tasks...'
				});

				// Plan tasks using orchestrator service
				const planStartTime = Date.now();
				const taskPlan = await this.orchestratorService.planTasks(userMessage, projectContext, CancellationToken.None);

				// Track task planning
				this.telemetryService.publicLog('aiOrchestrator.tasksPlanned', {
					taskCount: taskPlan.tasks.length,
					planningDuration: Date.now() - planStartTime
				});

				// Send task plan
				let taskListMessage = `\n\n✅ Created ${taskPlan.tasks.length} tasks:\n\n`;
				for (const task of taskPlan.tasks) {
					taskListMessage += `• ${task.description} _(${task.agent})_\n`;
				}
				this.webview?.postMessage({
					type: 'response',
					content: taskListMessage
				});

				// Execute tasks one by one
				for (const task of taskPlan.tasks) {
					this.webview?.postMessage({
						type: 'response',
						content: `\n---\n\n## Executing: ${task.description}\n\n`
					});

					const responseStream = await this.orchestratorService.executeTask(task, CancellationToken.None);

					// Stream responses
					for await (const part of responseStream) {
						if (part.type === 'text') {
							this.webview?.postMessage({
								type: 'stream',
								content: part.value
							});
						}
					}
				}

				// Send completion message
				this.webview?.postMessage({
					type: 'response',
					content: '\n\n✅ **All tasks completed!**'
				});

				// Track successful completion
				this.telemetryService.publicLog('aiOrchestrator.tasksCompleted', {
					taskCount: taskPlan.tasks.length,
					totalDuration: Date.now() - startTime
				});

			} catch (error) {
				this.logService.error('[AI Chat] Error handling message:', error);
				this.webview?.postMessage({
					type: 'response',
					content: `\n\n❌ Error: ${error}`
				});

				// Track error
				this.telemetryService.publicLog('aiOrchestrator.chatError', {
					duration: Date.now() - startTime
				});
			}
		}
	}

	override dispose(): void {
		this.logService.info('[AI Chat] Disposing view');
		super.dispose();
	}
}
