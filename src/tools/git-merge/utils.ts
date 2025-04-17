import * as vscode from 'vscode';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export async function getCurrentBranch(workspacePath: string): Promise<string> {
    try {
        const { stdout } = await execAsync('git rev-parse --abbrev-ref HEAD', { cwd: workspacePath });
        return stdout.trim();
    } catch (error) {
        throw new Error('Failed to get current branch');
    }
}

export async function getAllBranches(workspacePath: string): Promise<string[]> {
    try {
        const { stdout } = await execAsync('git branch', { cwd: workspacePath });
        return stdout
            .split('\n')
            .map(branch => branch.trim().replace('* ', ''))
            .filter(branch => branch !== '');
    } catch (error) {
        throw new Error('Failed to get branches');
    }
}

export async function mergeBranch(sourceBranch: string, targetBranch: string, workspacePath: string): Promise<void> {
    try {
        // First checkout target branch
        await execAsync(`git checkout ${targetBranch}`, { cwd: workspacePath });
        
        // Then merge source branch
        await execAsync(`git merge ${sourceBranch}`, { cwd: workspacePath });
        
        // Delete the source branch
        await execAsync(`git branch -d ${sourceBranch}`, { cwd: workspacePath });
    } catch (error) {
        // If anything fails, make sure we're back on the original branch
        await execAsync(`git checkout ${sourceBranch}`, { cwd: workspacePath });
        throw error;
    }
}