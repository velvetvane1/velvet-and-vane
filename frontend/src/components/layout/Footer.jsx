import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { FaInstagram, FaTiktok, FaPinterestP, FaFacebookF } from 'react-icons/fa';
import { useSiteSettings } from '@/context/SiteSettingsContext';
import { categoriesApi } from '@/services/products';

const SHOP_LINKS = [
  { label: 'All Products', to: '/shop' },
  { label: 'New Arrivals', to: '/new-arrivals' },
  { label: 'Best Sellers', to: '/best-sellers' },
];

const CUSTOMER_CARE_LINKS = [
  { label: 'Contact Us', to: '/contact' },
  { label: 'Shipping & Delivery', to: '/shipping' },
  { label: 'Track Order', to: '/track-order' },
  { label: 'FAQ', to: '/faq' },
];

const ABOUT_LINKS = [
  { label: 'Our Story', to: '/about' },
  { label: 'Our Collections', to: '/shop' },
  { label: 'Journal', to: '/journal' },
];

const STATIC_COLUMNS = [
  {
    title: 'Shop',
    links: SHOP_LINKS,
  },
  {
    title: 'Customer Care',
    links: CUSTOMER_CARE_LINKS,
  },
  {
    title: 'About Store',
    links: ABOUT_LINKS,
  },
];

export default function Footer() {
  const [email, setEmail] = useState('');
  const [categories, setCategories] = useState([]);
  const { settings } = useSiteSettings();

  useEffect(() => {
    categoriesApi.list().then(setCategories).catch(() => setCategories([]));
  }, []);

  const columns = [
    STATIC_COLUMNS[0],
    { title: 'Collections', links: categories.map((category) => ({ label: category.name, to: `/shop?category=${category.slug}` })) },
    ...STATIC_COLUMNS.slice(1),
  ];

  const handleSubscribe = (e) => {
    e.preventDefault();
    if (!/^\S+@\S+\.\S+$/.test(email)) {
      toast.error('Enter a valid email address');
      return;
    }
    toast.success(`Welcome to ${settings.siteName} — check your inbox.`);
    setEmail('');
  };

  return (
    <footer className="site-footer relative bg-primary border-t border-gold/30 mt-32 text-ivory">
      <div className="hairline absolute -top-px left-0 right-0" />

      {/* Newsletter */}
      <div className="max-w-3xl mx-auto text-center px-6 pt-20 pb-16">
        <p className="eyebrow mb-4">The Journal, Delivered</p>
        <h3 className="heading-display text-3xl md:text-4xl mb-6">Discover what’s new at {settings.siteName}.</h3>
        <form onSubmit={handleSubscribe} className="flex flex-col sm:flex-row gap-3 justify-center max-w-md mx-auto">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Your email address"
            aria-label="Email address"
            className="flex-1 bg-transparent border border-gold/30 px-5 py-3 text-sm focus:outline-none focus:border-gold placeholder:text-ivory/40"
          />
          <button
            type="submit"
            data-cursor-hover
            className="px-7 py-3 text-xs tracking-widest2 uppercase bg-gold text-obsidian font-semibold hover:bg-gold-pale transition-colors duration-300"
          >
            Subscribe
          </button>
        </form>
      </div>

      <div className="hairline max-w-7xl mx-auto" />

      {/* Link columns */}
      <div className="max-w-7xl mx-auto px-6 md:px-10 py-16 grid grid-cols-2 md:grid-cols-5 gap-10">
        <div className="col-span-2 md:col-span-1">
          <p className="font-display text-xl tracking-[0.14em] uppercase mb-4">VELVET <i className="text-gold">&amp;</i> VANE</p>
          <p className="text-sm text-ivory/60 leading-relaxed max-w-xs">
            {settings.footerTagline}
          </p>
          <p className="eyebrow mt-6 mb-4">Follow Us</p>
          <div className="flex gap-4 text-lg text-ivory/60" aria-label="Social media">
            <span aria-label="Instagram" className="hover:text-gold transition-colors"><FaInstagram /></span>
            <span aria-label="TikTok" className="hover:text-gold transition-colors"><FaTiktok /></span>
            <span aria-label="Pinterest" className="hover:text-gold transition-colors"><FaPinterestP /></span>
            <span aria-label="Facebook" className="hover:text-gold transition-colors"><FaFacebookF /></span>
          </div>
        </div>

        {columns.map((col) => (
          <div key={col.title}>
            <p className="eyebrow mb-5">{col.title === 'About Store' ? `About ${settings.siteName}` : col.title}</p>
            <ul className="space-y-3">
              {col.links.map((link) => (
                <li key={link.to}>
                  <Link to={link.to} className="text-sm text-ivory/70 hover:text-gold transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="hairline max-w-7xl mx-auto" />

      <div className="max-w-7xl mx-auto px-6 md:px-10 py-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-ivory/40">
        <p>© {new Date().getFullYear()} {settings.siteName}. All rights reserved.</p>
        <div className="flex gap-6">
          <Link to="/privacy" className="hover:text-gold">Privacy Policy</Link>
          <Link to="/terms" className="hover:text-gold">Terms of Service</Link>
        </div>
      </div>
    </footer>
  );
}
