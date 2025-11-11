/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { Disposable } from '../../../../base/common/lifecycle.js';
import { getWindow } from '../../../../base/browser/dom.js';
import { IWebview, IWebviewService } from '../../../contrib/webview/browser/webview.js';
import { webviewGenericCspSource } from '../../webview/common/webview.js';
import { IAIOrchestratorService } from '../common/aiOrchestratorService.js';
import { IDatabaseService } from '../common/databaseService.js';

export class MissionControlWebviewPanel extends Disposable {
	private webview: IWebview | undefined;

	constructor(
		private readonly container: HTMLElement,
		@IWebviewService private readonly webviewService: IWebviewService,
		@IAIOrchestratorService private readonly orchestratorService: IAIOrchestratorService,
		@IDatabaseService private readonly databaseService: IDatabaseService
	) {
		super();
		this.createWebview();
	}

	private createWebview(): void {
		// Create webview with proper options
		const webview = this._register(this.webviewService.createWebviewElement({
			title: 'Mission Control',
			options: {
				enableFindWidget: false,
				tryRestoreScrollPosition: false,
			},
			contentOptions: {
				allowScripts: true,
				localResourceRoots: []
			},
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
		// TODO: Replace with proper React bundle once it's rebuilt without Node.js dependencies
		// For now, use a simple placeholder to prevent browser 'fs' module errors

		return `<!DOCTYPE html>
<html lang="en">
<head>
	<meta charset="UTF-8">
	<meta name="viewport" content="width=device-width, initial-scale=1.0">
	<meta http-equiv="Content-Security-Policy"
		content="default-src 'none'; style-src ${webviewGenericCspSource} 'unsafe-inline'; script-src ${webviewGenericCspSource} 'unsafe-inline';">
	<title>Mission Control</title>
	<style>
		body {
			padding: 20px;
			font-family: var(--vscode-font-family);
			color: var(--vscode-foreground);
			background-color: var(--vscode-editor-background);
		}
		h1 {
			color: var(--vscode-foreground);
			margin-bottom: 20px;
		}
		.section {
			margin-bottom: 30px;
			padding: 20px;
			background-color: var(--vscode-editor-inactiveSelectionBackground);
			border-radius: 6px;
		}
		button {
			background-color: var(--vscode-button-background);
			color: var(--vscode-button-foreground);
			border: none;
			padding: 8px 16px;
			cursor: pointer;
			border-radius: 4px;
			margin-right: 10px;
		}
		button:hover {
			background-color: var(--vscode-button-hoverBackground);
		}
		.message {
			margin-top: 15px;
			padding: 10px;
			background-color: var(--vscode-inputValidation-infoBackground);
			border-left: 3px solid var(--vscode-inputValidation-infoBorder);
		}
	</style>
</head>
<body>
	<h1>🚀 Mission Control</h1>

	<div class="section">
		<h2>AI Orchestrator Dashboard</h2>
		<p>Welcome to Mission Control - your central hub for AI-powered development.</p>
		<div>
			<button onclick="sendMessage('getTasks')">Load Tasks</button>
			<button onclick="sendMessage('getProjects')">Load Projects</button>
		</div>
		<div id="messages" class="message" style="display:none;"></div>
	</div>

	<script>
		const vscode = acquireVsCodeApi();

		function sendMessage(type) {
			vscode.postMessage({ type: type });
			document.getElementById('messages').style.display = 'block';
			document.getElementById('messages').textContent = 'Requesting ' + type + '...';
		}

		window.addEventListener('message', event => {
			const message = event.data;
			const messagesDiv = document.getElementById('messages');
			messagesDiv.style.display = 'block';
			messagesDiv.textContent = 'Received: ' + JSON.stringify(message, null, 2);
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
				// Send current tasks from orchestrator service
				const tasks = this.orchestratorService.getAllTasks();
				this.webview?.postMessage({
					type: 'tasks',
					data: tasks
				});
				break;

			case 'getProjects':
				// Get all projects from database
				if (this.databaseService.isInitialized()) {
					const projects = this.databaseService.getAllProjects();
					this.webview?.postMessage({
						type: 'projects',
						data: projects
					});
				} else {
					this.webview?.postMessage({
						type: 'projects',
						data: []
					});
				}
				break;

			case 'startTask':
				// Start a task
				if (message.taskId) {
					// TODO: Implement task starting via orchestrator
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
