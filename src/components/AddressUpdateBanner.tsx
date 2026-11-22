import React, { useEffect, useState, lazy, Suspense } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import { useThemeStore } from '../store/theme';
import type { LatLng } from '../lib/geo';

const LocationPicker = lazy(() => import('./map/LocationPicker'));

interface AddressEntry {
  index: number;
  text: string;
}

export default function AddressUpdateBanner() {
  const { isAuthenticated, userEmail, isSuperAdmin } = useAuth();
  const { settings } = useThemeStore();
  const [addresses, setAddresses] = useState<AddressEntry[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [customerId, setCustomerId] = useState<string | null>(null);
  const [coords, setCoords] = useState<LatLng | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  const accentColor = settings?.accent_color || '#212529';
  const deliveryFeeEnabled = settings?.delivery_fee_enabled;

  useEffect(() => {
    if (!isAuthenticated || !userEmail || isSuperAdmin() || !deliveryFeeEnabled) return;

    const fetchAddresses = async () => {
      const { data } = await supabase
        .from('customers')
        .select('id, addresses, address_coordinates')
        .eq('email', userEmail)
        .maybeSingle();

      if (!data) return;

      setCustomerId(data.id);

      const rawAddresses: string[] = Array.isArray(data.addresses) ? data.addresses : [];
      const rawCoords: ({ lat: number; lng: number } | null)[] = Array.isArray(data.address_coordinates)
        ? data.address_coordinates
        : [];

      const missing: AddressEntry[] = rawAddresses
        .map((text, index) => ({ index, text, hasCoords: !!rawCoords[index] }))
        .filter((a) => !a.hasCoords)
        .map(({ index, text }) => ({ index, text }));

      setAddresses(missing);
    };

    fetchAddresses();
  }, [isAuthenticated, userEmail, isSuperAdmin, deliveryFeeEnabled]);

  if (!isAuthenticated || isSuperAdmin() || dismissed || addresses.length === 0 || !deliveryFeeEnabled) {
    return null;
  }

  const current = addresses[currentIdx];

  const handleSave = async () => {
    if (!coords || !customerId || !current) return;

    setIsSaving(true);

    const { data: existing } = await supabase
      .from('customers')
      .select('addresses, address_coordinates')
      .eq('id', customerId)
      .maybeSingle();

    if (existing) {
      const coordsArr: ({ lat: number; lng: number } | null)[] = Array.isArray(existing.address_coordinates)
        ? [...existing.address_coordinates]
        : [];

      while (coordsArr.length <= current.index) {
        coordsArr.push(null);
      }
      coordsArr[current.index] = coords;

      await supabase
        .from('customers')
        .update({ address_coordinates: coordsArr, updated_at: new Date().toISOString() })
        .eq('id', customerId);
    }

    setIsSaving(false);
    setCoords(null);

    const next = addresses.filter((_, i) => i !== currentIdx);
    if (next.length === 0) {
      setDismissed(true);
    } else {
      setAddresses(next);
      setCurrentIdx(0);
    }
  };

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 w-full max-w-lg px-4">
      <div className="bg-gray-50 border border-gray-200 rounded-lg shadow-xl p-4 space-y-4 animate-fade-in">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1">
            <p className="text-sm font-semibold text-gray-800">
              <i className="fas fa-location-dot text-accent mr-2"></i>
              Confirme a localização do seu endereço
            </p>
            <p className="text-xs text-gray-600 mt-1 truncate">{current.text}</p>
          </div>
          <button
            onClick={() => setDismissed(true)}
            className="flex-shrink-0 w-7 h-7 flex items-center justify-center hover:bg-gray-100 rounded-lg transition-colors text-gray-500"
          >
            <i className="fas fa-xmark text-sm"></i>
          </button>
        </div>

        <Suspense fallback={<div className="h-40 bg-gray-100 rounded-lg animate-pulse" />}>
          <LocationPicker
            coords={coords}
            accentColor={accentColor}
            height="180px"
            showGpsButton
            onCoordsChange={(newCoords) => setCoords(newCoords)}
          />
        </Suspense>

        {addresses.length > 1 && (
          <p className="text-xs text-gray-500 text-center">
            {currentIdx + 1} de {addresses.length} endereços pendentes
          </p>
        )}

        <div className="flex gap-2">
          {addresses.length > 1 && currentIdx < addresses.length - 1 && (
            <button
              type="button"
              onClick={() => { setCurrentIdx(currentIdx + 1); setCoords(null); }}
              className="btn btn-secondary flex-1"
            >
              Pular
            </button>
          )}
          <button
            type="button"
            onClick={handleSave}
            disabled={!coords || isSaving}
            className="btn btn-primary flex-1 disabled:opacity-50"
          >
            {isSaving ? (
              <><i className="fas fa-spinner fa-spin mr-2"></i>Salvando...</>
            ) : (
              'Confirmar Localização'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
