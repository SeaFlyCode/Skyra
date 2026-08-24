import { useEffect } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { SkyPanelCards } from './sky-panel-cards';
import { SkyPanelPills } from './sky-panel-pills';
import type { SkyData } from './use-sky-data';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { formatTime } from '@/modules/sun-moon';

const COLLAPSED_CONTENT_HEIGHT = 168;
const EXPANDED_RATIO = 0.78;
const MIN_TOP_GAP = 140;
const SPRING = { damping: 28, stiffness: 280, mass: 0.9 } as const;
const VELOCITY_THRESHOLD = 400;

/**
 * Bottom sheet mobile : replié affiche les 3 puces, déployé affiche les
 * cartes détaillées. Se pilote au drag vertical (gesture-handler + reanimated)
 * ou au tap sur le chevron — les deux convergent vers le même état `expanded`,
 * remonté au parent pour rester la source de vérité.
 */
export function SkyPanelSheet({
  data,
  now,
  expanded,
  onExpandedChange,
  windowHeight,
}: {
  data: SkyData;
  now: Date;
  expanded: boolean;
  onExpandedChange: (value: boolean) => void;
  windowHeight: number;
}) {
  const insets = useSafeAreaInsets();
  const collapsedHeight = COLLAPSED_CONTENT_HEIGHT + insets.bottom;
  const expandedHeight = Math.max(
    Math.min(windowHeight * EXPANDED_RATIO, windowHeight - MIN_TOP_GAP),
    collapsedHeight
  );
  const maxTranslate = expandedHeight - collapsedHeight;

  const translateY = useSharedValue(expanded ? 0 : maxTranslate);
  const startY = useSharedValue(0);

  // Le sheet suit `expanded` quand il change depuis l'extérieur (tap sur le
  // chevron) ; le drag, lui, écrit directement dans `translateY` puis
  // remonte l'état final via `runOnJS`.
  useEffect(() => {
    translateY.value = withSpring(expanded ? 0 : maxTranslate, SPRING);
  }, [expanded, maxTranslate, translateY]);

  // Le linter react-compiler (`react-hooks/immutability`) considère toute
  // écriture sur une valeur lue par un `useEffect` comme une mutation de rendu
  // interdite. C'est un faux positif ici : `translateY` est une shared value
  // Reanimated, conçue précisément pour être mutée hors du rendu React, dans
  // des worklets déclenchés par le geste — c'est le modèle documenté de la
  // librairie, pas une violation des règles des hooks.
  const pan = Gesture.Pan()
    .onStart(() => {
      startY.value = translateY.value;
    })
    .onUpdate((event) => {
      // eslint-disable-next-line react-hooks/immutability
      translateY.value = Math.min(Math.max(startY.value + event.translationY, 0), maxTranslate);
    })
    .onEnd((event) => {
      const openEnough = translateY.value < maxTranslate / 2;
      const shouldExpand = event.velocityY < -VELOCITY_THRESHOLD || (openEnough && event.velocityY < VELOCITY_THRESHOLD);
      // eslint-disable-next-line react-hooks/immutability
      translateY.value = withSpring(shouldExpand ? 0 : maxTranslate, SPRING);
      runOnJS(onExpandedChange)(shouldExpand);
    });

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  return (
    <GestureDetector gesture={pan}>
      <Animated.View
        style={[
          styles.sheet,
          { height: expandedHeight, paddingBottom: insets.bottom + Spacing.four },
          animatedStyle,
        ]}>
        <View style={styles.handle} />

        <Pressable
          onPress={() => onExpandedChange(!expanded)}
          style={styles.header}
          hitSlop={8}>
          <ThemedText type="code" style={styles.headerLabel}>
            {expanded ? 'Ciel' : `Ce soir · ${formatTime(now)}`}
          </ThemedText>
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
            <SkyPanelPills data={data} direction="row" />
          </View>
        )}
      </Animated.View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  sheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#12161CF2',
    borderTopWidth: 1,
    borderColor: '#FFFFFF14',
    borderTopLeftRadius: Spacing.five - Spacing.four,
    borderTopRightRadius: Spacing.five - Spacing.four,
    paddingTop: Spacing.two + Spacing.half,
    paddingHorizontal: Spacing.four,
  },
  handle: {
    alignSelf: 'center',
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#FFFFFF33',
    marginBottom: Spacing.three + Spacing.half,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.three + Spacing.half,
  },
  headerLabel: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '500',
    color: '#FFFFFF99',
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
    paddingBottom: Spacing.one,
  },
  scroll: {
    flex: 1,
  },
  cards: {
    gap: Spacing.three,
    paddingBottom: Spacing.three,
  },
});
