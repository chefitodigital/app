import React, { useEffect, useState, Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'motion/react';
import { Toaster } from 'react-hot-toast';
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/react';
import Header from './components/Header';
import Footer from './components/Footer';
import Cart from './components/Cart';
import InstallPWA from './components/InstallPWA';
import NewOrderBanner from './components/NewOrderBanner';
import AddressUpdateBanner from './components/AddressUpdateBanner';
import { ScrollToTop } from './components/ScrollToTop';
import { useThemeStore } from './store/theme';
import { useAuth } from './hooks/useAuth';
import { useOrderNotifications } from './hooks/useOrderNotifications';
import { startDomTranslator, stopDomTranslator } from './lib/domTranslator';
import type { Country } from './lib/i18n';
import { supabase } from './lib/supabase';
import { getBusinessSlug } from './lib/businessRoutes';
import { setCurrentBusinessId, setCurrentOwnerId } from './lib/businessFetch';
import { useCartStore } from './store/cart';
import PlatformHome from './pages/PlatformHome';
import CreateBusiness from './pages/CreateBusiness';
import ResetPassword from './pages/ResetPassword';
import { PLATFORM_ADMIN_ID } from './lib/platformAdmin';

const Menu = lazy(() => import('./pages/Menu'));
const Products = lazy(() => import('./pages/Products'));
const Orders = lazy(() => import('./pages/Orders'));
const Archive = lazy(() => import('./pages/Archive'));
const ProductStats = lazy(() => import('./pages/ProductStats'));
const Customers = lazy(() => import('./pages/Customers'));
const Staff = lazy(() => import('./pages/Staff'));
const Financial = lazy(() => import('./pages/Financial'));
const PublicOrder = lazy(() => import('./pages/PublicOrder'));
const Settings = lazy(() => import('./pages/Settings'));
const PlatformAdmin = lazy(() => import('./pages/PlatformAdmin'));
const ChefitoCentral = lazy(() => import('./pages/ChefitoCentral'));

type BusinessIdentity = { id: string; owner_user_id: string; slug: string };
const businessRequests = new Map<string, Promise<BusinessIdentity | null>>();

function fetchBusiness(slug: string): Promise<BusinessIdentity | null> {
  const pending = businessRequests.get(slug);
  if (pending) return pending;
  const request = (async () => {
    const { data, error } = await supabase.from('businesses')
      .select('id,owner_user_id,slug').eq('slug', slug).maybeSingle();
    if (error) throw error;
    return data;
  })();
  businessRequests.set(slug, request);
  void request.finally(() => businessRequests.delete(slug)).catch(() => undefined);
  return request;
}

function cachedBusiness(slug: string | null): BusinessIdentity | null {
  if (!slug) return null;
  try {
    const cached = JSON.parse(sessionStorage.getItem(`chefito-business:${slug}`) || 'null');
    if (cached?.slug !== slug || !cached.id || !cached.owner_user_id || Date.now() - cached.savedAt > 600_000) return null;
    setCurrentBusinessId(cached.id);
    setCurrentOwnerId(cached.owner_user_id);
    return { id: cached.id, owner_user_id: cached.owner_user_id, slug };
  } catch {
    return null;
  }
}

function AppContent({ ownerUserId }: { ownerUserId: string }) {
  const location = useLocation();
  const { settings } = useThemeStore();
  const { isAuthenticated, login, isSuperAdmin, userId, authInitialized } = useAuth();
  const canManage = authInitialized && isAuthenticated && userId === ownerUserId;
  const ownerOnly = (page: React.ReactNode) => canManage ? page : (
    <div className="mx-auto max-w-xl rounded-3xl bg-gray-50 p-8 text-center shadow-soft">
      <h1 className="text-2xl font-bold">Área do negócio</h1>
      <p className="mt-3 text-gray-700">Entre com a conta proprietária para gerenciar este negócio.</p>
      <a className="btn btn-primary mt-6 inline-flex" href="/#acesso">Entrar</a>
    </div>
  );
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const notifications = useOrderNotifications(
    isAuthenticated && isSuperAdmin(),
  );

  useEffect(() => {
    const handleOpenLogin = () => setShowLoginModal(true);
    window.addEventListener('open-login', handleOpenLogin);
    return () => window.removeEventListener('open-login', handleOpenLogin);
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const success = await login(email, password);
    if (success && useAuth.getState().userId === PLATFORM_ADMIN_ID) { window.location.assign('/admin'); return; }
    setShowLoginModal(false);
    setEmail('');
    setPassword('');
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-gray-50 via-gray-100 to-gray-50 relative overflow-x-clip">
      {/* Ambient depth stays static so content remains calm. */}
      <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div
          className="absolute -top-32 -left-32 w-[40rem] h-[40rem] rounded-full blur-3xl opacity-15"
          style={{ background: 'radial-gradient(circle at center, var(--color-accent), transparent 65%)' }}
        />
        <div
          className="absolute top-1/3 -right-40 w-[36rem] h-[36rem] rounded-full blur-3xl opacity-20"
          style={{ background: 'radial-gradient(circle at center, #adb5bd, transparent 65%)' }}
        />
        <div
          className="absolute bottom-0 left-1/4 w-[32rem] h-[32rem] rounded-full blur-3xl opacity-20"
          style={{ background: 'radial-gradient(circle at center, #dee2e6, transparent 65%)' }}
        />
      </div>
      <Header onLoginClick={() => setShowLoginModal(true)} notifications={notifications} />
      <main className="flex-1 container mx-auto px-4 py-8">

        <Suspense fallback={<div className="min-h-[60vh]" />}>
          <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
          >
            <Routes location={location}>
              <Route path="/" element={<Menu />} />
              <Route path="/produto/:slug" element={<Menu />} />
              <Route path="/gestao" element={ownerOnly(<Products />)} />
              <Route path="/pedidos" element={ownerOnly(<Orders />)} />
              <Route path="/pedidos/arquivo" element={ownerOnly(<Archive />)} />
              <Route path="/pedidos/estatisticas" element={ownerOnly(<ProductStats />)} />
              <Route path="/clientes" element={ownerOnly(<Customers />)} />
              <Route path="/colaboradores" element={ownerOnly(<Staff />)} />
              <Route path="/produtos" element={ownerOnly(<Products />)} />
              <Route path="/ajustes" element={ownerOnly(<Settings />)} />
              <Route path="/financeiro" element={ownerOnly(<Financial />)} />
              <Route path="/central-chefito" element={ownerOnly(<ChefitoCentral />)} />
            </Routes>
          </motion.div>
          </AnimatePresence>
        </Suspense>
      </main>
      <Cart />
      <InstallPWA />
      <AddressUpdateBanner />
      <Footer />
      {isAuthenticated && isSuperAdmin() && (
        <NewOrderBanner
          unviewedCount={notifications.unviewedCount}
          accentColor={settings?.accent_color || '#f97316'}
        />
      )}
      <Toaster
        position="bottom-right"
        toastOptions={{
          success: {
            iconTheme: {
              primary: settings?.accent_color || '#475569',
              secondary: '#ffffff',
            },
          },
        }}
      />

      <AnimatePresence>
      {showLoginModal && !isAuthenticated && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
          className="fixed inset-0 bg-gray-950/40 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, transform: 'translateY(12px) scale(0.97)' }}
            animate={{ opacity: 1, transform: 'translateY(0) scale(1)' }}
            exit={{ opacity: 0, transform: 'translateY(8px) scale(0.98)' }}
            transition={{ duration: 0.24, ease: [0.23, 1, 0.32, 1] }}
            className="bg-gray-50/85 backdrop-blur-2xl p-8 rounded-3xl shadow-[var(--shadow-overlay)] border border-gray-50/70 max-w-md w-full">

            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-800 font-title">Login Administrativo</h2>
              <button
                onClick={() => setShowLoginModal(false)}
                className="w-10 h-10 flex items-center justify-center hover:bg-gray-100 rounded-lg text-gray-600"
              >
                <i className="fas fa-xmark"></i>
              </button>
            </div>
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 h-11 rounded-lg border border-gray-200"
                  placeholder="admin@exemplo.com"
                  required
                />
              </div>
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                  Senha
                </label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 h-11 rounded-lg border border-gray-200"
                  placeholder="••••••••"
                  required
                />
              </div>
              <button
                type="submit"
                style={{ borderRadius: 9999 }}
                className="btn btn-primary w-full !rounded-full"
              >
                Entrar
              </button>
            </form>
          </motion.div>
        </motion.div>
      )}
      </AnimatePresence>
    </div>
  );
}

function App() {
  const { loadSettings, settings } = useThemeStore();
  const businessSlug = getBusinessSlug(window.location.pathname);
  const [business, setBusiness] = useState<BusinessIdentity | null>(() => cachedBusiness(businessSlug));
  // Cached identity is useful for the request, but the page must stay hidden
  // until the current business settings and theme have been applied.
  const [isLoading, setIsLoading] = useState(() => !!businessSlug);
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const loadApp = async () => {
      try {
        if (!businessSlug) return;
        const data = await fetchBusiness(businessSlug);
        if (cancelled) return;
        if (!data) {
          setBusiness(null);
          sessionStorage.removeItem(`chefito-business:${businessSlug}`);
          return;
        }
        const previousSlug = localStorage.getItem('chefito-active-business');
        if (previousSlug !== businessSlug) {
          useCartStore.getState().clearCart();
          useThemeStore.setState({ settings: null });
          localStorage.setItem('chefito-active-business', businessSlug);
        }
        setCurrentBusinessId(data.id);
        setCurrentOwnerId(data.owner_user_id);
        setBusiness(data);
        sessionStorage.setItem(`chefito-business:${businessSlug}`, JSON.stringify({ ...data, savedAt: Date.now() }));
        await loadSettings();
      } catch (error) {
        console.error('Erro ao carregar o negócio:', error);
        if (!cancelled) setLoadError(true);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    void loadApp();
    return () => { cancelled = true; };
  }, [loadSettings, businessSlug]);

  useEffect(() => {
    if (!businessSlug) {
      document.title = 'Chefito — seu negócio em um só lugar';
      return;
    }
    if (settings) {
      document.title = settings.name || 'Chefito';

      const themeColorMeta = document.querySelector('meta[name="theme-color"]');
      if (themeColorMeta) {
        themeColorMeta.setAttribute('content', settings.accent_color);
      } else {
        const meta = document.createElement('meta');
        meta.name = 'theme-color';
        meta.content = settings.accent_color;
        document.head.appendChild(meta);
      }

      const statusBarMeta = document.querySelector('meta[name="apple-mobile-web-app-status-bar-style"]');
      if (statusBarMeta) {
        statusBarMeta.setAttribute('content', 'black-translucent');
      }
    }
  }, [settings, businessSlug]);

  useEffect(() => {
    const country: Country = 'BR';
    startDomTranslator(country);
    return () => stopDomTranslator();
  }, []);

  if (!businessSlug) {
    if (window.location.pathname === '/redefinir-senha') return <ResetPassword />;
    if (window.location.pathname === '/admin' || window.location.pathname.startsWith('/admin/')) {
      return <Suspense fallback={<div className="min-h-screen bg-gray-50" />}><PlatformAdmin /></Suspense>;
    }
    return window.location.pathname === '/criar-negocio' ? <CreateBusiness /> : <PlatformHome />;
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 px-4 py-3" role="status" aria-label="Carregando negócio">
        <div className="mx-auto max-w-screen-2xl rounded-2xl bg-white/90 p-4 shadow-card">
          <div className="image-skeleton h-7 w-36 rounded-lg" />
        </div>
        <div className="mx-auto mt-14 max-w-6xl">
          <div className="image-skeleton mx-auto h-14 w-full max-w-xl rounded-2xl" />
          <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[0, 1, 2].map((item) => <div key={item} className="overflow-hidden rounded-2xl bg-white shadow-card">
              <div className="image-skeleton aspect-[2/1]" />
              <div className="space-y-3 p-5">
                <div className="image-skeleton h-6 w-3/4 rounded-md" />
                <div className="image-skeleton h-4 w-full rounded-md" />
                <div className="image-skeleton h-4 w-2/3 rounded-md" />
              </div>
            </div>)}
          </div>
        </div>
      </div>
    );
  }

  if (loadError) {
    return <div className="platform-page grid min-h-screen place-items-center p-8 text-center"><div><h1 className="text-2xl font-bold">Não foi possível carregar o negócio</h1><p className="mt-3">Verifique sua conexão e tente novamente.</p><button className="btn btn-primary mt-6" onClick={() => window.location.reload()}>Tentar novamente</button></div></div>;
  }

  if (!business) {
    return <div className="platform-page grid min-h-screen place-items-center p-8 text-center"><div><h1 className="text-4xl font-bold">Negócio não encontrado</h1><p className="mt-4">Confira o endereço ou crie seu negócio no Chefito.</p><a className="platform-link-button" href="/">Ir para o Chefito</a></div></div>;
  }

  return (
    <Router basename={`/${business.slug}`}>
      <ScrollToTop />
      <Suspense fallback={<div className="min-h-screen" />}>
        <Routes>
          <Route path="/pedido/:slug" element={<PublicOrder />} />
          <Route path="/*" element={<AppContent ownerUserId={business.owner_user_id} />} />
        </Routes>
      </Suspense>
      <Analytics />
      <SpeedInsights />
    </Router>
  );
}

export default App;
