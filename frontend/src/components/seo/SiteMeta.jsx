import { Helmet } from 'react-helmet-async';
import { useSiteSettings } from '@/context/SiteSettingsContext';

const FALLBACK_SITE_NAME = 'VELVET & VANE';
const STORE_ICON_PATH = '/icons/arwa-icon-512.png';

/** Runtime site-wide metadata sourced from the singleton SiteSettings record. */
export default function SiteMeta() {
  const { settings } = useSiteSettings();
  const siteName = settings?.siteName?.trim() || FALLBACK_SITE_NAME;
  const description = settings?.footerTagline?.trim() || `Shop ${siteName} online.`;
  const siteUrl = typeof window === 'undefined' ? '' : window.location.origin;
  const logoUrl = `${siteUrl}${STORE_ICON_PATH}`;

  const organization = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: siteName,
    description,
    ...(siteUrl && { url: siteUrl }),
    ...(logoUrl && { logo: logoUrl }),
  };
  const website = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: siteName,
    ...(siteUrl && {
      url: siteUrl,
      potentialAction: {
        '@type': 'SearchAction',
        target: `${siteUrl}/shop?q={search_term_string}`,
        'query-input': 'required name=search_term_string',
      },
    }),
  };

  return (
    <Helmet>
      <title>{siteName}</title>
      <meta name="description" content={description} />
      <meta property="og:type" content="website" />
      <meta property="og:site_name" content={siteName} />
      <meta property="og:title" content={siteName} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={logoUrl} />
      {siteUrl && <meta property="og:url" content={siteUrl} />}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={siteName} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={logoUrl} />
      <meta name="apple-mobile-web-app-title" content={siteName} />
      <script type="application/ld+json">{JSON.stringify(organization)}</script>
      <script type="application/ld+json">{JSON.stringify(website)}</script>
    </Helmet>
  );
}
