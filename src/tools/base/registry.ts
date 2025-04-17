import { Tool, ToolCategory } from './types';

class ToolRegistry {
    private tools: Map<string, Tool> = new Map();
    private categories: Map<string, Tool[]> = new Map();

    registerTool(tool: Tool) {
        this.tools.set(tool.id, tool);
        
        const categoryTools = this.categories.get(tool.category.id) || [];
        categoryTools.push(tool);
        this.categories.set(tool.category.id, categoryTools);
    }

    getTool(id: string): Tool | undefined {
        return this.tools.get(id);
    }

    getToolsByCategory(categoryId: string): Tool[] {
        return this.categories.get(categoryId) || [];
    }

    getAllCategories(): ToolCategory[] {
        return Array.from(this.categories.keys()).map(id => {
            const tool = this.categories.get(id)?.[0];
            return tool?.category || { id, name: id, description: '' };
        });
    }
}

export const registry = new ToolRegistry();