import { NextResponse } from 'next/server';
import { getClientModels } from '@/lib/providers/registry';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const models = getClientModels();
    return NextResponse.json({ models }, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to retrieve available models.' },
      { status: 500 }
    );
  }
}
