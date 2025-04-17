import * as vscode from 'vscode';
import { ToolsTreeProvider, ToolItem } from './toolsTreeProvider';
import { registry, registerTools } from './tools';

export function activate(context: vscode.ExtensionContext) {
    // Register all tools
    registerTools();
    
    const toolsProvider = new ToolsTreeProvider();
    
    // Register all commands first
    const focusSearchCommand = vscode.commands.registerCommand('gumball.focusSearch', () => {
        toolsProvider.showSearch();
    });

    const runToolCommand = vscode.commands.registerCommand('gumball.runTool', async (toolItem: ToolItem) => {
        const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
        if (!workspaceFolder) {
            vscode.window.showErrorMessage('No workspace folder found');
            return;
        }

        const tool = registry.getTool(toolItem.id);
        if (!tool) {
            vscode.window.showErrorMessage(`Tool ${toolItem.id} not found`);
            return;
        }

        const context = {
            workspaceFolder: workspaceFolder.uri,
            showError: (message: string) => vscode.window.showErrorMessage(message),
            showInfo: (message: string) => vscode.window.showInformationMessage(message),
            setLoading: (isLoading: boolean) => toolsProvider.setLoading(toolItem.id, isLoading)
        };

        await tool.execute(context);
    });

    // Then register the tree view and add all subscriptions
    context.subscriptions.push(
        vscode.window.registerTreeDataProvider('gumballToolsView', toolsProvider),
        vscode.window.createTreeView('gumballToolsView', {
            treeDataProvider: toolsProvider,
            
        }),
        focusSearchCommand,
        runToolCommand
    );
}

export function deactivate() {}