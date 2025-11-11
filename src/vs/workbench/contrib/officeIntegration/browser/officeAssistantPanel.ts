/*---------------------------------------------------------------------------------------------
 *  Office AI Assistant Panel - Sidebar panel with MCP tools
 *  Location in VS Code fork: src/vs/workbench/contrib/office/browser/officeAssistantPanel.ts
 *--------------------------------------------------------------------------------------------*/

import { ViewPane } from '../../../browser/parts/views/viewPane.js';
import { IViewletViewOptions } from '../../../browser/parts/views/viewsViewlet.js';
import { IKeybindingService } from '../../../../platform/keybinding/common/keybinding.js';
import { IContextMenuService } from '../../../../platform/contextview/browser/contextView.js';
import { IConfigurationService } from '../../../../platform/configuration/common/configuration.js';
import { IContextKeyService } from '../../../../platform/contextkey/common/contextkey.js';
import { IViewDescriptorService } from '../../../common/views.js';
import { IInstantiationService } from '../../../../platform/instantiation/common/instantiation.js';
import { IOpenerService } from '../../../../platform/opener/common/opener.js';
import { IThemeService } from '../../../../platform/theme/common/themeService.js';
// import { ITelemetryService } from '../../../../platform/telemetry/common/telemetry.js';
import { IOfficeService, MCPTool } from '../common/officeService.js';
import { Button } from '../../../../base/browser/ui/button/button.js';
import { defaultButtonStyles } from '../../../../platform/theme/browser/defaultStyles.js';
import { IHoverService } from '../../../../platform/hover/browser/hover.js';

export class OfficeAssistantPanel extends ViewPane {
	private mcpTools: MCPTool[] = [];
	private toolsContainer!: HTMLElement;

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
		@IOfficeService private readonly officeService: IOfficeService
	) {
		super(options, keybindingService, contextMenuService, configurationService, contextKeyService, viewDescriptorService, instantiationService, openerService, themeService, hoverService);
	}

	protected override renderBody(container: HTMLElement): void {
		super.renderBody(container);

		// Create header
		const header = document.createElement('div');
		header.className = 'office-assistant-header';
		header.style.padding = '10px';
		header.style.borderBottom = '1px solid var(--vscode-panel-border)';
		container.appendChild(header);

		const title = document.createElement('h3');
		title.textContent = 'Office AI Assistant';
		title.style.margin = '0';
		title.style.fontSize = '14px';
		header.appendChild(title);

		// Create tools container
		this.toolsContainer = document.createElement('div');
		this.toolsContainer.className = 'office-tools-container';
		this.toolsContainer.style.padding = '10px';
		container.appendChild(this.toolsContainer);

		// Load MCP tools
		this.loadMCPTools();
	}

	private async loadMCPTools(): Promise<void> {
		try {
			this.mcpTools = await this.officeService.getMCPTools();
			this.renderTools();
		} catch (error) {
			this.showError('Failed to load MCP tools');
		}
	}

	private renderTools(): void {
		this.toolsContainer.innerHTML = '';

		// Group tools by category
		const wordTools = this.mcpTools.filter(t => t.name.startsWith('word_com'));
		const excelTools = this.mcpTools.filter(t => t.name.startsWith('excel_com'));
		const pptTools = this.mcpTools.filter(t => t.name.startsWith('ppt_com'));

		// Render Word tools
		if (wordTools.length > 0) {
			this.renderToolCategory('Word Tools', wordTools);
		}

		// Render Excel tools
		if (excelTools.length > 0) {
			this.renderToolCategory('Excel Tools', excelTools);
		}

		// Render PowerPoint tools
		if (pptTools.length > 0) {
			this.renderToolCategory('PowerPoint Tools', pptTools);
		}
	}

	private renderToolCategory(categoryName: string, tools: MCPTool[]): void {
		// Category header
		const categoryHeader = document.createElement('div');
		categoryHeader.className = 'tool-category-header';
		categoryHeader.style.marginTop = '15px';
		categoryHeader.style.marginBottom = '8px';
		categoryHeader.style.fontWeight = 'bold';
		categoryHeader.style.fontSize = '12px';
		categoryHeader.style.textTransform = 'uppercase';
		categoryHeader.style.color = 'var(--vscode-descriptionForeground)';
		categoryHeader.textContent = categoryName;
		this.toolsContainer.appendChild(categoryHeader);

		// Tool buttons
		const toolsGrid = document.createElement('div');
		toolsGrid.className = 'tools-grid';
		toolsGrid.style.display = 'grid';
		toolsGrid.style.gridTemplateColumns = 'repeat(auto-fill, minmax(100px, 1fr))';
		toolsGrid.style.gap = '8px';
		this.toolsContainer.appendChild(toolsGrid);

		// Show only most useful tools
		const popularTools = this.getPopularTools(tools);

		popularTools.forEach(tool => {
			const button = this._register(new Button(toolsGrid, defaultButtonStyles));
			button.label = this.getToolDisplayName(tool.name);
			button.element.title = tool.description;
			button.element.style.fontSize = '11px';
			button.element.style.padding = '8px';

			button.onDidClick(async () => {
				await this.executeTool(tool);
			});
		});
	}

	private getPopularTools(tools: MCPTool[]): MCPTool[] {
		// Filter to show only the most useful/common tools
		const popularToolNames = [
			'word_com_append',
			'word_com_replace',
			'word_com_highlight',
			'word_com_save',
			'word_com_read',
			'excel_com_write',
			'excel_com_read',
			'excel_com_chart',
			'excel_com_format',
			'excel_com_save',
			'ppt_com_add_slide',
			'ppt_com_add_text',
			'ppt_com_add_image',
			'ppt_com_save',
			'ppt_com_export_pdf'
		];

		return tools.filter(t => popularToolNames.includes(t.name));
	}

	private getToolDisplayName(toolName: string): string {
		// Convert tool names to user-friendly display names
		const nameMap: Record<string, string> = {
			'word_com_append': 'Append Text',
			'word_com_replace': 'Replace Text',
			'word_com_highlight': 'Highlight',
			'word_com_save': 'Save',
			'word_com_read': 'Read Content',
			'excel_com_write': 'Write Data',
			'excel_com_read': 'Read Sheet',
			'excel_com_chart': 'Create Chart',
			'excel_com_format': 'Format Cells',
			'excel_com_save': 'Save',
			'ppt_com_add_slide': 'Add Slide',
			'ppt_com_add_text': 'Add Text',
			'ppt_com_add_image': 'Add Image',
			'ppt_com_save': 'Save',
			'ppt_com_export_pdf': 'Export PDF'
		};

		return nameMap[toolName] || toolName;
	}

	private async executeTool(tool: MCPTool): Promise<void> {
		try {
			// TODO: Properly register telemetry event
			// this.telemetryService.publicLog2('officeAssistant.toolExecuted', {
			// 	toolName: tool.name,
			// 	category: tool.name.split('_')[0] // word, excel, ppt
			// });

			// For simple tools with no required args, execute directly
			// For complex tools, show input dialog
			const requiredFields = this.getRequiredFields(tool);

			if (requiredFields.length === 0) {
				await this.officeService.executeMCPTool(tool.name, {});
				this.showSuccess(`${this.getToolDisplayName(tool.name)} executed successfully`);
			} else {
				// TODO: Show input form for required fields
				// For now, just show a message
				this.showInfo(`This tool requires input: ${requiredFields.join(', ')}`);
			}
		} catch (error) {
			// TODO: Properly register telemetry event
			// this.telemetryService.publicLog2('officeAssistant.toolError', {
			// 	toolName: tool.name,
			// 	error: String(error)
			// });
			this.showError(`Failed to execute ${tool.name}: ${error}`);
		}
	}

	private getRequiredFields(tool: MCPTool): string[] {
		if (!tool.inputSchema || !tool.inputSchema.required) {
			return [];
		}
		return tool.inputSchema.required;
	}

	private showSuccess(message: string): void {
		this.showMessage(message, 'success');
	}

	private showError(message: string): void {
		this.showMessage(message, 'error');
	}

	private showInfo(message: string): void {
		this.showMessage(message, 'info');
	}

	private showMessage(message: string, type: 'success' | 'error' | 'info'): void {
		const messageDiv = document.createElement('div');
		messageDiv.className = `office-message office-message-${type}`;
		messageDiv.textContent = message;
		messageDiv.style.padding = '8px';
		messageDiv.style.margin = '10px';
		messageDiv.style.borderRadius = '4px';
		messageDiv.style.fontSize = '12px';

		if (type === 'success') {
			messageDiv.style.backgroundColor = 'var(--vscode-testing-iconPassed)';
			messageDiv.style.color = '#ffffff';
		} else if (type === 'error') {
			messageDiv.style.backgroundColor = 'var(--vscode-errorForeground)';
			messageDiv.style.color = '#ffffff';
		} else {
			messageDiv.style.backgroundColor = 'var(--vscode-editorInfo-background)';
			messageDiv.style.color = 'var(--vscode-editorInfo-foreground)';
		}

		this.toolsContainer.insertBefore(messageDiv, this.toolsContainer.firstChild);

		// Auto-remove after 3 seconds
		setTimeout(() => {
			messageDiv.remove();
		}, 3000);
	}

	override dispose(): void {
		super.dispose();
	}
}
