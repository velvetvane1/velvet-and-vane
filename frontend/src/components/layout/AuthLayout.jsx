import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useSiteSettings } from '@/context/SiteSettingsContext';

export default function AuthLayout({ eyebrow, title, subtitle, children, footer }) {
  const { settings } = useSiteSettings();
  return (
    <div className="min-h-screen bg-noir-radial flex items-center justify-center px-6 py-28">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-md"
      >
        <Link to="/" className="block text-center font-script text-2xl tracking-widest3 uppercase mb-10">
          <span className="text-gold-sheen">VELVET &amp; VANE</span>
        </Link>

        <div className="glass p-8 md:p-10">
          <p className="eyebrow text-center mb-3">{eyebrow}</p>
          <h1 className="heading-display text-3xl text-center mb-2">{title}</h1>
          {subtitle && <p className="text-center text-sm text-ivory/50 mb-8">{subtitle}</p>}
          {children}
        </div>

        {footer && <div className="text-center mt-6 text-sm text-ivory/50">{footer}</div>}
      </motion.div>
    </div>
  );
}
