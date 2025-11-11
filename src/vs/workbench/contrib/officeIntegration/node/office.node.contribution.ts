/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { InstantiationType, registerSingleton } from '../../../../platform/instantiation/common/extensions.js';
import { IOfficeService } from '../common/officeService.js';
import { OfficeService } from './officeServiceImpl.js';

// Register Node.js-only Office Service (uses child_process for PowerShell and MCP server)
registerSingleton(IOfficeService, OfficeService, InstantiationType.Delayed);
