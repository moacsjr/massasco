import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

function isTokenExpired(token: string): boolean {
  try {
    const payloadPart = token.split('.')[1];
    if (!payloadPart) return true;

    // Converter base64url para base64 padrão e adicionar padding se necessário
    // (tokens gerados com Buffer.toString('base64url') não incluem padding)
    let base64 = payloadPart.replace(/-/g, '+').replace(/_/g, '/');
    const padLength = (4 - (base64.length % 4)) % 4;
    base64 += '='.repeat(padLength);

    const binaryString = atob(base64);
    const payload = JSON.parse(binaryString);

    if (payload && payload.exp) {
      return payload.exp * 1000 < Date.now();
    }
    return true;
  } catch (e) {
    return true;
  }
}

export function proxy(request: NextRequest) {
  const path = request.nextUrl.pathname;

  // Rotas públicas que não requerem autenticação
  const isPublicPath =
    path === '/plugins/login' ||
    path === '/api/health' ||
    path.startsWith('/api/auth/') ||
    path.startsWith('/_next/') ||
    path.includes('/favicon.ico') ||
    path.startsWith('/images/') ||
    path.startsWith('/plugins/customer-portal/');

  const idToken = request.cookies.get('id_token')?.value;
  const isExpired = idToken ? isTokenExpired(idToken) : true;

  if (!isPublicPath && isExpired) {
    // Se for uma requisição de API, retornar 401 Unauthorized
    if (path.startsWith('/api/')) {
      return new NextResponse(
        JSON.stringify({ error: 'Authentication required' }),
        { status: 401, headers: { 'content-type': 'application/json' } }
      );
    }
    // Caso contrário, redirecionar para a página de login
    const loginUrl = new URL('/plugins/login', request.url);
    loginUrl.searchParams.set('redirectTo', path);
    return NextResponse.redirect(loginUrl);
  }

  // Se o usuário está autenticado e tenta acessar a página de login, redireciona para a home
  if (path === '/plugins/login' && !isExpired) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Intercepta todas as rotas exceto arquivos estáticos
     */
    '/((?!_next/static|_next/image|favicon.ico|images).*)',
  ],
};