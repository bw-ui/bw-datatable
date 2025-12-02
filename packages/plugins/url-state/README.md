# @bw-ui/datatable-url-state

URL state synchronization plugin for BWDataTable.

## Features

- 🔗 **Shareable Links** - Share table state via URL
- 🔄 **State Persistence** - Sort, filter survive page refresh
- ⬅️ **Browser History** - Back/forward navigation works
- ⚙️ **Configurable** - Choose what state to sync
- 🎯 **Prefix Support** - Multiple tables on same page

## Installation

```bash
npm install @bw-ui/datatable-url-state
```

## Usage

```javascript
import { BWDataTable } from '@bw-ui/datatable';
import { UrlStatePlugin } from '@bw-ui/datatable-url-state';

const table = new BWDataTable('#table', { data }).use(UrlStatePlugin, {
  persist: true, // Save state to URL (default: true)
  restore: true, // Restore state from URL on load (default: true)
  prefix: 'dt_', // URL param prefix (default: 'dt_')
  useHash: false, // Use hash instead of query string (default: false)
  debounce: 300, // Debounce URL updates (default: 300ms)
});

// URL automatically updates:
// - Sort: ?dt_sort=name&dt_dir=asc
// - Filter: ?dt_filter=john
// - Page: ?dt_page=2
```

## Options

| Option      | Type       | Default                      | Description                       |
| ----------- | ---------- | ---------------------------- | --------------------------------- |
| `persist`   | `boolean`  | `true`                       | Save state changes to URL         |
| `restore`   | `boolean`  | `true`                       | Restore state from URL on init    |
| `prefix`    | `string`   | `'dt_'`                      | Prefix for URL parameters         |
| `useHash`   | `boolean`  | `false`                      | Use hash (#) instead of query (?) |
| `debounce`  | `number`   | `300`                        | Debounce delay in milliseconds    |
| `syncState` | `string[]` | `['sort', 'filter', 'page']` | Which state to sync               |

## URL Parameters

With default prefix `dt_`:

| Parameter   | Description        | Example          |
| ----------- | ------------------ | ---------------- |
| `dt_sort`   | Sort column        | `dt_sort=name`   |
| `dt_dir`    | Sort direction     | `dt_dir=asc`     |
| `dt_filter` | Search/filter term | `dt_filter=john` |
| `dt_page`   | Page number        | `dt_page=2`      |

### Example URLs

```
# Sorted by name ascending
https://app.com/users?dt_sort=name&dt_dir=asc

# Filtered by "john"
https://app.com/users?dt_filter=john

# Combined
https://app.com/users?dt_sort=salary&dt_dir=desc&dt_filter=engineer

# With hash (useHash: true)
https://app.com/users#dt_sort=name&dt_dir=asc
```

## API

### Methods

```javascript
// Get shareable URL
const url = table.getShareableUrl?.();
// Returns: "https://app.com/users?dt_sort=name&dt_dir=asc"

// Get URL state plugin instance
const urlState = table.plugins?.find((p) => p.name === 'url-state');

// Get current state from URL
const state = urlState?.getState();
// Returns: { sortColumn: 'name', sortDirection: 'asc', filter: '' }

// Set state programmatically
urlState?.setState({ sortColumn: 'email', sortDirection: 'desc' });

// Clear all URL state
urlState?.clearState();
```

## Events

```javascript
// State changed and URL updated
table.on('urlstate:change', ({ previous, current, url }) => {
  console.log('URL state changed:', current);
  console.log('New URL:', url);
});

// State restored from URL on init
table.on('urlstate:restore', (state) => {
  console.log('Restored from URL:', state);
});
```

## Example: Share Button

```html
<button id="share">Share Link</button>
```

```javascript
const table = new BWDataTable('#table', { data }).use(UrlStatePlugin);

document.getElementById('share').addEventListener('click', async () => {
  const url = window.location.href;

  try {
    await navigator.clipboard.writeText(url);
    alert('Link copied to clipboard!');
  } catch {
    prompt('Copy this link:', url);
  }
});
```

## Example: Multiple Tables

```javascript
// Table 1
const table1 = new BWDataTable('#users', { data: users }).use(UrlStatePlugin, {
  prefix: 'users_',
});

// Table 2
const table2 = new BWDataTable('#orders', { data: orders }).use(
  UrlStatePlugin,
  { prefix: 'orders_' }
);

// URL: ?users_sort=name&orders_sort=date
```

## Example: Hash-based State

Useful for single-page apps where you can't change query string:

```javascript
const table = new BWDataTable('#table', { data }).use(UrlStatePlugin, {
  useHash: true,
});

// URL: https://app.com/users#dt_sort=name&dt_dir=asc
```

## Browser History

The plugin integrates with browser history:

- **Back button** - Reverts to previous state
- **Forward button** - Re-applies state
- **Page refresh** - Restores state from URL

```javascript
// Listen for browser navigation
window.addEventListener('popstate', () => {
  // Plugin automatically handles this
});
```

## TypeScript

```typescript
import { BWDataTable } from '@bw-ui/datatable';
import {
  UrlStatePlugin,
  UrlStatePluginOptions,
  UrlState,
} from '@bw-ui/datatable-url-state';

const options: UrlStatePluginOptions = {
  persist: true,
  restore: true,
  prefix: 'tbl_',
  syncState: ['sort', 'filter'],
};

const table = new BWDataTable('#table', { data }).use(UrlStatePlugin, options);

table.on('urlstate:change', ({ current }: { current: UrlState }) => {
  console.log('Sort:', current.sortColumn, current.sortDirection);
});
```

## Notes

- URL updates are debounced to prevent excessive history entries
- State is restored after table initialization
- Works with both hash and query string modes
- Handles URL encoding/decoding automatically

## License

MIT © [BW UI](https://github.com/AshwinPavanKadha/bw-ui)
