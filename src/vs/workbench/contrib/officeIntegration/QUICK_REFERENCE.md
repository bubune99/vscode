# VS Code Office Fork - Quick Reference Card

## 30-Second Overview

Embed Microsoft Office (Word/Excel/PowerPoint) in VS Code + AI assistant with your 60+ MCP COM tools.

**5 files** → **VS Code fork** → **Native Office in editor** → **AI control via sidebar**

---

## Installation (5 steps)

```bash
# 1. Clone
git clone https://github.com/microsoft/vscode.git vscode-office-fork
cd vscode-office-fork && git checkout release/1.85 && yarn

# 2. Copy files
mkdir -p src/vs/workbench/contrib/office/{common,node,browser}
cp <your-files>/* src/vs/workbench/contrib/office/

# 3. Register in src/vs/workbench/workbench.common.main.ts
import 'vs/workbench/contrib/office/browser/office.contribution';

# 4. Install MCP SDK
yarn add @modelcontextprotocol/sdk

# 5. Build & run
yarn watch && ./scripts/code.sh
```

---

## File Locations

| Source File | Destination in Fork |
|-------------|---------------------|
| `common/officeService.ts` | `src/vs/workbench/contrib/office/common/officeService.ts` |
| `node/officeServiceImpl.ts` | `src/vs/workbench/contrib/office/node/officeServiceImpl.ts` |
| `browser/officeEditor.ts` | `src/vs/workbench/contrib/office/browser/officeEditor.ts` |
| `browser/officeAssistantPanel.ts` | `src/vs/workbench/contrib/office/browser/officeAssistantPanel.ts` |
| `browser/office.contribution.ts` | `src/vs/workbench/contrib/office/browser/office.contribution.ts` |

---

## Configuration Required

### Update MCP Server Path

**File**: `src/vs/workbench/contrib/office/node/officeServiceImpl.ts`
**Line**: 13

```typescript
this.mcpServerPath = 'C:\\Users\\bubun\\CascadeProjects\\ReactFlow\\windsurf-office-mcp\\dist\\index.js';
```

Change to your actual path!

---

## How It Works (Architecture)

```
User clicks Report.docx
    ↓
OfficeEditor.setInput()
    ↓
officeService.openDocument()
    ↓
PowerShell: Start-Process winword.exe
    ↓
Poll for WINWORD process
    ↓
Get MainWindowHandle (HWND)
    ↓
SetParent(officeHwnd, vscodeHwnd)
    ↓
SetWindowLong() - remove chrome
    ↓
MoveWindow() - resize to editor
    ↓
Word embedded in VS Code!
```

---

## Key APIs Used

### Win32 APIs (via PowerShell inline C#)

```powershell
Add-Type @"
  using System;
  using System.Runtime.InteropServices;
  public class Win32 {
    [DllImport("user32.dll")]
    public static extern IntPtr SetParent(IntPtr child, IntPtr parent);

    [DllImport("user32.dll")]
    public static extern int SetWindowLong(IntPtr hWnd, int nIndex, int dwNewLong);

    [DllImport("user32.dll")]
    public static extern bool MoveWindow(IntPtr hWnd, int X, int Y, int w, int h, bool repaint);
  }
"@

# Usage
[Win32]::SetParent($officeHwnd, $parentHwnd)
[Win32]::SetWindowLong($officeHwnd, -16, $newStyle)  # -16 = GWL_STYLE
[Win32]::MoveWindow($officeHwnd, 0, 0, 800, 600, $true)
```

### MCP Communication (JSON-RPC)

```typescript
// Send to MCP server (via stdin)
{
  "jsonrpc": "2.0",
  "id": 123456,
  "method": "tools/call",
  "params": {
    "name": "word_com_append",
    "arguments": { "text": "Hello", "bold": true }
  }
}

// Receive from MCP server (via stdout)
{
  "jsonrpc": "2.0",
  "id": 123456,
  "result": { "content": [{ "type": "text", "text": "Success" }] }
}
```

---

## Commands Registered

| Command | Description |
|---------|-------------|
| `office.openWord` | Open .docx in embedded Word |
| `office.openExcel` | Open .xlsx in embedded Excel |
| `office.openPowerPoint` | Open .pptx in embedded PowerPoint |
| `office.newWord` | Create new Word document |
| `office.newExcel` | Create new Excel workbook |
| `office.newPowerPoint` | Create new PowerPoint presentation |
| `office.save` | Save active document |
| `office.executeMCPTool` | Execute any MCP tool |

---

## Popular MCP Tools

### Word
- `word_com_append` - Add text to end
- `word_com_replace` - Find and replace
- `word_com_highlight` - Highlight text
- `word_com_save` - Save document
- `word_com_read` - Get document content

### Excel
- `excel_com_write` - Write data to cells
- `excel_com_read` - Read sheet data
- `excel_com_chart` - Create chart
- `excel_com_format` - Format cells
- `excel_com_save` - Save workbook

### PowerPoint
- `ppt_com_add_slide` - Add new slide
- `ppt_com_add_text` - Add text to slide
- `ppt_com_add_image` - Insert image
- `ppt_com_save` - Save presentation
- `ppt_com_export_pdf` - Export as PDF

---

## Window Style Flags (Removed)

```typescript
const WS_CAPTION = 0x00C00000;      // Title bar
const WS_THICKFRAME = 0x00040000;   // Resizable border
const WS_MINIMIZE = 0x20000000;     // Minimize button
const WS_MAXIMIZE = 0x01000000;     // Maximize button
const WS_SYSMENU = 0x00080000;      // System menu (X button)

// Remove all:
$newStyle = $style -band (-bnot ($WS_CAPTION -bor $WS_THICKFRAME -bor $WS_MINIMIZE -bor $WS_MAXIMIZE -bor $WS_SYSMENU))
```

---

## Troubleshooting Quick Fixes

### Office not embedding?
```bash
# Increase timeout in officeEditor.ts line 94
if (attempts > 40) {  # Was: 20
```

### MCP server not starting?
```bash
# Test manually
node C:\path\to\windsurf-office-mcp\dist\index.js

# Check path in officeServiceImpl.ts line 13
```

### Build errors?
```bash
# Clean and rebuild
yarn gulp clean
rm -rf node_modules
yarn
yarn watch
```

### Office window has chrome?
```bash
# Run VS Code as Administrator
# Or adjust execution policy:
Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned
```

---

## Testing Checklist

- [ ] Open .docx file - Word embeds
- [ ] Open .xlsx file - Excel embeds
- [ ] Open .pptx file - PowerPoint embeds
- [ ] Click "Office AI Assistant" icon
- [ ] See tool buttons (Word, Excel, PowerPoint sections)
- [ ] Click "Append Text" - text appears in Word
- [ ] Click "Create Chart" - chart appears in Excel
- [ ] Click "Add Slide" - slide appears in PowerPoint
- [ ] Multiple documents in tabs
- [ ] Split screen works
- [ ] Resize editor - Office window resizes

---

## Performance Notes

| Operation | Time |
|-----------|------|
| Open Office document | 1-2 seconds |
| Find and embed window | 2-5 seconds (polling) |
| Execute MCP tool | 100-500ms |
| Resize window | Instant |
| Switch tabs | Instant |

---

## Customization Quick Wins

### Add tool to sidebar

**File**: `officeAssistantPanel.ts` line 97

```typescript
const popularToolNames = [
    'word_com_append',
    'YOUR_TOOL_HERE',  // Add this
];
```

### Change sidebar icon

**File**: `office.contribution.ts` line 69

```typescript
icon: 'codicon-book',  // Try: codicon-file-office
```

### Add keyboard shortcut

**File**: `office.contribution.ts` (add at end)

```typescript
import { KeybindingsRegistry } from 'vs/platform/keybinding/common/keybindingsRegistry';
import { KeyCode, KeyMod } from 'vs/base/common/keyCodes';

KeybindingsRegistry.registerCommandAndKeybindingRule({
    id: 'office.newWord',
    weight: 200,
    primary: KeyMod.CtrlCmd | KeyMod.Shift | KeyCode.KeyW,
    handler: () => { /* ... */ }
});
```

---

## Dependencies

### npm
- `@modelcontextprotocol/sdk` - MCP client

### System
- Windows 10/11
- Microsoft Office 2016+ (Desktop)
- PowerShell 5.1+
- Node.js 18+

### Your Code
- MCP server at: `C:\Users\bubun\CascadeProjects\ReactFlow\windsurf-office-mcp\dist\index.js`

---

## File Sizes

| File | Lines | Size |
|------|-------|------|
| officeService.ts | 70 | 2KB |
| officeServiceImpl.ts | 220 | 8KB |
| officeEditor.ts | 270 | 10KB |
| officeAssistantPanel.ts | 280 | 11KB |
| office.contribution.ts | 170 | 7KB |
| **Total** | **1,010** | **38KB** |

---

## Build Commands

```bash
# Development (watch mode)
yarn watch

# Run dev build
./scripts/code.sh

# Production build
yarn gulp vscode-win32-x64

# Clean
yarn gulp clean

# Install deps
yarn

# Add package
yarn add package-name
```

---

## Resources

- **Full Guide**: `VSCODE_OFFICE_FORK_IMPLEMENTATION_GUIDE.md`
- **Technical Docs**: `vscode-office-fork-files/README.md`
- **Summary**: `OFFICE_FORK_SUMMARY.md`
- **VS Code Wiki**: https://github.com/microsoft/vscode/wiki
- **Win32 API**: https://docs.microsoft.com/en-us/windows/win32/

---

## Success Criteria

✅ Open Office files in embedded windows
✅ No title bars/buttons on Office windows
✅ AI assistant sidebar visible
✅ MCP tools execute successfully
✅ Multiple documents in tabs
✅ Split screen works

---

**Total setup time**: 1-2 hours
**Your MCP server**: Already done! ✅
**Integration code**: 38KB (5 files) ✅

**You're 80% done before you even start!** 🎉
