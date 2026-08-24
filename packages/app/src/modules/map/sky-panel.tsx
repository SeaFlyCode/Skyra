import { useState } from 'react';
import { useWindowDimensions } from 'react-native';

import { SkyPanelSide } from './sky-panel-side';
import { SkyPanelSheet } from './sky-panel-sheet';
import type { MapCoordinates } from './types';
import { useSkyData } from './use-sky-data';

export { SIDE_PANEL_WIDTH } from './sky-panel-side';

/**
 * En dessous de cette largeur, l'écran reste un usage tactile étroit (mobile,
 * ou web mobile) : bottom sheet draggable. Au-dessus, un panneau latéral fixe
 * a plus de sens qu'un bandeau plein écran qui mangerait la carte — d'où un
 * test sur la largeur de fenêtre plutôt que sur `Platform.OS` seul.
 */
const DESKTOP_BREAKPOINT = 768;

/**
 * Panneau Ciel de l'écran Carte : bascule entre bottom sheet (mobile/étroit)
 * et panneau latéral (desktop large) selon la largeur de fenêtre. Les données
 * Soleil / Lune / ISS viennent de `useSkyData`, branché sur la position réelle
 * de l'observateur (pas le centre de la carte, qui peut être pané ailleurs).
 */
export function SkyPanel({
  location,
  now,
  topInset,
}: {
  location: MapCoordinates;
  now: Date;
  topInset: number;
}) {
  const { width, height } = useWindowDimensions();
  const [expanded, setExpanded] = useState(false);
  const data = useSkyData(location, now);

  if (width >= DESKTOP_BREAKPOINT) {
    return (
      <SkyPanelSide
        data={data}
        now={now}
        expanded={expanded}
        onExpandedChange={setExpanded}
        topInset={topInset}
      />
    );
  }

  return (
    <SkyPanelSheet
      data={data}
      now={now}
      expanded={expanded}
      onExpandedChange={setExpanded}
      windowHeight={height}
    />
  );
}

export { DESKTOP_BREAKPOINT };
