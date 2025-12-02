/**
 * BWDataTable Command Plugin - TypeScript Definitions
 * @bw-ui/datatable-command
 */

import { PluginAPI, Plugin, PluginInstance } from '@bw-ui/datatable';

/**
 * Command plugin options
 */
export interface CommandPluginOptions {
  /**
   * Search input placeholder
   * @default 'Type a command...'
   */
  placeholder?: string;

  /**
   * Enable Ctrl+K / Cmd+K shortcut
   * @default true
   */
  shortcut?: boolean;

  /**
   * Maximum results to display
   * @default 50
   */
  maxResults?: number;
}

/**
 * Command action definition
 */
export interface CommandAction {
  /** Unique action identifier */
  id: string;

  /** Display label */
  label: string;

  /** Optional icon (SVG string) */
  icon?: string;

  /** Search keywords */
  keywords?: string[];

  /** Keyboard shortcut display (e.g., '⌘C') */
  shortcut?: string;

  /** Is this a group with children? */
  isGroup?: boolean;

  /** Child actions (for groups) */
  children?: CommandAction[];

  /** Action function to execute */
  action?: () => void;
}

/**
 * Command execute event data
 */
export interface CommandExecuteEvent {
  /** Action ID */
  id: string;

  /** Action label */
  label: string;
}

/**
 * Command plugin instance
 */
export interface CommandPluginInstance extends PluginInstance {
  name: 'command';

  /**
   * Open command palette
   */
  open(): void;

  /**
   * Close command palette
   */
  close(): void;

  /**
   * Toggle command palette
   */
  toggle(): void;

  /**
   * Add custom action
   * @param action - Action definition
   */
  addAction(action: CommandAction): void;

  /**
   * Remove action by ID
   * @param id - Action ID to remove
   */
  removeAction(id: string): void;

  /**
   * Cleanup plugin
   */
  destroy(): void;
}

/**
 * Command Plugin
 *
 * Adds a VS Code-style command palette to BWDataTable.
 *
 * @example
 * ```typescript
 * import { BWDataTable } from '@bw-ui/datatable';
 * import { CommandPlugin } from '@bw-ui/datatable-command';
 *
 * const table = new BWDataTable('#table', { data })
 *   .use(CommandPlugin, {
 *     shortcut: true,
 *     maxResults: 50,
 *   });
 *
 * // Open palette programmatically
 * table.openCommandPalette();
 *
 * // Add custom action
 * const command = table.getPlugin('command');
 * command.addAction({
 *   id: 'custom-action',
 *   label: 'My Custom Action',
 *   icon: '<svg>...</svg>',
 *   keywords: ['custom', 'action'],
 *   action: () => console.log('Custom action!'),
 * });
 * ```
 */
export declare const CommandPlugin: Plugin & {
  name: 'command';
  init(api: PluginAPI): CommandPluginInstance;
};

export default CommandPlugin;

/**
 * Extended table interface with Command plugin methods
 */
declare module '@bw-ui/datatable' {
  interface BWDataTableEvents {
    'command:open': void;
    'command:close': void;
    'command:execute': CommandExecuteEvent;
  }
}
