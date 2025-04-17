import * as vscode from 'vscode';

export interface Tool {
    id: string;
    name: string;
    description: string;
    category: ToolCategory;
    execute(context: ToolContext): Promise<void>;
}

export interface ToolCategory {
    id: string;
    name: string;
    description: string;
}

export interface ToolContext {
    workspaceFolder: vscode.Uri;
    showError(message: string): void;
    showInfo(message: string): void;
    setLoading(isLoading: boolean): void;
}

export const Categories: { [key: string]: ToolCategory } = {
    TYPESCRIPT: {
        id: 'typescript',
        name: 'TypeScript',
        description: 'Tools for TypeScript development'
    },
    GIT: {
        id: 'git',
        name: 'Git',
        description: 'Git operations and utilities'
    }
} as const;