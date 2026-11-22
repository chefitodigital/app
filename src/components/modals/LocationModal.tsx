import { useState, useEffect, lazy, Suspense } from 'react';
import { useBodyScrollLock } from '../../hooks/useBodyScrollLock';
import { useThemeStore } from '../../store/theme';
import { useAuth } from '../../hooks/useAuth';
import toast from 'react-hot-toast';
import { forwardGeocode, type LatLng } from '../../lib/geo';

const LocationPicker = lazy(() => import('../map/LocationPicker'));

interface LocationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function LocationModal({ isOpen, onClose }: LocationModalProps) {
  const { settings, updateSettings } = useThemeStore();
  const { authInitialized, isAuthenticated, isSuperAdmin } = useAuth();
  const canEditBusiness = authInitialized && isAuthenticated && isSuperAdmin();
  const [editingLocation, setEditingLocation] = useState(false);
  const [tempLocation, setTempLocation] = useState(settings?.location || '');
  const [coords, setCoords] = useState<LatLng | null>(null);

  const accentColor = settings?.accent_color || '#212529';

  useEffect(() => {
    if (settings) {
      setTempLocation(settings.location || '');
    }
  }, [settings]);

  useEffect(() => {
    let cancelled = false;
    const savedLat = settings?.restaurant_lat;
    const savedLng = settings?.restaurant_lng;
    if (isOpen && savedLat != null && savedLng != null) {
      setCoords({ lat: savedLat, lng: savedLng });
    } else if (isOpen && settings?.location && !editingLocation) {
      forwardGeocode(settings.location).then((c) => {
        if (!cancelled) setCoords(c);
      });
    }
    return () => { cancelled = true; };
  }, [isOpen, settings, editingLocation]);

  useBodyScrollLock(isOpen);

  const handleSaveLocation = async () => {
    try {
      if (!settings || !canEditBusiness) return;

      await updateSettings({
        ...settings,
        location: tempLocation,
      });

      setEditingLocation(false);
      toast.success('Localização atualizada com sucesso!');
    } catch (error) {
      console.error('Error updating location:', error);
      toast.error('Erro ao atualizar localização');
    }
  };

  const handleClose = () => {
    setEditingLocation(false);
    setTempLocation(settings?.location || '');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-950/50 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 p-0 sm:p-4 pointer-events-none">
      <div className="bg-gray-50 rounded-t-2xl sm:rounded-2xl p-4 sm:p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto pointer-events-auto">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-semibold text-gray-800 font-title">A Nossa Localização</h3>
          <div className="flex items-center space-x-2">
            {canEditBusiness && !editingLocation && (
              <button
                onClick={() => setEditingLocation(true)}
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
        {canEditBusiness && editingLocation ? (
          <div className="space-y-4">
            <textarea
              value={tempLocation}
              onChange={(e) => setTempLocation(e.target.value)}
              className="w-full px-4 py-2 rounded-lg border border-gray-200 hover:border-gray-300 focus:border-gray-400 focus:outline-none transition-colors"
              rows={4}
              placeholder="Endereço completo do restaurante..."
            />
            <button
              onClick={handleSaveLocation}
              className="w-full flex items-center justify-center space-x-2 bg-accent text-gray-50 px-4 py-2 rounded-lg hover:bg-accent/90 transition-colors"
            >
              <i className="fas fa-save"></i>
              <span>Salvar</span>
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-gray-600 font-body whitespace-pre-line">
              {settings?.location || 'Localização não disponível.'}
            </p>
            {settings?.location && (
              <Suspense fallback={<div className="aspect-video w-full rounded-lg bg-gray-100 animate-pulse" />}>
                <LocationPicker
                  coords={coords}
                  defaultCenter={coords ?? undefined}
                  accentColor={accentColor}
                  height="280px"
                  onCoordsChange={() => {}}
                  readOnly
                />
              </Suspense>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
