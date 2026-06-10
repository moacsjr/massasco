import { NextResponse } from 'next/server';
import {
  CognitoIdentityProviderClient,
  InitiateAuthCommand,
} from '@aws-sdk/client-cognito-identity-provider';

function createMockJwt(email: string, name: string): string {
  const header = Buffer.from(
    JSON.stringify({ alg: 'none', typ: 'JWT' }),
  ).toString('base64url');
  const payload = Buffer.from(
    JSON.stringify({
      sub: 'mock-user-12345',
      name: name,
      email: email,
      exp: Math.floor(Date.now() / 1000) + 3600 * 24, // 24 horas
    }),
  ).toString('base64url');
  return `${header}.${payload}.mock_signature`;
}

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: 'E-mail e senha são obrigatórios.' },
        { status: 400 },
      );
    }

    // Verificar se a requisição veio via HTTPS (diretamente ou via proxy/ALB)
    const forwardedProto = request.headers.get('x-forwarded-proto');
    const isSecure = forwardedProto === 'https' || new URL(request.url).protocol === 'https:';

    const userPoolId = process.env.COGNITO_USER_POOL_ID;
    const clientId = process.env.COGNITO_CLIENT_ID;
    const region = process.env.COGNITO_REGION || 'us-east-1';

    const isMockMode = !userPoolId || userPoolId === 'mock' || !clientId;

    let idToken = '';
    let accessToken = '';

    if (isMockMode) {
      console.log('[Auth] Modo Mock ativo para login');
      // Credenciais Mock padrão: admin@massas.co / admin123
      if (email === 'admin@massas.co' && password === 'admin123') {
        idToken = createMockJwt(email, 'Administrador Massas.co');
        accessToken = createMockJwt(email, 'Administrador Massas.co');
      } else {
        return NextResponse.json(
          { error: 'Credenciais inválidas no modo desenvolvimento (use admin@massas.co / admin123).' },
          { status: 401 },
        );
      }
    } else {
      console.log('[Auth] Autenticando com AWS Cognito');
      const client = new CognitoIdentityProviderClient({ region });
      const command = new InitiateAuthCommand({
        AuthFlow: 'USER_PASSWORD_AUTH',
        ClientId: clientId,
        AuthParameters: {
          USERNAME: email,
          PASSWORD: password,
        },
      });

      const response = await client.send(command);

      if (
        !response.AuthenticationResult ||
        !response.AuthenticationResult.IdToken ||
        !response.AuthenticationResult.AccessToken
      ) {
        return NextResponse.json(
          { error: 'Resposta de autenticação inválida do Cognito.' },
          { status: 401 },
        );
      }

      idToken = response.AuthenticationResult.IdToken;
      accessToken = response.AuthenticationResult.AccessToken;
    }

    // Retornar os cookies HTTP-Only e de sessão
    const nextResponse = NextResponse.json(
      { success: true, user: { email } },
      { status: 200 },
    );

    // Cookie de ID Token (utilizado pelo Middleware e pelo frontend)
    nextResponse.cookies.set('id_token', idToken, {
      httpOnly: false, // Permitir leitura no client do monorepo se necessário
      secure: isSecure, // Usar secure apenas se a conexão for HTTPS
      sameSite: 'lax',
      path: '/',
      maxAge: 3600 * 24, // 24h
    });

    // Cookie de Access Token (HTTP-Only para requisições de API)
    nextResponse.cookies.set('access_token', accessToken, {
      httpOnly: true,
      secure: isSecure, // Usar secure apenas se a conexão for HTTPS
      sameSite: 'lax',
      path: '/',
      maxAge: 3600 * 24,
    });

    return nextResponse;
  } catch (error: any) {
    console.error('[Auth Error]', error);
    return NextResponse.json(
      { error: error.message || 'Erro interno ao realizar autenticação.' },
      { status: 500 },
    );
  }
}
