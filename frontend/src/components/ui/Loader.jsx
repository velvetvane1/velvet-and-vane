import { motion } from 'framer-motion';
import { useSiteSettings } from '@/context/SiteSettingsContext';

export function PageLoader() {
  const { settings } = useSiteSettings();
  return (
    <div className="fixed inset-0 z-[200] bg-obsidian flex flex-col items-center justify-center gap-6">
      <motion.div
        initial={{ opacity: 0, scale: 0.85 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="relative w-16 h-16"
      >
        <svg viewBox="0 0 64 64" className="w-full h-full">
          <circle
            cx="32"
            cy="32"
            r="28"
            fill="none"
            stroke="rgba(201, 164, 108, 0.28)"
            strokeWidth="1"
          />
          <motion.circle
            cx="32"
            cy="32"
            r="28"
            fill="none"
            stroke="#C9A46C"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeDasharray="60 120"
            animate={{ rotate: 360 }}
            transition={{ duration: 1.8, repeat: Infinity, ease: 'linear' }}
            style={{ transformOrigin: '32px 32px' }}
          />
        </svg>
        <span className="absolute inset-0 flex items-center justify-center font-script text-gold text-lg">
          {settings.siteName?.[0] || 'A'}
        </span>
      </motion.div>
      <p className="eyebrow tracking-widest3">{settings.siteName}</p>
    </div>
  );
}

export function ProductCardSkeleton() {
  return (
    <div className="flex flex-col gap-4">
      <div className="skeleton aspect-[3/4] w-full rounded-sm" />
      <div className="skeleton h-3 w-2/3 rounded-sm" />
      <div className="skeleton h-3 w-1/3 rounded-sm" />
    </div>
  );
}

export function TextSkeleton({ className = 'h-4 w-full' }) {
  return <div className={`skeleton rounded-sm ${className}`} />;
}
