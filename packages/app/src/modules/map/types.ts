import type { StyleProp, ViewStyle } from 'react-native';

import type { CelestialGroundPoint } from './celestial-ground';

/** Coordonnées géographiques, dans l'ordre utilisé par le module sun-moon. */
export type MapCoordinates = {
  latitude: number;
  longitude: number;
};

/**
 * Overlays géographiques Soleil / Lune / ISS affichés directement sur la vue
 * 3D (voir `sky-overlay.ts`), en complément du pointeur central `SkyPointer`.
 */
export type SkyOverlay = {
  issPosition: MapCoordinates | null;
  /** Trajectoire récente/à venir de l'ISS, quelques points sur ~±12 min. */
  issTrail: MapCoordinates[];
  sun: CelestialGroundPoint | null;
  moon: CelestialGroundPoint | null;
};

/** État de la caméra, normalisé entre l'implémentation web et l'implémentation native. */
export type MapViewState = {
  center: MapCoordinates;
  zoom: number;
  /** Rotation en degrés, 0 = nord en haut de l'écran. */
  bearing: number;
  /** Inclinaison en degrés, 0 = vue zénithale. */
  pitch: number;
};

export type MapStatus = 'loading' | 'ready' | 'error';

export type ReliefMapProps = {
  initialCenter: MapCoordinates;
  onViewStateChange?: (state: MapViewState) => void;
  onStatusChange?: (status: MapStatus, message: string | null) => void;
  style?: StyleProp<ViewStyle>;
  /** Positions Soleil/Lune/ISS à superposer sur la vue 3D ; absent tant que le ciel n'est pas encore calculé. */
  skyOverlay?: SkyOverlay;
};
