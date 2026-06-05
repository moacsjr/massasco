'use client';

import React, { useState } from 'react';

interface CheckoutButtonProps {
  orderId: string;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const CHECKOUT_ENDPOINT = '/api/stripe/create-checkout-session';

/**
 * CheckoutButton
 *
 * A button that initiates Stripe Checkout for a given order.
 * The actual payment processing happens on Stripe's secure servers.
 *
 * @param orderId - The ID of the order to process payment for
 * @param variant - Button variant (primary, secondary, outline, ghost)
 * @param size - Button size (sm, md, lg)
 * @param className - Additional CSS classes
 */
export const CheckoutButton: React.FC<CheckoutButtonProps> = ({
  orderId,
  variant = 'primary',
  size = 'md',
  className = '',
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Validate orderId before processing
  if (!orderId.trim()) {
    setError('Pedido inválido');
  }

  const handleCheckout = async () => {
    // Guard against double clicks
    if (isLoading) return;

    // Validate orderId
    if (!orderId.trim()) {
      setError('Pedido inválido');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // 1. Call your backend to create a Stripe Checkout Session
      const response = await fetch(CHECKOUT_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId }),
      });

      // Safer JSON parsing
      let data;
      try {
        data = await response.json();
      } catch {
        throw new Error('Resposta inválida do servidor');
      }

      if (!response.ok) {
        throw new Error(data.error || 'Falha ao criar sessão de checkout');
      }

      if (data.url) {
        // 2. Redirect the customer to the Stripe-hosted checkout page
        window.location.assign(data.url);
        return;
      } else {
        setError('Nenhuma URL de checkout recebida');
      }
    } catch (err: unknown) {
      console.error('Payment error:', err);
      const message =
        err instanceof Error
          ? err.message
          : 'Ocorreu um erro ao processar seu pagamento';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  // Button variant styles
  const variantStyles = {
    primary: 'bg-brand text-white hover:bg-brand/90',
    secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
    outline: 'border border-border bg-background hover:bg-accent hover:text-accent-foreground',
    ghost: 'hover:bg-accent hover:text-accent-foreground',
  };

  // Button size styles
  const sizeStyles = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg',
  };

  return (
    <div className="flex flex-col gap-2">
      <button
        onClick={handleCheckout}
        disabled={isLoading || !orderId.trim()}
        aria-busy={isLoading}
        aria-disabled={isLoading || !orderId.trim()}
        className={`
          ${variantStyles[variant]}
          ${sizeStyles[size]}
          ${className}
          rounded-lg font-medium transition-all duration-200
          flex items-center justify-center gap-2
          disabled:opacity-50 disabled:cursor-not-allowed
          focus:outline-none focus:ring-2 focus:ring-brand focus:ring-offset-2
        `}
      >
        {isLoading ? (
          <>
            <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span>Processando...</span>
          </>
        ) : (
          <>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
            </svg>
            <span>Pagar com Cartão (Stripe)</span>
          </>
        )}
      </button>

      {error && (
        <div
          role="alert"
          aria-live="polite"
          className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm flex items-center gap-2"
        >
          <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>{error}</span>
        </div>
      )}

      <p className="text-xs text-muted-foreground text-center">
        <span className="font-semibold">Pagamento seguro via Stripe.</span> Suas informações de cartão são processadas de forma segura e criptografada.
      </p>
    </div>
  );
};