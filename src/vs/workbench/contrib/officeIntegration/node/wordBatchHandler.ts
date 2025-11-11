/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { spawn } from 'child_process';
import { IEditOperation } from '../common/officeSessionManager.js';

/**
 * Batch execution result
 */
export interface IBatchExecutionResult {
	success: boolean;
	editsApplied: number;
	errors: string[];
}

/**
 * Word Batch Handler - Executes batch edit operations via PowerShell COM
 *
 * This handler prevents cursor jumping and screen flashing by:
 * 1. Locking the document (checkout)
 * 2. Executing all edits in a single PowerShell session
 * 3. Unlocking the document (checkin)
 *
 * Usage:
 * ```typescript
 * const handler = new WordBatchHandler();
 *
 * // 1. Checkout (lock document)
 * await handler.checkout();
 *
 * // 2. Execute batch edits
 * const result = await handler.executeBatch([
 *   { type: 'append', params: { text: 'Hello' } },
 *   { type: 'append', params: { text: 'World' } }
 * ]);
 *
 * // 3. Checkin (unlock and save)
 * await handler.checkin(true);
 * ```
 */
export class WordBatchHandler {
	private isCheckedOut: boolean = false;

	/**
	 * Checkout (lock) document for batch editing
	 */
	async checkout(): Promise<boolean> {
		if (this.isCheckedOut) {
			return false; // Already checked out
		}

		// Note: Checkout doesn't require PowerShell execution
		// It's a logical lock managed by the session manager
		this.isCheckedOut = true;
		return true;
	}

	/**
	 * Execute batch of edit operations atomically
	 */
	async executeBatch(edits: IEditOperation[]): Promise<IBatchExecutionResult> {
		if (!this.isCheckedOut) {
			return {
				success: false,
				editsApplied: 0,
				errors: ['Document not checked out']
			};
		}

		if (edits.length === 0) {
			return {
				success: true,
				editsApplied: 0,
				errors: []
			};
		}

		// Generate PowerShell script for batch operations
		const script = this.generateBatchScript(edits);

		// Execute PowerShell script
		try {
			await this.executePowerShell(script);
			return {
				success: true,
				editsApplied: edits.length,
				errors: []
			};
		} catch (error: any) {
			return {
				success: false,
				editsApplied: 0,
				errors: [error.message || String(error)]
			};
		}
	}

	/**
	 * Checkin (unlock) document and optionally save
	 */
	async checkin(save: boolean = true): Promise<boolean> {
		if (!this.isCheckedOut) {
			return false;
		}

		// Generate save script if needed
		if (save) {
			const script = `
$word = [System.Runtime.InteropServices.Marshal]::GetActiveObject('Word.Application')
if ($word.Documents.Count -gt 0) {
    $doc = $word.ActiveDocument
    $doc.Save()
}
`;
			try {
				await this.executePowerShell(script);
			} catch (error) {
				// Save failed, but still unlock
				this.isCheckedOut = false;
				return false;
			}
		}

		this.isCheckedOut = false;
		return true;
	}

	/**
	 * Generate PowerShell script for batch edits
	 */
	private generateBatchScript(edits: IEditOperation[]): string {
		const commands: string[] = [];

		// Initialize Word COM object
		commands.push(`
$word = [System.Runtime.InteropServices.Marshal]::GetActiveObject('Word.Application')
if ($word.Documents.Count -eq 0) {
    throw "No Word document is currently open"
}
$doc = $word.ActiveDocument
$selection = $word.Selection
`);

		// Generate commands for each edit
		for (const edit of edits) {
			switch (edit.type) {
				case 'append':
					commands.push(this.generateAppendCommand(edit.params));
					break;
				case 'insert':
					commands.push(this.generateInsertCommand(edit.params));
					break;
				case 'replace':
					commands.push(this.generateReplaceCommand(edit.params));
					break;
				case 'format':
					commands.push(this.generateFormatCommand(edit.params));
					break;
				case 'delete':
					commands.push(this.generateDeleteCommand(edit.params));
					break;
				case 'highlight':
					commands.push(this.generateHighlightCommand(edit.params));
					break;
			}
		}

		return commands.join('\n');
	}

	/**
	 * Generate PowerShell command for append operation
	 */
	private generateAppendCommand(params: any): string {
		const text = params.text || '';
		const bold = params.bold ? '$true' : '$false';
		const italic = params.italic ? '$true' : '$false';

		return `
$selection.EndKey([Microsoft.Office.Interop.Word.WdUnits]::wdStory)
$selection.Font.Bold = ${bold}
$selection.Font.Italic = ${italic}
$selection.TypeText("${this.escapeText(text)}")
`;
	}

	/**
	 * Generate PowerShell command for insert operation
	 */
	private generateInsertCommand(params: any): string {
		const text = params.text || '';
		const _position = params.position || 0;

		return `
$range = $doc.Range(${_position}, ${_position})
$range.Text = "${this.escapeText(text)}"
`;
	}

	/**
	 * Generate PowerShell command for replace operation
	 */
	private generateReplaceCommand(params: any): string {
		const find = params.find || '';
		const replace = params.replace || '';

		return `
$selection.Find.ClearFormatting()
$selection.Find.Text = "${this.escapeText(find)}"
$selection.Find.Replacement.Text = "${this.escapeText(replace)}"
$selection.Find.Execute([ref]$null, [ref]$null, [ref]$null, [ref]$null, [ref]$null, [ref]$null, [ref]$null, [ref]$null, [ref]$null, [ref]$null, [Microsoft.Office.Interop.Word.WdReplace]::wdReplaceAll)
`;
	}

	/**
	 * Generate PowerShell command for format operation
	 */
	private generateFormatCommand(params: any): string {
		const commands: string[] = [];

		if (params.bold !== undefined) {
			commands.push(`$selection.Font.Bold = ${params.bold ? '$true' : '$false'}`);
		}
		if (params.italic !== undefined) {
			commands.push(`$selection.Font.Italic = ${params.italic ? '$true' : '$false'}`);
		}
		if (params.fontSize !== undefined) {
			commands.push(`$selection.Font.Size = ${params.fontSize}`);
		}
		if (params.fontName) {
			commands.push(`$selection.Font.Name = "${params.fontName}"`);
		}

		return commands.join('\n');
	}

	/**
	 * Generate PowerShell command for delete operation
	 */
	private generateDeleteCommand(params: any): string {
		const _start = params.start || 0;
		const _end = params.end || _start;

		return `
$range = $doc.Range(${_start}, ${_end})
$range.Delete()
`;
	}

	/**
	 * Generate PowerShell command for highlight operation
	 */
	private generateHighlightCommand(params: any): string {
		const _start = params.start || 0;
		const _end = params.end || _start;
		const color = params.color || 'wdYellow';

		return `
$range = $doc.Range(${_start}, ${_end})
$range.HighlightColorIndex = [Microsoft.Office.Interop.Word.WdColorIndex]::${color}
`;
	}

	/**
	 * Escape text for PowerShell strings
	 */
	private escapeText(text: string): string {
		return text
			.replace(/\\/g, '\\\\')
			.replace(/"/g, '\\"')
			.replace(/\$/g, '\\$')
			.replace(/`/g, '\\`')
			.replace(/\r/g, '\\r')
			.replace(/\n/g, '\\n');
	}

	/**
	 * Execute PowerShell script
	 */
	private executePowerShell(script: string): Promise<string> {
		return new Promise((resolve, reject) => {
			const ps = spawn('powershell.exe', [
				'-NoProfile',
				'-ExecutionPolicy', 'Bypass',
				'-Command', script
			]);

			let stdout = '';
			let stderr = '';

			ps.stdout.on('data', (data) => {
				stdout += data.toString();
			});

			ps.stderr.on('data', (data) => {
				stderr += data.toString();
			});

			ps.on('close', (code) => {
				if (code === 0) {
					resolve(stdout);
				} else {
					reject(new Error(`PowerShell exited with code ${code}: ${stderr}`));
				}
			});

			ps.on('error', (error) => {
				reject(error);
			});
		});
	}
}
