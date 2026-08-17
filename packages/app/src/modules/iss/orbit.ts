/**
 * Propagation SGP4 de l'ISS à partir d'un TLE — calcul local, aucun appel réseau.
 * Le TLE lui-même est récupéré côté hook ; ce fichier ne fait que de la géométrie.
 */

import {
  ecfToLookAngles,
  eciToEcf,
  eciToGeodetic,
  gstime,
  propagate,
  twoline2satrec,
  type EciVec3,
  type GeodeticLocation,
  type SatRec,
} from 'satellite.js';

import { julianDay, sunEcliptic } from '@/modules/sun-moon';

/** Rayon équatorial terrestre en km (WGS84) — test d'ombre géométrique. */
const EARTH_RADIUS_KM = 6378.137;

const DEG = Math.PI / 180;

export type IssTle = {
  name: string;
  line1: string;
  line2: string;
};

export type Observer = {
  latitude: number;
  longitude: number;
};

export type IssPosition = {
  /** Latitude du point subsatellite, en degrés. */
  latitude: number;
  /** Longitude du point subsatellite, en degrés. */
  longitude: number;
  /** Altitude au-dessus de l'ellipsoïde, en km. */
  altitudeKm: number;
  /** Azimut vu de l'observateur, en degrés depuis le Nord. */
  azimuth: number;
  /** Hauteur au-dessus de l'horizon de l'observateur, en degrés. */
  elevation: number;
  /** Distance observateur–station, en km. */
  rangeKm: number;
  /** Vitesse orbitale inertielle, en km/s. */
  speedKmS: number;
  /** La station est éclairée par le Soleil (hors cône d'ombre terrestre). */
  sunlit: boolean;
};

/** Construit l'enregistrement orbital SGP4, `null` si le TLE est illisible. */
export function createSatrec(tle: IssTle): SatRec | null {
  try {
    const satrec = twoline2satrec(tle.line1, tle.line2);
    return satrec.error === 0 ? satrec : null;
  } catch {
    return null;
  }
}

export function observerGeodetic({ latitude, longitude }: Observer): GeodeticLocation {
  return { latitude: latitude * DEG, longitude: longitude * DEG, height: 0 };
}

/** Vecteur unitaire Terre→Soleil dans le repère inertiel. */
function sunDirectionEci(date: Date): EciVec3<number> {
  const { rightAscension, declination } = sunEcliptic(julianDay(date.getTime()));
  const ra = rightAscension * DEG;
  const dec = declination * DEG;
  return {
    x: Math.cos(dec) * Math.cos(ra),
    y: Math.cos(dec) * Math.sin(ra),
    z: Math.sin(dec),
  };
}

/**
 * Ombre cylindrique : la station est éclairée si elle est du côté jour, ou si sa
 * distance à l'axe Terre–Soleil dépasse le rayon terrestre. Approximation
 * suffisante ici — on ignore pénombre et aplatissement.
 */
function isSunlit(positionEci: EciVec3<number>, date: Date): boolean {
  const sun = sunDirectionEci(date);
  const projection =
    positionEci.x * sun.x + positionEci.y * sun.y + positionEci.z * sun.z;
  if (projection > 0) return true;

  const radiusSquared =
    positionEci.x ** 2 + positionEci.y ** 2 + positionEci.z ** 2;
  return Math.sqrt(radiusSquared - projection ** 2) > EARTH_RADIUS_KM;
}

/**
 * Position complète de l'ISS pour un observateur et un instant donnés.
 * `null` si SGP4 diverge (TLE trop ancien, date hors domaine de validité).
 */
export function getIssPosition(
  satrec: SatRec,
  observer: Observer,
  date: Date
): IssPosition | null {
  const state = propagate(satrec, date);
  if (typeof state.position === 'boolean' || typeof state.velocity === 'boolean') {
    return null;
  }

  const gmst = gstime(date);
  const geodetic = eciToGeodetic(state.position, gmst);
  const ecf = eciToEcf(state.position, gmst);
  const look = ecfToLookAngles(observerGeodetic(observer), ecf);
  const { x, y, z } = state.velocity;

  return {
    latitude: geodetic.latitude / DEG,
    longitude: geodetic.longitude / DEG,
    altitudeKm: geodetic.height,
    azimuth: look.azimuth / DEG,
    elevation: look.elevation / DEG,
    rangeKm: look.rangeSat,
    speedKmS: Math.sqrt(x * x + y * y + z * z),
    sunlit: isSunlit(state.position, date),
  };
}

/**
 * Vue allégée utilisée par le balayage des passages : évite la conversion
 * géodésique complète, seuls la direction et l'éclairement comptent.
 */
export function getIssVisibility(
  satrec: SatRec,
  observerGd: GeodeticLocation,
  date: Date
): { azimuth: number; elevation: number; sunlit: boolean } | null {
  const state = propagate(satrec, date);
  if (typeof state.position === 'boolean') return null;

  const look = ecfToLookAngles(observerGd, eciToEcf(state.position, gstime(date)));
  return {
    azimuth: look.azimuth / DEG,
    elevation: look.elevation / DEG,
    sunlit: isSunlit(state.position, date),
  };
}
