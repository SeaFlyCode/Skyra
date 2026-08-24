import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';

import { MOON_ACCENT, SUN_ACCENT } from './accents';
import type { MapCoordinates } from './types';

import { ThemedText } from '@/components/themed-text';
import { getMoonPosition, getSunPosition } from '@/modules/sun-moon';

const DIAL_SIZE = 72;
const CENTER = DIAL_SIZE / 2;
const RING_RADIUS = 27;
const SUN_MARKER_SIZE = 8;
const MOON_MARKER_SIZE = 7;
const ARROW_LENGTH = 21;

/**
 * Position sur le cadran pour un azimut donné, cadran toujours nord en haut :
 * contrairement à l'ancienne version, seule la flèche de cap (voir plus bas)
 * tourne avec la caméra — les astres restent à leur azimut géographique réel.
 */
function polar(azimuth: number, radius: number) {
  const theta = (azimuth * Math.PI) / 180;
  return {
    x: CENTER + radius * Math.sin(theta),
    y: CENTER - radius * Math.cos(theta),
  };
}

function Marker({
  azimuth,
  elevation,
  size,
  color,
}: {
  azimuth: number;
  elevation: number;
  size: number;
  color: string;
}) {
  const { x, y } = polar(azimuth, RING_RADIUS);
  return (
    <View
      style={[
        styles.marker,
        {
          left: x - size / 2,
          top: y - size / 2,
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: color,
          // Un astre sous l'horizon reste repéré sur le cadran, mais estompé.
          opacity: elevation > 0 ? 1 : 0.4,
        },
      ]}
    />
  );
}

/**
 * Cadran nord-fixe superposé à la carte : où sont le Soleil et la Lune vus
 * depuis le centre de la vue courante, à l'heure passée en `date`. La flèche
 * centrale indique elle la direction pointée par la caméra (son cap), donc
 * tourne avec `bearing`.
 */
export function SkyCompass({
  center,
  bearing,
  date,
}: {
  center: MapCoordinates;
  bearing: number;
  date: Date;
}) {
  const sun = useMemo(
    () => getSunPosition(center.latitude, center.longitude, date),
    [center.latitude, center.longitude, date]
  );
  const moon = useMemo(
    () => getMoonPosition(center.latitude, center.longitude, date),
    [center.latitude, center.longitude, date]
  );

  return (
    <View style={styles.dial} pointerEvents="none">
      <View style={styles.ring} />

      <ThemedText type="code" style={styles.northLabel}>
        N
      </ThemedText>

      <Marker azimuth={sun.azimuth} elevation={sun.elevation} size={SUN_MARKER_SIZE} color={SUN_ACCENT} />
      <Marker azimuth={moon.azimuth} elevation={moon.elevation} size={MOON_MARKER_SIZE} color={MOON_ACCENT} />

      <View style={[styles.arrow, { transform: [{ rotate: `${bearing}deg` }] }]} />
      <View style={styles.core} />
    </View>
  );
}

const styles = StyleSheet.create({
  dial: {
    width: DIAL_SIZE,
    height: DIAL_SIZE,
    borderRadius: DIAL_SIZE / 2,
    backgroundColor: '#0B1016CC',
    borderWidth: 1,
    borderColor: '#FFFFFF22',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ring: {
    position: 'absolute',
    left: CENTER - RING_RADIUS,
    top: CENTER - RING_RADIUS,
    width: RING_RADIUS * 2,
    height: RING_RADIUS * 2,
    borderRadius: RING_RADIUS,
    borderWidth: 1,
    borderColor: '#FFFFFF22',
  },
  northLabel: {
    position: 'absolute',
    top: 7,
    left: CENTER - 8,
    width: 16,
    textAlign: 'center',
    fontSize: 9,
    letterSpacing: 1,
    color: '#FFFFFF66',
  },
  marker: {
    position: 'absolute',
  },
  arrow: {
    position: 'absolute',
    left: CENTER - 1,
    top: CENTER - ARROW_LENGTH,
    width: 2,
    height: ARROW_LENGTH,
    borderRadius: 1,
    backgroundColor: '#FFFFFFCC',
    transformOrigin: 'bottom',
  },
  core: {
    position: 'absolute',
    left: CENTER - 2.5,
    top: CENTER - 2.5,
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#FFFFFFCC',
  },
});
