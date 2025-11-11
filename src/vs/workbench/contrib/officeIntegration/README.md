# VS Code Office Fork Integration Files

This directory contains the 5 core files needed to integrate your MCP-powered Office automation into a VS Code fork.

## Files Overview

### 1. `common/officeService.ts`
**Location in fork**: `src/vs/workbench/contrib/office/common/officeService.ts`

Service interface defining the contract for Office document operations:
- Opening/creating Word, Excel, PowerPoint documents
- Executing MCP tools
- Managing document state
- Type definitions for Office document types and MCP tools

### 2. `node/officeServiceImpl.ts`
**Location in fork**: `src/vs/workbench/contrib/office/node/officeServiceImpl.ts`

Backend service implementation that:
- Spawns and manages your MCP server process (`windsurf-office-mcp`)
- Communicates with MCP server via stdin/stdout
- Launches Office applications via PowerShell
- Handles MCP tool execution and responses

**IMPORTANT**: Update the MCP server path on line 13:
```typescript
this.mcpServerPath = 'C:\\Users\\bubun\\CascadeProjects\\ReactFlow\\windsurf-office-mcp\\dist\\index.js';
```

### 3. `browser/officeEditor.ts`
**Location in fork**: `src/vs/workbench/contrib/office/browser/officeEditor.ts`

The magic happens here! This file:
- Creates the editor pane for Office documents
- Finds Office application windows by process name
- Uses PowerShell + Win32 API to:
  - `SetParent()` - Reparent Office window into VS Code
  - `SetWindowLong()` - Remove window chrome (title bar, min/max/close)
  - `MoveWindow()` - Position and resize Office window
- Handles editor lifecycle (open, close, resize)
- Polls for Office window appearance (500ms intervals, 20 attempts)

**Key Implementation Details**:
- Uses `Get-Process` to find WINWORD/EXCEL/POWERPNT processes
- Extracts `MainWindowHandle` (HWND) for embedding
- Removes window styles: `WS_CAPTION | WS_THICKFRAME | WS_MINIMIZE | WS_MAXIMIZE | WS_SYSMENU`
- Resizes embedded window on editor `layout()` events

### 4. `browser/officeAssistantPanel.ts`
**Location in fork**: `src/vs/workbench/contrib/office/browser/officeAssistantPanel.ts`

AI Assistant sidebar panel featuring:
- Loads MCP tools from your server
- Groups tools by category (Word, Excel, PowerPoint)
- Displays most popular tools as clickable buttons
- Shows only actionable tools (filters 60+ down to ~15 most useful)
- Executes tools via `IOfficeService.executeMCPTool()`
- Success/error notifications

**Popular Tools Displayed**:
- Word: Append Text, Replace, Highlight, Save, Read Content
- Excel: Write Data, Read Sheet, Create Chart, Format Cells, Save
- PowerPoint: Add Slide, Add Text, Add Image, Save, Export PDF

### 5. `browser/office.contribution.ts`
**Location in fork**: `src/vs/workbench/contrib/office/browser/office.contribution.ts`

Registration file that:
- Registers `IOfficeService` as a singleton
- Registers `OfficeEditor` as an editor pane
- Creates "Office AI Assistant" view container in sidebar
- Registers commands:
  - `office.openWord`, `office.openExcel`, `office.openPowerPoint`
  - `office.newWord`, `office.newExcel`, `office.newPowerPoint`
  - `office.save`
  - `office.executeMCPTool`
- Sets up editor serialization (save/restore tabs on reload)

**Also registers this in**: `src/vs/workbench/workbench.common.main.ts`

---

## How It Works

### Workflow: Opening a .docx File

1. User clicks `Report.docx` in file explorer
2. VS Code routes to `OfficeEditor` (registered for .docx files)
3. `OfficeEditor.setInput()` called with file path
4. `officeService.openDocument()` launches Word via PowerShell:
   ```powershell
   Start-Process 'winword.exe' -ArgumentList 'C:\path\to\Report.docx'
   ```
5. `embedOfficeWindow()` polls every 500ms for Word window
6. `findAndEmbedOfficeWindow()` finds WINWORD process:
   ```powershell
   $process = Get-Process -Name WINWORD
   $hwnd = $process.MainWindowHandle
   ```
7. `embedWindowHandle()` embeds the window:
   ```powershell
   [Win32]::SetParent($childHwnd, $parentHwnd)
   [Win32]::SetWindowLong($hwnd, $GWL_STYLE, $newStyle)  # Remove chrome
   [Win32]::MoveWindow($hwnd, 0, 0, $width, $height, $true)
   ```
8. Word now appears embedded in VS Code editor area - NO title bar, NO min/max/close buttons

### Workflow: Using AI Assistant

1. User clicks "Office AI Assistant" in activity bar
2. `OfficeAssistantPanel` loads MCP tools via `officeService.getMCPTools()`
3. User clicks "Append Text" button
4. `executeTool()` calls `officeService.executeMCPTool('word_com_append', args)`
5. Service sends JSON-RPC request to MCP server:
   ```json
   {
     "jsonrpc": "2.0",
     "method": "tools/call",
     "params": {
       "name": "word_com_append",
       "arguments": { "text": "Hello World", "bold": false }
     }
   }
   ```
6. MCP server executes PowerShell script via your existing handler
7. Text appends to active Word document
8. Success notification appears in panel

---

## Quick Start

### 1. Clone VS Code
```bash
git clone https://github.com/microsoft/vscode.git vscode-office-fork
cd vscode-office-fork
git checkout release/1.85
yarn
```

### 2. Copy These Files
```bash
mkdir -p src/vs/workbench/contrib/office/{common,node,browser}
cp vscode-office-fork-files/common/*.ts src/vs/workbench/contrib/office/common/
cp vscode-office-fork-files/node/*.ts src/vs/workbench/contrib/office/node/
cp vscode-office-fork-files/browser/*.ts src/vs/workbench/contrib/office/browser/
```

### 3. Register Contribution
Edit `src/vs/workbench/workbench.common.main.ts`:
```typescript
import 'vs/workbench/contrib/office/browser/office.contribution';
```

### 4. Install Dependencies
```bash
yarn add @modelcontextprotocol/sdk
```

### 5. Build and Run
```bash
yarn watch          # Terminal 1
./scripts/code.sh   # Terminal 2
```

---

## Technical Details

### Window Embedding Approach

We use **Window Reparenting** (not ActiveX or OLE embedding):

**Advantages**:
- ✅ Full Office functionality (all ribbons, toolbars, features)
- ✅ No Office SDK required
- ✅ Works with any Office version
- ✅ No performance overhead
- ✅ Native rendering

**Disadvantages**:
- ❌ Windows-only (uses Win32 API)
- ❌ Requires Office desktop (not Office 365 web)
- ❌ Some edge cases with multi-monitor setups

### MCP Communication

Uses **JSON-RPC 2.0** over stdin/stdout:

```typescript
// Request
{
  "jsonrpc": "2.0",
  "id": 1234567890,
  "method": "tools/call",
  "params": {
    "name": "word_com_append",
    "arguments": { "text": "Hello", "bold": true }
  }
}

// Response
{
  "jsonrpc": "2.0",
  "id": 1234567890,
  "result": {
    "content": [
      {
        "type": "text",
        "text": "Text appended successfully to active Word document"
      }
    ]
  }
}
```

### PowerShell Inline C# Technique

Your MCP server uses this pattern extensively:

```powershell
Add-Type @"
  using System;
  using System.Runtime.InteropServices;
  public class Win32 {
    [DllImport("user32.dll")]
    public static extern IntPtr SetParent(IntPtr hWndChild, IntPtr hWndNewParent);
  }
"@

[Win32]::SetParent($childHwnd, $parentHwnd)
```

This compiles C# code on-the-fly in PowerShell to call Win32 APIs!

---

## Customization Ideas

### Add More Tools to Panel

Edit `officeAssistantPanel.ts`:
```typescript
const popularToolNames = [
    'word_com_append',
    // Add your favorites:
    'word_com_insert_table',
    'word_com_add_image',
    'excel_com_pivot_table',
];
```

### Change Sidebar Icon

Edit `office.contribution.ts`:
```typescript
icon: 'codicon-book',  // Try: codicon-file-office, codicon-table, codicon-graph
```

### Add Keyboard Shortcuts

Register in `office.contribution.ts`:
```typescript
MenuRegistry.appendMenuItem(MenuId.CommandPalette, {
    command: {
        id: 'office.newWord',
        title: 'Office: New Word Document',
        category: 'Office'
    }
});
```

### Modify Window Embedding Style

Edit `officeEditor.ts` line 204-209 to keep/remove different window elements:
```typescript
$WS_CAPTION = 0x00C00000      // Title bar
$WS_THICKFRAME = 0x00040000   // Resizable border
$WS_SYSMENU = 0x00080000      // System menu (icon in top-left)
```

---

## Dependencies Required

### npm packages
- `@modelcontextprotocol/sdk` - MCP client SDK

### System requirements
- Windows 10/11
- Microsoft Office (Desktop version)
- PowerShell 5.1+

### Your MCP Server
- Must be built: `npm run build` in windsurf-office-mcp directory
- Must export to `dist/index.js`

---

## File Size Reference

- `officeService.ts` - 2KB (interface only)
- `officeServiceImpl.ts` - 8KB (service implementation)
- `officeEditor.ts` - 10KB (window embedding logic)
- `officeAssistantPanel.ts` - 11KB (AI assistant UI)
- `office.contribution.ts` - 7KB (registration)

**Total**: ~38KB of code to integrate full Office + AI capabilities!

---

## Troubleshooting

### Office window not embedding?
- Check Office is installed: `Get-Process WINWORD` in PowerShell
- Increase polling timeout in `officeEditor.ts` (line 94: change 20 to 40)
- Run VS Code as Administrator

### MCP server not starting?
- Verify path in `officeServiceImpl.ts` line 13
- Test manually: `node C:\path\to\windsurf-office-mcp\dist\index.js`
- Check for port conflicts

### Build errors?
- Clean build: `yarn gulp clean`
- Reinstall: `rm -rf node_modules && yarn`

---

## Next Steps

See the main **VSCODE_OFFICE_FORK_IMPLEMENTATION_GUIDE.md** for:
- Complete step-by-step installation
- Testing procedures
- Advanced customization
- Production deployment

---

**Your existing MCP server is the powerhouse** - these 5 files just expose it through VS Code's UI!
