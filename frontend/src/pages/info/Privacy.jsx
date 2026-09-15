import StaticPage from '@/components/layout/StaticPage';

export default function Privacy() {
  return (
    <StaticPage eyebrow="Legal" title="Privacy Policy" metaDescription="How we collect, use, and protect your data.">
      <p>Last updated: January 2026</p>

      <h2>What we collect</h2>
      <p>
        When you create an account, place an order, or write to us, we
        collect the information you provide directly — name, email, shipping
        and billing addresses, phone number, and order history. We do not
        collect or store full payment card numbers; those are handled
        directly by Stripe, our payment processor.
      </p>

      <h2>How we use it</h2>
      <ul>
        <li>To process and fulfill your orders</li>
        <li>To send order confirmations, shipping updates, and (if you opt in) marketing emails</li>
        <li>To respond to customer service inquiries</li>
        <li>To improve the site based on aggregated, anonymized usage patterns</li>
      </ul>

      <h2>What we don't do</h2>
      <p>
        We don't sell your personal data to third parties. We share data
        only with the services required to run the store — payment
        processing (Stripe), transactional email (our SMTP provider), and
        image hosting (Cloudinary) — each bound by their own data protection
        terms.
      </p>

      <h2>Your rights</h2>
      <p>
        You can access, correct, or delete your account data at any time
        from your account settings, or by writing to{' '}
        <a href="mailto:hello@velvetandvane.com">hello@velvetandvane.com</a>.
      </p>
    </StaticPage>
  );
}
