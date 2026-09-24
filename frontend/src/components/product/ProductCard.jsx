import { useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { HiHeart, HiOutlineHeart, HiOutlineEye, HiStar } from 'react-icons/hi';
import { useWishlist } from '@/context/WishlistContext';
import { useCart } from '@/context/CartContext';
import { placeholderSwatch, productImage } from '@/utils/placeholderSwatch';
import QuickViewModal from './QuickViewModal';
import { useSiteSettings } from '@/context/SiteSettingsContext';
import { formatCurrency } from '@/utils/currency';
import { getSalePrice, isOnActiveSale } from '@/utils/salePricing';

export default function ProductCard({ product }) {
  const cardRef = useRef(null);
  const [tilt, setTilt] = useState({ rx: 0, ry: 0 });
  const [quickViewOpen, setQuickViewOpen] = useState(false);
  const { isWishlisted, toggleWishlist } = useWishlist();
  const { addToCart } = useCart();
  const { settings } = useSiteSettings();
  const navigate = useNavigate();
  const wishlisted = isWishlisted(product._id);

  const image = productImage(product);
  const defaultVariant = product.variants?.[0];
  const regularPrice = defaultVariant?.price ?? product.basePrice;
  const onSale = isOnActiveSale(product);
  const price = getSalePrice(product, regularPrice);
  const availability = product.stockStatus || 'in_stock';
  const unavailable = availability !== 'in_stock';

  const handleMouseMove = (e) => {
    const el = cardRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width - 0.5;
    const py = (e.clientY - rect.top) / rect.height - 0.5;
    setTilt({ rx: py * -8, ry: px * 8 });
  };

  const handleMouseLeave = () => setTilt({ rx: 0, ry: 0 });

  const handleQuickAdd = () => {
    if (product.variants?.length > 1) {
      navigate(`/product/${product.slug}`);
      return;
    }
    if (!defaultVariant) return;
    addToCart(product, defaultVariant, 1);
  };

  return (
    <>
      <div className="group relative flex flex-col bg-white border border-[#E8DCCB] p-3 shadow-[0_12px_28px_-26px_rgba(25,21,23,.3)] transition-[border-color,transform,box-shadow] duration-300 hover:border-gold/60 hover:-translate-y-0.5 hover:shadow-[0_18px_32px_-26px_rgba(25,21,23,.4)]">
        <div
          ref={cardRef}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          style={{ perspective: 900 }}
            className="relative aspect-[3/4] overflow-hidden bg-[#F7F1E8]"
        >
          <motion.div
            animate={{ rotateX: tilt.rx, rotateY: tilt.ry }}
            transition={{ type: 'spring', stiffness: 200, damping: 20 }}
            style={{
              transformStyle: 'preserve-3d',
              background: image ? `url(${image}) center/contain no-repeat` : placeholderSwatch(product.name),
            }}
            className="w-full h-full flex items-center justify-center"
          >
            {!image && (
              <svg viewBox="0 0 100 170" className="w-16 opacity-90" style={{ transform: 'translateZ(40px)' }} aria-hidden="true">
                <rect x="35" y="10" width="30" height="18" rx="2" fill="#191517" opacity="0.55" />
                <path
                  d="M28 28 Q28 46 24 60 L24 150 Q24 160 34 160 L66 160 Q76 160 76 150 L76 60 Q72 46 72 28 Z"
                  fill="#191517"
                  opacity="0.45"
                />
              </svg>
            )}

            {onSale && (
              <span className="absolute top-2.5 left-2.5 z-10 bg-gold-deep px-2.5 py-1 text-[10px] font-semibold leading-none tracking-wide text-white">
                {product.activeSale.discount}% OFF
              </span>
            )}
            {product.tags?.includes('new') && !onSale && (
              <span className="absolute top-3 left-3 bg-gold text-obsidian text-[10px] tracking-widest2 uppercase px-2 py-1 font-semibold">
                New
              </span>
            )}
            {unavailable && (
              <span className="absolute top-3 left-3 bg-charcoal text-white text-[10px] tracking-widest2 uppercase px-2 py-1 border border-gold/50">
                {availability === 'coming_soon' ? 'Coming Soon' : 'Out of Stock'}
              </span>
            )}
          </motion.div>

          {/* Hover actions */}
          <div className="absolute top-3 right-3 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <button
              aria-label={wishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
              data-cursor-hover
              onClick={() => toggleWishlist(product)}
              className="w-9 h-9 rounded-full glass flex items-center justify-center text-gold hover:bg-gold hover:text-obsidian transition-colors"
            >
              {wishlisted ? <HiHeart /> : <HiOutlineHeart />}
            </button>
            <button
              aria-label="Quick view"
              data-cursor-hover
              onClick={() => setQuickViewOpen(true)}
              className="w-9 h-9 rounded-full glass flex items-center justify-center text-gold hover:bg-gold hover:text-obsidian transition-colors"
            >
              <HiOutlineEye />
            </button>
          </div>

          {/* Add to cart slide-up */}
          <button
            data-cursor-hover
            onClick={handleQuickAdd}
            disabled={!defaultVariant || unavailable || (product.variants?.length <= 1 && defaultVariant.stock === 0)}
            className="absolute bottom-0 left-0 right-0 translate-y-full group-hover:translate-y-0 transition-transform duration-300 bg-obsidian/90 backdrop-blur-sm text-ivory text-[11px] tracking-widest2 uppercase py-3 hover:bg-gold hover:text-obsidian disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {unavailable ? (availability === 'coming_soon' ? 'Coming Soon' : 'Out of Stock') : product.variants?.length > 1 ? 'Select Design' : defaultVariant?.stock === 0 ? 'Out of Stock' : 'Add to Bag'}
          </button>
        </div>

        <Link to={`/product/${product.slug}`} data-cursor-hover className="mt-4 block">
          <p className="text-[11px] tracking-widest2 uppercase text-gold/70">{product.brand?.name}</p>
          <h3 className="font-display text-lg text-primary mt-1 line-clamp-2 min-h-[3.5rem] group-hover:text-gold transition-colors">{product.name}</h3>
          <div className="flex items-center gap-2 mt-1.5">
            <span className="flex items-center gap-0.5 text-gold text-xs">
              <HiStar /> {product.rating?.toFixed?.(1) ?? product.rating ?? '—'}
            </span>
            <span className="text-xs text-ivory/40">({product.reviewCount ?? 0})</span>
          </div>
          <div className="mt-2 flex items-center gap-2">
            {onSale && (
              <span className="font-body text-xs text-ivory/40 line-through">{formatCurrency(regularPrice, settings.currency)}</span>
            )}
            <span className={`font-body text-sm ${onSale ? 'text-ember-light font-semibold' : ''}`}>{formatCurrency(price, settings.currency)}</span>
            {onSale && <span className="text-[10px] tracking-wide text-ember-light">{product.activeSale.discount}% OFF</span>}
          </div>
        </Link>
      </div>

      <QuickViewModal
        product={product}
        open={quickViewOpen}
        onClose={() => setQuickViewOpen(false)}
      />
    </>
  );
}
