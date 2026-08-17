import { useCallback, useEffect, useRef, useState } from 'react';
import { Platform, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { DEFAULT_OBSERVER, useObserverLocation } from '@/hooks/use-observer-location';
import {
  ReliefMap,
  SkyCompass,
  tileProfileNotice,
  type MapCoordinates,
  type MapStatus,
  type MapViewState,
} from '@/modules/map';

const REFRESH_INTERVAL_MS = 30_000;

/** La barre d'onglets web est ancrée en haut de l'écran et recouvre la carte. */
const WEB_TAB_BAR_HEIGHT = 72;

/**
 * Seuils en dessous desquels un mouvement de caméra ne change rien de visible :
 * ils évitent un rendu React à chaque frame pendant un pan ou une rotation.
 */
const CENTER_EPSILON = 0.0002;
const BEARING_EPSILON = 0.25;

function MapOverlay({
  center,
  bearing,
  status,
  errorMessage,
}: {
  center: MapCoordinates;
  bearing: number;
  status: MapStatus;
  errorMessage: string | null;
}) {
  const insets = useSafeAreaInsets();
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    setNow(new Date());
    const timer = setInterval(() => setNow(new Date()), REFRESH_INTERVAL_MS);
    return () => clearInterval(timer);
  }, []);

  const topInset =
    Platform.OS === 'web' ? WEB_TAB_BAR_HEIGHT : insets.top + Spacing.two;

  return (
    <View
      style={[styles.overlay, { paddingTop: topInset }]}
      pointerEvents="box-none">
      <View style={styles.overlayTop} pointerEvents="box-none">
        <View style={styles.badge}>
          <ThemedText type="code" style={styles.badgeTitle}>
            CENTRE DE LA VUE
          </ThemedText>
          <ThemedText type="code" style={styles.badgeValue}>
            {center.latitude.toFixed(4)}° / {center.longitude.toFixed(4)}°
          </ThemedText>
        </View>

        {now && <SkyCompass center={center} bearing={bearing} date={now} />}
      </View>

      <View style={styles.overlayBottom} pointerEvents="box-none">
        {status === 'error' && errorMessage && (
          <View style={[styles.badge, styles.badgeError]}>
            <ThemedText type="code" style={styles.badgeValue}>
              {errorMessage}
            </ThemedText>
          </View>
        )}
        {tileProfileNotice && (
          <View style={styles.badge}>
            <ThemedText type="code" style={styles.badgeValue}>
              {tileProfileNotice}
            </ThemedText>
          </View>
        )}
      </View>
    </View>
  );
}

export default function MapScreen() {
  const { location, status: locationStatus, fallbackReason, retry } = useObserverLocation();

  const [view, setView] = useState<{ center: MapCoordinates; bearing: number } | null>(null);
  const [mapStatus, setMapStatus] = useState<MapStatus>('loading');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const viewRef = useRef(view);
  viewRef.current = view;

  const handleViewStateChange = useCallback((next: MapViewState) => {
    const current = viewRef.current;
    if (
      current &&
      Math.abs(current.center.latitude - next.center.latitude) < CENTER_EPSILON &&
      Math.abs(current.center.longitude - next.center.longitude) < CENTER_EPSILON &&
      Math.abs(current.bearing - next.bearing) < BEARING_EPSILON
    ) {
      return;
    }
    setView({ center: next.center, bearing: next.bearing });
  }, []);

  const handleStatusChange = useCallback((next: MapStatus, message: string | null) => {
    setMapStatus(next);
    setErrorMessage(message);
  }, []);

  // La carte ne se recentre pas après coup : on attend la position de départ
  // pour la monter une seule fois, avec le bon point de vue.
  if (locationStatus === 'pending') {
    return (
      <ThemedView style={styles.centered}>
        <ThemedText type="small" themeColor="textSecondary">
          Recherche de votre position…
        </ThemedText>
      </ThemedView>
    );
  }

  return (
    <View style={styles.screen}>
      <ReliefMap
        initialCenter={location}
        onViewStateChange={handleViewStateChange}
        onStatusChange={handleStatusChange}
        style={StyleSheet.absoluteFill}
      />

      <MapOverlay
        center={view?.center ?? location}
        bearing={view?.bearing ?? 0}
        status={mapStatus}
        errorMessage={errorMessage}
      />

      {locationStatus === 'fallback' && (
        <Pressable
          onPress={retry}
          style={({ pressed }) => [styles.retry, pressed && styles.pressed]}>
          <ThemedText type="code" style={styles.badgeValue}>
            {fallbackReason} — vue centrée sur {DEFAULT_OBSERVER.label}. Réessayer
          </ThemedText>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#0B1016',
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    padding: Spacing.three,
    justifyContent: 'space-between',
  },
  overlayTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: Spacing.two,
  },
  overlayBottom: {
    alignItems: 'flex-start',
    gap: Spacing.two,
    maxWidth: 420,
  },
  badge: {
    backgroundColor: '#0B1016CC',
    borderRadius: Spacing.two,
    borderWidth: 1,
    borderColor: '#FFFFFF22',
    paddingVertical: Spacing.one,
    paddingHorizontal: Spacing.two,
    gap: Spacing.half,
  },
  badgeError: {
    borderColor: '#E8533D88',
  },
  badgeTitle: {
    color: '#FFFFFF66',
    letterSpacing: 1,
  },
  badgeValue: {
    color: '#FFFFFFCC',
  },
  retry: {
    position: 'absolute',
    bottom: Spacing.six,
    alignSelf: 'center',
    backgroundColor: '#0B1016DD',
    borderRadius: Spacing.two,
    borderWidth: 1,
    borderColor: '#FFFFFF33',
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.three,
  },
  pressed: {
    opacity: 0.7,
  },
});
