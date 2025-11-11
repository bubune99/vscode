/*---------------------------------------------------------------------------------------------
 *  Office Editor - Embeds native Office applications in VS Code
 *  Location in VS Code fork: src/vs/workbench/contrib/office/browser/officeEditor.ts
 *--------------------------------------------------------------------------------------------*/

import { EditorInput } from '../../../common/editor/editorInput.js';
import { EditorPane } from '../../../browser/parts/editor/editorPane.js';
import { ITelemetryService } from '../../../../platform/telemetry/common/telemetry.js';
import { IThemeService } from '../../../../platform/theme/common/themeService.js';
import { IStorageService } from '../../../../platform/storage/common/storage.js';
import { Dimension } from '../../../../base/browser/dom.js';
import { CancellationToken } from '../../../../base/common/cancellation.js';
import { IOfficeService, OfficeDocumentType } from '../common/officeService.js';
import { URI } from '../../../../base/common/uri.js';
import { IEditorGroup } from '../../../services/editor/common/editorGroupsService.js';

export class OfficeEditorInput extends EditorInput {
	static readonly ID = 'workbench.input.officeEditor';

	constructor(
		public readonly resource: URI,
		public readonly documentType: OfficeDocumentType,
		public readonly name: string
	) {
		super();
	}

	override get typeId(): string {
		return OfficeEditorInput.ID;
	}

	override getName(): string {
		return this.name;
	}

	override matches(other: EditorInput): boolean {
		if (other instanceof OfficeEditorInput) {
			return this.resource.toString() === other.resource.toString();
		}
		return false;
	}
}

export class OfficeEditor extends EditorPane {
	static readonly ID = 'workbench.editor.officeEditor';

	private container!: HTMLElement;
	private officeContainer!: HTMLElement;
	private hwndInterval: ReturnType<typeof setInterval> | null = null;
	private embeddedHwnd: number | null = null;

	constructor(
		group: IEditorGroup,
		@ITelemetryService telemetryService: ITelemetryService,
		@IThemeService themeService: IThemeService,
		@IStorageService storageService: IStorageService,
		@IOfficeService private readonly officeService: IOfficeService
	) {
		super(OfficeEditor.ID, group, telemetryService, themeService, storageService);
	}

	protected createEditor(parent: HTMLElement): void {
		this.container = document.createElement('div');
		this.container.className = 'office-editor';
		this.container.style.width = '100%';
		this.container.style.height = '100%';
		this.container.style.overflow = 'hidden';
		parent.appendChild(this.container);

		this.officeContainer = document.createElement('div');
		this.officeContainer.className = 'office-app-container';
		this.officeContainer.style.width = '100%';
		this.officeContainer.style.height = '100%';
		this.officeContainer.style.position = 'relative';
		this.container.appendChild(this.officeContainer);
	}

	override async setInput(input: OfficeEditorInput, options: any, context: any, token: CancellationToken): Promise<void> {
		await super.setInput(input, options, context, token);

		// Open Office document
		await this.officeService.openDocument(
			input.resource.fsPath,
			input.documentType
		);

		// Embed Office window
		this.embedOfficeWindow(input.documentType);
	}

	private async embedOfficeWindow(documentType: OfficeDocumentType): Promise<void> {
		// Poll for Office window to appear, then embed it
		let attempts = 0;
		this.hwndInterval = setInterval(() => {
			attempts++;
			if (attempts > 20) {
				clearInterval(this.hwndInterval!);
				return;
			}

			// Use PowerShell to find Office window and embed it
			this.findAndEmbedOfficeWindow(documentType);
		}, 500);
	}

	private findAndEmbedOfficeWindow(documentType: OfficeDocumentType): void {
		const { exec } = require('child_process');

		// Process name to search for
		let processName = '';
		switch (documentType) {
			case OfficeDocumentType.Word:
				processName = 'WINWORD';
				break;
			case OfficeDocumentType.Excel:
				processName = 'EXCEL';
				break;
			case OfficeDocumentType.PowerPoint:
				processName = 'POWERPNT';
				break;
		}

		// PowerShell script to find window and embed it
		const script = `
			Add-Type @"
				using System;
				using System.Runtime.InteropServices;
				public class Win32 {
					[DllImport("user32.dll")]
					public static extern IntPtr FindWindow(string lpClassName, string lpWindowName);

					[DllImport("user32.dll")]
					public static extern IntPtr SetParent(IntPtr hWndChild, IntPtr hWndNewParent);

					[DllImport("user32.dll")]
					public static extern bool MoveWindow(IntPtr hWnd, int X, int Y, int nWidth, int nHeight, bool bRepaint);

					[DllImport("user32.dll")]
					public static extern int SetWindowLong(IntPtr hWnd, int nIndex, int dwNewLong);

					[DllImport("user32.dll")]
					public static extern int GetWindowLong(IntPtr hWnd, int nIndex);

					[DllImport("user32.dll")]
					public static extern bool EnumWindows(EnumWindowsProc lpEnumFunc, IntPtr lParam);

					public delegate bool EnumWindowsProc(IntPtr hWnd, IntPtr lParam);
				}
"@

			# Find Office window
			$process = Get-Process -Name ${processName} -ErrorAction SilentlyContinue | Select-Object -First 1
			if ($process) {
				$hwnd = $process.MainWindowHandle
				Write-Output $hwnd
			}
		`;

		exec(`powershell -Command "${script.replace(/"/g, '\\"')}"`, (error: any, stdout: string) => {
			if (!error && stdout.trim()) {
				const hwnd = parseInt(stdout.trim());
				if (hwnd > 0) {
					clearInterval(this.hwndInterval!);
					this.embeddedHwnd = hwnd;
					this.embedWindowHandle(hwnd);
				}
			}
		});
	}

	private embedWindowHandle(hwnd: number): void {
		const { exec } = require('child_process');
		const { remote } = require('electron');

		// Get parent window handle from Electron
		const parentHwnd = remote.getCurrentWindow().getNativeWindowHandle().readInt32LE(0);

		// Get container dimensions
		const rect = this.officeContainer.getBoundingClientRect();
		const width = Math.floor(rect.width);
		const height = Math.floor(rect.height);

		const script = `
			Add-Type @"
				using System;
				using System.Runtime.InteropServices;
				public class Win32 {
					[DllImport("user32.dll")]
					public static extern IntPtr SetParent(IntPtr hWndChild, IntPtr hWndNewParent);

					[DllImport("user32.dll")]
					public static extern bool MoveWindow(IntPtr hWnd, int X, int Y, int nWidth, int nHeight, bool bRepaint);

					[DllImport("user32.dll")]
					public static extern int SetWindowLong(IntPtr hWnd, int nIndex, int dwNewLong);

					[DllImport("user32.dll")]
					public static extern int GetWindowLong(IntPtr hWnd, int nIndex);
				}
"@

			# Set parent window
			[Win32]::SetParent(${hwnd}, ${parentHwnd})

			# Remove window chrome (title bar, min/max/close buttons)
			$GWL_STYLE = -16
			$WS_CAPTION = 0x00C00000
			$WS_THICKFRAME = 0x00040000
			$WS_MINIMIZE = 0x20000000
			$WS_MAXIMIZE = 0x01000000
			$WS_SYSMENU = 0x00080000

			$style = [Win32]::GetWindowLong(${hwnd}, $GWL_STYLE)
			$newStyle = $style -band (-bnot ($WS_CAPTION -bor $WS_THICKFRAME -bor $WS_MINIMIZE -bor $WS_MAXIMIZE -bor $WS_SYSMENU))
			[Win32]::SetWindowLong(${hwnd}, $GWL_STYLE, $newStyle)

			# Resize and position window
			[Win32]::MoveWindow(${hwnd}, 0, 0, ${width}, ${height}, $true)

			Write-Output "SUCCESS"
		`;

		exec(`powershell -Command "${script.replace(/"/g, '\\"')}"`, (error: any, stdout: string) => {
			if (error || !stdout.includes('SUCCESS')) {
				console.error('Failed to embed Office window:', error);
			}
		});
	}

	override layout(dimension: Dimension): void {
		// Resize embedded Office window when container is resized
		if (this.embeddedHwnd) {
			const { exec } = require('child_process');
			const width = dimension.width;
			const height = dimension.height;

			const script = `
				Add-Type @"
					using System;
					using System.Runtime.InteropServices;
					public class Win32 {
						[DllImport("user32.dll")]
						public static extern bool MoveWindow(IntPtr hWnd, int X, int Y, int nWidth, int nHeight, bool bRepaint);
					}
"@
				[Win32]::MoveWindow(${this.embeddedHwnd}, 0, 0, ${width}, ${height}, $true)
			`;

			exec(`powershell -Command "${script.replace(/"/g, '\\"')}"`);
		}
	}

	override clearInput(): void {
		super.clearInput();

		if (this.hwndInterval) {
			clearInterval(this.hwndInterval);
			this.hwndInterval = null;
		}
	}

	override dispose(): void {
		super.dispose();

		if (this.hwndInterval) {
			clearInterval(this.hwndInterval);
		}
	}
}
