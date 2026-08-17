/**
 * Position du Soleil et heures clés — algorithme NOAA Solar Calculator.
 * Précision typique : < 0.02° sur la position, < 1 min sur les levers/couchers.
 */

import {
  MS_PER_MINUTE,
  cosd,
  eclipticToEquatorial,
  equatorialToHorizontal,
  julianCenturies,
  julianDay,
  norm360,
  obliquity,
  parallaxCorrection,
  refraction,
  sind,
  solarDayStart,
  tand,
  toDeg,
  toRad,
  type EquatorialCoords,
} from './astro';

/** Hauteur du centre du disque solaire au lever/coucher (réfraction + demi-diamètre). */
export const SUNRISE_ALTITUDE = -0.833;
/** Limite du crépuscule civil. */
export const CIVIL_TWILIGHT_ALTITUDE = -6;
/** Limite basse de la golden hour / haute de la blue hour. */
export const GOLDEN_HOUR_LOW_ALTITUDE = -4;
/** Limite haute de la golden hour. */
export const GOLDEN_HOUR_HIGH_ALTITUDE = 6;

const UNIT_ASTRONOMICAL_KM = 149_597_870.7;

type SunEcliptic = EquatorialCoords & {
  /** Longitude écliptique apparente en degrés. */
  apparentLongitude: number;
  /** Équation du temps en minutes. */
  equationOfTime: number;
  /** Distance Terre–Soleil en km. */
  distanceKm: number;
  /** Obliquité corrigée en degrés. */
  obliquity: number;
};

/** Éléments solaires géocentriques pour un jour julien donné. */
export function sunEcliptic(jd: number): SunEcliptic {
  const t = julianCenturies(jd);

  const meanLongitude = norm360(280.46646 + t * (36000.76983 + 0.0003032 * t));
  const meanAnomaly = 357.52911 + t * (35999.05029 - 0.0001537 * t);
  const eccentricity = 0.016708634 - t * (0.000042037 + 0.0000001267 * t);

  const center =
    sind(meanAnomaly) * (1.914602 - t * (0.004817 + 0.000014 * t)) +
    sind(2 * meanAnomaly) * (0.019993 - 0.000101 * t) +
    sind(3 * meanAnomaly) * 0.000289;

  const trueLongitude = meanLongitude + center;
  const trueAnomaly = meanAnomaly + center;
  const apparentLongitude =
    trueLongitude - 0.00569 - 0.00478 * sind(125.04 - 1934.136 * t);

  const eps = obliquity(t);
  const equatorial = eclipticToEquatorial(apparentLongitude, 0, eps);

  const radiusVector =
    (1.000001018 * (1 - eccentricity * eccentricity)) / (1 + eccentricity * cosd(trueAnomaly));

  const y = tand(eps / 2) ** 2;
  const equationOfTime =
    4 *
    toDeg(
      y * Math.sin(2 * toRad(meanLongitude)) -
        2 * eccentricity * Math.sin(toRad(meanAnomaly)) +
        4 * eccentricity * y * Math.sin(toRad(meanAnomaly)) * Math.cos(2 * toRad(meanLongitude)) -
        0.5 * y * y * Math.sin(4 * toRad(meanLongitude)) -
        1.25 * eccentricity * eccentricity * Math.sin(2 * toRad(meanAnomaly))
    );

  return {
    ...equatorial,
    apparentLongitude,
    equationOfTime,
    distanceKm: radiusVector * UNIT_ASTRONOMICAL_KM,
    obliquity: eps,
  };
}

export type SunPosition = {
  /** Azimut en degrés depuis le Nord, sens horaire. */
  azimuth: number;
  /** Hauteur géométrique au-dessus de l'horizon, en degrés. */
  elevation: number;
  /** Hauteur apparente (réfraction atmosphérique incluse), en degrés. */
  apparentElevation: number;
  /** Déclinaison solaire du moment, en degrés. */
  declination: number;
  /** Distance Terre–Soleil en km. */
  distanceKm: number;
};

/** Position du Soleil pour un observateur et un instant donnés. */
export function getSunPosition(latitude: number, longitude: number, date: Date): SunPosition {
  const jd = julianDay(date.getTime());
  const sun = sunEcliptic(jd);
  const { azimuth, elevation } = equatorialToHorizontal(sun, latitude, longitude, jd);
  const topocentric = parallaxCorrection(elevation, sun.distanceKm);

  return {
    azimuth,
    elevation: topocentric,
    apparentElevation: topocentric + refraction(topocentric),
    declination: sun.declination,
    distanceKm: sun.distanceKm,
  };
}

/**
 * Angle horaire (degrés) auquel le Soleil atteint une hauteur donnée.
 * `null` si cette hauteur n'est jamais atteinte (jour ou nuit polaire).
 */
function hourAngleAtAltitude(
  altitude: number,
  latitude: number,
  declination: number
): number | null {
  const cosHourAngle =
    (sind(altitude) - sind(latitude) * sind(declination)) / (cosd(latitude) * cosd(declination));
  if (cosHourAngle > 1 || cosHourAngle < -1) return null;
  return toDeg(Math.acos(cosHourAngle));
}

function solarNoonMs(dayStart: number, longitude: number): number {
  let noon = dayStart + (720 - 4 * longitude) * MS_PER_MINUTE;
  for (let pass = 0; pass < 2; pass++) {
    const { equationOfTime } = sunEcliptic(julianDay(noon));
    noon = dayStart + (720 - 4 * longitude - equationOfTime) * MS_PER_MINUTE;
  }
  return noon;
}

/**
 * Instant où le Soleil franchit une hauteur donnée.
 * `direction` : -1 le matin (avant midi solaire), +1 le soir.
 * Deux passes de raffinement : la déclinaison est réévaluée à l'heure estimée.
 */
function altitudeCrossing(
  dayStart: number,
  latitude: number,
  longitude: number,
  altitude: number,
  direction: -1 | 1,
  noonMs: number
): Date | null {
  let epochMs = noonMs;
  for (let pass = 0; pass < 2; pass++) {
    const { declination, equationOfTime } = sunEcliptic(julianDay(epochMs));
    const hourAngle = hourAngleAtAltitude(altitude, latitude, declination);
    if (hourAngle === null) return null;
    const noon = dayStart + (720 - 4 * longitude - equationOfTime) * MS_PER_MINUTE;
    epochMs = noon + direction * hourAngle * 4 * MS_PER_MINUTE;
  }
  return new Date(epochMs);
}

export type TimeWindow = {
  start: Date | null;
  end: Date | null;
};

export type SunTimes = {
  /** Culmination du Soleil. */
  solarNoon: Date;
  /** Lever du Soleil, `null` en jour ou nuit polaire. */
  sunrise: Date | null;
  /** Coucher du Soleil, `null` en jour ou nuit polaire. */
  sunset: Date | null;
  /** Aube civile (Soleil à -6°). */
  civilDawn: Date | null;
  /** Crépuscule civil (Soleil à -6°). */
  civilDusk: Date | null;
  /** Golden hour du matin : Soleil de -4° à +6°. */
  goldenHourMorning: TimeWindow;
  /** Golden hour du soir : Soleil de +6° à -4°. */
  goldenHourEvening: TimeWindow;
  /** Blue hour du matin : Soleil de -6° à -4°. */
  blueHourMorning: TimeWindow;
  /** Blue hour du soir : Soleil de -4° à -6°. */
  blueHourEvening: TimeWindow;
  /** Durée du jour en minutes, `null` si pas de lever/coucher. */
  dayLengthMinutes: number | null;
  /** Le Soleil ne se couche pas de la journée. */
  polarDay: boolean;
  /** Le Soleil ne se lève pas de la journée. */
  polarNight: boolean;
};

/**
 * Heures clés du jour solaire local contenant `date`.
 * Les `Date` retournées sont des instants absolus : elles peuvent tomber sur la
 * date UTC voisine près des méridiens extrêmes, ce qui est correct.
 */
export function getSunTimes(latitude: number, longitude: number, date: Date): SunTimes {
  const dayStart = solarDayStart(date.getTime(), longitude);
  const noonMs = solarNoonMs(dayStart, longitude);
  const solarNoon = new Date(noonMs);

  const at = (altitude: number, direction: -1 | 1) =>
    altitudeCrossing(dayStart, latitude, longitude, altitude, direction, noonMs);

  const sunrise = at(SUNRISE_ALTITUDE, -1);
  const sunset = at(SUNRISE_ALTITUDE, 1);

  const polarDay =
    sunrise === null &&
    getSunPosition(latitude, longitude, solarNoon).elevation > SUNRISE_ALTITUDE;
  const polarNight = sunrise === null && !polarDay;

  return {
    solarNoon,
    sunrise,
    sunset,
    civilDawn: at(CIVIL_TWILIGHT_ALTITUDE, -1),
    civilDusk: at(CIVIL_TWILIGHT_ALTITUDE, 1),
    goldenHourMorning: {
      start: at(GOLDEN_HOUR_LOW_ALTITUDE, -1),
      end: at(GOLDEN_HOUR_HIGH_ALTITUDE, -1),
    },
    goldenHourEvening: {
      start: at(GOLDEN_HOUR_HIGH_ALTITUDE, 1),
      end: at(GOLDEN_HOUR_LOW_ALTITUDE, 1),
    },
    blueHourMorning: {
      start: at(CIVIL_TWILIGHT_ALTITUDE, -1),
      end: at(GOLDEN_HOUR_LOW_ALTITUDE, -1),
    },
    blueHourEvening: {
      start: at(GOLDEN_HOUR_LOW_ALTITUDE, 1),
      end: at(CIVIL_TWILIGHT_ALTITUDE, 1),
    },
    dayLengthMinutes:
      sunrise && sunset ? (sunset.getTime() - sunrise.getTime()) / MS_PER_MINUTE : null,
    polarDay,
    polarNight,
  };
}
