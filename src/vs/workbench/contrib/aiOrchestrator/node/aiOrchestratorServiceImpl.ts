/*---------------------------------------------------------------------------------------------
 *  AI Orchestrator Service Implementation - Refactored for Direct LLM Integration
 *  Location in VS Code fork: src/vs/workbench/contrib/aiOrchestrator/node/aiOrchestratorServiceImpl.ts
 *--------------------------------------------------------------------------------------------*/

import { Emitter } from '../../../../base/common/event.js';
import { Disposable } from '../../../../base/common/lifecycle.js';
import { generateUuid } from '../../../../base/common/uuid.js';
import { CancellationToken } from '../../../../base/common/cancellation.js';
import { ILogService } from '../../../../platform/log/common/log.js';
import {
	IAIOrchestratorService,
	ITask,
	ITaskPlan,
	IProjectContext,
	IAgentInfo,
	AgentType,
	TaskStatus,
	AGENT_MODEL_MAPPING,
	AGENT_CAPABILITIES,
	ITaskLog
} from '../common/aiOrchestratorService.js';
import { ILanguageModelsService, IChatMessage, IChatResponsePart, ChatMessageRole } from '../../chat/common/languageModels.js';
import { ExtensionIdentifier } from '../../../../platform/extensions/common/extensions.js';

export class AIOrchestratorService extends Disposable implements IAIOrchestratorService {

	private readonly _onDidChangeTasks = this._register(new Emitter<ITask>());
	readonly onDidChangeTasks = this._onDidChangeTasks.event;

	private tasks: Map<string, ITask> = new Map();

	constructor(
		@ILanguageModelsService private readonly languageModelsService: ILanguageModelsService,
		@ILogService private readonly logService: ILogService
	) {
		super();
		this.logService.info('[AIOrchestratorService] Service initialized');
	}

	/**
	 * Plan tasks from user request using Orchestrator agent
	 */
	async planTasks(request: string, context: IProjectContext, token: CancellationToken): Promise<ITaskPlan> {
		this.logService.info('[AIOrchestratorService] Planning tasks for request:', request);

		try {
			// Use GPT-4 as the Orchestrator meta-agent for planning
			const orchestratorModel = await this.selectModel('gpt', token);
			if (!orchestratorModel) {
				throw new Error('Orchestrator model (GPT) not available');
			}

			// Build planning prompt
			const planningPrompt = this.buildPlanningPrompt(request, context);

			const messages: IChatMessage[] = [
				{
					role: ChatMessageRole.System,
					content: [{ type: 'text', value: planningPrompt.systemPrompt }]
				},
				{
					role: ChatMessageRole.User,
					content: [{ type: 'text', value: planningPrompt.userPrompt }]
				}
			];

			// Get plan from Orchestrator
			const response = await orchestratorModel.sendChatRequest(messages, undefined as any, {}, token);

			// Parse response
			let planText = '';
			for await (const part of response.stream) {
				if (Array.isArray(part)) {
					for (const p of part) {
						if (p.type === 'text') {
							planText += p.value;
						}
					}
				} else if (part.type === 'text') {
					planText += part.value;
				}
			}

			// Parse the plan (simple JSON extraction for now)
			const plan = this.parsePlan(planText, context);

			// Create tasks in our internal store
			for (const task of plan.tasks) {
				this.tasks.set(task.id, task);
				this._onDidChangeTasks.fire(task);
			}

			this.logService.info(`[AIOrchestratorService] Created ${plan.tasks.length} tasks`);
			return plan;

		} catch (error) {
			this.logService.error('[AIOrchestratorService] Error planning tasks:', error);
			throw error;
		}
	}

	/**
	 * Execute a task by delegating to specialist agent
	 */
	async executeTask(task: ITask, token: CancellationToken): Promise<AsyncIterable<IChatResponsePart>> {
		this.logService.info(`[AIOrchestratorService] Executing task ${task.id} with agent ${task.agent}`);

		// Update task status
		task.status = 'in_progress';
		task.updatedAt = new Date();
		this.addTaskLog(task, 'info', `Starting execution with ${task.agent} agent`);
		this._onDidChangeTasks.fire(task);

		try {
			// Select the specialist model
			const model = await this.selectModel(task.agent, token);
			if (!model) {
				throw new Error(`Agent ${task.agent} model not available`);
			}

			// Build agent prompt
			const messages = this.buildAgentPrompt(task);

			// Execute task
			const response = await model.sendChatRequest(messages, undefined as any, {}, token);

			// Flatten stream to AsyncIterable<IChatResponsePart>
			return this.flattenStream(response.stream);

		} catch (error) {
			task.status = 'failed';
			task.error = String(error);
			task.updatedAt = new Date();
			this.addTaskLog(task, 'error', `Task failed: ${error}`);
			this._onDidChangeTasks.fire(task);
			throw error;
		}
	}

	/**
	 * Get all tasks
	 */
	async getAllTasks(): Promise<ITask[]> {
		return Array.from(this.tasks.values());
	}

	/**
	 * Get specific task
	 */
	async getTask(taskId: string): Promise<ITask | undefined> {
		return this.tasks.get(taskId);
	}

	/**
	 * Cancel a running task
	 */
	async cancelTask(taskId: string): Promise<void> {
		const task = this.tasks.get(taskId);
		if (task) {
			task.status = 'cancelled';
			task.updatedAt = new Date();
			this.addTaskLog(task, 'info', 'Task cancelled by user');
			this._onDidChangeTasks.fire(task);
		}
	}

	/**
	 * Delete a task
	 */
	async deleteTask(taskId: string): Promise<void> {
		this.tasks.delete(taskId);
		this.logService.info(`[AIOrchestratorService] Deleted task ${taskId}`);
	}

	/**
	 * Get available agents
	 */
	getAvailableAgents(): IAgentInfo[] {
		return Object.values(AGENT_CAPABILITIES);
	}

	// =========================================================================
	// Private Helper Methods
	// =========================================================================

	/**
	 * Select language model for an agent
	 */
	private async selectModel(agent: AgentType, token: CancellationToken) {
		const mapping = AGENT_MODEL_MAPPING[agent];
		const models = await this.languageModelsService.selectLanguageModels({
			vendor: mapping.vendor,
			family: mapping.family
		});

		if (models.length === 0) {
			this.logService.warn(`[AIOrchestratorService] No model found for ${agent}`);
			return undefined;
		}

		const modelId = models[0];
		const from = new ExtensionIdentifier('vscode.ai-orchestrator');
		return {
			sendChatRequest: async (messages: IChatMessage[], _from: any, options: any, token: CancellationToken) => {
				return this.languageModelsService.sendChatRequest(modelId, from, messages, options, token);
			}
		};
	}

	/**
	 * Build planning prompt for Orchestrator
	 */
	private buildPlanningPrompt(request: string, context: IProjectContext) {
		const systemPrompt = `You are an AI Orchestrator that plans and delegates tasks to specialist AI agents.

Available agents:
- v0: UI component generation (React, Tailwind, shadcn/ui)
- claude: Code writing, refactoring, bug fixing
- gemini: Multimodal analysis, complex reasoning
- gpt: General-purpose coding assistance

Analyze the user's request and create a structured task plan.
Output JSON format:
{
  "analysis": "Brief analysis of what needs to be done",
  "tasks": [
    {
      "agent": "v0" | "claude" | "gemini" | "gpt",
      "description": "What this task does",
      "instructions": "Detailed instructions for the agent",
      "priority": 1,
      "dependencies": [],
      "targetFiles": []
    }
  ],
  "estimatedDuration": 15
}`;

		const contextInfo = `
Current workspace: ${context.workspace.path}
Open files: ${context.openFiles.map(f => f.path).join(', ')}
${context.activeFile ? `Active file: ${context.activeFile.path}` : ''}
${context.selection ? `Selection: ${context.selection.text.substring(0, 100)}...` : ''}
`.trim();

		const userPrompt = `${contextInfo}

User request: ${request}

Create a task plan:`;

		return { systemPrompt, userPrompt };
	}

	/**
	 * Parse plan from Orchestrator response
	 */
	private parsePlan(planText: string, context: IProjectContext): ITaskPlan {
		try {
			// Try to extract JSON from response
			const jsonMatch = planText.match(/\{[\s\S]*\}/);
			if (!jsonMatch) {
				throw new Error('No JSON found in plan');
			}

			const parsed = JSON.parse(jsonMatch[0]);

			// Convert to ITask objects
			const tasks: ITask[] = parsed.tasks.map((t: any, index: number) => ({
				id: generateUuid(),
				agent: t.agent,
				description: t.description,
				instructions: t.instructions,
				priority: t.priority || (index + 1),
				dependencies: t.dependencies || [],
				status: 'pending' as TaskStatus,
				progress: 0,
				targetFiles: (t.targetFiles || []).map((f: string) => context.workspace.with({ path: f })),
				context,
				createdAt: new Date(),
				updatedAt: new Date(),
				logs: []
			}));

			return {
				analysis: parsed.analysis,
				tasks,
				estimatedDuration: parsed.estimatedDuration || 10
			};

		} catch (error) {
			this.logService.error('[AIOrchestratorService] Error parsing plan:', error);
			// Fallback: create single task with original request
			return {
				analysis: 'Failed to parse plan, creating single task',
				tasks: [{
					id: generateUuid(),
					agent: 'gpt',
					description: 'Execute user request',
					instructions: planText,
					priority: 1,
					dependencies: [],
					status: 'pending',
					progress: 0,
					targetFiles: [],
					context,
					createdAt: new Date(),
					updatedAt: new Date(),
					logs: []
				}],
				estimatedDuration: 5
			};
		}
	}

	/**
	 * Build agent prompt for task execution
	 */
	private buildAgentPrompt(task: ITask): IChatMessage[] {
		const agentInfo = AGENT_CAPABILITIES[task.agent];

		const systemPrompt = `You are ${agentInfo.name}, a specialist AI agent.

Your capabilities:
${agentInfo.capabilities.map(c => `- ${c}`).join('\n')}

Execute the following task:`;

		return [
			{
				role: ChatMessageRole.System,
				content: [{ type: 'text', value: systemPrompt }]
			},
			{
				role: ChatMessageRole.User,
				content: [{ type: 'text', value: task.instructions }]
			}
		];
	}

	/**
	 * Flatten AsyncIterable<IChatResponsePart | IChatResponsePart[]> to AsyncIterable<IChatResponsePart>
	 */
	private async *flattenStream(stream: AsyncIterable<IChatResponsePart | IChatResponsePart[]>): AsyncIterable<IChatResponsePart> {
		for await (const item of stream) {
			if (Array.isArray(item)) {
				for (const part of item) {
					yield part;
				}
			} else {
				yield item;
			}
		}
	}

	/**
	 * Add log entry to task
	 */
	private addTaskLog(task: ITask, level: ITaskLog['level'], message: string, details?: any) {
		task.logs.push({
			timestamp: new Date(),
			level,
			message,
			details
		});
	}
}
