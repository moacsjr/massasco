import { NextResponse } from 'next/server';

const MAX_AGE = 3600 * 24;

export function isSecureRequest(request: Request): boolean {
  const forwardedProto = request.headers.get('x-forwarded-proto');
  return (
    forwardedProto === 'https' || new URL(request.url).protocol === 'https:'
  );
}

export function setAuthCookies(
  response: NextResponse,
  request: Request,
  idToken: string,
  accessToken: string,
): NextResponse {
  const secure = isSecureRequest(request);

  // Read by the proxy and the frontend.
  response.cookies.set('id_token', idToken, {
    httpOnly: false,
    secure,
    sameSite: 'lax',
    path: '/',
    maxAge: MAX_AGE,
  });

  response.cookies.set('access_token', accessToken, {
    httpOnly: true,
    secure,
    sameSite: 'lax',
    path: '/',
    maxAge: MAX_AGE,
  });

  return response;
}
