/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

/**
 * Office Tools Configuration
 * Provides granular control over which Office automation tools are enabled/disabled
 * Supports both individual tool toggling and bulk category toggling
 */

export interface IOfficeToolsConfig {
	// Global toggle
	enabled: boolean;

	// Application-level toggles
	word: {
		enabled: boolean;
		categories: IWordToolCategories;
	};
	excel: {
		enabled: boolean;
		categories: IExcelToolCategories;
	};
	powerpoint: {
		enabled: boolean;
		categories: IPowerPointToolCategories;
	};
	general: {
		enabled: boolean;
	};
}

// ==================== WORD TOOL CATEGORIES ====================

export interface IWordToolCategories {
	// Tier 1: Essential (20 tools)
	textManipulation: {
		enabled: boolean;
		tools: {
			appendText: boolean;
			replaceText: boolean;
			getSelection: boolean;
			insertTextAtPosition: boolean;
			deleteTextRange: boolean;
			getText: boolean;
			getTextRange: boolean;
			insertText: boolean;
			prependText: boolean;
			selectRange: boolean;
		};
	};
	formatting: {
		enabled: boolean;
		tools: {
			formatSelection: boolean;
			applyStyle: boolean;
			setFont: boolean;
			setParagraphFormat: boolean;
			applyHighlight: boolean;
			insertPageBreak: boolean;
			insertSectionBreak: boolean;
		};
	};
	documentStructure: {
		enabled: boolean;
		tools: {
			createTable: boolean;
			insertRow: boolean;
			insertColumn: boolean;
		};
	};

	// Tier 2: Advanced (35 tools)
	advancedText: {
		enabled: boolean;
		tools: {
			findText: boolean;
			findAll: boolean;
			insertAtBookmark: boolean;
			createBookmark: boolean;
			deleteBookmark: boolean;
			gotoPage: boolean;
			gotoLine: boolean;
			getWordCount: boolean;
			getCharacterCount: boolean;
			getPageCount: boolean;
			insertSymbol: boolean;
			insertField: boolean;
			updateFields: boolean;
			insertTOC: boolean;
			updateTOC: boolean;
		};
	};
	advancedFormatting: {
		enabled: boolean;
		tools: {
			applyBold: boolean;
			applyItalic: boolean;
			applyUnderline: boolean;
			applyStrikethrough: boolean;
			applySuperscript: boolean;
			applySubscript: boolean;
			setFontColor: boolean;
			setAlignment: boolean;
			setLineSpacing: boolean;
			setParagraphSpacing: boolean;
			setIndentation: boolean;
			setBullets: boolean;
			setNumbering: boolean;
			setListLevel: boolean;
			clearFormatting: boolean;
		};
	};
	graphics: {
		enabled: boolean;
		tools: {
			insertImage: boolean;
			resizeImage: boolean;
			insertShape: boolean;
			insertTextbox: boolean;
			insertHyperlink: boolean;
		};
	};
}

// ==================== EXCEL TOOL CATEGORIES ====================

export interface IExcelToolCategories {
	// Tier 1: Essential (20 tools)
	cellOperations: {
		enabled: boolean;
		tools: {
			writeCell: boolean;
			readRange: boolean;
			writeRange: boolean;
			clearRange: boolean;
			copyRange: boolean;
			pasteRange: boolean;
		};
	};
	formatting: {
		enabled: boolean;
		tools: {
			setCellFormat: boolean;
			setFont: boolean;
			setCellColor: boolean;
			setBorder: boolean;
			mergeCells: boolean;
			setColumnWidth: boolean;
			setRowHeight: boolean;
		};
	};
	worksheets: {
		enabled: boolean;
		tools: {
			getActiveSheet: boolean;
			createSheet: boolean;
			deleteSheet: boolean;
			renameSheet: boolean;
		};
	};
	charts: {
		enabled: boolean;
		tools: {
			createChart: boolean;
			setChartType: boolean;
			setChartTitle: boolean;
		};
	};

	// Tier 2: Advanced (40 tools)
	advancedRangeOps: {
		enabled: boolean;
		tools: {
			findValue: boolean;
			replaceValue: boolean;
			sortRange: boolean;
			filterRange: boolean;
			autoFilter: boolean;
			clearFilter: boolean;
			unmerge: boolean;
			getUsedRange: boolean;
			getCurrentRegion: boolean;
			transposeRange: boolean;
			fillDown: boolean;
			fillRight: boolean;
			fillSeries: boolean;
			removeDuplicates: boolean;
			dataValidation: boolean;
		};
	};
	formulas: {
		enabled: boolean;
		tools: {
			insertFormula: boolean;
			getFormula: boolean;
			calculateNow: boolean;
			setCalculationMode: boolean;
			sumRange: boolean;
			averageRange: boolean;
			countRange: boolean;
			maxRange: boolean;
			minRange: boolean;
			vlookup: boolean;
			hlookup: boolean;
			indexMatch: boolean;
			ifFormula: boolean;
			sumif: boolean;
			countif: boolean;
		};
	};
	advancedCharts: {
		enabled: boolean;
		tools: {
			setAxisTitle: boolean;
			formatChartSeries: boolean;
			addChartSeries: boolean;
			setChartColors: boolean;
			addTrendline: boolean;
			setChartLegend: boolean;
			setDataLabels: boolean;
			createSparkline: boolean;
			deleteChart: boolean;
			resizeChart: boolean;
		};
	};
}

// ==================== POWERPOINT TOOL CATEGORIES ====================

export interface IPowerPointToolCategories {
	// Tier 1: Essential (15 tools)
	slideManagement: {
		enabled: boolean;
		tools: {
			addSlide: boolean;
			deleteSlide: boolean;
			duplicateSlide: boolean;
			moveSlide: boolean;
		};
	};
	content: {
		enabled: boolean;
		tools: {
			addText: boolean;
			addTextBox: boolean;
			addTitle: boolean;
			insertImage: boolean;
			addShape: boolean;
		};
	};
	formatting: {
		enabled: boolean;
		tools: {
			setTextFormat: boolean;
			setShapeFill: boolean;
			setSlideLayout: boolean;
			applyTheme: boolean;
			setBackground: boolean;
			addTransition: boolean;
		};
	};

	// Tier 2: Advanced (25 tools)
	advancedShapes: {
		enabled: boolean;
		tools: {
			addLine: boolean;
			addConnector: boolean;
			addArrow: boolean;
			resizeShape: boolean;
			moveShape: boolean;
			rotateShape: boolean;
			flipShape: boolean;
			duplicateShape: boolean;
			setShapeOutline: boolean;
			setShapeEffects: boolean;
			groupShapes: boolean;
			ungroupShapes: boolean;
			alignShapes: boolean;
			distributeShapes: boolean;
			bringToFront: boolean;
		};
	};
	animations: {
		enabled: boolean;
		tools: {
			addAnimation: boolean;
			setAnimationEffect: boolean;
			setAnimationDuration: boolean;
			setAnimationDelay: boolean;
			setAnimationTrigger: boolean;
			reorderAnimations: boolean;
			removeAnimation: boolean;
			setMotionPath: boolean;
			previewAnimation: boolean;
			setTransitionSpeed: boolean;
		};
	};
}

// ==================== DEFAULT CONFIGURATION ====================

export const DEFAULT_OFFICE_TOOLS_CONFIG: IOfficeToolsConfig = {
	enabled: true,

	word: {
		enabled: true,
		categories: {
			// Tier 1: Essential - All enabled by default
			textManipulation: {
				enabled: true,
				tools: {
					appendText: true,
					replaceText: true,
					getSelection: true,
					insertTextAtPosition: true,
					deleteTextRange: true,
					getText: true,
					getTextRange: true,
					insertText: true,
					prependText: true,
					selectRange: true,
				},
			},
			formatting: {
				enabled: true,
				tools: {
					formatSelection: true,
					applyStyle: true,
					setFont: true,
					setParagraphFormat: true,
					applyHighlight: true,
					insertPageBreak: true,
					insertSectionBreak: true,
				},
			},
			documentStructure: {
				enabled: true,
				tools: {
					createTable: true,
					insertRow: true,
					insertColumn: true,
				},
			},

			// Tier 2: Advanced - Enabled by default, can be disabled for performance
			advancedText: {
				enabled: true,
				tools: {
					findText: true,
					findAll: true,
					insertAtBookmark: true,
					createBookmark: true,
					deleteBookmark: true,
					gotoPage: true,
					gotoLine: true,
					getWordCount: true,
					getCharacterCount: true,
					getPageCount: true,
					insertSymbol: true,
					insertField: true,
					updateFields: true,
					insertTOC: true,
					updateTOC: true,
				},
			},
			advancedFormatting: {
				enabled: true,
				tools: {
					applyBold: true,
					applyItalic: true,
					applyUnderline: true,
					applyStrikethrough: true,
					applySuperscript: true,
					applySubscript: true,
					setFontColor: true,
					setAlignment: true,
					setLineSpacing: true,
					setParagraphSpacing: true,
					setIndentation: true,
					setBullets: true,
					setNumbering: true,
					setListLevel: true,
					clearFormatting: true,
				},
			},
			graphics: {
				enabled: true,
				tools: {
					insertImage: true,
					resizeImage: true,
					insertShape: true,
					insertTextbox: true,
					insertHyperlink: true,
				},
			},
		},
	},

	excel: {
		enabled: true,
		categories: {
			// Tier 1: Essential
			cellOperations: {
				enabled: true,
				tools: {
					writeCell: true,
					readRange: true,
					writeRange: true,
					clearRange: true,
					copyRange: true,
					pasteRange: true,
				},
			},
			formatting: {
				enabled: true,
				tools: {
					setCellFormat: true,
					setFont: true,
					setCellColor: true,
					setBorder: true,
					mergeCells: true,
					setColumnWidth: true,
					setRowHeight: true,
				},
			},
			worksheets: {
				enabled: true,
				tools: {
					getActiveSheet: true,
					createSheet: true,
					deleteSheet: true,
					renameSheet: true,
				},
			},
			charts: {
				enabled: true,
				tools: {
					createChart: true,
					setChartType: true,
					setChartTitle: true,
				},
			},

			// Tier 2: Advanced
			advancedRangeOps: {
				enabled: true,
				tools: {
					findValue: true,
					replaceValue: true,
					sortRange: true,
					filterRange: true,
					autoFilter: true,
					clearFilter: true,
					unmerge: true,
					getUsedRange: true,
					getCurrentRegion: true,
					transposeRange: true,
					fillDown: true,
					fillRight: true,
					fillSeries: true,
					removeDuplicates: true,
					dataValidation: true,
				},
			},
			formulas: {
				enabled: true,
				tools: {
					insertFormula: true,
					getFormula: true,
					calculateNow: true,
					setCalculationMode: true,
					sumRange: true,
					averageRange: true,
					countRange: true,
					maxRange: true,
					minRange: true,
					vlookup: true,
					hlookup: true,
					indexMatch: true,
					ifFormula: true,
					sumif: true,
					countif: true,
				},
			},
			advancedCharts: {
				enabled: true,
				tools: {
					setAxisTitle: true,
					formatChartSeries: true,
					addChartSeries: true,
					setChartColors: true,
					addTrendline: true,
					setChartLegend: true,
					setDataLabels: true,
					createSparkline: true,
					deleteChart: true,
					resizeChart: true,
				},
			},
		},
	},

	powerpoint: {
		enabled: true,
		categories: {
			// Tier 1: Essential
			slideManagement: {
				enabled: true,
				tools: {
					addSlide: true,
					deleteSlide: true,
					duplicateSlide: true,
					moveSlide: true,
				},
			},
			content: {
				enabled: true,
				tools: {
					addText: true,
					addTextBox: true,
					addTitle: true,
					insertImage: true,
					addShape: true,
				},
			},
			formatting: {
				enabled: true,
				tools: {
					setTextFormat: true,
					setShapeFill: true,
					setSlideLayout: true,
					applyTheme: true,
					setBackground: true,
					addTransition: true,
				},
			},

			// Tier 2: Advanced
			advancedShapes: {
				enabled: true,
				tools: {
					addLine: true,
					addConnector: true,
					addArrow: true,
					resizeShape: true,
					moveShape: true,
					rotateShape: true,
					flipShape: true,
					duplicateShape: true,
					setShapeOutline: true,
					setShapeEffects: true,
					groupShapes: true,
					ungroupShapes: true,
					alignShapes: true,
					distributeShapes: true,
					bringToFront: true,
				},
			},
			animations: {
				enabled: true,
				tools: {
					addAnimation: true,
					setAnimationEffect: true,
					setAnimationDuration: true,
					setAnimationDelay: true,
					setAnimationTrigger: true,
					reorderAnimations: true,
					removeAnimation: true,
					setMotionPath: true,
					previewAnimation: true,
					setTransitionSpeed: true,
				},
			},
		},
	},

	general: {
		enabled: true,
	},
};

/**
 * Utility functions for tool configuration
 */
export class OfficeToolsConfigUtil {
	/**
	 * Check if a specific tool is enabled
	 */
	static isToolEnabled(config: IOfficeToolsConfig, app: 'word' | 'excel' | 'powerpoint', category: string, tool: string): boolean {
		if (!config.enabled) {
			return false;
		}

		const appConfig = config[app];
		if (!appConfig || !appConfig.enabled) {
			return false;
		}

		const categoryConfig = (appConfig.categories as any)[category];
		if (!categoryConfig || !categoryConfig.enabled) {
			return false;
		}

		return categoryConfig.tools[tool] ?? false;
	}

	/**
	 * Enable/disable all tools in a category (bulk toggle)
	 */
	static toggleCategory(config: IOfficeToolsConfig, app: 'word' | 'excel' | 'powerpoint', category: string, enabled: boolean): void {
		const appConfig = config[app];
		if (!appConfig) {
			return;
		}

		const categoryConfig = (appConfig.categories as any)[category];
		if (!categoryConfig) {
			return;
		}

		categoryConfig.enabled = enabled;
	}

	/**
	 * Enable/disable all tools in an application (bulk toggle)
	 */
	static toggleApplication(config: IOfficeToolsConfig, app: 'word' | 'excel' | 'powerpoint', enabled: boolean): void {
		const appConfig = config[app];
		if (!appConfig) {
			return;
		}

		appConfig.enabled = enabled;
	}

	/**
	 * Get count of enabled tools
	 */
	static getEnabledToolsCount(config: IOfficeToolsConfig): { total: number; word: number; excel: number; powerpoint: number; general: number } {
		let wordCount = 0;
		let excelCount = 0;
		let pptCount = 0;
		let generalCount = config.general.enabled ? 5 : 0;

		// Count Word tools
		if (config.word.enabled) {
			Object.values(config.word.categories).forEach((category: any) => {
				if (category.enabled && category.tools) {
					wordCount += Object.values(category.tools).filter(Boolean).length;
				}
			});
		}

		// Count Excel tools
		if (config.excel.enabled) {
			Object.values(config.excel.categories).forEach((category: any) => {
				if (category.enabled && category.tools) {
					excelCount += Object.values(category.tools).filter(Boolean).length;
				}
			});
		}

		// Count PowerPoint tools
		if (config.powerpoint.enabled) {
			Object.values(config.powerpoint.categories).forEach((category: any) => {
				if (category.enabled && category.tools) {
					pptCount += Object.values(category.tools).filter(Boolean).length;
				}
			});
		}

		return {
			total: wordCount + excelCount + pptCount + generalCount,
			word: wordCount,
			excel: excelCount,
			powerpoint: pptCount,
			general: generalCount,
		};
	}
}
