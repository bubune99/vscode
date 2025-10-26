/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { createDecorator } from '../../../../platform/instantiation/common/instantiation.js';

export const IDatabaseService = createDecorator<IDatabaseService>('databaseService');

// Type definitions matching the database schema
export type ProjectStatus = 'planning' | 'approved' | 'in_progress' | 'paused' | 'completed' | 'cancelled';
export type ExecutionMode = 'fully_autonomous' | 'semi_autonomous' | 'hands_on' | 'parallel';
export type ConversationType = 'planning' | 'execution' | 'review' | 'pivot' | 'general';
export type ChatRole = 'user' | 'assistant' | 'orchestrator' | 'system';
export type AgentType = 'v0' | 'claude' | 'gemini' | 'gpt' | 'orchestrator';
export type TaskStatus = 'todo' | 'in_progress' | 'blocked' | 'review' | 'done' | 'skipped';
export type TaskType = 'setup' | 'implementation' | 'testing' | 'documentation' | 'integration' | 'bug_fix' | 'refactoring';

export interface IProject {
	id: string;
	name: string;
	description: string;
	workspace_path: string;
	tech_stack: string; // JSON string
	execution_mode: ExecutionMode;
	status: ProjectStatus;
	blueprint_version: number;
	created_at: string;
	approved_at: string | null;
	started_at: string | null;
	completed_at: string | null;
	metadata: string; // JSON string
}

export interface IProjectCreateData {
	name: string;
	description: string;
	workspace_path: string;
	tech_stack?: string[];
	execution_mode?: ExecutionMode;
	metadata?: any;
}

export interface IConversation {
	id: string;
	project_id: string;
	task_id: string | null;
	conversation_type: ConversationType;
	title: string;
	active_agent: AgentType | null;
	created_at: string;
	last_message_at: string | null;
	metadata: string; // JSON string
}

export interface IConversationCreateData {
	project_id: string;
	task_id?: string | null;
	conversation_type: ConversationType;
	title: string;
	active_agent?: AgentType | null;
	metadata?: any;
}

export interface IMessage {
	id: string;
	conversation_id: string;
	agent_type: AgentType | null;
	role: ChatRole;
	content: string;
	model_used: string | null;
	tokens_input: number | null;
	tokens_output: number | null;
	created_at: string;
	parent_message_id: string | null;
	metadata: string; // JSON string
}

export interface IMessageCreateData {
	conversation_id: string;
	agent_type?: AgentType | null;
	role: ChatRole;
	content: string;
	model_used?: string | null;
	tokens_input?: number | null;
	tokens_output?: number | null;
	parent_message_id?: string | null;
	metadata?: any;
}

export interface ITask {
	id: string;
	project_id: string;
	feature_id: string;
	parent_task_id: string | null;
	blueprint_version: number;
	task_number: string;
	title: string;
	description: string;
	task_type: TaskType;
	assigned_agent: AgentType;
	status: TaskStatus;
	priority: number;
	estimated_time_minutes: number | null;
	actual_time_minutes: number | null;
	success_criteria: string; // JSON string
	context_for_agent: string; // JSON string
	created_at: string;
	assigned_at: string | null;
	started_at: string | null;
	completed_at: string | null;
	validated_at: string | null;
	metadata: string; // JSON string
}

export interface ITaskCreateData {
	project_id: string;
	feature_id: string;
	parent_task_id?: string | null;
	blueprint_version: number;
	task_number: string;
	title: string;
	description: string;
	task_type: TaskType;
	assigned_agent: AgentType;
	priority?: number;
	estimated_time_minutes?: number | null;
	success_criteria?: string[] | string;
	context_for_agent?: any;
	metadata?: any;
}

/**
 * Database service interface
 */
export interface IDatabaseService {
	readonly _serviceBrand: undefined;

	/**
	 * Check if database is initialized
	 */
	isInitialized(): boolean;

	/**
	 * Initialize the database
	 */
	initialize(workspacePath: string): Promise<void>;

	/**
	 * Close the database connection
	 */
	close(): void;

	/**
	 * Get the underlying database instance (for advanced queries)
	 */
	getDatabase(): any | null;

	// Project operations
	createProject(data: IProjectCreateData): IProject;
	getProject(id: string): IProject | null;
	getProjectByWorkspace(workspacePath: string): IProject | null;
	updateProjectStatus(id: string, status: ProjectStatus): void;
	getAllProjects(): IProject[];

	// Conversation operations
	createConversation(data: IConversationCreateData): IConversation;
	getConversation(id: string): IConversation | null;
	getProjectConversations(projectId: string): IConversation[];
	updateConversationLastMessage(id: string, timestamp: string): void;

	// Message operations
	createMessage(data: IMessageCreateData): IMessage;
	getConversationMessages(conversationId: string, limit?: number): IMessage[];
	getLatestMessages(conversationId: string, count: number): IMessage[];

	// Task operations
	createTask(data: ITaskCreateData): ITask;
	getTask(id: string): ITask | null;
	updateTaskStatus(id: string, status: TaskStatus): void;
	getFeatureTasks(featureId: string): ITask[];
	getTasksByAgent(agentType: string): ITask[];
}
