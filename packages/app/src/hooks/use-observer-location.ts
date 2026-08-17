import * as Location from 'expo-location';
import { useCallback, useEffect, useState } from 'react';

/** Repli utilisé tant que la position réelle n'est pas disponible. */
export const DEFAULT_OBSERVER = {
  latitude: 48.8566,
  longitude: 2.3522,
  label: 'Paris, France',
} as const;

export type ObserverLocation = {
  latitude: number;
  longitude: number;
};

export type ObserverLocationState = {
  location: ObserverLocation;
  status: 'pending' | 'granted' | 'fallback';
  /** Raison lisible du repli, `null` si la position est réelle. */
  fallbackReason: string | null;
};

const PENDING: ObserverLocationState = {
  location: DEFAULT_OBSERVER,
  status: 'pending',
  fallbackReason: null,
};

/**
 * Position de l'observateur, avec repli sur {@link DEFAULT_OBSERVER} si la
 * permission est refusée ou si le GPS est indisponible : l'écran reste utile
 * dans tous les cas puisque les calculs sont purement locaux.
 */
export function useObserverLocation() {
  const [state, setState] = useState<ObserverLocationState>(PENDING);

  const resolve = useCallback(async (signal: { cancelled: boolean }) => {
    try {
      const permission = await Location.requestForegroundPermissionsAsync();
      if (signal.cancelled) return;

      if (!permission.granted) {
        setState({
          location: DEFAULT_OBSERVER,
          status: 'fallback',
          fallbackReason: 'Localisation refusée',
        });
        return;
      }

      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      if (signal.cancelled) return;

      setState({
        location: {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        },
        status: 'granted',
        fallbackReason: null,
      });
    } catch {
      if (signal.cancelled) return;
      setState({
        location: DEFAULT_OBSERVER,
        status: 'fallback',
        fallbackReason: 'Position indisponible',
      });
    }
  }, []);

  useEffect(() => {
    const signal = { cancelled: false };
    resolve(signal);
    return () => {
      signal.cancelled = true;
    };
  }, [resolve]);

  const retry = useCallback(() => {
    setState(PENDING);
    resolve({ cancelled: false });
  }, [resolve]);

  return { ...state, retry };
}
