import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';

import type { MapCoordinates } from './types';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import {
  cardinalDirection,
  getMoonPhase,
  getMoonPosition,
  getSunPosition,
} from '@/modules/sun-moon';

export const SUN_ACCENT = '#E8A33D';
export const MOON_ACCENT = '#7FA6D8';

const DIAL_SIZE = 132;
const RADIUS = DIAL_SIZE / 2 - 15;
const MARKER_SIZE = 22;

const CARDINALS = [
  { label: 'N', angle: 0 },
  { label: 'E', angle: 90 },
  { label: 'S', angle: 180 },
  { label: 'O', angle: 270 },
];

/**
 * Convertit un azimut géographique en position sur le cadran, en tenant compte
 * de la rotation de la carte : le cadran reste aligné avec ce qui est affiché.
 */
function polar(azimuth: number, bearing: number, radius: number) {
  const theta = ((azimuth - bearing) * Math.PI) / 180;
  return {
    x: DIAL_SIZE / 2 + radius * Math.sin(theta),
    y: DIAL_SIZE / 2 - radius * Math.cos(theta),
  };
}

function Marker({
  azimuth,
  bearing,
  elevation,
  accent,
  glyph,
}: {
  azimuth: number;
  bearing: number;
  elevation: number;
  accent: string;
  glyph: string;
}) {
  const { x, y } = polar(azimuth, bearing, RADIUS);
  const belowHorizon = elevation <= 0;

  return (
    <View
      style={[
        styles.marker,
        {
          left: x - MARKER_SIZE / 2,
          top: y - MARKER_SIZE / 2,
          backgroundColor: belowHorizon ? 'transparent' : accent,
          borderColor: accent,
          opacity: belowHorizon ? 0.55 : 1,
        },
      ]}>
      <ThemedText
        type="code"
        style={[styles.markerGlyph, { color: belowHorizon ? accent : '#0B1016' }]}>
        {glyph}
      </ThemedText>
    </View>
  );
}

function Readout({
  label,
  accent,
  azimuth,
  elevation,
  detail,
}: {
  label: string;
  accent: string;
  azimuth: number;
  elevation: number;
  detail: string;
}) {
  return (
    <View style={styles.readoutRow}>
      <View style={[styles.readoutDot, { backgroundColor: accent }]} />
      <ThemedText type="code" style={styles.readoutLabel}>
        {label}
      </ThemedText>
      <ThemedText type="code" style={styles.readoutValue}>
        {azimuth.toFixed(0)}° {cardinalDirection(azimuth)} · {elevation > 0 ? '+' : ''}
        {elevation.toFixed(0)}° · {detail}
      </ThemedText>
    </View>
  );
}

/**
 * Cadran superposé à la carte : où sont le Soleil et la Lune vus depuis le
 * centre de la vue courante, à l'heure passée en `date`. La ligne pleine part
 * du centre dans la direction où tombent les ombres (azimut solaire + 180°).
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
  const phase = useMemo(() => getMoonPhase(date), [date]);

  return (
    <View style={styles.container} pointerEvents="none">
      <View style={styles.dial}>
        <View style={styles.dialRing} />
        <View style={styles.dialCore} />

        {CARDINALS.map(({ label, angle }) => {
          const { x, y } = polar(angle, bearing, DIAL_SIZE / 2 - 6);
          return (
            <ThemedText
              key={label}
              type="code"
              style={[styles.cardinal, { left: x - 8, top: y - 7 }]}>
              {label}
            </ThemedText>
          );
        })}

        {sun.elevation > 0 && (
          <View
            style={[
              styles.shadowRay,
              {
                height: RADIUS,
                transform: [{ rotate: `${sun.azimuth - bearing + 180}deg` }],
              },
            ]}
          />
        )}

        <Marker
          azimuth={sun.azimuth}
          bearing={bearing}
          elevation={sun.elevation}
          accent={SUN_ACCENT}
          glyph="S"
        />
        <Marker
          azimuth={moon.azimuth}
          bearing={bearing}
          elevation={moon.elevation}
          accent={MOON_ACCENT}
          glyph="L"
        />
      </View>

      <View style={styles.readout}>
        <Readout
          label="SOLEIL"
          accent={SUN_ACCENT}
          azimuth={sun.azimuth}
          elevation={sun.elevation}
          detail={sun.elevation > 0 ? 'levé' : 'couché'}
        />
        <Readout
          label="LUNE  "
          accent={MOON_ACCENT}
          azimuth={moon.azimuth}
          elevation={moon.elevation}
          detail={`${Math.round(phase.illumination * 100)} %`}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'flex-end',
    gap: Spacing.two,
  },
  dial: {
    width: DIAL_SIZE,
    height: DIAL_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dialRing: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: DIAL_SIZE / 2,
    borderWidth: 1,
    borderColor: '#FFFFFF33',
    backgroundColor: '#0B1016AA',
  },
  dialCore: {
    width: Spacing.one,
    height: Spacing.one,
    borderRadius: Spacing.half,
    backgroundColor: '#FFFFFFCC',
  },
  cardinal: {
    position: 'absolute',
    width: 16,
    textAlign: 'center',
    color: '#FFFFFF99',
  },
  shadowRay: {
    position: 'absolute',
    width: 2,
    backgroundColor: '#FFFFFF55',
    transformOrigin: 'top',
  },
  marker: {
    position: 'absolute',
    width: MARKER_SIZE,
    height: MARKER_SIZE,
    borderRadius: MARKER_SIZE / 2,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  markerGlyph: {
    fontSize: 10,
    lineHeight: 12,
  },
  readout: {
    backgroundColor: '#0B1016CC',
    borderRadius: Spacing.two,
    borderWidth: 1,
    borderColor: '#FFFFFF22',
    paddingVertical: Spacing.one,
    paddingHorizontal: Spacing.two,
    gap: Spacing.half,
  },
  readoutRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
  },
  readoutDot: {
    width: Spacing.one,
    height: Spacing.one,
    borderRadius: Spacing.half,
  },
  readoutLabel: {
    color: '#FFFFFF',
  },
  readoutValue: {
    color: '#FFFFFFAA',
  },
});
