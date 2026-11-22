import React, { useEffect, useState, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useThemeStore } from '../store/theme';
import { useAuth } from '../hooks/useAuth';
import toast from 'react-hot-toast';
import ImageUpload from './ImageUpload';
import NotificationBell from './NotificationBell';
import { Modal } from './ui/Modal';
import type { OrderNotificationsResult } from '../hooks/useOrderNotifications';
import { motion } from 'motion/react';
import { useChefitoUnread } from '../hooks/useChefitoUnread';

function ChefitoIcon({ unread }: { unread: boolean }) {
  return <span className={`relative inline-flex h-5 w-5 shrink-0 items-center justify-center ${unread ? 'text-accent' : ''}`} aria-hidden="true">
    <motion.i className="fas fa-trophy-star" style={{ originX: 0.5, originY: 0.5 }} animate={unread ? { rotate: [0, -25, 25, -25, 25, -25, 25, -25, 25, -15, 0] } : { rotate: 0 }} transition={unread ? { duration: 0.8, ease: 'easeInOut', repeat: Infinity, repeatDelay: 2.2 } : { duration: 0.2 }} />
  </span>;
}

interface HeaderProps {
  onLoginClick: () => void;
  notifications: OrderNotificationsResult;
}

export default function Header({ onLoginClick, notifications }: HeaderProps) {
  const { settings, updateSettings } = useThemeStore();
  const { authInitialized, isAuthenticated, logout, isSuperAdmin } = useAuth();
  const canEditBusiness = authInitialized && isAuthenticated && isSuperAdmin();
  const location = useLocation();
  const unreadChefito = useChefitoUnread(canEditBusiness, location.pathname);
  const [showAboutModal, setShowAboutModal] = useState(false);
  const [editingAbout, setEditingAbout] = useState(false);
  const [tempAbout, setTempAbout] = useState(settings?.about_us || '');
  const [tempLogoUrl, setTempLogoUrl] = useState(settings?.logo_url || '');
  const [tempAboutImageUrl, setTempAboutImageUrl] = useState(settings?.about_us_image_url || '');
  const [socialLinks, setSocialLinks] = useState(settings?.social_links || {});
  const [customButton, setCustomButton] = useState({
    text: settings?.custom_button_text || '',
    url: settings?.custom_button_url || ''
  });
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isAdminDropdownOpen, setIsAdminDropdownOpen] = useState(false);
  const [isHidden, setIsHidden] = useState(false);
  const adminDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onScroll = () => setIsHidden(window.scrollY > 40);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const adminPaths = ['/pedidos', '/pedidos/arquivo', '/clientes', '/colaboradores', '/produtos', '/ajustes', '/financeiro', '/central-chefito'];
  const isAdminPageActive = adminPaths.some(path => location.pathname === path || location.pathname.startsWith(path + '/'));

  useEffect(() => {
    if (settings) {
      setTempAbout(settings.about_us || '');
      setTempLogoUrl(settings.logo_url || '');
      setTempAboutImageUrl(settings.about_us_image_url || '');
      setSocialLinks(settings.social_links || {});
      setCustomButton({
        text: settings.custom_button_text || '',
        url: settings.custom_button_url || ''
      });
    }
  }, [settings]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (adminDropdownRef.current && !adminDropdownRef.current.contains(event.target as Node)) {
        setIsAdminDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    setIsAdminDropdownOpen(false);
  }, [location.pathname]);

  const closeAboutModal = () => {
    setShowAboutModal(false);
    setEditingAbout(false);
    setTempAbout(settings?.about_us || '');
    setTempLogoUrl(settings?.logo_url || '');
    setTempAboutImageUrl(settings?.about_us_image_url || '');
    setCustomButton({
      text: settings?.custom_button_text || '',
      url: settings?.custom_button_url || ''
    });
  };

  const handleSaveAbout = async () => {
    try {
      if (!settings || !canEditBusiness) return;

      await updateSettings({
        ...settings,
        about_us: tempAbout,
        logo_url: tempLogoUrl,
        about_us_image_url: tempAboutImageUrl || null,
        social_links: socialLinks,
        custom_button_text: customButton.text,
        custom_button_url: customButton.url
      });

      setEditingAbout(false);
      toast.success('Sobre atualizado com sucesso!');
    } catch (error) {
      console.error('Error updating about:', error);
      toast.error('Erro ao atualizar sobre');
    }
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  const validateCustomButton = () => {
    if (customButton.text && customButton.text.length > 30) {
      toast.error('O texto do botão deve ter no máximo 30 caracteres');
      return false;
    }
    
    if (customButton.url && !customButton.url.match(/^https?:\/\/.+/)) {
      toast.error('A URL deve começar com http:// ou https://');
      return false;
    }
    
    return true;
  };

  return (
    <>
      <motion.header
        initial={false}
        animate={{ y: isHidden ? -80 : 0 }}
        transition={{ duration: 0.42, ease: [0.4, 0, 0.2, 1] }}
        aria-hidden={isHidden}
        className={`sticky top-3 z-50 mx-3 sm:mx-4 mt-3 bg-transparent ${isHidden ? 'pointer-events-none' : ''}`}>
        <div className="w-full max-w-screen-2xl mx-auto px-4">

          <div className="flex items-center justify-between h-14">
            <Link to="/" className="flex items-center space-x-3 min-w-0 flex-1">
              {settings?.logo_url ? (
                <img
                  src={settings.logo_url}
                  alt={`${settings.name} logo`}
                  className="w-8 h-8 object-cover rounded-full flex-shrink-0"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                    const icon = target.nextElementSibling as HTMLElement;
                    if (icon) icon.style.display = 'inline';
                  }}
                />
              ) : null}
              <i 
                className={`fas fa-${({ burger: 'burger-cheese', fish: 'fish-cooked', 'beer-mug-empty': 'beer-mug', stroopwafel: 'shish-kebab', 'bowl-food': 'bowl-chopsticks-noodles', 'bread-slice': 'baguette' } as Record<string, string>)[settings?.restaurant_icon || ''] || settings?.restaurant_icon || 'utensils'} text-2xl text-accent flex-shrink-0 ${settings?.logo_url ? 'hidden' : ''}`}
                style={{ display: settings?.logo_url ? 'none' : 'inline' }}
              ></i>
              <span className="text-xl font-bold text-gray-800 font-title whitespace-nowrap truncate min-w-0">
                {settings?.name || 'Meu negócio'}
              </span>
            </Link>

            <nav className="hidden lg:flex items-center space-x-1 flex-shrink-0">
              {canEditBusiness && (
                <NotificationBell
                  accentColor={settings?.accent_color || '#f97316'}
                  isAdmin={true}
                  notifications={notifications}
                />
              )}

              <Link
                to="/"
                className={`px-4 py-2 rounded-lg font-button transition-colors ${
                  location.pathname === '/'
                    ? 'text-accent font-medium'
                    : 'text-gray-600 hover:text-accent'
                }`}
              >
                Cardápio
              </Link>

              <button
                onClick={() => setShowAboutModal(true)}
                className="px-4 py-2 rounded-lg font-button transition-colors text-gray-600 hover:text-accent"
              >
                Sobre
              </button>

              {canEditBusiness && (
                <>
                  <div className="relative" ref={adminDropdownRef}>
                    <button
                      onClick={() => setIsAdminDropdownOpen(!isAdminDropdownOpen)}
                      className={`px-4 py-2 rounded-lg font-button transition-colors flex items-center gap-2 ${
                        isAdminPageActive
                          ? 'text-accent font-medium'
                          : 'text-gray-600 hover:text-accent'
                      }`}
                    >
                      <i className="fas fa-sliders"></i>
                      Gestão
                      <i className={`fas fa-chevron-down text-xs transition-transform ${isAdminDropdownOpen ? 'rotate-180' : ''}`}></i>
                    </button>
                    {isAdminDropdownOpen && (
                      <div className="absolute top-full left-0 mt-1 bg-gray-50 rounded-lg shadow-lg border border-gray-200 py-2 min-w-48 z-50">
                        <Link
                          to="/pedidos"
                          className={`flex items-center gap-3 px-4 py-2 transition-colors ${
                            location.pathname === '/pedidos' || location.pathname === '/pedidos/arquivo'
                              ? 'text-accent font-medium bg-accent/5'
                              : 'text-gray-600 hover:text-accent hover:bg-gray-50'
                          }`}
                        >
                          <i className="fas fa-bell-concierge w-5 text-center"></i>
                          Pedidos
                        </Link>
                        <Link
                          to="/clientes"
                          className={`flex items-center gap-3 px-4 py-2 transition-colors ${
                            location.pathname === '/clientes'
                              ? 'text-accent font-medium bg-accent/5'
                              : 'text-gray-600 hover:text-accent hover:bg-gray-50'
                          }`}
                        >
                          <i className="fas fa-users w-5 text-center"></i>
                          Clientes
                        </Link>
                        <Link
                          to="/colaboradores"
                          className={`flex items-center gap-3 px-4 py-2 transition-colors ${
                            location.pathname === '/colaboradores'
                              ? 'text-accent font-medium bg-accent/5'
                              : 'text-gray-600 hover:text-accent hover:bg-gray-50'
                          }`}
                        >
                          <i className="fas fa-hat-chef w-5 text-center"></i>
                          Equipe
                        </Link>
                        <Link
                          to="/produtos"
                          className={`flex items-center gap-3 px-4 py-2 transition-colors ${
                            location.pathname === '/produtos'
                              ? 'text-accent font-medium bg-accent/5'
                              : 'text-gray-600 hover:text-accent hover:bg-gray-50'
                          }`}
                        >
                          <i className="fas fa-utensils w-5 text-center"></i>
                          Produtos
                        </Link>
                        <Link
                          to="/ajustes"
                          className={`flex items-center gap-3 px-4 py-2 transition-colors ${
                            location.pathname === '/ajustes'
                              ? 'text-accent font-medium bg-accent/5'
                              : 'text-gray-600 hover:text-accent hover:bg-gray-50'
                          }`}
                        >
                          <i className="fas fa-gear w-5 text-center"></i>
                          Configurações
                        </Link>
                        <Link
                          to="/financeiro"
                          className={`flex items-center gap-3 px-4 py-2 transition-colors ${
                            location.pathname === '/financeiro'
                              ? 'text-accent font-medium bg-accent/5'
                              : 'text-gray-600 hover:text-accent hover:bg-gray-50'
                          }`}
                        >
                          <i className="fas fa-box-dollar w-5 text-center"></i>
                          Financeiro
                        </Link>
                        <Link to="/central-chefito" className={`flex items-center gap-3 px-4 py-2 transition-colors ${location.pathname === '/central-chefito' ? 'text-accent font-medium bg-accent/5' : 'text-gray-600 hover:text-accent hover:bg-gray-50'}`}>
                          <ChefitoIcon unread={unreadChefito > 0} /> Central Chefito
                          {unreadChefito > 0 && <span className="sr-only">, há novidades não visualizadas</span>}
                        </Link>
                      </div>
                    )}
                  </div>
                  <button
                    onClick={logout}
                    className="w-10 h-10 flex items-center justify-center rounded-lg text-accent bg-accent/20 hover:bg-accent/40 transition-colors font-button"
                    title="Sair"
                  >
                    <i className="fas fa-door-open"></i>
                  </button>
                </>
              )}

              {!isAuthenticated && (
                <button
                  onClick={onLoginClick}
                  className="px-4 py-2 rounded-lg font-button transition-colors text-gray-600 hover:text-accent flex items-center gap-2"
                >
                  <i className="fas fa-circle-user"></i>
                  Área do gestor
                </button>
              )}
            </nav>

            {/* Mobile Bell + Menu Button */}
            <div className="lg:hidden flex items-center gap-1 flex-shrink-0">
              {canEditBusiness && (
                <NotificationBell
                  accentColor={settings?.accent_color || '#f97316'}
                  isAdmin={true}
                  notifications={notifications}
                />
              )}
              <button
                onClick={toggleMobileMenu}
                className="w-10 h-10 flex items-center justify-center rounded-lg text-gray-600 hover:bg-gray-100 transition-colors"
                aria-label="Menu"
              >
                {isMobileMenuOpen ? (
                  <i className="fas fa-xmark text-xl"></i>
                ) : (
                  <i className="fas fa-bars text-xl"></i>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <nav className="lg:hidden border-t border-gray-200 bg-gray-50/95 backdrop-blur-sm rounded-b-2xl overflow-hidden">
            <div className="w-full max-w-screen-2xl mx-auto px-4 py-2 space-y-1">
              <Link
                to="/"
                className={`block px-4 py-2 rounded-lg font-button transition-colors ${
                  location.pathname === '/'
                    ? 'text-accent font-medium'
                    : 'text-gray-600'
                }`}
                onClick={closeMobileMenu}
              >
                Cardápio
              </Link>

              <button
                onClick={() => {
                  setShowAboutModal(true);
                  closeMobileMenu();
                }}
                className="block w-full text-left px-4 py-2 rounded-lg font-button transition-colors text-gray-600 hover:bg-gray-50"
              >
                Sobre
              </button>

              {canEditBusiness && (
                <>
                  <Link
                    to="/pedidos"
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg font-button transition-colors ${
                      location.pathname === '/pedidos' || location.pathname === '/pedidos/arquivo'
                        ? 'text-accent font-medium'
                        : 'text-gray-600'
                    }`}
                    onClick={closeMobileMenu}
                  >
                    <i className="fas fa-bell-concierge"></i>
                    Pedidos
                  </Link>
                  <Link
                    to="/clientes"
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg font-button transition-colors ${
                      location.pathname === '/clientes'
                        ? 'text-accent font-medium'
                        : 'text-gray-600'
                    }`}
                    onClick={closeMobileMenu}
                  >
                    <i className="fas fa-users"></i>
                    Clientes
                  </Link>
                  <Link
                    to="/colaboradores"
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg font-button transition-colors ${
                      location.pathname === '/colaboradores'
                        ? 'text-accent font-medium'
                        : 'text-gray-600'
                    }`}
                    onClick={closeMobileMenu}
                  >
                    <i className="fas fa-hat-chef"></i>
                    Equipe
                  </Link>
                  <Link
                    to="/produtos"
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg font-button transition-colors ${
                      location.pathname === '/produtos'
                        ? 'text-accent font-medium'
                        : 'text-gray-600'
                    }`}
                    onClick={closeMobileMenu}
                  >
                    <i className="fas fa-utensils"></i>
                    Produtos
                  </Link>
                  <Link
                    to="/ajustes"
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg font-button transition-colors ${
                      location.pathname === '/ajustes'
                        ? 'text-accent font-medium'
                        : 'text-gray-600'
                    }`}
                    onClick={closeMobileMenu}
                  >
                    <i className="fas fa-gear"></i>
                    Configurações
                  </Link>
                  <Link
                    to="/financeiro"
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg font-button transition-colors ${
                      location.pathname === '/financeiro'
                        ? 'text-accent font-medium'
                        : 'text-gray-600'
                    }`}
                    onClick={closeMobileMenu}
                  >
                    <i className="fas fa-box-dollar"></i>
                    Financeiro
                  </Link>
                  <Link to="/central-chefito" onClick={closeMobileMenu} className={`flex items-center gap-2 px-4 py-2 rounded-lg font-button ${location.pathname === '/central-chefito' ? 'text-accent font-medium' : 'text-gray-600'}`}>
                    <ChefitoIcon unread={unreadChefito > 0} /> Central Chefito
                    {unreadChefito > 0 && <span className="sr-only">, há novidades não visualizadas</span>}
                  </Link>
                  <button
                    onClick={() => {
                      logout();
                      closeMobileMenu();
                    }}
                    className="flex items-center w-full px-4 py-2 rounded-lg text-accent hover:bg-accent/10 transition-colors font-button"
                  >
                    <i className="fas fa-door-open mr-2"></i>
                    <span>Sair</span>
                  </button>
                </>
              )}

              {!isAuthenticated && (
                <button
                  onClick={() => {
                    onLoginClick();
                    closeMobileMenu();
                  }}
                  className="flex items-center w-full px-4 py-2 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors font-button"
                >
                  <i className="fas fa-circle-user mr-2"></i>
                  <span>Área do gestor</span>
                </button>
              )}
            </div>
          </nav>
        )}
      </motion.header>

      {/* About Modal */}
      <Modal isOpen={showAboutModal} onClose={closeAboutModal} title="Quem somos" size="md">
        <>
          {canEditBusiness && !editingAbout && (
            <div className="flex justify-end -mt-2 mb-2">
              <button
                onClick={() => setEditingAbout(true)}
                className="w-10 h-10 flex items-center justify-center hover:bg-gray-100 rounded-lg text-accent"
                aria-label="Editar"
              >
                <i className="fas fa-pen"></i>
              </button>
            </div>
          )}
          {canEditBusiness && editingAbout ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Logo do Restaurante
                  </label>
                  <ImageUpload
                    onImageUpload={(url) => setTempLogoUrl(url)}
                    currentImageUrl={tempLogoUrl}
                  />
                </div>
                <textarea
                  value={tempAbout}
                  onChange={(e) => setTempAbout(e.target.value)}
                  className="w-full px-4 py-2 rounded-lg border border-gray-200 hover:border-gray-300 focus:border-gray-400 focus:outline-none transition-colors"
                  rows={6}
                  placeholder="Conte-nos um pouco sobre o seu restaurante..."
                />
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Imagem Sobre Nós
                  </label>
                  <ImageUpload
                    onImageUpload={(url) => setTempAboutImageUrl(url)}
                    currentImageUrl={tempAboutImageUrl}
                  />
                  <p className="mt-2 text-sm text-gray-500">
                    Esta imagem aparece abaixo do texto descritivo no modal "Quem somos".
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    WhatsApp
                  </label>
                  <input
                    type="text"
                    value={socialLinks.whatsapp || ''}
                    onChange={(e) => setSocialLinks({ ...socialLinks, whatsapp: e.target.value })}
                    className="w-full px-4 py-2 rounded-lg border border-gray-200 hover:border-gray-300 focus:border-gray-400 focus:outline-none transition-colors"
                    placeholder="123-456-789"
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Botão Personalizado
                  </label>
                  <input
                    type="text"
                    value={customButton.text}
                    onChange={(e) => setCustomButton({ ...customButton, text: e.target.value })}
                    className="w-full px-4 py-2 rounded-lg border border-gray-200 hover:border-gray-300 focus:border-gray-400 focus:outline-none transition-colors"
                    placeholder="Texto do botão (máx. 30 caracteres)"
                    maxLength={30}
                  />
                  <input
                    type="url"
                    value={customButton.url}
                    onChange={(e) => setCustomButton({ ...customButton, url: e.target.value })}
                    className="w-full px-4 py-2 rounded-lg border border-gray-200 hover:border-gray-300 focus:border-gray-400 focus:outline-none transition-colors"
                    placeholder="https://exemplo.com"
                    pattern="https?://.+"
                  />
                </div>
                <button
                  onClick={() => {
                    if (validateCustomButton()) {
                      handleSaveAbout();
                    }
                  }}
                  className="w-full flex items-center justify-center space-x-2 bg-accent text-gray-50 px-4 py-2 rounded-lg hover:bg-accent/90 transition-colors"
                >
                  <i className="fas fa-save"></i>
                  <span>Salvar</span>
                </button>
              </div>
            ) : (
              <div className="prose prose-gray">
                {settings?.logo_url && (
                  <div className="mb-6 text-center">
                    <img
                      src={settings.logo_url}
                      alt={`${settings.name} logo`}
                      className="max-w-32 max-h-32 mx-auto object-contain rounded-lg shadow-md"
                      style={{ padding: '8px' }}
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                      }}
                    />
                  </div>
                )}
                <p className="text-gray-600 mb-6 font-body whitespace-pre-line">
                  {settings?.about_us || 'Informações sobre o restaurante não disponíveis.'}
                </p>
                {settings?.about_us_image_url && (
                  <div className="mb-6">
                    <img
                      src={settings.about_us_image_url}
                      alt="Sobre o restaurante"
                      loading="lazy"
                      className="w-full rounded-lg shadow-md object-cover max-h-64"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                      }}
                    />
                  </div>
                )}
                <div className="flex flex-col gap-2">
                  {settings?.social_links?.whatsapp && (
                    <a
                      href={`https://wa.me/${settings.social_links.whatsapp.replace(/\D/g, '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-primary w-full text-sm sm:text-base px-4 sm:px-6"
                    >
                      <i className="fas fa-headset"></i>
                      <span>Suporte ao cliente</span>
                    </a>
                  )}
                  {settings?.custom_button_text && settings?.custom_button_url && (
                    <a
                      href={settings.custom_button_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-secondary w-full text-sm sm:text-base px-4 sm:px-6"
                    >
                      <span>{settings.custom_button_text}</span>
                    </a>
                  )}
                </div>
              </div>
          )}
        </>
      </Modal>

    </>
  );
}
