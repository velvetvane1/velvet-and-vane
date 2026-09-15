import { useEffect, useState } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import {
  HiOutlineSearch,
  HiOutlineHeart,
  HiOutlineShoppingBag,
  HiOutlineUser,
  HiOutlineMenu,
  HiOutlineX,
  HiOutlineSun,
  HiOutlineMoon,
} from 'react-icons/hi';
import { useTheme } from '@/context/ThemeContext';
import { useSiteSettings } from '@/context/SiteSettingsContext';
import { useAuth } from '@/context/AuthContext';
import { categoriesApi } from '@/services/products';

const NAV_LINKS = [
  { label: 'Home', to: '/' },
  { label: 'Shop', to: '/shop', hasCategories: true },
  { label: 'Brands', to: '/brands' },
  { label: 'Categories', to: '/shop', hasCategories: true },
  { label: 'New Arrivals', to: '/new-arrivals' },
  { label: 'Best Sellers', to: '/best-sellers' },
  { label: 'About Us', to: '/about' },
  { label: 'Contact Us', to: '/contact' },
];

export default function Navbar({ cartCount = 0, wishlistCount = 0 }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [categories, setCategories] = useState([]);
  const [logoFailed, setLogoFailed] = useState(false);
  const { isDark, toggleTheme } = useTheme();
  const { settings } = useSiteSettings();
  const { user, loading, isAuthenticated, logout } = useAuth();
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const isCollectionsRoute = pathname === '/shop' || pathname.startsWith('/product/');

  const navLinkClass = (isActive) =>
    `relative font-body text-[11px] tracking-[0.16em] uppercase transition-colors duration-300 after:content-[''] after:absolute after:-bottom-2 after:left-0 after:h-px after:bg-gold after:transition-all after:duration-300 ${
      isActive
        ? 'text-gold after:w-full'
        : 'text-ivory/80 hover:text-gold after:w-0 hover:after:w-full'
    }`;

  const handleLogout = async () => {
    await logout();
    setMobileOpen(false);
    navigate('/');
  };

  useEffect(() => {
    categoriesApi.list().then(setCategories).catch(() => setCategories([]));
  }, []);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 border-b border-[#E5DED3] bg-[#FFFDF9]/95 py-4 text-ivory shadow-[0_8px_28px_-24px_rgba(44,41,37,.45)] backdrop-blur-sm transition-all duration-300">
      <div className="relative mx-auto flex h-9 max-w-[100rem] items-center px-3 sm:px-5 md:px-8 lg:grid lg:h-auto lg:grid-cols-[auto_minmax(0,1fr)_auto] lg:gap-x-5">
        {/* This control is intentionally mobile-only; desktop always exposes the full nav. */}
        <button
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-gold/35 text-lg text-gold transition-colors duration-200 hover:border-gold hover:bg-gold/10 hover:text-gold-pale lg:hidden"
          aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
          onClick={() => setMobileOpen((v) => !v)}
        >
          {mobileOpen ? <HiOutlineX /> : <HiOutlineMenu />}
        </button>

        <Link to="/" className="absolute left-1/2 flex -translate-x-1/2 items-center select-none lg:static lg:translate-x-0 lg:pr-2" data-cursor-hover>
          <span className="font-display text-lg sm:text-xl md:text-2xl tracking-[0.16em] uppercase text-ivory whitespace-nowrap">VELVET <i className="font-normal text-gold">&amp;</i> VANE</span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden min-w-0 self-center lg:flex items-center justify-self-center whitespace-nowrap gap-2.5 xl:gap-4 2xl:gap-6">
          {NAV_LINKS.map((link) => (
            <div key={link.label} className="relative group">
              <NavLink
                to={link.to}
                data-cursor-hover
                end={link.to === '/'}
                className={({ isActive }) => navLinkClass(link.hasCategories ? isCollectionsRoute : isActive)}
              >
                {link.label}
              </NavLink>
              {link.hasCategories && categories.length > 0 && (
                <div className="invisible opacity-0 group-hover:visible group-hover:opacity-100 transition-all duration-200 absolute left-1/2 -translate-x-1/2 top-full pt-5 w-56">
                  <div className="glass border border-gold/20 p-2 shadow-glass">
                    <Link to="/shop" className="block px-3 py-2 text-xs text-gold hover:bg-gold/10">All Products</Link>
                    {categories.map((category) => (
                      <Link key={category._id} to={`/shop?category=${category.slug}`} className="block px-3 py-2 text-xs text-ivory/75 hover:bg-gold/10 hover:text-gold">
                        {category.name}
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </nav>

        <div className="ml-auto flex min-w-0 items-center gap-1.5 text-lg sm:gap-2 sm:text-xl lg:ml-0 lg:justify-self-end lg:gap-3 lg:text-lg">
          {!loading && !isAuthenticated && (
            <div className="hidden shrink-0 items-center gap-1.5 lg:flex lg:gap-2">
              <Link
                to="/login"
                className="inline-flex h-8 items-center whitespace-nowrap border border-[#E5DED3] bg-white px-2.5 text-[9px] font-semibold tracking-[0.1em] uppercase text-ivory transition-colors duration-200 hover:border-gold hover:text-gold sm:h-9 sm:px-3 sm:text-[10px]"
                data-cursor-hover
              >
                Login
              </Link>
              <Link
                to="/signup"
                className="inline-flex h-8 items-center whitespace-nowrap border border-gold bg-gold px-2.5 text-[9px] font-semibold tracking-[0.08em] uppercase text-white transition-colors duration-200 hover:bg-gold-deep sm:h-9 sm:px-3 sm:text-[10px]"
                data-cursor-hover
              >
                Create Account
              </Link>
            </div>
          )}
          <div className="flex shrink-0 items-center gap-1.5 sm:gap-2 lg:gap-3">
            <button
              aria-label="Search products"
              className="hover:text-gold transition-colors"
              data-cursor-hover
              onClick={() => setSearchOpen(true)}
            >
              <HiOutlineSearch />
            </button>
            <button
              aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
              className="hidden lg:inline-flex items-center hover:text-gold transition-colors"
              data-cursor-hover
              onClick={toggleTheme}
            >
              {isDark ? <HiOutlineSun /> : <HiOutlineMoon />}
            </button>
          {!loading && (
            <Link
              to={isAuthenticated ? '/account' : '/login'}
              aria-label={isAuthenticated ? 'My account' : 'Sign in'}
              className="inline-flex shrink-0 items-center hover:text-gold transition-colors lg:hidden"
              data-cursor-hover
            >
              <HiOutlineUser />
            </Link>
          )}
          {isAuthenticated ? (
            <>
              <Link to="/account" aria-label="My account" className="hidden shrink-0 items-center hover:text-gold transition-colors lg:inline-flex" data-cursor-hover>
                <HiOutlineUser />
              </Link>
              <Link
                to="/account"
                title={user?.name}
                className="hidden xl:block max-w-28 truncate text-xs tracking-wide hover:text-gold transition-colors"
                data-cursor-hover
              >
                {user?.name}
              </Link>
              <button
                type="button"
                onClick={handleLogout}
                className="hidden xl:block shrink-0 text-xs tracking-wide hover:text-gold transition-colors"
                data-cursor-hover
              >
                Logout
              </button>
            </>
          ) : null}
            <Link to="/wishlist" aria-label="Wishlist" className="relative hover:text-gold transition-colors" data-cursor-hover>
              <HiOutlineHeart />
              {wishlistCount > 0 && <CountBadge count={wishlistCount} />}
            </Link>
            <Link to="/cart" aria-label="Shopping bag" className="relative hover:text-gold transition-colors" data-cursor-hover>
              <HiOutlineShoppingBag />
              {cartCount > 0 && <CountBadge count={cartCount} />}
            </Link>
          </div>
        </div>
      </div>

      {/* Mobile drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.nav
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            className="overflow-hidden glass mt-3 mx-4 shadow-glass lg:hidden"
          >
            <ul className="flex flex-col divide-y divide-gold/10">
              {NAV_LINKS.map((link) => (
                <li key={link.label}>
                  <NavLink
                    to={link.to}
                    onClick={() => setMobileOpen(false)}
                    end={link.to === '/'}
                    className={({ isActive }) =>
                      `block px-6 py-4 text-sm tracking-[0.18em] uppercase hover:text-gold ${
                        (link.hasCategories ? isCollectionsRoute : isActive) ? 'text-gold' : 'text-ivory/85'
                      }`
                    }
                  >
                    {link.label}
                  </NavLink>
                  {link.hasCategories && categories.map((category) => (
                    <NavLink
                      key={category._id}
                      to={`/shop?category=${category.slug}`}
                      onClick={() => setMobileOpen(false)}
                      className="block px-9 py-3 text-xs text-ivory/55 hover:text-gold"
                    >
                      {category.name}
                    </NavLink>
                  ))}
                </li>
              ))}
              {isAuthenticated && (
                <li className="px-6 py-4">
                  <div className="flex items-center justify-between gap-4">
                    <Link to="/account" onClick={() => setMobileOpen(false)} className="min-w-0 text-sm text-ivory/85 hover:text-gold">
                      <span className="block truncate">{user?.name}</span>
                      <span className="text-xs text-ivory/50">My account</span>
                    </Link>
                    <button type="button" onClick={handleLogout} className="shrink-0 text-xs tracking-widest2 uppercase text-gold hover:text-ivory">
                      Logout
                    </button>
                  </div>
                </li>
              )}
            </ul>
          </motion.nav>
        )}
      </AnimatePresence>

      {/* Search overlay */}
      <AnimatePresence>
        {searchOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] bg-[#F8F5EF]/95 backdrop-blur-sm flex items-start justify-center pt-32 px-6"
            onClick={() => setSearchOpen(false)}
          >
            <motion.div
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.1, duration: 0.4 }}
              className="w-full max-w-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <label htmlFor="global-search" className="eyebrow block mb-3 text-center">
                Search the collection
              </label>
              <input
                id="global-search"
                autoFocus
                type="text"
                placeholder="Oud, Chanel, Santal 33…"
                className="w-full bg-transparent border-b border-gold/40 text-2xl md:text-4xl font-display text-center py-4 focus:outline-none focus:border-gold placeholder:text-ivory/30"
              />
              <button
                className="mt-8 mx-auto block text-xs tracking-widest2 uppercase text-ivory/50 hover:text-gold"
                onClick={() => setSearchOpen(false)}
              >
                Close
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}

function CountBadge({ count }) {
  return (
    <span className="absolute -top-2 -right-2 w-4 h-4 rounded-full bg-gold text-obsidian text-[10px] leading-4 text-center font-body font-bold">
      {count > 9 ? '9+' : count}
    </span>
  );
}
