'use client';

import React, { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle2, ArrowRight, Home, ShoppingBag } from 'lucide-react';

export default function SuccessPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const orderId = searchParams.get('order_id');
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');

  useEffect(() => {
    // In a real app, you might want to verify the payment status with your backend
    // For now, we'll just show the success state
    setStatus('success');
  }, []);

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Card className="shadow-lg">
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <CheckCircle2 className="w-8 h-8 text-green-600" />
            </div>
            <CardTitle className="text-2xl font-bold text-foreground">
              Pagamento Confirmado!
            </CardTitle>
            <CardDescription className="text-muted-foreground">
              Obrigado pela sua compra. Seu pedido foi processado com sucesso.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {orderId && (
              <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                <p className="text-sm text-muted-foreground mb-1">ID do Pedido</p>
                <p className="font-mono text-foreground font-medium">{orderId}</p>
              </div>
            )}

            <div className="space-y-3">
              <h3 className="font-semibold text-foreground">O que aconteceu em seguida:</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-start">
                  <CheckCircle2 className="w-4 h-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                  <span>Enviamos um e-mail de confirmação para você</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle2 className="w-4 h-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                  <span>Sua pedido está sendo preparado</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle2 className="w-4 h-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                  <span>Você receberá atualizações sobre o status do pedido</span>
                </li>
              </ul>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Button
                variant="outline"
                className="w-full"
                onClick={() => router.push('/')}
              >
                <Home className="w-4 h-4 mr-2" />
                Início
              </Button>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => router.push('/orders')}
              >
                <ShoppingBag className="w-4 h-4 mr-2" />
                Meus Pedidos
              </Button>
            </div>

            <div className="pt-4 border-t border-gray-200">
              <p className="text-center text-xs text-muted-foreground">
                Se tiver alguma dúvida, entre em contato com nosso suporte.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}