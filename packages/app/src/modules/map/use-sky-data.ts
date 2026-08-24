import { useMemo } from 'react';

import type { MapCoordinates } from './types';

import { useIssPosition } from '@/hooks/use-iss-position';
import { getMoonPhase, getMoonPosition, getSunPosition } from '@/modules/sun-moon';

/**
 * Rassemble les lectures Soleil / Lune / ISS utilisées par le panneau Ciel de
 * l'écran Carte. Recalculé à chaque tick de `now`, sur le même principe que
 * `SkyReadout` dans `app/sky.tsx` (mais sans dupliquer son code : les deux
 * s'appuient sur les mêmes fonctions pures de `modules/sun-moon`).
 */
export function useSkyData(location: MapCoordinates, now: Date) {
  const sun = useMemo(
    () => getSunPosition(location.latitude, location.longitude, now),
    [location.latitude, location.longitude, now]
  );
  const moon = useMemo(
    () => getMoonPosition(location.latitude, location.longitude, now),
    [location.latitude, location.longitude, now]
  );
  const moonPhase = useMemo(() => getMoonPhase(now), [now]);
  const iss = useIssPosition(location.latitude, location.longitude);

  return { sun, moon, moonPhase, iss };
}

export type SkyData = ReturnType<typeof useSkyData>;
