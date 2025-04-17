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

    getChildren(element?: ToolItem): Thenable<ToolItem[]> {
        if (!element) {
            // Root level - show categories
            const categories = registry.getAllCategories();
            return Promise.resolve(
                categories.map(category => new ToolItem(
                    category.name,
                    category.id,
                    category.description,
                    true
                ))
            );
        }

        // Show tools for category
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
}