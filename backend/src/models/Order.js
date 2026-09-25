import mongoose from 'mongoose';

const orderItemSchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    sku: { type: String, required: true },
    name: { type: String, required: true },
    image: { type: String, default: null },
    variantLabel: { type: String, default: null },
    price: { type: Number, required: true },
    qty: { type: Number, required: true },
    // Per-unit shipping at the instant this order was placed. It complements
    // shippingCost (the order total) for historical audit/detail views.
    shippingFee: { type: Number, min: 0, default: null },
  },
  { _id: false }
);

const addressSnapshotSchema = new mongoose.Schema(
  {
    fullName: String,
    phone: String,
    line1: String,
    line2: String,
    city: String,
    state: String,
    postalCode: String,
    country: String,
  },
  { _id: false }
);

const statusHistorySchema = new mongoose.Schema(
  {
    status: { type: String, required: true },
    note: { type: String, default: '' },
    changedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    orderNumber: { type: String, required: true, unique: true },
    checkoutRequestId: { type: String, default: null, trim: true, maxlength: 100 },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    items: { type: [orderItemSchema], validate: (v) => v.length > 0 },
    shippingAddress: { type: addressSnapshotSchema, required: true },
    billingAddress: { type: addressSnapshotSchema, required: true },
    // `stripe` and its historic statuses are retained for existing orders;
    // new checkout orders use COD, JazzCash, or Easypaisa only.
    paymentMethod: { type: String, enum: ['cod', 'stripe', 'jazzcash', 'easypaisa'], required: true },
    paymentStatus: { type: String, enum: ['pending', 'unpaid', 'advance_pending', 'advance_paid', 'submitted', 'verified', 'rejected', 'paid', 'failed', 'refunded'], default: 'pending' },
    paymentProvider: { type: String, enum: ['jazzcash', 'easypaisa', null], default: null },
    transactionId: { type: String, default: null, trim: true, maxlength: 150 },
    stripePaymentIntentId: { type: String, default: null },
    advancePercentage: { type: Number, enum: [10, 20], default: null },
    advanceAmount: { type: Number, min: 0, default: null },
    remainingAmount: { type: Number, min: 0, default: null },
    advancePaymentStatus: { type: String, enum: ['pending', 'paid', 'failed'], default: null },
    advancePaymentTransactionId: { type: String, default: null, trim: true, maxlength: 150 },
    advancePaymentAttempt: { type: Number, min: 0, default: 0 },
    advancePaidAt: { type: Date, default: null },
    codCollectedAt: { type: Date, default: null },
    subtotal: { type: Number, required: true },
    discount: { type: Number, default: 0 },
    shippingCost: { type: Number, default: 0 },
    tax: { type: Number, default: 0 },
    total: { type: Number, required: true },
    couponCode: { type: String, default: null },
    status: {
      type: String,
      enum: ['pending', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded'],
      default: 'pending',
    },
    statusHistory: { type: [statusHistorySchema], default: [] },
    trackingNumber: { type: String, default: null },
    cancelReason: { type: String, default: null },
    // Guards the one-time stock restoration. It also means deleting an
    // already-cancelled order can never restore stock a second time.
    inventoryReleased: { type: Boolean, default: false },
    checkoutRating: { type: Number, min: 1, max: 5, default: null },
    subscribedAtCheckout: { type: Boolean, default: false },
  },
  { timestamps: true }
);

orderSchema.index({ user: 1, checkoutRequestId: 1 }, { unique: true, partialFilterExpression: { checkoutRequestId: { $type: 'string' } } });

orderSchema.pre('save', function pushStatusHistory(next) {
  if (this.isModified('status') || this.isNew) {
    this.statusHistory.push({ status: this.status, changedAt: new Date() });
  }
  next();
});

export default mongoose.model('Order', orderSchema);
