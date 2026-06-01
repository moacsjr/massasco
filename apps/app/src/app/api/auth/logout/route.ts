import { NextResponse } from 'next/server';

export async function POST() {
  const response = NextResponse.json({ success: true }, { status: 200 });

  // Expirar os cookies de autenticação imediatamente
  response.cookies.set('id_token', '', { path: '/', expires: new Date(0) });
  response.cookies.set('access_token', '', { path: '/', expires: new Date(0) });

  return response;
}

// Também aceitar GET para facilitar redirecionamentos simples
export async function GET() {
  const response = NextResponse.redirect(new URL('/plugins/login', process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'));
  response.cookies.set('id_token', '', { path: '/', expires: new Date(0) });
  response.cookies.set('access_token', '', { path: '/', expires: new Date(0) });
  return response;
}
