import React, { useCallback, useEffect, useRef, useState } from 'react';
import type { Map as MapType, Marker as MarkerType } from 'maplibre-gl';
import { reverseGeocode } from '../../lib/geo';
import type { LatLng } from '../../lib/geo';

const OPENFREEMAP_STYLE = 'https://tiles.openfreemap.org/styles/liberty';

interface LocationPickerProps {
  coords: LatLng | null;
  accentColor: string;
  defaultCenter?: LatLng;
  height?: string;
  onCoordsChange: (coords: LatLng, address: string) => void;
  showGpsButton?: boolean;
  label?: string;
  readOnly?: boolean;
}

export default function LocationPicker({
  coords,
  accentColor,
  defaultCenter = { lat: 38.7167, lng: -9.1333 },
  height = '240px',
  onCoordsChange,
  showGpsButton = false,
  label,
  readOnly = false,
}: LocationPickerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapType | null>(null);
  const markerRef = useRef<MarkerType | null>(null);
  const maplibreRef = useRef<typeof import('maplibre-gl') | null>(null);
  const currentCoordsRef = useRef<LatLng | null>(null);
  const coordsRef = useRef<LatLng | null>(coords);
  const accentColorRef = useRef(accentColor);
  const onCoordsChangeRef = useRef(onCoordsChange);
  const handlePinRef = useRef<(c: LatLng) => Promise<void>>();

  const [isGeocoding, setIsGeocoding] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [mapError, setMapError] = useState(false);
  const [isMapLoading, setIsMapLoading] = useState(true);

  useEffect(() => {
    accentColorRef.current = accentColor;
  }, [accentColor]);

  useEffect(() => {
    onCoordsChangeRef.current = onCoordsChange;
  }, [onCoordsChange]);

  useEffect(() => {
    coordsRef.current = coords;
  }, [coords]);

  const createMarkerElement = useCallback(() => {
    const el = document.createElement('div');
    el.className = 'delivery-pin';
    el.innerHTML = `<div class="delivery-pin-inner" style="background:${accentColorRef.current}"></div>`;
    return el;
  }, []);

  const readOnlyRef = useRef(readOnly);
  useEffect(() => { readOnlyRef.current = readOnly; }, [readOnly]);

  const handlePin = useCallback(async (newCoords: LatLng) => {
    if (
      currentCoordsRef.current?.lat === newCoords.lat &&
      currentCoordsRef.current?.lng === newCoords.lng
    ) {
      return;
    }

    setIsGeocoding(true);
    currentCoordsRef.current = newCoords;

    const map = mapRef.current;
    const maplibre = maplibreRef.current;
    if (map && maplibre) {
      if (!markerRef.current) {
        const marker = new maplibre.Marker({
          element: createMarkerElement(),
          draggable: !readOnlyRef.current,
          anchor: 'bottom',
        })
          .setLngLat([newCoords.lng, newCoords.lat])
          .addTo(map);

        marker.on('dragend', () => {
          const { lng, lat } = marker.getLngLat();
          handlePinRef.current?.({ lat, lng });
        });

        markerRef.current = marker;
      } else {
        markerRef.current.setLngLat([newCoords.lng, newCoords.lat]);
      }

      map.flyTo({
        center: [newCoords.lng, newCoords.lat],
        zoom: map.getZoom(),
        essential: true,
      });
    }

    const address = await reverseGeocode(newCoords.lat, newCoords.lng);
    setIsGeocoding(false);
    onCoordsChangeRef.current(newCoords, address);
  }, [createMarkerElement]);

  useEffect(() => {
    handlePinRef.current = handlePin;
  }, [handlePin]);

  useEffect(() => {
    if (!containerRef.current) return;

    let cancelled = false;
    let map: MapType | null = null;
    let timer: ReturnType<typeof setTimeout> | undefined;

    const loadMap = async () => {
      try {
        const [maplibre] = await Promise.all([
          import('maplibre-gl'),
          import('maplibre-gl/dist/maplibre-gl.css'),
        ]);

        if (cancelled || !containerRef.current) return;

        maplibreRef.current = maplibre;
        map = new maplibre.Map({
          container: containerRef.current,
          style: OPENFREEMAP_STYLE,
          center: [defaultCenter.lng, defaultCenter.lat],
          zoom: 14,
          attributionControl: { compact: true },
          scrollZoom: false,
        });

        map.addControl(new maplibre.NavigationControl(), 'bottom-right');
        map.on('load', () => { setMapError(false); setIsMapLoading(false); });
        map.on('error', () => { setMapError(true); setIsMapLoading(false); });
        mapRef.current = map;

        // The coordinates effect can run before MapLibre finishes loading. Add
        // the initial pin once the map exists so a remount never leaves it out.
        if (coordsRef.current) {
          currentCoordsRef.current = null;
          void handlePinRef.current?.(coordsRef.current);
        }

        map.on('click', (e) => {
          if (readOnlyRef.current) return;
          const { lng, lat } = e.lngLat;
          handlePinRef.current?.({ lat, lng });
        });

        timer = setTimeout(() => map?.resize(), 100);
      } catch {
        if (!cancelled) {
          setMapError(true);
          setIsMapLoading(false);
        }
      }
    };

    void loadMap();

    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
      markerRef.current = null;
      currentCoordsRef.current = null;
      map?.remove();
      mapRef.current = null;
    };
  }, [defaultCenter.lat, defaultCenter.lng]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const maplibre = maplibreRef.current;
    if (!maplibre) return;

    if (coords) {
      if (
        !currentCoordsRef.current ||
        currentCoordsRef.current.lat !== coords.lat ||
        currentCoordsRef.current.lng !== coords.lng
      ) {
        currentCoordsRef.current = coords;

        if (!markerRef.current) {
          const marker = new maplibre.Marker({
            element: createMarkerElement(),
            draggable: !readOnlyRef.current,
            anchor: 'bottom',
          })
            .setLngLat([coords.lng, coords.lat])
            .addTo(map);

          marker.on('dragend', () => {
            const { lng, lat } = marker.getLngLat();
            handlePinRef.current?.({ lat, lng });
          });

          markerRef.current = marker;
        } else {
          markerRef.current.setLngLat([coords.lng, coords.lat]);
        }

        map.flyTo({
          center: [coords.lng, coords.lat],
          zoom: map.getZoom(),
          essential: true,
        });
      }
    }
  }, [coords, createMarkerElement]);

  useEffect(() => {
    if (!markerRef.current || !coords) return;
    const maplibre = maplibreRef.current;
    if (!maplibre || !mapRef.current) return;

    markerRef.current.remove();

    const marker = new maplibre.Marker({
      element: createMarkerElement(),
      draggable: !readOnlyRef.current,
      anchor: 'bottom',
    })
      .setLngLat([coords.lng, coords.lat])
      .addTo(mapRef.current!);

    marker.on('dragend', () => {
      const { lng, lat } = marker.getLngLat();
      handlePinRef.current?.({ lat, lng });
    });

    markerRef.current = marker;
  }, [accentColor, readOnly, coords, createMarkerElement]);

  const handleGps = () => {
    if (!navigator.geolocation) return;
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const newCoords = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        };
        setIsLocating(false);
        handlePinRef.current?.(newCoords);
      },
      () => {
        setIsLocating(false);
      },
      { timeout: 10000, maximumAge: 60000 }
    );
  };

  return (
    <div className="space-y-2">
      {label && <p className="text-sm text-gray-600">{label}</p>}
      <div className="relative rounded-lg overflow-hidden border border-gray-200" style={{ height }}>
        <div
          ref={containerRef}
          className="absolute inset-0"
          // MapLibre's stylesheet is loaded lazily and sets .maplibregl-map to
          // position: relative. An inline position keeps the map at the full
          // height of this wrapper after that stylesheet arrives.
          style={{ position: 'absolute', inset: 0 }}
        />
        {isMapLoading && (
          <div className="absolute inset-0 grid place-items-center bg-gray-100 text-sm text-gray-500">
            <i className="fas fa-spinner fa-spin mr-2" /> Carregando mapa...
          </div>
        )}
        {isGeocoding && (
          <div className="absolute bottom-2 left-2 bg-gray-50/90 backdrop-blur text-xs text-gray-600 px-2 py-1 rounded-lg">
            <i className="fas fa-spinner fa-spin mr-1"></i>
            A obter endereço...
          </div>
        )}
        {mapError && (
          <div className="absolute inset-x-3 bottom-3 rounded-lg bg-white/95 px-3 py-2 text-xs text-gray-600 shadow-sm" role="status">
            Não foi possível carregar o mapa. Pode introduzir a endereço manualmente e tentar novamente mais tarde.
          </div>
        )}
      </div>
      {showGpsButton && (
        <button
          type="button"
          onClick={handleGps}
          disabled={isLocating}
          className="btn btn-secondary w-full flex items-center justify-center gap-2"
        >
          {isLocating ? (
            <>
              <i className="fas fa-spinner fa-spin"></i>
              A localizar...
            </>
          ) : (
            <>
              <i className="fas fa-location-crosshairs"></i>
              Usar a minha localização
            </>
          )}
        </button>
      )}
    </div>
  );
}
