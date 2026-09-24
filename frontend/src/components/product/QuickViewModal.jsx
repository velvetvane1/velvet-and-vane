import { AnimatePresence, motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { HiX, HiStar } from 'react-icons/hi';
import { useCart } from '@/context/CartContext';
import { placeholderSwatch, productImage } from '@/utils/placeholderSwatch';
import { useSiteSettings } from '@/context/SiteSettingsContext';
import { formatCurrency } from '@/utils/currency';
import { getSalePrice, isOnActiveSale } from '@/utils/salePricing';

export default function QuickViewModal({ product, open, onClose }) {
  const { settings } = useSiteSettings();
  const { addToCart } = useCart();
  if (!product) return null;

  const image = productImage(product);
  const defaultVariant = product.variants?.[0];
  const regularPrice = defaultVariant?.price ?? product.basePrice;
  const price = getSalePrice(product, regularPrice);
  const onSale = isOnActiveSale(product);
  const unavailable = (product.stockStatus || 'in_stock') !== 'in_stock';

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[90] bg-obsidian/85 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={onClose}
          role="dialog"
          aria-modal="true"
          aria-label={`Quick view — ${product.name}`}
        >
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.98 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            onClick={(e) => e.stopPropagation()}
            className="glass w-full max-w-3xl grid md:grid-cols-2 rounded-sm overflow-hidden"
          >
            <div
              className="aspect-square md:aspect-auto flex items-center justify-center"
              style={{ background: image ? `url(${image}) center/cover no-repeat` : placeholderSwatch(product.name) }}
            >
              {!image && (
                <svg viewBox="0 0 100 170" className="w-24 opacity-90" aria-hidden="true">
                  <rect x="35" y="10" width="30" height="18" rx="2" fill="#191517" opacity="0.55" />
                  <path
                    d="M28 28 Q28 46 24 60 L24 150 Q24 160 34 160 L66 160 Q76 160 76 150 L76 60 Q72 46 72 28 Z"
                    fill="#191517"
                    opacity="0.45"
                  />
                </svg>
              )}
            </div>

            <div className="p-8 relative">
              <button
                aria-label="Close quick view"
                onClick={onClose}
                data-cursor-hover
                className="absolute top-5 right-5 text-xl text-ivory/60 hover:text-gold"
              >
                <HiX />
              </button>

              <p className="text-[11px] tracking-widest2 uppercase text-gold/70">{product.brand?.name}</p>
              <h2 className="font-display text-3xl mt-2">{product.name}</h2>
              <div className="flex items-center gap-2 mt-2">
                <span className="flex items-center gap-0.5 text-gold text-sm">
                  <HiStar /> {product.rating?.toFixed?.(1) ?? product.rating ?? '—'}
                </span>
                <span className="text-xs text-ivory/40">({product.reviewCount ?? 0} reviews)</span>
              </div>

              <div className="mt-4 flex items-baseline gap-2">
                <span className="text-2xl font-body">{formatCurrency(price, settings.currency)}</span>
                {onSale && (
                  <span className="text-sm text-ivory/40 line-through">{formatCurrency(regularPrice, settings.currency)}</span>
                )}
                {onSale && <span className="text-xs text-ember-light">{product.activeSale.discount}% OFF</span>}
              </div>

              <dl className="mt-6 space-y-2 text-sm text-ivory/70">
                <div className="flex gap-2">
                  <dt className="text-gold/80 w-14 shrink-0">Top</dt>
                  <dd>{product.notes?.top || '—'}</dd>
                </div>
                <div className="flex gap-2">
                  <dt className="text-gold/80 w-14 shrink-0">Heart</dt>
                  <dd>{product.notes?.heart || '—'}</dd>
                </div>
                <div className="flex gap-2">
                  <dt className="text-gold/80 w-14 shrink-0">Base</dt>
                  <dd>{product.notes?.base || '—'}</dd>
                </div>
              </dl>

              <div className="mt-8 flex flex-col gap-3">
                <button
                  data-cursor-hover
                  disabled={!defaultVariant || unavailable || product.variants?.length > 1 || defaultVariant.stock === 0}
                  onClick={() => {
                    if (product.variants?.length > 1) return;
                    addToCart(product, defaultVariant, 1);
                    onClose();
                  }}
                  className="w-full py-3.5 bg-gold text-obsidian text-xs tracking-widest2 uppercase font-semibold hover:bg-gold-pale transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {defaultVariant?.stock === 0 ? 'Out of Stock' : `Add to Bag — ${formatCurrency(price, settings.currency)}`}
                </button>
                <Link
                  to={`/product/${product.slug}`}
                  onClick={onClose}
                  className="text-center text-xs tracking-widest2 uppercase text-ivory/60 hover:text-gold py-2"
                >
                  View full details
                </Link>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
