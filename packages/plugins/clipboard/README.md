# @bw-ui/datatable-clipboard

Copy/Paste plugin for BW DataTable - Excel-compatible clipboard operations.

![Version](https://img.shields.io/npm/v/@bw-ui/datatable-clipboard)
![License](https://img.shields.io/npm/l/@bw-ui/datatable-clipboard)
![Size](https://img.shields.io/bundlephobia/minzip/@bw-ui/datatable-clipboard)

[Live Demo](https://bw-ui.github.io/bw-datatable) • [Documentation](https://www.npmjs.com/package/@bw-ui/datatable-clipboard) • [Core Package](https://www.npmjs.com/package/@bw-ui/datatable)

## ✨ Features

- 📋 **Copy Rows** - Copy selected rows to clipboard
- 📥 **Paste Data** - Paste from Excel, Sheets, or any tab-separated source
- ⌨️ **Keyboard Shortcuts** - Ctrl+C, Ctrl+V (Cmd on Mac)
- 📊 **Excel Compatible** - Tab-separated format works with Excel/Sheets
- 🔄 **Type Conversion** - Smart number/boolean conversion on paste
- 🎯 **Append or Replace** - Choose how pasted data is added

## 📦 Installation

```bash
npm install @bw-ui/datatable @bw-ui/datatable-clipboard
```

> ⚠️ **Peer Dependency:** Requires `@bw-ui/datatable` core package

## 🚀 Quick Start

### ES Modules

```javascript
import { BWDataTable } from '@bw-ui/datatable';
import { ClipboardPlugin } from '@bw-ui/datatable-clipboard';

const table = new BWDataTable('#my-table', {
  data: myData,
  selectable: true,
}).use(ClipboardPlugin);

// Select rows, then Ctrl+C to copy
// Ctrl+V to paste from Excel
```

### CDN

```html
<link
  rel="stylesheet"
  href="https://unpkg.com/@bw-ui/datatable/dist/bw-datatable.min.css"
/>
<script src="https://unpkg.com/@bw-ui/datatable/dist/bw-datatable.min.js"></script>
<script src="https://unpkg.com/@bw-ui/datatable-clipboard/dist/clipboard.min.js"></script>

<script>
  const table = new BWDataTable('#my-table', {
    data: myData,
    selectable: true,
  }).use(BWClipboard);

  // Ctrl+C to copy, Ctrl+V to paste
</script>
```

## ⚙️ Options

```javascript
.use(ClipboardPlugin, {
  shortcuts: true,        // Enable Ctrl+C, Ctrl+V
  copyHeaders: false,     // Include headers when copying
  pasteMode: 'append',    // 'append' | 'replace'
})
```

### Options Reference

| Option        | Type      | Default    | Description                                         |
| ------------- | --------- | ---------- | --------------------------------------------------- |
| `shortcuts`   | `boolean` | `true`     | Enable keyboard shortcuts                           |
| `copyHeaders` | `boolean` | `false`    | Include column headers when copying                 |
| `pasteMode`   | `string`  | `'append'` | `'append'` adds rows, `'replace'` replaces selected |

## ⌨️ Keyboard Shortcuts

| Shortcut           | Action               |
| ------------------ | -------------------- |
| `Ctrl+C` / `Cmd+C` | Copy selected rows   |
| `Ctrl+V` / `Cmd+V` | Paste clipboard data |

## 📖 Examples

### Basic Copy/Paste

```javascript
const table = new BWDataTable('#table', {
  data: myData,
  selectable: true,
}).use(ClipboardPlugin);

// Select rows with checkboxes
// Press Ctrl+C to copy
// Paste in Excel or another table
```

### Programmatic Copy

```javascript
// Select rows first
table.selectAll();

// Copy to clipboard
table.copy().then((success) => {
  if (success) {
    console.log('Copied!');
  }
});
```

### Programmatic Paste

```javascript
// Paste from clipboard
table.paste().then((success) => {
  if (success) {
    console.log('Pasted!');
  }
});
```

### Copy with Headers

```javascript
.use(ClipboardPlugin, {
  copyHeaders: true,
})

// Copied data includes header row:
// Id    Name    Email    Role
// 1     John    john@example.com    Admin
```

### Replace Mode

```javascript
.use(ClipboardPlugin, {
  pasteMode: 'replace',
})

// When pasting:
// - Selected rows are removed
// - Pasted rows take their place
```

### Clipboard Events

```javascript
table.on('clipboard:copy', ({ rowCount, content }) => {
  console.log(`Copied ${rowCount} rows`);
});

table.on('clipboard:before-paste', ({ parsedRows, columns }) => {
  console.log(`About to paste ${parsedRows.length} rows`);
  // Return false to cancel
});

table.on('clipboard:paste', ({ rowCount, rows, mode }) => {
  console.log(`Pasted ${rowCount} rows (${mode} mode)`);
});
```

### Copy/Paste Buttons

```html
<button onclick="table.copy()">📋 Copy</button>
<button onclick="table.paste()">📥 Paste</button>
```

## 📖 API Methods

```javascript
// Copy selected rows to clipboard
table.copy(options?);       // Returns: Promise<boolean>

// Paste from clipboard
table.paste(options?);      // Returns: Promise<boolean>
```

### Override Options Per Call

```javascript
// Copy with headers just this time
table.copy({ copyHeaders: true });

// Paste in replace mode just this time
table.paste({ pasteMode: 'replace' });
```

## 📊 Data Format

### Copied Data (Tab-separated)

```
1	John Doe	john@example.com	Admin
2	Jane Smith	jane@example.com	Editor
3	Bob Wilson	bob@example.com	Viewer
```

### Pasting from Excel

1. Select cells in Excel
2. Copy (Ctrl+C)
3. Click on table
4. Paste (Ctrl+V or `table.paste()`)

**Note:** Columns are mapped by position, not by header name. Ensure your Excel columns match the table column order.

## 🔄 Type Conversion

When pasting, the plugin automatically converts values based on column type:

| Column Type | Conversion                      |
| ----------- | ------------------------------- |
| `number`    | `"123"` → `123`                 |
| `boolean`   | `"true"`, `"1"`, `"✓"` → `true` |
| `string`    | No conversion                   |

## 🔌 Combining with Other Plugins

```javascript
import { BWDataTable } from '@bw-ui/datatable';
import { ClipboardPlugin } from '@bw-ui/datatable-clipboard';
import { HistoryPlugin } from '@bw-ui/datatable-history';
import { ExportPlugin } from '@bw-ui/datatable-export';

const table = new BWDataTable('#table', { data: myData, selectable: true })
  .use(ClipboardPlugin) // Copy/Paste
  .use(HistoryPlugin) // Undo/Redo (undo paste!)
  .use(ExportPlugin); // Export CSV/JSON

// Paste data, then undo if needed
table.paste();
table.undo(); // Reverts paste
```

## 📁 What's Included

```
dist/
├── clipboard.min.js       # IIFE build (for <script>)
└── clipboard.esm.min.js   # ESM build (for import)
```

## 🔗 Related Packages

| Package                                                                                | Description     |
| -------------------------------------------------------------------------------------- | --------------- |
| [@bw-ui/datatable](https://www.npmjs.com/package/@bw-ui/datatable)                     | Core (required) |
| [@bw-ui/datatable-history](https://www.npmjs.com/package/@bw-ui/datatable-history)     | Undo/Redo       |
| [@bw-ui/datatable-export](https://www.npmjs.com/package/@bw-ui/datatable-export)       | Export JSON/CSV |
| [@bw-ui/datatable-url-state](https://www.npmjs.com/package/@bw-ui/datatable-url-state) | URL sync        |

## 📄 License

MIT © [BW UI](https://github.com/bw-ui)

## 🐛 Issues

Found a bug? [Report it here](https://github.com/bw-ui/bw-datatable/issues)
