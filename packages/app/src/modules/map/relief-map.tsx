import { Camera, Map, type ViewStateChangeEvent } from '@maplibre/maplibre-react-native';
import { useCallback, useMemo } from 'react';
import { StyleSheet, type NativeSyntheticEvent } from 'react-native';

import { buildMapStyle, INITIAL_PITCH, INITIAL_ZOOM } from './style';
import type { ReliefMapProps } from './types';

/**
 * Carte relief pour iOS et Android. Le terrain 3D est porté par la
 * spécification de style partagée avec le web : rien à activer ici, MapLibre
 * Native lit la clé `terrain` du style.
 */
export function ReliefMap({
  initialCenter,
  onViewStateChange,
  onStatusChange,
  style,
}: ReliefMapProps) {
  // Le style ne dépend d'aucune prop : le recréer rechargerait toutes les tuiles.
  const mapStyle = useMemo(() => buildMapStyle(), []);

  const handleRegionChange = useCallback(
    (event: NativeSyntheticEvent<ViewStateChangeEvent>) => {
      const { center, zoom, bearing, pitch } = event.nativeEvent;
      onViewStateChange?.({
        center: { latitude: center[1], longitude: center[0] },
        zoom,
        bearing,
        pitch,
      });
    },
    [onViewStateChange]
  );

  const handleLoaded = useCallback(() => onStatusChange?.('ready', null), [onStatusChange]);

  const handleFailed = useCallback(
    () => onStatusChange?.('error', 'Le style de carte n’a pas pu être chargé'),
    [onStatusChange]
  );

  return (
    <Map
      style={[styles.map, style]}
      mapStyle={mapStyle}
      compass={false}
      scaleBar={false}
      attributionPosition={{ bottom: 12, left: 12 }}
      onRegionIsChanging={handleRegionChange}
      onRegionDidChange={handleRegionChange}
      onDidFinishLoadingMap={handleLoaded}
      onDidFailLoadingMap={handleFailed}>
      <Camera
        initialViewState={{
          center: [initialCenter.longitude, initialCenter.latitude],
          zoom: INITIAL_ZOOM,
          pitch: INITIAL_PITCH,
          bearing: 0,
        }}
      />
    </Map>
  );
}

const styles = StyleSheet.create({
  map: {
    flex: 1,
    backgroundColor: '#0B1016',
  },
});
