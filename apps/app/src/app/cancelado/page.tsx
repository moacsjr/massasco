'use client';

import React, { Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertCircle, ArrowRight, Home, ShoppingBag } from 'lucide-react';

function CancelPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const orderId = searchParams.get('order_id');

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Card className="shadow-lg">
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
              <AlertCircle className="w-8 h-8 text-red-600" />
            </div>
            <CardTitle className="text-2xl font-bold text-foreground">
              Pagamento Cancelado
            </CardTitle>
            <CardDescription className="text-muted-foreground">
              Nós recebemos o cancelamento do seu pagamento.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
              <p className="text-sm text-yellow-800">
                Seu pedido não foi processado. Você pode tentar novamente ou escolher outro método de pagamento.
              </p>
            </div>

            {orderId && (
              <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                <p className="text-sm text-muted-foreground mb-1">ID do Pedido</p>
                <p className="font-mono text-foreground font-medium">{orderId}</p>
                <p className="text-xs text-muted-foreground mt-2">
                  Este pedido permanece como "Aberto" e pode ser pago posteriormente.
                </p>
              </div>
            )}

            <div className="space-y-3">
              <h3 className="font-semibold text-foreground">O que você pode fazer:</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-start">
                  <ArrowRight className="w-4 h-4 text-brand mr-2 mt-0.5 flex-shrink-0" />
                  <span>Tentar novamente com outro método de pagamento</span>
                </li>
                <li className="flex items-start">
                  <ArrowRight className="w-4 h-4 text-brand mr-2 mt-0.5 flex-shrink-0" />
                  <span>Verificar se os dados do cartão estão corretos</span>
                </li>
                <li className="flex items-start">
                  <ArrowRight className="w-4 h-4 text-brand mr-2 mt-0.5 flex-shrink-0" />
                  <span>Entre em contato com seu banco para verificar limites</span>
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

export default function CancelPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Carregando...</div>}>
      <CancelPageContent />
    </Suspense>
  );
}
