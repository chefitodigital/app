import React, { useState } from 'react';
import { useThemeStore } from '../store/theme';
import { useAuth } from '../hooks/useAuth';
import toast from 'react-hot-toast';
import { googleMapsUrl } from '../lib/googleMaps';

export default function Footer() {
  const { settings, updateSettings } = useThemeStore();
  const { authInitialized, isAuthenticated, isSuperAdmin } = useAuth();
  const canEditBusiness = authInitialized && isAuthenticated && isSuperAdmin();
  const [isEditing, setIsEditing] = useState(false);
  const [tempSettings, setTempSettings] = useState({
    about_us: settings?.about_us || '',
    hours: settings?.operating_hours || {
      weekdaysLabel: 'Segunda a Sexta-feira',
      weekendsLabel: 'Sábado e Domingo',
      weekdays: '11h às 23h',
      weekends: '11h às 00h'
    },
    contact: {
      phone: settings?.social_links?.phone || '(+351) 123-456-789',
      email: settings?.social_links?.email || 'info@chefi.to',
      social: settings?.social_links?.social || 'instagram.com/chefi.to',
      address: settings?.location || 'Av. Sabor, 123 - Cidade'
    }
  });

  const handleSave = async () => {
    try {
      if (!canEditBusiness) return;
      await updateSettings({
        ...settings,
        about_us: tempSettings.about_us,
        location: tempSettings.contact.address,
        operating_hours: tempSettings.hours,
        social_links: {
          ...settings?.social_links,
          phone: tempSettings.contact.phone,
          email: tempSettings.contact.email,
          social: tempSettings.contact.social
        }
      });
      setIsEditing(false);
      toast.success('Informações atualizadas com sucesso!');
    } catch (error) {
      console.error('Error saving footer information:', error);
      toast.error('Erro ao salvar informações');
    }
  };

  const formatSocialLink = (url: string) => {
    if (!url) return '';
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      return `https://${url}`;
    }
    return url;
  };

  const addSecondBlock = () => {
    setTempSettings({
      ...tempSettings,
      hours: {
        ...tempSettings.hours,
        weekendsLabel: 'Sábado e Domingo',
        weekends: '11h às 00h'
      }
    });
  };

  const removeSecondBlock = () => {
    setTempSettings({
      ...tempSettings,
      hours: {
        weekdaysLabel: tempSettings.hours.weekdaysLabel,
        weekdays: tempSettings.hours.weekdays,
        weekendsLabel: '',
        weekends: ''
      }
    });
  };

  const hasSecondBlock = tempSettings.hours.weekendsLabel && tempSettings.hours.weekends;

  return (
    <footer className="mt-20">
      <div className="bg-gray-50/70 backdrop-blur-lg border-t border-gray-100">
        <div className="container mx-auto px-4 py-12">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* About Section */}
            <div>
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-gray-800 font-title flex items-center">
                  <i 
                    className="fas fa-store mr-3 text-accent cursor-pointer hover:scale-110 transition-transform"
                    onClick={() => window.dispatchEvent(new CustomEvent('open-login'))}
                  ></i>
                  {settings?.name || 'Meu negócio'}
                </h3>
                {canEditBusiness && (
                  <button
                    type="button"
                    aria-label={isEditing ? 'Salvar informações do rodapé' : 'Editar informações do rodapé'}
                    onClick={() => {
                      if (isEditing) {
                        handleSave();
                      } else {
                        setTempSettings({
                          about_us: settings?.about_us || '',
                          hours: settings?.operating_hours || {
                            weekdaysLabel: 'Segunda a Sexta-feira',
                            weekendsLabel: 'Sábado e Domingo',
                            weekdays: '11h às 23h',
                            weekends: '11h às 00h'
                          },
                          contact: {
                            phone: settings?.social_links?.phone || '(+351) 123-456-789',
                            email: settings?.social_links?.email || 'info@chefi.to',
                            social: settings?.social_links?.social || 'instagram.com/chefi.to',
                            address: settings?.location || 'Av. Exemplo, 123 - Lisboa'
                          }
                        });
                        setIsEditing(true);
                      }
                    }}
                    className="w-10 h-10 flex items-center justify-center hover:bg-gray-100 rounded-lg text-accent"
                  >
                    <i className={`fas ${isEditing ? 'fa-save' : 'fa-pen'}`}></i>
                  </button>
                )}
              </div>
              <div className="prose prose-gray">
                {canEditBusiness && isEditing ? (
                  <textarea
                    value={tempSettings.about_us}
                    onChange={(e) => setTempSettings({ ...tempSettings, about_us: e.target.value })}
                    className="w-full p-3 border rounded-lg"
                    rows={4}
                  />
                ) : (
                  <p className="text-gray-600 font-body">
                    {settings?.about_us || tempSettings.about_us}
                  </p>
                )}
              </div>
            </div>

            {/* Hours Section */}
            <div>
              <h3 className="text-xl font-bold text-gray-800 mb-6 font-title flex items-center">
                <i className="fas fa-clock mr-3 text-accent"></i>
                Horário
              </h3>
              <div className="space-y-4">
                {/* First Block - Always present */}
                <div className="bg-gray-200 backdrop-blur-sm rounded-lg p-4 border border-gray-300 mb-4">
                  {canEditBusiness && isEditing ? (
                    <>
                      <input
                        type="text"
                        value={tempSettings.hours.weekdaysLabel}
                        onChange={(e) => setTempSettings({
                          ...tempSettings,
                          hours: { ...tempSettings.hours, weekdaysLabel: e.target.value }
                        })}
                        className="w-full p-2 border rounded-lg mb-2"
                        placeholder="Ex: Segunda a Sexta-feira"
                      />
                      <input
                        type="text"
                        value={tempSettings.hours.weekdays}
                        onChange={(e) => setTempSettings({
                          ...tempSettings,
                          hours: { ...tempSettings.hours, weekdays: e.target.value }
                        })}
                        className="w-full p-2 border rounded-lg"
                        placeholder="Ex: 11h às 23h"
                      />
                    </>
                  ) : (
                    <>
                      <h4 className="font-semibold text-gray-700 mb-2">{tempSettings.hours.weekdaysLabel}</h4>
                      <p className="text-gray-600">{tempSettings.hours.weekdays}</p>
                    </>
                  )}
                </div>

                {/* Second Block - Conditional */}
                {hasSecondBlock && (
                  <div className="bg-gray-200 backdrop-blur-sm rounded-lg p-4 border border-gray-300">
                    {canEditBusiness && isEditing ? (
                      <>
                        <input
                          type="text"
                          value={tempSettings.hours.weekendsLabel}
                          onChange={(e) => setTempSettings({
                            ...tempSettings,
                            hours: { ...tempSettings.hours, weekendsLabel: e.target.value }
                          })}
                          className="w-full p-2 border rounded-lg mb-2"
                          placeholder="Ex: Sábado e Domingo"
                        />
                        <input
                          type="text"
                          value={tempSettings.hours.weekends}
                          onChange={(e) => setTempSettings({
                            ...tempSettings,
                            hours: { ...tempSettings.hours, weekends: e.target.value }
                          })}
                          className="w-full p-2 border rounded-lg mb-3"
                          placeholder="Ex: 11h às 00h"
                        />
                        <button
                          onClick={removeSecondBlock}
                          className="w-full py-2 px-4 text-sm text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors flex items-center justify-center"
                        >
                          <i className="fas fa-trash mr-2"></i>
                          Remover bloco
                        </button>
                      </>
                    ) : (
                      <>
                        <h4 className="font-semibold text-gray-700 mb-2">{tempSettings.hours.weekendsLabel}</h4>
                        <p className="text-gray-600">{tempSettings.hours.weekends}</p>
                      </>
                    )}
                  </div>
                )}

                {/* Add Second Block Button */}
                {canEditBusiness && isEditing && !hasSecondBlock && (
                  <button
                    onClick={addSecondBlock}
                    className="w-full py-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 hover:border-accent hover:text-accent transition-colors flex items-center justify-center"
                  >
                    <i className="fas fa-plus-circle mr-2"></i>
                    Adicionar segundo bloco
                  </button>
                )}
              </div>
            </div>

            {/* Contact Section */}
            <div>
              <h3 className="text-xl font-bold text-gray-800 mb-6 font-title flex items-center">
                <i className="fas fa-id-card-clip mr-3 text-accent"></i>
                Contato
              </h3>
              <div className="space-y-4">
                {/* 1. Telefone */}
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0 w-5 h-5 flex items-center justify-center mt-1">
                    <i className="fas fa-phone text-accent"></i>
                  </div>
                  <div className="flex-1">
                    {canEditBusiness && isEditing ? (
                      <input
                        type="text"
                        value={tempSettings.contact.phone}
                        onChange={(e) => setTempSettings({
                          ...tempSettings,
                          contact: { ...tempSettings.contact, phone: e.target.value }
                        })}
                        className="w-full p-2 border rounded-lg"
                      />
                    ) : (
                      <a 
                        href={`tel:${tempSettings.contact.phone.replace(/\D/g, '')}`}
                        className="text-gray-600 hover:text-accent transition-colors"
                      >
                        {tempSettings.contact.phone}
                      </a>
                    )}
                  </div>
                </div>

                {/* 2. Email */}
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0 w-5 h-5 flex items-center justify-center mt-1">
                    <i className="fas fa-envelope text-accent"></i>
                  </div>
                  <div className="flex-1">
                    {canEditBusiness && isEditing ? (
                      <input
                        type="text"
                        value={tempSettings.contact.email}
                        onChange={(e) => setTempSettings({
                          ...tempSettings,
                          contact: { ...tempSettings.contact, email: e.target.value }
                        })}
                        className="w-full p-2 border rounded-lg"
                      />
                    ) : (
                      <a 
                        href={`mailto:${tempSettings.contact.email}`}
                        className="text-gray-600 hover:text-accent transition-colors"
                      >
                        {tempSettings.contact.email}
                      </a>
                    )}
                  </div>
                </div>

                {/* 3. Rede Social */}
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0 w-5 h-5 flex items-center justify-center mt-1">
                    <i className="fas fa-at text-accent"></i>
                  </div>
                  <div className="flex-1">
                    {canEditBusiness && isEditing ? (
                      <input
                        type="text"
                        value={tempSettings.contact.social}
                        onChange={(e) => setTempSettings({
                          ...tempSettings,
                          contact: { ...tempSettings.contact, social: e.target.value }
                        })}
                        className="w-full p-2 border rounded-lg"
                        placeholder="tiktok.com/@perfil"
                      />
                    ) : (
                      <a 
                        href={formatSocialLink(tempSettings.contact.social)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-gray-600 hover:text-accent transition-colors"
                      >
                        {tempSettings.contact.social}
                      </a>
                    )}
                  </div>
                </div>

                {/* 4. WhatsApp */}
                {settings?.social_links?.whatsapp && (
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0 w-5 h-5 flex items-center justify-center mt-1">
                      <i className="fas fa-comments text-accent"></i>
                    </div>
                    <div className="flex-1">
                      <a 
                        href={`https://wa.me/${settings.social_links.whatsapp.replace(/\D/g, '')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-gray-600 hover:text-accent transition-colors"
                      >
                        WhatsApp
                      </a>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Location Section */}
            <div>
              <h3 className="text-xl font-bold text-gray-800 mb-6 font-title flex items-center">
                <i className="fas fa-location-dot mr-3 text-accent"></i>
                Localização
              </h3>
              <div className="bg-gray-200 backdrop-blur-sm rounded-lg p-4 border border-gray-300">
                <div className="space-y-3">
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0 w-5 h-5 flex items-center justify-center mt-1">
                      <i className="fas fa-map-location text-accent"></i>
                    </div>
                    <div className="flex-1">
                      {canEditBusiness && isEditing ? (
                        <input
                          type="text"
                          value={tempSettings.contact.address}
                          onChange={(e) => setTempSettings({
                            ...tempSettings,
                            contact: { ...tempSettings.contact, address: e.target.value }
                          })}
                          className="w-full p-2 border rounded-lg"
                          placeholder="Endereço"
                        />
                      ) : googleMapsUrl(settings?.social_links?.maps_url) ? (
                        <a href={googleMapsUrl(settings?.social_links?.maps_url) ?? undefined} target="_blank" rel="noopener noreferrer" className="text-gray-600 hover:text-accent transition-colors" aria-label={`${tempSettings.contact.address} — abrir no Google Maps (nova aba)`}>{tempSettings.contact.address}</a>
                      ) : (
                        <p className="text-gray-600">{tempSettings.contact.address}</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Copyright */}
          <div className="mt-12 pt-8 border-t border-gray-100">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
              <p className="text-sm text-gray-600 font-body text-center md:text-left">
                © {new Date().getFullYear()} {settings?.name || 'Meu negócio'}. Todos os direitos reservados.
              </p>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
