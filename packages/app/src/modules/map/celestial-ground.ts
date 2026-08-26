/**
 * Projection au sol d'une direction céleste (azimut/élévation vus depuis un
 * observateur) — utilisé pour représenter Soleil et Lune sur la vue 3D de la
 * carte. Ce sont des directions à l'infini, pas des points terrestres : on
 * place donc un marqueur à distance fixe de l'observateur, le long de
 * l'azimut réel, et on encode l'élévation dans les propriétés du point pour
 * que la couche carte fasse varier taille/opacité (plutôt qu'un vrai
 * marqueur en altitude, complexe à maintenir à l'identique web/natif).
 */

import type { MapCoordinates } from './types';

const EARTH_RADIUS_KM = 6371;
const DEG = Math.PI / 180;

/** Distance du marqueur sol : assez proche pour rester visible au zoom initial de la carte. */
export const CELESTIAL_MARKER_DISTANCE_KM = 3;

export type CelestialGroundPoint = MapCoordinates & {
  /** Hauteur au-dessus de l'horizon, en degrés — peut être négative. */
  elevation: number;
};

/**
 * Point terrestre situé à `distanceKm` de l'observateur, le long de l'azimut
 * donné (formule de destination sur une sphère). Sert de point d'ancrage
 * GeoJSON pour un marqueur dont l'élévation pilote seulement le style.
 */
export function celestialGroundPoint(
  observer: MapCoordinates,
  azimuth: number,
  elevation: number,
  distanceKm: number = CELESTIAL_MARKER_DISTANCE_KM
): CelestialGroundPoint {
  const lat1 = observer.latitude * DEG;
  const lon1 = observer.longitude * DEG;
  const theta = azimuth * DEG;
  const angularDistance = distanceKm / EARTH_RADIUS_KM;

  const lat2 = Math.asin(
    Math.sin(lat1) * Math.cos(angularDistance) +
      Math.cos(lat1) * Math.sin(angularDistance) * Math.cos(theta)
  );
  const lon2 =
    lon1 +
    Math.atan2(
      Math.sin(theta) * Math.sin(angularDistance) * Math.cos(lat1),
      Math.cos(angularDistance) - Math.sin(lat1) * Math.sin(lat2)
    );

  return {
    latitude: lat2 / DEG,
    longitude: (((lon2 / DEG + 540) % 360) - 180),
    elevation,
  };
}
