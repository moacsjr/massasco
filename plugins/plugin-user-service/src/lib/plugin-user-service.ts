import { ServicePlugin } from '@temp-workspace/plugin-loader';

export interface UserServiceAPI {
  listUsers(): Promise<any[]>;
  createUser(user: any): Promise<any>;
}

const userServiceAPI: UserServiceAPI = {
  listUsers: async () => {
    try {
      const res = await fetch('/api/users');
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Erro ao listar usuários.');
      }
      return await res.json();
    } catch (e) {
      console.error('[UserService Client Error]', e);
      throw e;
    }
  },
  createUser: async (user) => {
    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(user),
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Erro ao criar usuário.');
      }
      return await res.json();
    } catch (e) {
      console.error('[UserService Client Error]', e);
      throw e;
    }
  },
};

export const userServicePlugin: ServicePlugin = {
  id: 'user-service',
  name: 'User Service',
  type: 'service',
  api: userServiceAPI,
};
