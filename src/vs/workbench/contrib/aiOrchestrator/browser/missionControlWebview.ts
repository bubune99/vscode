/*---------------------------------------------------------------------------------------------
 *  Mission Control Webview - React-based Project Manager UI
 *  Location: src/vs/workbench/contrib/aiOrchestrator/browser/missionControlWebview.ts
 *--------------------------------------------------------------------------------------------*/

import { Disposable } from '../../../../base/common/lifecycle.js';
import { getWindow } from '../../../../base/browser/dom.js';
import { IWebviewService, IWebviewElement } from '../../../contrib/webview/browser/webview.js';
import { IAIOrchestratorService } from '../common/aiOrchestratorService.js';

export class MissionControlWebviewPanel extends Disposable {
	private webview: IWebviewElement | undefined;

	constructor(
		private readonly container: HTMLElement,
		@IWebviewService private readonly webviewService: IWebviewService,
		@IAIOrchestratorService private readonly _aiService: IAIOrchestratorService
	) {
		super();
		this.createWebview();
	}

	private createWebview(): void {
		// Create webview with proper options
		const webview = this._register(this.webviewService.createWebviewElement({
			id: 'missionControl',
			options: {},
			contentOptions: {},
			extension: undefined
		}));

		this.webview = webview;

		// Mount webview to container - required for webview to render
		webview.mountTo(this.container, getWindow(this.container));

		// Set initial HTML content
		this.updateContent();

		// Listen for messages from webview
		this._register(webview.onMessage(message => {
			this.handleMessage(message);
		}));
	}

	private updateContent(): void {
		if (!this.webview) {
			return;
		}

		// This will load the bundled React application
		// For now, we'll start with a simple HTML placeholder
		const html = this.getWebviewHtml();
		this.webview.setHtml(html);
	}

	private getWebviewHtml(): string {
		// TODO: Load bundled React app instead of inline HTML
		// This is a temporary placeholder until we set up the React bundling
		return `<!DOCTYPE html>
<html lang="en">
<head>
	<meta charset="UTF-8">
	<meta name="viewport" content="width=device-width, initial-scale=1.0">
	<title>Mission Control</title>
	<style>
		body {
			margin: 0;
			padding: 20px;
			font-family: var(--vscode-font-family);
			color: var(--vscode-foreground);
			background-color: var(--vscode-editor-background);
		}
		.header {
			display: flex;
			align-items: center;
			gap: 12px;
			margin-bottom: 24px;
		}
		.logo {
			font-size: 24px;
		}
		h1 {
			font-size: 20px;
			font-weight: 600;
			margin: 0;
		}
		.placeholder {
			padding: 40px;
			text-align: center;
			background-color: var(--vscode-editor-inactiveSelectionBackground);
			border-radius: 8px;
		}
		.placeholder-icon {
			font-size: 48px;
			margin-bottom: 16px;
		}
		.placeholder-text {
			color: var(--vscode-descriptionForeground);
			margin-bottom: 24px;
		}
		.button {
			padding: 8px 16px;
			background-color: var(--vscode-button-background);
			color: var(--vscode-button-foreground);
			border: none;
			border-radius: 4px;
			cursor: pointer;
			font-family: var(--vscode-font-family);
		}
		.button:hover {
			background-color: var(--vscode-button-hoverBackground);
		}
	</style>
</head>
<body>
	<div class="header">
		<div class="logo">🚀</div>
		<h1>Mission Control</h1>
	</div>

	<div class="placeholder">
		<div class="placeholder-icon">📊</div>
		<div class="placeholder-text">
			Mission Control Dashboard is loading...<br>
			React components will be bundled and loaded here.
		</div>
		<button class="button" onclick="sendMessage('test')">Test Message Passing</button>
	</div>

	<script>
		const vscode = acquireVsCodeApi();

		function sendMessage(type) {
			vscode.postMessage({ type: type, data: 'Hello from webview!' });
		}

		// Listen for messages from extension
		window.addEventListener('message', event => {
			const message = event.data;
			console.log('Received message from extension:', message);
		});
	</script>
</body>
</html>`;
	}

	private handleMessage(message: any): void {
		console.log('Mission Control received message:', message);

		// Handle different message types
		switch (message.type) {
			case 'test':
				// Send test response back
				this.webview?.postMessage({
					type: 'response',
					data: 'Message passing works!'
				});
				break;

			case 'getTasks':
				// Send current tasks from orchestrator
				// Note: Using placeholder for now - need to implement task listing
				this.webview?.postMessage({
					type: 'tasks',
					data: [] // TODO: Implement task listing
				});
				break;

			case 'startTask':
				// Start a task
				if (message.taskId) {
					// TODO: Implement task starting
					console.log('Starting task:', message.taskId);
				}
				break;
		}
	}

	public focus(): void {
		// Focus the webview
		this.webview?.focus();
	}

	override dispose(): void {
		super.dispose();
	}
}
