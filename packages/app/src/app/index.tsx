import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, StyleSheet, useWindowDimensions, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { DEFAULT_OBSERVER, useObserverLocation } from '@/hooks/use-observer-location';
import {
  celestialGroundPoint,
  DESKTOP_BREAKPOINT,
  LocationBadge,
  MapToolbar,
  ReliefMap,
  SIDE_PANEL_WIDTH,
  SkyPanel,
  SkyPointer,
  tileProfileNotice,
  useSkyData,
  type MapCoordinates,
  type MapStatus,
  type MapViewState,
  type SkyData,
  type SkyOverlay,
} from '@/modules/map';

const REFRESH_INTERVAL_MS = 30_000;

/**
 * Seuils en dessous desquels un mouvement de caméra ne change rien de visible :
 * ils évitent un rendu React à chaque frame pendant un pan ou une rotation.
 */
const CENTER_EPSILON = 0.0002;
const BEARING_EPSILON = 0.25;

function MapOverlay({
  center,
  status,
  errorMessage,
  now,
  skyData,
}: {
  center: MapCoordinates;
  status: MapStatus;
  errorMessage: string | null;
  /** `null` tant que la première horloge n'a pas encore tiqué. */
  now: Date | null;
  skyData: SkyData;
}) {
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();

  const topInset = insets.top + Spacing.two;
  // Le panneau Ciel desktop occupe toute la colonne droite : les outils
  // flottants, ancrés à droite, doivent se décaler pour ne pas passer dessous.
  const isSidePanel = width >= DESKTOP_BREAKPOINT;
  // Le pointeur central se centre sur la zone de carte réellement visible :
  // en layout desktop, la colonne droite est occupée par le panneau latéral.
  const pointerCenterX = isSidePanel ? (width - SIDE_PANEL_WIDTH) / 2 : width / 2;
  const pointerCenterY = height / 2;

  return (
    <View style={[styles.overlay, { paddingTop: topInset }]} pointerEvents="box-none">
      <View style={styles.overlayTop} pointerEvents="box-none">
        <LocationBadge center={center} />

        <View
          style={[styles.rightColumn, isSidePanel && { marginRight: SIDE_PANEL_WIDTH + Spacing.three }]}
          pointerEvents="box-none">
          <MapToolbar />
        </View>
      </View>

      {now && (
        <SkyPointer
          center={center}
          centerX={pointerCenterX}
          centerY={pointerCenterY}
          sun={skyData.sun}
          moon={skyData.moon}
          iss={skyData.iss.position}
        />
      )}

      <View style={styles.overlayNotices} pointerEvents="box-none">
        {status === 'error' && errorMessage && (
          <View style={[styles.badge, styles.badgeError]} pointerEvents="none">
            <ThemedText type="code" style={styles.badgeValue}>
              {errorMessage}
            </ThemedText>
          </View>
        )}
        {tileProfileNotice && (
          <View style={styles.badge} pointerEvents="none">
            <ThemedText type="code" style={styles.badgeValue}>
              {tileProfileNotice}
            </ThemedText>
          </View>
        )}
      </View>

      {now && <SkyPanel data={skyData} now={now} topInset={topInset} />}
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

  // Horloge partagée par le panneau Ciel et les overlays 3D de la carte —
  // un seul timer plutôt qu'un par consommateur.
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => {
    setNow(new Date());
    const timer = setInterval(() => setNow(new Date()), REFRESH_INTERVAL_MS);
    return () => clearInterval(timer);
  }, []);

  // Calculé sur la position réelle de l'observateur, pas le centre pané de la
  // carte : le panneau Ciel et les overlays 3D partagent cette même lecture
  // (et le même hook ISS, dont le TLE ne doit être récupéré qu'une fois).
  const skyData = useSkyData(location, now ?? new Date());

  const skyOverlay: SkyOverlay | undefined = useMemo(() => {
    if (!now) return undefined;
    return {
      issPosition: skyData.iss.position
        ? { latitude: skyData.iss.position.latitude, longitude: skyData.iss.position.longitude }
        : null,
      issTrail: skyData.iss.trail,
      sun: celestialGroundPoint(location, skyData.sun.azimuth, skyData.sun.elevation),
      moon: celestialGroundPoint(location, skyData.moon.azimuth, skyData.moon.elevation),
    };
  }, [
    now,
    location,
    skyData.sun.azimuth,
    skyData.sun.elevation,
    skyData.moon.azimuth,
    skyData.moon.elevation,
    skyData.iss.position,
    skyData.iss.trail,
  ]);

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
    <GestureHandlerRootView style={styles.screen}>
      <View style={styles.screen}>
        <ReliefMap
          initialCenter={location}
          onViewStateChange={handleViewStateChange}
          onStatusChange={handleStatusChange}
          skyOverlay={skyOverlay}
          style={StyleSheet.absoluteFill}
        />

        <MapOverlay
          center={view?.center ?? location}
          status={mapStatus}
          errorMessage={errorMessage}
          now={now}
          skyData={skyData}
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
    </GestureHandlerRootView>
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
  },
  overlayTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: Spacing.two,
  },
  rightColumn: {
    alignItems: 'flex-end',
    gap: Spacing.three,
  },
  overlayNotices: {
    marginTop: Spacing.two,
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
  badgeValue: {
    color: '#FFFFFFCC',
  },
  retry: {
    position: 'absolute',
    bottom: 190,
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
