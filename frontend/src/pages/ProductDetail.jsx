import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { HiHeart, HiOutlineHeart, HiStar, HiChevronLeft, HiChevronRight } from 'react-icons/hi';
import Reveal from '@/components/ui/Reveal';
import ProductCard from '@/components/product/ProductCard';
import ReviewsSection from '@/components/product/ReviewsSection';
import { PageLoader } from '@/components/ui/Loader';
import { productsApi } from '@/services/products';
import { placeholderSwatch } from '@/utils/placeholderSwatch';
import { useCart } from '@/context/CartContext';
import { useWishlist } from '@/context/WishlistContext';
import useRecentlyViewed from '@/hooks/useRecentlyViewed';
import { useSiteSettings } from '@/context/SiteSettingsContext';
import { formatCurrency } from '@/utils/currency';
import { getSalePrice, isOnActiveSale } from '@/utils/salePricing';

const TABS = ['Description', 'Notes', 'Reviews'];

export default function ProductDetail() {
  const { slug } = useParams();
  const { addToCart } = useCart();
  const { isWishlisted, toggleWishlist } = useWishlist();
  const { slugs: recentSlugs, recordView } = useRecentlyViewed();
  const { settings } = useSiteSettings();

  const [product, setProduct] = useState(null);
  const [notFound, setNotFound] = useState(false);
  const [related, setRelated] = useState([]);
  const [recentlyViewed, setRecentlyViewed] = useState([]);

  const [activeImage, setActiveImage] = useState(0);
  // Variants are embedded in Product and intentionally have no Mongo _id.
  // SKU is therefore the API/model identity for a design (and the value used
  // by cart and order validation); never use a gallery/array index as one.
  const [selectedVariantSku, setSelectedVariantSku] = useState(null);
  const [qty, setQty] = useState(1);
  const [activeTab, setActiveTab] = useState('Description');
  const [zoomStyle, setZoomStyle] = useState({});

  useEffect(() => {
    let cancelled = false;
    setProduct(null);
    setNotFound(false);
    window.scrollTo({ top: 0 });

    productsApi
      .getBySlug(slug)
      .then((p) => {
        if (cancelled) return;
        setProduct(p);
        const variants = Array.isArray(p.variants) ? p.variants : [];
        // Prefer a purchasable design so a sold-out first design does not
        // initially make the whole product look unavailable. If every active
        // design is sold out, retain the first one to show its true state.
        const initialVariant = variants.find(isPurchasableVariant)
          || variants.find(isSelectableVariant)
          || null;
        setActiveImage(0);
        setSelectedVariantSku(initialVariant?.sku || null);
        setQty(1);
        recordView(slug);
      })
      .catch(() => { if (!cancelled) setNotFound(true); });

    productsApi.getRelated(slug).then((items) => {
      if (!cancelled) setRelated(items);
    }).catch(() => { if (!cancelled) setRelated([]); });

    return () => { cancelled = true; };
  }, [slug]);

  useEffect(() => {
    const others = recentSlugs.filter((s) => s !== slug).slice(0, 4);
    if (others.length === 0) {
      setRecentlyViewed([]);
      return;
    }
    Promise.all(others.map((s) => productsApi.getBySlug(s).catch(() => null))).then((results) =>
      setRecentlyViewed(results.filter(Boolean))
    );
  }, [recentSlugs, slug]);

  if (notFound) {
    return (
      <div className="pt-40 pb-24 text-center">
        <p className="font-display text-3xl mb-4">This fragrance couldn't be found.</p>
        <Link to="/shop" className="text-gold underline text-sm">
          Return to the shop
        </Link>
      </div>
    );
  }

  if (!product) return <PageLoader />;

  const variants = Array.isArray(product.variants) ? product.variants : [];
  const selectedDesign = variants.find((item) => item.sku === selectedVariantSku) || null;
  // A missing/invalid server SKU is not a sellable selection. The UI does not
  // infer identity from a thumbnail index or fabricate stock in that case.
  const selectedStock = stockCount(selectedDesign?.stock);
  const variant = selectedDesign
    ? { ...selectedDesign, stock: selectedStock }
    : { stock: 0, price: product.basePrice, sku: '' };
  const onSale = isOnActiveSale(product);
  const displayedPrice = getSalePrice(product, variant.price);
  const wishlisted = isWishlisted(product._id);
  // A configured design owns its displayed image. Legacy products retain
  // their gallery until images are mapped from the admin edit screen.
  const images = variant?.image ? [variant.image] : (product.images?.length ? product.images : [{ url: null }]);
  const showGalleryControls = images.length > 1;
  const availability = product.stockStatus || 'in_stock';
  const unavailable = availability !== 'in_stock';
  const selectedAvailable = !unavailable && isPurchasableVariant(selectedDesign);
  const showPrevious = () => setActiveImage((current) => (current - 1 + images.length) % images.length);
  const showNext = () => setActiveImage((current) => (current + 1) % images.length);

  const handleMouseMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setZoomStyle({ transformOrigin: `${x}% ${y}%`, transform: 'scale(1.8)' });
  };

  const handleAddToCart = () => {
    if (!selectedDesign) { toast.error('Please select a design first'); return; }
    if (!selectedAvailable) return;
    addToCart(product, variant, qty);
  };

  const productJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description: product.description,
    brand: { '@type': 'Brand', name: product.brand?.name },
    image: images.map((img) => img.url).filter(Boolean),
    aggregateRating:
      product.reviewCount > 0
        ? { '@type': 'AggregateRating', ratingValue: product.rating, reviewCount: product.reviewCount }
        : undefined,
    offers: {
      '@type': 'Offer',
      url: typeof window !== 'undefined' ? window.location.href : undefined,
      priceCurrency: settings.currency || 'PKR',
      price: displayedPrice,
      availability: selectedAvailable ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
    },
  };

  return (
    <div className="pt-32 pb-24 max-w-7xl mx-auto px-6 md:px-10">
      <Helmet>
        <title>{product.name} — {settings.siteName}</title>
        <meta name="description" content={product.description?.slice(0, 160)} />
        <script type="application/ld+json">{JSON.stringify(productJsonLd)}</script>
      </Helmet>

      <nav className="text-xs text-ivory/40 mb-10 flex gap-2">
        <Link to="/" className="hover:text-gold">Home</Link> /
        <Link to="/shop" className="hover:text-gold">Shop</Link> /
        <span className="text-ivory/70">{product.name}</span>
      </nav>

      <div className="grid lg:grid-cols-2 gap-14">
        {/* Gallery */}
        <div>
          <div
            className="relative aspect-square overflow-hidden rounded-sm cursor-zoom-in"
            style={{
              background: images[activeImage]?.url
                ? `url(${images[activeImage].url}) center/cover no-repeat`
                : placeholderSwatch(product.name),
            }}
            onMouseMove={handleMouseMove}
            onMouseLeave={() => setZoomStyle({})}
          >
            {showGalleryControls && (
              <>
                <span className="absolute top-4 right-4 z-10 bg-charcoal/80 text-white text-[11px] tracking-wide px-3 py-1.5">{activeImage + 1} / {images.length}</span>
                <button type="button" onClick={showPrevious} aria-label="Previous product image" className="absolute left-3 top-1/2 -translate-y-1/2 z-10 w-10 h-10 bg-white/90 text-primary flex items-center justify-center hover:bg-primary hover:text-white"><HiChevronLeft /></button>
                <button type="button" onClick={showNext} aria-label="Next product image" className="absolute right-3 top-1/2 -translate-y-1/2 z-10 w-10 h-10 bg-white/90 text-primary flex items-center justify-center hover:bg-primary hover:text-white"><HiChevronRight /></button>
              </>
            )}
            {!images[activeImage]?.url && (
              <motion.svg
                viewBox="0 0 100 170"
                className="absolute inset-0 m-auto w-32 opacity-90 transition-transform duration-200"
                style={zoomStyle}
                aria-hidden="true"
              >
                <rect x="35" y="10" width="30" height="18" rx="2" fill="#191517" opacity="0.55" />
                <path
                  d="M28 28 Q28 46 24 60 L24 150 Q24 160 34 160 L66 160 Q76 160 76 150 L76 60 Q72 46 72 28 Z"
                  fill="#191517"
                  opacity="0.45"
                />
              </motion.svg>
            )}
          </div>
          {images.length > 1 && (
            <>
            <div className="hidden md:flex gap-3 mt-4">
              {images.map((img, i) => (
                <button
                  key={img.publicId || i}
                  onClick={() => setActiveImage(i)}
                  data-cursor-hover
                  className={`w-20 aspect-square rounded-sm border-2 transition-colors ${
                    activeImage === i ? 'border-gold' : 'border-transparent opacity-60'
                  }`}
                  style={{ background: img.url ? `url(${img.url}) center/cover no-repeat` : placeholderSwatch(product.name) }}
                  aria-label={`Show image ${i + 1}`}
                />
              ))}
            </div>
            <div className="flex md:hidden justify-center gap-2 mt-4" aria-label="Product image navigation">
              {images.map((img, i) => <button key={img.publicId || i} type="button" onClick={() => setActiveImage(i)} aria-label={`Show image ${i + 1}`} className={`w-2 h-2 rounded-full transition-colors ${activeImage === i ? 'bg-primary' : 'bg-gold/40'}`} />)}
            </div>
            </>
          )}
        </div>

        {/* Info */}
        <div>
          <p className="text-[11px] tracking-widest2 uppercase text-gold/70">{product.brand?.name}</p>
          <h1 className="heading-display text-4xl md:text-5xl mt-2">{product.name}</h1>
          <div className="flex items-center gap-2 mt-3">
            <span className="flex items-center gap-1 text-gold text-sm">
              <HiStar /> {product.rating?.toFixed?.(1) ?? product.rating ?? '—'}
            </span>
            <span className="text-xs text-ivory/40">
              ({product.reviewCount ?? 0} reviews) · SKU {variant.sku}
            </span>
          </div>

          <div className="mt-6 flex items-baseline gap-3">
            <p className="text-2xl font-body">{selectedDesign ? formatCurrency(displayedPrice, settings.currency) : `From ${formatCurrency(product.basePrice, settings.currency)}`}</p>
            {onSale && selectedDesign && <><span className="text-sm text-ivory/40 line-through">{formatCurrency(variant.price, settings.currency)}</span><span className="text-xs text-ember-light tracking-wide">{product.activeSale.discount}% OFF</span></>}
          </div>
          <p className={`mt-3 text-sm font-medium ${selectedAvailable ? 'text-primary' : 'text-ember-light'}`}>
            {availability === 'coming_soon' ? 'Coming Soon' : unavailable ? 'Out of Stock' : variant.stock > 0 ? '✓ In Stock' : 'Out of Stock'}
          </p>

          {/* Each variant is one independently purchasable design. */}
          <div className="mt-8">
            <p className="text-[11px] tracking-widest2 uppercase text-ivory/50 mb-3">Select Design</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {variants.map((v) => (
                <button
                  key={v.sku}
                  onClick={() => {
                    setSelectedVariantSku(v.sku);
                    setActiveImage(0);
                    setQty(1);
                  }}
                  disabled={unavailable || !isSelectableVariant(v)}
                  data-cursor-hover
                  className={`overflow-hidden border text-left transition-colors disabled:opacity-45 disabled:cursor-not-allowed ${
                    selectedVariantSku === v.sku
                      ? 'border-gold ring-1 ring-gold bg-gold/10'
                      : 'border-gold/25 text-ivory/70 hover:border-gold/60'
                  }`}
                >
                  <div className="aspect-square bg-obsidian-light">{v.image?.url && <img src={v.image.url} alt={v.label} className="w-full h-full object-cover" />}</div>
                  <span className="block px-3 pt-2 text-sm font-semibold">{v.label}</span>
                  <span className={`block px-3 pb-3 text-xs mt-1 ${isPurchasableVariant(v) ? 'text-primary' : 'text-ember-light'}`}>{!isPurchasableVariant(v) ? 'Out of Stock' : stockCount(v.stock) === 1 ? 'Only 1 left' : `${stockCount(v.stock)} available`}</span>
                </button>
              ))}
            </div>
            {selectedDesign && <p className="text-xs text-ivory/40 mt-3">SKU: {variant.sku} · {variant.stock > 1 ? `${variant.stock} available` : variant.stock === 1 ? 'Only 1 left' : 'Out of stock'}</p>}
          </div>

          {/* Qty + add to cart */}
          <div className="mt-8 flex items-center gap-4">
            <div className="flex items-center border border-gold/25">
              <button
                onClick={() => setQty((q) => Math.max(1, q - 1))}
                disabled={!selectedAvailable}
                className="w-10 h-11 text-lg hover:text-gold"
                aria-label="Decrease quantity"
              >
                −
              </button>
              <span className="w-10 text-center text-sm">{qty}</span>
              <button
                onClick={() => setQty((q) => Math.min(selectedStock, q + 1))}
                disabled={!selectedAvailable}
                className="w-10 h-11 text-lg hover:text-gold"
                aria-label="Increase quantity"
              >
                +
              </button>
            </div>
            <button
              onClick={handleAddToCart}
              disabled={!selectedAvailable}
              data-cursor-hover
              className="flex-1 py-3.5 bg-gold text-obsidian text-xs tracking-widest2 uppercase font-semibold hover:bg-gold-pale transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {unavailable ? (availability === 'coming_soon' ? 'Coming Soon' : 'Out of Stock') : selectedAvailable ? 'Add to Bag' : 'Out of Stock'}
            </button>
            <button
              onClick={() => toggleWishlist(product)}
              aria-label={wishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
              data-cursor-hover
              className="w-12 h-12 border border-gold/25 flex items-center justify-center hover:border-gold text-gold shrink-0"
            >
              {wishlisted ? <HiHeart /> : <HiOutlineHeart />}
            </button>
          </div>

          {/* Tabs */}
          <div className="mt-14">
            <div className="flex gap-8 border-b border-gold/10">
              {TABS.map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  data-cursor-hover
                  className={`pb-3 text-[11px] tracking-widest2 uppercase transition-colors ${
                    activeTab === tab ? 'text-gold border-b-2 border-gold' : 'text-ivory/40 hover:text-ivory/70'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            <div className="pt-8">
              {activeTab === 'Description' && (
                <p className="text-ivory/70 leading-relaxed max-w-lg whitespace-pre-wrap break-words">{product.description}</p>
              )}
              {activeTab === 'Notes' && (
                <dl className="space-y-4 max-w-lg">
                  <NoteRow label="Top" value={product.notes?.top} />
                  <NoteRow label="Heart" value={product.notes?.heart} />
                  <NoteRow label="Base" value={product.notes?.base} />
                </dl>
              )}
              {activeTab === 'Reviews' && <ReviewsSection productId={product._id} productSlug={product.slug} />}
            </div>
          </div>
        </div>
      </div>

      {/* Related */}
      {related.length > 0 && (
        <section className="mt-28">
          <Reveal>
            <p className="eyebrow mb-3">You May Also Love</p>
            <h2 className="heading-display text-3xl md:text-4xl mb-10">More from {product.category?.name}</h2>
          </Reveal>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
            {related.map((p, i) => (
              <Reveal key={p._id} delay={i * 0.06}>
                <ProductCard product={p} />
              </Reveal>
            ))}
          </div>
        </section>
      )}

      {/* Recently viewed */}
      {recentlyViewed.length > 0 && (
        <section className="mt-24">
          <Reveal>
            <p className="eyebrow mb-3">Your Trail</p>
            <h2 className="heading-display text-3xl md:text-4xl mb-10">Recently Viewed</h2>
          </Reveal>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
            {recentlyViewed.map((p, i) => (
              <Reveal key={p._id} delay={i * 0.06}>
                <ProductCard product={p} />
              </Reveal>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function stockCount(value) {
  const stock = Number(value);
  return Number.isFinite(stock) && stock > 0 ? stock : 0;
}

function isSelectableVariant(variant) {
  return Boolean(variant?.sku) && variant.isActive !== false;
}

function isPurchasableVariant(variant) {
  return isSelectableVariant(variant) && stockCount(variant.stock) > 0;
}

function NoteRow({ label, value }) {
  return (
    <div className="flex gap-4">
      <dt className="w-16 shrink-0 text-gold/80 text-sm">{label}</dt>
      <dd className="text-ivory/70 text-sm">{value || '—'}</dd>
    </div>
  );
}
