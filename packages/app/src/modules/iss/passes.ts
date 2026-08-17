/**
 * Détection des prochains passages visibles à l'œil nu.
 *
 * Un passage est visible quand les trois conditions sont réunies : la station est
 * assez haute sur l'horizon, elle est encore éclairée par le Soleil, et
 * l'observateur est dans le crépuscule ou la nuit.
 */

import type { SatRec } from 'satellite.js';

import { getSunPosition } from '@/modules/sun-moon';

import { getIssVisibility, observerGeodetic, type Observer } from './orbit';

/** Hauteur minimale pour qu'un passage soit réellement observable. */
export const MIN_PASS_ELEVATION = 10;
/** Le Soleil doit être au moins sous le crépuscule civil chez l'observateur. */
export const MAX_SUN_ELEVATION = -6;

const SCAN_STEP_MS = 30_000;
const SCAN_HORIZON_MS = 48 * 3_600_000;

export type IssPass = {
  /** Instant où la station devient visible. */
  start: Date;
  /** Fin de la fenêtre de visibilité. */
  end: Date;
  /** Instant de la culmination. */
  peak: Date;
  /** Durée totale du passage, en secondes. */
  durationSeconds: number;
  /** Hauteur maximale atteinte pendant le passage, en degrés. */
  maxElevation: number;
  /** Azimut d'apparition, en degrés. */
  startAzimuth: number;
  /** Azimut à la culmination, en degrés. */
  peakAzimuth: number;
  /** Azimut de disparition, en degrés. */
  endAzimuth: number;
};

type Sample = {
  date: Date;
  azimuth: number;
  elevation: number;
};

function buildPass(first: Sample, last: Sample, peak: Sample): IssPass {
  return {
    start: first.date,
    end: last.date,
    peak: peak.date,
    durationSeconds: (last.date.getTime() - first.date.getTime()) / 1000,
    maxElevation: peak.elevation,
    startAzimuth: first.azimuth,
    peakAzimuth: peak.azimuth,
    endAzimuth: last.azimuth,
  };
}

/**
 * Balayage pas à pas sur les 48 h à venir. La position solaire est évaluée en
 * premier : elle est bien moins coûteuse que SGP4 et élimine d'emblée toutes
 * les heures diurnes.
 */
export function findNextVisiblePass(
  satrec: SatRec,
  observer: Observer,
  from: Date
): IssPass | null {
  const observerGd = observerGeodetic(observer);
  const limit = from.getTime() + SCAN_HORIZON_MS;

  let first: Sample | null = null;
  let last: Sample | null = null;
  let peak: Sample | null = null;

  for (let epochMs = from.getTime(); epochMs <= limit; epochMs += SCAN_STEP_MS) {
    const date = new Date(epochMs);
    const sun = getSunPosition(observer.latitude, observer.longitude, date);
    const iss =
      sun.elevation < MAX_SUN_ELEVATION ? getIssVisibility(satrec, observerGd, date) : null;

    if (iss !== null && iss.sunlit && iss.elevation > MIN_PASS_ELEVATION) {
      const sample: Sample = { date, azimuth: iss.azimuth, elevation: iss.elevation };
      first ??= sample;
      last = sample;
      if (peak === null || sample.elevation > peak.elevation) peak = sample;
    } else if (first !== null && last !== null && peak !== null) {
      return buildPass(first, last, peak);
    }
  }

  return first !== null && last !== null && peak !== null
    ? buildPass(first, last, peak)
    : null;
}
