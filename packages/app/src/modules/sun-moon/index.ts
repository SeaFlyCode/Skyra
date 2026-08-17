/**
 * Module sun-moon — position du Soleil et de la Lune, heures clés du jour.
 *
 * Tout est calculé hors-ligne à partir de (latitude, longitude, date) : aucune
 * requête réseau, aucun état React. Les fonctions sont pures et testables.
 */

export {
  getSunPosition,
  getSunTimes,
  sunEcliptic,
  SUNRISE_ALTITUDE,
  CIVIL_TWILIGHT_ALTITUDE,
  GOLDEN_HOUR_LOW_ALTITUDE,
  GOLDEN_HOUR_HIGH_ALTITUDE,
  type SunPosition,
  type SunTimes,
  type TimeWindow,
} from './sun';

export {
  getMoonPosition,
  getMoonPhase,
  moonEcliptic,
  SYNODIC_MONTH,
  type MoonPosition,
  type MoonPhase,
  type MoonPhaseName,
  type MoonEcliptic,
} from './moon';

export {
  equatorialToHorizontal,
  eclipticToEquatorial,
  greenwichSiderealTime,
  julianDay,
  julianCenturies,
  obliquity,
  refraction,
  type EquatorialCoords,
  type HorizontalCoords,
} from './astro';

/** Nom de la direction cardinale correspondant à un azimut. */
export function cardinalDirection(azimuth: number): string {
  const points = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSO', 'SO', 'OSO', 'O', 'ONO', 'NO', 'NNO'];
  return points[Math.round((((azimuth % 360) + 360) % 360) / 22.5) % 16];
}
