/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { Disposable } from '../../../../base/common/lifecycle.js';
import { getWindow } from '../../../../base/browser/dom.js';
import { IWebview, IWebviewService } from '../../../contrib/webview/browser/webview.js';
import { asWebviewUri, webviewGenericCspSource } from '../../webview/common/webview.js';
import { FileAccess } from '../../../../base/common/network.js';
import type { AppResourcePath } from '../../../../base/common/network.js';

export class MissionControlWebviewPanel extends Disposable {
	private webview: IWebview | undefined;

	constructor(
		private readonly container: HTMLElement,
		@IWebviewService private readonly webviewService: IWebviewService
	) {
		super();
		this.createWebview();
	}

	private createWebview(): void {
		// Get URI for the media directory where React bundle is located
		const mediaPath: AppResourcePath = 'vs/workbench/contrib/aiOrchestrator/browser/media';
		const mediaUri = FileAccess.asFileUri(mediaPath);

		// Create webview with proper options
		const webview = this._register(this.webviewService.createWebviewElement({
			title: 'Mission Control',
			options: {
				enableFindWidget: false,
				tryRestoreScrollPosition: false,
			},
			contentOptions: {
				allowScripts: true,
				localResourceRoots: [mediaUri]
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
		// Get URIs for the React bundle files
		const jsPath: AppResourcePath = 'vs/workbench/contrib/aiOrchestrator/browser/media/mission-control-bundle.js';
		const cssPath: AppResourcePath = 'vs/workbench/contrib/aiOrchestrator/browser/media/mission-control-bundle.css';

		const jsUri = FileAccess.asFileUri(jsPath);
		const cssUri = FileAccess.asFileUri(cssPath);

		// Convert to webview-safe URIs
		const jsWebviewUri = asWebviewUri(jsUri, undefined);
		const cssWebviewUri = asWebviewUri(cssUri, undefined);

		return `<!DOCTYPE html>
<html lang="en">
<head>
	<meta charset="UTF-8">
	<meta name="viewport" content="width=device-width, initial-scale=1.0">
	<meta http-equiv="Content-Security-Policy"
		content="default-src 'none'; style-src ${webviewGenericCspSource} 'unsafe-inline'; script-src ${webviewGenericCspSource} 'unsafe-inline'; img-src ${webviewGenericCspSource} https:; font-src ${webviewGenericCspSource};">
	<title>Mission Control</title>
	<link rel="stylesheet" href="${cssWebviewUri.toString()}">
</head>
<body>
	<div id="root"></div>
	<script>
		// Set up VS Code API for React app
		const vscode = acquireVsCodeApi();
		window.vscodeApi = vscode;
	</script>
	<script src="${jsWebviewUri.toString()}"></script>
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
