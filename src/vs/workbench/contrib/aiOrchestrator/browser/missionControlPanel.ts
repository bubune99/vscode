/*---------------------------------------------------------------------------------------------
 *  Mission Control Panel - ViewPane wrapper for Mission Control Webview
 *  Location: src/vs/workbench/contrib/aiOrchestrator/browser/missionControlPanel.ts
 *--------------------------------------------------------------------------------------------*/

import { DisposableStore } from '../../../../base/common/lifecycle.js';
import { ViewPane } from '../../../browser/parts/views/viewPane.js';
import { IViewletViewOptions } from '../../../browser/parts/views/viewsViewlet.js';
import { IKeybindingService } from '../../../../platform/keybinding/common/keybinding.js';
import { IContextMenuService } from '../../../../platform/contextview/browser/contextView.js';
import { IConfigurationService } from '../../../../platform/configuration/common/configuration.js';
import { IContextKeyService } from '../../../../platform/contextkey/common/contextkey.js';
import { IInstantiationService } from '../../../../platform/instantiation/common/instantiation.js';
import { IOpenerService } from '../../../../platform/opener/common/opener.js';
import { IThemeService } from '../../../../platform/theme/common/themeService.js';
import { IViewDescriptorService } from '../../../common/views.js';
import { IHoverService } from '../../../../platform/hover/browser/hover.js';
import { MissionControlWebviewPanel } from './missionControlWebview.js';

export class MissionControlPanel extends ViewPane {

	private readonly disposables = new DisposableStore();
	private webviewPanel: MissionControlWebviewPanel | undefined;

	constructor(
		options: IViewletViewOptions,
		@IKeybindingService keybindingService: IKeybindingService,
		@IContextMenuService contextMenuService: IContextMenuService,
		@IConfigurationService configurationService: IConfigurationService,
		@IContextKeyService contextKeyService: IContextKeyService,
		@IViewDescriptorService viewDescriptorService: IViewDescriptorService,
		@IInstantiationService override readonly instantiationService: IInstantiationService,
		@IOpenerService openerService: IOpenerService,
		@IThemeService themeService: IThemeService,
		@IHoverService hoverService: IHoverService
	) {
		super(options, keybindingService, contextMenuService, configurationService, contextKeyService, viewDescriptorService, instantiationService, openerService, themeService, hoverService);
	}

	protected override renderBody(container: HTMLElement): void {
		super.renderBody(container);

		container.classList.add('mission-control-panel');

		// Create the Mission Control webview
		// createInstance automatically injects services via DI
		this.webviewPanel = this.disposables.add(
			this.instantiationService.createInstance(
				MissionControlWebviewPanel,
				container
			)
		);
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
