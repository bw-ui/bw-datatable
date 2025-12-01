# @bw-ui/datatable-export

Export plugin for BW DataTable - Download data as JSON, CSV, or copy to clipboard.

![Version](https://img.shields.io/npm/v/@bw-ui/datatable-export)
![License](https://img.shields.io/npm/l/@bw-ui/datatable-export)
![Size](https://img.shields.io/bundlephobia/minzip/@bw-ui/datatable-export)

[Live Demo](https://bw-ui.github.io/bw-datatable) • [Documentation](https://www.npmjs.com/package/@bw-ui/datatable-export) • [Core Package](https://www.npmjs.com/package/@bw-ui/datatable)

## ✨ Features

- 📄 **JSON Export** - Download as formatted JSON file
- 📊 **CSV Export** - Excel-compatible CSV download
- 📋 **Clipboard** - Copy to clipboard for pasting
- ✅ **Selected Only** - Export only selected rows
- 👁️ **Visible Only** - Respect hidden columns
- 🎛️ **Customizable** - Custom filename, delimiters

## 📦 Installation

```bash
npm install @bw-ui/datatable @bw-ui/datatable-export
```

> ⚠️ **Peer Dependency:** Requires `@bw-ui/datatable` core package

## 🚀 Quick Start

### ES Modules

```javascript
import { BWDataTable } from '@bw-ui/datatable';
import { ExportPlugin } from '@bw-ui/datatable-export';

const table = new BWDataTable('#my-table', { data: myData }).use(ExportPlugin);

// Export data
table.exportJSON(); // Download .json file
table.exportCSV(); // Download .csv file
table.copyToClipboard(); // Copy to clipboard
```

### CDN

```html
<link
  rel="stylesheet"
  href="https://unpkg.com/@bw-ui/datatable/dist/bw-datatable.min.css"
/>
<script src="https://unpkg.com/@bw-ui/datatable/dist/bw-datatable.min.js"></script>
<script src="https://unpkg.com/@bw-ui/datatable-export/dist/export.min.js"></script>

<script>
  const table = new BWDataTable('#my-table', { data: myData }).use(BWExport);

  // Add export buttons
  document.getElementById('export-csv').onclick = () => table.exportCSV();
  document.getElementById('export-json').onclick = () => table.exportJSON();
</script>
```

## ⚙️ Options

```javascript
.use(ExportPlugin, {
  filename: 'data',        // Base filename (without extension)
  includeHeaders: true,    // Include column headers
  selectedOnly: false,     // Export only selected rows
  visibleOnly: true,       // Export only visible columns
  csvDelimiter: ',',       // CSV field delimiter
  csvQuote: '"',           // CSV quote character
})
```

### Options Reference

| Option           | Type      | Default  | Description                      |
| ---------------- | --------- | -------- | -------------------------------- |
| `filename`       | `string`  | `'data'` | Base filename for downloads      |
| `includeHeaders` | `boolean` | `true`   | Include column headers in export |
| `selectedOnly`   | `boolean` | `false`  | Export only selected rows        |
| `visibleOnly`    | `boolean` | `true`   | Export only visible columns      |
| `csvDelimiter`   | `string`  | `','`    | CSV field delimiter              |
| `csvQuote`       | `string`  | `'"'`    | CSV quote character              |

## 📖 Examples

### Basic Export

```javascript
const table = new BWDataTable('#table', { data: myData }).use(ExportPlugin);

// Download as JSON
table.exportJSON();

// Download as CSV
table.exportCSV();

// Copy to clipboard
table.copyToClipboard();
```

### Export Selected Rows Only

```javascript
// Select some rows first, then:
table.exportCSV({ selectedOnly: true });
```

### Custom Filename

```javascript
table.exportCSV({ filename: 'users-export-2024' });
// Downloads: users-export-2024.csv
```

### Include Headers

```javascript
table.exportCSV({ includeHeaders: true });
// CSV includes header row:
// Id,Name,Email,Role
// 1,John Doe,john@example.com,Admin
```

### European CSV (Semicolon Delimiter)

```javascript
table.exportCSV({
  csvDelimiter: ';',
  filename: 'export',
});
// Output: Id;Name;Email;Role
```

### Export Events

```javascript
table.on('export:before', ({ format, rows, columns }) => {
  console.log(`Exporting ${rows.length} rows as ${format}`);
  // Return false to cancel
});

table.on('export:after', ({ format, filename, rowCount }) => {
  console.log(`Exported ${rowCount} rows to ${filename}`);
});
```

### Get Data for Custom Processing

```javascript
const { rows, columns, data } = table.getExportData();

// Custom processing
const customFormat = data.map((row) => ({
  fullName: row.name,
  contact: row.email,
}));
```

### Export Buttons

```html
<button onclick="table.exportJSON()">📄 Export JSON</button>
<button onclick="table.exportCSV()">📊 Export CSV</button>
<button onclick="table.copyToClipboard().then(() => alert('Copied!'))">
  📋 Copy
</button>
```

## 📖 API Methods

```javascript
// Export as JSON file
table.exportJSON(options?);           // Returns: boolean (success)

// Export as CSV file
table.exportCSV(options?);            // Returns: boolean (success)

// Copy to clipboard
table.copyToClipboard(options?);      // Returns: Promise<boolean>

// Get export data object
table.getExportData(options?);        // Returns: { rows, columns, data }
```

### Override Options Per Call

```javascript
// Override defaults for single call
table.exportCSV({
  filename: 'special-export',
  selectedOnly: true,
  includeHeaders: false,
});
```

## 📄 Output Formats

### JSON

```json
[
  { "id": 1, "name": "John Doe", "email": "john@example.com" },
  { "id": 2, "name": "Jane Smith", "email": "jane@example.com" }
]
```

### CSV

```csv
Id,Name,Email,Role
1,John Doe,john@example.com,Admin
2,Jane Smith,jane@example.com,Editor
```

### Clipboard (Tab-separated)

```
Id	Name	Email	Role
1	John Doe	john@example.com	Admin
2	Jane Smith	jane@example.com	Editor
```

## 🔌 Combining with Other Plugins

```javascript
import { BWDataTable } from '@bw-ui/datatable';
import { ExportPlugin } from '@bw-ui/datatable-export';
import { HistoryPlugin } from '@bw-ui/datatable-history';

const table = new BWDataTable('#table', { data: myData })
  .use(ExportPlugin)
  .use(HistoryPlugin);

// Edit, undo, then export
table.undo();
table.exportCSV();
```

## 📁 What's Included

```
dist/
├── export.min.js       # IIFE build (for <script>)
└── export.esm.min.js   # ESM build (for import)
```

## 🔗 Related Packages

| Package                                                                                | Description     |
| -------------------------------------------------------------------------------------- | --------------- |
| [@bw-ui/datatable](https://www.npmjs.com/package/@bw-ui/datatable)                     | Core (required) |
| [@bw-ui/datatable-history](https://www.npmjs.com/package/@bw-ui/datatable-history)     | Undo/Redo       |
| [@bw-ui/datatable-url-state](https://www.npmjs.com/package/@bw-ui/datatable-url-state) | URL sync        |
| [@bw-ui/datatable-clipboard](https://www.npmjs.com/package/@bw-ui/datatable-clipboard) | Copy/Paste      |

## 📄 License

MIT © [BW UI](https://github.com/bw-ui)

## 🐛 Issues

Found a bug? [Report it here](https://github.com/bw-ui/bw-datatable/issues)
