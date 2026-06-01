import { NextResponse } from 'next/server';
import {
  CognitoIdentityProviderClient,
  ListUsersCommand,
  AdminCreateUserCommand,
} from '@aws-sdk/client-cognito-identity-provider';

// In-memory mock storage for local development
const globalForUsers = global as unknown as { mockUsers: any[] };
if (!globalForUsers.mockUsers) {
  globalForUsers.mockUsers = [
    { id: '1', name: 'Alice', email: 'alice@example.com' },
    { id: '2', name: 'Bob', email: 'bob@example.com' },
    { id: '3', name: 'Administrador Massas.co', email: 'admin@massas.co' },
  ];
}

export async function GET() {
  try {
    const userPoolId = process.env.COGNITO_USER_POOL_ID;
    const region = process.env.COGNITO_REGION || 'us-east-1';

    const isMockMode = !userPoolId || userPoolId === 'mock';

    if (isMockMode) {
      console.log('[Users] Modo Mock: Listando usuários locais');
      return NextResponse.json(globalForUsers.mockUsers);
    }

    console.log('[Users] AWS Cognito: Listando usuários do User Pool');
    const client = new CognitoIdentityProviderClient({ region });
    const command = new ListUsersCommand({
      UserPoolId: userPoolId,
    });

    const response = await client.send(command);
    const users = (response.Users || []).map((user) => {
      const nameAttr = user.Attributes?.find((attr) => attr.Name === 'name')?.Value || '';
      const emailAttr = user.Attributes?.find((attr) => attr.Name === 'email')?.Value || '';
      return {
        id: user.Username || '',
        name: nameAttr || user.Username || '',
        email: emailAttr,
      };
    });

    return NextResponse.json(users);
  } catch (error: any) {
    console.error('[Users GET Error]', error);
    return NextResponse.json(
      { error: error.message || 'Erro ao listar usuários.' },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const { name, email } = await request.json();

    if (!name || !email) {
      return NextResponse.json(
        { error: 'Nome e E-mail são campos obrigatórios.' },
        { status: 400 },
      );
    }

    const userPoolId = process.env.COGNITO_USER_POOL_ID;
    const region = process.env.COGNITO_REGION || 'us-east-1';

    const isMockMode = !userPoolId || userPoolId === 'mock';

    if (isMockMode) {
      console.log('[Users] Modo Mock: Criando usuário local');
      // Impedir duplicados
      const exists = globalForUsers.mockUsers.some((u) => u.email === email);
      if (exists) {
        return NextResponse.json(
          { error: 'Já existe um usuário com este e-mail.' },
          { status: 400 },
        );
      }

      const newUser = {
        id: Math.random().toString(36).substr(2, 9),
        name,
        email,
      };
      globalForUsers.mockUsers.push(newUser);
      return NextResponse.json(newUser, { status: 201 });
    }

    console.log('[Users] AWS Cognito: Criando usuário no User Pool');
    const client = new CognitoIdentityProviderClient({ region });
    const command = new AdminCreateUserCommand({
      UserPoolId: userPoolId,
      Username: email,
      UserAttributes: [
        { Name: 'email', Value: email },
        { Name: 'name', Value: name },
        { Name: 'email_verified', Value: 'true' },
      ],
      DesiredDeliveryMediums: ['EMAIL'], // Cognito enviará e-mail com senha temporária
    });

    const response = await client.send(command);
    const createdUser = response.User;

    return NextResponse.json(
      {
        id: createdUser?.Username || email,
        name,
        email,
        status: createdUser?.UserStatus,
      },
      { status: 201 },
    );
  } catch (error: any) {
    console.error('[Users POST Error]', error);
    return NextResponse.json(
      { error: error.message || 'Erro ao criar usuário.' },
      { status: 500 },
    );
  }
}
