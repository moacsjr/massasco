# Stripe Checkout Integration

This document describes the Stripe Checkout integration for the Massasco payment system.

## Overview

The integration follows Stripe's recommended hybrid model:
- **Backend**: Creates and controls transactions securely
- **Frontend (React)**: Manages user experience and redirection

## Architecture

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│   React App     │────▶│   Backend API    │────▶│   Stripe API    │
│   (Frontend)    │     │   (Next.js)      │     │   (Payment)     │
└─────────────────┘     └──────────────────┘     └─────────────────┘
        │                        │                        │
        │                        │                        │
        │                        ▼                        ▼
        │              ┌──────────────────┐     ┌─────────────────┐
        │              │   Success/Cancel │     │   Webhook       │
        │              │   Pages          │     │   (Events)      │
        │              └──────────────────┘     └─────────────────┘
        │
        ▼
┌─────────────────┐
│   User Browser  │
│   (Redirect)    │
└─────────────────┘
```

## Files Created

### Backend (Next.js API Routes)

| File | Description |
|------|-------------|
| `apps/app/src/app/api/stripe/create-checkout-session/route.ts` | Creates Stripe Checkout Sessions |
| `apps/app/src/app/sucesso/page.tsx` | Success page after payment |
| `apps/app/src/app/cancelado/page.tsx` | Cancel page when payment is cancelled |

### Frontend (React Components)

| File | Description |
|------|-------------|
| `plugins/plugin-payments/src/lib/CheckoutButton.tsx` | Checkout button component |
| `plugins/plugin-payments/src/index.ts` | Exports for the plugin |

## Setup

### 1. Install Dependencies

```bash
pnpm add stripe @stripe/stripe-js
```

### 2. Configure Environment Variables

Copy `.env.example` to `.env.local` and fill in your Stripe credentials:

```bash
# Stripe Configuration (Get these from https://dashboard.stripe.com/test/apikeys)
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_PUBLISHABLE_KEY="pk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."

# App URL (for redirect URLs)
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

### 3. Get Your Stripe Credentials

1. Go to [Stripe Dashboard](https://dashboard.stripe.com/test/apikeys)
2. Copy your **Secret key** (starts with `sk_test_`)
3. Copy your **Publishable key** (starts with `pk_test_`)
4. For webhooks, see the Webhook Setup section below

## Usage

### Using the CheckoutButton Component

```tsx
import { CheckoutButton } from '@temp-workspace/plugin-payments';

// In your component
<CheckoutButton orderId="order-id-here" />
```

Props:
- `orderId` (required): The ID of the order to process
- `variant`: Button variant (`primary`, `secondary`, `outline`, `ghost`)
- `size`: Button size (`sm`, `md`, `lg`)
- `className`: Additional CSS classes

### Manual API Call

```tsx
const response = await fetch('/api/stripe/create-checkout-session', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ orderId: 'order-id' }),
});

const data = await response.json();
if (data.url) {
  window.location.href = data.url;
}
```

## Webhook Setup

### 1. Configure Webhook Endpoint

In Stripe Dashboard:
1. Go to [Developers → Webhooks](https://dashboard.stripe.com/test/webhooks)
2. Click "Add endpoint"
3. Set the endpoint URL to: `https://your-domain.com/api/stripe/webhook`
4. Select events to listen to:
   - `checkout.session.completed`
   - `checkout.session.expired`
   - `payment_intent.payment_failed`

### 2. Get the Webhook Signing Secret

After creating the endpoint, copy the **Signing secret** (starts with `whsec_`)

### 3. Add to Environment

Add the webhook secret to your `.env.local`:

```bash
STRIPE_WEBHOOK_SECRET="whsec_..."
```

## Testing

### Test Cards

Use these test card numbers:

| Card Number | Description |
|-------------|-------------|
| `4242 4242 4242 4242` | Success |
| `4000 0000 0000 0002` | Decline |
| `4000 0000 0000 0099` | Error |

### Test Flow

1. Click the Checkout button
2. Enter test card `4242 4242 4242 4242`
3. Enter any future date and 3-digit CVC
4. Complete the payment
5. You'll be redirected to the success page

## Customization

### Stripe Dashboard Customization

Customize the checkout page appearance in [Stripe Dashboard → Checkout → Settings](https://dashboard.stripe.com/test/checkout/settings):

- Upload your logo
- Set brand colors
- Configure layout options

### Success/Cancel Pages

Modify these pages to add your own content:
- `apps/app/src/app/sucesso/page.tsx`
- `apps/app/src/app/cancelado/page.tsx`

## Security Notes

1. **Never expose your Secret Key** - Keep it in environment variables
2. **Use the Publishable Key** in frontend code only
3. **Validate webhooks** - Always verify webhook signatures
4. **Server-side price validation** - Prices are validated on the server

## Troubleshooting

### "No valid items in order"
- Ensure the order has items with valid prices

### "Order not found"
- Verify the order ID is correct and exists in the database

### "Failed to create checkout session"
 - Check the server logs for detailed error messages
 - Verify Stripe API keys are correct

### "The payment method type provided: pix is invalid"
This error occurs when a payment method type is not enabled in your Stripe dashboard.

**To enable additional payment methods (PIX, Boleto, Cashapp):**

1. Go to [Stripe Dashboard → Payments → Settings](https://dashboard.stripe.com/account/payments/settings)
2. Scroll down to "Payment methods" section
3. Find the payment method you want to enable (e.g., PIX, Boleto, Cashapp)
4. Click "Enable" or toggle the switch
5. For preview features, you may need to enable them in [Stripe Dashboard → Developers → Preview features](https://dashboard.stripe.com/account/preview/features)

**Supported payment methods by country:**
- **Brazil (BRL):** `card`, `pix`, `boleto`, `cashapp`, `debit`, `credit`
- **United States (USD):** `card`, `cashapp`, `apple_pay`, `google_pay`

**Note:** The default configuration uses only `card` which is universally available on all Stripe accounts. To use additional payment methods, ensure they are enabled in your Stripe dashboard first.

For more information, see [Stripe Payment Methods Documentation](https://stripe.com/docs/payments/payment-methods/integration-options)

## References

- [Stripe Checkout Documentation](https://stripe.com/docs/payments/checkout)
- [Stripe Node.js Library](https://github.com/stripe/stripe-node)
- [Next.js API Routes](https://nextjs.org/docs/pages/building-your-application/routing/api-routes)