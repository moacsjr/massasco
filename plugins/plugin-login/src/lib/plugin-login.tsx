'use client';

import React, { useState } from 'react';
import { FeaturePlugin } from '@temp-workspace/plugin-loader';
import { useUI } from '@temp-workspace/ui-registry';

const LoginPage: React.FC = () => {
  const { resolve } = useUI();
  const Card = resolve('Card');
  const Button = resolve('Button');
  const Icon = resolve('Icon');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Por favor, preencha todos os campos.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao realizar login');
      }

      // Login bem-sucedido: recarrega a página para atualizar o estado do app/middleware e redireciona
      window.location.href = '/';
    } catch (err: any) {
      setError(err.message || 'Credenciais inválidas ou erro no servidor.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-tr from-slate-950 via-slate-900 to-indigo-950 px-4">
      {/* Decorative blurred background shapes */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none"></div>

      <div className="w-full max-w-md z-10 transition-all duration-300 hover:scale-[1.01]">
        <div className="backdrop-blur-xl bg-slate-900/60 border border-white/10 rounded-2xl shadow-2xl p-8 relative overflow-hidden">
          {/* Header logo & title */}
          <div className="flex flex-col items-center mb-8">
            <div className="w-12 h-12 bg-indigo-600/20 border border-indigo-500/30 rounded-xl flex items-center justify-center text-indigo-400 mb-3 shadow-inner shadow-indigo-500/20">
              <Icon name="ChefHat" size="lg" />
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tight">
              massas<span className="text-indigo-400">.co</span>
            </h1>
            <p className="text-slate-400 text-sm mt-1">
              Portal do Desenvolvedor DevXP
            </p>
          </div>

          {error && (
            <div className="mb-6 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-200 text-sm flex items-center gap-2">
              <span>⚠️</span>
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5 text-left">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">
                E-mail
              </label>
              <input
                name="email"
                type="email"
                placeholder="exemplo@massas.co"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full h-10 px-3 py-2 bg-slate-800/80 border border-white/10 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
                autoComplete="email"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">
                Senha
              </label>
              <input
                name="password"
                type="password"
                placeholder="Sua senha secreta"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full h-10 px-3 py-2 bg-slate-800/80 border border-white/10 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
                autoComplete="current-password"
                required
              />
            </div>

            <div className="pt-2">
              <Button variant="primary" size="lg" isLoading={isLoading}>
                Entrar no Portal
              </Button>
            </div>
          </form>

          {/* Footer note */}
          <div className="text-center mt-6 text-xs text-slate-500">
            Apenas colaboradores autorizados. Acesso auditado.
          </div>
        </div>
      </div>
    </div>
  );
};

export const loginPlugin: FeaturePlugin = {
  id: 'login',
  name: 'Login',
  type: 'feature',
  routes: [
    {
      path: '',
      component: LoginPage,
      label: 'Login',
      showInMenu: false, // Ocultado do menu de navegação padrão
    },
  ],
};
