# @bw-ui/datatable

Production-ready data table with plugin architecture - Zero dependencies, vanilla JavaScript.

![Version](https://img.shields.io/npm/v/@bw-ui/datatable)
![License](https://img.shields.io/npm/l/@bw-ui/datatable)
![Size](https://img.shields.io/bundlephobia/minzip/@bw-ui/datatable)

[Live Demo](https://bw-ui.github.io/bw-datatable) • [Documentation](https://www.npmjs.com/package/@bw-ui/datatable) • [Plugins](#-plugins)

## ✨ Features

- 🪶 **Lightweight** - ~32KB minified, zero dependencies
- 🔌 **Plugin Architecture** - Extend with official or custom plugins
- ✏️ **Inline Editing** - Double-click to edit cells
- 🔍 **Search & Filter** - Global search across all columns
- ↕️ **Sorting** - Multi-column sorting support
- 📄 **Pagination** - Built-in pagination controls
- ✅ **Selection** - Single/multi row selection with checkboxes
- 📱 **Responsive** - Mobile-friendly design
- ♿ **Accessible** - Keyboard navigation, ARIA labels
- 🎨 **Themeable** - CSS custom properties for styling

## 📦 Installation

```bash
npm install @bw-ui/datatable
```

## 🚀 Quick Start

### ES Modules

```javascript
import { BWDataTable } from '@bw-ui/datatable';
import '@bw-ui/datatable/dist/bw-datatable.min.css';

const table = new BWDataTable('#my-table', {
  data: [
    { id: 1, name: 'John Doe', email: 'john@example.com', role: 'Admin' },
    { id: 2, name: 'Jane Smith', email: 'jane@example.com', role: 'Editor' },
    { id: 3, name: 'Bob Wilson', email: 'bob@example.com', role: 'Viewer' },
  ],
});
```

### CDN

```html
<link
  rel="stylesheet"
  href="https://unpkg.com/@bw-ui/datatable/dist/bw-datatable.min.css"
/>
<script src="https://unpkg.com/@bw-ui/datatable/dist/bw-datatable.min.js"></script>

<div id="my-table"></div>

<script>
  const table = new BWDataTable('#my-table', {
    data: [
      { id: 1, name: 'John Doe', email: 'john@example.com' },
      { id: 2, name: 'Jane Smith', email: 'jane@example.com' },
    ],
  });
</script>
```

## ⚙️ Options

```javascript
new BWDataTable('#table', {
  // Data
  data: [], // Array of row objects
  columns: null, // Column definitions (auto-detect if null)
  rowId: 'id', // Field to use as row ID

  // Features
  editable: false, // Enable inline editing
  editableColumns: [], // Which columns are editable
  selectable: false, // Enable row selection
  selectionMode: 'multi', // 'single' | 'multi' | 'none'
  sortable: true, // Enable column sorting
  paginated: true, // Enable pagination
  pageSize: 20, // Rows per page
  searchable: true, // Enable global search

  // UI
  showHeader: true, // Show table header
  showFooter: true, // Show pagination footer
  loadingText: 'Loading...', // Loading overlay text
  emptyText: 'No data', // Empty state text

  // Callbacks
  onEditEnd: null, // (rowId, columnId, value, oldValue) => {}
  onSelect: null, // (selectedIds) => {}
  onSort: null, // (column, direction) => {}
  onFilter: null, // (filters) => {}
  onPageChange: null, // (page) => {}
});
```

### Column Definition

```javascript
{
  columns: [
    {
      id: 'name',              // Unique column ID
      header: 'Full Name',     // Header text
      field: 'name',           // Data field (supports dot notation: 'user.name')
      type: 'string',          // 'string' | 'number' | 'boolean' | 'date'
      width: '200px',          // Column width
      sortable: true,          // Enable sorting for this column
      editable: true,          // Enable editing for this column
      hidden: false,           // Hide column
      render: (value, row) => `<strong>${value}</strong>`,  // Custom renderer
    },
    // ... more columns
  ],
}
```

## 📖 Examples

### Editable Table

```javascript
const table = new BWDataTable('#table', {
  data: myData,
  editable: true,
  editableColumns: ['name', 'email', 'role'],
  onEditEnd: (rowId, columnId, value, oldValue) => {
    console.log(`Cell [${rowId}][${columnId}]: ${oldValue} → ${value}`);
    // Save to server...
  },
});
```

### Selectable Table

```javascript
const table = new BWDataTable('#table', {
  data: myData,
  selectable: true,
  selectionMode: 'multi',
  onSelect: (selectedIds) => {
    console.log('Selected:', selectedIds);
  },
});

// Get selected rows
const selected = table.getSelected();
```

### Custom Column Rendering

```javascript
const table = new BWDataTable('#table', {
  data: myData,
  columns: [
    { id: 'name', header: 'Name' },
    { id: 'email', header: 'Email' },
    {
      id: 'status',
      header: 'Status',
      render: (value) =>
        value
          ? '<span class="badge green">Active</span>'
          : '<span class="badge red">Inactive</span>',
    },
    {
      id: 'salary',
      header: 'Salary',
      type: 'number',
      render: (value) => `$${value.toLocaleString()}`,
    },
  ],
});
```

### Search & Filter

```javascript
const table = new BWDataTable('#table', {
  data: myData,
  searchable: true,
});

// Programmatic filtering
table.filter('global', 'john'); // Search all columns
table.filter('role', 'Admin'); // Filter specific column
```

### Sorting

```javascript
const table = new BWDataTable('#table', {
  data: myData,
  sortable: true,
  onSort: (column, direction) => {
    console.log(`Sorted by ${column} ${direction}`);
  },
});

// Programmatic sorting
table.sort('name', 'asc');
table.sort('salary', 'desc');
```

## 🔌 Plugins

Extend functionality with official plugins:

| Package                                                                                | Description        | Size |
| -------------------------------------------------------------------------------------- | ------------------ | ---- |
| [@bw-ui/datatable-history](https://www.npmjs.com/package/@bw-ui/datatable-history)     | Undo/Redo (Ctrl+Z) | ~3KB |
| [@bw-ui/datatable-export](https://www.npmjs.com/package/@bw-ui/datatable-export)       | Export JSON, CSV   | ~2KB |
| [@bw-ui/datatable-url-state](https://www.npmjs.com/package/@bw-ui/datatable-url-state) | URL sync           | ~2KB |
| [@bw-ui/datatable-clipboard](https://www.npmjs.com/package/@bw-ui/datatable-clipboard) | Copy/Paste Excel   | ~3KB |

### Using Plugins

```javascript
import { BWDataTable } from '@bw-ui/datatable';
import { HistoryPlugin } from '@bw-ui/datatable-history';
import { ExportPlugin } from '@bw-ui/datatable-export';

const table = new BWDataTable('#table', { data: myData })
  .use(HistoryPlugin)
  .use(ExportPlugin);

// Now you have undo/redo and export
table.undo();
table.exportCSV();
```

## 📖 API Methods

### Data

```javascript
table.getData(); // Get current rows (filtered/sorted)
table.getOriginalData(); // Get original data
table.setData(newData); // Replace all data
table.addRow(row); // Add single row
table.removeRow(rowId); // Remove row by ID
table.updateRow(rowId, data); // Update row data
```

### Selection

```javascript
table.getSelected(); // Get selected row objects
table.getSelectedIds(); // Get selected row IDs
table.selectAll(); // Select all visible rows
table.clearSelection(); // Clear selection
```

### Sorting & Filtering

```javascript
table.sort(column, 'asc'); // Sort by column
table.filter('global', term); // Global search
table.filter(column, value); // Column filter
table.clearFilters(); // Clear all filters
```

### Pagination

```javascript
table.goToPage(2); // Go to page (0-indexed)
table.setPageSize(50); // Change page size
```

### Editing

```javascript
table.startEdit(rowId, colId); // Start editing cell
table.setCellValue(rowId, colId, value); // Set cell value
```

### Columns

```javascript
table.getVisibleColumns(); // Get visible columns
table.hideColumn(colId); // Hide column
table.showColumn(colId); // Show column
```

### Rendering

```javascript
table.render(); // Re-render table
table.setLoading(true); // Show loading overlay
table.destroy(); // Cleanup and remove
```

## 🎨 Theming

Customize with CSS custom properties:

```css
:root {
  /* Colors */
  --bw-dt-bg: #ffffff;
  --bw-dt-text: #1a1a1a;
  --bw-dt-border: #e5e5e5;
  --bw-dt-header-bg: #f8f9fa;
  --bw-dt-row-hover: #f5f5f5;
  --bw-dt-row-selected: #e3f2fd;
  --bw-dt-primary: #2563eb;

  /* Spacing */
  --bw-dt-cell-padding: 12px 16px;
  --bw-dt-border-radius: 8px;

  /* Typography */
  --bw-dt-font-family: system-ui, sans-serif;
  --bw-dt-font-size: 14px;
}
```

### Dark Mode

```css
[data-theme='dark'] {
  --bw-dt-bg: #1a1a1a;
  --bw-dt-text: #e5e5e5;
  --bw-dt-border: #333333;
  --bw-dt-header-bg: #252525;
  --bw-dt-row-hover: #2a2a2a;
  --bw-dt-row-selected: #1e3a5f;
}
```

## ⌨️ Keyboard Navigation

| Key                      | Action                         |
| ------------------------ | ------------------------------ |
| `↑` `↓` `←` `→`          | Navigate cells                 |
| `Enter`                  | Start editing focused cell     |
| `Escape`                 | Cancel editing                 |
| `Tab`                    | Move to next cell              |
| `Space`                  | Toggle row selection           |
| `Home` / `End`           | Jump to first/last cell in row |
| `Ctrl+Home` / `Ctrl+End` | Jump to first/last row         |

## 📁 What's Included

```
dist/
├── bw-datatable.min.js       # IIFE build (for <script>)
├── bw-datatable.esm.min.js   # ESM build (for import)
└── bw-datatable.min.css      # Styles
```

## 🌐 Browser Support

- Chrome 80+
- Firefox 75+
- Safari 13+
- Edge 80+

## 📄 License

MIT © [BW UI](https://github.com/bw-ui)

## 🐛 Issues

Found a bug? [Report it here](https://github.com/bw-ui/bw-datatable/issues)
