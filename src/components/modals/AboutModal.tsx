import { useState, useEffect } from 'react';
import { useBodyScrollLock } from '../../hooks/useBodyScrollLock';
import { useThemeStore } from '../../store/theme';
import { useAuth } from '../../hooks/useAuth';
import toast from 'react-hot-toast';
import ImageUpload from '../ImageUpload';
import { validateCustomButton } from '../../lib/validation';

interface AboutModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AboutModal({ isOpen, onClose }: AboutModalProps) {
  const { settings, updateSettings } = useThemeStore();
  const { authInitialized, isAuthenticated, isSuperAdmin } = useAuth();
  const canEditBusiness = authInitialized && isAuthenticated && isSuperAdmin();
  const [editingAbout, setEditingAbout] = useState(false);
  const [tempAbout, setTempAbout] = useState(settings?.about_us || '');
  const [tempLogoUrl, setTempLogoUrl] = useState(settings?.logo_url || '');
  const [tempAboutImageUrl, setTempAboutImageUrl] = useState(settings?.about_us_image_url || '');
  const [socialLinks, setSocialLinks] = useState(settings?.social_links || {});
  const [customButton, setCustomButton] = useState({
    text: settings?.custom_button_text || '',
    url: settings?.custom_button_url || ''
  });

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

  useBodyScrollLock(isOpen);

  const handleSaveAbout = async () => {
    try {
      if (!settings || !canEditBusiness) return;

      const validation = validateCustomButton(customButton.text, customButton.url);
      if (!validation.isValid) {
        toast.error(validation.error!);
        return;
      }

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

  const handleClose = () => {
    setEditingAbout(false);
    setTempAbout(settings?.about_us || '');
    setTempLogoUrl(settings?.logo_url || '');
    setTempAboutImageUrl(settings?.about_us_image_url || '');
    setCustomButton({
      text: settings?.custom_button_text || '',
      url: settings?.custom_button_url || ''
    });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-950/50 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 p-0 sm:p-4 pointer-events-none">
      <div className="bg-gray-50 rounded-t-2xl sm:rounded-2xl p-4 sm:p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto pointer-events-auto">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-semibold text-gray-800 font-title">Quem somos</h3>
          <div className="flex items-center space-x-2">
            {canEditBusiness && !editingAbout && (
              <button
                onClick={() => setEditingAbout(true)}
                className="w-10 h-10 flex items-center justify-center hover:bg-gray-100 rounded-lg text-accent"
              >
                <i className="fas fa-pen"></i>
              </button>
            )}
            <button
              onClick={handleClose}
              className="w-10 h-10 flex items-center justify-center hover:bg-gray-100 rounded-lg text-gray-600"
            >
              <i className="fas fa-xmark"></i>
            </button>
          </div>
        </div>
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
              onClick={handleSaveAbout}
              className="w-full py-3 bg-accent text-gray-50 rounded-lg hover:bg-opacity-90 transition-colors font-button"
            >
              <i className="fas fa-save mr-2"></i>
              Salvar
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {settings?.logo_url && (
              <img
                src={settings.logo_url}
                alt="Restaurant Logo"
                className="w-32 h-32 object-contain mx-auto rounded-lg"
              />
            )}
            {tempAbout ? (
              <p className="text-gray-600 whitespace-pre-line font-body">
                {tempAbout}
              </p>
            ) : (
              <p className="text-gray-400 italic text-center py-8">
                Nenhuma descrição disponível
              </p>
            )}
            {settings?.about_us_image_url && (
              <img
                src={settings.about_us_image_url}
                alt="About"
                className="w-full rounded-lg"
              />
            )}
            {settings?.social_links?.whatsapp && (
              <a
                href={`https://wa.me/${settings.social_links.whatsapp.replace(/\D/g, '')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-primary w-full text-sm sm:text-base flex items-center justify-center"
              >
                <i className="fab fa-whatsapp mr-2"></i>
                <span>Falar pelo WhatsApp</span>
              </a>
            )}
            {settings?.custom_button_text && settings?.custom_button_url && (
              <a
                href={settings.custom_button_url}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-secondary w-full text-sm sm:text-base flex items-center justify-center"
              >
                <span>{settings.custom_button_text}</span>
              </a>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
