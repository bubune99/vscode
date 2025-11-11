/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { Disposable } from '../../../../base/common/lifecycle.js';
import { ILogService } from '../../../../platform/log/common/log.js';
import { CancellationToken } from '../../../../base/common/cancellation.js';
import { IAIOrchestratorService, IProjectContext } from '../common/aiOrchestratorService.js';
import { IChatService } from '../common/chatService.js';
import { IWorkspaceContextService } from '../../../../platform/workspace/common/workspace.js';

/**
 * Chat participant for AI Orchestrator
 * Registers as @orchestrator in VS Code's native chat panel
 */
export class AIOrchestratorChatParticipant extends Disposable {

	constructor(
		@ILogService private readonly logService: ILogService,
		@IAIOrchestratorService private readonly orchestratorService: IAIOrchestratorService,
		@IChatService private readonly chatService: IChatService,
		@IWorkspaceContextService private readonly workspaceService: IWorkspaceContextService
	) {
		super();
		this.logService.info('[AIOrchestratorChatParticipant] Initialized');
	}

	/**
	 * Handle chat request from VS Code chat panel
	 */
	async handleChatRequest(
		request: string,
		context: any,
		progress: any,
		token: CancellationToken
	): Promise<void> {
		this.logService.info(`[AIOrchestratorChatParticipant] Handling request: ${request}`);

		try {
			// Get or create project context
			const workspace = this.workspaceService.getWorkspace();
			if (!workspace.folders || workspace.folders.length === 0) {
				progress.report({ content: 'Please open a workspace folder to use AI Orchestrator.' });
				return;
			}

			const projectContext: IProjectContext = {
				workspace: workspace.folders[0].uri,
				recentFiles: [],
				openFiles: [],
				activeFile: undefined,
				selection: undefined
			};

			// Get or create project
			const projectId = await this.orchestratorService.getOrCreateProject(projectContext);
			if (!projectId) {
				progress.report({ content: 'Failed to initialize project. Check logs for details.' });
				return;
			}

			// Set current project for chat service
			this.chatService.setCurrentProject(projectId);

			// Create conversation if none exists
			let conversationId = this.chatService.getCurrentConversationId();
			if (!conversationId) {
				conversationId = this.chatService.createConversation('AI Orchestrator Chat', 'general');
				if (!conversationId) {
					progress.report({ content: 'Failed to create conversation.' });
					return;
				}
			}

			// Plan tasks based on user request
			progress.report({ content: 'Planning tasks...' });
			const taskPlan = await this.orchestratorService.planTasks(request, projectContext, token);

			// Report planned tasks
			progress.report({ content: `\n\nCreated ${taskPlan.tasks.length} tasks:\n` });
			for (const task of taskPlan.tasks) {
				progress.report({ content: `\n**Task**: ${task.description}\n` });
				progress.report({ content: `Agent: ${task.agent}\n` });
			}

			// Execute tasks
			for (const task of taskPlan.tasks) {
				if (token.isCancellationRequested) {
					break;
				}

				progress.report({ content: `\n\n---\n\n## Executing: ${task.description}\n\n` });

				const responseStream = await this.orchestratorService.executeTask(task, token);

				// Stream the response
				for await (const part of responseStream) {
					if (token.isCancellationRequested) {
						break;
					}

					if (part.type === 'text') {
						progress.report({ content: part.value });
					}
				}
			}

			progress.report({ content: '\n\n✅ All tasks completed!' });

		} catch (error) {
			this.logService.error('[AIOrchestratorChatParticipant] Error:', error);
			progress.report({ content: `\n\n❌ Error: ${error}` });
		}
	}
}
