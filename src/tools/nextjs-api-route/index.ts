import * as vscode from 'vscode';
import { Tool, ToolContext, Categories } from '../base/types';
import { generateApiRoute } from './utils';

export class NextjsApiRouteTool implements Tool {
    id = 'createNextjsApiRoute';
    name = 'API Factory';
    description = 'Generate a Next.js API route handler with CRUD operations';
    category = Categories.NEXTJS;

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

            // Get resource name from user
            const resourceName = await vscode.window.showInputBox({
                prompt: 'Enter the resource name (e.g., users, posts)',
                placeHolder: 'users',
                validateInput: (value) => {
                    if (!value) {
                        return 'Resource name is required';
                    }
                    if (!/^[a-z][a-z0-9-]*$/.test(value)) {
                        return 'Resource name must be lowercase, start with a letter, and contain only letters, numbers, or hyphens';
                    }
                    return null;
                }
            });

            if (!resourceName) {
                return; // User cancelled
            }

            const code = generateApiRoute(resourceName);

            // Insert the code into the current file
            await editor.edit(editBuilder => {
                const fullRange = new vscode.Range(
                    doc.positionAt(0),
                    doc.positionAt(doc.getText().length)
                );
                editBuilder.replace(fullRange, code);
            });

            context.showInfo('API route created successfully!');
        } catch (error) {
            context.showError(error instanceof Error ? error.message : 'Unknown error');
        } finally {
            context.setLoading(false);
        }
    }
}