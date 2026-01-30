import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    status: 'healthy',
    service: 'code-runner-web',
    timestamp: new Date().toISOString(),
  });
}
