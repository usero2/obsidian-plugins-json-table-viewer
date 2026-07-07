# Walkthrough - JSON Table Viewer Obsidian Plugin

I have successfully created and compiled the **JSON Table Viewer** plugin inside the Obsidian plugins directory.

## What Was Accomplished

1. **Plugin Configuration Files**:
   - [manifest.json](file:///c:/Users/admin/Desktop/TraderBrian/.obsidian/plugins/obsidian-plugins-json-table-viewer/manifest.json): Set plugin identity and version.
   - [package.json](file:///c:/Users/admin/Desktop/TraderBrian/.obsidian/plugins/obsidian-plugins-json-table-viewer/package.json): Dev dependencies (`obsidian`, `typescript`, `esbuild`) and build scripts.
   - [tsconfig.json](file:///c:/Users/admin/Desktop/TraderBrian/.obsidian/plugins/obsidian-plugins-json-table-viewer/tsconfig.json): TypeScript parameters.
   - [esbuild.config.mjs](file:///c:/Users/admin/Desktop/TraderBrian/.obsidian/plugins/obsidian-plugins-json-table-viewer/esbuild.config.mjs): Bundles the plugin source files into `main.js`.

2. **Core Rendering, Extension Registration & Event Handling**:
   - [main.ts](file:///c:/Users/admin/Desktop/TraderBrian/.obsidian/plugins/obsidian-plugins-json-table-viewer/main.ts):
     - Registers the `json-table` markdown code block processor.
     - Registers the `.json` file extension and associates it with a custom view type (`json-table-view`) using `TextFileView`.
     - When a `.json` file is opened in Obsidian, it automatically renders as a beautiful interactive table.
     - Parses inline raw JSON or references files in the vault (with directory fallback parsing like `.obsidian/...`).
     - Listens to vault modify events to reload the table automatically if the file updates.
     - Handles recursive table creation (objects rendered vertically, lists of objects horizontally, simple lists for primitive values).
     - Renders formatted numbers, active URL hyperlinks, and colored badges for booleans.
     - **Adds sorting controls**: Clicking header columns cycles through Ascending (`▲`) -> Descending (`▼`) -> Unsorted (`↕`).
     - **Adds filtering fields**: Column-specific text inputs allow filtering table rows in real-time.
     - **Adds grouping actions**: Clicking the `Group` button groups rows by that column. Group headers are collapsible and display total item count.
     - Each nested table maintains its own independent state.

3. **Premium Styling CSS**:
   - [styles.css](file:///c:/Users/admin/Desktop/TraderBrian/.obsidian/plugins/obsidian-plugins-json-table-viewer/styles.css): 
     - Defines modern, clean table layout using Obsidian theme variables (`--background-primary`, `--table-border`, etc.).
     - Uses distinct left-border highlights (`--interactive-accent`) to denote nested arrays/tables.
     - Adds row hover highlighting, right-aligns numeric columns, and designs beautiful pills for `true`/`false` values.
     - Styles interactive header elements: title, sort toggles, group buttons (with active/inactive states), and form-friendly filter inputs.
     - Styles collapsible group rows: distinctive background color, fold icons, bold headers, and indentation for grouped records.
     - **Removed nested scrollbars and nowrap headers**: Eliminated nested `overflow-x: auto` scroll boxes and forced wrapping on table headers so the content flows naturally, avoiding annoying multi-scrollbar behaviors (similar to iframes) and relying instead on the editor's main scrollbar.
     - **Zebra striping**: Added alternating row background colors (`var(--background-secondary-alt)`) via a `.json-table-row-alternate` class to significantly enhance readability of data-dense rows.
     - **Sticky table headers**: Configured headers (`th`) with `position: sticky; top: 0; z-index: 5;` and removed `overflow: hidden` clipping on tables so that column headers stay locked at the top of the viewport when scrolling down.
     - **Top-aligned & Sticky vertical property names**: Solved sticky positioning constraints for vertical keys (such as `position` in `virtual_portfolio.json`) by wrapping key text in `.json-table-vertical-key-sticky` containers inside `.json-table-vertical-key-cell` cells. This allows keys to stick dynamically to the viewport as you scroll down a tall row. Nested keys are offset by `64px` to sit neatly below parent headers.
     - **Distinguishable Hover and Alternate Colors**: Configured row hover with a premium soft yellow/gold highlight (`hsla(48, 100%, 50%, 0.15) !important`) that stands out clearly from the grey alternating rows. On hovered selected rows, a slightly darker gold-yellow tone is shown.
     - **Row Selection (Toggle Mark)**: Allowed clicking anywhere on a row (excluding inputs, buttons, and links) to toggle a `.json-table-row-selected` class, which marks the row with a beautiful soft green highlight background and accent border. Selected rows have their own hover states.

4. **Bundling**:
   - Compiled the TypeScript code via `npm run build` producing [main.js](file:///c:/Users/admin/Desktop/TraderBrian/.obsidian/plugins/obsidian-plugins-json-table-viewer/main.js).

5. **Test Note Created**:
   - [JSON Table Viewer Test.md](file:///c:/Users/admin/Desktop/TraderBrian/JSON%20Table%20Viewer%20Test.md): Created in the vault root. It contains tests for `portfolio.json`, `transaction.json`, and direct raw nested JSON data.

---

## How to Enable and Test the Plugin in Obsidian

1. Open Obsidian with the vault **TraderBrian** (`c:\Users\admin\Desktop\TraderBrian`).
2. Go to **Settings** -> **Community Plugins**.
3. Click the **Reload** icon or refresh the list of installed plugins.
4. You should see **JSON Table Viewer** in the list. **Toggle it ON** to enable it.
5. Open the note **JSON Table Viewer Test** from your note list to see raw and referenced JSON render correctly.
6. Try clicking on any `.json` file inside the Obsidian file explorer. It will now load directly as a beautiful, interactive table!
7. **Test Sorting**: Click on a column title or its `↕` arrow. The rows will sort ascending, descending, or reset.
8. **Test Filtering**: Type inside the `Filter...` input box below any column header. Rows will filter instantly.
9. **Test Grouping**: Click the `Group` button on a header. The table will partition its rows. Click group headers (e.g. `▶` or `▼`) to collapse/expand them.
10. You can edit any JSON file and the preview/reference will update in real-time.

---

## Git Branch & Development Workflow

I have set up two Git branches to manage development files locally while maintaining a clean Git Remote with only the required release files:

1. **`dev` Branch (Local Development)**: 
   - Tracks all source code and configuration files (`main.ts`, `package.json`, `tsconfig.json`, `esbuild.config.mjs`, test files, etc.).
   - This branch is where you perform coding and updates.
2. **`main` Branch (Release / Remote)**:
   - Tracks **only** the 5 release files (`LICENSE`, `README.md`, `main.js`, `manifest.json`, `styles.css`) and `.gitignore`.
   - This is the branch you push to GitHub/Git remote.

### How to use this workflow for future updates:

1. **Start Development**:
   Switch to `dev` branch to restore all source code files onto your disk:
   ```bash
   git checkout dev
   ```
2. **Make Changes & Rebuild**:
   Modify `main.ts` or `styles.css`, then compile the bundle:
   ```bash
   npm run build
   ```
3. **Commit to dev Branch**:
   Commit your development progress:
   ```bash
   git add .
   git commit -m "Update source code and styles"
   ```
4. **Publish to main Branch (Release)**:
   Switch to `main` branch, checkout only the built files from `dev`, commit, and push:
   ```bash
   git checkout main
   git checkout dev -- main.js styles.css manifest.json README.md LICENSE
   git commit -m "Release new version"
   git push origin main
   ```
5. **Resume Development**:
   Switch back to `dev` to continue coding:
   ```bash
   git checkout dev
   ```



