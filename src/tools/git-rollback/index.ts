import * as vscode from 'vscode';
import { Tool, ToolContext, Categories } from '../base/types';
import { checkForUncommittedChanges, rollbackCommits } from './utils';

export class GitRollbackTool implements Tool {
    id = 'gitRollback';
    name = 'Rollback';
    description = 'Roll back recent commits by moving HEAD to an earlier state';
    category = Categories.GIT;

    async execute(context: ToolContext): Promise<void> {
        try {
            context.setLoading(true);

            // Check for uncommitted changes first
            const hasUncommittedChanges = await checkForUncommittedChanges(context.workspaceFolder.fsPath);
            if (hasUncommittedChanges) {
                throw new Error('Cannot rollback with uncommitted changes. Please commit or stash your changes first.');
            }

            // Prompt for number of commits to rollback
            const input = await vscode.window.showInputBox({
                prompt: 'Enter number of commits to rollback',
                placeHolder: '1',
                validateInput: (value) => {
                    const num = parseInt(value);
                    if (isNaN(num) || num < 1) {
                        return 'Please enter a positive number';
                    }
                    return null;
                }
            });

            if (!input) {
                return; // User cancelled
            }

            const numCommits = parseInt(input);

            // Show warning message
            const shouldProceed = await vscode.window.showWarningMessage(
                `This will permanently delete the last ${numCommits} commit${numCommits === 1 ? '' : 's'}. This action cannot be undone. Continue?`,
                { modal: true },
                'Yes'
            );

            if (shouldProceed !== 'Yes') {
                return;
            }

            await rollbackCommits(numCommits, context.workspaceFolder.fsPath);
            context.showInfo(`Successfully rolled back ${numCommits} commit${numCommits === 1 ? '' : 's'}`);
        } catch (error) {
            context.showError(error instanceof Error ? error.message : 'Unknown error during rollback');
        } finally {
            context.setLoading(false);
        }
    }
}