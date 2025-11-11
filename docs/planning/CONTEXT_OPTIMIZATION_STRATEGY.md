# Context Optimization Strategy: Leveraging Model's Programming Knowledge

**Date**: 2025-10-26
**Goal**: Reduce 160 Office tools from 32k tokens to ~5k tokens
**Approach**: Schema-based definitions + Model's existing COM knowledge

---

## The Problem with Current Approach

### Wasteful Verbose Descriptions (32k tokens):
```typescript
{
  id: 'office_word_insert_text',
  displayName: 'Word: Insert Text',
  modelDescription: 'Inserts text at the current cursor position...',
  inputSchema: { /* Full JSON schema */ }
}
```

**Why wasteful**:
- Models already know `insert_text` means "put text somewhere"
- Models know COM API patterns from training
- We're explaining concepts they already understand

---

## Solution 1: **Compact Schema Format** (~5k tokens total)

### Minimal Tool Definition:
```typescript
// System prompt (one-time, ~1000 tokens):
`
You have access to Office COM APIs via these tools:
- Pattern: office_{app}_{object}_{action}
- Apps: word, excel, powerpoint
- Objects: document, range, cell, slide, shape, table, etc.
- Actions: insert, delete, format, get, set, create, etc.

Parameters follow standard COM object model conventions.
Use camelCase for property names.
`

// Tool registry (compact format, ~4000 tokens for 160 tools):
{
  "word": {
    "text": {
      "insert": { "params": ["text", "?position"] },
      "delete": { "params": ["start", "end"] },
      "append": { "params": ["text", "?bold", "?italic"] },
      "replace": { "params": ["find", "replace", "?matchCase"] }
    },
    "format": {
      "font": { "params": ["?name", "?size", "?color"] },
      "paragraph": { "params": ["?align", "?spacing", "?indent"] },
      "style": { "params": ["styleName"] }
    },
    "table": {
      "create": { "params": ["rows", "columns"] },
      "insertRow": { "params": ["?position"] },
      "mergeCells": { "params": [] }
    }
  },
  "excel": {
    "cell": {
      "write": { "params": ["cell", "value"] },
      "read": { "params": ["range"] },
      "format": { "params": ["range", "?numberFormat", "?font", "?color"] }
    },
    "sheet": {
      "create": { "params": ["name"] },
      "delete": { "params": ["name"] },
      "rename": { "params": ["oldName", "newName"] }
    }
  },
  "powerpoint": {
    "slide": {
      "add": { "params": ["?layout"] },
      "delete": { "params": ["index"] },
      "duplicate": { "params": ["index"] }
    },
    "text": {
      "add": { "params": ["text", "?slideIndex"] },
      "format": { "params": ["?font", "?size", "?color"] }
    }
  }
}
```

**Total tokens**: ~5,000 (instead of 32,000)

**Savings**: 85% reduction

---

## Solution 2: **Reference-Based Tool Definitions** (~3k tokens)

Leverage the fact that models understand Office COM from their training:

```typescript
// System prompt (~500 tokens):
`
You have access to Office automation via standard COM APIs.

Available: Word.Application, Excel.Application, PowerPoint.Application

Tools follow pattern: office_{app}_{method}
Examples:
- office_word_insertText → Word.Selection.InsertAfter(text)
- office_excel_writeCell → Worksheet.Range(cell).Value = value
- office_powerpoint_addSlide → Presentation.Slides.Add(index, layout)

All tools accept parameters matching their COM equivalents.
Refer to Microsoft Office VBA documentation for parameter details.
`

// Tool list (compact, ~2500 tokens):
[
  // Word (55 tools)
  "word_insertText", "word_deleteRange", "word_formatFont",
  "word_setParagraph", "word_createTable", "word_insertImage",
  // ... 49 more

  // Excel (60 tools)
  "excel_writeCell", "excel_readRange", "excel_formatCell",
  "excel_createChart", "excel_insertFormula", "excel_createSheet",
  // ... 54 more

  // PowerPoint (45 tools)
  "powerpoint_addSlide", "powerpoint_addText", "powerpoint_formatShape",
  "powerpoint_addAnimation", "powerpoint_setTransition",
  // ... 40 more
]
```

**Total tokens**: ~3,000 (instead of 32,000)

**Savings**: 90% reduction

**How it works**:
- Models already know `Word.Selection.InsertAfter()` from training
- We just map tool names to COM methods
- Model infers parameters from method name + COM knowledge

---

## Solution 3: **Dynamic Tool Discovery** (~500 tokens base + on-demand)

Most aggressive optimization:

```typescript
// Base system prompt (~500 tokens):
`
You have access to Office COM APIs.

To use: Ask "What Office tools are available for [operation]?"
I will provide relevant tools on-demand.

Example:
User: "Make text bold"
You: "What tools for text formatting?"
Me: [Provides: word_formatFont, word_formatSelection, word_applyStyle]
You: [Uses appropriate tool]
`

// Tools loaded on-demand:
- User mentions "bold" → Load formatting tools (10 tools, ~800 tokens)
- User mentions "cell A1" → Load Excel cell tools (15 tools, ~1200 tokens)
- User mentions "slide" → Load PowerPoint tools (20 tools, ~1600 tokens)

**Initial context**: ~500 tokens
**Additional on-demand**: ~1500 tokens average
**Total typical**: ~2000 tokens

**Savings**: 94% reduction
```

---

## Solution 4: **TypeScript Interface Definitions** (~2k tokens)

Leverage model's understanding of TypeScript:

```typescript
// System prompt (~200 tokens):
`
You have Office automation tools defined by these TypeScript interfaces:
Call tools using the interface signatures.
`

// Type definitions (~1800 tokens):
```typescript
namespace Office {
  namespace Word {
    function insertText(text: string, position?: number): void;
    function deleteRange(start: number, end: number): void;
    function formatFont(options: { name?: string; size?: number; color?: string }): void;
    function createTable(rows: number, columns: number): void;
  }

  namespace Excel {
    function writeCell(cell: string, value: string | number): void;
    function readRange(range: string): any[][];
    function formatCell(range: string, format: { numberFormat?: string; font?: Font }): void;
  }

  namespace PowerPoint {
    function addSlide(layout?: SlideLayout): void;
    function addText(text: string, slideIndex?: number): void;
  }
}

type Font = { name?: string; size?: number; color?: string; bold?: boolean };
type SlideLayout = "Title" | "TitleOnly" | "Blank" | "TwoContent";
```

**Total**: ~2,000 tokens

**Savings**: 93% reduction

**Benefits**:
- Models excel at understanding TypeScript
- Type hints guide parameter usage
- Autocomplete-like clarity for the model

---

## Solution 5: **OpenAPI/Swagger Schema** (~3k tokens)

Use industry-standard API schema format:

```yaml
# OpenAPI spec (~3000 tokens for 160 tools)
openapi: 3.0.0
info:
  title: Office Automation API
  version: 1.0.0

paths:
  /word/text/insert:
    post:
      parameters:
        - name: text
          schema: { type: string }
        - name: position
          schema: { type: integer }
          required: false

  /excel/cell/write:
    post:
      parameters:
        - name: cell
          schema: { type: string }
        - name: value
          schema: { type: [string, number] }
```

**Benefits**:
- Models trained on OpenAPI specs
- Standard format, zero confusion
- Can generate from existing COM documentation

---

## Recommended Approach: **Hybrid TypeScript + Compact Registry**

### Phase 1: Base Schema (~1000 tokens)

```typescript
/**
 * Office Automation Tools
 * All tools follow pattern: Office.{App}.{method}({params})
 */

namespace Office {
  /** Word Document Automation */
  namespace Word {
    // Text operations
    function insertText(text: string, position?: number): void;
    function deleteRange(start: number, end: number): void;
    function getText(): string;

    // Formatting
    function formatFont(options: FontOptions): void;
    function formatParagraph(options: ParagraphOptions): void;
    function applyStyle(styleName: string): void;

    // Structure
    function createTable(rows: number, columns: number): void;
    function insertImage(path: string, width?: number, height?: number): void;
  }

  /** Excel Spreadsheet Automation */
  namespace Excel {
    // Cell operations
    function writeCell(cell: string, value: string | number): void;
    function readRange(range: string): any[][];

    // Formatting
    function formatCell(range: string, format: CellFormat): void;

    // Sheets
    function createSheet(name: string): void;
    function getActiveSheet(): string;
  }

  /** PowerPoint Presentation Automation */
  namespace PowerPoint {
    // Slides
    function addSlide(layout?: SlideLayout): void;
    function deleteSlide(index: number): void;

    // Content
    function addText(text: string, slideIndex?: number): void;
    function insertImage(path: string, slideIndex?: number): void;
  }
}

// Type definitions
type FontOptions = { name?: string; size?: number; color?: string; bold?: boolean; italic?: boolean };
type ParagraphOptions = { alignment?: "left" | "center" | "right"; spacing?: number };
type CellFormat = { numberFormat?: string; font?: FontOptions; backgroundColor?: string };
type SlideLayout = "Title" | "TitleOnly" | "Blank" | "TwoContent" | "ContentWithCaption";
```

**Context**: ~1,000 tokens

### Phase 2: Tool Mapping (~500 tokens)

```typescript
// Tool name → TypeScript method mapping
const toolMap = {
  "office_word_insert_text": "Office.Word.insertText",
  "office_excel_write_cell": "Office.Excel.writeCell",
  "office_powerpoint_add_slide": "Office.PowerPoint.addSlide",
  // ... 157 more (very compact)
};
```

**Context**: ~500 tokens

### Total: ~1,500 tokens (95% reduction from 32k)

---

## Implementation Strategy

### Step 1: Update Tool Registration

```typescript
// Instead of verbose IToolData:
const toolData: IToolData = {
  id: 'office_word_insert_text',
  source: { type: 'internal', label: 'Office' },
  displayName: 'Word.insertText',  // Matches TypeScript namespace
  modelDescription: '',  // EMPTY - model infers from TypeScript signature
  inputSchema: {
    type: 'object',
    properties: {
      text: { type: 'string' },
      position: { type: 'integer' }
    }
  }
};
```

### Step 2: System Prompt

```typescript
const officeToolsSystemPrompt = `
You have Office automation tools defined by TypeScript interfaces.

${typescriptDefinitions}  // ~1000 tokens

To use tools:
1. Identify Office app (Word/Excel/PowerPoint)
2. Find appropriate method in namespace
3. Call with matching parameters

Example:
User: "Insert 'Hello' at position 10"
→ Office.Word.insertText("Hello", 10)
→ Translates to: office_word_insert_text({ text: "Hello", position: 10 })
`;
```

### Step 3: Few-Shot Examples (Optional, ~1000 tokens)

```typescript
const examples = `
Example 1:
User: "Make cell A1 bold and currency format"
→ Office.Excel.formatCell("A1", {
    font: { bold: true },
    numberFormat: "$#,##0.00"
  })

Example 2:
User: "Create a title slide"
→ Office.PowerPoint.addSlide("Title")
→ Office.PowerPoint.addText("Slide Title", 0)
`;
```

---

## Context Comparison

### Current Verbose Approach:
```
Tool Definitions: 32,000 tokens
Few-Shot Examples: 2,000 tokens
System Prompt: 2,000 tokens
───────────────────────────
TOTAL: 36,000 tokens
```

### Optimized TypeScript Approach:
```
TypeScript Definitions: 1,000 tokens
Tool Name Mapping: 500 tokens
Few-Shot Examples: 1,000 tokens
System Prompt: 500 tokens
───────────────────────────
TOTAL: 3,000 tokens
```

**Savings**: 33,000 tokens (91% reduction)

**What you can now fit**:
- Previous: 159k tokens for documents
- New: 192k tokens for documents (21% more)

---

## Testing This Approach

### Proof of Concept:

```typescript
// 1. Create minimal TypeScript schema
const schema = `
namespace Office.Word {
  function insertText(text: string, position?: number): void;
}
`;

// 2. Register tool minimally
const tool = {
  id: 'office_word_insert_text',
  displayName: 'Word.insertText',
  modelDescription: '', // EMPTY - let model infer
  inputSchema: { /* from TypeScript */ }
};

// 3. Test with AI
prompt = `
${schema}

User: "Add 'Hello World' at position 50"

Which tool to use and with what parameters?
`;

// Expected response:
// Office.Word.insertText("Hello World", 50)
// → office_word_insert_text({ text: "Hello World", position: 50 })
```

**Result**: Model should correctly infer usage from TypeScript signature alone.

---

## Migration Path

### Week 1: Implement TypeScript Schema
1. Convert 160 tool definitions to TypeScript namespace
2. Group by app and category
3. Define common types (FontOptions, CellFormat, etc.)

### Week 2: Update Tool Registration
1. Use minimal `modelDescription` (empty or very short)
2. Rely on TypeScript signature for parameter info
3. Test with few tools first

### Week 3: Measure & Optimize
1. Compare accuracy: Verbose vs TypeScript approach
2. Measure context savings
3. Iterate on TypeScript definitions if needed

---

## Conclusion

You're absolutely right - **32k tokens is wasteful** when models already understand:
- Programming patterns
- TypeScript
- COM API structure
- Office object models (from training data)

**Recommended Solution**:
- **TypeScript namespace definitions**: ~1,000 tokens
- **Tool name mappings**: ~500 tokens
- **Few-shot examples** (optional): ~1,000 tokens
- **Total**: ~2,500 tokens instead of 32,000

**Savings**: 91% reduction in context usage

**Next Steps**:
1. Create TypeScript schema for 160 tools
2. Update tool registration to use minimal descriptions
3. Test accuracy vs verbose approach
4. If accuracy is comparable (likely 95%+), ship it!

This is the elegant solution that leverages the model's existing knowledge instead of fighting against context limits.
