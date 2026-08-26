import { useEffect, useMemo, useRef, useState } from 'react';
import type { SatRec } from 'satellite.js';

import {
  createSatrec,
  findNextVisiblePass,
  getIssPosition,
  type IssPass,
  type IssPosition,
  type IssTle,
} from '@/modules/iss';

const API_BASE_URL = process.env.EXPO_PUBLIC_SHADOW_API_URL ?? 'http://localhost:3001';

/** Un TLE reste exploitable bien au-delà, mais on suit le rafraîchissement serveur. */
const TLE_TTL_MS = 3_600_000;
const POSITION_INTERVAL_MS = 3_000;

/** Fenêtre et pas d'échantillonnage de la trajectoire affichée sur la carte. */
const TRAIL_HALF_RANGE_MS = 12 * 60_000;
const TRAIL_STEP_MS = 60_000;

/** Point subsatellite seul, pour la trajectoire — pas besoin des angles observateur. */
export type IssTrailPoint = { latitude: number; longitude: number };

type CachedTle = {
  tle: IssTle;
  at: number;
};

/** Cache module : le TLE survit au démontage de l'écran. */
let cache: CachedTle | null = null;

async function fetchTle(signal: AbortSignal): Promise<IssTle> {
  const response = await fetch(`${API_BASE_URL}/tle/iss`, { signal });
  if (!response.ok) throw new Error(`TLE indisponible (${response.status})`);

  const payload: unknown = await response.json();
  if (
    typeof payload !== 'object' ||
    payload === null ||
    !('line1' in payload) ||
    !('line2' in payload) ||
    typeof payload.line1 !== 'string' ||
    typeof payload.line2 !== 'string'
  ) {
    throw new Error('TLE malformé');
  }

  const name = 'name' in payload && typeof payload.name === 'string' ? payload.name : 'ISS';
  return { name, line1: payload.line1, line2: payload.line2 };
}

export type IssState = {
  position: IssPosition | null;
  /** Trajectoire récente/à venir (~±12 min autour de maintenant), pour l'overlay carte. */
  trail: IssTrailPoint[];
  nextPass: IssPass | null;
  status: 'pending' | 'ready' | 'error';
  /** Message lisible en cas d'échec de récupération du TLE. */
  error: string | null;
};

/** Échantillonne la trajectoire subsatellite autour de `date`, sans les angles observateur. */
function buildTrail(satrec: SatRec, observer: { latitude: number; longitude: number }, date: Date): IssTrailPoint[] {
  const points: IssTrailPoint[] = [];
  for (let offset = -TRAIL_HALF_RANGE_MS; offset <= TRAIL_HALF_RANGE_MS; offset += TRAIL_STEP_MS) {
    const sample = getIssPosition(satrec, observer, new Date(date.getTime() + offset));
    if (sample) points.push({ latitude: sample.latitude, longitude: sample.longitude });
  }
  return points;
}

/**
 * Suit l'ISS pour un observateur donné : le TLE est récupéré une fois par heure,
 * la position est recalculée localement toutes les {@link POSITION_INTERVAL_MS}.
 */
export function useIssPosition(latitude: number, longitude: number): IssState {
  const [tle, setTle] = useState<IssTle | null>(
    cache && Date.now() - cache.at < TLE_TTL_MS ? cache.tle : null
  );
  const [error, setError] = useState<string | null>(null);
  const [position, setPosition] = useState<IssPosition | null>(null);
  const [trail, setTrail] = useState<IssTrailPoint[]>([]);
  const [nextPass, setNextPass] = useState<IssPass | null>(null);
  const passRef = useRef<IssPass | null>(null);

  useEffect(() => {
    if (cache && Date.now() - cache.at < TLE_TTL_MS) {
      setTle(cache.tle);
      return;
    }

    const controller = new AbortController();
    fetchTle(controller.signal)
      .then((fetched) => {
        cache = { tle: fetched, at: Date.now() };
        setTle(fetched);
        setError(null);
      })
      .catch((cause: unknown) => {
        if (controller.signal.aborted) return;
        setError(cause instanceof Error ? cause.message : 'TLE indisponible');
      });

    return () => controller.abort();
  }, []);

  const satrec: SatRec | null = useMemo(() => (tle ? createSatrec(tle) : null), [tle]);

  useEffect(() => {
    if (!satrec) return;

    const observer = { latitude, longitude };
    passRef.current = null;

    const tick = () => {
      const now = new Date();
      setPosition(getIssPosition(satrec, observer, now));
      setTrail(buildTrail(satrec, observer, now));

      if (!passRef.current || now >= passRef.current.end) {
        passRef.current = findNextVisiblePass(satrec, observer, now);
        setNextPass(passRef.current);
      }
    };

    tick();
    const timer = setInterval(tick, POSITION_INTERVAL_MS);
    return () => clearInterval(timer);
  }, [satrec, latitude, longitude]);

  const failure = error ?? (tle !== null && satrec === null ? 'TLE illisible' : null);

  return {
    position,
    trail,
    nextPass,
    status: position ? 'ready' : failure !== null ? 'error' : 'pending',
    error: failure,
  };
}
