# @bw-ui/datatable-history

Undo/Redo plugin for BWDataTable.

## Features

- ⏪ **Undo/Redo** - Revert cell edits, selection changes
- ⌨️ **Keyboard Shortcuts** - Ctrl+Z, Ctrl+Y, Ctrl+Shift+Z
- 📚 **History Stack** - Configurable max history size
- 🔄 **Full State Restore** - Data, sort, filters, selection

## Installation

```bash
npm install @bw-ui/datatable-history
```

## Usage

```javascript
import { BWDataTable } from '@bw-ui/datatable';
import { HistoryPlugin } from '@bw-ui/datatable-history';

const table = new BWDataTable('#table', { data }).use(HistoryPlugin, {
  maxHistory: 50, // Max undo states (default: 50)
  shortcuts: true, // Enable keyboard shortcuts (default: true)
});

// Programmatic undo/redo
table.undo();
table.redo();

// Check availability
if (table.canUndo()) {
  console.log('Can undo');
}

if (table.canRedo()) {
  console.log('Can redo');
}

// Clear history
table.clearHistory();

// Get history state
const history = table.getHistory();
console.log(
  `Undo: ${history.undoStack.length}, Redo: ${history.redoStack.length}`
);
```

## Options

| Option       | Type      | Default | Description                 |
| ------------ | --------- | ------- | --------------------------- |
| `maxHistory` | `number`  | `50`    | Maximum undo states to keep |
| `shortcuts`  | `boolean` | `true`  | Enable keyboard shortcuts   |

## Keyboard Shortcuts

| Shortcut                       | Action |
| ------------------------------ | ------ |
| `Ctrl+Z` / `Cmd+Z`             | Undo   |
| `Ctrl+Y` / `Cmd+Y`             | Redo   |
| `Ctrl+Shift+Z` / `Cmd+Shift+Z` | Redo   |

## API

### Methods (added to table)

```javascript
// Undo last action
table.undo(); // Returns: boolean (true if undone)

// Redo last undone action
table.redo(); // Returns: boolean (true if redone)

// Check if undo is available
table.canUndo(); // Returns: boolean

// Check if redo is available
table.canRedo(); // Returns: boolean

// Clear all history
table.clearHistory();

// Get history state
table.getHistory();
// Returns: {
//   undoStack: HistorySnapshot[],
//   redoStack: HistorySnapshot[],
//   canUndo: boolean,
//   canRedo: boolean,
// }
```

## Events

```javascript
// History state changed
table.on('history:change', ({ canUndo, canRedo, undoCount, redoCount }) => {
  // Update UI buttons
  undoBtn.disabled = !canUndo;
  redoBtn.disabled = !canRedo;
});

// After undo
table.on('history:undo', ({ action }) => {
  console.log('Undid:', action);
});

// After redo
table.on('history:redo', ({ action }) => {
  console.log('Redid:', action);
});

// History cleared
table.on('history:clear', () => {
  console.log('History cleared');
});
```

## What Gets Tracked

The History plugin automatically tracks:

- ✅ **Cell edits** - When you edit a cell value
- ✅ **Row selection** - When selection changes
- ✅ **Sort state** - Column and direction
- ✅ **Filter state** - Search term and column filters

## Example: Undo/Redo Buttons

```javascript
const table = new BWDataTable('#table', { data }).use(HistoryPlugin);

const undoBtn = document.getElementById('undo');
const redoBtn = document.getElementById('redo');

// Update button states
table.on('history:change', ({ canUndo, canRedo }) => {
  undoBtn.disabled = !canUndo;
  redoBtn.disabled = !canRedo;
});

undoBtn.addEventListener('click', () => table.undo());
redoBtn.addEventListener('click', () => table.redo());
```

## TypeScript

```typescript
import { BWDataTable } from '@bw-ui/datatable';
import { HistoryPlugin, HistoryPluginOptions } from '@bw-ui/datatable-history';

const options: HistoryPluginOptions = {
  maxHistory: 100,
  shortcuts: true,
};

const table = new BWDataTable('#table', { data }).use(HistoryPlugin, options);

// Methods are typed
const canUndo: boolean = table.canUndo();
const history = table.getHistory();
```

## License

MIT © [BW UI](https://github.com/AshwinPavanKadha/bw-ui)
