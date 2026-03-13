import Stripe from 'stripe';
import { prisma } from '../utils/prisma';
import { AppError } from '../types';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', { apiVersion: '2024-12-18.acacia' });

export async function createCheckoutSession(userId: string) {
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
    line_items: [{ price: process.env.STRIPE_FAMILY_PRICE_ID, quantity: 1 }],
    success_url: `${process.env.APP_URL}/subscription?success=true`,
    cancel_url: `${process.env.APP_URL}/subscription?cancelled=true`,
    metadata: { userId: user.id },
  });

  return { checkoutUrl: session.url };
}

export async function handleWebhook(event: Stripe.Event) {
  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session;
      const userId = session.metadata?.userId;
      if (userId) {
        await prisma.user.update({
          where: { id: userId },
          data: { subscriptionTier: 'FAMILY' },
        });
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

  const result: any = { tier: user.subscriptionTier };

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
