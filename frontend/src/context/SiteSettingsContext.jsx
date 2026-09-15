import { createContext, useContext, useEffect, useState } from 'react';
import { siteSettingsApi } from '@/services/siteSettings';

const DEFAULTS = {
  siteName: 'VELVET & VANE',
  currency: 'PKR',
  whatsapp: {
    number: '+923176346085',
    prefilledMessage: 'Assalam-o-Alaikum! ✨\n\nI would like to know more about your products.',
  },
  logo: { url: null },
  hero: {
    eyebrow: 'Curated for Everyday Living',
    titleLine1: 'Everything You Love,',
    titleLine2: 'All in',
    titleLine3: 'One Place.',
    subtitle:
      'Discover a carefully curated collection of fashion, fragrances, natural products, traditional favorites, and premium essentials — selected to bring quality and elegance to everyday living.',
  },
  footerTagline:
    'A carefully curated collection of fashion, fragrances, natural products, traditional favorites, and premium essentials.',
  contact: { email: 'hello@velvetandvane.com', phone: '+92 317 6346085', address: 'Pakistan' },
  paymentSettings: {},
};

const SiteSettingsContext = createContext({ settings: DEFAULTS, loading: true, refresh: () => {} });

export function SiteSettingsProvider({ children }) {
  const [settings, setSettings] = useState(DEFAULTS);
  const [loading, setLoading] = useState(true);

  const refresh = () => {
    siteSettingsApi
      .get()
      .then((data) => setSettings({ ...DEFAULTS, ...data, hero: { ...DEFAULTS.hero, ...data.hero }, contact: { ...DEFAULTS.contact, ...data.contact }, paymentSettings: data.paymentSettings || {} }))
      .catch(() => {
        /* Backend unreachable or not yet configured — fall back to defaults silently. */
      })
      .finally(() => setLoading(false));
  };

  useEffect(refresh, []);

  return (
    <SiteSettingsContext.Provider value={{ settings, loading, refresh }}>
      {children}
    </SiteSettingsContext.Provider>
  );
}

export function useSiteSettings() {
  return useContext(SiteSettingsContext);
}
