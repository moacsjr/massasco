import { NextResponse } from 'next/server';
import {
  CognitoIdentityProviderClient,
  InitiateAuthCommand,
} from '@aws-sdk/client-cognito-identity-provider';
import { setAuthCookies } from '../../../../lib/auth-cookies';

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

// Same message for unknown user and wrong password, so the API does not reveal which e-mails exist.
const INVALID_CREDENTIALS = 'E-mail ou senha inválidos.';

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: 'E-mail e senha são obrigatórios.' },
        { status: 400 },
      );
    }

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
          {
            error:
              'Credenciais inválidas no modo desenvolvimento (use admin@massas.co / admin123).',
          },
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

      if (response.ChallengeName === 'NEW_PASSWORD_REQUIRED') {
        return NextResponse.json(
          { challenge: 'NEW_PASSWORD_REQUIRED', session: response.Session },
          { status: 200 },
        );
      }

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

    return setAuthCookies(
      NextResponse.json({ success: true, user: { email } }, { status: 200 }),
      request,
      idToken,
      accessToken,
    );
  } catch (error: any) {
    if (
      error?.name === 'NotAuthorizedException' ||
      error?.name === 'UserNotFoundException'
    ) {
      return NextResponse.json({ error: INVALID_CREDENTIALS }, { status: 401 });
    }

    if (error?.name === 'PasswordResetRequiredException') {
      return NextResponse.json(
        { error: 'É necessário redefinir a senha. Procure um administrador.' },
        { status: 401 },
      );
    }

    console.error('[Auth Error]', error);
    return NextResponse.json(
      { error: 'Erro interno ao realizar autenticação.' },
      { status: 500 },
    );
  }
}
