import { useEffect, useState } from 'react';
import { useParams, Link, useSearchParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { useSiteSettings } from '@/context/SiteSettingsContext';
import toast from 'react-hot-toast';
import { HiArrowLeft } from 'react-icons/hi';
import StatusBadge from '@/components/ui/StatusBadge';
import api from '@/services/api';
import { Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import StripePaymentForm from '@/components/checkout/StripePaymentForm';
import { formatCurrency } from '@/utils/currency';

const stripePromise = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY ? loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY) : null;

export default function OrderDetail() {
  const { settings } = useSiteSettings();
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const [order, setOrder] = useState(null);
  const [cancelling, setCancelling] = useState(false);
  const [advanceSecret, setAdvanceSecret] = useState(''); const [advanceBusy, setAdvanceBusy] = useState(false);

  const load = () => {
    api.get(`/orders/${id}`).then(({ data }) => setOrder(data.order)).catch(() => toast.error('Could not load order'));
  };
  useEffect(load, [id]);
  useEffect(() => { const paymentIntentId = searchParams.get('payment_intent'); if (!paymentIntentId) return; api.post(`/payments/cod-advance/${id}/verify`, { paymentIntentId }).then(({ data }) => { setOrder(data.order); toast.success('COD advance paid'); }).catch((err) => toast.error(err.response?.data?.message || 'Payment verification is pending')); }, [id, searchParams]);

  const handleCancel = async () => {
    if (!window.confirm('Cancel this order?')) return;
    setCancelling(true);
    try {
      const { data } = await api.post(`/orders/${id}/cancel`, {});
      setOrder(data.order);
      toast.success('Order cancelled');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not cancel order');
    } finally {
      setCancelling(false);
    }
  };

  const retryAdvance = async () => { setAdvanceBusy(true); try { const { data } = await api.post(`/payments/cod-advance/${id}/initialize`); setAdvanceSecret(data.clientSecret || ''); if (data.alreadyPaid) setOrder(data.order); } catch (err) { toast.error(err.response?.data?.message || 'Could not initialize advance payment'); } finally { setAdvanceBusy(false); } };
  const verifyAdvance = async (paymentIntentId) => { try { const { data } = await api.post(`/payments/cod-advance/${id}/verify`, { paymentIntentId }); setOrder(data.order); setAdvanceSecret(''); toast.success('COD advance paid'); } catch (err) { toast.error(err.response?.data?.message || 'Payment verification is pending'); } };

  if (!order) return <p className="text-ivory/50">Loading order…</p>;

  const canCancel = ['pending', 'processing'].includes(order.status);

  return (
    <div className="space-y-6">
      <Helmet><title>Order {order.orderNumber} — {settings.siteName}</title></Helmet>

      <Link to="/account/orders" className="flex items-center gap-2 text-sm text-ivory/50 hover:text-gold">
        <HiArrowLeft /> Back to orders
      </Link>

      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-gold text-sm">{order.orderNumber}</p>
          <p className="text-xs text-ivory/40 mt-1">{new Date(order.createdAt).toLocaleString()}</p>
        </div>
        <div className="flex gap-2">
          <StatusBadge status={order.status} />
          <StatusBadge status={order.paymentStatus} />
        </div>
      </div>

      {order.trackingNumber && (
        <div className="glass p-4 text-sm">
          <span className="text-ivory/50">Tracking Number: </span>
          <span className="text-gold">{order.trackingNumber}</span>
        </div>
      )}

      <div className="glass rounded-sm overflow-hidden">
        <table className="w-full text-sm">
          <tbody>
            {order.items.map((item) => (
              <tr key={item.sku} className="border-b border-gold/5 last:border-0">
                <td className="px-5 py-3">{item.name} <span className="text-ivory/40">({item.variantLabel})</span></td>
                <td className="px-5 py-3 text-ivory/50">× {item.qty}</td>
                <td className="px-5 py-3 text-right">${(item.price * item.qty).toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="glass p-5">
        <p className="text-xs text-ivory/40 uppercase tracking-widest2 mb-3">Delivery Address</p>
        <p className="text-sm text-ivory/70 leading-relaxed">
          {order.shippingAddress.fullName}<br />
          {order.shippingAddress.line1}{order.shippingAddress.line2 ? `, ${order.shippingAddress.line2}` : ''}<br />
          {order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.postalCode}<br />
          {order.shippingAddress.country}
        </p>
      </div>

      {order.paymentMethod === 'cod' && (order.advanceAmount != null ? <div className="glass p-5 space-y-2 text-sm"><p className="text-xs text-ivory/40 uppercase tracking-widest2 mb-3">Cash on Delivery Payment</p><Line label="Order Total" value={order.total} currency={settings.currency} /><Line label={`Advance Required (${order.advancePercentage}%)`} value={order.advanceAmount} currency={settings.currency} /><Line label="Remaining COD" value={order.codCollectedAt ? 0 : order.remainingAmount} currency={settings.currency} /><p className="text-ivory/60">Payment Status: <StatusBadge status={order.paymentStatus} /></p>{order.codCollectedAt && <p className="text-emerald-300">Remaining cash collected on {new Date(order.codCollectedAt).toLocaleString()}</p>}{order.advancePaymentStatus !== 'paid' && order.status !== 'cancelled' && <>{advanceSecret && stripePromise ? <Elements stripe={stripePromise} options={{ clientSecret: advanceSecret }}><StripePaymentForm returnUrl={`${window.location.origin}/account/orders/${id}`} onSuccess={verifyAdvance} submitLabel={`Pay ${formatCurrency(order.advanceAmount, settings.currency)} advance`} /></Elements> : <button onClick={retryAdvance} disabled={advanceBusy} className="mt-3 px-5 py-2.5 bg-gold text-obsidian text-xs uppercase tracking-wide disabled:opacity-50">{advanceBusy ? 'Starting…' : 'Pay / Retry Advance'}</button>}</>}</div> : <div className="glass p-5 text-sm"><p className="text-xs text-ivory/40 uppercase tracking-widest2 mb-3">Cash on Delivery Payment</p><Line label="Order Total" value={order.total} currency={settings.currency} /><Line label="Remaining COD" value={order.codCollectedAt ? 0 : order.total} currency={settings.currency} /><p className="text-ivory/60">{order.codCollectedAt ? 'Cash collected on delivery' : 'Full amount payable in cash on delivery'}</p></div>)}

      <div className="flex justify-between items-center pt-2">
        <p className="font-semibold">Total: <span className="text-gold">${order.total.toFixed(2)}</span></p>
        {canCancel && (
          <button onClick={handleCancel} disabled={cancelling} className="text-xs text-ember-light hover:underline disabled:opacity-50">
            {cancelling ? 'Cancelling…' : 'Cancel Order'}
          </button>
        )}
      </div>
    </div>
  );
}

function Line({ label, value, currency }) { return <p className="flex justify-between text-ivory/70"><span>{label}</span><span>{formatCurrency(value, currency)}</span></p>; }
