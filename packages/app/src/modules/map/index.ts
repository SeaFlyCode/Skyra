/**
 * Module map — carte à relief 3D (MapLibre) et lecture du ciel au-dessus du
 * point observé.
 *
 * `ReliefMap` est résolu par plateforme : `relief-map.web.tsx` s'appuie sur
 * `maplibre-gl`, `relief-map.tsx` sur `@maplibre/maplibre-react-native`. Les
 * deux consomment la même spécification de style, terrain 3D compris.
 */

export { ReliefMap } from './relief-map';
export { SkyCompass, SUN_ACCENT, MOON_ACCENT } from './sky-compass';
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
} from './types';
