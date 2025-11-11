/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { InstantiationType, registerSingleton } from '../../../../platform/instantiation/common/extensions.js';
import { IDatabaseService } from '../common/databaseService.js';
import { DatabaseService } from './databaseService.js';
import { IAIOrchestratorService } from '../common/aiOrchestratorService.js';
import { AIOrchestratorService } from './aiOrchestratorServiceImpl.js';
import { IWorkbenchContribution, IWorkbenchContributionsRegistry, Extensions as WorkbenchExtensions } from '../../../common/contributions.js';
import { LifecyclePhase } from '../../../services/lifecycle/common/lifecycle.js';
import { IWorkspaceContextService } from '../../../../platform/workspace/common/workspace.js';
import { ILogService } from '../../../../platform/log/common/log.js';
import { Registry } from '../../../../platform/registry/common/platform.js';

// Register Node.js services (use native modules)
registerSingleton(IDatabaseService, DatabaseService, InstantiationType.Delayed);
registerSingleton(IAIOrchestratorService, AIOrchestratorService, InstantiationType.Delayed);

// Database workspace initializer (Node.js only)
class DatabaseInitializer implements IWorkbenchContribution {
	constructor(
		@IDatabaseService private readonly databaseService: IDatabaseService,
		@IWorkspaceContextService private readonly workspaceService: IWorkspaceContextService,
		@ILogService private readonly logService: ILogService
	) {
		this.initializeDatabase();
	}

	private async initializeDatabase(): Promise<void> {
		// Get workspace path
		const workspace = this.workspaceService.getWorkspace();
		if (!workspace.folders || workspace.folders.length === 0) {
			this.logService.info('[DatabaseInitializer] No workspace folder found, skipping database initialization');
			return;
		}

		const workspacePath = workspace.folders[0].uri.fsPath;
		this.logService.info(`[DatabaseInitializer] Initializing database for workspace: ${workspacePath}`);

		try {
			await this.databaseService.initialize(workspacePath);
			this.logService.info('[DatabaseInitializer] Database initialized successfully');

			// Check if project exists for this workspace
			const existingProject = this.databaseService.getProjectByWorkspace(workspacePath);
			if (!existingProject) {
				this.logService.info('[DatabaseInitializer] No existing project found for workspace');
				// Note: Project will be created when user opens Mission Control or starts first task
			} else {
				this.logService.info(`[DatabaseInitializer] Found existing project: ${existingProject.name} (${existingProject.id})`);
			}
		} catch (error) {
			this.logService.error('[DatabaseInitializer] Error initializing database:', error);
		}
	}
}

// Register database initializer to run on workbench startup (desktop only)
Registry.as<IWorkbenchContributionsRegistry>(WorkbenchExtensions.Workbench)
	.registerWorkbenchContribution(DatabaseInitializer, LifecyclePhase.Restored);
