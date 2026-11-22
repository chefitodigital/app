import React, { useState, lazy, Suspense } from 'react';
import PaymentMethodSelector from './PaymentMethodSelector';
import DeliveryTypeSelector from './DeliveryTypeSelector';
import { Select } from '../ui/Select';
import { useThemeStore } from '../../store/theme';
import { phoneLabel, phonePlaceholder } from '../../lib/formatters';
import type { Country } from '../../lib/i18n';
import type { CustomerInfo } from '../../hooks/useOrderCheckout';
import { forwardGeocode, type LatLng } from '../../lib/geo';

const LocationPicker = lazy(() => import('../map/LocationPicker'));

interface CustomerFormProps {
  customerInfo: CustomerInfo;
  savedAddresses: string[];
  savedAddressCoords?: ({ lat: number; lng: number } | null)[];
  setCustomerInfo: React.Dispatch<React.SetStateAction<CustomerInfo>>;
  onSubmit: () => void;
  onBack: () => void;
  getAddressLabel: () => string;
  getAddressPlaceholder: () => string;
  deliveryFee: number;
  deliveryMinimumOrderValue: number;
  amountNeededForDelivery: number;
}

export default function CustomerForm({
  customerInfo,
  savedAddresses,
  savedAddressCoords = [],
  setCustomerInfo,
  onSubmit,
  onBack,
  getAddressLabel,
  getAddressPlaceholder,
  deliveryFee,
  deliveryMinimumOrderValue,
  amountNeededForDelivery,
}: CustomerFormProps) {
  const { settings, formatCurrency } = useThemeStore();
  const [useNewAddress, setUseNewAddress] = useState(false);
  const isDelivery = !customerInfo.isAtRestaurant && !customerInfo.isTakeaway;
  const hasSavedAddresses = isDelivery && savedAddresses.length > 0;
  const mbwayEnabled = !!(settings?.mbway_enabled && settings?.mbway_phone && settings?.mbway_reference_prefix);
  const country: Country = 'BR';
  const accentColor = settings?.accent_color || '#212529';
  const showMap = isDelivery && !!(settings?.delivery_fee_enabled && settings?.restaurant_lat && settings?.restaurant_lng);
  const restaurantCoords: LatLng | null =
    settings?.restaurant_lat != null && settings?.restaurant_lng != null
      ? { lat: settings.restaurant_lat, lng: settings.restaurant_lng }
      : null;

  const deliveryCoords: LatLng | null =
    customerInfo.deliveryLat != null && customerInfo.deliveryLng != null
      ? { lat: customerInfo.deliveryLat, lng: customerInfo.deliveryLng }
      : null;

  const handleSavedAddressSelect = async (value: string) => {
    const idx = savedAddresses.indexOf(value);
    const stored = idx >= 0 ? savedAddressCoords[idx] || null : null;
    setCustomerInfo((prev) => ({
      ...prev,
      address: value,
      deliveryLat: stored?.lat ?? null,
      deliveryLng: stored?.lng ?? null,
    }));
    if (!value || !showMap || stored) return;
    const coords = await forwardGeocode(value);
    if (coords) {
      setCustomerInfo((prev) =>
        prev.address === value
          ? { ...prev, deliveryLat: coords.lat, deliveryLng: coords.lng }
          : prev
      );
    }
  };

  return (
    <div className="flex-1 p-4 sm:p-6 overflow-y-auto custom-scrollbar">
      <div className="flex items-center gap-3 mb-4 sm:mb-6">
        <button type="button" onClick={onBack} className="w-9 h-9 rounded-lg text-gray-600 hover:bg-gray-100" aria-label="Voltar ao carrinho">
          <i className="fas fa-arrow-left" />
        </button>
        <h3 className="text-lg sm:text-xl font-bold text-gray-800">Informações do Pedido</h3>
      </div>
      <div className="space-y-6">
        <div>
          <p className="mb-3 text-sm font-medium text-gray-700">Como quer receber?</p>
          <DeliveryTypeSelector settings={settings} customerInfo={customerInfo} setCustomerInfo={setCustomerInfo} />
        </div>

        {isDelivery && deliveryMinimumOrderValue > 0 && amountNeededForDelivery > 0 && (
          <div className="rounded-lg border border-accent/30 bg-accent/5 px-3 py-3 text-sm text-gray-700" role="alert">
            <i className="fas fa-circle-exclamation mr-2 text-accent" />
            Pedido mínimo para entrega: {formatCurrency(deliveryMinimumOrderValue)}. Adicione mais {formatCurrency(amountNeededForDelivery)}.
          </div>
        )}

        <div className="input-group">
          <label className="input-label">Nome *</label>
          <input
            type="text"
            value={customerInfo.name}
            onChange={(e) => setCustomerInfo({ ...customerInfo, name: e.target.value })}
            className="input"
            placeholder="Nome completo"
            required
          />
        </div>

        <div className="input-group">
          <label className="input-label">Email *</label>
          <input
            type="email"
            value={customerInfo.email}
            onChange={(e) => setCustomerInfo({ ...customerInfo, email: e.target.value })}
            className="input"
            placeholder="seu@email.com"
            required
          />
        </div>

        <div className="input-group">
          <label className="input-label">{phoneLabel(country)} *</label>
          <input
            type="tel"
            value={customerInfo.phone}
            onChange={(e) => setCustomerInfo({ ...customerInfo, phone: e.target.value })}
            className="input"
            placeholder={phonePlaceholder(country)}
            required
          />
        </div>

        <div className="input-group">
          <label className="input-label">
            {getAddressLabel()} *
          </label>
          {customerInfo.isAtRestaurant || customerInfo.isTakeaway ? (
            <input
              type="text"
              value={customerInfo.address}
              onChange={(e) => setCustomerInfo({ ...customerInfo, address: e.target.value })}
              className="input"
              placeholder={getAddressPlaceholder()}
              required
            />
          ) : hasSavedAddresses && !useNewAddress ? (
            <div className="space-y-3">
              <Select
                value={customerInfo.address}
                onChange={handleSavedAddressSelect}
                placeholder={`Selecione ${country === 'BR' ? 'um endereço' : 'uma endereço'}`}
                options={[
                  { value: '', label: `Selecione ${country === 'BR' ? 'um endereço' : 'uma endereço'}` },
                  ...savedAddresses.map((addr) => ({ value: addr, label: addr }))
                ]}
              />
              <button
                type="button"
                onClick={() => {
                  setUseNewAddress(true);
                  setCustomerInfo({ ...customerInfo, address: '', deliveryLat: null, deliveryLng: null });
                }}
                className="text-sm text-accent hover:underline"
              >
                {country === 'BR' ? 'Usar outro endereço' : 'Usar outra endereço'}
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              <textarea
                value={customerInfo.address}
                onChange={(e) => setCustomerInfo({ ...customerInfo, address: e.target.value })}
                className="input"
                rows={3}
                placeholder={getAddressPlaceholder()}
                required
              />
              {hasSavedAddresses && (
                <button
                  type="button"
                  onClick={() => {
                    setUseNewAddress(false);
                    setCustomerInfo({ ...customerInfo, address: savedAddresses[0] || '', deliveryLat: null, deliveryLng: null });
                  }}
                  className="text-sm text-accent hover:underline"
                >
                  Usar endereço salvo
                </button>
              )}
            </div>
          )}
        </div>

        {showMap && (
          <div className="input-group">
            <label className="input-label">Localização no Mapa</label>
            <p className="text-sm text-gray-500 mb-2">
              Clique no mapa ou use o GPS para confirmar o local exato de entrega.
            </p>
            <Suspense fallback={<div className="h-56 bg-gray-100 rounded-lg animate-pulse" />}>
              <LocationPicker
                coords={deliveryCoords}
                defaultCenter={restaurantCoords ?? undefined}
                accentColor={accentColor}
                height="220px"
                showGpsButton
                onCoordsChange={(coords, address) => {
                  setCustomerInfo({
                    ...customerInfo,
                    deliveryLat: coords.lat,
                    deliveryLng: coords.lng,
                    address: address || customerInfo.address,
                  });
                }}
              />
            </Suspense>
            {deliveryFee > 0 && (
              <div className="mt-2 flex items-center justify-between px-3 py-2 bg-gray-100 rounded-lg">
                <span className="text-sm text-gray-700">Frete calculado</span>
                <span className="text-sm font-semibold text-gray-800">{formatCurrency(deliveryFee)}</span>
              </div>
            )}
          </div>
        )}

        <div className="input-group">
          <label className="input-label">Observações</label>
          <textarea
            value={customerInfo.notes}
            onChange={(e) => setCustomerInfo({ ...customerInfo, notes: e.target.value })}
            className="input"
            rows={8}
            placeholder="Alguma observação para o seu pedido?"
          />
        </div>

        <PaymentMethodSelector
          value={customerInfo.paymentMethod}
          onChange={(method) => setCustomerInfo({ ...customerInfo, paymentMethod: method })}
          mbwayEnabled={mbwayEnabled}
        />

        <button
          onClick={onSubmit}
          disabled={isDelivery && amountNeededForDelivery > 0}
          className="btn btn-primary w-full disabled:cursor-not-allowed disabled:opacity-50"
        >
          Enviar Pedido
        </button>
      </div>
    </div>
  );
}
