/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { InstantiationType, registerSingleton } from '../../../../platform/instantiation/common/extensions.js';
import { IDatabaseService } from '../common/databaseService.js';
import { DatabaseService } from './databaseService.js';
import { IAIOrchestratorService } from '../common/aiOrchestratorService.js';
import { AIOrchestratorService } from './aiOrchestratorServiceImpl.js';

// Register Node.js services (use native modules)
registerSingleton(IDatabaseService, DatabaseService, InstantiationType.Delayed);
registerSingleton(IAIOrchestratorService, AIOrchestratorService, InstantiationType.Delayed);
