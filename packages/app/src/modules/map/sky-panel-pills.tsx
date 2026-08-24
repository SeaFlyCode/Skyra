import { StyleSheet, View } from 'react-native';

import { ISS_ACCENT, MOON_ACCENT, SUN_ACCENT } from './accents';
import type { SkyData } from './use-sky-data';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { formatAngle, formatTime } from '@/modules/sun-moon';

/**
 * Puces compactes Soleil / Lune / ISS : une ligne en bottom sheet mobile
 * replié, une colonne dans le panneau latéral desktop replié.
 */
export function SkyPanelPills({ data, direction }: { data: SkyData; direction: 'row' | 'column' }) {
  const { sun, moonPhase, iss } = data;

  const issValue =
    iss.status === 'pending' ? '…' : iss.nextPass ? formatTime(iss.nextPass.start) : '—';

  return (
    <View style={[styles.container, direction === 'column' && styles.containerColumn]}>
      <Pill
        color={SUN_ACCENT}
        label="Soleil"
        value={formatAngle(sun.elevation)}
        flex={direction === 'row'}
      />
      <Pill
        color={MOON_ACCENT}
        label="Lune"
        value={`${Math.round(moonPhase.illumination * 100)} %`}
        flex={direction === 'row'}
      />
      <Pill color={ISS_ACCENT} label="ISS" value={issValue} flex={direction === 'row'} />
    </View>
  );
}

function Pill({
  color,
  label,
  value,
  flex,
}: {
  color: string;
  label: string;
  value: string;
  flex: boolean;
}) {
  return (
    <View style={[styles.pill, flex && styles.pillFlex]}>
      <View style={[styles.dot, { backgroundColor: color }]} />
      <View style={styles.pillText}>
        <ThemedText type="code" style={styles.pillLabel}>
          {label}
        </ThemedText>
        <ThemedText type="code" style={styles.pillValue}>
          {value}
        </ThemedText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    gap: Spacing.two + Spacing.half,
  },
  containerColumn: {
    flexDirection: 'column',
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    backgroundColor: '#FFFFFF0D',
    borderRadius: Spacing.four - Spacing.two,
    paddingVertical: Spacing.two + Spacing.half,
    paddingHorizontal: Spacing.three,
  },
  pillFlex: {
    flex: 1,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    flexShrink: 0,
  },
  pillText: {
    gap: 1,
    minWidth: 0,
  },
  pillLabel: {
    fontSize: 11,
    color: '#FFFFFF66',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  pillValue: {
    fontSize: 13,
    fontWeight: '500',
    color: '#FFFFFFCC',
  },
});
