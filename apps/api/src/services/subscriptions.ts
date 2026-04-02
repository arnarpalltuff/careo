import Stripe from 'stripe';
import { SubscriptionTier } from '@careo/shared';
import { prisma } from '../utils/prisma';
import { AppError } from '../types';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '');

const PRICE_TO_TIER: Record<string, SubscriptionTier> = {};
if (process.env.STRIPE_PLUS_PRICE_ID) PRICE_TO_TIER[process.env.STRIPE_PLUS_PRICE_ID] = 'PLUS';
if (process.env.STRIPE_FAMILY_PRICE_ID) PRICE_TO_TIER[process.env.STRIPE_FAMILY_PRICE_ID] = 'FAMILY';

const TIER_TO_PRICE: Partial<Record<SubscriptionTier, string | undefined>> = {
  PLUS: process.env.STRIPE_PLUS_PRICE_ID,
  FAMILY: process.env.STRIPE_FAMILY_PRICE_ID,
};

export async function createCheckoutSession(userId: string, tier: 'PLUS' | 'FAMILY') {
  const priceId = TIER_TO_PRICE[tier];
  if (!priceId) throw new AppError(400, 'invalid_tier', `No Stripe price configured for ${tier}`);

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new AppError(404, 'not_found', 'User not found');

  let customerId = user.stripeCustomerId;
  if (!customerId) {
    const customer = await stripe.customers.create({
      email: user.email,
      name: `${user.firstName} ${user.lastName}`,
      metadata: { userId: user.id },
    });
    customerId = customer.id;
    await prisma.user.update({ where: { id: userId }, data: { stripeCustomerId: customerId } });
  }

  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: 'subscription',
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${process.env.APP_URL}/subscription?success=true`,
    cancel_url: `${process.env.APP_URL}/subscription?cancelled=true`,
    subscription_data: { trial_period_days: 7 },
    metadata: { userId: user.id, tier },
  });

  return { checkoutUrl: session.url };
}

export async function handleWebhook(event: Stripe.Event) {
  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session;
      const userId = session.metadata?.userId;
      const tier = (session.metadata?.tier as SubscriptionTier) || 'FAMILY';
      if (userId) {
        await prisma.user.update({
          where: { id: userId },
          data: { subscriptionTier: tier },
        });
      }
      break;
    }
    case 'customer.subscription.updated': {
      const subscription = event.data.object as Stripe.Subscription;
      const customerId = subscription.customer as string;
      if (subscription.status === 'active' && subscription.items.data.length > 0) {
        const priceId = subscription.items.data[0].price.id;
        const tier = PRICE_TO_TIER[priceId];
        if (tier) {
          await prisma.user.updateMany({
            where: { stripeCustomerId: customerId },
            data: { subscriptionTier: tier },
          });
        }
      }
      break;
    }
    case 'customer.subscription.deleted': {
      const subscription = event.data.object as Stripe.Subscription;
      const customerId = subscription.customer as string;
      await prisma.user.updateMany({
        where: { stripeCustomerId: customerId },
        data: { subscriptionTier: 'FREE' },
      });
      break;
    }
  }
}

export async function getSubscriptionStatus(userId: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new AppError(404, 'not_found', 'User not found');

  const result: {
    tier: string;
    currentPeriodEnd?: string;
    cancelAtPeriodEnd?: boolean;
    planName?: string;
  } = { tier: user.subscriptionTier };

  if (user.stripeCustomerId) {
    const subscriptions = await stripe.subscriptions.list({
      customer: user.stripeCustomerId,
      status: 'active',
      limit: 1,
    });
    if (subscriptions.data.length > 0) {
      const sub = subscriptions.data[0];
      result.currentPeriodEnd = new Date(sub.current_period_end * 1000).toISOString();
      result.cancelAtPeriodEnd = sub.cancel_at_period_end;
      if (sub.items.data.length > 0) {
        const priceId = sub.items.data[0].price.id;
        result.planName = PRICE_TO_TIER[priceId] || user.subscriptionTier;
      }
    }
  }

  return result;
}

export async function cancelSubscription(userId: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user?.stripeCustomerId) throw new AppError(400, 'no_subscription', 'No active subscription');

  const subscriptions = await stripe.subscriptions.list({
    customer: user.stripeCustomerId,
    status: 'active',
    limit: 1,
  });

  if (subscriptions.data.length === 0) {
    throw new AppError(400, 'no_subscription', 'No active subscription');
  }

  await stripe.subscriptions.update(subscriptions.data[0].id, {
    cancel_at_period_end: true,
  });
}

export async function createPortalSession(userId: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user?.stripeCustomerId) throw new AppError(400, 'no_subscription', 'No active subscription');

  const session = await stripe.billingPortal.sessions.create({
    customer: user.stripeCustomerId,
    return_url: `${process.env.APP_URL}/subscription`,
  });

  return { portalUrl: session.url };
}
