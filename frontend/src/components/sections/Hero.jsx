import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { Link } from 'react-router-dom';
import { HiOutlineArrowDown } from 'react-icons/hi';
import { productsApi } from '@/services/products';
import { useSiteSettings } from '@/context/SiteSettingsContext';

export default function Hero() {
  const rootRef = useRef(null);
  const bottleRef = useRef(null);
  const [heroProduct, setHeroProduct] = useState(null);
  const { settings } = useSiteSettings();

  // Pulls a real product photo for the hero once one exists — falls back
  // to the generic bottle illustration below until then.
  useEffect(() => {
    productsApi
      .list({ tag: 'featured', limit: 1 })
      .then((data) => {
        if (data.products.length > 0) {
          setHeroProduct(data.products[0]);
        } else {
          // No "featured" tag set yet — fall back to the newest product.
          return productsApi.list({ sort: 'newest', limit: 1 }).then((d) => {
            if (d.products.length > 0) setHeroProduct(d.products[0]);
          });
        }
      })
      .catch(() => {});
  }, []);

  const heroImage = heroProduct?.images?.[0]?.url || null;

  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });
      tl.fromTo(
        '.hero-eyebrow',
        { opacity: 0, y: 16 },
        { opacity: 1, y: 0, duration: 0.7 }
      )
        .fromTo(
          '.hero-line',
          { opacity: 0, y: 60, skewY: 2 },
          { opacity: 1, y: 0, skewY: 0, duration: 1, stagger: 0.12 },
          '-=0.3'
        )
        .fromTo(
          '.hero-sub',
          { opacity: 0, y: 20 },
          { opacity: 1, y: 0, duration: 0.7 },
          '-=0.4'
        )
        .fromTo(
          '.hero-cta',
          { opacity: 0, y: 20 },
          { opacity: 1, y: 0, duration: 0.6, stagger: 0.08 },
          '-=0.4'
        )
        .fromTo(
          bottleRef.current,
          { opacity: 0, scale: 0.85, y: 40 },
          { opacity: 1, scale: 1, y: 0, duration: 1.2, ease: 'power2.out' },
          '-=1'
        );

      // Ambient float on the bottle/product visual
      gsap.to(bottleRef.current, {
        y: -16,
        duration: 4,
        repeat: -1,
        yoyo: true,
        ease: 'sine.inOut',
        delay: 1.5,
      });

      // Parallax gold particles drifting upward
      gsap.utils.toArray('.hero-particle').forEach((el, i) => {
        gsap.to(el, {
          y: -window.innerHeight * 0.6,
          x: `+=${(i % 2 === 0 ? 1 : -1) * (20 + i * 6)}`,
          opacity: 0,
          duration: 8 + i * 1.5,
          repeat: -1,
          ease: 'none',
          delay: i * 0.9,
        });
      });
    }, rootRef);

    return () => ctx.revert();
  }, [heroImage]);

  return (
    <section
      ref={rootRef}
      className="relative min-h-[min(780px,100vh)] flex items-center overflow-hidden bg-noir-radial"
    >
      {/* Ambient gold particles */}
      <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
        {Array.from({ length: 10 }).map((_, i) => (
          <span
            key={i}
            className="hero-particle absolute rounded-full bg-gold/50"
            style={{
              width: 2 + (i % 3),
              height: 2 + (i % 3),
              left: `${8 + i * 9}%`,
              bottom: `${10 + (i % 4) * 8}%`,
              filter: 'blur(0.5px)',
            }}
          />
        ))}
      </div>

      <div className="relative z-10 mx-auto max-w-7xl w-full px-6 md:px-10 grid lg:grid-cols-2 gap-16 items-center pt-28 pb-20">
        {/* Copy */}
        <div>
          <p className="hero-eyebrow eyebrow mb-6">{settings.hero.eyebrow}</p>
          <h1 className="font-display font-light leading-[0.95] text-primary text-[13vw] sm:text-6xl md:text-7xl lg:text-[5.2rem]">
            <span className="hero-line block overflow-hidden">{settings.hero.titleLine1}</span>
            <span className="hero-line block overflow-hidden text-gold-sheen italic">{settings.hero.titleLine2}</span>
            <span className="hero-line block overflow-hidden">{settings.hero.titleLine3}</span>
          </h1>
          <p className="hero-sub mt-8 max-w-md text-ivory/65 text-base leading-relaxed">
            {settings.hero.subtitle}
          </p>
          <div className="mt-10 flex flex-wrap items-center gap-5">
            <Link
              to="/shop"
              data-cursor-hover
              className="hero-cta group relative px-9 py-4 text-xs tracking-widest2 uppercase bg-gold text-obsidian font-semibold overflow-hidden"
            >
              <span className="relative z-10">Discover the Collection</span>
              <span className="absolute inset-0 bg-[#7A1833] translate-y-full group-hover:translate-y-0 transition-transform duration-500 ease-out" />
            </Link>
            <Link
              to="/shop"
              data-cursor-hover
              className="hero-cta text-xs tracking-widest2 uppercase text-ivory/80 border-b border-gold/40 pb-1 hover:text-gold hover:border-gold transition-colors"
            >
              Explore Products
            </Link>
          </div>
        </div>

        {/* Signature visual: real product photo once one exists, generic
            bottle illustration as the fallback until then */}
        <div className="relative flex justify-center items-center">
          <div className="absolute w-[75%] aspect-square rounded-full bg-[#E8DCCB]/70 blur-3xl" aria-hidden="true" />

          {heroImage ? (
            <Link to={`/product/${heroProduct.slug}`} data-cursor-hover className="relative block group">
              <div
                ref={bottleRef}
                className="w-64 md:w-80 aspect-square overflow-hidden bg-white border border-[#E8DCCB] shadow-[0_24px_50px_-38px_rgba(25,21,23,.35)]"
                style={{ background: `url(${heroImage}) center/contain no-repeat` }}
              />
              <div className="mt-4 text-center opacity-0 group-hover:opacity-100 transition-opacity">
                <p className="text-xs tracking-widest2 uppercase text-gold">{heroProduct.name} →</p>
              </div>
            </Link>
          ) : (
            <svg
              ref={bottleRef}
              viewBox="0 0 200 340"
              className="relative w-48 md:w-64 drop-shadow-gold"
              role="img"
              aria-label="Silhouette of the signature store bottle"
            >
              <defs>
                <linearGradient id="bottleGrad" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#E8DCCB" />
                  <stop offset="50%" stopColor="#C9A46C" />
                  <stop offset="100%" stopColor="#A98456" />
                </linearGradient>
              </defs>
              <rect x="70" y="20" width="60" height="36" rx="4" fill="url(#bottleGrad)" opacity="0.9" />
              <rect x="85" y="4" width="30" height="20" rx="3" fill="url(#bottleGrad)" />
              <path
                d="M60 56 Q60 90 50 120 L50 300 Q50 320 70 320 L130 320 Q150 320 150 300 L150 120 Q140 90 140 56 Z"
                fill="url(#bottleGrad)"
                opacity="0.85"
              />
              <rect x="55" y="150" width="90" height="60" fill="#5A0F24" opacity="0.55" />
            </svg>
          )}
        </div>
      </div>

      {/* Scroll cue */}
      <div className="hero-sub absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-ivory/50">
        <span className="text-[10px] tracking-widest2 uppercase">Scroll</span>
        <HiOutlineArrowDown className="animate-bounce" />
      </div>
    </section>
  );
}
