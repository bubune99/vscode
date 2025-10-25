/*---------------------------------------------------------------------------------------------
 *  AI Orchestrator Contribution - Main Registration File
 *  Location in VS Code fork: src/vs/workbench/contrib/aiOrchestrator/browser/aiOrchestrator.contribution.ts
 *--------------------------------------------------------------------------------------------*/

import { ThemeIcon } from '../../../../base/common/themables.js';
import { localize } from '../../../../nls.js';
import { Registry } from '../../../../platform/registry/common/platform.js';
import { SyncDescriptor } from '../../../../platform/instantiation/common/descriptors.js';
import { InstantiationType, registerSingleton } from '../../../../platform/instantiation/common/extensions.js';
import { ViewPaneContainer } from '../../../browser/parts/views/viewPaneContainer.js';
import { IViewContainersRegistry, ViewContainerLocation, Extensions as ViewExtensions, IViewsRegistry } from '../../../common/views.js';
import { IAIOrchestratorService } from '../common/aiOrchestratorService.js';
import { AIOrchestratorService } from '../node/aiOrchestratorServiceImpl.js';
import { AIOrchestratorPanel } from './aiOrchestratorPanel.js';
import { MissionControlPanel } from './missionControlPanel.js';

// Register the AI Orchestrator service
registerSingleton(IAIOrchestratorService, AIOrchestratorService, InstantiationType.Delayed);

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
		id: 'workbench.view.aiOrchestrator.missionControl',
		name: { value: localize('missionControl', "Mission Control"), original: 'Mission Control' },
		containerIcon: ThemeIcon.fromId('dashboard'),
		ctorDescriptor: new SyncDescriptor(MissionControlPanel),
		canToggleVisibility: true,
		canMoveView: true,
		weight: 100,
		order: 1,
	},
	{
		id: 'workbench.view.aiOrchestrator.panel',
		name: { value: localize('aiOrchestratorPanel', "AI Agents"), original: 'AI Agents' },
		containerIcon: ThemeIcon.fromId('robot'),
		ctorDescriptor: new SyncDescriptor(AIOrchestratorPanel),
		canToggleVisibility: true,
		canMoveView: true,
		weight: 90,
		order: 2,
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
