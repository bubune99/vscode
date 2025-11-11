/*---------------------------------------------------------------------------------------------
 *  Office Contribution - Registers Office editors and AI Assistant
 *  Location in VS Code fork: src/vs/workbench/contrib/office/browser/office.contribution.ts
 *--------------------------------------------------------------------------------------------*/

import { ThemeIcon } from '../../../../base/common/themables.js';
import { localize } from '../../../../nls.js';
import { Registry } from '../../../../platform/registry/common/platform.js';
import { SyncDescriptor } from '../../../../platform/instantiation/common/descriptors.js';
import { IOfficeService } from '../common/officeService.js';
import { OfficeEditor, OfficeEditorInput } from './officeEditor.js';
import { EditorExtensions, IEditorFactoryRegistry } from '../../../common/editor.js';
import { EditorPaneDescriptor, IEditorPaneRegistry } from '../../../browser/editor.js';
import { ViewContainerLocation, IViewContainersRegistry, Extensions, IViewsRegistry } from '../../../common/views.js';
import { ViewPaneContainer } from '../../../browser/parts/views/viewPaneContainer.js';
import { OfficeAssistantPanel } from './officeAssistantPanel.js';
import { CommandsRegistry } from '../../../../platform/commands/common/commands.js';
import { ServicesAccessor } from '../../../../platform/instantiation/common/instantiation.js';
import { IEditorService } from '../../../services/editor/common/editorService.js';
import { URI } from '../../../../base/common/uri.js';
import { OfficeDocumentType } from '../common/officeService.js';
import { registerWorkbenchContribution2, WorkbenchPhase } from '../../../common/contributions.js';
import { OfficeToolsContribution } from './officeTools.contribution.js';

// Note: IOfficeService is registered in node/office.node.contribution.ts
// It requires Node.js APIs (child_process for PowerShell and MCP server) and cannot be registered in the browser layer

// Register Office Tools for AI language models
registerWorkbenchContribution2(OfficeToolsContribution.ID, OfficeToolsContribution as any, WorkbenchPhase.Eventually);

// Register Office Editor
Registry.as<IEditorPaneRegistry>(EditorExtensions.EditorPane).registerEditorPane(
	EditorPaneDescriptor.create(
		OfficeEditor as any,
		OfficeEditor.ID,
		localize('officeEditor', "Office Editor")
	),
	[
		new SyncDescriptor(OfficeEditorInput)
	]
);

// Register Editor Factory
class OfficeEditorSerializer {
	canSerialize(): boolean {
		return true;
	}
	serialize(input: OfficeEditorInput): string {
		return JSON.stringify({
			resource: input.resource.toString(),
			documentType: input.documentType,
			name: input.name
		});
	}
	deserialize(instantiationService: any, serialized: string): OfficeEditorInput {
		const data = JSON.parse(serialized);
		return new OfficeEditorInput(
			URI.parse(data.resource),
			data.documentType,
			data.name
		);
	}
}

Registry.as<IEditorFactoryRegistry>(EditorExtensions.EditorFactory).registerEditorSerializer(
	OfficeEditorInput.ID,
	OfficeEditorSerializer
);

// Register Office AI Assistant View Container
const VIEW_CONTAINER = Registry.as<IViewContainersRegistry>(Extensions.ViewContainersRegistry)
	.registerViewContainer({
		id: 'workbench.view.officeAssistant',
		title: { value: localize('officeAssistant', "Office AI Assistant"), original: 'Office AI Assistant' },
		icon: ThemeIcon.fromId('book'),
		ctorDescriptor: new SyncDescriptor(
			ViewPaneContainer,
			['workbench.view.officeAssistant', { mergeViewWithContainerWhenSingleView: true }]
		),
		storageId: 'officeAssistantViewState',
		hideIfEmpty: false,
		order: 4,
	}, ViewContainerLocation.Sidebar);

// Register Office AI Assistant Panel
Registry.as<IViewsRegistry>(Extensions.ViewsRegistry).registerViews([{
	id: 'workbench.view.officeAssistantPanel',
	name: { value: localize('officeAssistantPanel', "AI Assistant"), original: 'AI Assistant' },
	containerIcon: ThemeIcon.fromId('robot'),
	ctorDescriptor: new SyncDescriptor(OfficeAssistantPanel),
	canToggleVisibility: true,
	canMoveView: true,
	weight: 100
}], VIEW_CONTAINER);

// Register Commands

// Open Word document
CommandsRegistry.registerCommand('office.openWord', async (accessor: ServicesAccessor, resource?: URI) => {
	const editorService = accessor.get(IEditorService);
	if (!resource) {
		return;
	}

	const input = new OfficeEditorInput(
		resource,
		OfficeDocumentType.Word,
		resource.path.split('/').pop() || 'Untitled'
	);

	await editorService.openEditor(input);
});

// Open Excel document
CommandsRegistry.registerCommand('office.openExcel', async (accessor: ServicesAccessor, resource?: URI) => {
	const editorService = accessor.get(IEditorService);
	if (!resource) {
		return;
	}

	const input = new OfficeEditorInput(
		resource,
		OfficeDocumentType.Excel,
		resource.path.split('/').pop() || 'Untitled'
	);

	await editorService.openEditor(input);
});

// Open PowerPoint document
CommandsRegistry.registerCommand('office.openPowerPoint', async (accessor: ServicesAccessor, resource?: URI) => {
	const editorService = accessor.get(IEditorService);
	if (!resource) {
		return;
	}

	const input = new OfficeEditorInput(
		resource,
		OfficeDocumentType.PowerPoint,
		resource.path.split('/').pop() || 'Untitled'
	);

	await editorService.openEditor(input);
});

// Create new Word document
CommandsRegistry.registerCommand('office.newWord', async (accessor: ServicesAccessor) => {
	const officeService = accessor.get(IOfficeService);
	await officeService.createDocument(OfficeDocumentType.Word);
});

// Create new Excel workbook
CommandsRegistry.registerCommand('office.newExcel', async (accessor: ServicesAccessor) => {
	const officeService = accessor.get(IOfficeService);
	await officeService.createDocument(OfficeDocumentType.Excel);
});

// Create new PowerPoint presentation
CommandsRegistry.registerCommand('office.newPowerPoint', async (accessor: ServicesAccessor) => {
	const officeService = accessor.get(IOfficeService);
	await officeService.createDocument(OfficeDocumentType.PowerPoint);
});

// Save active document
CommandsRegistry.registerCommand('office.save', async (accessor: ServicesAccessor) => {
	const officeService = accessor.get(IOfficeService);
	await officeService.saveDocument();
});

// Execute MCP tool
CommandsRegistry.registerCommand('office.executeMCPTool', async (accessor: ServicesAccessor, toolName: string, args: any) => {
	const officeService = accessor.get(IOfficeService);
	return await officeService.executeMCPTool(toolName, args);
});
