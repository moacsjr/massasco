'use client';

import React, { useState } from 'react';
import { loadStripe } from '@stripe/stripe-js';

// Initialize Stripe with publishable key
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '');

interface CheckoutButtonProps {
  orderId: string;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

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

  const handleCheckout = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // 1. Call your backend to create a Stripe Checkout Session
      const response = await fetch('/api/stripe/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create checkout session');
      }

      if (data.url) {
        // 2. Redirect the customer to the Stripe-hosted checkout page
        window.location.href = data.url;
      } else {
        setError('No checkout URL received');
      }
    } catch (err: any) {
      console.error('Payment error:', err);
      setError(err.message || 'An error occurred while processing your payment');
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
        disabled={isLoading}
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
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm flex items-center gap-2">
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