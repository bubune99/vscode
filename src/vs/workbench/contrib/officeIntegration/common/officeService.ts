/*---------------------------------------------------------------------------------------------
 *  Office Service Interface
 *  Location in VS Code fork: src/vs/workbench/contrib/office/common/officeService.ts
 *--------------------------------------------------------------------------------------------*/

import { createDecorator } from '../../../../platform/instantiation/common/instantiation.js';

export const IOfficeService = createDecorator<IOfficeService>('officeService');

export interface IOfficeService {
	/**
	 * Open an Office document in the embedded viewer
	 */
	openDocument(filePath: string, documentType: OfficeDocumentType): Promise<void>;

	/**
	 * Create a new Office document
	 */
	createDocument(documentType: OfficeDocumentType): Promise<void>;

	/**
	 * Close the currently open document
	 */
	closeDocument(): Promise<void>;

	/**
	 * Save the active document
	 */
	saveDocument(filePath?: string): Promise<void>;

	/**
	 * Execute an MCP tool command
	 */
	executeMCPTool(toolName: string, args: any): Promise<any>;

	/**
	 * Get list of available MCP tools
	 */
	getMCPTools(): Promise<MCPTool[]>;

	/**
	 * Check if Office is installed
	 */
	isOfficeInstalled(): Promise<boolean>;

	/**
	 * Get the active document path
	 */
	getActiveDocumentPath(): Promise<string | null>;
}

export enum OfficeDocumentType {
	Word = 'word',
	Excel = 'excel',
	PowerPoint = 'powerpoint'
}

export interface MCPTool {
	name: string;
	description: string;
	inputSchema: any;
}

export interface OfficeDocumentInfo {
	path: string;
	type: OfficeDocumentType;
	name: string;
	saved: boolean;
}
