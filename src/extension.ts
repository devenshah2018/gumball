import * as vscode from 'vscode';
import { ToolsTreeProvider, ToolItem } from './toolsTreeProvider';
import { registry, registerTools } from './tools';

export function activate(context: vscode.ExtensionContext) {
    // Register all tools
    registerTools();
    
    const toolsProvider = new ToolsTreeProvider();
    
    // Register the TreeDataProvider
    context.subscriptions.push(
        vscode.window.registerTreeDataProvider(
            'gumballToolsView',
            toolsProvider
        )
    );

    // Register the command to handle tool execution
    context.subscriptions.push(
        vscode.commands.registerCommand('gumball.runTool', async (toolItem: ToolItem) => {
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
        })
    );
}

export function deactivate() {}