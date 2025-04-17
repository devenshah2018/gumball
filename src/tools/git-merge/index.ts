import * as vscode from 'vscode';
import { Tool, ToolContext, Categories } from '../base/types';
import { getAllBranches, getCurrentBranch, mergeBranch } from './utils';

export class GitMergeTool implements Tool {
    id = 'mergeBranch';
    name = 'Mush and Scrap';
    description = 'Merge current branch into target branch and delete the current branch';
    category = Categories.GIT;

    async execute(context: ToolContext): Promise<void> {
        try {
            context.setLoading(true);

            const currentBranch = await getCurrentBranch(context.workspaceFolder.fsPath);
            const branches = await getAllBranches(context.workspaceFolder.fsPath);
            const otherBranches = branches.filter(b => b !== currentBranch);

            if (otherBranches.length === 0) {
                throw new Error('No other branches found to merge into');
            }

            const targetBranch = await vscode.window.showQuickPick(otherBranches, {
                placeHolder: 'Select target branch to merge into',
                title: `Merge '${currentBranch}' into which branch?`
            });

            if (!targetBranch) {
                return; // User cancelled
            }

            const shouldProceed = await vscode.window.showWarningMessage(
                `This will merge '${currentBranch}' into '${targetBranch}' and delete '${currentBranch}'. Continue?`,
                { modal: true },
                'Yes'
            );

            if (shouldProceed !== 'Yes') {
                return;
            }

            await mergeBranch(currentBranch, targetBranch, context.workspaceFolder.fsPath);
            context.showInfo(`Successfully merged '${currentBranch}' into '${targetBranch}' and deleted '${currentBranch}'`);
        } catch (error) {
            context.showError(error instanceof Error ? error.message : 'Unknown error during merge');
        } finally {
            context.setLoading(false);
        }
    }
}