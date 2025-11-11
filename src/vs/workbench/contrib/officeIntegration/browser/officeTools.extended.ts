/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

/**
 * Extended Office Tools Implementation
 * This file contains the implementation stubs for all 60 native Office COM tools.
 *
 * Each method returns the proper structure that will be added to officeTools.contribution.ts
 *
 * ARCHITECTURE DECISION:
 * - Native Tools (60 tools): Fast, frequent operations with styling support
 * - MCP Tools (future): Complex multi-step workflows only
 *
 * This comprehensive coverage eliminates the need for MCP in most cases and solves
 * the context size and styling support issues identified by the user.
 */

import { CancellationToken } from '../../../../base/common/cancellation.js';
import { IToolData, IToolImpl, IToolInvocation, IToolResult } from '../../chat/common/languageModelToolsService.js';
import { IOfficeService } from '../common/officeService.js';

/**
 * Office Tools Registry
 * Contains all tool definitions and implementations for the 60 native Office tools
 */
export class OfficeToolsRegistry {

	// ==================== WORD TOOLS - TEXT MANIPULATION ====================

	static createWordInsertTextAtPosition(officeService: IOfficeService): { data: IToolData; impl: IToolImpl } {
		const data: IToolData = {
			id: 'office_word_insert_text_at_position',
			source: { type: 'internal', label: 'Office Integration' },
			displayName: 'Word: Insert Text at Position',
			modelDescription: 'Inserts text at a specific position (character index) in the Word document.',
			inputSchema: {
				type: 'object',
				properties: {
					text: { type: 'string', description: 'The text to insert' },
					position: { type: 'number', description: 'Character position (0-based index)' }
				},
				required: ['text', 'position']
			}
		};

		const impl: IToolImpl = {
			invoke: async (invocation: IToolInvocation, countTokens, progress, token: CancellationToken) => {
				try {
					const params = invocation.parameters as any;
					await officeService.executeMCPTool('word_insert_text_at_position', params);
					return { content: [{ kind: 'text', value: `Inserted text at position ${params.position}` }] } as IToolResult;
				} catch (error) {
					return { content: [{ kind: 'text', value: `Error: ${error}` }] } as IToolResult;
				}
			}
		};

		return { data, impl };
	}

	static createWordDeleteTextRange(officeService: IOfficeService): { data: IToolData; impl: IToolImpl } {
		const data: IToolData = {
			id: 'office_word_delete_text_range',
			source: { type: 'internal', label: 'Office Integration' },
			displayName: 'Word: Delete Text Range',
			modelDescription: 'Deletes text within a specific range (start and end positions).',
			inputSchema: {
				type: 'object',
				properties: {
					start: { type: 'number', description: 'Start position (0-based)' },
					end: { type: 'number', description: 'End position (0-based)' }
				},
				required: ['start', 'end']
			}
		};

		const impl: IToolImpl = {
			invoke: async (invocation: IToolInvocation, countTokens, progress, token: CancellationToken) => {
				try {
					const params = invocation.parameters as any;
					await officeService.executeMCPTool('word_delete_text_range', params);
					return { content: [{ kind: 'text', value: `Deleted text from position ${params.start} to ${params.end}` }] } as IToolResult;
				} catch (error) {
					return { content: [{ kind: 'text', value: `Error: ${error}` }] } as IToolResult;
				}
			}
		};

		return { data, impl };
	}

	// ==================== WORD TOOLS - FORMATTING & STYLING ====================

	static createWordApplyStyle(officeService: IOfficeService): { data: IToolData; impl: IToolImpl } {
		const data: IToolData = {
			id: 'office_word_apply_style',
			source: { type: 'internal', label: 'Office Integration' },
			displayName: 'Word: Apply Style',
			modelDescription: 'Applies a built-in or custom style to the selected text or paragraph (Heading 1, Heading 2, Normal, Title, Subtitle, etc.).',
			inputSchema: {
				type: 'object',
				properties: {
					styleName: {
						type: 'string',
						description: 'Style name (e.g., "Heading 1", "Heading 2", "Normal", "Title", "Subtitle", "Quote")',
						enum: ['Normal', 'Heading 1', 'Heading 2', 'Heading 3', 'Heading 4', 'Title', 'Subtitle', 'Quote', 'Code', 'List Bullet', 'List Number']
					}
				},
				required: ['styleName']
			}
		};

		const impl: IToolImpl = {
			invoke: async (invocation: IToolInvocation, countTokens, progress, token: CancellationToken) => {
				try {
					const params = invocation.parameters as any;
					await officeService.executeMCPTool('word_apply_style', params);
					return { content: [{ kind: 'text', value: `Applied style: ${params.styleName}` }] } as IToolResult;
				} catch (error) {
					return { content: [{ kind: 'text', value: `Error: ${error}` }] } as IToolResult;
				}
			}
		};

		return { data, impl };
	}

	static createWordSetFont(officeService: IOfficeService): { data: IToolData; impl: IToolImpl } {
		const data: IToolData = {
			id: 'office_word_set_font',
			source: { type: 'internal', label: 'Office Integration' },
			displayName: 'Word: Set Font',
			modelDescription: 'Sets font properties for the selected text (font family, size, color).',
			inputSchema: {
				type: 'object',
				properties: {
					fontName: { type: 'string', description: 'Font family name (e.g., "Arial", "Times New Roman", "Calibri")' },
					fontSize: { type: 'number', description: 'Font size in points' },
					fontColor: { type: 'string', description: 'Font color (e.g., "red", "blue", "#FF0000")' }
				}
			}
		};

		const impl: IToolImpl = {
			invoke: async (invocation: IToolInvocation, countTokens, progress, token: CancellationToken) => {
				try {
					const params = invocation.parameters as any;
					await officeService.executeMCPTool('word_set_font', params);
					const parts = [];
					if (params.fontName) { parts.push(params.fontName); }
					if (params.fontSize) { parts.push(`${params.fontSize}pt`); }
					if (params.fontColor) { parts.push(params.fontColor); }
					return { content: [{ kind: 'text', value: `Set font: ${parts.join(', ')}` }] } as IToolResult;
				} catch (error) {
					return { content: [{ kind: 'text', value: `Error: ${error}` }] } as IToolResult;
				}
			}
		};

		return { data, impl };
	}

	static createWordSetParagraphFormat(officeService: IOfficeService): { data: IToolData; impl: IToolImpl } {
		const data: IToolData = {
			id: 'office_word_set_paragraph_format',
			source: { type: 'internal', label: 'Office Integration' },
			displayName: 'Word: Set Paragraph Format',
			modelDescription: 'Sets paragraph formatting (alignment, spacing, indentation).',
			inputSchema: {
				type: 'object',
				properties: {
					alignment: {
						type: 'string',
						description: 'Text alignment',
						enum: ['left', 'center', 'right', 'justify']
					},
					lineSpacing: { type: 'number', description: 'Line spacing (e.g., 1.0, 1.5, 2.0)' },
					spaceBefore: { type: 'number', description: 'Space before paragraph in points' },
					spaceAfter: { type: 'number', description: 'Space after paragraph in points' },
					leftIndent: { type: 'number', description: 'Left indentation in points' },
					rightIndent: { type: 'number', description: 'Right indentation in points' },
					firstLineIndent: { type: 'number', description: 'First line indentation in points' }
				}
			}
		};

		const impl: IToolImpl = {
			invoke: async (invocation: IToolInvocation, countTokens, progress, token: CancellationToken) => {
				try {
					const params = invocation.parameters as any;
					await officeService.executeMCPTool('word_set_paragraph_format', params);
					return { content: [{ kind: 'text', value: 'Applied paragraph formatting' }] } as IToolResult;
				} catch (error) {
					return { content: [{ kind: 'text', value: `Error: ${error}` }] } as IToolResult;
				}
			}
		};

		return { data, impl };
	}

	static createWordApplyHighlight(officeService: IOfficeService): { data: IToolData; impl: IToolImpl } {
		const data: IToolData = {
			id: 'office_word_apply_highlight',
			source: { type: 'internal', label: 'Office Integration' },
			displayName: 'Word: Apply Highlight',
			modelDescription: 'Applies highlight color to the selected text.',
			inputSchema: {
				type: 'object',
				properties: {
					color: {
						type: 'string',
						description: 'Highlight color',
						enum: ['yellow', 'green', 'cyan', 'magenta', 'blue', 'red', 'darkBlue', 'darkCyan', 'darkGreen', 'darkMagenta', 'darkRed', 'darkYellow', 'gray', 'lightGray', 'black']
					}
				},
				required: ['color']
			}
		};

		const impl: IToolImpl = {
			invoke: async (invocation: IToolInvocation, countTokens, progress, token: CancellationToken) => {
				try {
					const params = invocation.parameters as any;
					await officeService.executeMCPTool('word_apply_highlight', params);
					return { content: [{ kind: 'text', value: `Applied ${params.color} highlight` }] } as IToolResult;
				} catch (error) {
					return { content: [{ kind: 'text', value: `Error: ${error}` }] } as IToolResult;
				}
			}
		};

		return { data, impl };
	}

	static createWordInsertPageBreak(officeService: IOfficeService): { data: IToolData; impl: IToolImpl } {
		const data: IToolData = {
			id: 'office_word_insert_page_break',
			source: { type: 'internal', label: 'Office Integration' },
			displayName: 'Word: Insert Page Break',
			modelDescription: 'Inserts a page break at the current cursor position.',
			inputSchema: { type: 'object', properties: {} }
		};

		const impl: IToolImpl = {
			invoke: async (invocation: IToolInvocation, countTokens, progress, token: CancellationToken) => {
				try {
					await officeService.executeMCPTool('word_insert_page_break', {});
					return { content: [{ kind: 'text', value: 'Inserted page break' }] } as IToolResult;
				} catch (error) {
					return { content: [{ kind: 'text', value: `Error: ${error}` }] } as IToolResult;
				}
			}
		};

		return { data, impl };
	}

	static createWordInsertSectionBreak(officeService: IOfficeService): { data: IToolData; impl: IToolImpl } {
		const data: IToolData = {
			id: 'office_word_insert_section_break',
			source: { type: 'internal', label: 'Office Integration' },
			displayName: 'Word: Insert Section Break',
			modelDescription: 'Inserts a section break (next page, continuous, even page, odd page).',
			inputSchema: {
				type: 'object',
				properties: {
					breakType: {
						type: 'string',
						description: 'Section break type',
						enum: ['nextPage', 'continuous', 'evenPage', 'oddPage']
					}
				},
				required: ['breakType']
			}
		};

		const impl: IToolImpl = {
			invoke: async (invocation: IToolInvocation, countTokens, progress, token: CancellationToken) => {
				try {
					const params = invocation.parameters as any;
					await officeService.executeMCPTool('word_insert_section_break', params);
					return { content: [{ kind: 'text', value: `Inserted ${params.breakType} section break` }] } as IToolResult;
				} catch (error) {
					return { content: [{ kind: 'text', value: `Error: ${error}` }] } as IToolResult;
				}
			}
		};

		return { data, impl };
	}

	// ==================== WORD TOOLS - DOCUMENT STRUCTURE ====================

	static createWordCreateTable(officeService: IOfficeService): { data: IToolData; impl: IToolImpl } {
		const data: IToolData = {
			id: 'office_word_create_table',
			source: { type: 'internal', label: 'Office Integration' },
			displayName: 'Word: Create Table',
			modelDescription: 'Creates a table with specified rows and columns.',
			inputSchema: {
				type: 'object',
				properties: {
					rows: { type: 'number', description: 'Number of rows' },
					columns: { type: 'number', description: 'Number of columns' }
				},
				required: ['rows', 'columns']
			}
		};

		const impl: IToolImpl = {
			invoke: async (invocation: IToolInvocation, countTokens, progress, token: CancellationToken) => {
				try {
					const params = invocation.parameters as any;
					await officeService.executeMCPTool('word_create_table', params);
					return { content: [{ kind: 'text', value: `Created ${params.rows}x${params.columns} table` }] } as IToolResult;
				} catch (error) {
					return { content: [{ kind: 'text', value: `Error: ${error}` }] } as IToolResult;
				}
			}
		};

		return { data, impl };
	}

	// TODO: Add remaining Word document structure tools
	// - word_insert_row, word_insert_column, word_merge_cells
	// - word_insert_image, word_insert_hyperlink
	// - word_get_document_properties, word_set_document_theme

	// ==================== EXCEL TOOLS - CELL OPERATIONS ====================

	static createExcelWriteRange(officeService: IOfficeService): { data: IToolData; impl: IToolImpl } {
		const data: IToolData = {
			id: 'office_excel_write_range',
			source: { type: 'internal', label: 'Office Integration' },
			displayName: 'Excel: Write Range',
			modelDescription: 'Writes a 2D array of values to a range of cells in Excel.',
			inputSchema: {
				type: 'object',
				properties: {
					range: { type: 'string', description: 'Cell range (e.g., "A1:C3")' },
					values: {
						type: 'array',
						description: '2D array of values [[row1], [row2], ...]',
						items: { type: 'array', items: { type: ['string', 'number'] } }
					}
				},
				required: ['range', 'values']
			}
		};

		const impl: IToolImpl = {
			invoke: async (invocation: IToolInvocation, countTokens, progress, token: CancellationToken) => {
				try {
					const params = invocation.parameters as any;
					await officeService.executeMCPTool('excel_write_range', params);
					return { content: [{ kind: 'text', value: `Wrote data to range ${params.range}` }] } as IToolResult;
				} catch (error) {
					return { content: [{ kind: 'text', value: `Error: ${error}` }] } as IToolResult;
				}
			}
		};

		return { data, impl };
	}

	// TODO: Add remaining Excel cell operations
	// - excel_clear_range, excel_copy_range, excel_paste_range

	// ==================== EXCEL TOOLS - FORMATTING & STYLING ====================

	static createExcelSetCellFormat(officeService: IOfficeService): { data: IToolData; impl: IToolImpl } {
		const data: IToolData = {
			id: 'office_excel_set_cell_format',
			source: { type: 'internal', label: 'Office Integration' },
			displayName: 'Excel: Set Cell Format',
			modelDescription: 'Sets the number format for a cell or range (General, Number, Currency, Date, Time, Percentage, etc.).',
			inputSchema: {
				type: 'object',
				properties: {
					range: { type: 'string', description: 'Cell or range (e.g., "A1" or "A1:C10")' },
					format: {
						type: 'string',
						description: 'Format string (e.g., "General", "0.00", "$#,##0.00", "mm/dd/yyyy", "0%")'
					}
				},
				required: ['range', 'format']
			}
		};

		const impl: IToolImpl = {
			invoke: async (invocation: IToolInvocation, countTokens, progress, token: CancellationToken) => {
				try {
					const params = invocation.parameters as any;
					await officeService.executeMCPTool('excel_set_cell_format', params);
					return { content: [{ kind: 'text', value: `Applied format "${params.format}" to ${params.range}` }] } as IToolResult;
				} catch (error) {
					return { content: [{ kind: 'text', value: `Error: ${error}` }] } as IToolResult;
				}
			}
		};

		return { data, impl };
	}

	static createExcelSetFont(officeService: IOfficeService): { data: IToolData; impl: IToolImpl } {
		const data: IToolData = {
			id: 'office_excel_set_font',
			source: { type: 'internal', label: 'Office Integration' },
			displayName: 'Excel: Set Font',
			modelDescription: 'Sets font properties for a cell or range (font family, size, color, bold, italic).',
			inputSchema: {
				type: 'object',
				properties: {
					range: { type: 'string', description: 'Cell or range' },
					fontName: { type: 'string', description: 'Font family name' },
					fontSize: { type: 'number', description: 'Font size in points' },
					fontColor: { type: 'string', description: 'Font color (e.g., "red", "#FF0000")' },
					bold: { type: 'boolean', description: 'Bold formatting' },
					italic: { type: 'boolean', description: 'Italic formatting' }
				},
				required: ['range']
			}
		};

		const impl: IToolImpl = {
			invoke: async (invocation: IToolInvocation, countTokens, progress, token: CancellationToken) => {
				try {
					const params = invocation.parameters as any;
					await officeService.executeMCPTool('excel_set_font', params);
					return { content: [{ kind: 'text', value: `Applied font formatting to ${params.range}` }] } as IToolResult;
				} catch (error) {
					return { content: [{ kind: 'text', value: `Error: ${error}` }] } as IToolResult;
				}
			}
		};

		return { data, impl };
	}

	static createExcelSetCellColor(officeService: IOfficeService): { data: IToolData; impl: IToolImpl } {
		const data: IToolData = {
			id: 'office_excel_set_cell_color',
			source: { type: 'internal', label: 'Office Integration' },
			displayName: 'Excel: Set Cell Color',
			modelDescription: 'Sets background and/or foreground color for a cell or range.',
			inputSchema: {
				type: 'object',
				properties: {
					range: { type: 'string', description: 'Cell or range' },
					backgroundColor: { type: 'string', description: 'Background color (e.g., "yellow", "#FFFF00")' },
					foregroundColor: { type: 'string', description: 'Foreground/pattern color' }
				},
				required: ['range']
			}
		};

		const impl: IToolImpl = {
			invoke: async (invocation: IToolInvocation, countTokens, progress, token: CancellationToken) => {
				try {
					const params = invocation.parameters as any;
					await officeService.executeMCPTool('excel_set_cell_color', params);
					return { content: [{ kind: 'text', value: `Applied cell color to ${params.range}` }] } as IToolResult;
				} catch (error) {
					return { content: [{ kind: 'text', value: `Error: ${error}` }] } as IToolResult;
				}
			}
		};

		return { data, impl };
	}

	// TODO: Add remaining Excel formatting tools
	// - excel_set_border, excel_merge_cells
	// - excel_set_column_width, excel_set_row_height

	// TODO: Add Excel worksheet management tools
	// - excel_create_sheet, excel_delete_sheet, excel_rename_sheet

	// TODO: Add Excel advanced tools
	// - excel_create_chart, excel_insert_formula, excel_auto_filter

	// TODO: Add PowerPoint tools (15 tools)
	// TODO: Add General Office tools (5 tools)
}
