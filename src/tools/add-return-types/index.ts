import * as vscode from 'vscode';
import { Tool, ToolContext, Categories } from '../base/types';
import { addReturnTypesToFunctions } from './utils';

export class AddReturnTypesTool implements Tool {
    id = 'addReturnTypes';
    name = 'Add Return Types';
    description = 'Automatically add TypeScript return types to functions in the current file';
    category = Categories.TYPESCRIPT;

    async execute(context: ToolContext): Promise<void> {
        try {
            context.setLoading(true);

            const editor = vscode.window.activeTextEditor;
            if (!editor) {
                throw new Error('No active editor found');
            }

            const doc = editor.document;
            if (!doc.fileName.endsWith('.ts') && !doc.fileName.endsWith('.tsx')) {
                throw new Error('Not a TypeScript file');
            }

            // Add artificial delay to show loading state (100ms)
            await new Promise(resolve => setTimeout(resolve, 100));

            const text = doc.getText();
            const updatedText = addReturnTypesToFunctions(text);

            if (text !== updatedText) {
                await editor.edit(editBuilder => {
                    const fullRange = new vscode.Range(
                        doc.positionAt(0),
                        doc.positionAt(text.length)
                    );
                    editBuilder.replace(fullRange, updatedText);
                });
                context.showInfo('Return types added successfully!');
            } else {
                context.showInfo('No changes needed');
            }
        } catch (error) {
            context.showError(error instanceof Error ? error.message : 'Unknown error');
        } finally {
            context.setLoading(false);
        }
    }
}