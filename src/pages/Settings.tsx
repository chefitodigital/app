import React, { lazy, Suspense, useEffect, useState } from 'react';
import { DEFAULT_ORDER_CONFIRMATION } from '../lib/orderMessages';
import { useThemeStore } from '../store/theme';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { Card } from '../components/ui/Card';
import { PageHeader } from '../components/ui/PageHeader';
import type { Country } from '../lib/i18n';
import type { OperatingSchedule } from '../lib/operatingHours';
import { canAccessAdminArea } from '../lib/accessControl';
import { googleMapsUrl } from '../lib/googleMaps';

const GeneralSection = lazy(async () => ({ default: (await import('../components/settings/GeneralSection')).GeneralSection }));
const DeliverySection = lazy(async () => ({ default: (await import('../components/settings/DeliverySection')).DeliverySection }));
const CouponsSection = lazy(async () => ({ default: (await import('../components/settings/CouponsSection')).CouponsSection }));
const AppearanceSection = lazy(async () => ({ default: (await import('../components/settings/AppearanceSection')).AppearanceSection }));
const ContactSection = lazy(async () => ({ default: (await import('../components/settings/ContactSection')).ContactSection }));
const MessageSection = lazy(async () => ({ default: (await import('../components/settings/MessageSection')).MessageSection }));
const StorySection = lazy(async () => ({ default: (await import('../components/settings/StorySection')).StorySection }));

const DEFAULT_SETTINGS = {
  name: 'Meu Negócio',
  accent_color: '#212529',
  title_font: 'Gowun Dodum',
  body_font: 'Gowun Dodum',
  button_font: 'Gowun Dodum',
  restaurant_icon: 'utensils',
  about_us: '',
  location: '',
  social_links: {
    whatsapp: '',
    maps_url: ''
  },
  currency: 'BRL',
  has_delivery: true,
  has_table_service: true,
  has_takeaway: true,
  custom_tag_name: 'Personalizado',
  favicon_url: null as string | null,
  order_confirmation_message: DEFAULT_ORDER_CONFIRMATION,
  story_image_url: null as string | null,
  story_images: [] as { id: string; url: string; order: number }[],
  story_image_format: 'vertical' as 'vertical' | 'portrait' | 'square',
  story_enabled: false,
  story_auto_open: false,
  product_card_description_lines: 4,
  whatsapp_auto_send: false,
  mbway_phone: '',
  mbway_reference_prefix: '',
  mbway_enabled: false,
  delivery_fee_enabled: false,
  delivery_base_price: 0,
  delivery_price_per_km: 0,
  delivery_minimum_order_value: 0,
  restaurant_lat: null as number | null,
  restaurant_lng: null as number | null,
  operating_schedule: null as OperatingSchedule | null,
  country: 'BR' as Country,
  pix_enabled: false,
  pix_key: '',
  pix_key_type: 'cpf' as 'cpf' | 'cnpj' | 'email' | 'phone' | 'random',
  pix_beneficiary_name: '',
};

export default function Settings() {
  const { settings, updateSettings } = useThemeStore();
  const { isAuthenticated, isSuperAdmin } = useAuth();
  const navigate = useNavigate();
  const [formData, setFormData] = useState(DEFAULT_SETTINGS);
  const [isSaving, setIsSaving] = useState(false);
  const [activeSection, setActiveSection] = useState<string>('general');

  useEffect(() => {
    if (!canAccessAdminArea(isAuthenticated, isSuperAdmin() ? 'super_admin' : 'customer')) {
      navigate('/');
      return;
    }

    if (settings) {
      setFormData({
        name: settings.name || DEFAULT_SETTINGS.name,
        accent_color: settings.accent_color || DEFAULT_SETTINGS.accent_color,
        title_font: settings.title_font || DEFAULT_SETTINGS.title_font,
        body_font: settings.body_font || DEFAULT_SETTINGS.body_font,
        button_font: settings.button_font || DEFAULT_SETTINGS.button_font,
        restaurant_icon: settings.restaurant_icon || DEFAULT_SETTINGS.restaurant_icon,
        about_us: settings.about_us || DEFAULT_SETTINGS.about_us,
        location: settings.location || DEFAULT_SETTINGS.location,
        social_links: { ...settings.social_links, whatsapp: settings.social_links?.whatsapp || '', maps_url: settings.social_links?.maps_url || '' },
        currency: 'BRL',
        has_delivery: settings.has_delivery ?? DEFAULT_SETTINGS.has_delivery,
        has_table_service: settings.has_table_service ?? DEFAULT_SETTINGS.has_table_service,
        has_takeaway: settings.has_takeaway ?? DEFAULT_SETTINGS.has_takeaway,
        custom_tag_name: settings.custom_tag_name || DEFAULT_SETTINGS.custom_tag_name,
        favicon_url: settings.favicon_url || null,
        order_confirmation_message: settings.order_confirmation_message || DEFAULT_SETTINGS.order_confirmation_message,
        story_image_url: settings.story_image_url || null,
        story_images: settings.story_images || [],
        story_image_format: settings.story_image_format || DEFAULT_SETTINGS.story_image_format,
        story_enabled: settings.story_enabled ?? DEFAULT_SETTINGS.story_enabled,
        story_auto_open: settings.story_auto_open ?? DEFAULT_SETTINGS.story_auto_open,
        product_card_description_lines: settings.product_card_description_lines ?? DEFAULT_SETTINGS.product_card_description_lines,
        whatsapp_auto_send: settings.whatsapp_auto_send ?? DEFAULT_SETTINGS.whatsapp_auto_send,
        mbway_phone: settings.mbway_phone || '',
        mbway_reference_prefix: settings.mbway_reference_prefix || '',
        mbway_enabled: settings.mbway_enabled ?? DEFAULT_SETTINGS.mbway_enabled,
        delivery_fee_enabled: settings.delivery_fee_enabled ?? DEFAULT_SETTINGS.delivery_fee_enabled,
        delivery_base_price: settings.delivery_base_price ?? DEFAULT_SETTINGS.delivery_base_price,
        delivery_price_per_km: settings.delivery_price_per_km ?? DEFAULT_SETTINGS.delivery_price_per_km,
        delivery_minimum_order_value: settings.delivery_minimum_order_value ?? DEFAULT_SETTINGS.delivery_minimum_order_value,
        restaurant_lat: settings.restaurant_lat ?? null,
        restaurant_lng: settings.restaurant_lng ?? null,
        operating_schedule: (settings.operating_schedule ?? null) as OperatingSchedule | null,
        country: 'BR',
        pix_enabled: settings.pix_enabled ?? false,
        pix_key: settings.pix_key ?? '',
        pix_key_type: settings.pix_key_type ?? 'cpf',
        pix_beneficiary_name: settings.pix_beneficiary_name ?? '',
      });
    }
  }, [settings, isAuthenticated, navigate, isSuperAdmin]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      toast.error('O nome do negócio é obrigatório');
      return;
    }

    if (!formData.custom_tag_name.trim()) {
      toast.error('O nome da etiqueta personalizada é obrigatório');
      return;
    }

    if (formData.social_links.maps_url.trim() && !googleMapsUrl(formData.social_links.maps_url)) {
      toast.error('Informe um link válido do Google Maps começando com https://.');
      return;
    }

    if (!formData.has_delivery && !formData.has_table_service && !formData.has_takeaway) {
      toast.error('Pelo menos uma opção de entrega deve estar ativa');
      return;
    }

    if (formData.story_auto_open && !formData.story_enabled) {
      toast.error('Para ativar abertura automática, o story deve estar ativo');
      return;
    }

    if (formData.story_auto_open && formData.story_images.length === 0) {
      toast.error('Para ativar abertura automática, é necessário ter pelo menos uma imagem de story');
      return;
    }

    try {
      setIsSaving(true);
      await updateSettings({ ...formData, country: 'BR' as const, currency: 'BRL', mbway_enabled: false });
      toast.success('Configurações salvas com sucesso!');
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error('Erro ao salvar configurações');
    } finally {
      setIsSaving(false);
    }
  };

  const handleFormChange = (data: Partial<typeof formData>) => {
    setFormData({ ...formData, ...data });
  };

  const sections = [
    { id: 'general', label: 'Geral', icon: 'store' },
    { id: 'delivery', label: 'Entrega', icon: 'truck-fast' },
    { id: 'coupons', label: 'Cupons', icon: 'ticket-simple' },
    { id: 'story', label: 'Story', icon: 'megaphone' },
    { id: 'appearance', label: 'Aparência', icon: 'paint-roller' },
    { id: 'contact', label: 'Contato', icon: 'id-card-clip' },
    { id: 'messages', label: 'Mensagens', icon: 'message' },
  ];

  return (
    <div className="max-w-5xl mx-auto pb-8">
      <PageHeader
        title="Configurações"
        description="Personalização do negócio e opções de entrega"
        icon="gear"
      />

      <div className="flex flex-col lg:flex-row gap-6">
        <nav className="lg:w-56 flex-shrink-0">
          <div className="lg:sticky lg:top-24 bg-gray-50 rounded-2xl shadow-card p-2 space-y-1">
            {sections.map((section) => (
              <button
                key={section.id}
                onClick={() => setActiveSection(section.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-all ${
                  activeSection === section.id
                    ? 'bg-accent text-gray-50'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <i className={`fas fa-${section.icon} w-5`}></i>
                <span className="font-medium">{section.label}</span>
              </button>
            ))}
          </div>
        </nav>

        <form onSubmit={handleSubmit} className="flex-1 space-y-6">
          <Suspense fallback={<div className="min-h-48" aria-label="Carregando seção" />}>
            {activeSection === 'general' && (
              <GeneralSection formData={formData} onChange={handleFormChange} />
            )}

            {activeSection === 'delivery' && (
              <DeliverySection formData={formData} onChange={handleFormChange} />
            )}

            {activeSection === 'coupons' && (
              <CouponsSection />
            )}

            {activeSection === 'appearance' && (
              <AppearanceSection formData={formData} onChange={handleFormChange} />
            )}

            {activeSection === 'contact' && (
              <ContactSection formData={formData} onChange={handleFormChange} />
            )}

            {activeSection === 'messages' && (
              <MessageSection formData={formData} onChange={handleFormChange} />
            )}

            {activeSection === 'story' && (
              <StorySection formData={formData} onChange={(field, value) => {
                setFormData({ ...formData, [field]: value });
              }} />
            )}

          </Suspense>

          <Card padding="sm">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <p className="text-sm text-gray-500">
                As alterações serão aplicadas imediatamente após salvar.
              </p>
                <button
                  type="submit"
                  disabled={isSaving}
                  className={`btn btn-primary flex items-center gap-2 ${
                    isSaving ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                >
                  <i className={`fas ${isSaving ? 'fa-spinner fa-spin' : 'fa-save'}`}></i>
                  <span>{isSaving ? 'Salvando...' : 'Salvar configurações'}</span>
                </button>
            </div>
          </Card>
        </form>
      </div>
    </div>
  );
}
