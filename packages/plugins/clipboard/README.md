# @bw-ui/datatable-clipboard

Copy/Paste plugin for BWDataTable with Excel compatibility.

## Features

- 📋 **Copy to Clipboard** - Tab-separated format (Excel/Sheets compatible)
- 📥 **Paste from Clipboard** - Parse and add rows from Excel/Sheets
- ⌨️ **Keyboard Shortcuts** - Ctrl+C, Ctrl+V
- 🎯 **Smart Paste** - Auto-detect headers, type conversion

## Installation

```bash
npm install @bw-ui/datatable-clipboard
```

## Usage

```javascript
import { BWDataTable } from '@bw-ui/datatable';
import { ClipboardPlugin } from '@bw-ui/datatable-clipboard';

const table = new BWDataTable('#table', { data }).use(ClipboardPlugin, {
  copyHeaders: true, // Include headers when copying (default: true)
  shortcuts: true, // Enable Ctrl+C/V shortcuts (default: true)
});

// Copy selected rows
table.copy();

// Copy all visible rows
table.copyAll();

// Paste from clipboard
table.paste();
```

## Options

| Option        | Type      | Default | Description                    |
| ------------- | --------- | ------- | ------------------------------ |
| `copyHeaders` | `boolean` | `true`  | Include column headers in copy |
| `shortcuts`   | `boolean` | `true`  | Enable keyboard shortcuts      |

## Keyboard Shortcuts

| Shortcut           | Action               |
| ------------------ | -------------------- |
| `Ctrl+C` / `Cmd+C` | Copy selected rows   |
| `Ctrl+V` / `Cmd+V` | Paste from clipboard |

## API

### Methods (added to table)

```javascript
// Copy selected rows to clipboard
table.copy(); // Returns: boolean
table.copy(true); // Copy only selected (default)
table.copy(false); // Copy all visible rows

// Copy all visible rows
table.copyAll(); // Returns: boolean

// Paste from clipboard
table.paste(); // Adds rows to table
```

## Events

```javascript
// After copy
table.on('clipboard:copy', ({ count, text }) => {
  console.log(`Copied ${count} rows`);
  // text contains tab-separated data
});

// After paste
table.on('clipboard:paste', ({ rows, count, text }) => {
  console.log(`Pasted ${count} rows`);
  // rows contains parsed row objects
});
```

## Copy Format

Data is copied as tab-separated values (TSV):

```
Name	Email	Salary
John	john@example.com	50000
Jane	jane@example.com	60000
```

This format is compatible with:

- Microsoft Excel
- Google Sheets
- Apple Numbers
- LibreOffice Calc
- Any TSV-compatible application

## Paste Behavior

When pasting:

1. **Header Detection** - If first row matches column headers, it's skipped
2. **Type Conversion** - Numbers and booleans are automatically converted
3. **ID Generation** - New rows get unique IDs (`pasted_<timestamp>_<index>`)
4. **Append Mode** - Pasted rows are added to existing data

### Supported Paste Sources

- Excel (Ctrl+C from cells)
- Google Sheets
- TSV/CSV text
- Any tab-separated or newline-separated data

## Example: Copy/Paste Workflow

```javascript
const table = new BWDataTable('#table', { data }).use(ClipboardPlugin);

// 1. User selects rows with checkboxes
// 2. User presses Ctrl+C
// 3. Data is copied to clipboard

table.on('clipboard:copy', ({ count }) => {
  showToast(`Copied ${count} rows`);
});

// 4. User opens Excel, pastes with Ctrl+V
// 5. User makes changes in Excel
// 6. User copies from Excel, comes back to table
// 7. User presses Ctrl+V

table.on('clipboard:paste', ({ count }) => {
  showToast(`Added ${count} rows`);
  table.scrollToBottom();
});
```

## Example: Export Button

```javascript
const table = new BWDataTable('#table', { data }).use(ClipboardPlugin);

document.getElementById('copyAll').addEventListener('click', () => {
  table.copyAll();
});

document.getElementById('copySelected').addEventListener('click', () => {
  const selected = table.getSelected();
  if (selected.length === 0) {
    alert('Select some rows first');
    return;
  }
  table.copy();
});
```

## TypeScript

```typescript
import { BWDataTable } from '@bw-ui/datatable';
import {
  ClipboardPlugin,
  ClipboardPluginOptions,
} from '@bw-ui/datatable-clipboard';

const options: ClipboardPluginOptions = {
  copyHeaders: true,
  shortcuts: true,
};

const table = new BWDataTable('#table', { data }).use(ClipboardPlugin, options);

table.on('clipboard:copy', ({ count, text }) => {
  // Typed event data
});
```

## Browser Permissions

The Clipboard API requires:

- **HTTPS** or localhost
- **User interaction** (click, keyboard)
- Browser permission (usually auto-granted)

If clipboard access fails, check browser console for permission errors.

## License

MIT © [BW UI](https://github.com/AshwinPavanKadha/bw-ui)
