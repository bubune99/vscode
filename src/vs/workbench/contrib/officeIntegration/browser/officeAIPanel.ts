/*---------------------------------------------------------------------------------------------
 *  Office AI Assistant Panel
 *  Location in VS Code fork: src/vs/workbench/contrib/office/browser/officeAIPanel.ts
 *--------------------------------------------------------------------------------------------*/

import { ViewPane } from '../../../browser/parts/views/viewPane.js';
import { IViewletViewOptions } from '../../../browser/parts/views/viewsViewlet.js';
import { IKeybindingService } from '../../../../platform/keybinding/common/keybinding.js';
import { IContextMenuService } from '../../../../platform/contextview/browser/contextView.js';
import { IConfigurationService } from '../../../../platform/configuration/common/configuration.js';
import { IContextKeyService } from '../../../../platform/contextkey/common/contextkey.js';
import { IInstantiationService } from '../../../../platform/instantiation/common/instantiation.js';
import { IOpenerService } from '../../../../platform/opener/common/opener.js';
import { IThemeService } from '../../../../platform/theme/common/themeService.js';
import { IOfficeService, MCPTool } from '../common/officeService.js';
import { ICommandService } from '../../../../platform/commands/common/commands.js';
import { $ } from '../../../../base/browser/dom.js';
import { Button } from '../../../../base/browser/ui/button/button.js';
import { defaultButtonStyles } from '../../../../platform/theme/browser/defaultStyles.js';
import { DisposableStore } from '../../../../base/common/lifecycle.js';
import { IViewDescriptorService } from '../../../common/views.js';
import { IHoverService } from '../../../../platform/hover/browser/hover.js';

export class OfficeAIPanel extends ViewPane {
	private readonly disposables = new DisposableStore();
	private toolsContainer!: HTMLElement;
	private tools: MCPTool[] = [];

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
		@IOfficeService private readonly officeService: IOfficeService,
		@ICommandService private readonly commandService: ICommandService
	) {
		super(options, keybindingService, contextMenuService, configurationService, contextKeyService, viewDescriptorService, instantiationService, openerService, themeService, hoverService);
	}

	protected override renderBody(container: HTMLElement): void {
		super.renderBody(container);

		container.classList.add('office-ai-panel');

		// Create header
		this.renderPanelHeader(container);

		// Create quick actions grid
		this.renderQuickActions(container);

		// Create tools list
		this.toolsContainer = $('.tools-list');
		container.appendChild(this.toolsContainer);

		// Load MCP tools
		this.loadMCPTools();
	}

	private renderPanelHeader(container: HTMLElement): void {
		const header = $('.panel-header');
		header.style.padding = '10px';
		header.style.borderBottom = '1px solid var(--vscode-panel-border)';

		const title = $('.header-title');
		title.textContent = '🤖 Office AI Assistant';
		title.style.fontSize = '16px';
		title.style.fontWeight = 'bold';
		header.appendChild(title);

		container.appendChild(header);
	}

	private renderQuickActions(container: HTMLElement): void {
		const actionsContainer = $('.quick-actions-container');
		actionsContainer.style.padding = '15px';

		const actionsLabel = $('.actions-label');
		actionsLabel.textContent = 'Quick Actions';
		actionsLabel.style.fontSize = '12px';
		actionsLabel.style.fontWeight = 'bold';
		actionsLabel.style.marginBottom = '10px';
		actionsContainer.appendChild(actionsLabel);

		const actionsGrid = $('.actions-grid');
		actionsGrid.style.display = 'grid';
		actionsGrid.style.gridTemplateColumns = 'repeat(2, 1fr)';
		actionsGrid.style.gap = '8px';

		// Word Actions
		const wordGroup = this.createActionGroup('Word', [
			{ label: 'Format Text', command: 'office.ai.formatText' },
			{ label: 'Add Table', command: 'office.ai.addTable' },
			{ label: 'Insert Image', command: 'office.ai.insertImage' },
			{ label: 'Add Comment', command: 'office.ai.addComment' }
		]);
		actionsGrid.appendChild(wordGroup);

		// Excel Actions
		const excelGroup = this.createActionGroup('Excel', [
			{ label: 'Create Chart', command: 'office.ai.createChart' },
			{ label: 'Add Formula', command: 'office.ai.addFormula' },
			{ label: 'Format Cells', command: 'office.ai.formatCells' },
			{ label: 'Insert Data', command: 'office.ai.insertData' }
		]);
		actionsGrid.appendChild(excelGroup);

		// PowerPoint Actions
		const pptGroup = this.createActionGroup('PowerPoint', [
			{ label: 'New Slide', command: 'office.ai.newSlide' },
			{ label: 'Add Image', command: 'office.ai.pptAddImage' },
			{ label: 'Apply Template', command: 'office.ai.applyTemplate' },
			{ label: 'Export PDF', command: 'office.ai.exportPDF' }
		]);
		actionsGrid.appendChild(pptGroup);

		actionsContainer.appendChild(actionsGrid);
		container.appendChild(actionsContainer);
	}

	private createActionGroup(title: string, actions: Array<{ label: string, command: string }>): HTMLElement {
		const group = $('.action-group');
		group.style.border = '1px solid var(--vscode-panel-border)';
		group.style.borderRadius = '4px';
		group.style.padding = '8px';

		const groupTitle = $('.group-title');
		groupTitle.textContent = title;
		groupTitle.style.fontSize = '11px';
		groupTitle.style.fontWeight = 'bold';
		groupTitle.style.marginBottom = '6px';
		groupTitle.style.color = 'var(--vscode-foreground)';
		group.appendChild(groupTitle);

		const actionsList = $('.actions-list');
		actionsList.style.display = 'flex';
		actionsList.style.flexDirection = 'column';
		actionsList.style.gap = '4px';

		actions.forEach(action => {
			const btn = this.disposables.add(new Button(actionsList, {
				...defaultButtonStyles,
				secondary: true
			}));
			btn.label = action.label;
			btn.element.style.fontSize = '11px';
			btn.element.style.padding = '4px 8px';
			btn.onDidClick(() => this.commandService.executeCommand(action.command));
		});

		group.appendChild(actionsList);
		return group;
	}

	private async loadMCPTools(): Promise<void> {
		try {
			this.tools = await this.officeService.getMCPTools();
			this.renderTools();
		} catch (error) {
			console.error('Failed to load MCP tools:', error);
		}
	}

	private renderTools(): void {
		this.toolsContainer.innerHTML = '';

		const toolsLabel = $('.tools-label');
		toolsLabel.textContent = `Available Tools (${this.tools.length})`;
		toolsLabel.style.padding = '10px 15px';
		toolsLabel.style.fontSize = '12px';
		toolsLabel.style.fontWeight = 'bold';
		this.toolsContainer.appendChild(toolsLabel);

		// Group tools by category
		const wordTools = this.tools.filter(t => t.name.startsWith('word_'));
		const excelTools = this.tools.filter(t => t.name.startsWith('excel_'));
		const pptTools = this.tools.filter(t => t.name.startsWith('ppt_'));

		if (wordTools.length > 0) {
			this.renderToolCategory('Word Tools', wordTools);
		}
		if (excelTools.length > 0) {
			this.renderToolCategory('Excel Tools', excelTools);
		}
		if (pptTools.length > 0) {
			this.renderToolCategory('PowerPoint Tools', pptTools);
		}
	}

	private renderToolCategory(title: string, tools: MCPTool[]): void {
		const category = $('.tool-category');
		category.style.padding = '5px 15px';

		const categoryTitle = $('.category-title');
		categoryTitle.textContent = title;
		categoryTitle.style.fontSize = '11px';
		categoryTitle.style.fontWeight = 'bold';
		categoryTitle.style.marginBottom = '5px';
		categoryTitle.style.color = 'var(--vscode-descriptionForeground)';
		category.appendChild(categoryTitle);

		const toolsList = $('.tools');
		toolsList.style.fontSize = '11px';
		toolsList.style.marginLeft = '10px';

		tools.forEach(tool => {
			const toolItem = $('.tool-item');
			toolItem.textContent = `• ${tool.name}`;
			toolItem.style.padding = '2px 0';
			toolItem.style.cursor = 'pointer';
			toolItem.style.color = 'var(--vscode-textLink-foreground)';

			toolItem.addEventListener('click', () => {
				this.commandService.executeCommand('office.ai.executeTool', tool.name);
			});

			toolsList.appendChild(toolItem);
		});

		category.appendChild(toolsList);
		this.toolsContainer.appendChild(category);
	}

	override dispose(): void {
		this.disposables.dispose();
		super.dispose();
	}
}
