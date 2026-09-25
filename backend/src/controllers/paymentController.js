import Cart from '../models/Cart.js';
import Order from '../models/Order.js';
import ApiError from '../utils/ApiError.js';
import asyncHandler from '../utils/asyncHandler.js';
import { getStripe } from '../services/stripeService.js';
import { calculateCartTotals } from '../utils/totals.js';
import SiteSettings from '../models/SiteSettings.js';

export const getCodAdvanceConfig = asyncHandler(async (req, res) => {
  const settings = await SiteSettings.getSingleton();
  res.status(200).json({ success: true, advancePercentage: settings.codAdvancePercentage || 20 });
});

export const initializeCodAdvance = asyncHandler(async (req, res) => {
  const order = await Order.findOne({ _id: req.params.orderId, user: req.user._id, paymentMethod: 'cod' });
  if (!order) throw ApiError.notFound('COD order not found');
  if (order.status === 'cancelled') throw ApiError.badRequest('This order has been cancelled');
  if (order.paymentStatus === 'advance_paid') throw ApiError.badRequest('The COD advance has already been paid');
  const expectedAmount = Math.round(order.total * order.advancePercentage) / 100;
  if (expectedAmount !== order.advanceAmount || order.remainingAmount !== order.total - expectedAmount) throw ApiError.badRequest('Order advance amount is invalid');
  let attempt = Number(order.advancePaymentAttempt || 0);
  if (order.stripePaymentIntentId) {
    const existing = await getStripe().paymentIntents.retrieve(order.stripePaymentIntentId);
    if (existing.status === 'succeeded') return res.status(200).json({ success: true, alreadyPaid: true, order });
    if (['requires_payment_method', 'requires_confirmation', 'requires_action', 'processing'].includes(existing.status)) {
      return res.status(200).json({ success: true, clientSecret: existing.client_secret, amount: order.advanceAmount, order });
    }
    attempt += 1;
  }
  const intent = await getStripe().paymentIntents.create({
    amount: Math.round(expectedAmount * 100), currency: 'pkr',
    automatic_payment_methods: { enabled: true },
    metadata: { userId: req.user._id.toString(), orderId: order._id.toString(), purpose: 'cod_advance', expectedAmount: String(expectedAmount) },
  }, { idempotencyKey: `cod-advance-${order._id}-${attempt}` });
  order.stripePaymentIntentId = intent.id;
  order.advancePaymentTransactionId = intent.id;
  order.advancePaymentAttempt = attempt;
  order.paymentStatus = 'advance_pending';
  order.advancePaymentStatus = 'pending';
  await order.save();
  res.status(200).json({ success: true, clientSecret: intent.client_secret, amount: expectedAmount, order });
});

export const verifyCodAdvance = asyncHandler(async (req, res) => {
  const order = await Order.findOne({ _id: req.params.orderId, user: req.user._id, paymentMethod: 'cod' });
  if (!order) throw ApiError.notFound('COD order not found');
  if (order.paymentStatus === 'advance_paid') return res.status(200).json({ success: true, order });
  const intentId = req.body.paymentIntentId || order.stripePaymentIntentId;
  if (!intentId || intentId !== order.stripePaymentIntentId) throw ApiError.badRequest('Invalid payment reference');
  const intent = await getStripe().paymentIntents.retrieve(intentId);
  const expectedMinor = Math.round(order.advanceAmount * 100);
  if (intent.metadata?.orderId !== order._id.toString() || intent.metadata?.purpose !== 'cod_advance' || intent.currency !== 'pkr' || intent.amount !== expectedMinor) {
    throw ApiError.badRequest('Payment amount or order reference does not match');
  }
  if (intent.status !== 'succeeded') {
    if (intent.status === 'canceled') {
      order.advancePaymentStatus = 'failed';
      await order.save();
    }
    throw ApiError.badRequest('Advance payment has not been completed');
  }
  order.paymentStatus = 'advance_paid';
  order.advancePaymentStatus = 'paid';
  order.advancePaidAt = new Date();
  order.advancePaymentTransactionId = intent.id;
  await order.save();
  res.status(200).json({ success: true, order });
});

/** Creates a PaymentIntent sized to the caller's current cart total. */
export const createPaymentIntent = asyncHandler(async (req, res) => {
  const cart = await Cart.findOne({ user: req.user._id });
  if (!cart || cart.items.length === 0) throw ApiError.badRequest('Your cart is empty');

  const { total } = await calculateCartTotals(cart, null, { requireConfiguredShipping: true });

  const paymentIntent = await getStripe().paymentIntents.create({
    amount: Math.round(total * 100), // Stripe expects the smallest currency unit
    currency: 'pkr',
    automatic_payment_methods: { enabled: true },
    metadata: { userId: req.user._id.toString() },
  });

  res.status(200).json({ success: true, clientSecret: paymentIntent.client_secret, amount: total });
});

/**
 * Stripe webhook — must be mounted with express.raw() BEFORE the global
 * express.json() parser so the signature can be verified against the
 * untouched request body. See app.js for the mounting order.
 */
export const stripeWebhook = asyncHandler(async (req, res) => {
  const signature = req.headers['stripe-signature'];
  let event;

  try {
    event = getStripe().webhooks.constructEvent(req.body, signature, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error('Stripe webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  switch (event.type) {
    case 'payment_intent.succeeded': {
      const intent = event.data.object;
      if (intent.metadata?.purpose === 'cod_advance' && intent.metadata?.orderId) {
        const order = await Order.findOne({ _id: intent.metadata.orderId, paymentMethod: 'cod', stripePaymentIntentId: intent.id });
        if (order && intent.amount === Math.round(order.advanceAmount * 100) && intent.currency === 'pkr' && order.paymentStatus !== 'advance_paid') {
          order.paymentStatus = 'advance_paid'; order.advancePaymentStatus = 'paid'; order.advancePaidAt = new Date(); order.advancePaymentTransactionId = intent.id; await order.save();
        }
        break;
      }
      await Order.updateMany(
        { stripePaymentIntentId: intent.id, paymentStatus: { $ne: 'paid' } },
        { paymentStatus: 'paid' }
      );
      break;
    }
    case 'payment_intent.payment_failed': {
      const intent = event.data.object;
      if (intent.metadata?.purpose === 'cod_advance' && intent.metadata?.orderId) {
        await Order.updateOne({ _id: intent.metadata.orderId, stripePaymentIntentId: intent.id, paymentStatus: { $ne: 'advance_paid' } }, { $set: { paymentStatus: 'advance_pending', advancePaymentStatus: 'failed' } });
        break;
      }
      await Order.updateMany({ stripePaymentIntentId: intent.id }, { paymentStatus: 'failed' });
      break;
    }
    default:
      break; // Unhandled event types are safely ignored.
  }

  res.status(200).json({ received: true });
});
