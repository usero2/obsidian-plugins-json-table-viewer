import { Plugin, MarkdownRenderChild, TFile, TextFileView, WorkspaceLeaf } from 'obsidian';

const VIEW_TYPE_JSON = 'json-table-view';

class JSONTableView extends TextFileView {
    constructor(leaf: WorkspaceLeaf) {
        super(leaf);
    }

    getViewType() {
        return VIEW_TYPE_JSON;
    }

    getDisplayText() {
        return this.file ? this.file.name : "JSON Table View";
    }

    setViewData(data: string, clear: boolean) {
        this.contentEl.empty();
        const contentEl = this.contentEl.createDiv({ cls: 'json-table-viewer-root' });
        
        try {
            const jsonData = JSON.parse(data);
            renderValue(jsonData, contentEl);
        } catch (err: any) {
            const errEl = contentEl.createDiv({ cls: 'json-table-error' });
            errEl.setText(`Error parsing JSON: ${err.message}`);
        }
    }

    getViewData() {
        return this.data;
    }

    clear() {
        this.contentEl.empty();
    }
}


// Helper function to render JSON values recursively
function renderValue(val: any, container: HTMLElement) {
    if (val === null || val === undefined) {
        const span = container.createEl("span");
        span.addClass("json-table-null");
        span.setText("null");
    } else if (typeof val === 'boolean') {
        const badge = container.createEl("span");
        badge.addClass("json-table-badge");
        if (val) {
            badge.addClass("json-table-badge-true");
            badge.setText("true");
        } else {
            badge.addClass("json-table-badge-false");
            badge.setText("false");
        }
    } else if (typeof val === 'number') {
        const span = container.createEl("span");
        span.addClass("json-table-number");
        span.setText(val.toLocaleString(undefined, { maximumFractionDigits: 10 }));
        if (container.tagName === 'TD') {
            container.addClass("json-table-cell-number");
        }
    } else if (typeof val === 'string') {
        if (val.startsWith("http://") || val.startsWith("https://")) {
            const link = container.createEl("a");
            link.setAttribute("href", val);
            link.setAttribute("target", "_blank");
            link.setAttribute("rel", "noopener");
            link.addClass("json-table-link");
            link.setText(val);
        } else {
            const span = container.createEl("span");
            span.addClass("json-table-string");
            span.setText(val);
        }
    } else if (Array.isArray(val)) {
        if (val.length === 0) {
            const span = container.createEl("span");
            span.addClass("json-table-empty-array");
            span.setText("[]");
        } else if (typeof val[0] === 'object' && val[0] !== null) {
            renderArrayOfObjects(val, container);
        } else {
            const list = container.createEl("ul");
            list.addClass("json-table-primitive-list");
            val.forEach(item => {
                const li = list.createEl("li");
                renderValue(item, li);
            });
        }
    } else if (typeof val === 'object') {
        renderObject(val, container);
    } else {
        const span = container.createEl("span");
        span.setText(String(val));
    }
}

// Renders an array of objects as a horizontal table with sort, filter, and group controls
function renderArrayOfObjects(arr: any[], container: HTMLElement) {
    const tableWrapper = container.createEl("div");
    tableWrapper.addClass("json-table-viewer-table-wrapper");

    const table = tableWrapper.createEl("table");
    table.addClass("json-table-viewer-table");
    
    // Collect all unique keys from all objects in the array
    const keys = Array.from(
        new Set(
            arr.flatMap(item => 
                (typeof item === 'object' && item !== null) ? Object.keys(item) : []
            )
        )
    );

    if (keys.length === 0) {
        // If it's an array of empty objects or empty arrays
        const tbody = table.createEl("tbody");
        arr.forEach((_, idx) => {
            const tr = tbody.createEl("tr");
            const td = tr.createEl("td");
            td.setText(`{}`);
        });
        return;
    }

    // State for this table instance
    let sortKey: string | null = null;
    let sortDirection: 'asc' | 'desc' | null = null;
    const filters: Record<string, string> = {};
    let groupKey: string | null = null;
    const collapsedGroups = new Set<string>();

    const sortIndicators: Record<string, HTMLSpanElement> = {};
    const groupButtons: Record<string, HTMLButtonElement> = {};
    
    // Create header row
    const thead = table.createEl("thead");
    const trHead = thead.createEl("tr");
    
    keys.forEach(key => {
        const th = trHead.createEl("th");
        th.addClass("json-table-header-cell");
        
        // Header top container (Title & action buttons)
        const headerTop = th.createEl("div");
        headerTop.addClass("json-table-header-top");
        
        const titleSpan = headerTop.createEl("span");
        titleSpan.addClass("json-table-header-title");
        titleSpan.setText(key);
        
        const actionsDiv = headerTop.createEl("div");
        actionsDiv.addClass("json-table-header-actions");
        
        // Sort button/indicator
        const sortIndicator = actionsDiv.createEl("span");
        sortIndicator.addClass("json-table-sort-indicator");
        sortIndicator.setText("↕");
        sortIndicators[key] = sortIndicator;
        
        // Event listeners for sorting
        titleSpan.addEventListener("click", () => toggleSort(key));
        sortIndicator.addEventListener("click", (e) => {
            e.stopPropagation();
            toggleSort(key);
        });
        
        // Group button
        const groupBtn = actionsDiv.createEl("button");
        groupBtn.addClass("json-table-group-btn");
        groupBtn.setText("Group");
        groupButtons[key] = groupBtn;
        
        groupBtn.addEventListener("click", (e) => {
            e.stopPropagation();
            toggleGroup(key);
        });
        
        // Filter input
        const filterInput = th.createEl("input");
        filterInput.setAttribute("type", "text");
        filterInput.setAttribute("placeholder", "Filter...");
        filterInput.addClass("json-table-filter-input");
        
        filterInput.addEventListener("input", () => {
            filters[key] = filterInput.value;
            updateTable();
        });
    });

    const tbody = table.createEl("tbody");

    function toggleSort(key: string) {
        if (sortKey === key) {
            if (sortDirection === 'asc') {
                sortDirection = 'desc';
            } else {
                sortKey = null;
                sortDirection = null;
            }
        } else {
            sortKey = key;
            sortDirection = 'asc';
        }
        updateHeaderUI();
        updateTable();
    }

    function toggleGroup(key: string) {
        if (groupKey === key) {
            groupKey = null;
        } else {
            groupKey = key;
            collapsedGroups.clear();
        }
        updateHeaderUI();
        updateTable();
    }

    function updateHeaderUI() {
        keys.forEach(key => {
            const sortIndicator = sortIndicators[key];
            if (sortKey === key) {
                sortIndicator.addClass("active");
                sortIndicator.setText(sortDirection === 'asc' ? "▲" : "▼");
            } else {
                sortIndicator.removeClass("active");
                sortIndicator.setText("↕");
            }
            
            const groupBtn = groupButtons[key];
            if (groupKey === key) {
                groupBtn.addClass("active");
                groupBtn.setText("Ungroup");
            } else {
                groupBtn.removeClass("active");
                groupBtn.setText("Group");
            }
        });
    }

    function updateTable() {
        tbody.empty();
        
        // 1. Filter rows
        let processedRows = arr.filter(item => {
            return Object.entries(filters).every(([key, filterText]) => {
                if (!filterText) return true;
                if (!item || typeof item !== 'object' || !(key in item)) return false;
                const val = item[key];
                if (val === null || val === undefined) return false;
                return String(val).toLowerCase().includes(filterText.toLowerCase());
            });
        });

        // 2. Sort rows
        if (sortKey && sortDirection) {
            processedRows.sort((a, b) => {
                const valA = (a && typeof a === 'object' && sortKey in a) ? a[sortKey] : undefined;
                const valB = (b && typeof b === 'object' && sortKey in b) ? b[sortKey] : undefined;
                
                if (valA === undefined || valA === null) return sortDirection === 'asc' ? 1 : -1;
                if (valB === undefined || valB === null) return sortDirection === 'asc' ? -1 : 1;

                if (typeof valA === 'number' && typeof valB === 'number') {
                    return sortDirection === 'asc' ? valA - valB : valB - valA;
                }
                
                const strA = String(valA).toLowerCase();
                const strB = String(valB).toLowerCase();
                if (strA < strB) return sortDirection === 'asc' ? -1 : 1;
                if (strA > strB) return sortDirection === 'asc' ? 1 : -1;
                return 0;
            });
        }

        // 3. Render rows
        if (groupKey) {
            const groups: Record<string, any[]> = {};
            processedRows.forEach(item => {
                const groupVal = (item && typeof item === 'object' && groupKey in item) 
                    ? String(item[groupKey]) 
                    : 'undefined';
                if (!groups[groupVal]) {
                    groups[groupVal] = [];
                }
                groups[groupVal].push(item);
            });

            Object.entries(groups).forEach(([groupName, groupItems]) => {
                const isCollapsed = collapsedGroups.has(groupName);
                
                // Group Header Row
                const groupHeaderTr = tbody.createEl("tr");
                groupHeaderTr.addClass("json-table-group-header-row");
                
                const groupHeaderTd = groupHeaderTr.createEl("td");
                groupHeaderTd.setAttribute("colspan", String(keys.length));
                groupHeaderTd.addClass("json-table-group-header-cell");
                
                const foldIndicator = groupHeaderTd.createEl("span");
                foldIndicator.addClass("json-table-fold-indicator");
                foldIndicator.setText(isCollapsed ? "▶" : "▼");
                
                const groupTitle = groupHeaderTd.createEl("span");
                groupTitle.addClass("json-table-group-title");
                groupTitle.setText(` ${groupKey}: ${groupName} `);
                
                const groupCount = groupHeaderTd.createEl("span");
                groupCount.addClass("json-table-group-count");
                groupCount.setText(`(${groupItems.length} items)`);
                
                groupHeaderTr.addEventListener("click", () => {
                    if (isCollapsed) {
                        collapsedGroups.delete(groupName);
                    } else {
                        collapsedGroups.add(groupName);
                    }
                    updateTable();
                });
                
                // Group Item Rows
                if (!isCollapsed) {
                    groupItems.forEach(item => {
                        const tr = tbody.createEl("tr");
                        tr.addClass("json-table-group-item-row");
                        keys.forEach(key => {
                            const td = tr.createEl("td");
                            if (item && typeof item === 'object' && key in item) {
                                renderValue(item[key], td);
                            } else {
                                td.setText("");
                            }
                        });
                    });
                }
            });
        } else {
            // Flat rows
            processedRows.forEach(item => {
                const tr = tbody.createEl("tr");
                keys.forEach(key => {
                    const td = tr.createEl("td");
                    if (item && typeof item === 'object' && key in item) {
                        renderValue(item[key], td);
                    } else {
                        td.setText("");
                    }
                });
            });
        }
    }

    // Initial render
    updateTable();
}

// Renders a single object as a vertical key-value table
function renderObject(obj: any, container: HTMLElement) {
    const tableWrapper = container.createEl("div");
    tableWrapper.addClass("json-table-viewer-object-wrapper");

    const table = tableWrapper.createEl("table");
    table.addClass("json-table-viewer-object-table");
    
    const tbody = table.createEl("tbody");
    Object.keys(obj).forEach(key => {
        const tr = tbody.createEl("tr");
        const th = tr.createEl("th");
        th.setText(key);
        const td = tr.createEl("td");
        renderValue(obj[key], td);
    });
}

// Child rendering component managing lifecycle and live-reload
class JSONTableRenderChild extends MarkdownRenderChild {
    filePath: string | null = null;
    rawJson: string | null = null;
    sourcePath: string;
    plugin: JSONTableViewerPlugin;

    constructor(
        containerEl: HTMLElement,
        filePath: string | null,
        rawJson: string | null,
        sourcePath: string,
        plugin: JSONTableViewerPlugin
    ) {
        super(containerEl);
        this.filePath = filePath;
        this.rawJson = rawJson;
        this.sourcePath = sourcePath;
        this.plugin = plugin;
    }

    onload() {
        this.render();
        if (this.filePath) {
            // Listen to vault modify events to auto-reload
            this.registerEvent(
                this.plugin.app.vault.on('modify', (file) => {
                    if (file instanceof TFile && file.path === this.filePath) {
                        this.render();
                    }
                })
            );
        }
    }

    async render() {
        this.containerEl.empty();
        
        let jsonData: any = null;
        try {
            if (this.filePath) {
                const file = this.plugin.app.vault.getAbstractFileByPath(this.filePath);
                if (file instanceof TFile) {
                    const content = await this.plugin.app.vault.read(file);
                    jsonData = JSON.parse(content);
                } else {
                    this.renderError(`Error: File not found "${this.filePath}"`);
                    return;
                }
            } else if (this.rawJson) {
                jsonData = JSON.parse(this.rawJson);
            } else {
                this.renderError("Error: No JSON data provided");
                return;
            }
        } catch (err: any) {
            this.renderError(`Error parsing JSON: ${err.message}`);
            return;
        }

        const tableWrapper = this.containerEl.createEl("div");
        tableWrapper.addClass("json-table-viewer-root");
        
        try {
            renderValue(jsonData, tableWrapper);
        } catch (e: any) {
            this.renderError(`Error rendering table: ${e.message}`);
        }
    }

    renderError(msg: string) {
        this.containerEl.empty();
        const errEl = this.containerEl.createEl("div");
        errEl.addClass("json-table-error");
        errEl.setText(msg);
    }
}

export default class JSONTableViewerPlugin extends Plugin {
    async onload() {
        console.log("Loading JSON Table Viewer plugin");

        // Register the JSON custom view and register the .json file extension
        this.registerView(
            VIEW_TYPE_JSON,
            (leaf) => new JSONTableView(leaf)
        );

        try {
            this.registerExtensions(['json'], VIEW_TYPE_JSON);
        } catch (e) {
            console.error("Failed to register json extension:", e);
        }

        this.registerMarkdownCodeBlockProcessor("json-table", async (source, el, ctx) => {
            const trimmedSource = source.trim();
            
            // Determine if source is direct JSON
            const isJson = (trimmedSource.startsWith("{") && trimmedSource.endsWith("}")) ||
                           (trimmedSource.startsWith("[") && trimmedSource.endsWith("]"));
            
            if (isJson) {
                const child = new JSONTableRenderChild(el, null, trimmedSource, ctx.sourcePath, this);
                ctx.addChild(child);
            } else {
                // Treat as file reference
                let targetFile = trimmedSource;
                
                if (trimmedSource.startsWith("file:")) {
                    targetFile = trimmedSource.substring(5).trim();
                } else if (trimmedSource.startsWith("path:")) {
                    targetFile = trimmedSource.substring(5).trim();
                }

                // Strip quotes if they surround the file path
                if ((targetFile.startsWith('"') && targetFile.endsWith('"')) || 
                    (targetFile.startsWith("'") && targetFile.endsWith("'"))) {
                    targetFile = targetFile.substring(1, targetFile.length - 1);
                }

                // Resolve link path relative to current note, with fallback to absolute vault path
                let file = this.app.metadataCache.getFirstLinkpathDest(targetFile, ctx.sourcePath);
                if (!file) {
                    const abstractFile = this.app.vault.getAbstractFileByPath(targetFile);
                    if (abstractFile instanceof TFile) {
                        file = abstractFile;
                    }
                }

                if (file) {
                    const child = new JSONTableRenderChild(el, file.path, null, ctx.sourcePath, this);
                    ctx.addChild(child);
                } else {
                    const errEl = el.createEl("div");
                    errEl.addClass("json-table-error");
                    errEl.setText(`Error: File not found "${targetFile}"`);
                }
            }
        });
    }

    onunload() {
        console.log("Unloading JSON Table Viewer plugin");
    }
}
