// pages/api/auth/logout.ts
import { NextResponse } from "next/server";

export async function POST( ) {
  const response = NextResponse.json({ success: true });
  
  response.cookies.set('idToken', '', {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    expires: new Date(0)
  });

  return response;
}