/**
 * Payment Integration Service
 * Supports Stripe (International) and CMI (Morocco)
 */

import express, { Request, Response } from 'express';
import Stripe from 'stripe';

const router = express.Router();

// Initialize Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2024-04-10' as any,
});

// Membership tiers pricing (in USD for Stripe, MAD for CMI)
const MEMBERSHIP_TIERS = {
  free: {
    name: 'Free',
    price: 0,
    features: ['Basic profile', 'View matches', 'Limited messaging'],
  },
  silver: {
    name: 'Silver',
    priceUSD: 9.99,
    priceMAD: 100,
    features: ['Everything in Free', 'Unlimited messaging', 'Priority support'],
  },
  gold: {
    name: 'Gold',
    priceUSD: 24.99,
    priceMAD: 250,
    features: ['Everything in Silver', 'Advanced matching', 'Export contacts'],
  },
  platinum: {
    name: 'Platinum',
    priceUSD: 49.99,
    priceMAD: 500,
    features: [
      'Everything in Gold',
      'Personal matchmaker',
      '1-on-1 mentoring',
      'VIP support',
    ],
  },
};

// Types
interface PaymentRequest {
  userId: string;
  tier: keyof typeof MEMBERSHIP_TIERS;
  paymentMethod: 'stripe' | 'cmi';
  currency?: 'usd' | 'mad';
}

interface PaymentResponse {
  success: boolean;
  sessionId?: string;
  clientSecret?: string;
  error?: string;
  paymentUrl?: string;
}

/**
 * Create Stripe checkout session (International)
 */
router.post('/checkout/stripe', async (req: Request, res: Response) => {
  try {
    const { userId, tier, currency = 'usd' } = req.body as PaymentRequest;

    if (!Object.keys(MEMBERSHIP_TIERS).includes(tier)) {
      return res.status(400).json({ error: 'Invalid tier' });
    }

    const tierData = MEMBERSHIP_TIERS[tier as keyof typeof MEMBERSHIP_TIERS];

    if (tier === 'free') {
      return res.status(400).json({ error: 'Cannot checkout free tier' });
    }

    // Get correct price based on currency
    const priceKey = currency === 'mad' ? 'priceMAD' : 'priceUSD';
    const price = tierData[priceKey as keyof typeof tierData] as number;

    // Create Stripe session
    const session = await stripe.checkout.sessions.create({
      customer_email: req.user?.email,
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency,
            product_data: {
              name: `Communium ${tierData.name} Membership`,
              description: tierData.features.join(', '),
            },
            unit_amount: Math.round(price * 100),
          },
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${process.env.FRONTEND_URL}/dashboard/payment/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.FRONTEND_URL}/dashboard/payment/cancel`,
      metadata: {
        userId,
        tier,
      },
    });

    res.json({
      success: true,
      sessionId: session.id,
      paymentUrl: session.url,
    });
  } catch (error) {
    console.error('Stripe checkout error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create checkout session',
    });
  }
});

/**
 * Create CMI payment (Morocco)
 * CMI (Credit Mutuel du Maroc) - Popular payment gateway in Morocco
 */
router.post('/checkout/cmi', async (req: Request, res: Response) => {
  try {
    const { userId, tier } = req.body as PaymentRequest;

    if (!Object.keys(MEMBERSHIP_TIERS).includes(tier)) {
      return res.status(400).json({ error: 'Invalid tier' });
    }

    if (tier === 'free') {
      return res.status(400).json({ error: 'Cannot checkout free tier' });
    }

    const tierData = MEMBERSHIP_TIERS[tier as keyof typeof MEMBERSHIP_TIERS];
    const amount = (tierData.priceMAD as number) * 100; // Amount in cents

    // Generate CMI payment reference
    const reference = `CMI-${userId}-${Date.now()}`;

    // CMI API integration (stub - needs real CMI API credentials)
    const cmiPayload = {
      MerchantId: process.env.CMI_MERCHANT_ID,
      Amount: amount,
      Currency: '504', // MAD currency code in ISO 4217
      OrderId: reference,
      OkUrl: `${process.env.BACKEND_URL}/api/payment/callback/success`,
      FailUrl: `${process.env.BACKEND_URL}/api/payment/callback/fail`,
      ShopUrl: `${process.env.FRONTEND_URL}/dashboard/payment/cancel`,
      BillToName: req.user?.email || 'User',
      BillToEmail: req.user?.email,
      BillToPhone: '', // Could be added from user profile
      OrderDescription: `Communium ${tierData.name} Membership`,
      ClientIp: req.ip,
      Metadata: {
        userId,
        tier,
        email: req.user?.email,
      },
    };

    // In production, this would call the actual CMI API
    // For now, return a stub response
    const cmiUrl = `https://cmigw.asseco.com.tr/PaymentGateway/Hosting/Default`;

    res.json({
      success: true,
      paymentUrl: cmiUrl, // Redirect user to this URL
      reference,
      metadata: {
        tier: tierData.name,
        amount: tierData.priceMAD,
        currency: 'MAD',
      },
    });
  } catch (error) {
    console.error('CMI checkout error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create CMI payment',
    });
  }
});

/**
 * Handle Stripe webhook (payment confirmation)
 */
router.post('/webhook/stripe', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'] as string;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || '';

  try {
    const event = stripe.webhooks.constructEvent(
      req.body as Buffer,
      sig,
      webhookSecret
    );

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session;
      const { userId, tier } = session.metadata as { userId: string; tier: string };

      // Update user membership in database
      console.log(`User ${userId} upgraded to ${tier} tier`);

      // TODO: Update Prisma database
      // await prisma.membership.update({
      //   where: { userId: parseInt(userId) },
      //   data: { tier: tier as MembershipTier }
      // });
    }

    res.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(400).json({ error: 'Webhook failed' });
  }
});

/**
 * Handle CMI callback (payment confirmation)
 */
router.post('/callback/cmi', async (req: Request, res: Response) => {
  try {
    const { OrderId, Status, Amount } = req.body;

    // Verify CMI signature
    // In production, verify the digital signature

    if (Status === '0') {
      // Payment successful
      console.log(`CMI payment successful for order ${OrderId}`);

      // Extract userId and tier from OrderId
      const [_, userId, timestamp] = OrderId.split('-');

      // TODO: Update Prisma database
      // await prisma.membership.update({
      //   where: { userId: parseInt(userId) },
      //   data: { tier: tier }
      // });

      return res.json({ success: true, message: 'Payment confirmed' });
    } else {
      // Payment failed
      console.log(`CMI payment failed for order ${OrderId}`);
      return res.json({ success: false, message: 'Payment failed' });
    }
  } catch (error) {
    console.error('CMI callback error:', error);
    res.status(500).json({ error: 'Callback processing failed' });
  }
});

/**
 * Get membership tiers and pricing
 */
router.get('/tiers', (req: Request, res: Response) => {
  const tiersWithPricing = Object.entries(MEMBERSHIP_TIERS).map(([key, value]) => ({
    id: key,
    name: value.name,
    priceUSD: (value as any).priceUSD || 0,
    priceMAD: (value as any).priceMAD || 0,
    features: value.features,
    popular: key === 'gold',
  }));

  res.json(tiersWithPricing);
});

/**
 * Verify payment status
 */
router.get('/status/:sessionId', async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params;

    const session = await stripe.checkout.sessions.retrieve(sessionId);

    res.json({
      status: session.payment_status,
      tier: session.metadata?.tier,
      amount: session.amount_total,
      currency: session.currency,
    });
  } catch (error) {
    console.error('Status check error:', error);
    res.status(500).json({ error: 'Failed to check payment status' });
  }
});

export default router;
