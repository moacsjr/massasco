import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import Stripe from 'stripe';

// Initialize Stripe with secret key
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2026-05-27.dahlia',
});

// Disable Next.js body parser for this route to handle raw Stripe webhook data
export const runtime = 'nodejs';

/**
 * POST /api/stripe/create-checkout-session
 * Creates a Stripe Checkout Session for a given order
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { orderId } = body;

    if (!orderId) {
      return NextResponse.json(
        { error: 'orderId is required' },
        { status: 400 },
      );
    }

    // Find the order with its items
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: {
          include: {
            product: true,
            selectedPrice: true,
          },
        },
      },
    });

    if (!order) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 },
      );
    }

    // Calculate the total amount for Stripe (in cents)
    const lineItems = order.items.map((item) => {
      // Get the price value (from selectedPrice or default to 0)
      const priceValue = item.selectedPrice
        ? Number(item.selectedPrice.value)
        : 0;

      // Create a Stripe price object for this product
      // In production, you'd typically create prices in Stripe dashboard first
      // and store the Stripe price ID in your database
      return {
        price_data: {
          currency: 'brl',
          product_data: {
            name: item.product.name,
            description: item.product.description || '',
            images: item.product.imageUrl ? [item.product.imageUrl] : undefined,
          },
          unit_amount: Math.round(priceValue * 100), // Convert to cents
        },
        quantity: item.quantity,
      };
    });

    // Check if there are any items with valid prices
    if (lineItems.length === 0) {
      return NextResponse.json(
        { error: 'No valid items in order' },
        { status: 400 },
      );
    }

    // Create Stripe Checkout Session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card', 'pix', 'boleto', 'cashapp'],
      line_items: lineItems,
      mode: 'payment',
      success_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/sucesso?order_id=${orderId}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/cancelado?order_id=${orderId}`,
      metadata: {
        orderId: orderId,
      },
      // Optional: Collect customer information
      // customer_email: order.items[0]?.product.category?.name || undefined,
      // Optional: Show tax calculation
      tax_id_collection: {
        enabled: true,
      },
    });

    return NextResponse.json({ url: session.url }, { status: 200 });
  } catch (error: any) {
    console.error('Error creating Stripe checkout session:', error);
    return NextResponse.json(
      {
        error: error.message || 'Failed to create checkout session',
        details: process.env.NODE_ENV === 'development' ? { stack: error.stack } : undefined,
      },
      { status: 500 },
    );
  }
}

/**
 * POST /api/stripe/webhook
 * Handles Stripe webhook events (for server-side updates)
 */
export async function POST_WEBHOOK(req: NextRequest) {
  const signature = req.headers.get('stripe-signature');

  if (!signature) {
    return NextResponse.json(
      { error: 'No stripe-signature header' },
      { status: 400 },
    );
  }

  let event: Stripe.Event;

  try {
    const body = await req.text();
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET || '',
    );
  } catch (error: any) {
    console.error('Webhook signature verification failed:', error);
    return NextResponse.json(
      { error: 'Webhook signature verification failed' },
      { status: 400 },
    );
  }

  // Handle different event types
  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session;
      const orderId = session.metadata?.orderId;

      if (orderId) {
        // Update order status to PAID
        await prisma.order.update({
          where: { id: orderId },
          data: { status: 'PAID' },
        });
        console.log(`Order ${orderId} marked as PAID via Stripe`);
      }
      break;
    }

    case 'checkout.session.expired': {
      const session = event.data.object as Stripe.Checkout.Session;
      const orderId = session.metadata?.orderId;

      if (orderId) {
        // Optionally update order status
        console.log(`Checkout session expired for order ${orderId}`);
      }
      break;
    }

    case 'payment_intent.payment_failed': {
      const paymentIntent = event.data.object as Stripe.PaymentIntent;
      console.error(
        `Payment failed for payment intent: ${paymentIntent.id}`,
      );
      break;
    }

    default:
      console.log(`Unhandled event type: ${event.type}`);
  }

  return NextResponse.json({ received: true });
}