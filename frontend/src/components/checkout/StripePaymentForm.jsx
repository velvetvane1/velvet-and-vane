import { useState } from 'react';
import { PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import toast from 'react-hot-toast';

/**
 * Renders Stripe's PaymentElement and confirms the payment client-side.
 * On success, hands the resulting paymentIntentId back to the parent so
 * it can be attached to the order creation call.
 */
export default function StripePaymentForm({ onSuccess, submitLabel = 'Pay Now', returnUrl }) {
  const stripe = useStripe();
  const elements = useElements();
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    setSubmitting(true);
    const { error, paymentIntent } = await stripe.confirmPayment({
      elements,
      confirmParams: { return_url: returnUrl || window.location.href },
      redirect: 'if_required',
    });

    if (error) {
      toast.error(error.message || 'Payment failed — please try again');
      setSubmitting(false);
      return;
    }

    if (paymentIntent?.status === 'succeeded') {
      onSuccess(paymentIntent.id);
    } else {
      toast.error('Payment could not be confirmed');
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <PaymentElement />
      <button
        type="submit"
        disabled={!stripe || submitting}
        data-cursor-hover
        className="w-full py-3.5 bg-gold text-obsidian text-xs tracking-widest2 uppercase font-semibold hover:bg-gold-pale transition-colors disabled:opacity-50"
      >
        {submitting ? 'Processing…' : submitLabel}
      </button>
    </form>
  );
}
