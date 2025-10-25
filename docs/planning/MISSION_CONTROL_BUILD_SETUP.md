# Mission Control React Bundle Setup

## Overview
This document outlines the steps to bundle and integrate the Mission Control React dashboard into VS Code.

## Current Status
✅ Webview infrastructure created (`missionControlWebview.ts`, `missionControlPanel.ts`)
✅ Panel registered in VS Code UI
✅ Build scripts created (`build-mission-control.js`, `react-shim.js`)
⏳ Dependencies need to be installed
⏳ Bundle needs to be generated
⏳ Webview HTML needs to load bundled app

## Dependencies Required

### 1. Add to VS Code's package.json
```bash
cd /mnt/c/Users/bubun/CascadeProjects/vscode-fork
npm install --save-dev esbuild
```

### 2. Copy Mission Control Dependencies
The Mission Control app needs these dependencies (already in mission-control-dashboard):
- react
- react-dom
- @xyflow/react (for Flow diagram)
- lucide-react (for icons)
- tailwindcss (for styling)

## Build Process

### Step 1: Install esbuild
```bash
cd /mnt/c/Users/bubun/CascadeProjects/vscode-fork
npm install --save-dev esbuild
```

### Step 2: Build the React Bundle
```bash
cd /mnt/c/Users/bubun/CascadeProjects/vscode-fork/src/vs/workbench/contrib/aiOrchestrator/browser/media
node build-mission-control.js
```

This will create: `mission-control-bundle.js`

### Step 3: Update Webview HTML
The `missionControlWebview.ts` needs to be updated to load the bundled JavaScript instead of the placeholder HTML.

## File Structure

```
vscode-fork/
└── src/vs/workbench/contrib/aiOrchestrator/
    ├── browser/
    │   ├── missionControlPanel.ts         (✅ Created - ViewPane wrapper)
    │   ├── missionControlWebview.ts       (✅ Created - Webview logic)
    │   ├── aiOrchestrator.contribution.ts (✅ Updated - Panel registered)
    │   └── media/
    │       ├── build-mission-control.js   (✅ Created - Build script)
    │       ├── react-shim.js              (✅ Created - React globals)
    │       ├── mission-control-bundle.js  (⏳ To be generated)
    │       └── mission-control.css        (⏳ To be generated)
    ├── common/
    │   └── aiOrchestratorService.ts       (✅ Exists)
    └── node/
        └── aiOrchestratorServiceImpl.ts   (✅ Exists)
```

## Integration Steps

### Phase 1: Bundle Generation (Current)
1. Install esbuild dependency
2. Run build script to generate bundle
3. Verify bundle is created successfully

### Phase 2: Load Bundle in Webview
Update `getWebviewHtml()` in `missionControlWebview.ts`:
```typescript
private getWebviewHtml(): string {
    const scriptUri = this.webview!.asWebviewUri(
        URI.file(path.join(__dirname, 'media', 'mission-control-bundle.js'))
    );

    return `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="Content-Security-Policy"
          content="default-src 'none';
                   script-src ${this.webview!.cspSource} 'unsafe-inline';
                   style-src ${this.webview!.cspSource} 'unsafe-inline';">
    <title>Mission Control</title>
</head>
<body>
    <div id="root"></div>
    <script src="${scriptUri}"></script>
</body>
</html>`;
}
```

### Phase 3: Message Passing
Implement bidirectional communication:
- Extension → Webview: Send project data, task updates
- Webview → Extension: Handle user actions (start task, update phase, etc.)

### Phase 4: State Synchronization
Connect React app to AI Orchestrator service:
- Replace mock data with real data from `IAIOrchestratorService`
- Update React state when extension state changes
- Persist UI state (active tab, expanded sections, etc.)

## Testing Plan

### 1. Verify Bundle Generation
```bash
# Check bundle was created
ls -lh src/vs/workbench/contrib/aiOrchestrator/browser/media/mission-control-bundle.js

# Check bundle size (should be <1MB)
```

### 2. Test Webview Loading
1. Open VS Code with the fork: `./scripts/code.sh`
2. Click AI Orchestrator icon in Activity Bar
3. Verify Mission Control panel appears
4. Check browser console for errors (Help → Toggle Developer Tools)

### 3. Test Message Passing
1. Click test button in webview
2. Verify message appears in extension console
3. Check bidirectional communication works

### 4. Test React App
1. Verify all tabs render (Dashboard, Tree, Gantt, Kanban, Flow, Docs)
2. Check AI Assistant sidebar loads
3. Test tab switching
4. Verify mock data displays correctly

## Known Issues & Solutions

### Issue: esbuild Cannot Find React
**Solution:** Use `inject` option in build script to provide React globals

### Issue: Tailwind CSS Not Applied
**Solution:** Extract CSS to separate file and load in webview HTML

### Issue: @xyflow/react Not Bundling
**Solution:** Mark as external or use cdn fallback

### Issue: CSP Blocks Inline Styles
**Solution:** Extract all styles to external CSS file

## Performance Considerations

1. **Bundle Size**: Target <500KB for fast loading
2. **Code Splitting**: Not needed for initial version (single bundle)
3. **Lazy Loading**: Defer non-critical components
4. **Memoization**: Already implemented in React components

## Next Actions

1. ✅ Create build infrastructure
2. ⏳ Wait for VS Code compilation to complete
3. ⏳ Install esbuild dependency
4. ⏳ Run initial bundle build
5. ⏳ Test bundle in VS Code
6. ⏳ Update webview to load bundle
7. ⏳ Implement message passing
8. ⏳ Connect to orchestrator service

## References

- VS Code Webview API: https://code.visualstudio.com/api/extension-guides/webview
- esbuild Documentation: https://esbuild.github.io/
- React in Webviews: https://code.visualstudio.com/api/extension-guides/webview#using-web-frameworks
