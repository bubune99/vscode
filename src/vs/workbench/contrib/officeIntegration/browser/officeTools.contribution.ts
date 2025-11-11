/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { CancellationToken } from '../../../../base/common/cancellation.js';
import { Disposable } from '../../../../base/common/lifecycle.js';
import { IWorkbenchContribution } from '../../../common/contributions.js';
import { ILanguageModelToolsService, IToolData, IToolImpl, IToolInvocation, IToolResult } from '../../chat/common/languageModelToolsService.js';
import { IOfficeService } from '../common/officeService.js';

/**
 * Registers native Office COM tools with VS Code's language model tools service.
 * These tools provide fast, direct access to Office applications via PowerShell COM interop.
 */
export class OfficeToolsContribution extends Disposable implements IWorkbenchContribution {
	static readonly ID = 'workbench.contrib.officeTools';

	constructor(
		@ILanguageModelToolsService private readonly toolsService: ILanguageModelToolsService,
		@IOfficeService private readonly officeService: IOfficeService
	) {
		super();
		this.registerTools();
	}

	private registerTools(): void {
		// ========== WORD TOOLS (20 tools) ==========
		// Text Manipulation (5 tools)
		this.registerWordAppendText();
		this.registerWordReplaceText();
		this.registerWordGetSelection();
		// TODO: Implement these methods
		// this.registerWordInsertTextAtPosition();
		// this.registerWordDeleteTextRange();

		// Formatting & Styling (7 tools)
		this.registerWordFormatSelection();
		// TODO: Implement these methods
		// this.registerWordApplyStyle();
		// this.registerWordSetFont();
		// this.registerWordSetParagraphFormat();
		// this.registerWordApplyHighlight();
		// this.registerWordInsertPageBreak();
		// this.registerWordInsertSectionBreak();

		// Document Structure (8 tools)
		// TODO: Implement these methods
		// this.registerWordCreateTable();
		// this.registerWordInsertRow();
		// this.registerWordInsertColumn();
		// this.registerWordMergeCells();
		// this.registerWordInsertImage();
		// this.registerWordInsertHyperlink();
		// this.registerWordGetDocumentProperties();
		// this.registerWordSetDocumentTheme();

		// ========== EXCEL TOOLS (20 tools) ==========
		// Cell Operations (6 tools)
		this.registerExcelWriteCell();
		this.registerExcelReadRange();
		// TODO: Implement these methods
		// this.registerExcelWriteRange();
		// this.registerExcelClearRange();
		// this.registerExcelCopyRange();
		// this.registerExcelPasteRange();

		// Formatting & Styling (7 tools)
		// TODO: Implement these methods
		// this.registerExcelSetCellFormat();
		// this.registerExcelSetFont();
		// this.registerExcelSetCellColor();
		// this.registerExcelSetBorder();
		// this.registerExcelMergeCells();
		// this.registerExcelSetColumnWidth();
		// this.registerExcelSetRowHeight();

		// Worksheets (4 tools)
		this.registerExcelGetActiveSheet();
		// TODO: Implement these methods
		// this.registerExcelCreateSheet();
		// this.registerExcelDeleteSheet();
		// this.registerExcelRenameSheet();

		// Advanced (3 tools)
		// TODO: Implement these methods
		// this.registerExcelCreateChart();
		// this.registerExcelInsertFormula();
		// this.registerExcelAutoFilter();

		// ========== POWERPOINT TOOLS (15 tools) ==========
		// Slide Management (4 tools)
		this.registerPowerPointAddSlide();
		// TODO: Implement these methods
		// this.registerPowerPointDeleteSlide();
		// this.registerPowerPointDuplicateSlide();
		// this.registerPowerPointMoveSlide();

		// Content (5 tools)
		this.registerPowerPointAddText();
		// TODO: Implement these methods
		// this.registerPowerPointAddTextBox();
		// this.registerPowerPointAddTitle();
		// this.registerPowerPointInsertImage();
		// this.registerPowerPointAddShape();

		// Formatting (6 tools)
		// TODO: Implement these methods
		// this.registerPowerPointSetTextFormat();
		// this.registerPowerPointSetShapeFill();
		// this.registerPowerPointSetSlideLayout();
		// this.registerPowerPointApplyTheme();
		// this.registerPowerPointSetBackground();
		// this.registerPowerPointAddTransition();

		// ========== GENERAL OFFICE TOOLS (5 tools) ==========
		this.registerOfficeSave();
		// TODO: Implement these methods
		// this.registerOfficeSaveAs();
		// this.registerOfficeCloseDocument();
		this.registerOfficeGetActiveDocument();
		// this.registerOfficeExportPDF();
	}

	// ========== WORD TOOLS ==========

	private registerWordAppendText(): void {
		const toolData: IToolData = {
			id: 'office_word_append_text',
			source: { type: 'internal', label: 'Office Integration' },
			displayName: 'Word: Append Text',
			modelDescription: 'Appends text to the active Word document at the current cursor position. Use this when the user wants to add content to their document.',
			inputSchema: {
				type: 'object',
				properties: {
					text: {
						type: 'string',
						description: 'The text to append to the document'
					},
					bold: {
						type: 'boolean',
						description: 'Whether the text should be bold (default: false)'
					},
					italic: {
						type: 'boolean',
						description: 'Whether the text should be italic (default: false)'
					},
					fontSize: {
						type: 'number',
						description: 'Font size in points (optional)'
					}
				},
				required: ['text']
			}
		};

		const tool: IToolImpl = {
			invoke: async (invocation: IToolInvocation, countTokens, progress, token: CancellationToken) => {
				try {
					const params = invocation.parameters as any;
					await this.officeService.executeMCPTool('word_append_text', {
						text: params.text,
						bold: params.bold || false,
						italic: params.italic || false,
						fontSize: params.fontSize
					});

					return {
						content: [{ kind: 'text', value: `Successfully appended text to Word document: "${params.text.substring(0, 50)}${params.text.length > 50 ? '...' : ''}"` }]
					} as IToolResult;
				} catch (error) {
					return {
						content: [{ kind: 'text', value: `Error appending text: ${error}` }]
					} as IToolResult;
				}
			}
		};

		this._register(this.toolsService.registerTool(toolData, tool));
	}

	private registerWordReplaceText(): void {
		const toolData: IToolData = {
			id: 'office_word_replace_text',
			source: { type: 'internal', label: 'Office Integration' },
			displayName: 'Word: Replace Text',
			modelDescription: 'Finds and replaces text in the active Word document. Use this for search and replace operations.',
			inputSchema: {
				type: 'object',
				properties: {
					findText: {
						type: 'string',
						description: 'The text to find'
					},
					replaceText: {
						type: 'string',
						description: 'The text to replace with'
					},
					matchCase: {
						type: 'boolean',
						description: 'Whether to match case (default: false)'
					},
					matchWholeWord: {
						type: 'boolean',
						description: 'Whether to match whole words only (default: false)'
					}
				},
				required: ['findText', 'replaceText']
			}
		};

		const tool: IToolImpl = {
			invoke: async (invocation: IToolInvocation, countTokens, progress, token: CancellationToken) => {
				try {
					const params = invocation.parameters as any;
					await this.officeService.executeMCPTool('word_replace_text', {
						findText: params.findText,
						replaceText: params.replaceText
					});

					return {
						content: [{ kind: 'text', value: `Successfully replaced "${params.findText}" with "${params.replaceText}"` }]
					} as IToolResult;
				} catch (error) {
					return {
						content: [{ kind: 'text', value: `Error replacing text: ${error}` }]
					} as IToolResult;
				}
			}
		};

		this._register(this.toolsService.registerTool(toolData, tool));
	}

	private registerWordGetSelection(): void {
		const toolData: IToolData = {
			id: 'office_word_get_selection',
			source: { type: 'internal', label: 'Office Integration' },
			displayName: 'Word: Get Selection',
			modelDescription: 'Gets the currently selected text from the active Word document. Use this to read what the user has highlighted.',
			inputSchema: {
				type: 'object',
				properties: {}
			}
		};

		const tool: IToolImpl = {
			invoke: async (invocation: IToolInvocation, countTokens, progress, token: CancellationToken) => {
				try {
					const result = await this.officeService.executeMCPTool('word_get_selection', {});

					return {
						content: [{ kind: 'text', value: `Selected text: "${result.text}"` }]
					} as IToolResult;
				} catch (error) {
					return {
						content: [{ kind: 'text', value: `Error getting selection: ${error}` }]
					} as IToolResult;
				}
			}
		};

		this._register(this.toolsService.registerTool(toolData, tool));
	}

	private registerWordFormatSelection(): void {
		const toolData: IToolData = {
			id: 'office_word_format_selection',
			source: { type: 'internal', label: 'Office Integration' },
			displayName: 'Word: Format Selection',
			modelDescription: 'Applies formatting to the currently selected text in Word (bold, italic, underline, font size, color).',
			inputSchema: {
				type: 'object',
				properties: {
					bold: {
						type: 'boolean',
						description: 'Apply bold formatting'
					},
					italic: {
						type: 'boolean',
						description: 'Apply italic formatting'
					},
					underline: {
						type: 'boolean',
						description: 'Apply underline formatting'
					},
					fontSize: {
						type: 'number',
						description: 'Font size in points'
					},
					fontColor: {
						type: 'string',
						description: 'Font color (e.g., "red", "blue", "#FF0000")'
					}
				}
			}
		};

		const tool: IToolImpl = {
			invoke: async (invocation: IToolInvocation, countTokens, progress, token: CancellationToken) => {
				try {
					const params = invocation.parameters as any;
					await this.officeService.executeMCPTool('word_format_selection', params);

					const formatParts = [];
					if (params.bold) { formatParts.push('bold'); }
					if (params.italic) { formatParts.push('italic'); }
					if (params.underline) { formatParts.push('underline'); }
					if (params.fontSize) { formatParts.push(`${params.fontSize}pt`); }
					if (params.fontColor) { formatParts.push(params.fontColor); }

					return {
						content: [{ kind: 'text', value: `Successfully applied formatting: ${formatParts.join(', ')}` }]
					} as IToolResult;
				} catch (error) {
					return {
						content: [{ kind: 'text', value: `Error formatting selection: ${error}` }]
					} as IToolResult;
				}
			}
		};

		this._register(this.toolsService.registerTool(toolData, tool));
	}

	// ========== EXCEL TOOLS ==========

	private registerExcelWriteCell(): void {
		const toolData: IToolData = {
			id: 'office_excel_write_cell',
			source: { type: 'internal', label: 'Office Integration' },
			displayName: 'Excel: Write Cell',
			modelDescription: 'Writes a value to a specific cell in the active Excel worksheet. Use cell references like "A1", "B2", etc.',
			inputSchema: {
				type: 'object',
				properties: {
					cell: {
						type: 'string',
						description: 'The cell reference (e.g., "A1", "B2", "C10")'
					},
					value: {
						type: ['string', 'number'],
						description: 'The value to write to the cell'
					}
				},
				required: ['cell', 'value']
			}
		};

		const tool: IToolImpl = {
			invoke: async (invocation: IToolInvocation, countTokens, progress, token: CancellationToken) => {
				try {
					const params = invocation.parameters as any;
					await this.officeService.executeMCPTool('excel_write_cell', {
						cell: params.cell,
						value: params.value
					});

					return {
						content: [{ kind: 'text', value: `Successfully wrote "${params.value}" to cell ${params.cell}` }]
					} as IToolResult;
				} catch (error) {
					return {
						content: [{ kind: 'text', value: `Error writing to cell: ${error}` }]
					} as IToolResult;
				}
			}
		};

		this._register(this.toolsService.registerTool(toolData, tool));
	}

	private registerExcelReadRange(): void {
		const toolData: IToolData = {
			id: 'office_excel_read_range',
			source: { type: 'internal', label: 'Office Integration' },
			displayName: 'Excel: Read Range',
			modelDescription: 'Reads values from a range of cells in the active Excel worksheet (e.g., "A1:C10").',
			inputSchema: {
				type: 'object',
				properties: {
					range: {
						type: 'string',
						description: 'The cell range to read (e.g., "A1:C10", "A:A" for entire column)'
					}
				},
				required: ['range']
			}
		};

		const tool: IToolImpl = {
			invoke: async (invocation: IToolInvocation, countTokens, progress, token: CancellationToken) => {
				try {
					const params = invocation.parameters as any;
					const result = await this.officeService.executeMCPTool('excel_read_range', {
						range: params.range
					});

					return {
						content: [{ kind: 'text', value: `Data from range ${params.range}: ${JSON.stringify(result.values)}` }]
					} as IToolResult;
				} catch (error) {
					return {
						content: [{ kind: 'text', value: `Error reading range: ${error}` }]
					} as IToolResult;
				}
			}
		};

		this._register(this.toolsService.registerTool(toolData, tool));
	}

	private registerExcelGetActiveSheet(): void {
		const toolData: IToolData = {
			id: 'office_excel_get_active_sheet',
			source: { type: 'internal', label: 'Office Integration' },
			displayName: 'Excel: Get Active Sheet',
			modelDescription: 'Gets the name of the currently active worksheet in Excel.',
			inputSchema: {
				type: 'object',
				properties: {}
			}
		};

		const tool: IToolImpl = {
			invoke: async (invocation: IToolInvocation, countTokens, progress, token: CancellationToken) => {
				try {
					const result = await this.officeService.executeMCPTool('excel_get_active_sheet', {});

					return {
						content: [{ kind: 'text', value: `Active sheet: "${result.sheetName}"` }]
					} as IToolResult;
				} catch (error) {
					return {
						content: [{ kind: 'text', value: `Error getting active sheet: ${error}` }]
					} as IToolResult;
				}
			}
		};

		this._register(this.toolsService.registerTool(toolData, tool));
	}

	// ========== POWERPOINT TOOLS ==========

	private registerPowerPointAddSlide(): void {
		const toolData: IToolData = {
			id: 'office_powerpoint_add_slide',
			source: { type: 'internal', label: 'Office Integration' },
			displayName: 'PowerPoint: Add Slide',
			modelDescription: 'Adds a new slide to the active PowerPoint presentation with a specified layout.',
			inputSchema: {
				type: 'object',
				properties: {
					layout: {
						type: 'string',
						description: 'The slide layout type (e.g., "Title", "TitleOnly", "Blank", "TitleAndContent")',
						enum: ['Title', 'TitleOnly', 'Blank', 'TitleAndContent', 'TwoContent']
					}
				},
				required: ['layout']
			}
		};

		const tool: IToolImpl = {
			invoke: async (invocation: IToolInvocation, countTokens, progress, token: CancellationToken) => {
				try {
					const params = invocation.parameters as any;
					await this.officeService.executeMCPTool('powerpoint_add_slide', {
						layout: params.layout
					});

					return {
						content: [{ kind: 'text', value: `Successfully added new slide with "${params.layout}" layout` }]
					} as IToolResult;
				} catch (error) {
					return {
						content: [{ kind: 'text', value: `Error adding slide: ${error}` }]
					} as IToolResult;
				}
			}
		};

		this._register(this.toolsService.registerTool(toolData, tool));
	}

	private registerPowerPointAddText(): void {
		const toolData: IToolData = {
			id: 'office_powerpoint_add_text',
			source: { type: 'internal', label: 'Office Integration' },
			displayName: 'PowerPoint: Add Text',
			modelDescription: 'Adds text to the currently selected text box or shape in PowerPoint.',
			inputSchema: {
				type: 'object',
				properties: {
					text: {
						type: 'string',
						description: 'The text to add'
					},
					slideIndex: {
						type: 'number',
						description: 'The slide index (1-based, optional - uses current slide if not specified)'
					}
				},
				required: ['text']
			}
		};

		const tool: IToolImpl = {
			invoke: async (invocation: IToolInvocation, countTokens, progress, token: CancellationToken) => {
				try {
					const params = invocation.parameters as any;
					await this.officeService.executeMCPTool('powerpoint_add_text', {
						text: params.text,
						slideIndex: params.slideIndex
					});

					return {
						content: [{ kind: 'text', value: `Successfully added text to PowerPoint slide` }]
					} as IToolResult;
				} catch (error) {
					return {
						content: [{ kind: 'text', value: `Error adding text: ${error}` }]
					} as IToolResult;
				}
			}
		};

		this._register(this.toolsService.registerTool(toolData, tool));
	}

	// ========== GENERAL OFFICE TOOLS ==========

	private registerOfficeSave(): void {
		const toolData: IToolData = {
			id: 'office_save_document',
			source: { type: 'internal', label: 'Office Integration' },
			displayName: 'Office: Save Document',
			modelDescription: 'Saves the currently active Office document (Word, Excel, or PowerPoint).',
			inputSchema: {
				type: 'object',
				properties: {}
			}
		};

		const tool: IToolImpl = {
			invoke: async (invocation: IToolInvocation, countTokens, progress, token: CancellationToken) => {
				try {
					await this.officeService.saveDocument();

					return {
						content: [{ kind: 'text', value: 'Successfully saved document' }]
					} as IToolResult;
				} catch (error) {
					return {
						content: [{ kind: 'text', value: `Error saving document: ${error}` }]
					} as IToolResult;
				}
			}
		};

		this._register(this.toolsService.registerTool(toolData, tool));
	}

	private registerOfficeGetActiveDocument(): void {
		const toolData: IToolData = {
			id: 'office_get_active_document',
			source: { type: 'internal', label: 'Office Integration' },
			displayName: 'Office: Get Active Document',
			modelDescription: 'Gets information about the currently active Office document (name, type, path).',
			inputSchema: {
				type: 'object',
				properties: {}
			}
		};

		const tool: IToolImpl = {
			invoke: async (invocation: IToolInvocation, countTokens, progress, token: CancellationToken) => {
				try {
					// TODO: Implement getActiveDocument in OfficeService
					// For now, return a placeholder
					return {
						content: [{ kind: 'text', value: 'Active document info: [Implementation pending]' }]
					} as IToolResult;
				} catch (error) {
					return {
						content: [{ kind: 'text', value: `Error getting active document: ${error}` }]
					} as IToolResult;
				}
			}
		};

		this._register(this.toolsService.registerTool(toolData, tool));
	}
}
