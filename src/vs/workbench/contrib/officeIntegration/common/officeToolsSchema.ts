/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

/**
 * Office Tools TypeScript Schema
 *
 * This file defines all 160 Office automation tools using TypeScript namespaces.
 * This approach reduces context usage from 32k tokens to ~1k tokens by leveraging
 * the model's existing knowledge of TypeScript and COM API patterns.
 *
 * Usage: Models can infer tool usage from TypeScript signatures alone, without
 * verbose descriptions explaining concepts they already understand.
 */

/**
 * Office Automation Tools
 * All tools follow pattern: Office.{App}.{method}({params})
 */
export namespace Office {

	// ==================== WORD DOCUMENT AUTOMATION ====================

	export namespace Word {

		// ========== Text Manipulation ==========

		/**
		 * Inserts text at a specific character position in the document.
		 */
		export declare function insertTextAtPosition(text: string, position: number): void;

		/**
		 * Inserts text at the current cursor position.
		 */
		export declare function insertText(text: string): void;

		/**
		 * Appends text to the end of the document.
		 */
		export declare function appendText(text: string, bold?: boolean, italic?: boolean): void;

		/**
		 * Inserts text at the beginning of the document.
		 */
		export declare function prependText(text: string): void;

		/**
		 * Deletes text within a specific range (start and end positions).
		 */
		export declare function deleteTextRange(start: number, end: number): void;

		/**
		 * Replaces all occurrences of text.
		 */
		export declare function replaceText(find: string, replace: string, matchCase?: boolean): void;

		/**
		 * Gets all text content from the active document.
		 */
		export declare function getText(): string;

		/**
		 * Gets text from a specific range in the document.
		 */
		export declare function getTextRange(start: number, end: number): string;

		/**
		 * Gets the currently selected text.
		 */
		export declare function getSelection(): string;

		/**
		 * Selects a text range programmatically.
		 */
		export declare function selectRange(start: number, end: number): void;

		// ========== Formatting & Styling ==========

		/**
		 * Applies formatting to selected text.
		 */
		export declare function formatSelection(bold?: boolean, italic?: boolean, underline?: boolean, fontSize?: number): void;

		/**
		 * Applies a built-in style to selected text.
		 */
		export declare function applyStyle(styleName: WordStyle): void;

		/**
		 * Sets font properties for selected text.
		 */
		export declare function setFont(options: FontOptions): void;

		/**
		 * Sets paragraph formatting.
		 */
		export declare function setParagraphFormat(options: ParagraphOptions): void;

		/**
		 * Applies highlight color to selected text.
		 */
		export declare function applyHighlight(color: HighlightColor): void;

		/**
		 * Inserts a page break at the current cursor position.
		 */
		export declare function insertPageBreak(): void;

		/**
		 * Inserts a section break.
		 */
		export declare function insertSectionBreak(breakType: SectionBreakType): void;

		// ========== Document Structure ==========

		/**
		 * Creates a table with specified rows and columns.
		 */
		export declare function createTable(rows: number, columns: number): void;

		/**
		 * Inserts a row in the table at cursor position.
		 */
		export declare function insertRow(position: 'above' | 'below'): void;

		/**
		 * Inserts a column in the table.
		 */
		export declare function insertColumn(position: 'left' | 'right'): void;

		/**
		 * Merges selected table cells.
		 */
		export declare function mergeCells(): void;

		/**
		 * Inserts an image from a file path.
		 */
		export declare function insertImage(path: string, width?: number, height?: number): void;

		/**
		 * Inserts a hyperlink.
		 */
		export declare function insertHyperlink(text: string, url: string): void;

		/**
		 * Gets document properties (title, author, etc.).
		 */
		export declare function getDocumentProperties(): DocumentProperties;

		/**
		 * Applies a document theme.
		 */
		export declare function setDocumentTheme(themeName: string): void;

		// ========== Advanced Text Operations (Tier 2) ==========

		/**
		 * Finds all occurrences of text in the document.
		 */
		export declare function findAll(searchText: string, matchCase?: boolean): number;

		/**
		 * Finds text and returns its position.
		 */
		export declare function findText(searchText: string, matchCase?: boolean): number;

		/**
		 * Inserts text at a bookmark location.
		 */
		export declare function insertAtBookmark(bookmarkName: string, text: string): void;

		/**
		 * Creates a bookmark at current position.
		 */
		export declare function createBookmark(bookmarkName: string): void;

		/**
		 * Deletes a bookmark.
		 */
		export declare function deleteBookmark(bookmarkName: string): void;

		/**
		 * Navigates to a specific page.
		 */
		export declare function gotoPage(pageNumber: number): void;

		/**
		 * Navigates to a specific line.
		 */
		export declare function gotoLine(lineNumber: number): void;

		/**
		 * Gets word count of the document.
		 */
		export declare function getWordCount(): number;

		/**
		 * Gets character count of the document.
		 */
		export declare function getCharacterCount(): number;

		/**
		 * Gets page count of the document.
		 */
		export declare function getPageCount(): number;

		/**
		 * Inserts a symbol at current position.
		 */
		export declare function insertSymbol(symbolCode: number): void;

		/**
		 * Inserts a field (date, page number, etc.).
		 */
		export declare function insertField(fieldType: FieldType, format?: string): void;

		/**
		 * Updates all fields in the document.
		 */
		export declare function updateFields(): void;

		/**
		 * Inserts a table of contents.
		 */
		export declare function insertTOC(): void;

		/**
		 * Updates the table of contents.
		 */
		export declare function updateTOC(): void;

		// ========== Advanced Formatting (Tier 2) ==========

		export declare function applyBold(): void;
		export declare function applyItalic(): void;
		export declare function applyUnderline(): void;
		export declare function applyStrikethrough(): void;
		export declare function applySuperscript(): void;
		export declare function applySubscript(): void;
		export declare function setFontColor(color: string): void;
		export declare function setAlignment(alignment: TextAlignment): void;
		export declare function setLineSpacing(spacing: number): void;
		export declare function setParagraphSpacing(spaceBefore: number, spaceAfter: number): void;
		export declare function setIndentation(left: number, right: number, firstLine?: number): void;
		export declare function setBullets(): void;
		export declare function setNumbering(numberingStyle?: NumberingStyle): void;
		export declare function setListLevel(level: number): void;
		export declare function clearFormatting(): void;

		// ========== Graphics (Tier 2) ==========

		export declare function resizeImage(width: number, height: number): void;
		export declare function insertShape(shapeType: ShapeType): void;
		export declare function insertTextbox(text: string, width?: number, height?: number): void;
	}

	// ==================== EXCEL SPREADSHEET AUTOMATION ====================

	export namespace Excel {

		// ========== Cell Operations ==========

		/**
		 * Writes a value to a specific cell.
		 */
		export declare function writeCell(cell: string, value: string | number): void;

		/**
		 * Reads values from a cell range.
		 */
		export declare function readRange(range: string): any[][];

		/**
		 * Writes values to a range of cells.
		 */
		export declare function writeRange(range: string, values: any[][]): void;

		/**
		 * Clears content from a range.
		 */
		export declare function clearRange(range: string): void;

		/**
		 * Copies a range to clipboard.
		 */
		export declare function copyRange(range: string): void;

		/**
		 * Pastes clipboard content to a range.
		 */
		export declare function pasteRange(targetRange: string): void;

		// ========== Formatting ==========

		/**
		 * Sets cell formatting options.
		 */
		export declare function setCellFormat(range: string, format: CellFormatOptions): void;

		/**
		 * Sets font properties for a range.
		 */
		export declare function setFont(range: string, options: FontOptions): void;

		/**
		 * Sets cell background color.
		 */
		export declare function setCellColor(range: string, color: string): void;

		/**
		 * Sets border style for a range.
		 */
		export declare function setBorder(range: string, borderStyle: BorderStyle): void;

		/**
		 * Merges cells in a range.
		 */
		export declare function mergeCells(range: string): void;

		/**
		 * Sets column width.
		 */
		export declare function setColumnWidth(column: string, width: number): void;

		/**
		 * Sets row height.
		 */
		export declare function setRowHeight(row: number, height: number): void;

		// ========== Worksheets ==========

		/**
		 * Gets the name of the active worksheet.
		 */
		export declare function getActiveSheet(): string;

		/**
		 * Creates a new worksheet.
		 */
		export declare function createSheet(name: string): void;

		/**
		 * Deletes a worksheet.
		 */
		export declare function deleteSheet(name: string): void;

		/**
		 * Renames a worksheet.
		 */
		export declare function renameSheet(oldName: string, newName: string): void;

		// ========== Charts ==========

		/**
		 * Creates a chart from a data range.
		 */
		export declare function createChart(dataRange: string, chartType: ChartType): void;

		/**
		 * Sets the chart type.
		 */
		export declare function setChartType(chartType: ChartType): void;

		/**
		 * Sets the chart title.
		 */
		export declare function setChartTitle(title: string): void;

		// ========== Advanced Range Operations (Tier 2) ==========

		export declare function findValue(value: string | number, range?: string): string;
		export declare function replaceValue(oldValue: string | number, newValue: string | number, range?: string): void;
		export declare function sortRange(range: string, sortColumn: number, ascending?: boolean): void;
		export declare function filterRange(range: string, column: number, criteria: string): void;
		export declare function autoFilter(range: string): void;
		export declare function clearFilter(): void;
		export declare function unmerge(range: string): void;
		export declare function getUsedRange(): string;
		export declare function getCurrentRegion(): string;
		export declare function transposeRange(range: string): void;
		export declare function fillDown(range: string): void;
		export declare function fillRight(range: string): void;
		export declare function fillSeries(range: string, seriesType: SeriesType, step?: number): void;
		export declare function removeDuplicates(range: string, columns?: number[]): void;
		export declare function dataValidation(range: string, validationType: ValidationType, criteria: any): void;

		// ========== Formulas (Tier 2) ==========

		export declare function insertFormula(cell: string, formula: string): void;
		export declare function getFormula(cell: string): string;
		export declare function calculateNow(): void;
		export declare function setCalculationMode(mode: 'automatic' | 'manual'): void;
		export declare function sumRange(range: string): number;
		export declare function averageRange(range: string): number;
		export declare function countRange(range: string): number;
		export declare function maxRange(range: string): number;
		export declare function minRange(range: string): number;
		export declare function vlookup(lookupValue: any, tableRange: string, columnIndex: number, exactMatch?: boolean): any;
		export declare function hlookup(lookupValue: any, tableRange: string, rowIndex: number, exactMatch?: boolean): any;
		export declare function indexMatch(lookupValue: any, returnRange: string, lookupRange: string): any;
		export declare function ifFormula(condition: string, valueIfTrue: any, valueIfFalse: any): void;
		export declare function sumif(range: string, criteria: string, sumRange?: string): number;
		export declare function countif(range: string, criteria: string): number;

		// ========== Advanced Charts (Tier 2) ==========

		export declare function setAxisTitle(axis: 'x' | 'y', title: string): void;
		export declare function formatChartSeries(seriesIndex: number, color?: string, lineStyle?: string): void;
		export declare function addChartSeries(dataRange: string, seriesName?: string): void;
		export declare function setChartColors(colors: string[]): void;
		export declare function addTrendline(seriesIndex: number, trendlineType: TrendlineType): void;
		export declare function setChartLegend(position: LegendPosition, visible?: boolean): void;
		export declare function setDataLabels(visible: boolean, showValue?: boolean, showCategory?: boolean): void;
		export declare function createSparkline(range: string, sparklineType: 'line' | 'column' | 'winloss'): void;
		export declare function deleteChart(chartName: string): void;
		export declare function resizeChart(width: number, height: number): void;
	}

	// ==================== POWERPOINT PRESENTATION AUTOMATION ====================

	export namespace PowerPoint {

		// ========== Slide Management ==========

		/**
		 * Adds a new slide with optional layout.
		 */
		export declare function addSlide(layout?: SlideLayout): void;

		/**
		 * Deletes a slide by index.
		 */
		export declare function deleteSlide(index: number): void;

		/**
		 * Duplicates a slide.
		 */
		export declare function duplicateSlide(index: number): void;

		/**
		 * Moves a slide to a new position.
		 */
		export declare function moveSlide(fromIndex: number, toIndex: number): void;

		// ========== Content ==========

		/**
		 * Adds text to a slide.
		 */
		export declare function addText(text: string, slideIndex?: number): void;

		/**
		 * Adds a text box to a slide.
		 */
		export declare function addTextBox(text: string, left: number, top: number, width?: number, height?: number): void;

		/**
		 * Adds a title to a slide.
		 */
		export declare function addTitle(title: string, slideIndex?: number): void;

		/**
		 * Inserts an image on a slide.
		 */
		export declare function insertImage(path: string, slideIndex?: number, left?: number, top?: number): void;

		/**
		 * Adds a shape to a slide.
		 */
		export declare function addShape(shapeType: ShapeType, left: number, top: number, width: number, height: number): void;

		// ========== Formatting ==========

		/**
		 * Sets text formatting in a shape.
		 */
		export declare function setTextFormat(options: FontOptions): void;

		/**
		 * Sets shape fill color.
		 */
		export declare function setShapeFill(color: string): void;

		/**
		 * Sets slide layout.
		 */
		export declare function setSlideLayout(layout: SlideLayout): void;

		/**
		 * Applies a theme to the presentation.
		 */
		export declare function applyTheme(themeName: string): void;

		/**
		 * Sets slide background.
		 */
		export declare function setBackground(color: string, imageUrl?: string): void;

		/**
		 * Adds a transition effect to a slide.
		 */
		export declare function addTransition(transitionType: TransitionType, duration?: number): void;

		// ========== Advanced Shapes (Tier 2) ==========

		export declare function addLine(startX: number, startY: number, endX: number, endY: number): void;
		export declare function addConnector(connectorType: ConnectorType, startX: number, startY: number, endX: number, endY: number): void;
		export declare function addArrow(startX: number, startY: number, endX: number, endY: number): void;
		export declare function resizeShape(shapeId: string, width: number, height: number): void;
		export declare function moveShape(shapeId: string, left: number, top: number): void;
		export declare function rotateShape(shapeId: string, degrees: number): void;
		export declare function flipShape(shapeId: string, flipType: 'horizontal' | 'vertical'): void;
		export declare function duplicateShape(shapeId: string): void;
		export declare function setShapeOutline(shapeId: string, color: string, weight?: number): void;
		export declare function setShapeEffects(shapeId: string, effects: ShapeEffects): void;
		export declare function groupShapes(shapeIds: string[]): void;
		export declare function ungroupShapes(groupId: string): void;
		export declare function alignShapes(shapeIds: string[], alignment: ShapeAlignment): void;
		export declare function distributeShapes(shapeIds: string[], distribution: 'horizontal' | 'vertical'): void;
		export declare function bringToFront(shapeId: string): void;

		// ========== Animations (Tier 2) ==========

		export declare function addAnimation(shapeId: string, animationType: AnimationType): void;
		export declare function setAnimationEffect(shapeId: string, effect: AnimationEffect): void;
		export declare function setAnimationDuration(shapeId: string, duration: number): void;
		export declare function setAnimationDelay(shapeId: string, delay: number): void;
		export declare function setAnimationTrigger(shapeId: string, trigger: AnimationTrigger): void;
		export declare function reorderAnimations(shapeId: string, newOrder: number): void;
		export declare function removeAnimation(shapeId: string): void;
		export declare function setMotionPath(shapeId: string, path: MotionPath): void;
		export declare function previewAnimation(slideIndex?: number): void;
		export declare function setTransitionSpeed(speed: 'slow' | 'medium' | 'fast'): void;
	}

	// ==================== GENERAL OFFICE OPERATIONS ====================

	/**
	 * Saves the active document.
	 */
	export declare function saveDocument(): void;

	/**
	 * Saves the document with a new name or format.
	 */
	export declare function saveAs(path: string, format?: DocumentFormat): void;

	/**
	 * Closes the active document.
	 */
	export declare function closeDocument(saveChanges?: boolean): void;

	/**
	 * Gets information about the active document.
	 */
	export declare function getActiveDocument(): DocumentInfo;

	/**
	 * Exports the document as PDF.
	 */
	export declare function exportPDF(outputPath: string): void;
}

// ==================== TYPE DEFINITIONS ====================

export type WordStyle = 'Normal' | 'Heading 1' | 'Heading 2' | 'Heading 3' | 'Title' | 'Subtitle' | 'Quote' | 'Code';

export type HighlightColor = 'yellow' | 'green' | 'cyan' | 'magenta' | 'blue' | 'red' | 'gray' | 'black';

export type SectionBreakType = 'nextPage' | 'continuous' | 'evenPage' | 'oddPage';

export type TextAlignment = 'left' | 'center' | 'right' | 'justify';

export type NumberingStyle = 'arabic' | 'roman' | 'alpha' | 'bullet';

export type FieldType = 'date' | 'time' | 'pageNumber' | 'numPages' | 'author' | 'title';

export type ShapeType = 'rectangle' | 'ellipse' | 'triangle' | 'line' | 'arrow' | 'star' | 'heart';

export type ChartType = 'column' | 'bar' | 'line' | 'pie' | 'scatter' | 'area' | 'doughnut' | 'radar';

export type BorderStyle = 'thin' | 'medium' | 'thick' | 'double' | 'dashed' | 'dotted';

export type SeriesType = 'linear' | 'growth' | 'date' | 'autofill';

export type ValidationType = 'whole' | 'decimal' | 'list' | 'date' | 'time' | 'textLength' | 'custom';

export type TrendlineType = 'linear' | 'exponential' | 'logarithmic' | 'polynomial' | 'power' | 'movingAverage';

export type LegendPosition = 'top' | 'bottom' | 'left' | 'right' | 'none';

export type SlideLayout = 'Title' | 'TitleOnly' | 'Blank' | 'TwoContent' | 'ContentWithCaption' | 'Comparison' | 'TitleAndContent';

export type TransitionType = 'fade' | 'push' | 'wipe' | 'split' | 'reveal' | 'random' | 'none';

export type ConnectorType = 'straight' | 'elbow' | 'curved';

export type AnimationType = 'entrance' | 'emphasis' | 'exit' | 'motionPath';

export type AnimationEffect = 'fade' | 'fly' | 'wipe' | 'split' | 'wheel' | 'randomBars' | 'grow' | 'zoom' | 'swivel' | 'bounce';

export type AnimationTrigger = 'onClick' | 'withPrevious' | 'afterPrevious';

export type ShapeAlignment = 'left' | 'center' | 'right' | 'top' | 'middle' | 'bottom';

export type DocumentFormat = 'docx' | 'doc' | 'pdf' | 'rtf' | 'txt' | 'html' | 'xlsx' | 'xls' | 'csv' | 'pptx' | 'ppt';

export interface FontOptions {
	name?: string;
	size?: number;
	color?: string;
	bold?: boolean;
	italic?: boolean;
	underline?: boolean;
}

export interface ParagraphOptions {
	alignment?: TextAlignment;
	lineSpacing?: number;
	spaceBefore?: number;
	spaceAfter?: number;
	leftIndent?: number;
	rightIndent?: number;
	firstLineIndent?: number;
}

export interface CellFormatOptions {
	numberFormat?: string;
	font?: FontOptions;
	backgroundColor?: string;
	horizontalAlignment?: 'left' | 'center' | 'right';
	verticalAlignment?: 'top' | 'middle' | 'bottom';
}

export interface DocumentProperties {
	title: string;
	author: string;
	subject: string;
	keywords: string;
	comments: string;
	created: Date;
	modified: Date;
}

export interface DocumentInfo {
	name: string;
	path: string;
	type: 'word' | 'excel' | 'powerpoint';
	saved: boolean;
}

export interface ShapeEffects {
	shadow?: boolean;
	reflection?: boolean;
	glow?: boolean;
	softEdges?: boolean;
	bevel3D?: boolean;
}

export interface MotionPath {
	type: 'line' | 'arc' | 'turn' | 'shape' | 'loop' | 'custom';
	points?: Array<{ x: number; y: number }>;
}
