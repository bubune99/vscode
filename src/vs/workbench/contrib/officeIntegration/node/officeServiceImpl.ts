/*---------------------------------------------------------------------------------------------
 *  Office Service Implementation - Native COM Embedding
 *  Location in VS Code fork: src/vs/workbench/contrib/office/node/officeServiceImpl.ts
 *--------------------------------------------------------------------------------------------*/

import { IOfficeService, OfficeDocumentType, MCPTool } from '../common/officeService.js';
import { spawn, ChildProcess } from 'child_process';

export class OfficeService implements IOfficeService {
	private mcpServerProcess: ChildProcess | null = null;
	private activeDocumentPath: string | null = null;
	private readonly mcpServerPath: string;

	constructor() {
		// Path to your MCP server
		this.mcpServerPath = 'C:\\Users\\bubun\\CascadeProjects\\ReactFlow\\windsurf-office-mcp\\dist\\index.js';
	}

	private async ensureMCPConnection(): Promise<void> {
		if (this.mcpServerProcess) {
			return;
		}

		// Start MCP server process
		this.mcpServerProcess = spawn('node', [this.mcpServerPath], {
			stdio: ['pipe', 'pipe', 'pipe']
		});

		// Wait for server to initialize
		await new Promise(resolve => setTimeout(resolve, 1000));
	}

	async openDocument(filePath: string, documentType: OfficeDocumentType): Promise<void> {
		await this.ensureMCPConnection();

		// Use PowerShell to open Office document
		// The Office window will be captured and embedded in the next step
		const { exec } = require('child_process');
		
		let command = '';
		switch (documentType) {
			case OfficeDocumentType.Word:
				command = `powershell -Command "Start-Process 'winword.exe' -ArgumentList '${filePath}'"`;
				break;
			case OfficeDocumentType.Excel:
				command = `powershell -Command "Start-Process 'excel.exe' -ArgumentList '${filePath}'"`;
				break;
			case OfficeDocumentType.PowerPoint:
				command = `powershell -Command "Start-Process 'powerpnt.exe' -ArgumentList '${filePath}'"`;
				break;
		}

		await new Promise((resolve, reject) => {
			exec(command, (error: any) => {
				if (error) reject(error);
				else resolve(null);
			});
		});

		this.activeDocumentPath = filePath;
	}

	async createDocument(documentType: OfficeDocumentType): Promise<void> {
		await this.ensureMCPConnection();

		const { exec } = require('child_process');
		
		let command = '';
		switch (documentType) {
			case OfficeDocumentType.Word:
				command = `powershell -Command "Start-Process 'winword.exe'"`;
				break;
			case OfficeDocumentType.Excel:
				command = `powershell -Command "Start-Process 'excel.exe'"`;
				break;
			case OfficeDocumentType.PowerPoint:
				command = `powershell -Command "Start-Process 'powerpnt.exe'"`;
				break;
		}

		await new Promise((resolve, reject) => {
			exec(command, (error: any) => {
				if (error) reject(error);
				else resolve(null);
			});
		});
	}

	async closeDocument(): Promise<void> {
		this.activeDocumentPath = null;
	}

	async saveDocument(filePath?: string): Promise<void> {
		if (!this.mcpServerProcess) {
			throw new Error('MCP server not started');
		}

		// Send save command to MCP server via stdin
		const path = filePath || this.activeDocumentPath;
		if (!path) {
			throw new Error('No active document to save');
		}

		const ext = path.split('.').pop()?.toLowerCase();
		let toolName = '';

		switch (ext) {
			case 'docx':
			case 'doc':
				toolName = 'word_com_save';
				break;
			case 'xlsx':
			case 'xls':
				toolName = 'excel_com_save';
				break;
			case 'pptx':
			case 'ppt':
				toolName = 'ppt_com_save';
				break;
		}

		if (toolName && this.mcpServerProcess.stdin) {
			const request = JSON.stringify({
				jsonrpc: '2.0',
				id: Date.now(),
				method: 'tools/call',
				params: {
					name: toolName,
					arguments: filePath ? { filePath } : {}
				}
			});
			this.mcpServerProcess.stdin.write(request + '\n');
		}
	}

	async executeMCPTool(toolName: string, args: any): Promise<any> {
		await this.ensureMCPConnection();

		if (!this.mcpServerProcess || !this.mcpServerProcess.stdin) {
			throw new Error('MCP server not available');
		}

		return new Promise((resolve, reject) => {
			const requestId = Date.now();
			const request = JSON.stringify({
				jsonrpc: '2.0',
				id: requestId,
				method: 'tools/call',
				params: {
					name: toolName,
					arguments: args
				}
			});

			// Listen for response
			const responseHandler = (data: Buffer) => {
				try {
					const response = JSON.parse(data.toString());
					if (response.id === requestId) {
						this.mcpServerProcess!.stdout!.off('data', responseHandler);
						if (response.error) {
							reject(new Error(response.error.message));
						} else {
							resolve(response.result);
						}
					}
				} catch (e) {
					// Ignore parse errors
				}
			};

			this.mcpServerProcess!.stdout!.on('data', responseHandler);
			this.mcpServerProcess!.stdin!.write(request + '\n');

			// Timeout after 30 seconds
			setTimeout(() => {
				this.mcpServerProcess!.stdout!.off('data', responseHandler);
				reject(new Error('MCP tool execution timeout'));
			}, 30000);
		});
	}

	async getMCPTools(): Promise<MCPTool[]> {
		await this.ensureMCPConnection();

		if (!this.mcpServerProcess || !this.mcpServerProcess.stdin) {
			return [];
		}

		return new Promise((resolve) => {
			const requestId = Date.now();
			const request = JSON.stringify({
				jsonrpc: '2.0',
				id: requestId,
				method: 'tools/list',
				params: {}
			});

			const responseHandler = (data: Buffer) => {
				try {
					const response = JSON.parse(data.toString());
					if (response.id === requestId) {
						this.mcpServerProcess!.stdout!.off('data', responseHandler);
						resolve(response.result?.tools || []);
					}
				} catch (e) {
					// Ignore parse errors
				}
			};

			this.mcpServerProcess!.stdout!.on('data', responseHandler);
			this.mcpServerProcess!.stdin!.write(request + '\n');

			// Timeout
			setTimeout(() => {
				this.mcpServerProcess!.stdout!.off('data', responseHandler);
				resolve([]);
			}, 5000);
		});
	}

	async isOfficeInstalled(): Promise<boolean> {
		const { exec } = require('child_process');
		return new Promise((resolve) => {
			exec('powershell -Command "try { $word = New-Object -ComObject Word.Application; $word.Quit(); Write-Output \'true\' } catch { Write-Output \'false\' }"',
				(error: any, stdout: string) => {
					resolve(stdout.trim() === 'true');
				}
			);
		});
	}

	async getActiveDocumentPath(): Promise<string | null> {
		return this.activeDocumentPath;
	}

	dispose(): void {
		if (this.mcpServerProcess) {
			this.mcpServerProcess.kill();
		}
	}
}
