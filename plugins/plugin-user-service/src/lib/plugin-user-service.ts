import { ServicePlugin } from '@temp-workspace/plugin-loader';

export interface UserServiceAPI {
  listUsers(): Promise<any[]>;
  createUser(user: any): Promise<any>;
}

const userServiceAPI: UserServiceAPI = {
  listUsers: async () => {
    return [
      { id: '1', name: 'Alice', email: 'alice@example.com' },
      { id: '2', name: 'Bob', email: 'bob@example.com' },
    ];
  },
  createUser: async (user) => {
    console.log('Creating user:', user);
    return { id: Math.random().toString(), ...user };
  }
};

export const userServicePlugin: ServicePlugin = {
  id: 'user-service',
  name: 'User Service',
  type: 'service',
  api: userServiceAPI
};
