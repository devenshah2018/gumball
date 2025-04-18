import * as path from 'path';
import * as fs from 'fs/promises';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

async function findTypeScriptPath(workspacePath: string): Promise<string> {
    // Try workspace's TypeScript first
    const workspaceTsc = path.join(workspacePath, 'node_modules', '.bin', 'tsc');
    try {
        await fs.access(workspaceTsc);
        return workspaceTsc;
    } catch {
        // Try extension's TypeScript
        const extensionTsc = path.join(__dirname, '..', '..', '..', 'node_modules', '.bin', 'tsc');
        try {
            await fs.access(extensionTsc);
            return extensionTsc;
        } catch {
            // Use global TypeScript as last resort
            return 'tsc';
        }
    }
}

export async function compileAndRunTypeScript(filePath: string, workspacePath: string): Promise<string> {
    const tempDir = path.join(workspacePath, '.ts-runner-temp');
    
    try {
        // Find TypeScript compiler
        const tscPath = await findTypeScriptPath(workspacePath);
        
        // Ensure temp directory exists and is empty
        await fs.rm(tempDir, { recursive: true, force: true });
        await fs.mkdir(tempDir, { recursive: true });

        // Copy source file to temp directory
        const tempFilePath = path.join(tempDir, path.basename(filePath));
        await fs.copyFile(filePath, tempFilePath);

        // Create a basic tsconfig.json
        const tsConfig = {
            compilerOptions: {
                target: "es2022",
                module: "commonjs",
                strict: true,
                esModuleInterop: true,
                skipLibCheck: true,
                outDir: "dist",
                moduleResolution: "node",
                types: ["node"]
            },
            files: [path.basename(filePath)]
        };
        
        const tsConfigPath = path.join(tempDir, 'tsconfig.json');
        await fs.writeFile(tsConfigPath, JSON.stringify(tsConfig, null, 2));

        // Ensure dist directory exists
        const distDir = path.join(tempDir, 'dist');
        await fs.mkdir(distDir, { recursive: true });

        // Compile the TypeScript file
        await execAsync(`"${tscPath}" -p "${tsConfigPath}"`, { 
            cwd: tempDir,
            env: { ...process.env, NODE_PATH: path.join(workspacePath, 'node_modules') }
        });

        // Run the compiled JavaScript
        const jsPath = path.join(distDir, path.basename(filePath, '.ts') + '.js');
        const { stdout, stderr } = await execAsync(`node "${jsPath}"`, { 
            cwd: tempDir,
            env: { ...process.env, NODE_PATH: path.join(workspacePath, 'node_modules') }
        });

        // Format output
        const output = [
            stdout.trim(),
            stderr.trim() ? '\n=== Errors ===\n' + stderr.trim() : ''
        ].filter(Boolean).join('\n');

        return output;

    } catch (error) {
        const err = error as { stderr?: string, message?: string };
        throw new Error('Failed to compile and run TypeScript: ' + 
            (err.stderr || err.message || String(error)));
    } finally {
        // Clean up
        try {
            await fs.rm(tempDir, { recursive: true, force: true });
        } catch {} // Ignore cleanup errors
    }
}

export async function saveOutput(output: string, workspacePath: string): Promise<string> {
    const outputPath = path.join(workspacePath, 'output.txt');
    await fs.writeFile(outputPath, output, 'utf-8');
    return outputPath;
}