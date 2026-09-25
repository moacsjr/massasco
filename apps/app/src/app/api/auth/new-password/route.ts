import { NextResponse } from 'next/server';
import {
  CognitoIdentityProviderClient,
  RespondToAuthChallengeCommand,
} from '@aws-sdk/client-cognito-identity-provider';
import { setAuthCookies } from '../../../../lib/auth-cookies';

/**
 * POST /api/auth/new-password
 * Completes Cognito's NEW_PASSWORD_REQUIRED challenge (first login with a
 * temporary password) using the session returned by /api/auth/login.
 */
export async function POST(request: Request) {
  try {
    const { email, session, newPassword } = await request.json();

    if (!email || !session || !newPassword) {
      return NextResponse.json(
        { error: 'E-mail, sessão e nova senha são obrigatórios.' },
        { status: 400 },
      );
    }

    const clientId = process.env.COGNITO_CLIENT_ID;
    const region = process.env.COGNITO_REGION || 'us-east-1';

    if (!clientId) {
      return NextResponse.json(
        { error: 'Troca de senha indisponível no modo desenvolvimento.' },
        { status: 400 },
      );
    }

    const client = new CognitoIdentityProviderClient({ region });
    const response = await client.send(
      new RespondToAuthChallengeCommand({
        ClientId: clientId,
        ChallengeName: 'NEW_PASSWORD_REQUIRED',
        Session: session,
        ChallengeResponses: {
          USERNAME: email,
          NEW_PASSWORD: newPassword,
        },
      }),
    );

    const idToken = response.AuthenticationResult?.IdToken;
    const accessToken = response.AuthenticationResult?.AccessToken;

    if (!idToken || !accessToken) {
      return NextResponse.json(
        { error: 'Resposta de autenticação inválida do Cognito.' },
        { status: 401 },
      );
    }

    return setAuthCookies(
      NextResponse.json({ success: true, user: { email } }, { status: 200 }),
      request,
      idToken,
      accessToken,
    );
  } catch (error: any) {
    if (error?.name === 'InvalidPasswordException') {
      return NextResponse.json(
        {
          error:
            'A senha não atende à política: mínimo de 8 caracteres, com letra maiúscula, minúscula, número e símbolo.',
        },
        { status: 400 },
      );
    }

    // The challenge session is single-use and expires after a few minutes.
    if (
      error?.name === 'NotAuthorizedException' ||
      error?.name === 'CodeMismatchException' ||
      error?.name === 'ExpiredCodeException'
    ) {
      return NextResponse.json(
        {
          error:
            'Sessão expirada. Faça login novamente com a senha temporária.',
        },
        { status: 401 },
      );
    }

    // Malformed session or missing required user attributes.
    if (error?.name === 'InvalidParameterException') {
      console.warn('[Auth] new-password invalid parameter:', error.message);
      return NextResponse.json(
        {
          error:
            'Não foi possível trocar a senha. Faça login novamente com a senha temporária.',
        },
        { status: 400 },
      );
    }

    console.error('[Auth Error] new-password', error);
    return NextResponse.json(
      { error: 'Erro interno ao definir a nova senha.' },
      { status: 500 },
    );
  }
}
