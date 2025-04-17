import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export async function checkForUncommittedChanges(workspacePath: string): Promise<boolean> {
    try {
        const { stdout } = await execAsync('git status --porcelain', { cwd: workspacePath });
        return stdout.trim().length > 0;
    } catch (error) {
        throw new Error('Failed to check git status');
    }
}

export async function rollbackCommits(numCommits: number, workspacePath: string): Promise<void> {
    try {
        // First verify we have enough commits to rollback
        const { stdout: logOutput } = await execAsync('git rev-list HEAD --count', { cwd: workspacePath });
        const totalCommits = parseInt(logOutput.trim(), 10);
        
        if (isNaN(totalCommits) || totalCommits < numCommits) {
            throw new Error(`Cannot rollback ${numCommits} commits. Only ${totalCommits} commits available.`);
        }

        // Use git reset --hard to move HEAD back
        await execAsync(`git reset --hard HEAD~${numCommits}`, { cwd: workspacePath });
    } catch (error) {
        throw new Error('Failed to rollback commits: ' + (error instanceof Error ? error.message : String(error)));
    }
}