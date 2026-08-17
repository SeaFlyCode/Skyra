/**
 * Primitives astronomiques partagées — 100% offline, aucun appel réseau.
 * Toutes les fonctions sont pures : mêmes entrées, mêmes sorties.
 */

export const MS_PER_MINUTE = 60_000;
export const MS_PER_DAY = 86_400_000;

/** Jour julien du 1.5 janvier 2000 (époque J2000.0). */
export const J2000 = 2_451_545;

/** Rayon équatorial terrestre en km (WGS84), pour la parallaxe lunaire. */
const EARTH_RADIUS_KM = 6378.14;

const DEG = Math.PI / 180;

export const toRad = (deg: number): number => deg * DEG;
export const toDeg = (rad: number): number => rad / DEG;

export const sind = (deg: number): number => Math.sin(deg * DEG);
export const cosd = (deg: number): number => Math.cos(deg * DEG);
export const tand = (deg: number): number => Math.tan(deg * DEG);

/** Ramène un angle dans [0, 360). */
export function norm360(deg: number): number {
  const value = deg % 360;
  return value < 0 ? value + 360 : value;
}

/** Ramène une fraction dans [0, 1). */
export function norm1(value: number): number {
  const fraction = value % 1;
  return fraction < 0 ? fraction + 1 : fraction;
}

/** Jour julien à partir d'un timestamp epoch (ms). */
export function julianDay(epochMs: number): number {
  return epochMs / MS_PER_DAY + 2_440_587.5;
}

/** Siècles juliens écoulés depuis J2000.0. */
export function julianCenturies(jd: number): number {
  return (jd - J2000) / 36525;
}

/** Obliquité moyenne de l'écliptique, corrigée de la nutation principale (degrés). */
export function obliquity(t: number): number {
  const mean = 23 + (26 + (21.448 - t * (46.815 + t * (0.00059 - t * 0.001813))) / 60) / 60;
  return mean + 0.00256 * cosd(125.04 - 1934.136 * t);
}

/** Temps sidéral de Greenwich apparent, en degrés. */
export function greenwichSiderealTime(jd: number): number {
  const t = julianCenturies(jd);
  return norm360(280.46061837 + 360.98564736629 * (jd - J2000) + 0.000387933 * t * t);
}

export type EquatorialCoords = {
  /** Ascension droite en degrés. */
  rightAscension: number;
  /** Déclinaison en degrés. */
  declination: number;
};

export type HorizontalCoords = {
  /** Azimut en degrés depuis le Nord, sens horaire (Est = 90°). */
  azimuth: number;
  /** Hauteur géométrique au-dessus de l'horizon, en degrés. */
  elevation: number;
};

/** Conversion écliptique géocentrique → équatorial. */
export function eclipticToEquatorial(
  longitude: number,
  latitude: number,
  eps: number
): EquatorialCoords {
  const rightAscension = toDeg(
    Math.atan2(
      sind(longitude) * cosd(eps) - tand(latitude) * sind(eps),
      cosd(longitude)
    )
  );
  const declination = toDeg(
    Math.asin(sind(latitude) * cosd(eps) + cosd(latitude) * sind(eps) * sind(longitude))
  );
  return { rightAscension: norm360(rightAscension), declination };
}

/** Conversion équatorial → horizontal pour un observateur donné. */
export function equatorialToHorizontal(
  coords: EquatorialCoords,
  latitude: number,
  longitude: number,
  jd: number
): HorizontalCoords {
  const hourAngle = greenwichSiderealTime(jd) + longitude - coords.rightAscension;
  const { declination: dec } = coords;

  const elevation = toDeg(
    Math.asin(sind(latitude) * sind(dec) + cosd(latitude) * cosd(dec) * cosd(hourAngle))
  );
  const azimuth = toDeg(
    Math.atan2(
      -cosd(dec) * sind(hourAngle),
      sind(dec) * cosd(latitude) - cosd(dec) * sind(latitude) * cosd(hourAngle)
    )
  );

  return { azimuth: norm360(azimuth), elevation };
}

/**
 * Réfraction atmosphérique (formule de Bennett), en degrés, pour conditions
 * standard 1010 hPa / 10 °C. Nulle sous l'horizon réfracté.
 */
export function refraction(elevation: number): number {
  if (elevation < -1) return 0;
  const arcminutes = 1.02 / tand(elevation + 10.3 / (elevation + 5.11));
  return arcminutes / 60;
}

/**
 * Corrige une hauteur géocentrique en hauteur topocentrique (parallaxe diurne).
 * Négligeable pour le Soleil, mais vaut jusqu'à ~1° pour la Lune.
 */
export function parallaxCorrection(elevation: number, distanceKm: number): number {
  const horizontalParallax = toDeg(Math.asin(EARTH_RADIUS_KM / distanceKm));
  return elevation - horizontalParallax * cosd(elevation);
}

/**
 * Début (UTC, en ms) du jour solaire local à cette longitude — base de tous les
 * calculs de lever/coucher. Évite les décalages d'un jour loin de Greenwich.
 */
export function solarDayStart(epochMs: number, longitude: number): number {
  const shifted = new Date(epochMs + (longitude / 15) * 3_600_000);
  return Date.UTC(shifted.getUTCFullYear(), shifted.getUTCMonth(), shifted.getUTCDate());
}
