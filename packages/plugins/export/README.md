# @bw-ui/datatable-export

CSV and JSON export plugin for BWDataTable.

## Features

- 📄 **CSV Export** - Download as comma-separated values
- 📋 **JSON Export** - Download as JSON array
- 🎯 **Selective Export** - Export all or selected rows only
- 📝 **Custom Filenames** - Configurable output filename
- ⚡ **Instant Download** - Client-side file generation

## Installation

```bash
npm install @bw-ui/datatable-export
```

## Usage

```javascript
import { BWDataTable } from '@bw-ui/datatable';
import { ExportPlugin } from '@bw-ui/datatable-export';

const table = new BWDataTable('#table', { data }).use(ExportPlugin, {
  filename: 'my-data', // Default filename (default: 'export')
  includeHeaders: true, // Include headers in CSV (default: true)
});

// Export all data to CSV
table.exportCSV();

// Export with custom filename
table.exportCSV('users-report');

// Export only selected rows
table.exportCSV('selected-users', true);

// Export to JSON
table.exportJSON('data-backup');

// Export selected to JSON
table.exportJSON('selected', true);
```

## Options

| Option           | Type      | Default    | Description                          |
| ---------------- | --------- | ---------- | ------------------------------------ |
| `filename`       | `string`  | `'export'` | Default filename (without extension) |
| `includeHeaders` | `boolean` | `true`     | Include column headers in CSV        |

## API

### Methods (added to table)

```javascript
// Export to CSV
table.exportCSV(); // export.csv
table.exportCSV('users'); // users.csv
table.exportCSV('users', true); // Selected rows only
table.exportCSV('users', false); // All rows

// Export to JSON
table.exportJSON(); // export.json
table.exportJSON('data'); // data.json
table.exportJSON('data', true); // Selected rows only
table.exportJSON('data', false); // All rows
```

## Events

```javascript
// After export complete
table.on('export:complete', ({ format, filename, count }) => {
  console.log(`Exported ${count} rows to ${filename}.${format}`);
});
```

## Output Formats

### CSV Format

```csv
Id,Name,Email,Salary
1,John,john@example.com,50000
2,Jane,jane@example.com,60000
```

- Comma-separated values
- First row contains headers (if enabled)
- Values with commas/quotes are properly escaped
- Compatible with Excel, Google Sheets, etc.

### JSON Format

```json
[
  {
    "id": 1,
    "name": "John",
    "email": "john@example.com",
    "salary": 50000
  },
  {
    "id": 2,
    "name": "Jane",
    "email": "jane@example.com",
    "salary": 60000
  }
]
```

- Array of objects
- Pretty-printed for readability
- All data types preserved

## Example: Export Buttons

```html
<button id="exportCSV">Export CSV</button>
<button id="exportJSON">Export JSON</button>
<button id="exportSelected">Export Selected</button>
```

```javascript
const table = new BWDataTable('#table', { data }).use(ExportPlugin);

document.getElementById('exportCSV').addEventListener('click', () => {
  table.exportCSV('users');
});

document.getElementById('exportJSON').addEventListener('click', () => {
  table.exportJSON('users');
});

document.getElementById('exportSelected').addEventListener('click', () => {
  const selected = table.getSelected();
  if (selected.length === 0) {
    alert('Select some rows first');
    return;
  }
  table.exportCSV('selected-users', true);
});
```

## Example: With Date in Filename

```javascript
const table = new BWDataTable('#table', { data }).use(ExportPlugin);

function exportWithDate() {
  const date = new Date().toISOString().split('T')[0];
  table.exportCSV(`users-${date}`);
  // Downloads: users-2024-01-15.csv
}
```

## TypeScript

```typescript
import { BWDataTable } from '@bw-ui/datatable';
import { ExportPlugin, ExportPluginOptions } from '@bw-ui/datatable-export';

const options: ExportPluginOptions = {
  filename: 'report',
  includeHeaders: true,
};

const table = new BWDataTable('#table', { data }).use(ExportPlugin, options);

table.on('export:complete', ({ format, filename, count }) => {
  // Typed event data
});
```

## Notes

- Exports are generated client-side (no server required)
- Large exports may take a moment to generate
- File downloads via browser's native download mechanism
- Respects current filter (exports filtered data)

## License

MIT © [BW UI](https://github.com/AshwinPavanKadha/bw-ui)
