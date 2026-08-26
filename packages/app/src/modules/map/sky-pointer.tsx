import { StyleSheet, View } from 'react-native';

import { ISS_ACCENT, MOON_ACCENT, SUN_ACCENT } from './accents';
import type { MapCoordinates } from './types';

import { ThemedText } from '@/components/themed-text';

const SIZE = 220;
const CENTER = SIZE / 2;
const RING_RADIUS = 88;
const TICK_LENGTH = 8;
const CARDINAL_OFFSET = RING_RADIUS + 16;

type CelestialAngle = {
  azimuth: number;
  elevation: number;
};

/**
 * Position sur la rose pour un azimut donné, nord toujours en haut — même
 * convention que `SkyCompass` : les azimuts réels sont tracés directement,
 * sans tenir compte du cap caméra.
 */
function polar(azimuth: number, radius: number) {
  const theta = (azimuth * Math.PI) / 180;
  return {
    x: CENTER + radius * Math.sin(theta),
    y: CENTER - radius * Math.cos(theta),
  };
}

function CelestialLine({ azimuth, elevation, color, markerSize }: CelestialAngle & { color: string; markerSize: number }) {
  const opacity = elevation > 0 ? 1 : 0.4;
  const tip = polar(azimuth, RING_RADIUS);

  return (
    <>
      <View
        style={[
          styles.line,
          {
            height: RING_RADIUS,
            backgroundColor: color,
            opacity,
            transform: [{ rotate: `${azimuth}deg` }],
          },
        ]}
      />
      <View
        style={[
          styles.marker,
          {
            left: tip.x - markerSize / 2,
            top: tip.y - markerSize / 2,
            width: markerSize,
            height: markerSize,
            borderRadius: markerSize / 2,
            backgroundColor: color,
            opacity,
          },
        ]}
      />
    </>
  );
}

/**
 * Pointeur central de la carte : réticule sur le point observé, rose des
 * vents nord-fixe autour, et un segment vers chaque astre disponible (Soleil
 * et Lune toujours, ISS seulement pendant un passage — `iss` vaut alors
 * `null`). Reprend la géométrie de l'ex-`SkyCompass`, en plus grand et sans
 * flèche de cap puisqu'il n'y a plus de petit cadran séparé à orienter.
 */
export function SkyPointer({
  center,
  centerX,
  centerY,
  sun,
  moon,
  iss,
}: {
  center: MapCoordinates;
  /** Centre horizontal en pixels écran, déjà ajusté pour le panneau latéral desktop. */
  centerX: number;
  centerY: number;
  sun: CelestialAngle;
  moon: CelestialAngle;
  iss: CelestialAngle | null;
}) {
  return (
    <View
      style={[styles.container, { left: centerX - CENTER, top: centerY - CENTER }]}
      pointerEvents="none">
      <View style={styles.ring} />

      <View style={[styles.tick, styles.tickTop]} />
      <View style={[styles.tick, styles.tickBottom]} />
      <View style={[styles.tick, styles.tickLeft]} />
      <View style={[styles.tick, styles.tickRight]} />

      <ThemedText type="code" style={[styles.cardinal, styles.cardinalNorth]}>
        N
      </ThemedText>
      <ThemedText type="code" style={[styles.cardinal, styles.cardinalSouth]}>
        S
      </ThemedText>
      <ThemedText type="code" style={[styles.cardinal, styles.cardinalEast]}>
        E
      </ThemedText>
      <ThemedText type="code" style={[styles.cardinal, styles.cardinalWest]}>
        O
      </ThemedText>

      <CelestialLine azimuth={sun.azimuth} elevation={sun.elevation} color={SUN_ACCENT} markerSize={10} />
      <CelestialLine azimuth={moon.azimuth} elevation={moon.elevation} color={MOON_ACCENT} markerSize={9} />
      {iss && <CelestialLine azimuth={iss.azimuth} elevation={iss.elevation} color={ISS_ACCENT} markerSize={9} />}

      <View style={styles.crosshairVertical} />
      <View style={styles.crosshairHorizontal} />
      <View style={styles.core} />

      <View style={styles.coordinates}>
        <ThemedText type="code" style={styles.coordinatesText}>
          {center.latitude.toFixed(4)}° / {center.longitude.toFixed(4)}°
        </ThemedText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    width: SIZE,
    height: SIZE,
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
  tick: {
    position: 'absolute',
    backgroundColor: '#FFFFFF44',
  },
  tickTop: {
    left: CENTER - 1,
    top: CENTER - RING_RADIUS - TICK_LENGTH / 2,
    width: 2,
    height: TICK_LENGTH,
  },
  tickBottom: {
    left: CENTER - 1,
    top: CENTER + RING_RADIUS - TICK_LENGTH / 2,
    width: 2,
    height: TICK_LENGTH,
  },
  tickLeft: {
    left: CENTER - RING_RADIUS - TICK_LENGTH / 2,
    top: CENTER - 1,
    width: TICK_LENGTH,
    height: 2,
  },
  tickRight: {
    left: CENTER + RING_RADIUS - TICK_LENGTH / 2,
    top: CENTER - 1,
    width: TICK_LENGTH,
    height: 2,
  },
  cardinal: {
    position: 'absolute',
    width: 18,
    textAlign: 'center',
    fontSize: 11,
    letterSpacing: 1,
    color: '#FFFFFF99',
  },
  cardinalNorth: {
    left: CENTER - 9,
    top: CENTER - CARDINAL_OFFSET - 7,
  },
  cardinalSouth: {
    left: CENTER - 9,
    top: CENTER + CARDINAL_OFFSET - 7,
  },
  cardinalEast: {
    left: CENTER + CARDINAL_OFFSET - 9,
    top: CENTER - 7,
  },
  cardinalWest: {
    left: CENTER - CARDINAL_OFFSET - 9,
    top: CENTER - 7,
  },
  line: {
    position: 'absolute',
    left: CENTER - 1,
    top: CENTER - RING_RADIUS,
    width: 2,
    borderRadius: 1,
    transformOrigin: 'bottom',
  },
  marker: {
    position: 'absolute',
  },
  crosshairVertical: {
    position: 'absolute',
    left: CENTER - 1,
    top: CENTER - 12,
    width: 2,
    height: 24,
    backgroundColor: '#FFFFFFCC',
  },
  crosshairHorizontal: {
    position: 'absolute',
    left: CENTER - 12,
    top: CENTER - 1,
    width: 24,
    height: 2,
    backgroundColor: '#FFFFFFCC',
  },
  core: {
    position: 'absolute',
    left: CENTER - 3,
    top: CENTER - 3,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#FFFFFFCC',
  },
  coordinates: {
    position: 'absolute',
    left: CENTER - 70,
    top: CENTER + 16,
    width: 140,
    alignItems: 'center',
    backgroundColor: '#0B1016CC',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#FFFFFF22',
    paddingVertical: 3,
    paddingHorizontal: 6,
  },
  coordinatesText: {
    fontSize: 11,
    color: '#FFFFFFCC',
  },
});
