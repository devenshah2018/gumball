import * as vscode from 'vscode';

export class DropdownItem extends vscode.TreeItem {
    constructor(
        public readonly label: string,
        public readonly value: string,
        public readonly parent?: DropdownItem
    ) {
        super(label, parent ? vscode.TreeItemCollapsibleState.None : vscode.TreeItemCollapsibleState.Expanded);
        this.contextValue = parent ? 'option' : 'dropdown';
    }
}

export class DropdownTreeProvider implements vscode.TreeDataProvider<DropdownItem> {
    private _onDidChangeTreeData: vscode.EventEmitter<DropdownItem | undefined | null | void> = new vscode.EventEmitter<DropdownItem | undefined | null | void>();
    readonly onDidChangeTreeData: vscode.Event<DropdownItem | undefined | null | void> = this._onDidChangeTreeData.event;

    private selectedValues: Map<string, string> = new Map();

    constructor() {
        // Load initial values from settings
        this.selectedValues.set('typeInference', vscode.workspace.getConfiguration('gumball').get('typeInference', 'auto'));
    }

    refresh(): void {
        this._onDidChangeTreeData.fire();
    }

    getTreeItem(element: DropdownItem): vscode.TreeItem {
        const treeItem = new vscode.TreeItem(
            element.label,
            element.collapsibleState
        );

        if (element.parent) {
            // This is an option item
            const isSelected = this.selectedValues.get(element.parent.label.toLowerCase()) === element.value;
            treeItem.description = isSelected ? '✓ Selected' : '';
            treeItem.command = {
                command: 'gumball.selectOption',
                title: 'Select Option',
                arguments: [element.parent.label.toLowerCase(), element.value]
            };
        }

        return treeItem;
    }

    getChildren(element?: DropdownItem): Thenable<DropdownItem[]> {
        if (!element) {
            // Root level - show dropdowns
            return Promise.resolve([
                new DropdownItem('Type Inference', 'typeInference')
            ]);
        }

        // Child level - show options
        if (element.label === 'Type Inference') {
            return Promise.resolve([
                new DropdownItem('Strict', 'strict', element),
                new DropdownItem('Loose', 'loose', element),
                new DropdownItem('Auto (Recommended)', 'auto', element)
            ]);
        }

        return Promise.resolve([]);
    }

    async selectOption(dropdownId: string, value: string): Promise<void> {
        await vscode.workspace.getConfiguration('gumball').update(dropdownId, value, vscode.ConfigurationTarget.Workspace);
        this.selectedValues.set(dropdownId, value);
        this.refresh();
    }
}