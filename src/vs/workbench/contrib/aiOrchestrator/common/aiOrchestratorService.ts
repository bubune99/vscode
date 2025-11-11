/*---------------------------------------------------------------------------------------------
 *  AI Orchestrator Service Interface - Refactored for Chat + Task Delegation
 *  Location in VS Code fork: src/vs/workbench/contrib/aiOrchestrator/common/aiOrchestratorService.ts
 *--------------------------------------------------------------------------------------------*/

import { CancellationToken } from '../../../../base/common/cancellation.js';
import { Event } from '../../../../base/common/event.js';
import { URI } from '../../../../base/common/uri.js';
import { createDecorator } from '../../../../platform/instantiation/common/instantiation.js';
import { IChatResponsePart } from '../../chat/common/languageModels.js';

export const IAIOrchestratorService = createDecorator<IAIOrchestratorService>('aiOrchestratorService');

/**
 * AI Orchestrator Service
 * Main entry point for AI agent orchestration.
 * Analyzes user requests, creates task plans, and delegates to specialist agents.
 */
export interface IAIOrchestratorService {

	/**
	 * Event fired when tasks change (created, updated, completed)
	 */
	readonly onDidChangeTasks: Event<ITask>;

	/**
	 * Get or create a project for the current workspace
	 */
	getOrCreateProject(context: IProjectContext): Promise<string>;

	/**
	 * Plan tasks from a user request
	 * Analyzes the request and creates a structured task plan with agent delegation
	 */
	planTasks(request: string, context: IProjectContext, token: CancellationToken): Promise<ITaskPlan>;

	/**
	 * Execute a task by delegating to the appropriate specialist agent
	 */
	executeTask(task: ITask, token: CancellationToken): Promise<AsyncIterable<IChatResponsePart>>;

	/**
	 * Get all tasks for the current workspace
	 */
	getAllTasks(): Promise<ITask[]>;

	/**
	 * Get a specific task by ID
	 */
	getTask(taskId: string): Promise<ITask | undefined>;

	/**
	 * Cancel a running task
	 */
	cancelTask(taskId: string): Promise<void>;

	/**
	 * Delete a task
	 */
	deleteTask(taskId: string): Promise<void>;

	/**
	 * Get available specialist agents
	 */
	getAvailableAgents(): IAgentInfo[];

	/**
	 * Scan an existing project to detect and update tech stack
	 * Useful for onboarding existing projects into Mission Control
	 */
	scanExistingProject(workspacePath: string): Promise<{ techStack: string[]; description: string }>;
}

/**
 * Specialist agent types
 */
export type AgentType = 'v0' | 'claude' | 'gemini' | 'gpt';

/**
 * Agent information
 */
export interface IAgentInfo {
	readonly id: AgentType;
	readonly name: string;
	readonly description: string;
	readonly capabilities: string[];
	readonly modelFamily: string;
	readonly vendor: string;
}

/**
 * Task plan created by Orchestrator
 */
export interface ITaskPlan {
	/** Analysis of the user request */
	readonly analysis: string;

	/** Structured tasks to execute */
	readonly tasks: ITask[];

	/** Estimated time to complete (minutes) */
	readonly estimatedDuration: number;
}

/**
 * Individual task to be executed by a specialist agent
 */
export interface ITask {
	/** Unique task ID */
	readonly id: string;

	/** Which agent should execute this */
	readonly agent: AgentType;

	/** Human-readable description */
	readonly description: string;

	/** Detailed instructions for the agent */
	readonly instructions: string;

	/** Task priority (1 = highest) */
	readonly priority: number;

	/** Task IDs this depends on (must complete first) */
	readonly dependencies: string[];

	/** Current status */
	status: TaskStatus;

	/** Progress percentage (0-100) */
	progress: number;

	/** Files this task will modify */
	readonly targetFiles: URI[];

	/** Project context for this task */
	readonly context: IProjectContext;

	/** When task was created */
	readonly createdAt: Date;

	/** When task was last updated */
	updatedAt: Date;

	/** When task completed */
	completedAt?: Date;

	/** Error if task failed */
	error?: string;

	/** Logs from task execution */
	logs: ITaskLog[];

	/** Checkpoint ID before task execution */
	checkpointId?: string;
}

/**
 * Task status
 */
export type TaskStatus = 'pending' | 'in_progress' | 'completed' | 'failed' | 'cancelled';

/**
 * Task execution log entry
 */
export interface ITaskLog {
	readonly timestamp: Date;
	readonly level: 'info' | 'success' | 'warning' | 'error';
	readonly message: string;
	readonly details?: any;
}

/**
 * Project context for AI agents
 * Provided by Memory Agent
 */
export interface IProjectContext {
	/** Current workspace URI */
	readonly workspace: URI;

	/** Recently modified files */
	readonly recentFiles: URI[];

	/** Currently open files */
	readonly openFiles: URI[];

	/** Active file (if any) */
	readonly activeFile?: URI;

	/** Current text selection (if any) */
	readonly selection?: {
		readonly file: URI;
		readonly text: string;
		readonly range: { start: number; end: number };
	};

	/** Memory Agent context (optional, from PostgreSQL) */
	readonly memoryContext?: IMemoryContext;
}

/**
 * Memory Agent context from PostgreSQL database
 * Based on 5W+H framework
 */
export interface IMemoryContext {
	/** WHERE: Project structure, file locations */
	projectStructure?: any;

	/** WHAT: Modules, components, relationships */
	modules?: any;

	/** HOW: Implementation patterns, code style */
	implementations?: any;

	/** WHY: Design decisions, architectural choices */
	decisions?: any;

	/** WHO: Ownership, responsibilities */
	ownership?: any;

	/** WHEN: Timeline, history */
	timeline?: any;
}

/**
 * Agent model mapping
 * Maps agent types to VS Code language model selectors
 */
export const AGENT_MODEL_MAPPING: Record<AgentType, { vendor: string; family: string }> = {
	'v0': { vendor: 'vercel', family: 'v0' },
	'claude': { vendor: 'anthropic', family: 'claude' },
	'gemini': { vendor: 'google', family: 'gemini' },
	'gpt': { vendor: 'openai', family: 'gpt' }
};

/**
 * Agent capabilities
 */
export const AGENT_CAPABILITIES: Record<AgentType, IAgentInfo> = {
	'v0': {
		id: 'v0',
		name: 'v0',
		description: 'UI component generation specialist',
		capabilities: ['UI generation', 'React components', 'Tailwind CSS', 'shadcn/ui'],
		modelFamily: 'v0',
		vendor: 'vercel'
	},
	'claude': {
		id: 'claude',
		name: 'Claude',
		description: 'Code writing and refactoring specialist',
		capabilities: ['Code generation', 'Refactoring', 'Bug fixing', 'Documentation'],
		modelFamily: 'claude',
		vendor: 'anthropic'
	},
	'gemini': {
		id: 'gemini',
		name: 'Gemini',
		description: 'Multimodal analysis specialist',
		capabilities: ['Image analysis', 'Code + UI', 'Complex reasoning', 'Long context'],
		modelFamily: 'gemini',
		vendor: 'google'
	},
	'gpt': {
		id: 'gpt',
		name: 'GPT',
		description: 'General-purpose AI assistant',
		capabilities: ['General coding', 'Explanations', 'Planning', 'Research'],
		modelFamily: 'gpt',
		vendor: 'openai'
	}
};
