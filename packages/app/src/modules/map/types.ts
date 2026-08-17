import type { StyleProp, ViewStyle } from 'react-native';

/** Coordonnées géographiques, dans l'ordre utilisé par le module sun-moon. */
export type MapCoordinates = {
  latitude: number;
  longitude: number;
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
};
