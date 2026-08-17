/**
 * Position et phase de la Lune — séries de Jean Meeus (Astronomical Algorithms,
 * ch. 47) tronquées aux termes principaux.
 * Précision typique : ~10" en longitude, ~4" en latitude, ~20 km en distance.
 */

import {
  cosd,
  eclipticToEquatorial,
  equatorialToHorizontal,
  julianCenturies,
  julianDay,
  norm1,
  norm360,
  obliquity,
  parallaxCorrection,
  refraction,
  sind,
  toDeg,
} from './astro';
import { sunEcliptic } from './sun';

/** Durée moyenne d'une lunaison en jours. */
export const SYNODIC_MONTH = 29.530588853;

/** [D, M, M', F, coefficient longitude (1e-6°), coefficient distance (1e-3 km)] */
const LONGITUDE_TERMS: readonly (readonly number[])[] = [
  [0, 0, 1, 0, 6288774, -20905355],
  [2, 0, -1, 0, 1274027, -3699111],
  [2, 0, 0, 0, 658314, -2955968],
  [0, 0, 2, 0, 213618, -569925],
  [0, 1, 0, 0, -185116, 48888],
  [0, 0, 0, 2, -114332, -3149],
  [2, 0, -2, 0, 58793, 246158],
  [2, -1, -1, 0, 57066, -152138],
  [2, 0, 1, 0, 53322, -170733],
  [2, -1, 0, 0, 45758, -204586],
  [0, 1, -1, 0, -40923, -129620],
  [1, 0, 0, 0, -34720, 108743],
  [0, 1, 1, 0, -30383, 104755],
  [2, 0, 0, -2, 15327, 10321],
  [0, 0, 1, 2, -12528, 0],
  [0, 0, 1, -2, 10980, 79661],
  [4, 0, -1, 0, 10675, -34782],
  [0, 0, 3, 0, 10034, -23210],
  [4, 0, -2, 0, 8548, -21636],
  [2, 1, -1, 0, -7888, 24208],
  [2, 1, 0, 0, -6766, 30824],
  [1, 0, -1, 0, -5163, -8379],
  [1, 1, 0, 0, 4987, -16675],
  [2, -1, 1, 0, 4036, -12831],
  [2, 0, 2, 0, 3994, -10445],
  [4, 0, 0, 0, 3861, -11650],
  [2, 0, -3, 0, 3665, 14403],
];

/** [D, M, M', F, coefficient latitude (1e-6°)] */
const LATITUDE_TERMS: readonly (readonly number[])[] = [
  [0, 0, 0, 1, 5128122],
  [0, 0, 1, 1, 280602],
  [0, 0, 1, -1, 277693],
  [2, 0, 0, -1, 173237],
  [2, 0, -1, 1, 55413],
  [2, 0, -1, -1, 46271],
  [2, 0, 0, 1, 32573],
  [0, 0, 2, 1, 17198],
  [2, 0, 1, -1, 9266],
  [0, 0, 2, -1, 8822],
  [2, -1, 0, -1, 8216],
  [2, 0, -2, -1, 4324],
  [2, 0, 1, 1, 4200],
  [2, 1, 0, -1, -3359],
  [2, -1, -1, 1, 2463],
  [2, -1, 0, 1, 2211],
  [2, -1, -1, -1, 2065],
  [0, 1, -1, -1, -1870],
  [4, 0, -1, -1, 1828],
  [0, 1, 0, 1, -1794],
  [0, 0, 0, 3, -1749],
];

export type MoonEcliptic = {
  /** Longitude écliptique géocentrique apparente, en degrés. */
  longitude: number;
  /** Latitude écliptique géocentrique, en degrés. */
  latitude: number;
  /** Distance Terre–Lune (centre à centre) en km. */
  distanceKm: number;
};

/** Coordonnées écliptiques géocentriques de la Lune pour un jour julien donné. */
export function moonEcliptic(jd: number): MoonEcliptic {
  const t = julianCenturies(jd);

  const meanLongitude = norm360(
    218.3164477 + 481267.88123421 * t - 0.0015786 * t * t + (t * t * t) / 538841
  );
  const elongation = norm360(
    297.8501921 + 445267.1114034 * t - 0.0018819 * t * t + (t * t * t) / 545868
  );
  const sunAnomaly = norm360(357.5291092 + 35999.0502909 * t - 0.0001536 * t * t);
  const moonAnomaly = norm360(
    134.9633964 + 477198.8675055 * t + 0.0087414 * t * t + (t * t * t) / 69699
  );
  const argumentOfLatitude = norm360(
    93.272095 + 483202.0175233 * t - 0.0036539 * t * t - (t * t * t) / 3526000
  );

  // Excentricité de l'orbite terrestre : module les termes dépendant de l'anomalie solaire.
  const e = 1 - 0.002516 * t - 0.0000074 * t * t;

  let sumLongitude = 0;
  let sumDistance = 0;
  for (const [d, m, mp, f, coefL, coefR] of LONGITUDE_TERMS) {
    const argument = d * elongation + m * sunAnomaly + mp * moonAnomaly + f * argumentOfLatitude;
    const eccentricityFactor = e ** Math.abs(m);
    sumLongitude += coefL * eccentricityFactor * sind(argument);
    sumDistance += coefR * eccentricityFactor * cosd(argument);
  }

  let sumLatitude = 0;
  for (const [d, m, mp, f, coefB] of LATITUDE_TERMS) {
    const argument = d * elongation + m * sunAnomaly + mp * moonAnomaly + f * argumentOfLatitude;
    sumLatitude += coefB * e ** Math.abs(m) * sind(argument);
  }

  // Termes additifs de Vénus, Jupiter et de l'aplatissement terrestre (Meeus 47).
  const a1 = 119.75 + 131.849 * t;
  const a2 = 53.09 + 479264.29 * t;
  const a3 = 313.45 + 481266.484 * t;

  sumLongitude += 3958 * sind(a1) + 1962 * sind(meanLongitude - argumentOfLatitude) + 318 * sind(a2);
  sumLatitude +=
    -2235 * sind(meanLongitude) +
    382 * sind(a3) +
    175 * sind(a1 - argumentOfLatitude) +
    175 * sind(a1 + argumentOfLatitude) +
    127 * sind(meanLongitude - moonAnomaly) -
    115 * sind(meanLongitude + moonAnomaly);

  return {
    longitude: norm360(meanLongitude + sumLongitude / 1e6),
    latitude: sumLatitude / 1e6,
    distanceKm: 385000.56 + sumDistance / 1000,
  };
}

export type MoonPosition = {
  /** Azimut en degrés depuis le Nord, sens horaire. */
  azimuth: number;
  /** Hauteur topocentrique au-dessus de l'horizon, en degrés. */
  elevation: number;
  /** Hauteur apparente (réfraction atmosphérique incluse), en degrés. */
  apparentElevation: number;
  /** Distance Terre–Lune en km. */
  distanceKm: number;
};

/** Position de la Lune pour un observateur et un instant donnés. */
export function getMoonPosition(latitude: number, longitude: number, date: Date): MoonPosition {
  const jd = julianDay(date.getTime());
  const moon = moonEcliptic(jd);
  const equatorial = eclipticToEquatorial(
    moon.longitude,
    moon.latitude,
    obliquity(julianCenturies(jd))
  );
  const horizontal = equatorialToHorizontal(equatorial, latitude, longitude, jd);
  const topocentric = parallaxCorrection(horizontal.elevation, moon.distanceKm);

  return {
    azimuth: horizontal.azimuth,
    elevation: topocentric,
    apparentElevation: topocentric + refraction(topocentric),
    distanceKm: moon.distanceKm,
  };
}

export type MoonPhaseName =
  | 'Nouvelle lune'
  | 'Premier croissant'
  | 'Premier quartier'
  | 'Gibbeuse croissante'
  | 'Pleine lune'
  | 'Gibbeuse décroissante'
  | 'Dernier quartier'
  | 'Dernier croissant';

export type MoonPhase = {
  /** Avancement dans la lunaison : 0 = nouvelle lune, 0.5 = pleine lune. */
  fraction: number;
  /** Part du disque éclairée, de 0 à 1. */
  illumination: number;
  /** Âge de la Lune en jours depuis la dernière nouvelle lune. */
  ageDays: number;
  /** Angle de phase Soleil–Lune–Terre, en degrés. */
  phaseAngle: number;
  /** Élongation géocentrique Soleil–Lune, en degrés. */
  elongation: number;
  /** La Lune croît (avant la pleine lune). */
  waxing: boolean;
  name: MoonPhaseName;
};

function phaseName(fraction: number): MoonPhaseName {
  if (fraction < 0.0125 || fraction >= 0.9875) return 'Nouvelle lune';
  if (fraction < 0.2375) return 'Premier croissant';
  if (fraction < 0.2625) return 'Premier quartier';
  if (fraction < 0.4875) return 'Gibbeuse croissante';
  if (fraction < 0.5125) return 'Pleine lune';
  if (fraction < 0.7375) return 'Gibbeuse décroissante';
  if (fraction < 0.7625) return 'Dernier quartier';
  return 'Dernier croissant';
}

/** Phase lunaire pour un instant donné (indépendante de l'observateur). */
export function getMoonPhase(date: Date): MoonPhase {
  const jd = julianDay(date.getTime());
  const moon = moonEcliptic(jd);
  const sun = sunEcliptic(jd);

  const elongation = toDeg(
    Math.acos(cosd(moon.latitude) * cosd(moon.longitude - sun.apparentLongitude))
  );
  const phaseAngle = toDeg(
    Math.atan2(
      sun.distanceKm * sind(elongation),
      moon.distanceKm - sun.distanceKm * cosd(elongation)
    )
  );

  const fraction = norm1((moon.longitude - sun.apparentLongitude) / 360);

  return {
    fraction,
    illumination: (1 + cosd(phaseAngle)) / 2,
    ageDays: fraction * SYNODIC_MONTH,
    phaseAngle,
    elongation,
    waxing: fraction < 0.5,
    name: phaseName(fraction),
  };
}
