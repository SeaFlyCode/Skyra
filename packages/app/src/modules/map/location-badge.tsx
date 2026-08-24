import { StyleSheet, View } from 'react-native';

import type { MapCoordinates } from './types';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';

/**
 * Pastille de position : coordonnées du centre de la vue, en haut à gauche de
 * la carte. Purement informative — `pointerEvents="none"` laisse les gestes à
 * deux doigts (pitch/rotation) démarrés dessus atteindre la carte en dessous.
 */
export function LocationBadge({ center }: { center: MapCoordinates }) {
  return (
    <View style={styles.badge} pointerEvents="none">
      <ThemedText type="code" style={styles.icon}>
        ⌖
      </ThemedText>
      <ThemedText type="code" style={styles.value}>
        {center.latitude.toFixed(4)}° / {center.longitude.toFixed(4)}°
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    backgroundColor: '#0B1016CC',
    borderRadius: Spacing.four - Spacing.two,
    borderWidth: 1,
    borderColor: '#FFFFFF22',
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.three,
  },
  icon: {
    fontSize: 13,
    color: '#FFFFFF99',
  },
  value: {
    fontSize: 12,
    color: '#FFFFFFCC',
  },
});
