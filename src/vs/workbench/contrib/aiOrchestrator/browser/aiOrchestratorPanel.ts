/*---------------------------------------------------------------------------------------------
 *  AI Orchestrator Panel - Main UI Component
 *  Location in VS Code fork: src/vs/workbench/contrib/aiOrchestrator/browser/aiOrchestratorPanel.ts
 *--------------------------------------------------------------------------------------------*/

import './media/aiOrchestratorPanel.css';
import { localize } from '../../../../nls.js';
import { DisposableStore } from '../../../../base/common/lifecycle.js';
import { ViewPane } from '../../../browser/parts/views/viewPane.js';
import { IViewletViewOptions } from '../../../browser/parts/views/viewsViewlet.js';
import { IKeybindingService } from '../../../../platform/keybinding/common/keybinding.js';
import { IContextMenuService } from '../../../../platform/contextview/browser/contextView.js';
import { IConfigurationService } from '../../../../platform/configuration/common/configuration.js';
import { IContextKeyService } from '../../../../platform/contextkey/common/contextkey.js';
import { IInstantiationService } from '../../../../platform/instantiation/common/instantiation.js';
import { IOpenerService } from '../../../../platform/opener/common/opener.js';
import { IThemeService } from '../../../../platform/theme/common/themeService.js';
// import { ITelemetryService } from '../../../../platform/telemetry/common/telemetry.js';
import { IAIOrchestratorService, ITask } from '../common/aiOrchestratorService.js';
import { ICommandService } from '../../../../platform/commands/common/commands.js';
import { $ } from '../../../../base/browser/dom.js';
import { Button } from '../../../../base/browser/ui/button/button.js';
import { defaultButtonStyles } from '../../../../platform/theme/browser/defaultStyles.js';
import { IViewDescriptorService } from '../../../common/views.js';
import { IHoverService } from '../../../../platform/hover/browser/hover.js';

export class AIOrchestratorPanel extends ViewPane {

	private tasks: ITask[] = [];
	private readonly disposables = new DisposableStore();
	private tasksListContainer!: HTMLElement;
	private pollInterval: ReturnType<typeof setInterval> | undefined;

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
		@IHoverService hoverService: IHoverService,
		// @ITelemetryService private readonly telemetryService: ITelemetryService,
		@IAIOrchestratorService private readonly aiService: IAIOrchestratorService,
		@ICommandService private readonly commandService: ICommandService
	) {
		super(options, keybindingService, contextMenuService, configurationService, contextKeyService, viewDescriptorService, instantiationService, openerService, themeService, hoverService);
	}

	protected override renderBody(container: HTMLElement): void {
		super.renderBody(container);

		container.classList.add('ai-orchestrator-panel');

		// Create Mission Control button at the top
		this.renderMissionControlButton(container);

		// Create header with agent buttons
		this.renderAgentButtons(container);

		// Create tasks list
		this.tasksListContainer = $('.tasks-list');
		container.appendChild(this.tasksListContainer);

		// Load initial tasks
		this.refreshTasks();

		// Poll for task updates every 2 seconds
		this.pollInterval = setInterval(() => this.refreshTasks(), 2000);
	}

	private renderMissionControlButton(container: HTMLElement): void {
		const buttonContainer = $('.mission-control-button-container');
		container.appendChild(buttonContainer);

		const missionControlButton = this.disposables.add(new Button(buttonContainer, defaultButtonStyles));
		missionControlButton.label = '$(rocket) Open Mission Control Dashboard';
		missionControlButton.onDidClick(() => {
			this.commandService.executeCommand('aiOrchestrator.openMissionControl');
		});

		// Scan Project button
		const scanButton = this.disposables.add(new Button(buttonContainer, { ...defaultButtonStyles, secondary: true }));
		scanButton.label = '$(search) Scan Project';
		scanButton.onDidClick(() => {
			this.commandService.executeCommand('aiOrchestrator.scanProject');
		});
	}

	private renderAgentButtons(container: HTMLElement): void {
		const buttonsContainer = $('.agent-buttons-container');
		container.appendChild(buttonsContainer);

		// Welcome header
		const header = $('.header');
		header.textContent = localize('aiOrchestrator.welcome', "AI-Powered Development");
		buttonsContainer.appendChild(header);

		// Description
		const description = $('.description');
		description.textContent = localize('aiOrchestrator.welcomeDesc', "Use AI to plan, architect, and build your project. Click below to start chatting with AI agents.");
		buttonsContainer.appendChild(description);

		// Start Building button (primary action)
		const startButton = this.disposables.add(new Button(buttonsContainer, { ...defaultButtonStyles }));
		startButton.label = '$(comment-discussion) Start Building with AI Chat';
		startButton.element.classList.add('prominent-button');
		startButton.onDidClick(() => {
			this.commandService.executeCommand('aiOrchestrator.startBuilding');
		});

		// Divider
		const divider = $('.divider');
		divider.textContent = '—————  or use quick actions  —————';
		buttonsContainer.appendChild(divider);

		const agentGrid = $('.agent-grid');
		buttonsContainer.appendChild(agentGrid);

		// v0 Button (Quick action - currently disabled)
		const v0Button = this.disposables.add(new Button(agentGrid, { ...defaultButtonStyles, secondary: true }));
		v0Button.label = '$(robot) v0';
		v0Button.enabled = false; // Disabled for MVP - use chat instead
		v0Button.onDidClick(() => {
			this.commandService.executeCommand('aiOrchestrator.runV0Agent');
		});

		// Claude Button (Quick action - currently disabled)
		const claudeButton = this.disposables.add(new Button(agentGrid, { ...defaultButtonStyles, secondary: true }));
		claudeButton.label = '$(sparkle) Claude';
		claudeButton.enabled = false; // Disabled for MVP - use chat instead
		claudeButton.onDidClick(() => {
			this.commandService.executeCommand('aiOrchestrator.runClaudeAgent');
		});

		// Gemini Button (Quick action - currently disabled)
		const geminiButton = this.disposables.add(new Button(agentGrid, { ...defaultButtonStyles, secondary: true }));
		geminiButton.label = '$(sparkle) Gemini';
		geminiButton.enabled = false; // Disabled for MVP - use chat instead
		geminiButton.onDidClick(() => {
			this.commandService.executeCommand('aiOrchestrator.runGeminiAgent');
		});

		// GPT Button (Quick action - currently disabled)
		const gptButton = this.disposables.add(new Button(agentGrid, { ...defaultButtonStyles, secondary: true }));
		gptButton.label = '$(sparkle) GPT';
		gptButton.enabled = false; // Disabled for MVP - use chat instead
		gptButton.onDidClick(() => {
			this.commandService.executeCommand('aiOrchestrator.runGPTAgent');
		});
	}

	private async refreshTasks(): Promise<void> {
		try {
			this.tasks = await this.aiService.getAllTasks();
			this.renderTasks();
		} catch (error) {
			console.error('Error refreshing tasks:', error);
		}
	}

	private renderTasks(): void {
		// Clear existing tasks
		this.tasksListContainer.innerHTML = '';

		if (this.tasks.length === 0) {
			const emptyState = $('.empty-state');
			emptyState.textContent = localize('aiOrchestrator.noTasks', "No tasks yet. Click 'Start Building with AI Chat' above to begin.");
			this.tasksListContainer.appendChild(emptyState);
			return;
		}

		// Render each task
		for (const task of this.tasks) {
			const taskElement = this.renderTask(task);
			this.tasksListContainer.appendChild(taskElement);
		}
	}

	private renderTask(task: ITask): HTMLElement {
		const taskContainer = $('.task-item');
		taskContainer.classList.add(`status-${task.status}`);

		// Task header
		const header = $('.task-header');
		const agentBadge = $('.agent-badge');
		agentBadge.textContent = task.agent.toUpperCase();
		agentBadge.classList.add(`agent-${task.agent}`);
		header.appendChild(agentBadge);

		const statusBadge = $('.status-badge');
		statusBadge.textContent = task.status.toUpperCase();
		header.appendChild(statusBadge);

		taskContainer.appendChild(header);

		// Task description
		const description = $('.task-prompt');
		description.textContent = task.description;
		taskContainer.appendChild(description);

		// Progress bar (if running)
		if (task.status === 'in_progress') {
			const progressContainer = $('.progress-container');
			const progressBar = $('.progress-bar');
			progressBar.style.width = `${task.progress}%`;
			progressContainer.appendChild(progressBar);
			taskContainer.appendChild(progressContainer);

			const progressText = $('.progress-text');
			progressText.textContent = `${task.progress}%`;
			taskContainer.appendChild(progressText);
		}

		// TODO: Add validation results back in Phase 3
		/* Validation results (if completed)
		if (task.validationResults) {
			const results = $('.validation-results');
			results.textContent = `✓ ${task.validationResults.testsPassed}/${task.validationResults.testsRun} tests passed`;
			if (task.validationResults.testsFailed > 0) {
				results.classList.add('has-failures');
			}
			taskContainer.appendChild(results);
		}

		// Branch name
		if (task.branchName) {
			const branch = $('.branch-name');
			branch.textContent = `$(git-branch) ${task.branchName}`;
			taskContainer.appendChild(branch);
		}
		*/

		// Actions
		const actions = $('.task-actions');

		// View logs button
		const viewLogsBtn = this.disposables.add(new Button(actions, { ...defaultButtonStyles, secondary: true }));
		viewLogsBtn.label = 'View Logs';
		viewLogsBtn.onDidClick(() => this.showTaskLogs(task));

		// Cancel/Delete button
		if (task.status === 'in_progress') {
			const cancelBtn = this.disposables.add(new Button(actions, { ...defaultButtonStyles, secondary: true }));
			cancelBtn.label = 'Cancel';
			cancelBtn.onDidClick(async () => {
				await this.aiService.cancelTask(task.id);
				this.refreshTasks();
			});
		} else {
			const deleteBtn = this.disposables.add(new Button(actions, { ...defaultButtonStyles, secondary: true }));
			deleteBtn.label = 'Delete';
			deleteBtn.onDidClick(async () => {
				await this.aiService.deleteTask(task.id);
				this.refreshTasks();
			});
		}

		taskContainer.appendChild(actions);

		return taskContainer;
	}

	private showTaskLogs(task: ITask): void {
		// TODO: Open a new panel or editor to show detailed logs
		// For now, just log to console
		console.log('Task logs:', task.logs);
	}

	override dispose(): void {
		if (this.pollInterval) {
			clearInterval(this.pollInterval);
		}
		this.disposables.dispose();
		super.dispose();
	}
}
