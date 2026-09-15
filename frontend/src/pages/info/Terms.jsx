import StaticPage from '@/components/layout/StaticPage';

export default function Terms() {
  return (
    <StaticPage eyebrow="Legal" title="Terms of Service" metaDescription="Terms of service for our store.">
      <p>Last updated: January 2026</p>

      <h2>Orders and payment</h2>
      <p>
        By placing an order, you confirm the shipping and billing details
        provided are accurate. We reserve the right to cancel or refuse an
        order if we suspect fraud, or if a listed price was displayed in
        error.
      </p>

      <h2>Product descriptions</h2>
      <p>
        We describe each fragrance's notes and character as accurately as we
        can, but scent is subjective and can vary based on individual skin
        chemistry. We can't guarantee a fragrance will smell identical to
        its description on every wearer.
      </p>

      <h2>Account responsibility</h2>
      <p>
        You're responsible for keeping your account password confidential
        and for all activity under your account. Let us know immediately at{' '}
        <a href="mailto:hello@velvetandvane.com">hello@velvetandvane.com</a> if you
        suspect unauthorized access.
      </p>

      <h2>Intellectual property</h2>
      <p>
        All content on this site — photography, copy, the store name and
        mark — belongs to the store and may not be
        reproduced without permission.
      </p>

      <h2>Governing law</h2>
      <p>
        These terms are governed by the laws of the jurisdiction in which
        the store is registered, without regard to
        conflict-of-law principles.
      </p>
    </StaticPage>
  );
}
