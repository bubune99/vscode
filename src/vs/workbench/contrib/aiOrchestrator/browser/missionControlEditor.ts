/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { EditorInput } from '../../../common/editor/editorInput.js';
import { EditorPane } from '../../../browser/parts/editor/editorPane.js';
import { ITelemetryService } from '../../../../platform/telemetry/common/telemetry.js';
import { IThemeService } from '../../../../platform/theme/common/themeService.js';
import { IStorageService } from '../../../../platform/storage/common/storage.js';
import { Dimension } from '../../../../base/browser/dom.js';
import { CancellationToken } from '../../../../base/common/cancellation.js';
import { IEditorGroup } from '../../../services/editor/common/editorGroupsService.js';
import { IInstantiationService } from '../../../../platform/instantiation/common/instantiation.js';
import { MissionControlWebviewPanel } from './missionControlWebview.js';
import { DisposableStore } from '../../../../base/common/lifecycle.js';

/**
 * Editor Input for Mission Control
 */
export class MissionControlEditorInput extends EditorInput {
	static readonly ID = 'workbench.input.missionControl';

	constructor() {
		super();
	}

	override get typeId(): string {
		return MissionControlEditorInput.ID;
	}

	override getName(): string {
		return 'Mission Control';
	}

	override get resource(): undefined {
		// Mission Control doesn't have a backing file resource
		return undefined;
	}

	override matches(other: EditorInput): boolean {
		return other instanceof MissionControlEditorInput;
	}
}

/**
 * Editor Pane for Mission Control - Full window interface
 */
export class MissionControlEditor extends EditorPane {
	static readonly ID = 'workbench.editor.missionControl';

	private container!: HTMLElement;
	private webviewPanel: MissionControlWebviewPanel | undefined;
	private readonly disposables = new DisposableStore();

	constructor(
		group: IEditorGroup,
		@ITelemetryService telemetryService: ITelemetryService,
		@IThemeService themeService: IThemeService,
		@IStorageService storageService: IStorageService,
		@IInstantiationService private readonly instantiationService: IInstantiationService
	) {
		super(MissionControlEditor.ID, group, telemetryService, themeService, storageService);
	}

	protected createEditor(parent: HTMLElement): void {
		this.container = document.createElement('div');
		this.container.className = 'mission-control-editor';
		this.container.style.width = '100%';
		this.container.style.height = '100%';
		this.container.style.overflow = 'hidden';
		parent.appendChild(this.container);

		// Create the Mission Control webview
		this.webviewPanel = this.disposables.add(
			this.instantiationService.createInstance(
				MissionControlWebviewPanel,
				this.container
			)
		);
	}

	override async setInput(input: MissionControlEditorInput, options: any, context: any, token: CancellationToken): Promise<void> {
		await super.setInput(input, options, context, token);
		// Webview is already loaded in createEditor
	}

	override layout(dimension: Dimension): void {
		// The webview automatically resizes with its container
		// Note: Don't call super.layout() as it's abstract in base class
	}

	override focus(): void {
		super.focus();
		this.webviewPanel?.focus();
	}

	override dispose(): void {
		this.disposables.dispose();
		super.dispose();
	}
}
