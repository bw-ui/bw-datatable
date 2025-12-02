# @bw-ui/datatable-command

VS Code-style command palette plugin for BWDataTable.

## Features

- 🎨 **Beautiful UI** - Modal with backdrop blur, animations
- 🔍 **Fuzzy Search** - Find commands quickly
- ⌨️ **Keyboard Navigation** - Arrow keys, Tab, Enter, Escape
- 📁 **Grouped Commands** - Expandable groups with children
- 🔌 **Plugin Integration** - Auto-detects other plugins
- ➕ **Extensible** - Add custom actions

## Installation

```bash
npm install @bw-ui/datatable-command
```

## Usage

```javascript
import { BWDataTable } from '@bw-ui/datatable';
import { CommandPlugin } from '@bw-ui/datatable-command';

const table = new BWDataTable('#table', { data }).use(CommandPlugin, {
  shortcut: true, // Enable Ctrl+K / Cmd+K (default: true)
  maxResults: 50, // Max items to show (default: 50)
  placeholder: 'Type a command...',
});

// Open with keyboard: Ctrl+K / Cmd+K
// Or programmatically:
// table.openCommandPalette();
```

## Options

| Option        | Type      | Default               | Description                    |
| ------------- | --------- | --------------------- | ------------------------------ |
| `shortcut`    | `boolean` | `true`                | Enable Ctrl+K / Cmd+K shortcut |
| `maxResults`  | `number`  | `50`                  | Maximum results to display     |
| `placeholder` | `string`  | `'Type a command...'` | Search input placeholder       |

## Keyboard Shortcuts

### Opening

| Shortcut           | Action               |
| ------------------ | -------------------- |
| `Ctrl+K` / `Cmd+K` | Open command palette |

### Navigation (when open)

| Key       | Action                         |
| --------- | ------------------------------ |
| `↑` / `↓` | Navigate items                 |
| `Tab`     | Expand/collapse group          |
| `Enter`   | Execute action or toggle group |
| `Escape`  | Close palette                  |

## Built-in Commands

The command palette includes these actions by default:

### Sort Commands

- **Sort Ascending** (group) - Expand to sort by any column
- **Sort Descending** (group) - Expand to sort by any column

### Selection Commands

- **Select All Rows** - Select all visible rows
- **Clear Selection** - Deselect all rows

### Filter Commands

- **Clear All Filters** - Remove search filter
- **Clear Sort** - Remove current sort
- **Reset All** - Clear filters and sort

### Navigation

- **Go to Top** - Scroll to first row
- **Go to Bottom** - Scroll to last row

### Plugin Commands (auto-detected)

If other plugins are loaded, their commands appear automatically:

**With ExportPlugin:**

- Export to CSV
- Export to JSON

**With ClipboardPlugin:**

- Copy Selected Rows

**With HistoryPlugin:**

- Undo
- Redo

## Adding Custom Actions

```javascript
const table = new BWDataTable('#table', { data }).use(CommandPlugin);

// Get plugin instance
const commandPlugin = table.plugins?.find((p) => p.name === 'command');

// Add simple action
commandPlugin.addAction({
  id: 'refresh-data',
  label: 'Refresh Data',
  icon: '<svg>...</svg>', // Optional SVG icon
  keywords: ['reload', 'fetch'], // Search keywords
  shortcut: '⌘R', // Display only
  action: () => {
    fetchNewData().then((data) => table.setData(data));
  },
});

// Add group with children
commandPlugin.addAction({
  id: 'filter-status',
  label: 'Filter by Status',
  isGroup: true,
  children: [
    {
      id: 'filter-active',
      label: 'Active',
      action: () => table.filterColumn('status', 'Active'),
    },
    {
      id: 'filter-inactive',
      label: 'Inactive',
      action: () => table.filterColumn('status', 'Inactive'),
    },
  ],
});

// Remove action
commandPlugin.removeAction('refresh-data');
```

## Action Structure

```typescript
interface CommandAction {
  id: string; // Required: unique identifier
  label: string; // Required: display text
  icon?: string; // Optional: SVG string
  keywords?: string[]; // Optional: search keywords
  shortcut?: string; // Optional: keyboard shortcut display
  isGroup?: boolean; // Optional: true for expandable groups
  children?: Action[]; // Optional: child actions for groups
  action?: () => void; // Optional: function to execute
}
```

## Events

```javascript
// Palette opened
table.on('command:open', () => {
  console.log('Command palette opened');
});

// Palette closed
table.on('command:close', () => {
  console.log('Command palette closed');
});

// Command executed
table.on('command:execute', ({ id, label }) => {
  console.log(`Executed: ${label}`);
});
```

## Styling

The command palette uses scoped CSS with these classes:

```css
/* Customize backdrop */
.bw-cmd-backdrop {
  background: rgba(0, 0, 0, 0.7);
}

/* Customize modal */
.bw-cmd-modal {
  max-width: 600px;
  border-radius: 12px;
}

/* Customize active item */
.bw-cmd-item.active {
  background: #3b82f6;
  color: white;
}
```

## Example: Custom Command Button

```html
<button id="openCommands">⌘K Commands</button>
```

```javascript
const table = new BWDataTable('#table', { data }).use(CommandPlugin);

document.getElementById('openCommands').addEventListener('click', () => {
  const cmd = table.plugins?.find((p) => p.name === 'command');
  cmd?.open();
});
```

## TypeScript

```typescript
import { BWDataTable } from '@bw-ui/datatable';
import {
  CommandPlugin,
  CommandAction,
  CommandPluginOptions,
} from '@bw-ui/datatable-command';

const options: CommandPluginOptions = {
  shortcut: true,
  maxResults: 100,
};

const table = new BWDataTable('#table', { data }).use(CommandPlugin, options);

const action: CommandAction = {
  id: 'my-action',
  label: 'My Action',
  keywords: ['my', 'custom'],
  action: () => console.log('Executed!'),
};
```

## License

MIT © [BW UI](https://github.com/AshwinPavanKadha/bw-ui)
