import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';

const BUTTON_SIZE = 40;

/**
 * Colonne d'outils flottants sous la boussole : zoom avant/arrière et
 * bascule des couches. `onZoomIn`/`onZoomOut` sont optionnels : `ReliefMap`
 * n'expose pas encore de commande impérative de zoom (le pincement tactile
 * fonctionne déjà nativement via MapLibre), ces boutons restent donc un point
 * d'accroche visuel pour une prochaine itération. Le bouton couches, lui, a
 * déjà un état local togglable même sans vraie couche à afficher.
 */
export function MapToolbar({ onZoomIn, onZoomOut }: { onZoomIn?: () => void; onZoomOut?: () => void }) {
  const [layersOn, setLayersOn] = useState(false);

  return (
    <View style={styles.column}>
      <ToolButton glyph="+" onPress={onZoomIn} />
      <ToolButton glyph="−" onPress={onZoomOut} />
      <Pressable
        onPress={() => setLayersOn((value) => !value)}
        style={({ pressed }) => [styles.button, styles.layersButton, pressed && styles.pressed]}>
        <ThemedText type="code" style={[styles.glyph, layersOn && styles.glyphActive]}>
          ▦
        </ThemedText>
      </Pressable>
    </View>
  );
}

function ToolButton({ glyph, onPress }: { glyph: string; onPress?: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.button, pressed && styles.pressed]}>
      <ThemedText type="code" style={styles.glyph}>
        {glyph}
      </ThemedText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  column: {
    gap: Spacing.two,
  },
  button: {
    width: BUTTON_SIZE,
    height: BUTTON_SIZE,
    borderRadius: BUTTON_SIZE / 2,
    backgroundColor: '#0B1016CC',
    borderWidth: 1,
    borderColor: '#FFFFFF22',
    alignItems: 'center',
    justifyContent: 'center',
  },
  layersButton: {
    marginTop: Spacing.two,
  },
  glyph: {
    fontSize: 16,
    lineHeight: 18,
    color: '#FFFFFFCC',
  },
  glyphActive: {
    color: '#5FD3A6',
  },
  pressed: {
    opacity: 0.7,
  },
});
