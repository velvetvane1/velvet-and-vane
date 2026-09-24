import { HelmetProvider } from 'react-helmet-async';
import { Toaster } from 'react-hot-toast';
import { ThemeProvider } from '@/context/ThemeContext';
import { AuthProvider } from '@/context/AuthContext';
import { CartProvider } from '@/context/CartContext';
import { WishlistProvider } from '@/context/WishlistContext';
import { SiteSettingsProvider } from '@/context/SiteSettingsContext';
import AppRouter from '@/router/AppRouter';
import SiteMeta from '@/components/seo/SiteMeta';

export default function App() {
  return (
    <HelmetProvider>
      <ThemeProvider>
        <SiteSettingsProvider>
          <SiteMeta />
          <AuthProvider>
            <CartProvider>
              <WishlistProvider>
                <AppRouter />
                <Toaster
                  position="bottom-right"
                  toastOptions={{
                    style: {
                      background: '#5A0F24',
                      color: '#FFFFFF',
                      border: '1px solid #E8DCCB',
                      fontSize: '13px',
                    },
                    success: { iconTheme: { primary: '#C9A46C', secondary: '#5A0F24' } },
                  }}
                />
              </WishlistProvider>
            </CartProvider>
          </AuthProvider>
        </SiteSettingsProvider>
      </ThemeProvider>
    </HelmetProvider>
  );
}
