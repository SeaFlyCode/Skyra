/**
 * Module map — carte à relief 3D (MapLibre) et lecture du ciel au-dessus du
 * point observé.
 *
 * `ReliefMap` est résolu par plateforme : `relief-map.web.tsx` s'appuie sur
 * `maplibre-gl`, `relief-map.tsx` sur `@maplibre/maplibre-react-native`. Les
 * deux consomment la même spécification de style, terrain 3D compris.
 */

export { ReliefMap } from './relief-map';
export { SkyPointer } from './sky-pointer';
export { SUN_ACCENT, MOON_ACCENT, ISS_ACCENT } from './accents';
export { LocationBadge } from './location-badge';
export { MapToolbar } from './map-toolbar';
export { SkyPanel, SIDE_PANEL_WIDTH, DESKTOP_BREAKPOINT } from './sky-panel';
export { useSkyData, type SkyData } from './use-sky-data';
export {
  celestialGroundPoint,
  CELESTIAL_MARKER_DISTANCE_KM,
  type CelestialGroundPoint,
} from './celestial-ground';
export {
  buildMapStyle,
  tileProfile,
  tileProfileNotice,
  TERRAIN_EXAGGERATION,
  INITIAL_PITCH,
  INITIAL_ZOOM,
  type TileProfile,
} from './style';
export type {
  MapCoordinates,
  MapStatus,
  MapViewState,
  ReliefMapProps,
  SkyOverlay,
} from './types';
