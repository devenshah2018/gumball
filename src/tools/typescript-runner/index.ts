import * as vscode from 'vscode';
import { Tool, ToolContext, Categories } from '../base/types';
import { compileAndRunTypeScript, saveOutput } from './utils';

export class TypeScriptRunnerTool implements Tool {
    id = 'runTypeScript';
    name = 'Runner';
    description = 'Compile and run the current TypeScript file with console output';
    category = Categories.TYPESCRIPT;

    async execute(context: ToolContext): Promise<void> {
        try {
            context.setLoading(true);

            const editor = vscode.window.activeTextEditor;
            if (!editor) {
                throw new Error('No active editor found');
            }

            const doc = editor.document;
            if (!doc.fileName.endsWith('.ts')) {
                throw new Error('Not a TypeScript file');
            }

            // Save the file first to ensure we're running the latest version
            await doc.save();

            // Compile and run the file
            const output = await compileAndRunTypeScript(
                doc.fileName,
                context.workspaceFolder.fsPath
            );

            // Save the output and show it
            const outputPath = await saveOutput(output, context.workspaceFolder.fsPath);
            const outputDoc = await vscode.workspace.openTextDocument(outputPath);
            await vscode.window.showTextDocument(outputDoc, { preview: false });

            context.showInfo('TypeScript file compiled and run successfully!');
        } catch (error) {
            context.showError(error instanceof Error ? error.message : 'Unknown error');
        } finally {
            context.setLoading(false);
        }
    }
}