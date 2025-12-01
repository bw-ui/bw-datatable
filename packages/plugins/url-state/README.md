# @bw-ui/datatable-url-state

URL state sync plugin for BW DataTable - Shareable links with filters, sort, and pagination.

![Version](https://img.shields.io/npm/v/@bw-ui/datatable-url-state)
![License](https://img.shields.io/npm/l/@bw-ui/datatable-url-state)
![Size](https://img.shields.io/bundlephobia/minzip/@bw-ui/datatable-url-state)

[Live Demo](https://bw-ui.github.io/bw-datatable) • [Documentation](https://www.npmjs.com/package/@bw-ui/datatable-url-state) • [Core Package](https://www.npmjs.com/package/@bw-ui/datatable)

## ✨ Features

- 🔗 **Shareable Links** - Share table state via URL
- ↕️ **Sync Sort** - Sort column and direction in URL
- 🔍 **Sync Search** - Global search term in URL
- 📄 **Sync Page** - Current page in URL
- 🔙 **Browser History** - Back/Forward navigation support
- 🔄 **Auto Restore** - Restore state from URL on load

## 📦 Installation

```bash
npm install @bw-ui/datatable @bw-ui/datatable-url-state
```

> ⚠️ **Peer Dependency:** Requires `@bw-ui/datatable` core package

## 🚀 Quick Start

### ES Modules

```javascript
import { BWDataTable } from '@bw-ui/datatable';
import { UrlStatePlugin } from '@bw-ui/datatable-url-state';

const table = new BWDataTable('#my-table', { data: myData }).use(
  UrlStatePlugin
);

// URL auto-updates when you:
// - Sort columns    → ?sort=name:asc
// - Search          → ?search=john
// - Change page     → ?page=3
```

### CDN

```html
<link
  rel="stylesheet"
  href="https://unpkg.com/@bw-ui/datatable/dist/bw-datatable.min.css"
/>
<script src="https://unpkg.com/@bw-ui/datatable/dist/bw-datatable.min.js"></script>
<script src="https://unpkg.com/@bw-ui/datatable-url-state/dist/url-state.min.js"></script>

<script>
  const table = new BWDataTable('#my-table', { data: myData }).use(BWUrlState);

  // Sort a column - URL updates automatically
  // Share the URL - recipient sees same view
</script>
```

## ⚙️ Options

```javascript
.use(UrlStatePlugin, {
  prefix: '',           // URL param prefix (e.g., 'table_')
  pushState: true,      // Use pushState (true) or replaceState (false)
  watchPopState: true,  // Listen for browser back/forward
  syncPage: true,       // Sync page number to URL
  syncSort: true,       // Sync sort to URL
  syncFilter: true,     // Sync column filters to URL
  syncSearch: true,     // Sync global search to URL
})
```

### Options Reference

| Option          | Type      | Default | Description                                          |
| --------------- | --------- | ------- | ---------------------------------------------------- |
| `prefix`        | `string`  | `''`    | Prefix for URL params (e.g., `'dt_'` → `?dt_page=2`) |
| `pushState`     | `boolean` | `true`  | Create history entries (back button works)           |
| `watchPopState` | `boolean` | `true`  | Sync state on browser back/forward                   |
| `syncPage`      | `boolean` | `true`  | Sync current page to URL                             |
| `syncSort`      | `boolean` | `true`  | Sync sort column and direction to URL                |
| `syncFilter`    | `boolean` | `true`  | Sync column filters to URL                           |
| `syncSearch`    | `boolean` | `true`  | Sync global search to URL                            |

## 🔗 URL Format

```
?page=2&sort=name:asc&search=john&filter_role=Admin
```

| Param             | Example              | Description               |
| ----------------- | -------------------- | ------------------------- |
| `page`            | `?page=2`            | Current page (1-indexed)  |
| `sort`            | `?sort=name:asc`     | Sort column and direction |
| `search`          | `?search=john`       | Global search term        |
| `filter_[column]` | `?filter_role=Admin` | Column filter             |

## 📖 Examples

### Basic Usage

```javascript
const table = new BWDataTable('#table', { data: myData }).use(UrlStatePlugin);

// Sort by name ascending
table.sort('name', 'asc');
// URL: ?sort=name:asc

// Search for "john"
table.filter('global', 'john');
// URL: ?sort=name:asc&search=john

// Go to page 3
table.goToPage(2);
// URL: ?sort=name:asc&search=john&page=3
```

### With Prefix (Multiple Tables)

```javascript
// Table 1
const table1 = new BWDataTable('#table1', { data: data1 }).use(UrlStatePlugin, {
  prefix: 't1_',
});

// Table 2
const table2 = new BWDataTable('#table2', { data: data2 }).use(UrlStatePlugin, {
  prefix: 't2_',
});

// URL: ?t1_page=2&t1_sort=name:asc&t2_page=1&t2_sort=date:desc
```

### Disable History (Replace State)

```javascript
.use(UrlStatePlugin, {
  pushState: false,  // No history entries created
})

// User can't use browser back button to navigate table states
```

### Sync Only Search

```javascript
.use(UrlStatePlugin, {
  syncPage: false,
  syncSort: false,
  syncFilter: false,
  syncSearch: true,   // Only sync search
})
```

### URL State Events

```javascript
table.on('urlstate:change', ({ params }) => {
  console.log('URL updated:', params);
});

table.on('urlstate:restore', ({ params }) => {
  console.log('State restored from URL:', params);
});
```

## 📖 API Methods

```javascript
// Get current state as URL params object
table.getUrlState();
// Returns: { page: 2, sort: 'name:asc', search: 'john' }

// Set state from params object
table.setUrlState({
  page: 3,
  sort: 'email:desc',
  search: 'admin',
});

// Clear all URL state
table.clearUrlState();

// Manually sync from URL
table.syncUrlToState();

// Manually sync to URL
table.syncStateToUrl();
```

## 🔄 Sharing Links

```javascript
// Get shareable URL
const shareUrl = window.location.href;
console.log('Share this link:', shareUrl);

// When recipient opens the link:
// - Table auto-restores sort, search, page from URL
// - They see exact same view
```

## 🔌 Combining with Other Plugins

```javascript
import { BWDataTable } from '@bw-ui/datatable';
import { UrlStatePlugin } from '@bw-ui/datatable-url-state';
import { HistoryPlugin } from '@bw-ui/datatable-history';
import { ExportPlugin } from '@bw-ui/datatable-export';

const table = new BWDataTable('#table', { data: myData })
  .use(UrlStatePlugin) // URL sync
  .use(HistoryPlugin) // Undo/Redo
  .use(ExportPlugin); // Export

// All features work together
// URL syncs, undo works, export available
```

## 📁 What's Included

```
dist/
├── url-state.min.js       # IIFE build (for <script>)
└── url-state.esm.min.js   # ESM build (for import)
```

## 🔗 Related Packages

| Package                                                                                | Description     |
| -------------------------------------------------------------------------------------- | --------------- |
| [@bw-ui/datatable](https://www.npmjs.com/package/@bw-ui/datatable)                     | Core (required) |
| [@bw-ui/datatable-history](https://www.npmjs.com/package/@bw-ui/datatable-history)     | Undo/Redo       |
| [@bw-ui/datatable-export](https://www.npmjs.com/package/@bw-ui/datatable-export)       | Export JSON/CSV |
| [@bw-ui/datatable-clipboard](https://www.npmjs.com/package/@bw-ui/datatable-clipboard) | Copy/Paste      |

## 📄 License

MIT © [BW UI](https://github.com/bw-ui)

## 🐛 Issues

Found a bug? [Report it here](https://github.com/bw-ui/bw-datatable/issues)
