import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { SkyPanelCards } from './sky-panel-cards';
import { SkyPanelPills } from './sky-panel-pills';
import type { SkyData } from './use-sky-data';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { formatTime } from '@/modules/sun-moon';

export const SIDE_PANEL_WIDTH = 380;

/**
 * Panneau latéral desktop : ancré à droite, toujours visible, hauteur pleine
 * sous la barre d'onglets web. Pas de geste de drag tactile ici — seul le
 * chevron déplie/replie, ce qui a plus de sens à la souris qu'un bottom sheet
 * plein écran qui gâcherait l'espace carte sur un grand viewport.
 */
export function SkyPanelSide({
  data,
  now,
  expanded,
  onExpandedChange,
  topInset,
}: {
  data: SkyData;
  now: Date;
  expanded: boolean;
  onExpandedChange: (value: boolean) => void;
  topInset: number;
}) {
  return (
    <View style={[styles.panel, { top: topInset }]}>
      <Pressable onPress={() => onExpandedChange(!expanded)} style={styles.header} hitSlop={8}>
        <View style={styles.headerText}>
          <ThemedText type="smallBold" style={styles.title}>
            Ciel
          </ThemedText>
          <ThemedText type="code" style={styles.subtitle}>
            Ce soir · {formatTime(now)}
          </ThemedText>
        </View>
        <View style={styles.chevronButton}>
          <ThemedText type="code" style={styles.chevronGlyph}>
            {expanded ? '⌄' : '⌃'}
          </ThemedText>
        </View>
      </Pressable>

      {expanded ? (
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.cards}
          showsVerticalScrollIndicator={false}>
          <SkyPanelCards data={data} now={now} />
        </ScrollView>
      ) : (
        <View style={styles.pills}>
          <SkyPanelPills data={data} direction="column" />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  panel: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    width: SIDE_PANEL_WIDTH,
    backgroundColor: '#12161CF2',
    borderLeftWidth: 1,
    borderColor: '#FFFFFF14',
    padding: Spacing.four,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: Spacing.four,
  },
  headerText: {
    gap: Spacing.half,
  },
  title: {
    fontSize: 20,
    lineHeight: 26,
    fontWeight: '600',
    color: '#FFFFFFF2',
  },
  subtitle: {
    fontSize: 12,
    color: '#FFFFFF66',
  },
  chevronButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#FFFFFF14',
    alignItems: 'center',
    justifyContent: 'center',
  },
  chevronGlyph: {
    fontSize: 14,
    color: '#FFFFFFCC',
  },
  pills: {
    gap: Spacing.two,
  },
  scroll: {
    flex: 1,
  },
  cards: {
    gap: Spacing.three,
    paddingBottom: Spacing.three,
  },
});
