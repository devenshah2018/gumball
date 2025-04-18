export function generateApiRoute(resourceName: string): string {
    const capitalizedResource = resourceName.charAt(0).toUpperCase() + resourceName.slice(1);
    
    return `import { NextRequest, NextResponse } from 'next/server';
import type { ${capitalizedResource} } from '@/types/${resourceName}';  // Update this import path to match your project structure

export async function POST(req: NextRequest) {
    const body = await req.json() as ${capitalizedResource};
    // Implementation here
    return NextResponse.json({ message: 'Created successfully' });
}

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    const page = parseInt(searchParams.get('page') ?? '1');
    const limit = parseInt(searchParams.get('limit') ?? '10');
    const filters = searchParams.get('filters');
    
    // Implementation here
    return NextResponse.json({ 
        data: [],
        pagination: { page, limit, total: 0 }
    });
}

export async function PUT(req: NextRequest) {
    const body = await req.json() as Partial<${capitalizedResource}>;
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    
    if (!id) {
        return NextResponse.json(
            { error: 'ID is required' },
            { status: 400 }
        );
    }

    // Implementation here
    return NextResponse.json({ message: 'Updated successfully' });
}

export async function DELETE(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    
    if (!id) {
        return NextResponse.json(
            { error: 'ID is required' },
            { status: 400 }
        );
    }

    // Implementation here
    return NextResponse.json({ message: 'Deleted successfully' });
}`;
}