import crypto from 'crypto';
import Order from '../models/Order.js';
import Cart from '../models/Cart.js';
import Product from '../models/Product.js';
import Coupon from '../models/Coupon.js';
import Address from '../models/Address.js';
import Notification from '../models/Notification.js';
import ApiError from '../utils/ApiError.js';
import asyncHandler from '../utils/asyncHandler.js';
import { sendOrderConfirmationEmail } from '../utils/email.js';
import { getStripe } from '../services/stripeService.js';
import User from '../models/User.js';
import { calculateCartTotals } from '../utils/totals.js';
import { getActiveSalesByProductIds, salePrice } from '../utils/salePricing.js';
import SiteSettings from '../models/SiteSettings.js';

async function reserveItems(items) {
  const reserved = [];
  for (const item of items) {
    const result = await Product.updateOne(
      { _id: item.product, isActive: true, stockStatus: { $ne: 'coming_soon' }, variants: { $elemMatch: { sku: item.sku, isActive: { $ne: false }, stock: { $gte: item.qty } } } },
      { $inc: { 'variants.$.stock': -item.qty } }
    );
    if (result.modifiedCount !== 1) {
      await Promise.all(reserved.map((reservedItem) => Product.updateOne(
        { _id: reservedItem.product, 'variants.sku': reservedItem.sku },
        { $inc: { 'variants.$.stock': reservedItem.qty } }
      )));
      throw ApiError.badRequest(`Sorry, only the currently available quantity can be ordered for ${item.name}. Please review your cart.`);
    }
    reserved.push(item);
  }
}

async function releaseItems(items) {
  // A product can be soft-deleted after an order; keep its historical record
  // and restore stock if its variant still exists. A missing product/variant
  // must not make cancellation fail or delete anything else.
  await Promise.all(items.map((item) => Product.updateOne(
    { _id: item.product, 'variants.sku': item.sku },
    [{
      $set: {
        variants: {
          $map: {
            input: '$variants', as: 'variant', in: {
              $cond: [
                { $eq: ['$$variant.sku', item.sku] },
                {
                  $mergeObjects: [
                    '$$variant',
                    {
                      stock: {
                        $min: [
                          { $add: ['$$variant.stock', item.qty] },
                          { $ifNull: ['$$variant.totalStock', { $add: ['$$variant.stock', item.qty] }] },
                        ],
                      },
                    },
                  ],
                },
                '$$variant',
              ],
            },
          },
        },
      },
    }]
  )));
}

async function cancelAndReleaseOrder(orderId, reason) {
  // The conditional update makes cancellation idempotent even when two admin
  // requests arrive together. Only the request that flips the guard can
  // restore inventory.
  const order = await Order.findOneAndUpdate(
    { _id: orderId, status: { $ne: 'cancelled' }, inventoryReleased: false },
    {
      $set: { status: 'cancelled', cancelReason: reason, inventoryReleased: true },
      $push: { statusHistory: { status: 'cancelled', note: reason, changedAt: new Date() } },
    },
    { new: true, runValidators: true }
  );
  if (!order) return null;
  await releaseItems(order.items);
  return order;
}

function generateOrderNumber() {
  const stamp = Date.now().toString(36).toUpperCase();
  const rand = crypto.randomBytes(2).toString('hex').toUpperCase();
  return `ARW-${stamp}-${rand}`;
}

function snapshotAddress(addr) {
  return {
    fullName: addr.fullName,
    phone: addr.phone,
    line1: addr.line1,
    line2: addr.line2,
    city: addr.city,
    state: addr.state,
    postalCode: addr.postalCode,
    country: addr.country,
  };
}

export const createOrder = asyncHandler(async (req, res) => {
  const { shippingAddressId, billingAddressId, paymentMethod, stripePaymentIntentId, transactionId, checkoutRating, subscribe, checkoutRequestId } = req.body;
  if (paymentMethod === 'cod' && checkoutRequestId) {
    const existingOrder = await Order.findOne({ user: req.user._id, paymentMethod: 'cod', checkoutRequestId });
    if (existingOrder) return res.status(200).json({ success: true, order: existingOrder });
  }
  const codAdvancePercentage = paymentMethod === 'cod' ? (await SiteSettings.getSingleton()).codAdvancePercentage || 20 : null;

  if (paymentMethod === 'stripe' && !stripePaymentIntentId) {
    throw ApiError.badRequest('Missing payment confirmation for card payment');
  }

  let paymentIntentStatus = null;
  if (paymentMethod === 'stripe') {
    const intent = await getStripe().paymentIntents.retrieve(stripePaymentIntentId);
    if (intent.status !== 'succeeded') {
      throw ApiError.badRequest('Payment has not been completed');
    }
    paymentIntentStatus = intent.status;
  }

  const cart = await Cart.findOne({ user: req.user._id });
  if (!cart || cart.items.length === 0) throw ApiError.badRequest('Your cart is empty');

  const shippingAddress = await Address.findOne({ _id: shippingAddressId, user: req.user._id });
  const billingAddress = billingAddressId
    ? await Address.findOne({ _id: billingAddressId, user: req.user._id })
    : shippingAddress;
  if (!shippingAddress || !billingAddress) throw ApiError.badRequest('Invalid address selected');

  // Verify stock and decrement atomically per item
  for (const item of cart.items) {
    const product = await Product.findOne({ _id: item.product, 'variants.sku': item.sku, isActive: true });
    if (!product) throw ApiError.badRequest(`${item.name} is no longer available`);
    if (product.stockStatus === 'coming_soon') throw ApiError.badRequest(`${item.name} is coming soon and cannot be ordered yet`);
    const variant = product.variants.find((v) => v.sku === item.sku);
    if (variant.isActive === false) throw ApiError.badRequest(`${item.name} is no longer available`);
    if (variant.stock < item.qty) throw ApiError.badRequest(`Sorry, only ${variant.stock} units of ${item.name} are currently available.`);
  }

  // Reprice the authoritative server cart at checkout. A campaign may have
  // started or ended after the shopper added an item, so no stale browser or
  // cart price can become an order snapshot.
  const cartProducts = await Product.find({ _id: { $in: cart.items.map((item) => item.product) }, isActive: true });
  const productsById = new Map(cartProducts.map((product) => [product._id.toString(), product]));
  const activeSales = await getActiveSalesByProductIds(cartProducts.map((product) => product._id));
  for (const item of cart.items) {
    const product = productsById.get(item.product.toString());
    const variant = product?.variants.find((value) => value.sku === item.sku);
    if (variant) {
      item.price = salePrice(variant.price, activeSales.get(product._id.toString()));
      item.variantLabel = variant.label;
      item.image = (variant.imagePublicId ? product.images.find((image) => image.publicId === variant.imagePublicId)?.url : null) || product.images[0]?.url || null;
    }
  }

  if (['jazzcash', 'easypaisa'].includes(paymentMethod)) {
    const settings = await SiteSettings.getSingleton();
    const configuredMethod = settings.paymentSettings?.[paymentMethod === 'jazzcash' ? 'jazzCash' : 'easypaisa'];
    if (!configuredMethod?.enabled || !configuredMethod.accountNumber) {
      throw ApiError.badRequest('This online payment method is currently unavailable');
    }
  }

  const orderItems = cart.items.map((item) => {
    const product = productsById.get(item.product.toString());
    return { ...item.toObject(), shippingFee: product?.shippingFee ?? null };
  });

  // Repeat the availability predicates in the write. This prevents a stale
  // checkout from decrementing stock after an admin marks a product
  // unavailable or another customer purchases the final unit.
  await reserveItems(cart.items);

  let order;
  let couponRecorded = false;
  try {
    const { subtotal, discount, shipping: shippingCost, total } = await calculateCartTotals(cart, cartProducts, { requireConfiguredShipping: true });
    if (cart.coupon?.code) {
      await Coupon.updateOne({ code: cart.coupon.code }, { $inc: { usedCount: 1 } });
      couponRecorded = true;
    }
    order = await Order.create({
      orderNumber: generateOrderNumber(),
      checkoutRequestId: paymentMethod === 'cod' ? checkoutRequestId : null,
      user: req.user._id,
      items: orderItems,
      shippingAddress: snapshotAddress(shippingAddress),
      billingAddress: snapshotAddress(billingAddress),
      paymentMethod,
      paymentStatus: paymentIntentStatus === 'succeeded' ? 'paid' : ['jazzcash', 'easypaisa'].includes(paymentMethod) ? 'submitted' : paymentMethod === 'cod' ? 'advance_pending' : 'pending',
      paymentProvider: ['jazzcash', 'easypaisa'].includes(paymentMethod) ? paymentMethod : null,
      transactionId: ['jazzcash', 'easypaisa'].includes(paymentMethod) ? transactionId.trim() : null,
      stripePaymentIntentId: stripePaymentIntentId || null,
      subtotal,
      discount,
      shippingCost,
      total,
      ...(paymentMethod === 'cod' ? (() => {
        const advanceAmount = Math.round(total * codAdvancePercentage) / 100;
        return { advancePercentage: codAdvancePercentage, advanceAmount, remainingAmount: total - advanceAmount, advancePaymentStatus: 'pending' };
      })() : {}),
      couponCode: cart.coupon?.code || null,
      checkoutRating: Number(checkoutRating),
      subscribedAtCheckout: Boolean(subscribe),
      inventoryReleased: false,
    });
  } catch (error) {
    if (couponRecorded) await Coupon.updateOne({ code: cart.coupon.code, usedCount: { $gt: 0 } }, { $inc: { usedCount: -1 } });
    await releaseItems(cart.items);
    throw error;
  }

  if (subscribe && !req.user.marketingSubscribed) {
    await User.updateOne({ _id: req.user._id }, { marketingSubscribed: true });
  }

  cart.items = [];
  cart.coupon = { code: null, type: null, value: null };
  await cart.save();

  await Notification.create({
    user: req.user._id,
    type: 'order',
    title: paymentMethod === 'cod' ? 'Advance payment required' : 'Order placed',
    message: paymentMethod === 'cod' ? `Pay the COD advance for order #${order.orderNumber} to confirm it.` : `Your order #${order.orderNumber} has been received and is being prepared.`,
    link: `/account/orders/${order._id}`,
  });
  const admins = await User.find({ role: { $in: ['admin', 'employee'] }, isActive: true }).select('_id');
  if (admins.length) await Notification.insertMany(admins.map((admin) => ({
    user: admin._id, type: 'order', title: 'New Order Received',
    message: `#${order.orderNumber} from ${req.user.name}: ${order.items.length} item(s), total ${order.total}.`,
    link: `/admin/orders/${order._id}`,
  })));

  if (paymentMethod !== 'cod') {
    try {
      await sendOrderConfirmationEmail(req.user.email, order);
    } catch {
      // Non-fatal: order is already placed, email is best-effort.
    }
  }

  res.status(201).json({ success: true, order });
});

export const getMyOrders = asyncHandler(async (req, res) => {
  const orders = await Order.find({ user: req.user._id }).sort('-createdAt');
  res.status(200).json({ success: true, orders });
});

export const getOrder = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id);
  if (!order) throw ApiError.notFound('Order not found');

  const isOwner = order.user.toString() === req.user._id.toString();
  const isStaff = ['admin', 'employee'].includes(req.user.role);
  if (!isOwner && !isStaff) throw ApiError.forbidden('You cannot view this order');

  res.status(200).json({ success: true, order });
});

export const cancelOrder = asyncHandler(async (req, res) => {
  const order = await Order.findOne({ _id: req.params.id, user: req.user._id });
  if (!order) throw ApiError.notFound('Order not found');
  if (!['pending', 'processing'].includes(order.status)) {
    throw ApiError.badRequest('This order can no longer be cancelled');
  }

  const cancelled = await cancelAndReleaseOrder(order._id, req.body.reason || 'Cancelled by customer');
  if (!cancelled) throw ApiError.badRequest('This order was already cancelled');

  res.status(200).json({ success: true, order: cancelled });
});

// ---------- Admin ----------

export const listAllOrders = asyncHandler(async (req, res) => {
  const { status, page = 1, limit = 20 } = req.query;
  const filter = status ? { status } : {};

  const [orders, total] = await Promise.all([
    Order.find(filter)
      .populate('user', 'name email')
      .sort('-createdAt')
      .skip((page - 1) * limit)
      .limit(Number(limit)),
    Order.countDocuments(filter),
  ]);

  res.status(200).json({
    success: true,
    orders,
    pagination: { page: Number(page), limit: Number(limit), total, totalPages: Math.ceil(total / limit) || 1 },
  });
});

export const updateOrderStatus = asyncHandler(async (req, res) => {
  const { status, trackingNumber, note } = req.body;
  const order = await Order.findById(req.params.id);
  if (!order) throw ApiError.notFound('Order not found');

  const statusChanged = status && status !== order.status;
  if (statusChanged && order.paymentMethod === 'cod' && status !== 'cancelled' && status !== 'pending' && order.advancePaymentStatus && order.advancePaymentStatus !== 'paid') {
    throw ApiError.badRequest('The COD advance must be paid before this order can be fulfilled');
  }
  if (statusChanged && status === 'cancelled') {
    const cancelled = await cancelAndReleaseOrder(order._id, note || 'Cancelled by admin');
    if (!cancelled) throw ApiError.badRequest('This order was already cancelled');
    if (trackingNumber) {
      cancelled.trackingNumber = trackingNumber;
      await cancelled.save();
    }
    await Notification.create({
      user: cancelled.user, type: 'order', title: 'Order status updated',
      message: `Your Arwa Store order #${cancelled.orderNumber} is now cancelled.`, link: `/account/orders/${cancelled._id}`,
    });
    return res.status(200).json({ success: true, order: cancelled });
  }

  if (statusChanged && order.status === 'cancelled' && status !== 'cancelled') {
    // If the existing workflow reopens a cancelled order, reserve stock once
    // again before making it active. A failed reservation leaves it cancelled.
    await reserveItems(order.items);
    const reactivated = await Order.findOneAndUpdate(
      { _id: order._id, status: 'cancelled', inventoryReleased: true },
      {
        $set: { status, inventoryReleased: false },
        $push: { statusHistory: { status, note: note || 'Order reactivated by admin', changedAt: new Date() } },
      }, { new: true }
    );
    if (!reactivated) {
      await releaseItems(order.items);
      throw ApiError.badRequest('Order status changed before it could be reactivated');
    }
    if (trackingNumber) {
      reactivated.trackingNumber = trackingNumber;
      await reactivated.save();
    }
    await Notification.create({ user: reactivated.user, type: 'order', title: 'Order status updated', message: `Your Arwa Store order #${reactivated.orderNumber} is now ${status}.`, link: `/account/orders/${reactivated._id}` });
    return res.status(200).json({ success: true, order: reactivated });
  }

  if (statusChanged) order.status = status;
  if (statusChanged && status === 'delivered' && order.paymentMethod === 'cod') {
    order.codCollectedAt = new Date();
    if (order.advancePaymentStatus === 'paid' || !order.advancePaymentStatus) order.paymentStatus = 'paid';
  }
  if (trackingNumber) order.trackingNumber = trackingNumber;
  if (note) order.statusHistory.push({ status, note, changedAt: new Date() });
  await order.save();

  if (statusChanged) await Notification.create({
    user: order.user, type: 'order', title: 'Order status updated',
    message: `Your Arwa Store order #${order.orderNumber} is now ${status}.`, link: `/account/orders/${order._id}`,
  });

  res.status(200).json({ success: true, order });
});

export const refundOrder = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id);
  if (!order) throw ApiError.notFound('Order not found');

  order.status = 'refunded';
  order.paymentStatus = 'refunded';
  order.statusHistory.push({ status: 'refunded', note: req.body.note || '', changedAt: new Date() });
  await order.save();

  res.status(200).json({ success: true, order });
});

export const updatePaymentStatus = asyncHandler(async (req, res) => {
  const { paymentStatus } = req.body;
  const order = await Order.findById(req.params.id);
  if (!order) throw ApiError.notFound('Order not found');
  if (!['jazzcash', 'easypaisa'].includes(order.paymentMethod)) {
    throw ApiError.badRequest('Payment status can only be manually updated for online wallet orders');
  }
  order.paymentStatus = paymentStatus;
  await order.save();
  res.status(200).json({ success: true, order });
});

export const deleteCancelledOrder = asyncHandler(async (req, res) => {
  const order = await Order.findOneAndDelete({ _id: req.params.id, status: 'cancelled' });
  if (!order) {
    const exists = await Order.exists({ _id: req.params.id });
    if (exists) throw ApiError.badRequest('Only cancelled orders can be permanently deleted');
    throw ApiError.notFound('Order not found');
  }
  // Stock was restored at cancellation and is guarded by inventoryReleased;
  // deletion intentionally has no inventory mutation.
  res.status(200).json({ success: true, message: 'Cancelled order permanently deleted' });
});
