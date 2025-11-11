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

// Register the Chat service (browser-safe)
registerSingleton(IChatService, ChatService, InstantiationType.Delayed);

// Note: AIOrchestratorService and DatabaseService are registered in node/aiOrchestrator.node.contribution.ts
// They require Node.js APIs and cannot be registered in the browser layer

// Register AI Chat view in the secondary sidebar (AuxiliaryBar)
import { AIChatView } from './aiChatView.js';

const AI_CHAT_VIEW_CONTAINER = Registry.as<IViewContainersRegistry>(ViewExtensions.ViewContainersRegistry).registerViewContainer({
	id: 'workbench.view.aiChat',
	title: { value: localize('aiChat', "AI Chat"), original: 'AI Chat' },
	icon: ThemeIcon.fromId('comment-discussion'),
	ctorDescriptor: new SyncDescriptor(ViewPaneContainer, ['workbench.view.aiChat', { mergeViewWithContainerWhenSingleView: true }]),
	storageId: 'aiChatViewletState',
	hideIfEmpty: false,
	order: 1
}, ViewContainerLocation.AuxiliaryBar);

// Register the AI Chat view
Registry.as<IViewsRegistry>(ViewExtensions.ViewsRegistry).registerViews([{
	id: AIChatView.ID,
	name: { value: localize('aiChat', "AI Chat"), original: 'AI Chat' },
	containerIcon: ThemeIcon.fromId('comment-discussion'),
	ctorDescriptor: new SyncDescriptor(AIChatView),
	canToggleVisibility: true,
	canMoveView: true,
	weight: 100,
	order: 1
}], AI_CHAT_VIEW_CONTAINER);

// Register Mission Control Editor
Registry.as<IEditorPaneRegistry>(EditorExtensions.EditorPane).registerEditorPane(
	EditorPaneDescriptor.create(
		MissionControlEditor,
		MissionControlEditor.ID,
		localize('missionControlEditor', "Mission Control")
	),
	[new SyncDescriptor(MissionControlEditorInput)]
);

// Register the Mission Control view container in the sidebar
const VIEW_CONTAINER = Registry.as<IViewContainersRegistry>(ViewExtensions.ViewContainersRegistry).registerViewContainer({
	id: 'workbench.view.missionControl',
	title: { value: localize('missionControl', "Mission Control"), original: 'Mission Control' },
	icon: ThemeIcon.fromId('rocket'), // Use VS Code's built-in rocket icon
	ctorDescriptor: new SyncDescriptor(ViewPaneContainer, ['workbench.view.missionControl', { mergeViewWithContainerWhenSingleView: true }]),
	storageId: 'missionControlViewletState',
	hideIfEmpty: false,
	order: 3, // Position in Activity Bar (after Explorer=0, Search=1, SCM=2)
}, ViewContainerLocation.Sidebar);

// Register the Mission Control views (panel content)
Registry.as<IViewsRegistry>(ViewExtensions.ViewsRegistry).registerViews([
	{
		id: 'workbench.view.missionControl.tasks',
		name: { value: localize('missionControlTasks', "Tasks"), original: 'Tasks' },
		containerIcon: ThemeIcon.fromId('rocket'),
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

// Command: Start Building with AI (Opens Chat)
CommandsRegistry.registerCommand('aiOrchestrator.startBuilding', async (accessor: ServicesAccessor) => {
	// Open the chat view
	const editorService = accessor.get(IEditorService);
	await editorService.openEditor({ resource: undefined, options: { pinned: false } } as any);

	// Focus chat panel - VS Code will show the chat interface
	// Users can then type @orchestrator to interact with AI
});

// Command: Scan Project
import { IAIOrchestratorService } from '../common/aiOrchestratorService.js';
import { INotificationService, Severity } from '../../../../platform/notification/common/notification.js';
import { IWorkspaceContextService } from '../../../../platform/workspace/common/workspace.js';

CommandsRegistry.registerCommand('aiOrchestrator.scanProject', async (accessor: ServicesAccessor) => {
	const aiService = accessor.get(IAIOrchestratorService);
	const workspaceService = accessor.get(IWorkspaceContextService);
	const notificationService = accessor.get(INotificationService);
	const logService = accessor.get(ILogService);

	const workspace = workspaceService.getWorkspace();
	if (!workspace.folders || workspace.folders.length === 0) {
		notificationService.notify({
			severity: Severity.Warning,
			message: 'Please open a workspace folder to scan.',
			source: 'Mission Control'
		});
		return;
	}

	const workspacePath = workspace.folders[0].uri.fsPath;

	try {
		notificationService.notify({
			severity: Severity.Info,
			message: 'Scanning project...',
			source: 'Mission Control'
		});

		const result = await aiService.scanExistingProject(workspacePath);

		notificationService.notify({
			severity: Severity.Info,
			message: `Project scanned! Detected: ${result.techStack.join(', ')}`,
			source: 'Mission Control'
		});

		logService.info('[Mission Control] Project scan complete:', result);
	} catch (error) {
		logService.error('[Mission Control] Scan error:', error);
		notificationService.notify({
			severity: Severity.Error,
			message: `Failed to scan project: ${error}`,
			source: 'Mission Control'
		});
	}
});

// Database will be initialized on-demand when workspace opens
// No need for chat providers initializer - using VS Code's native chat system

// Note: DatabaseInitializer moved to node/aiOrchestrator.node.contribution.ts
// It requires Node.js APIs and cannot run in browser/web mode
