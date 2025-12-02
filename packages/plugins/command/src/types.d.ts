/**
 * @bw-ui/datatable-command - TypeScript Definitions
 */

import { Plugin, PluginAPI, BWDataTable } from '@bw-ui/datatable';

export interface CommandAction {
  /** Unique action ID */
  id: string;
  /** Display title */
  title: string;
  /** Description text */
  description?: string;
  /** Icon (emoji or string) */
  icon?: string;
  /** Search keywords */
  keywords?: string[];
  /** Action requires input value */
  hasInput?: boolean;
  /** Input placeholder text */
  inputPlaceholder?: string;
  /** Action has submenu */
  hasSubmenu?: boolean;
  /** Get submenu items */
  getSubmenu?: (table: BWDataTable) => SubmenuItem[];
  /** Required table method (for conditional availability) */
  requires?: string;
  /** Action function */
  action: (table: BWDataTable, value?: string) => void;
}

export interface SubmenuItem {
  /** Unique item ID */
  id: string;
  /** Display title */
  title: string;
  /** Action function */
  action: () => void;
}

export interface CommandPluginOptions {
  /** Enable Cmd+K / Ctrl+K shortcut */
  shortcut?: boolean;
  /** Input placeholder text */
  placeholder?: string;
  /** Maximum visible results */
  maxResults?: number;
  /** Custom action definitions */
  customActions?: CommandAction[];
}

export interface CommandPluginInstance {
  /** Open command palette */
  open: () => void;
  /** Close command palette */
  close: () => void;
  /** Toggle open/close */
  toggle: () => void;
  /** Add custom action */
  addAction: (action: CommandAction) => void;
  /** Remove custom action by ID */
  removeAction: (id: string) => void;
  /** Cleanup */
  destroy: () => void;
}

export interface CommandPlugin extends Plugin {
  name: 'command';
  init: (api: PluginAPI) => CommandPluginInstance;
}

export declare const CommandPlugin: CommandPlugin;
export default CommandPlugin;

// Extend BWDataTable interface
declare module '@bw-ui/datatable' {
  interface BWDataTable {
    /** Open command palette */
    openCommand(): void;
    /** Close command palette */
    closeCommand(): void;
    /** Toggle command palette */
    toggleCommand(): void;
    /** Add custom command action */
    addCommandAction(action: CommandAction): void;
    /** Remove custom command action */
    removeCommandAction(id: string): void;
  }
}
