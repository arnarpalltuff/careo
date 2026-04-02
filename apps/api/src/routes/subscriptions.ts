import { Router, Request, Response, NextFunction } from 'express';
import Stripe from 'stripe';
import { authenticate } from '../middleware/authenticate';
import * as subService from '../services/subscriptions';

const router = Router();

function asyncHandler(fn: (req: Request, res: Response, next: NextFunction) => Promise<void>) {
  return (req: Request, res: Response, next: NextFunction) => fn(req, res, next).catch(next);
}

router.post(
  '/checkout',
  authenticate,
  asyncHandler(async (req, res) => {
    const tier = req.body.tier;
    if (tier !== 'PLUS' && tier !== 'FAMILY') {
      res.status(400).json({ message: 'tier must be PLUS or FAMILY' });
      return;
    }
    const result = await subService.createCheckoutSession(req.user!.userId, tier);
    res.json(result);
  })
);

router.post(
  '/webhook',
  asyncHandler(async (req, res) => {
    const sig = req.headers['stripe-signature'] as string;
    const stripeKey = process.env.STRIPE_SECRET_KEY;
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!stripeKey || !webhookSecret) {
      res.status(500).json({ error: 'Stripe not configured' });
      return;
    }
    const stripe = new Stripe(stripeKey);
    const event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
    await subService.handleWebhook(event);
    res.json({ received: true });
  })
);

router.get(
  '/status',
  authenticate,
  asyncHandler(async (req, res) => {
    const status = await subService.getSubscriptionStatus(req.user!.userId);
    res.json(status);
  })
);

router.post(
  '/cancel',
  authenticate,
  asyncHandler(async (req, res) => {
    await subService.cancelSubscription(req.user!.userId);
    res.json({ message: 'Subscription will be cancelled at end of billing period' });
  })
);

router.post(
  '/portal',
  authenticate,
  asyncHandler(async (req, res) => {
    const result = await subService.createPortalSession(req.user!.userId);
    res.json(result);
  })
);

export default router;
