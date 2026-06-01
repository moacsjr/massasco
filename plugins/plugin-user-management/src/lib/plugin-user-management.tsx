'use client';

import React, { useEffect, useState } from 'react';
import { FeaturePlugin, pluginLoader } from '@temp-workspace/plugin-loader';
import { useUI } from '@temp-workspace/ui-registry';
import { UserServiceAPI } from '@temp-workspace/plugin-user-service';

const UserManagementPage: React.FC = () => {
  const { resolve } = useUI();
  const Card = resolve('Card');
  const Button = resolve('Button');
  const Input = resolve('Input');

  const [users, setUsers] = useState<any[]>([]);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const fetchUsers = async () => {
    try {
      const userService = pluginLoader.getService<UserServiceAPI>('user-service');
      const data = await userService.listUsers();
      setUsers(data);
    } catch (err: any) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email) {
      setError('Por favor, preencha nome e e-mail.');
      return;
    }

    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const userService = pluginLoader.getService<UserServiceAPI>('user-service');
      await userService.createUser({ name, email });
      setSuccess(`Usuário ${name} convidado com sucesso!`);
      setName('');
      setEmail('');
      // Recarregar a lista
      await fetchUsers();
    } catch (err: any) {
      setError(err.message || 'Erro ao criar usuário.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto p-4 md:p-6 text-foreground">
      <div className="flex flex-col md:flex-row gap-6">
        {/* Formulário de Criação */}
        <div className="w-full md:w-5/12">
          <Card title="Convidar Novo Usuário" padding="lg">
            <form onSubmit={handleCreateUser} className="space-y-4">
              {error && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-200 text-sm">
                  {error}
                </div>
              )}
              {success && (
                <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-emerald-200 text-sm">
                  {success}
                </div>
              )}

              <Input
                name="name"
                label="Nome Completo"
                type="text"
                placeholder="Ex: João Silva"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />

              <Input
                name="email"
                label="E-mail"
                type="email"
                placeholder="Ex: joao@massas.co"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />

              <div className="pt-2">
                <Button variant="primary" size="md" isLoading={isLoading}>
                  Enviar Convite
                </Button>
              </div>
            </form>
          </Card>
        </div>

        {/* Lista de Usuários */}
        <div className="w-full md:w-7/12">
          <Card title="Usuários Cadastrados" padding="lg">
            {users.length === 0 ? (
              <p className="text-slate-500 text-sm">Nenhum usuário cadastrado.</p>
            ) : (
              <div className="divide-y divide-border">
                {users.map((user) => (
                  <div
                    key={user.id}
                    className="py-3 flex justify-between items-center first:pt-0 last:pb-0"
                  >
                    <div>
                      <p className="font-semibold text-sm">{user.name}</p>
                      <p className="text-xs text-slate-500">{user.email}</p>
                    </div>
                    <span className="px-2 py-0.5 text-xs rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                      Ativo
                    </span>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
};

const UserMenuContribution: React.FC = () => {
  return (
    <a
      href="/plugins/user-management"
      className="text-slate-400 no-underline text-sm hover:text-white transition-colors"
    >
      👥 Usuários
    </a>
  );
};

export const userManagementPlugin: FeaturePlugin = {
  id: 'user-management',
  name: 'Gestão de Usuários',
  type: 'feature',
  routes: [
    {
      path: '',
      component: UserManagementPage,
      label: 'Usuários',
    },
  ],

  contributions: [
    {
      point: 'menubar:items',
      component: UserMenuContribution,
    },
  ],
};
