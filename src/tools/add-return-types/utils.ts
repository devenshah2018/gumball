import * as ts from 'typescript';
  
export function createTsProgram(sourceCode: string) {
    const fileName = 'analysis.ts';
    const compilerHost = ts.createCompilerHost({
        strict: true,
        noImplicitAny: true,
        strictNullChecks: true,
        strictFunctionTypes: true,
        strictBindCallApply: true
    });
    
    compilerHost.getSourceFile = (name) => {
        return name === fileName 
            ? ts.createSourceFile(name, sourceCode, ts.ScriptTarget.Latest)
            : undefined;
    };
    
    return ts.createProgram([fileName], {
        noResolve: true,
        target: ts.ScriptTarget.Latest,
        allowJs: true,
        strict: true,
        noImplicitAny: true,
        strictNullChecks: true,
        strictFunctionTypes: true,
        strictBindCallApply: true
    }, compilerHost);
}

export function collectReturnTypes(node: ts.Node, checker: ts.TypeChecker): Set<string> {
    const types = new Set<string>();
    let hasExplicitReturn = false;

    function visit(node: ts.Node) {
        // Check for return statements
        if (ts.isReturnStatement(node)) {
            hasExplicitReturn = true;
            if (node.expression) {
                const type = checker.getTypeAtLocation(node.expression);
                types.add(checker.typeToString(type));
            } else {
                types.add('void');
            }
            return;
        }

        // Check if all code paths in an if statement return
        if (ts.isIfStatement(node)) {
            const thenReturns = hasReturnStatement(node.thenStatement);
            const elseReturns = node.elseStatement ? hasReturnStatement(node.elseStatement) : false;
            
            if (thenReturns && !elseReturns || !thenReturns && elseReturns) {
                types.add('undefined');
            }
        }

        ts.forEachChild(node, visit);
    }

    function hasReturnStatement(node: ts.Node): boolean {
        if (ts.isReturnStatement(node)) return true;
        if (ts.isBlock(node)) {
            return node.statements.some(stmt => hasReturnStatement(stmt));
        }
        return false;
    }

    visit(node);
    
    // If no explicit return found in a function, it implicitly returns undefined
    if (!hasExplicitReturn && ts.isFunctionLike(node)) {
        types.add('undefined');
    }

    return types;
}

export function addReturnTypesToFunctions(sourceCode: string): string {
    const program = createTsProgram(sourceCode);
    const checker = program.getTypeChecker();
    const sourceFile = program.getSourceFile('analysis.ts')!;
    let result = sourceCode;

    // Collect all functions and their positions
    const functionNodes: { node: ts.FunctionDeclaration | ts.MethodDeclaration, pos: number }[] = [];
    
    function collectFunctions(node: ts.Node) {
        if (ts.isFunctionDeclaration(node) || ts.isMethodDeclaration(node)) {
            if (!node.type) { // Only process functions without return types
                functionNodes.push({ node, pos: node.getStart() });
            }
        }
        ts.forEachChild(node, collectFunctions);
    }

    ts.forEachChild(sourceFile, collectFunctions);

    // Process functions in reverse order to maintain correct positions
    for (const {node, pos} of functionNodes.reverse()) {
        const types = collectReturnTypes(node, checker);
        
        // Handle async functions
        if (node.modifiers?.some(m => m.kind === ts.SyntaxKind.AsyncKeyword)) {
            const innerTypes = Array.from(types);
            const promiseType = innerTypes.length === 1 ? innerTypes[0] : innerTypes.join(' | ');
            types.clear();
            types.add(`Promise<${promiseType}>`);
        }

        // Never use 'any' type in strict mode
        let returnType = 'unknown';
        if (types.size > 0) {
            const typeArray = Array.from(types);
            // Filter out 'any' types
            const strictTypes = typeArray.filter(t => t !== 'any');
            returnType = strictTypes.length === 0 ? 'unknown' : 
                        strictTypes.length === 1 ? strictTypes[0] : 
                        strictTypes.join(' | ');
        }

        // Insert the return type
        const closeParenPos = node.parameters.end + 1;
        const insertPos = sourceFile.getLineAndCharacterOfPosition(closeParenPos);
        
        result = [
            result.slice(0, closeParenPos),
            `: ${returnType}`,
            result.slice(closeParenPos)
        ].join('');
    }

    return result;
}