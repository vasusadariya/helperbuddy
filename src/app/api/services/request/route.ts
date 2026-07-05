import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(req: Request) {
    try {
        const { name } = await req.json();

        if (!name || name.length < 3 || name.length > 50) {
            return NextResponse.json({ error: 'Invalid service name' }, { status: 400 });
        }

        const newService = await prisma.requestedService.create({
            data: { name },
        });

        return NextResponse.json(newService, { status: 201 });
    } catch (error) {
        console.error('Error requesting service:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
