/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import type { Database } from '@vscode/sqlite3';
import * as fs from 'fs';
import { randomUUID } from 'crypto';
import { join, dirname } from '../../../../base/common/path.js';
import { ILogService } from '../../../../platform/log/common/log.js';
import type {
	IDatabaseService,
	IProject,
	IProjectCreateData,
	IConversation,
	IConversationCreateData,
	IMessage,
	IMessageCreateData,
	ITask,
	ITaskCreateData,
	ProjectStatus,
	TaskStatus
} from '../common/databaseService.js';

/**
 * Database service implementation using @vscode/sqlite3
 */
export class DatabaseService implements IDatabaseService {
	readonly _serviceBrand: undefined;

	private db: Database | null = null;
	private dbPath: string | null = null;

	constructor(
		@ILogService private readonly logService: ILogService
	) {}

	isInitialized(): boolean {
		return this.db !== null;
	}

	async initialize(workspacePath: string): Promise<void> {
		// Database file location: <workspace>/.mission-control/database.sqlite
		const mcDir = join(workspacePath, '.mission-control');
		if (!fs.existsSync(mcDir)) {
			fs.mkdirSync(mcDir, { recursive: true });
		}

		this.dbPath = join(mcDir, 'database.sqlite');
		const isNewDatabase = !fs.existsSync(this.dbPath);

		this.logService.info(`[DatabaseService] Initializing database at: ${this.dbPath}`);

		// Import and connect to database
		await this.connect(this.dbPath);

		// Enable foreign keys
		await this.exec('PRAGMA foreign_keys = ON');

		// If new database, initialize schema
		if (isNewDatabase) {
			this.logService.info('[DatabaseService] New database detected, initializing schema...');
			await this.initializeSchema();
		}

		this.logService.info('[DatabaseService] Database initialized successfully');
	}

	private async connect(dbPath: string): Promise<void> {
		return new Promise((resolve, reject) => {
			import('@vscode/sqlite3').then(sqlite3 => {
				this.db = new sqlite3.default.Database(dbPath, (error: Error | null) => {
					if (error) {
						this.logService.error('[DatabaseService] Failed to connect to database:', error);
						return reject(error);
					}
					resolve();
				});
			}, reject);
		});
	}

	private async exec(sql: string): Promise<void> {
		if (!this.db) {
			throw new Error('Database not initialized');
		}
		return new Promise((resolve, reject) => {
			this.db!.exec(sql, (error: Error | null) => {
				if (error) {
					this.logService.error('[DatabaseService] exec error:', error);
					return reject(error);
				}
				resolve();
			});
		});
	}

	private async run(sql: string, ...params: any[]): Promise<void> {
		if (!this.db) {
			throw new Error('Database not initialized');
		}
		return new Promise((resolve, reject) => {
			this.db!.run(sql, ...params, function (error: Error | null) {
				if (error) {
					return reject(error);
				}
				resolve();
			});
		});
	}

	private async get<T = any>(sql: string, ...params: any[]): Promise<T | undefined> {
		if (!this.db) {
			throw new Error('Database not initialized');
		}
		return new Promise((resolve, reject) => {
			this.db!.get(sql, ...params, (error: Error | null, row: T) => {
				if (error) {
					return reject(error);
				}
				resolve(row);
			});
		});
	}

	private async all<T = any>(sql: string, ...params: any[]): Promise<T[]> {
		if (!this.db) {
			throw new Error('Database not initialized');
		}
		return new Promise((resolve, reject) => {
			this.db!.all(sql, ...params, (error: Error | null, rows: T[]) => {
				if (error) {
					return reject(error);
				}
				resolve(rows || []);
			});
		});
	}

	private async initializeSchema(): Promise<void> {
		if (!this.db) {
			throw new Error('Database not initialized');
		}

		// Read schema file - it should be in the database directory at project root
		// When running, we'll look for it relative to the workspace or in common locations
		const possiblePaths = [
			join(dirname(this.dbPath!), '..', 'database', 'mission-control-schema.sqlite.sql'),
			join(process.cwd(), 'database', 'mission-control-schema.sqlite.sql'),
		];

		let schemaPath: string | undefined;
		for (const path of possiblePaths) {
			if (fs.existsSync(path)) {
				schemaPath = path;
				break;
			}
		}

		if (!schemaPath) {
			throw new Error(`Schema file not found. Searched: ${possiblePaths.join(', ')}`);
		}

		const schemaSql = fs.readFileSync(schemaPath, 'utf-8');

		// Execute schema as a single statement
		await this.exec(schemaSql);

		this.logService.info('[DatabaseService] Schema initialized successfully');
	}

	close(): void {
		if (this.db) {
			this.db.close((error: Error | null) => {
				if (error) {
					this.logService.error('[DatabaseService] Error closing database:', error);
				}
			});
			this.db = null;
			this.logService.info('[DatabaseService] Database connection closed');
		}
	}

	getDatabase(): Database | null {
		return this.db;
	}

	// =========================================================================
	// PROJECT OPERATIONS
	// =========================================================================

	createProject(data: IProjectCreateData): IProject {
		const id = randomUUID();
		const tech_stack = JSON.stringify(data.tech_stack || []);
		const metadata = JSON.stringify(data.metadata || {});
		const execution_mode = data.execution_mode || 'semi_autonomous';

		// Note: We use a synchronous approach here since the interface expects sync return
		// This is acceptable because the DB is already initialized asynchronously
		if (!this.db) {
			throw new Error('Database not initialized');
		}

		const stmt = this.db.prepare(`
			INSERT INTO projects (id, name, description, workspace_path, tech_stack, execution_mode, metadata)
			VALUES (?, ?, ?, ?, ?, ?, ?)
		`);

		stmt.run(id, data.name, data.description, data.workspace_path, tech_stack, execution_mode, metadata);
		stmt.finalize();

		return this.getProject(id)!;
	}

	getProject(id: string): IProject | null {
		if (!this.db) {
			throw new Error('Database not initialized');
		}

		const stmt = this.db.prepare('SELECT * FROM projects WHERE id = ?');
		const row = stmt.get(id) as IProject | null;
		stmt.finalize();
		return row;
	}

	getProjectByWorkspace(workspacePath: string): IProject | null {
		if (!this.db) {
			throw new Error('Database not initialized');
		}

		const stmt = this.db.prepare('SELECT * FROM projects WHERE workspace_path = ?');
		const row = stmt.get(workspacePath) as IProject | null;
		stmt.finalize();
		return row;
	}

	updateProjectStatus(id: string, status: ProjectStatus): void {
		if (!this.db) {
			throw new Error('Database not initialized');
		}

		const stmt = this.db.prepare('UPDATE projects SET status = ? WHERE id = ?');
		stmt.run(status, id);
		stmt.finalize();
	}

	getAllProjects(): IProject[] {
		if (!this.db) {
			throw new Error('Database not initialized');
		}

		const stmt = this.db.prepare('SELECT * FROM projects ORDER BY created_at DESC');
		const rows = stmt.all() as IProject[];
		stmt.finalize();
		return rows;
	}

	// =========================================================================
	// CONVERSATION OPERATIONS
	// =========================================================================

	createConversation(data: IConversationCreateData): IConversation {
		if (!this.db) {
			throw new Error('Database not initialized');
		}

		const id = randomUUID();
		const metadata = JSON.stringify(data.metadata || {});

		const stmt = this.db.prepare(`
			INSERT INTO conversations (id, project_id, task_id, conversation_type, title, active_agent, metadata)
			VALUES (?, ?, ?, ?, ?, ?, ?)
		`);

		stmt.run(
			id,
			data.project_id,
			data.task_id || null,
			data.conversation_type,
			data.title,
			data.active_agent || null,
			metadata
		);
		stmt.finalize();

		return this.getConversation(id)!;
	}

	getConversation(id: string): IConversation | null {
		if (!this.db) {
			throw new Error('Database not initialized');
		}

		const stmt = this.db.prepare('SELECT * FROM conversations WHERE id = ?');
		const row = stmt.get(id) as IConversation | null;
		stmt.finalize();
		return row;
	}

	getProjectConversations(projectId: string): IConversation[] {
		if (!this.db) {
			throw new Error('Database not initialized');
		}

		const stmt = this.db.prepare('SELECT * FROM conversations WHERE project_id = ? ORDER BY created_at DESC');
		const rows = stmt.all(projectId) as IConversation[];
		stmt.finalize();
		return rows;
	}

	updateConversationLastMessage(id: string, timestamp: string): void {
		if (!this.db) {
			throw new Error('Database not initialized');
		}

		const stmt = this.db.prepare('UPDATE conversations SET last_message_at = ? WHERE id = ?');
		stmt.run(timestamp, id);
		stmt.finalize();
	}

	// =========================================================================
	// MESSAGE OPERATIONS
	// =========================================================================

	createMessage(data: IMessageCreateData): IMessage {
		if (!this.db) {
			throw new Error('Database not initialized');
		}

		const id = randomUUID();
		const metadata = JSON.stringify(data.metadata || {});
		const created_at = new Date().toISOString();

		const stmt = this.db.prepare(`
			INSERT INTO messages
			(id, conversation_id, agent_type, role, content, model_used, tokens_input, tokens_output, parent_message_id, metadata, created_at)
			VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
		`);

		stmt.run(
			id,
			data.conversation_id,
			data.agent_type || null,
			data.role,
			data.content,
			data.model_used || null,
			data.tokens_input || null,
			data.tokens_output || null,
			data.parent_message_id || null,
			metadata,
			created_at
		);
		stmt.finalize();

		// Update conversation's last_message_at
		this.updateConversationLastMessage(data.conversation_id, created_at);

		const stmt2 = this.db.prepare('SELECT * FROM messages WHERE id = ?');
		const msg = stmt2.get(id) as IMessage;
		stmt2.finalize();
		return msg;
	}

	getConversationMessages(conversationId: string, limit?: number): IMessage[] {
		if (!this.db) {
			throw new Error('Database not initialized');
		}

		const query = limit
			? 'SELECT * FROM messages WHERE conversation_id = ? ORDER BY created_at ASC LIMIT ?'
			: 'SELECT * FROM messages WHERE conversation_id = ? ORDER BY created_at ASC';

		const stmt = this.db.prepare(query);
		const result = limit ? stmt.all(conversationId, limit) : stmt.all(conversationId);
		stmt.finalize();

		return result as IMessage[];
	}

	getLatestMessages(conversationId: string, count: number): IMessage[] {
		if (!this.db) {
			throw new Error('Database not initialized');
		}

		const stmt = this.db.prepare(`
			SELECT * FROM messages
			WHERE conversation_id = ?
			ORDER BY created_at DESC
			LIMIT ?
		`);
		const messages = stmt.all(conversationId, count) as IMessage[];
		stmt.finalize();
		return messages.reverse(); // Return in chronological order
	}

	// =========================================================================
	// TASK OPERATIONS
	// =========================================================================

	createTask(data: ITaskCreateData): ITask {
		if (!this.db) {
			throw new Error('Database not initialized');
		}

		const id = randomUUID();
		const success_criteria = typeof data.success_criteria === 'string'
			? data.success_criteria
			: JSON.stringify(data.success_criteria || []);
		const context_for_agent = JSON.stringify(data.context_for_agent || {});
		const metadata = JSON.stringify(data.metadata || {});
		const priority = data.priority || 3;

		const stmt = this.db.prepare(`
			INSERT INTO tasks
			(id, project_id, feature_id, parent_task_id, blueprint_version, task_number, title, description,
			task_type, assigned_agent, priority, estimated_time_minutes, success_criteria, context_for_agent, metadata)
			VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
		`);

		stmt.run(
			id,
			data.project_id,
			data.feature_id,
			data.parent_task_id || null,
			data.blueprint_version,
			data.task_number,
			data.title,
			data.description,
			data.task_type,
			data.assigned_agent,
			priority,
			data.estimated_time_minutes || null,
			success_criteria,
			context_for_agent,
			metadata
		);
		stmt.finalize();

		return this.getTask(id)!;
	}

	getTask(id: string): ITask | null {
		if (!this.db) {
			throw new Error('Database not initialized');
		}

		const stmt = this.db.prepare('SELECT * FROM tasks WHERE id = ?');
		const row = stmt.get(id) as ITask | null;
		stmt.finalize();
		return row;
	}

	updateTaskStatus(id: string, status: TaskStatus): void {
		if (!this.db) {
			throw new Error('Database not initialized');
		}

		const stmt = this.db.prepare('UPDATE tasks SET status = ? WHERE id = ?');
		stmt.run(status, id);
		stmt.finalize();
	}

	getFeatureTasks(featureId: string): ITask[] {
		if (!this.db) {
			throw new Error('Database not initialized');
		}

		const stmt = this.db.prepare('SELECT * FROM tasks WHERE feature_id = ? ORDER BY task_number');
		const rows = stmt.all(featureId) as ITask[];
		stmt.finalize();
		return rows;
	}

	getTasksByAgent(agentType: string): ITask[] {
		if (!this.db) {
			throw new Error('Database not initialized');
		}

		const stmt = this.db.prepare('SELECT * FROM tasks WHERE assigned_agent = ? ORDER BY priority, created_at');
		const rows = stmt.all(agentType) as ITask[];
		stmt.finalize();
		return rows;
	}
}
