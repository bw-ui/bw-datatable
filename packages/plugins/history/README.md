# @bw-ui/datatable-history

Undo/Redo plugin for BW DataTable - Track and revert changes with keyboard shortcuts.

![Version](https://img.shields.io/npm/v/@bw-ui/datatable-history)
![License](https://img.shields.io/npm/l/@bw-ui/datatable-history)
![Size](https://img.shields.io/bundlephobia/minzip/@bw-ui/datatable-history)

[Live Demo](https://bw-ui.github.io/bw-datatable) • [Documentation](https://www.npmjs.com/package/@bw-ui/datatable-history) • [Core Package](https://www.npmjs.com/package/@bw-ui/datatable)

## ✨ Features

- ↩️ **Undo/Redo** - Revert and replay changes
- ⌨️ **Keyboard Shortcuts** - Ctrl+Z, Ctrl+Y, Ctrl+Shift+Z
- 📚 **History Stack** - Configurable max history size
- 🎯 **Selective Tracking** - Track edits, sort, filter changes
- 🔄 **State Snapshots** - Full state restoration
- 💻 **Cross-platform** - Mac (Cmd) and Windows (Ctrl) support

## 📦 Installation

```bash
npm install @bw-ui/datatable @bw-ui/datatable-history
```

> ⚠️ **Peer Dependency:** Requires `@bw-ui/datatable` core package

## 🚀 Quick Start

### ES Modules

```javascript
import { BWDataTable } from '@bw-ui/datatable';
import { HistoryPlugin } from '@bw-ui/datatable-history';

const table = new BWDataTable('#my-table', {
  data: myData,
  editable: true,
}).use(HistoryPlugin);

// Edit a cell, then:
table.undo(); // Revert change
table.redo(); // Replay change
```

### CDN

```html
<link
  rel="stylesheet"
  href="https://unpkg.com/@bw-ui/datatable/dist/bw-datatable.min.css"
/>
<script src="https://unpkg.com/@bw-ui/datatable/dist/bw-datatable.min.js"></script>
<script src="https://unpkg.com/@bw-ui/datatable-history/dist/history.min.js"></script>

<script>
  const table = new BWDataTable('#my-table', {
    data: myData,
    editable: true,
  }).use(BWHistory);

  // Ctrl+Z to undo, Ctrl+Y to redo
</script>
```

## ⚙️ Options

```javascript
.use(HistoryPlugin, {
  maxHistory: 50,       // Maximum undo stack size
  trackSort: false,     // Track sort changes
  trackFilter: false,   // Track filter changes
  trackSelection: false,// Track selection changes
  shortcuts: true,      // Enable keyboard shortcuts
})
```

### Options Reference

| Option           | Type      | Default | Description                          |
| ---------------- | --------- | ------- | ------------------------------------ |
| `maxHistory`     | `number`  | `50`    | Maximum number of undo steps         |
| `trackSort`      | `boolean` | `false` | Include sort changes in history      |
| `trackFilter`    | `boolean` | `false` | Include filter changes in history    |
| `trackSelection` | `boolean` | `false` | Include selection changes in history |
| `shortcuts`      | `boolean` | `true`  | Enable keyboard shortcuts            |

## ⌨️ Keyboard Shortcuts

| Shortcut                       | Action |
| ------------------------------ | ------ |
| `Ctrl+Z` / `Cmd+Z`             | Undo   |
| `Ctrl+Y` / `Cmd+Y`             | Redo   |
| `Ctrl+Shift+Z` / `Cmd+Shift+Z` | Redo   |

## 📖 Examples

### Basic Undo/Redo

```javascript
const table = new BWDataTable('#table', {
  data: myData,
  editable: true,
}).use(HistoryPlugin);

// Edit some cells...

// Check if can undo
if (table.canUndo()) {
  table.undo();
}

// Check if can redo
if (table.canRedo()) {
  table.redo();
}
```

### Track All Changes

```javascript
.use(HistoryPlugin, {
  trackSort: true,
  trackFilter: true,
  maxHistory: 100,
})
```

### Disable Keyboard Shortcuts

```javascript
.use(HistoryPlugin, {
  shortcuts: false,  // Manual control only
})
```

### History Events

```javascript
table.on('undo', ({ action, timestamp }) => {
  console.log('Undid:', action);
});

table.on('redo', ({ action, timestamp }) => {
  console.log('Redid:', action);
});

table.on('history:change', ({ canUndo, canRedo, undoCount, redoCount }) => {
  // Update UI buttons
  undoBtn.disabled = !canUndo;
  redoBtn.disabled = !canRedo;
});

table.on('history:cleared', () => {
  console.log('History cleared');
});
```

### Undo/Redo Buttons

```html
<button id="undo-btn" onclick="table.undo()">↩ Undo</button>
<button id="redo-btn" onclick="table.redo()">↪ Redo</button>

<script>
  table.on('history:change', ({ canUndo, canRedo }) => {
    document.getElementById('undo-btn').disabled = !canUndo;
    document.getElementById('redo-btn').disabled = !canRedo;
  });
</script>
```

## 📖 API Methods

```javascript
// Undo last action
table.undo(); // Returns: boolean (success)

// Redo last undone action
table.redo(); // Returns: boolean (success)

// Check if can undo/redo
table.canUndo(); // Returns: boolean
table.canRedo(); // Returns: boolean

// Clear all history
table.clearHistory();

// Get history info
table.getHistory(); // Returns: { undoStack, redoStack, canUndo, canRedo }
```

## 🎯 What Gets Tracked

| Action            | Tracked by Default                         |
| ----------------- | ------------------------------------------ |
| Cell edits        | ✅ Yes                                     |
| Row additions     | ✅ Yes                                     |
| Row deletions     | ✅ Yes                                     |
| Sort changes      | ❌ No (enable with `trackSort: true`)      |
| Filter changes    | ❌ No (enable with `trackFilter: true`)    |
| Selection changes | ❌ No (enable with `trackSelection: true`) |

## 🔌 Combining with Other Plugins

```javascript
import { BWDataTable } from '@bw-ui/datatable';
import { HistoryPlugin } from '@bw-ui/datatable-history';
import { ExportPlugin } from '@bw-ui/datatable-export';
import { ClipboardPlugin } from '@bw-ui/datatable-clipboard';

const table = new BWDataTable('#table', { data: myData, editable: true })
  .use(HistoryPlugin) // Undo/Redo
  .use(ExportPlugin) // Export CSV/JSON
  .use(ClipboardPlugin); // Copy/Paste

// All features work together
table.undo();
table.exportCSV();
table.copy();
```

## 📁 What's Included

```
dist/
├── history.min.js       # IIFE build (for <script>)
└── history.esm.min.js   # ESM build (for import)
```

## 🔗 Related Packages

| Package                                                                                | Description     |
| -------------------------------------------------------------------------------------- | --------------- |
| [@bw-ui/datatable](https://www.npmjs.com/package/@bw-ui/datatable)                     | Core (required) |
| [@bw-ui/datatable-export](https://www.npmjs.com/package/@bw-ui/datatable-export)       | Export JSON/CSV |
| [@bw-ui/datatable-url-state](https://www.npmjs.com/package/@bw-ui/datatable-url-state) | URL sync        |
| [@bw-ui/datatable-clipboard](https://www.npmjs.com/package/@bw-ui/datatable-clipboard) | Copy/Paste      |

## 📄 License

MIT © [BW UI](https://github.com/bw-ui)

## 🐛 Issues

Found a bug? [Report it here](https://github.com/bw-ui/bw-datatable/issues)
