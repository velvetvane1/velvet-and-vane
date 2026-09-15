import StaticPage from '@/components/layout/StaticPage';

export default function Shipping() {
  return (
    <StaticPage
      eyebrow="Client Care"
      title="Shipping & Returns"
      metaDescription="Shipping times, costs, and return policy."
    >
      <h2>Shipping</h2>
      <p>
        Orders are processed within 1-2 business days. Domestic orders arrive
        in 3-5 business days; international orders typically take 7-14
        business days depending on destination and customs processing.
      </p>
      <ul>
        <li>Free delivery on qualifying orders, as shown at checkout</li>
        <li>Delivery charges, where applicable, are shown in PKR at checkout</li>
        <li>Delivery is available across Pakistan</li>
      </ul>

      <h2>Returns</h2>
      <p>
        We want you to love what you ordered. If you don't, here's how
        returns work:
      </p>
      <ul>
        <li><strong>Unopened bottles</strong> can be returned within 30 days of delivery for a full refund.</li>
        <li><strong>Opened bottles</strong> are eligible for store credit within 14 days of delivery.</li>
        <li>Discovery vials and samples are final sale.</li>
        <li>Return shipping is covered by us for damaged or incorrect items; otherwise the cost is the customer's responsibility.</li>
      </ul>

      <h2>How to start a return</h2>
      <p>
        Sign in to your account, go to Orders, open the relevant order, and
        use the cancel/return option — or write to us at{' '}
        <a href="mailto:hello@velvetandvane.com">hello@velvetandvane.com</a> with your
        order number and we'll take it from there.
      </p>
    </StaticPage>
  );
}
