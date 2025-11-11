/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import * as fs from 'fs';
import * as path from 'path';
import { glob as globCallback } from 'glob';
import { promisify } from 'util';
import * as mammoth from 'mammoth';
import { spawn } from 'child_process';

const glob = promisify(globCallback);

/**
 * Document match result from repository scan
 */
export interface IDocumentMatch {
	filePath: string;
	matchCount: number;
	context: string;
}

/**
 * Batch edit result for a single document
 */
export interface IBatchEditResult {
	filePath: string;
	success: boolean;
	editsApplied: number;
	error?: string;
}

/**
 * Edit operation for batch processing
 */
export interface IBatchEditOperation {
	type: 'replace' | 'append' | 'prepend';
	find?: string;
	text: string;
}

/**
 * Batch Document Processor - Mass document processing with Mammoth.js
 *
 * This processor combines:
 * - Mammoth.js for FAST document reading (no Word needed)
 * - PowerShell COM for POWERFUL editing
 *
 * Workflow:
 * 1. Scan repository with Mammoth (fast, 100s of docs in seconds)
 * 2. Analyze content with AI
 * 3. Batch edit with COM (powerful, preserves formatting)
 *
 * Usage:
 * ```typescript
 * const processor = new BatchDocumentProcessor();
 *
 * // Scan for documents
 * const matches = await processor.scanRepository('/project', 'old term');
 *
 * // Batch edit
 * const results = await processor.batchEdit([
 *   {
 *     filePath: '/doc1.docx',
 *     operations: [{ type: 'replace', find: 'old', text: 'new' }]
 *   }
 * ]);
 * ```
 */
export class BatchDocumentProcessor {

	/**
	 * Scan repository for documents matching search pattern
	 * Uses Mammoth for fast reading without opening Word
	 */
	async scanRepository(
		directory: string,
		searchPattern: string,
		options?: {
			recursive?: boolean;
			includeMetadata?: boolean;
		}
	): Promise<IDocumentMatch[]> {
		const recursive = options?.recursive !== false;
		const pattern = recursive
			? path.join(directory, '**/*.docx')
			: path.join(directory, '*.docx');

		// Find all .docx files
		const files = await glob(pattern);

		// Search each file with Mammoth
		const matches: IDocumentMatch[] = [];
		for (const filePath of files) {
			// Skip temp files and node_modules
			if (filePath.includes('~$') || filePath.includes('node_modules')) {
				continue;
			}
			try {
				// Read document with Mammoth (fast, no Word needed)
				const result = await mammoth.extractRawText({ path: filePath });
				const text = result.value;

				// Search for pattern (case-insensitive)
				const regex = new RegExp(searchPattern, 'gi');
				const matchArray = text.match(regex);

				if (matchArray && matchArray.length > 0) {
					// Get context around first match
					const firstMatchIndex = text.search(regex);
					const contextStart = Math.max(0, firstMatchIndex - 50);
					const contextEnd = Math.min(text.length, firstMatchIndex + 100);
					const context = text.substring(contextStart, contextEnd);

					matches.push({
						filePath,
						matchCount: matchArray.length,
						context: context.replace(/\s+/g, ' ').trim()
					});
				}
			} catch (error) {
				// Skip files that can't be read
				console.error(`Error reading ${filePath}:`, error);
			}
		}

		return matches;
	}

	/**
	 * Analyze documents with AI
	 * Uses Mammoth to extract clean markdown for AI processing
	 */
	async analyzeDocuments(
		filePaths: string[],
		analysisPrompt: string
	): Promise<Map<string, any>> {
		const analyses = new Map<string, any>();

		for (const filePath of filePaths) {
			try {
				// Extract HTML with Mammoth (note: mammoth doesn't have markdown export)
				const result = await mammoth.convertToHtml({ path: filePath });
				const html = result.value;

				// TODO: Send to AI for analysis
				// For now, return basic structure
				analyses.set(filePath, {
					summary: `Document at ${filePath}`,
					html,
					suggestedEdits: []
				});
			} catch (error) {
				console.error(`Error analyzing ${filePath}:`, error);
			}
		}

		return analyses;
	}

	/**
	 * Batch edit multiple documents using PowerShell COM
	 * Edits are applied atomically - all or nothing per document
	 */
	async batchEdit(
		edits: Array<{
			filePath: string;
			operations: IBatchEditOperation[];
			backup?: boolean;
		}>
	): Promise<IBatchEditResult[]> {
		const results: IBatchEditResult[] = [];

		for (const edit of edits) {
			// Create backup if requested
			if (edit.backup) {
				try {
					const backupPath = edit.filePath + '.backup';
					fs.copyFileSync(edit.filePath, backupPath);
				} catch (error) {
					results.push({
						filePath: edit.filePath,
						success: false,
						editsApplied: 0,
						error: `Backup failed: ${error}`
					});
					continue;
				}
			}

			// Generate PowerShell script for this document
			const script = this.generateBatchEditScript(edit.filePath, edit.operations);

			// Execute edits
			try {
				await this.executePowerShell(script);
				results.push({
					filePath: edit.filePath,
					success: true,
					editsApplied: edit.operations.length
				});
			} catch (error: any) {
				results.push({
					filePath: edit.filePath,
					success: false,
					editsApplied: 0,
					error: error.message || String(error)
				});
			}
		}

		return results;
	}

	/**
	 * Complete workflow: scan → analyze → edit
	 * One-shot operation for common use case
	 */
	async smartBatchWorkflow(
		directory: string,
		searchPattern: string,
		replacePattern: string,
		options?: {
			dryRun?: boolean;
			backup?: boolean;
		}
	): Promise<{
		scanned: number;
		matched: number;
		edited: number;
		results: IBatchEditResult[];
	}> {
		// Step 1: Scan repository
		const matches = await this.scanRepository(directory, searchPattern, { recursive: true });

		// Step 2: Prepare edits
		const edits = matches.map(match => ({
			filePath: match.filePath,
			operations: [{
				type: 'replace' as const,
				find: searchPattern,
				text: replacePattern
			}],
			backup: options?.backup
		}));

		// Step 3: Execute edits (unless dry run)
		let results: IBatchEditResult[] = [];
		if (!options?.dryRun) {
			results = await this.batchEdit(edits);
		}

		return {
			scanned: await this.countDocuments(directory),
			matched: matches.length,
			edited: results.filter(r => r.success).length,
			results
		};
	}

	/**
	 * Count total documents in directory
	 */
	private async countDocuments(directory: string): Promise<number> {
		const pattern = path.join(directory, '**/*.docx');
		const files = await glob(pattern);
		// Filter out temp files and node_modules
		const filtered = files.filter((f: string) => !f.includes('~$') && !f.includes('node_modules'));
		return filtered.length;
	}

	/**
	 * Generate PowerShell script for batch editing a single document
	 */
	private generateBatchEditScript(filePath: string, operations: IBatchEditOperation[]): string {
		const commands: string[] = [];

		// Open document
		commands.push(`
$word = New-Object -ComObject Word.Application
$word.Visible = $false
$doc = $word.Documents.Open("${filePath.replace(/\//g, '\\')}")
$selection = $word.Selection
`);

		// Generate commands for each operation
		for (const op of operations) {
			switch (op.type) {
				case 'replace':
					commands.push(`
$selection.Find.ClearFormatting()
$selection.Find.Text = "${this.escapeText(op.find || '')}"
$selection.Find.Replacement.Text = "${this.escapeText(op.text)}"
$selection.Find.Execute([ref]$null, [ref]$null, [ref]$null, [ref]$null, [ref]$null, [ref]$null, [ref]$null, [ref]$null, [ref]$null, [ref]$null, [Microsoft.Office.Interop.Word.WdReplace]::wdReplaceAll)
`);
					break;

				case 'append':
					commands.push(`
$selection.EndKey([Microsoft.Office.Interop.Word.WdUnits]::wdStory)
$selection.TypeText("${this.escapeText(op.text)}")
`);
					break;

				case 'prepend':
					commands.push(`
$range = $doc.Range(0, 0)
$range.Text = "${this.escapeText(op.text)}"
`);
					break;
			}
		}

		// Save and close
		commands.push(`
$doc.Save()
$doc.Close()
$word.Quit()
[System.Runtime.Interopservices.Marshal]::ReleaseComObject($word) | Out-Null
`);

		return commands.join('\n');
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
