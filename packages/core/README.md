# @bw-ui/datatable

High-performance virtual scrolling data table with zero dependencies.

[![npm version](https://img.shields.io/npm/v/@bw-ui/datatable.svg)](https://www.npmjs.com/package/@bw-ui/datatable)
[![bundle size](https://img.shields.io/bundlephobia/minzip/@bw-ui/datatable)](https://bundlephobia.com/package/@bw-ui/datatable)

## Features

- 🚀 **Virtual Scrolling** - Handle 100k+ rows efficiently by rendering only visible rows (~50-70 DOM nodes regardless of data size)
- ✏️ **Inline Editing** - Click to focus, click again to edit, Tab/Enter navigation
- 🔍 **Sorting & Filtering** - Fast client-side sort and search
- ✅ **Row Selection** - Single, multi-select with Ctrl/Shift, select all
- 🔌 **Plugin System** - Extend with History, Clipboard, Export, Commands
- 📦 **Zero Dependencies** - Pure vanilla JavaScript
- 🎨 **Customizable** - CSS variables, custom renderers, themes
- ♿ **Accessible** - Keyboard navigation, ARIA attributes

## Installation

```bash
npm install @bw-ui/datatable
```

## Quick Start

```html
<link rel="stylesheet" href="@bw-ui/datatable/dist/bw-datatable.min.css" />
<script src="@bw-ui/datatable/dist/bw-datatable.min.js"></script>

<div id="table"></div>

<script>
  const table = new BWDataTable('#table', {
    data: [
      { id: 1, name: 'John', email: 'john@example.com', salary: 50000 },
      { id: 2, name: 'Jane', email: 'jane@example.com', salary: 60000 },
      // ... more rows
    ],
    rowHeight: 44,
    sortable: true,
    filterable: true,
    editable: true,
  });
</script>
```

### ES Modules

```javascript
import { BWDataTable } from '@bw-ui/datatable';
import '@bw-ui/datatable/dist/bw-datatable.min.css';

const table = new BWDataTable('#table', { data: myData });
```

## Configuration Options

| Option       | Type                 | Default     | Description                              |
| ------------ | -------------------- | ----------- | ---------------------------------------- |
| `data`       | `array`              | `[]`        | Array of row objects                     |
| `columns`    | `Column[]`           | auto-detect | Column definitions (see below)           |
| `rowHeight`  | `number`             | `40`        | Fixed row height in pixels               |
| `bufferSize` | `number`             | `20`        | Extra rows rendered above/below viewport |
| `rowId`      | `string \| function` | `'id'`      | Field or function to get unique row ID   |
| `sortable`   | `boolean`            | `true`      | Enable column sorting                    |
| `filterable` | `boolean`            | `true`      | Enable global search                     |
| `selectable` | `boolean`            | `true`      | Enable row selection                     |
| `editable`   | `boolean`            | `true`      | Enable inline cell editing               |
| `resizable`  | `boolean`            | `false`     | Enable column resizing                   |
| `onReady`    | `function`           | -           | Callback when table is initialized       |

### Column Definition

```javascript
const columns = [
  {
    id: 'name', // Required: unique identifier
    field: 'name', // Data field (defaults to id)
    header: 'Full Name', // Display header
    type: 'string', // 'string' | 'number' | 'boolean' | 'date'
    width: '200px', // Column width
    sortable: true, // Enable sorting (default: true)
    filterable: true, // Enable filtering (default: true)
    editable: true, // Enable editing (default: true)
    align: 'left', // 'left' | 'center' | 'right'

    // Custom cell renderer
    render: (value, row, column) => {
      return `<strong>${value}</strong>`;
    },
  },
  {
    id: 'salary',
    type: 'number',
    render: (value) => `$${value.toLocaleString()}`,
  },
  {
    id: 'active',
    type: 'boolean',
    render: (value) => (value ? '✅' : '❌'),
  },
];

const table = new BWDataTable('#table', { data, columns });
```

## Keyboard Navigation

### Cell Navigation (when editable)

| Key          | Action                             |
| ------------ | ---------------------------------- |
| `Tab`        | Move to next cell                  |
| `Shift+Tab`  | Move to previous cell              |
| `Arrow Keys` | Navigate between cells             |
| `Enter`      | Start editing / Save and move down |
| `Escape`     | Cancel edit / Clear focus          |
| `Home`       | Go to first row                    |
| `End`        | Go to last row                     |

### While Editing

| Key         | Action                         |
| ----------- | ------------------------------ |
| `Enter`     | Save and move to next row      |
| `Tab`       | Save and move to next cell     |
| `Shift+Tab` | Save and move to previous cell |
| `Escape`    | Cancel edit (revert value)     |

### Scroll Navigation

| Key         | Action               |
| ----------- | -------------------- |
| `Page Down` | Scroll down one page |
| `Page Up`   | Scroll up one page   |
| `Home`      | Scroll to top        |
| `End`       | Scroll to bottom     |

## API Reference

### Data Methods

```javascript
// Set new data
table.setData(newData);

// Get all data
const allData = table.getData();

// Get filtered/sorted data
const filteredData = table.getFilteredData();

// Get row counts
const { total, filtered } = table.getRowCount();

// Get single row by ID
const row = table.getRowById('123');

// Update single cell
table.updateCell('123', 'name', 'New Name');

// Update entire row
table.updateRow('123', { name: 'New Name', salary: 75000 });
```

### Sort Methods

```javascript
// Sort ascending
table.sort('name', 'asc');

// Sort descending
table.sort('salary', 'desc');

// Clear sort
table.clearSort();
```

### Filter Methods

```javascript
// Global search
table.filter('john');

// Filter specific column
table.filterColumn('department', 'Engineering');

// Clear all filters
table.clearFilters();

// Reset everything (filters + sort)
table.reset();
```

### Selection Methods

```javascript
// Get selected rows
const selected = table.getSelected();

// Get selected IDs
const ids = table.getSelectedIds();

// Select all visible rows
table.selectAll();

// Clear selection
table.clearSelection();
```

### Navigation Methods

```javascript
// Scroll to specific row (0-indexed)
table.scrollToRow(500);

// Scroll to top
table.scrollToTop();

// Scroll to bottom
table.scrollToBottom();
```

### State Methods

```javascript
// Get current state
const state = table.getState();
// Returns: { data, view, columns, selected, sort, globalFilter, columnFilters, rowCount, totalCount }

// Force re-render
table.render();

// Destroy table
table.destroy();
```

## Events

```javascript
// Sort events
table.on('sort', ({ column, direction }) => {
  console.log(`Sorted by ${column} ${direction}`);
});

// Filter events
table.on('filter', ({ term }) => {
  console.log(`Filtered: "${term}"`);
});

table.on('filter:clear', () => {
  console.log('Filters cleared');
});

// Selection events
table.on('selection:change', ({ selected, count }) => {
  console.log(`${count} rows selected`);
});

// Cell edit events
table.on('cell:edit:start', ({ rowId, columnId, value }) => {
  console.log(`Started editing ${columnId}`);
});

table.on('cell:edit', ({ rowId, columnId, oldValue, newValue }) => {
  console.log(`${columnId} changed from ${oldValue} to ${newValue}`);
});

table.on('cell:edit:end', ({ rowId, columnId, oldValue, newValue }) => {
  console.log('Edit completed');
});

table.on('cell:edit:cancel', () => {
  console.log('Edit cancelled');
});

// Row update
table.on('row:update', ({ rowId, oldRow, newRow }) => {
  console.log('Row updated:', rowId);
});

// Table ready
table.on('table:ready', ({ table }) => {
  console.log('Table initialized');
});

// Unsubscribe
const handler = (data) => console.log(data);
table.on('sort', handler);
table.off('sort', handler);
```

## Plugins

Extend functionality with official plugins:

```javascript
import { BWDataTable } from '@bw-ui/datatable';
import { HistoryPlugin } from '@bw-ui/datatable-history';
import { ClipboardPlugin } from '@bw-ui/datatable-clipboard';
import { ExportPlugin } from '@bw-ui/datatable-export';
import { CommandPlugin } from '@bw-ui/datatable-command';
import { UrlStatePlugin } from '@bw-ui/datatable-url-state';

const table = new BWDataTable('#table', { data })
  .use(HistoryPlugin, { maxHistory: 50 })
  .use(ClipboardPlugin, { copyHeaders: true })
  .use(ExportPlugin)
  .use(CommandPlugin, { shortcut: true })
  .use(UrlStatePlugin, { persist: true });

// Plugin methods are added to table instance
table.undo(); // HistoryPlugin
table.copy(); // ClipboardPlugin
table.exportCSV(); // ExportPlugin
```

See individual plugin documentation for details.

## Styling

### CSS Variables

```css
:root {
  /* Colors */
  --bw-dt-bg: #ffffff;
  --bw-dt-border: #e5e7eb;
  --bw-dt-text: #1f2937;
  --bw-dt-text-secondary: #6b7280;

  /* Header */
  --bw-dt-header-bg: #f9fafb;
  --bw-dt-header-text: #374151;

  /* Rows */
  --bw-dt-row-hover: #f3f4f6;
  --bw-dt-row-selected: #eff6ff;
  --bw-dt-row-selected-border: #3b82f6;

  /* Sort */
  --bw-dt-sort-icon: #9ca3af;
  --bw-dt-sort-active: #3b82f6;

  /* Layout */
  --bw-dt-radius: 8px;
  --bw-dt-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  --bw-dt-font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto,
    sans-serif;
  --bw-dt-font-size: 14px;
}
```

### Dark Theme Example

```css
.dark-theme .bw-datatable {
  --bw-dt-bg: #1f2937;
  --bw-dt-border: #374151;
  --bw-dt-text: #f9fafb;
  --bw-dt-text-secondary: #9ca3af;
  --bw-dt-header-bg: #111827;
  --bw-dt-header-text: #f3f4f6;
  --bw-dt-row-hover: #374151;
  --bw-dt-row-selected: #1e3a5f;
}
```

### Custom Container Height

```css
#table .bw-datatable__scroll-container {
  height: 600px; /* Default is 400px */
}
```

## TypeScript

Full TypeScript support included:

```typescript
import { BWDataTable, Column, BWDataTableOptions } from '@bw-ui/datatable';

interface User {
  id: number;
  name: string;
  email: string;
  salary: number;
}

const columns: Column[] = [
  { id: 'name', header: 'Name', type: 'string' },
  { id: 'email', header: 'Email', type: 'string' },
  { id: 'salary', header: 'Salary', type: 'number' },
];

const options: BWDataTableOptions = {
  data: users,
  columns,
  rowHeight: 44,
  editable: true,
};

const table = new BWDataTable('#table', options);

table.on('cell:edit', ({ rowId, columnId, oldValue, newValue }) => {
  // Fully typed event data
});
```

## Browser Support

- Chrome 80+
- Firefox 75+
- Safari 13+
- Edge 80+

## Performance Tips

1. **Use fixed row height** - Required for virtual scrolling
2. **Provide `rowId`** - Helps with efficient updates
3. **Limit columns** - More columns = more rendering
4. **Simple renderers** - Avoid heavy computations in `render()`
5. **Debounce filters** - Built-in 200ms debounce on search input

## License

MIT © [BW UI](https://github.com/AshwinPavanKadha/bw-ui)
