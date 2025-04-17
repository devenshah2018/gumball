import { registry } from './base/registry';

// Import all tools here
import { AddReturnTypesTool } from './add-return-types';
import { GitMergeTool } from './git-merge';
import { GitRollbackTool } from './git-rollback';

// Register all tools
export function registerTools() {
    registry.registerTool(new AddReturnTypesTool());
    registry.registerTool(new GitMergeTool());
    registry.registerTool(new GitRollbackTool());
}

// Re-export everything needed by extension.ts
export { registry } from './base/registry';
export { Tool, ToolContext, Categories } from './base/types';