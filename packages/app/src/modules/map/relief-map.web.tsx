import 'maplibre-gl/dist/maplibre-gl.css';

import { useEffect, useRef } from 'react';
import { StyleSheet, View } from 'react-native';

import maplibreGlPackage from 'maplibre-gl/package.json';

import { buildMapStyle, INITIAL_PITCH, INITIAL_ZOOM, MAX_PITCH } from './style';
import type { MapViewState, ReliefMapProps } from './types';

// `maplibre-gl` instancie son web worker via `new Worker(new URL('./maplibre-gl-worker.mjs',
// import.meta.url))`. Metro bundle tout en un seul fichier pour le web : à l'exécution,
// `import.meta.url` ne pointe donc pas vers le module `maplibre-gl` mais vers le bundle
// d'entrée (`expo-router/entry`), et le worker est demandé à une URL invalide
// (`.../node_modules/expo-router/maplibre-gl-worker.mjs`, servie en HTML par le dev server,
// d'où l'erreur de type MIME). Metro n'a pas de mécanisme pour resservir ce fichier ni son
// import relatif `maplibre-gl-shared.mjs` à la bonne URL, donc on pointe explicitement le
// worker vers unpkg (CDN public de npm), à la version exacte installée : maplibre-gl gère
// nativement le cross-origin ici en enveloppant l'URL dans un blob `import(...)`.
const MAPLIBRE_WORKER_URL = `https://unpkg.com/maplibre-gl@${maplibreGlPackage.version}/dist/maplibre-gl-worker.mjs`;

/**
 * Carte relief pour le web. `maplibre-gl` touche `window` dès l'évaluation du
 * module : l'import est donc dynamique et effectué après le montage, sinon le
 * pré-rendu statique (`web.output: "static"`) casse côté Node.
 */
export function ReliefMap({
  initialCenter,
  onViewStateChange,
  onStatusChange,
  style,
}: ReliefMapProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Les callbacks changent à chaque rendu du parent ; les garder dans une ref
  // évite de détruire et recréer la carte à chaque fois.
  const handlersRef = useRef({ onViewStateChange, onStatusChange });
  handlersRef.current = { onViewStateChange, onStatusChange };

  const initialCameraRef = useRef(initialCenter);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let map: import('maplibre-gl').Map | null = null;
    let frame = 0;
    let disposed = false;

    import('maplibre-gl')
      .then(({ Map, NavigationControl, ScaleControl, setWorkerUrl }) => {
        if (disposed) return;

        setWorkerUrl(MAPLIBRE_WORKER_URL);

        map = new Map({
          container,
          style: buildMapStyle({ sky: true }),
          center: [initialCameraRef.current.longitude, initialCameraRef.current.latitude],
          zoom: INITIAL_ZOOM,
          pitch: INITIAL_PITCH,
          maxPitch: MAX_PITCH,
          bearing: 0,
          attributionControl: { compact: true },
        });

        map.addControl(
          new NavigationControl({ visualizePitch: true, showZoom: true, showCompass: true }),
          'bottom-right'
        );
        map.addControl(new ScaleControl({ unit: 'metric' }), 'bottom-left');

        const emit = () => {
          frame = 0;
          if (!map) return;
          const center = map.getCenter();
          const state: MapViewState = {
            center: { latitude: center.lat, longitude: center.lng },
            zoom: map.getZoom(),
            bearing: map.getBearing(),
            pitch: map.getPitch(),
          };
          handlersRef.current.onViewStateChange?.(state);
        };

        // `move` se déclenche à chaque frame de rendu : on n'en propage qu'une
        // par frame d'animation pour ne pas saturer React.
        const scheduleEmit = () => {
          if (frame) return;
          frame = requestAnimationFrame(emit);
        };

        map.on('move', scheduleEmit);
        map.on('load', () => {
          emit();
          handlersRef.current.onStatusChange?.('ready', null);
        });
        map.on('error', (event) => {
          handlersRef.current.onStatusChange?.(
            'error',
            event.error?.message ?? 'Chargement des tuiles impossible'
          );
        });
      })
      .catch((error: unknown) => {
        handlersRef.current.onStatusChange?.(
          'error',
          error instanceof Error ? error.message : 'MapLibre GL n’a pas pu être chargé'
        );
      });

    return () => {
      disposed = true;
      if (frame) cancelAnimationFrame(frame);
      map?.remove();
    };
  }, []);

  return (
    <View style={[styles.container, style]}>
      <div ref={containerRef} style={{ position: 'absolute', inset: 0 }} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    overflow: 'hidden',
    backgroundColor: '#0B1016',
  },
});
