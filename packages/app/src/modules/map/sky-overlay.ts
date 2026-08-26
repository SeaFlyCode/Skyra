/**
 * Overlays géographiques Soleil / Lune / ISS sur la vue 3D de la carte —
 * complémentaires au pointeur central `SkyPointer` (superposition 2D
 * classique, inchangée). Ce module ne dépend d'aucune plateforme : les sources GeoJSON
 * et spécifications de couches qu'il construit sont consommées à l'identique
 * par `relief-map.web.tsx` (`map.addSource`/`addLayer` impératifs) et
 * `relief-map.tsx` (`<GeoJSONSource>`/`<Layer>` déclaratifs).
 */

import type { CircleLayerSpecification, LineLayerSpecification } from '@maplibre/maplibre-gl-style-spec';

import { ISS_ACCENT, MOON_ACCENT, SUN_ACCENT } from './accents';
import type { CelestialGroundPoint } from './celestial-ground';
import type { MapCoordinates } from './types';

export const ISS_TRAIL_SOURCE_ID = 'skyra-iss-trail';
export const ISS_MARKER_SOURCE_ID = 'skyra-iss-marker';
export const SUN_MARKER_SOURCE_ID = 'skyra-sun-marker';
export const MOON_MARKER_SOURCE_ID = 'skyra-moon-marker';

const EMPTY_FEATURE_COLLECTION: GeoJSON.FeatureCollection = { type: 'FeatureCollection', features: [] };

/**
 * Réaligne les longitudes d'une trajectoire pour qu'elle reste continue même
 * si l'ISS franchit l'antiméridien pendant la fenêtre couverte : sans ça, un
 * passage de +179° à -179° dessinerait un trait horizontal traversant toute
 * la carte au lieu d'un court segment.
 */
function unwrapLongitudes(points: MapCoordinates[]): MapCoordinates[] {
  let offset = 0;
  let previous: number | null = null;
  return points.map((point) => {
    if (previous !== null) {
      const delta = point.longitude - previous;
      if (delta > 180) offset -= 360;
      else if (delta < -180) offset += 360;
    }
    previous = point.longitude;
    return { ...point, longitude: point.longitude + offset };
  });
}

export function issTrailGeoJson(trail: MapCoordinates[]): GeoJSON.FeatureCollection {
  if (trail.length < 2) return EMPTY_FEATURE_COLLECTION;
  return {
    type: 'FeatureCollection',
    features: [
      {
        type: 'Feature',
        properties: {},
        geometry: {
          type: 'LineString',
          coordinates: unwrapLongitudes(trail).map((p) => [p.longitude, p.latitude]),
        },
      },
    ],
  };
}

export function pointGeoJson(point: MapCoordinates | null): GeoJSON.FeatureCollection {
  if (!point) return EMPTY_FEATURE_COLLECTION;
  return {
    type: 'FeatureCollection',
    features: [
      {
        type: 'Feature',
        properties: {},
        geometry: { type: 'Point', coordinates: [point.longitude, point.latitude] },
      },
    ],
  };
}

export function celestialMarkerGeoJson(point: CelestialGroundPoint | null): GeoJSON.FeatureCollection {
  if (!point) return EMPTY_FEATURE_COLLECTION;
  return {
    type: 'FeatureCollection',
    features: [
      {
        type: 'Feature',
        properties: { elevation: point.elevation },
        geometry: { type: 'Point', coordinates: [point.longitude, point.latitude] },
      },
    ],
  };
}

export function issTrailLayer(sourceId: string): LineLayerSpecification {
  return {
    id: 'skyra-iss-trail-line',
    type: 'line',
    source: sourceId,
    layout: { 'line-join': 'round', 'line-cap': 'round' },
    paint: {
      'line-color': ISS_ACCENT,
      'line-width': 2,
      'line-opacity': 0.55,
      'line-dasharray': [1, 2],
    },
  };
}

export function issMarkerLayer(sourceId: string): CircleLayerSpecification {
  return {
    id: 'skyra-iss-marker-circle',
    type: 'circle',
    source: sourceId,
    paint: {
      'circle-radius': 6,
      'circle-color': ISS_ACCENT,
      'circle-stroke-width': 2,
      'circle-stroke-color': '#0B1016',
    },
  };
}

/**
 * Rayon/opacité communs aux marqueurs Soleil et Lune : sous l'horizon, le
 * marqueur reste repéré mais s'estompe, dans le même esprit que les astres
 * atténués du pointeur `SkyPointer`.
 */
function celestialMarkerPaint(color: string): CircleLayerSpecification['paint'] {
  return {
    'circle-radius': ['interpolate', ['linear'], ['get', 'elevation'], -20, 5, 60, 12],
    'circle-opacity': ['interpolate', ['linear'], ['get', 'elevation'], -20, 0.35, 0, 0.55, 10, 1],
    'circle-blur': 0.2,
    'circle-color': color,
  };
}

export function sunMarkerLayer(sourceId: string): CircleLayerSpecification {
  return {
    id: 'skyra-sun-marker-circle',
    type: 'circle',
    source: sourceId,
    paint: celestialMarkerPaint(SUN_ACCENT),
  };
}

export function moonMarkerLayer(sourceId: string): CircleLayerSpecification {
  return {
    id: 'skyra-moon-marker-circle',
    type: 'circle',
    source: sourceId,
    paint: celestialMarkerPaint(MOON_ACCENT),
  };
}
