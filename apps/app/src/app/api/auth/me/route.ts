import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function GET() {
  try {
    const cookieStore = await cookies();
    const idToken = cookieStore.get('id_token')?.value;

    if (!idToken) {
      return NextResponse.json({ error: 'Nenhum token encontrado.' }, { status: 401 });
    }

    // Decodificar o payload do JWT (ID Token)
    const payloadPart = idToken.split('.')[1];
    if (!payloadPart) {
      return NextResponse.json({ error: 'Token inválido.' }, { status: 401 });
    }

    const payload = JSON.parse(
      Buffer.from(payloadPart.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf-8')
    );

    // Verificar se o token expirou
    if (payload.exp && payload.exp * 1000 < Date.now()) {
      return NextResponse.json({ error: 'Sessão expirada.' }, { status: 401 });
    }

    return NextResponse.json({
      user: {
        name: payload.name || payload.email.split('@')[0],
        email: payload.email,
        sub: payload.sub,
      },
    });
  } catch (error) {
    console.error('[Session Error]', error);
    return NextResponse.json({ error: 'Erro ao validar sessão.' }, { status: 500 });
  }
}
