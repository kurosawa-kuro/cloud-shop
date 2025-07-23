import { NextResponse } from 'next/server';

export async function GET() {
  console.log('');
  // DB アクセス無し

  return NextResponse.json({ });
}