/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { ThemeIcon } from '../../../../base/common/themables.js';
import { localize } from '../../../../nls.js';
import { Registry } from '../../../../platform/registry/common/platform.js';
import { SyncDescriptor } from '../../../../platform/instantiation/common/descriptors.js';
import { InstantiationType, registerSingleton } from '../../../../platform/instantiation/common/extensions.js';
import { ViewPaneContainer } from '../../../browser/parts/views/viewPaneContainer.js';
import { IViewContainersRegistry, ViewContainerLocation, Extensions as ViewExtensions, IViewsRegistry } from '../../../common/views.js';
import { EditorExtensions } from '../../../common/editor.js';
import { AIOrchestratorPanel } from './aiOrchestratorPanel.js';
import { MissionControlEditor, MissionControlEditorInput } from './missionControlEditor.js';
import { EditorPaneDescriptor, IEditorPaneRegistry } from '../../../browser/editor.js';
import { IEditorService } from '../../../services/editor/common/editorService.js';
import { IChatService } from '../common/chatService.js';
import { ChatService } from '../common/chatServiceImpl.js';
import { ILogService } from '../../../../platform/log/common/log.js';
import { IDatabaseService } from '../common/databaseService.js';
import { IWorkbenchContribution, IWorkbenchContributionsRegistry, Extensions as WorkbenchExtensions } from '../../../common/contributions.js';
import { LifecyclePhase } from '../../../services/lifecycle/common/lifecycle.js';

// Register the Chat service (browser-safe)
registerSingleton(IChatService, ChatService, InstantiationType.Delayed);

// Note: AIOrchestratorService and DatabaseService are registered in node/aiOrchestrator.node.contribution.ts
// They require Node.js APIs and cannot be registered in the browser layer

// Register Mission Control Editor
Registry.as<IEditorPaneRegistry>(EditorExtensions.EditorPane).registerEditorPane(
	EditorPaneDescriptor.create(
		MissionControlEditor,
		MissionControlEditor.ID,
		localize('missionControlEditor', "Mission Control")
	),
	[new SyncDescriptor(MissionControlEditorInput)]
);

// Register the AI Orchestrator view container in the sidebar
const VIEW_CONTAINER = Registry.as<IViewContainersRegistry>(ViewExtensions.ViewContainersRegistry).registerViewContainer({
	id: 'workbench.view.aiOrchestrator',
	title: { value: localize('aiOrchestrator', "AI Orchestrator"), original: 'AI Orchestrator' },
	icon: ThemeIcon.fromId('robot'), // Use VS Code's built-in robot icon
	ctorDescriptor: new SyncDescriptor(ViewPaneContainer, ['workbench.view.aiOrchestrator', { mergeViewWithContainerWhenSingleView: true }]),
	storageId: 'aiOrchestratorViewletState',
	hideIfEmpty: false,
	order: 3, // Position in Activity Bar (after Explorer=0, Search=1, SCM=2)
}, ViewContainerLocation.Sidebar);

// Register the AI Orchestrator views (panel content)
Registry.as<IViewsRegistry>(ViewExtensions.ViewsRegistry).registerViews([
	{
		id: 'workbench.view.aiOrchestrator.panel',
		name: { value: localize('aiOrchestratorPanel', "AI Agents"), original: 'AI Agents' },
		containerIcon: ThemeIcon.fromId('robot'),
		ctorDescriptor: new SyncDescriptor(AIOrchestratorPanel),
		canToggleVisibility: true,
		canMoveView: true,
		weight: 90,
		order: 1,
	}
], VIEW_CONTAINER);

// Register commands
import { CommandsRegistry } from '../../../../platform/commands/common/commands.js';
import { ServicesAccessor } from '../../../../platform/instantiation/common/instantiation.js';
// import { IQuickInputService } from '../../../../platform/quickinput/common/quickInput.js';
// import { IWorkspaceContextService } from '../../../../platform/workspace/common/workspace.js';

// Command: Run v0 Agent
// TODO: Replace with chat-based interaction in Phase 2
CommandsRegistry.registerCommand('aiOrchestrator.runV0Agent', async (accessor: ServicesAccessor) => {
	// Temporarily disabled - will be replaced with chat UI
	/*
	const aiService = accessor.get(IAIOrchestratorService);
	const quickInputService = accessor.get(IQuickInputService);
	const workspaceService = accessor.get(IWorkspaceContextService);

	const prompt = await quickInputService.input({
		prompt: localize('aiOrchestrator.v0Prompt', "What should v0 build?"),
		placeHolder: localize('aiOrchestrator.v0Placeholder', "e.g., Build a dashboard with charts and tables")
	});

	if (prompt) {
		const workspaceRoot = workspaceService.getWorkspace().folders[0]?.uri.fsPath || '';
		await aiService.runV0Agent(prompt, workspaceRoot);
	}
	*/
});

// Command: Run Claude Agent
// TODO: Replace with chat-based interaction in Phase 2
CommandsRegistry.registerCommand('aiOrchestrator.runClaudeAgent', async (accessor: ServicesAccessor) => {
	// Temporarily disabled - will be replaced with chat UI
	/*
	const aiService = accessor.get(IAIOrchestratorService);
	const quickInputService = accessor.get(IQuickInputService);
	const workspaceService = accessor.get(IWorkspaceContextService);

	const prompt = await quickInputService.input({
		prompt: localize('aiOrchestrator.claudePrompt', "What should Claude code?"),
		placeHolder: localize('aiOrchestrator.claudePlaceholder', "e.g., Add authentication to my app")
	});

	if (prompt) {
		const workspaceRoot = workspaceService.getWorkspace().folders[0]?.uri.fsPath || '';
		await aiService.runClaudeAgent(prompt, workspaceRoot);
	}
	*/
});

// Command: Run Gemini Agent
// TODO: Replace with chat-based interaction in Phase 2
CommandsRegistry.registerCommand('aiOrchestrator.runGeminiAgent', async (accessor: ServicesAccessor) => {
	// Temporarily disabled - will be replaced with chat UI
	/*
	const aiService = accessor.get(IAIOrchestratorService);
	const quickInputService = accessor.get(IQuickInputService);
	const workspaceService = accessor.get(IWorkspaceContextService);

	const prompt = await quickInputService.input({
		prompt: localize('aiOrchestrator.geminiPrompt', "What should Gemini code?"),
		placeHolder: localize('aiOrchestrator.geminiPlaceholder', "e.g., Optimize this API for performance")
	});

	if (prompt) {
		const workspaceRoot = workspaceService.getWorkspace().folders[0]?.uri.fsPath || '';
		await aiService.runGeminiAgent(prompt, workspaceRoot);
	}
	*/
});

// Command: Run GPT Agent
// TODO: Replace with chat-based interaction in Phase 2
CommandsRegistry.registerCommand('aiOrchestrator.runGPTAgent', async (accessor: ServicesAccessor) => {
	// Temporarily disabled - will be replaced with chat UI
	/*
	const aiService = accessor.get(IAIOrchestratorService);
	const quickInputService = accessor.get(IQuickInputService);
	const workspaceService = accessor.get(IWorkspaceContextService);

	const prompt = await quickInputService.input({
		prompt: localize('aiOrchestrator.gptPrompt', "What should GPT code?"),
		placeHolder: localize('aiOrchestrator.gptPlaceholder', "e.g., Refactor this component to use hooks")
	});

	if (prompt) {
		const workspaceRoot = workspaceService.getWorkspace().folders[0]?.uri.fsPath || '';
		await aiService.runGPTAgent(prompt, workspaceRoot);
	}
	*/
});

// Command: Open Mission Control (Full Window)
CommandsRegistry.registerCommand('aiOrchestrator.openMissionControl', async (accessor: ServicesAccessor) => {
	const editorService = accessor.get(IEditorService);
	const input = new MissionControlEditorInput();
	await editorService.openEditor(input, { pinned: true });
});

// Database will be initialized on-demand when workspace opens
// No need for chat providers initializer - using VS Code's native chat system

// Database workspace initializer
import { IWorkspaceContextService } from '../../../../platform/workspace/common/workspace.js';

class DatabaseInitializer implements IWorkbenchContribution {
	constructor(
		@IDatabaseService private readonly databaseService: IDatabaseService,
		@IWorkspaceContextService private readonly workspaceService: IWorkspaceContextService,
		@ILogService private readonly logService: ILogService
	) {
		this.initializeDatabase();
	}

	private async initializeDatabase(): Promise<void> {
		// Get workspace path
		const workspace = this.workspaceService.getWorkspace();
		if (!workspace.folders || workspace.folders.length === 0) {
			this.logService.info('[DatabaseInitializer] No workspace folder found, skipping database initialization');
			return;
		}

		const workspacePath = workspace.folders[0].uri.fsPath;
		this.logService.info(`[DatabaseInitializer] Initializing database for workspace: ${workspacePath}`);

		try {
			await this.databaseService.initialize(workspacePath);
			this.logService.info('[DatabaseInitializer] Database initialized successfully');

			// Check if project exists for this workspace
			const existingProject = this.databaseService.getProjectByWorkspace(workspacePath);
			if (!existingProject) {
				this.logService.info('[DatabaseInitializer] No existing project found for workspace');
				// Note: Project will be created when user opens Mission Control or starts first task
			} else {
				this.logService.info(`[DatabaseInitializer] Found existing project: ${existingProject.name} (${existingProject.id})`);
			}
		} catch (error) {
			this.logService.error('[DatabaseInitializer] Error initializing database:', error);
		}
	}
}

// Register database initializer to run on workbench startup
Registry.as<IWorkbenchContributionsRegistry>(WorkbenchExtensions.Workbench)
	.registerWorkbenchContribution(DatabaseInitializer, LifecyclePhase.Restored);
