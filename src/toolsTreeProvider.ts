import * as vscode from 'vscode';
import { Tool, ToolCategory } from './tools/base/types';
import { registry } from './tools/base/registry';

export class ToolItem extends vscode.TreeItem {
    constructor(
        public readonly label: string,
        public readonly id: string,
        public readonly description: string,
        public readonly isCategory: boolean,
        public readonly commandId?: string,
        public readonly isLoading: boolean = false
    ) {
        super(label, isCategory ? vscode.TreeItemCollapsibleState.Expanded : vscode.TreeItemCollapsibleState.None);
        this.contextValue = isCategory ? 'tool-category' : 'tool-action';
        this.tooltip = description;

        if (commandId && !isLoading && !isCategory) {
            this.command = {
                command: commandId,
                title: label,
                arguments: [this]
            };
        }
    }
}

export class ToolsTreeProvider implements vscode.TreeDataProvider<ToolItem> {
    private _onDidChangeTreeData: vscode.EventEmitter<ToolItem | undefined | null | void> = new vscode.EventEmitter<ToolItem | undefined | null | void>();
    readonly onDidChangeTreeData: vscode.Event<ToolItem | undefined | null | void> = this._onDidChangeTreeData.event;
    private loadingTools = new Set<string>();
    private searchQuery: string = '';
    private searchBox: vscode.InputBox;

    constructor() {
        this.searchBox = vscode.window.createInputBox();
        this.searchBox.placeholder = 'Search tools...';
        this.searchBox.prompt = 'Type to filter tools';
        
        this.searchBox.onDidChangeValue(query => {
            this.searchQuery = query.toLowerCase();
            this.refresh();
        });

        this.searchBox.onDidHide(() => {
            if (this.searchQuery) {
                this.searchQuery = '';
                this.refresh();
            }
        });
    }

    refresh(): void {
        this._onDidChangeTreeData.fire();
    }

    setLoading(toolId: string, loading: boolean): void {
        if (loading) {
            this.loadingTools.add(toolId);
        } else {
            this.loadingTools.delete(toolId);
        }
        this.refresh();
    }

    getTreeItem(element: ToolItem): vscode.TreeItem {
        const treeItem = new vscode.TreeItem(
            element.label,
            element.isCategory ? vscode.TreeItemCollapsibleState.Expanded : vscode.TreeItemCollapsibleState.None
        );

        treeItem.description = element.description;
        treeItem.tooltip = element.description;
        treeItem.contextValue = element.contextValue;

        const isLoading = this.loadingTools.has(element.id);
        
        if (!element.isCategory) {
            if (isLoading) {
                treeItem.iconPath = new vscode.ThemeIcon('loading~spin');
                treeItem.description = '$(loading~spin) Running...';
                treeItem.command = undefined;
            } else {
                treeItem.iconPath = new vscode.ThemeIcon('play');
                treeItem.command = element.command;
            }
        }

        return treeItem;
    }

    private filterToolsBySearch(tools: Tool[]): Tool[] {
        if (!this.searchQuery) {
            return tools;
        }
        return tools.filter(tool => 
            tool.name.toLowerCase().includes(this.searchQuery) || 
            tool.description.toLowerCase().includes(this.searchQuery)
        );
    }

    getChildren(element?: ToolItem): Thenable<ToolItem[]> {
        if (!element) {
            // Root level - show categories and handle search
            const categories = registry.getAllCategories();
            if (this.searchQuery) {
                // When searching, flatten all tools into a single list
                const allTools: Tool[] = [];
                categories.forEach(category => {
                    allTools.push(...registry.getToolsByCategory(category.id));
                });
                
                const filteredTools = this.filterToolsBySearch(allTools);
                return Promise.resolve(
                    filteredTools.map(tool => new ToolItem(
                        tool.name,
                        tool.id,
                        tool.description,
                        false,
                        'gumball.runTool',
                        this.loadingTools.has(tool.id)
                    ))
                );
            }
            
            return Promise.resolve(
                categories.map(category => new ToolItem(
                    category.name,
                    category.id,
                    category.description,
                    true
                ))
            );
        }

        // Show tools for category when not searching
        if (!this.searchQuery) {
            const tools = registry.getToolsByCategory(element.id);
            return Promise.resolve(
                tools.map(tool => new ToolItem(
                    tool.name,
                    tool.id,
                    tool.description,
                    false,
                    'gumball.runTool',
                    this.loadingTools.has(tool.id)
                ))
            );
        }

        return Promise.resolve([]);
    }

    showSearch(): void {
        // If the search box is already visible, just focus it
        if (this.searchBox.value !== undefined) {
            this.searchBox.value = '';
        }
        this.searchBox.show();
    }
}