/**
 * Style MapLibre du module carte — construit à la main plutôt que chargé depuis
 * une URL distante, pour que la même spécification serve au web (maplibre-gl) et
 * au natif (@maplibre/maplibre-react-native), terrain 3D compris.
 *
 * Deux profils de tuiles, tous deux **vectoriels** (schéma OpenMapTiles) pour
 * pouvoir extruder bâtiments et distinguer forêts/eau/parcs :
 *
 * - `openfreemap` : profil par défaut, sans aucune clé ni compte. Tuiles
 *   vectorielles OpenFreeMap (https://openfreemap.org, hébergement gratuit et
 *   sans limite) + modèle numérique de terrain AWS Terrain Tiles (encodage
 *   Terrarium, domaine public). Relief 3D, bâtiments 3D et forêts fonctionnent
 *   donc dès le premier lancement, sans configuration.
 *
 * - `maptiler` : activé si `EXPO_PUBLIC_MAPTILER_KEY` est défini. Tuiles
 *   vectorielles MapTiler (même schéma OpenMapTiles, donc mêmes couches
 *   thématiques ci-dessous) + terrain-RGB MapTiler, plus détaillé que AWS.
 *   Créez une clé gratuite sur https://cloud.maptiler.com puis ajoutez dans
 *   `.env` :
 *     EXPO_PUBLIC_MAPTILER_KEY=votre_cle
 *
 * Aucune clé n'est écrite en dur : l'absence de clé dégrade la qualité des
 * tuiles, jamais le fonctionnement.
 */

import type {
  FillExtrusionLayerSpecification,
  FillLayerSpecification,
  LineLayerSpecification,
  StyleSpecification,
} from '@maplibre/maplibre-gl-style-spec';

/** Exagération verticale du relief : lisible sans caricaturer la topographie. */
export const TERRAIN_EXAGGERATION = 1.4;

/** Inclinaison initiale, assez forte pour que le relief et les bâtiments 3D se voient d'emblée. */
export const INITIAL_PITCH = 62;
export const INITIAL_ZOOM = 12;
export const MAX_PITCH = 80;

const MAPTILER_KEY = process.env.EXPO_PUBLIC_MAPTILER_KEY;

export type TileProfile = 'maptiler' | 'openfreemap';

export const tileProfile: TileProfile = MAPTILER_KEY ? 'maptiler' : 'openfreemap';

/** Message affiché à l'utilisateur quand on tourne sur le profil sans clé. */
export const tileProfileNotice =
  tileProfile === 'maptiler'
    ? null
    : 'Tuiles vectorielles OpenFreeMap + relief AWS Terrain. Définissez EXPO_PUBLIC_MAPTILER_KEY pour un rendu MapTiler plus détaillé.';

const OPENFREEMAP_ATTRIBUTION = 'OpenFreeMap © OpenMapTiles. Data from OpenStreetMap';
const AWS_TERRAIN_ATTRIBUTION = 'Relief © AWS Terrain Tiles';
const MAPTILER_ATTRIBUTION = '© MapTiler © OpenStreetMap contributors';

type VectorBasemapSource = {
  url: string;
  attribution: string;
};

type TerrainSource = {
  tiles: string[];
  tileSize: number;
  maxzoom: number;
  encoding: 'mapbox' | 'terrarium';
  attribution: string;
};

// Les deux profils exposent le même schéma OpenMapTiles (source-layers
// `water`, `landcover`, `landuse`, `building`, `transportation`…) : une seule
// URL TileJSON par profil suffit, MapLibre la résout automatiquement.
const basemap: VectorBasemapSource =
  tileProfile === 'maptiler'
    ? {
        url: `https://api.maptiler.com/tiles/v3/tiles.json?key=${MAPTILER_KEY}`,
        attribution: MAPTILER_ATTRIBUTION,
      }
    : {
        url: 'https://tiles.openfreemap.org/planet',
        attribution: OPENFREEMAP_ATTRIBUTION,
      };

const terrain: TerrainSource =
  tileProfile === 'maptiler'
    ? {
        tiles: [
          `https://api.maptiler.com/tiles/terrain-rgb-v2/{z}/{x}/{y}.webp?key=${MAPTILER_KEY}`,
        ],
        tileSize: 256,
        maxzoom: 12,
        encoding: 'mapbox',
        attribution: MAPTILER_ATTRIBUTION,
      }
    : {
        tiles: ['https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png'],
        tileSize: 256,
        maxzoom: 15,
        encoding: 'terrarium',
        attribution: AWS_TERRAIN_ATTRIBUTION,
      };

export const TERRAIN_SOURCE_ID = 'skyra-terrain';
export const BASEMAP_SOURCE_ID = 'skyra-basemap-vector';

export type MapStyleOptions = {
  /**
   * Ajoute la couche `sky` atmosphérique. Réservée au web : MapLibre Native
   * ignore ou rejette la spécification selon la plateforme.
   */
  sky?: boolean;
};

/**
 * Couches thématiques construites depuis le schéma OpenMapTiles, communes aux
 * deux profils de tuiles vectorielles. Couleurs pensées pour une carte de nuit
 * (fond `#0B1016`), cohérentes avec les accents du module sky-compass
 * (soleil `#E8A33D`, lune `#7FA6D8`).
 */
function buildVectorLayers(sourceId: string): [
  FillLayerSpecification,
  FillLayerSpecification,
  FillLayerSpecification,
  LineLayerSpecification,
  FillLayerSpecification,
  FillExtrusionLayerSpecification,
] {
  return [
    {
      id: 'water',
      type: 'fill',
      source: sourceId,
      'source-layer': 'water',
      paint: { 'fill-color': '#101E30' },
    },
    {
      // Forêts et bois : vert sombre, distinct du fond pour rester lisible de nuit.
      id: 'landcover-wood',
      type: 'fill',
      source: sourceId,
      'source-layer': 'landcover',
      filter: ['in', ['get', 'class'], ['literal', ['wood', 'forest']]],
      paint: { 'fill-color': '#152A1C', 'fill-opacity': 0.9 },
    },
    {
      // Parcs urbains : vert un peu plus clair pour les distinguer des bois.
      id: 'landuse-park',
      type: 'fill',
      source: sourceId,
      'source-layer': 'landuse',
      filter: ['==', ['get', 'class'], 'park'],
      paint: { 'fill-color': '#1C3624', 'fill-opacity': 0.85 },
    },
    {
      // Grands axes uniquement : garde la carte lisible plutôt que saturée.
      id: 'roads-major',
      type: 'line',
      source: sourceId,
      'source-layer': 'transportation',
      minzoom: 8,
      filter: ['in', ['get', 'class'], ['literal', ['motorway', 'trunk', 'primary', 'secondary']]],
      paint: {
        'line-color': '#3D4A5C',
        'line-width': ['interpolate', ['linear'], ['zoom'], 8, 0.5, 16, 3],
        'line-opacity': 0.7,
      },
    },
    {
      // Bâtiments à plat : visibles avant que l'extrusion 3D ne prenne le relais.
      id: 'buildings-2d',
      type: 'fill',
      source: sourceId,
      'source-layer': 'building',
      minzoom: 13,
      maxzoom: 14,
      paint: { 'fill-color': '#2A3542', 'fill-opacity': 0.8 },
    },
    {
      // Bâtiments extrudés : hauteur réelle si connue, sinon repli à 6 m (~R+1).
      id: 'buildings-3d',
      type: 'fill-extrusion',
      source: sourceId,
      'source-layer': 'building',
      minzoom: 14,
      paint: {
        'fill-extrusion-color': '#3B4A5E',
        'fill-extrusion-height': [
          'coalesce',
          ['get', 'render_height'],
          ['get', 'height'],
          6,
        ],
        'fill-extrusion-base': ['coalesce', ['get', 'render_min_height'], 0],
        'fill-extrusion-opacity': 0.88,
        'fill-extrusion-vertical-gradient': true,
      },
    },
  ];
}

export function buildMapStyle({ sky = false }: MapStyleOptions = {}): StyleSpecification {
  return {
    version: 8,
    name: 'Skyra Relief',
    sources: {
      [BASEMAP_SOURCE_ID]: {
        type: 'vector',
        url: basemap.url,
        attribution: basemap.attribution,
      },
      [TERRAIN_SOURCE_ID]: {
        type: 'raster-dem',
        tiles: terrain.tiles,
        tileSize: terrain.tileSize,
        maxzoom: terrain.maxzoom,
        encoding: terrain.encoding,
        attribution: terrain.attribution,
      },
    },
    layers: [
      {
        id: 'background',
        type: 'background',
        paint: { 'background-color': '#0B1016' },
      },
      {
        // Le hillshade renforce la lecture du relief quand la caméra est à plat.
        // Placé sous les couches thématiques pour ne pas assombrir bâtiments/eau.
        id: 'hillshade',
        type: 'hillshade',
        source: TERRAIN_SOURCE_ID,
        paint: {
          'hillshade-exaggeration': 0.35,
          'hillshade-shadow-color': '#0A0E14',
          'hillshade-highlight-color': '#FFF3DC',
        },
      },
      ...buildVectorLayers(BASEMAP_SOURCE_ID),
    ],
    terrain: {
      source: TERRAIN_SOURCE_ID,
      exaggeration: TERRAIN_EXAGGERATION,
    },
    ...(sky
      ? {
          sky: {
            'sky-color': '#5B8FC9',
            'horizon-color': '#D7C7A8',
            'fog-color': '#B8C6D4',
            'fog-ground-blend': 0.6,
            'sky-horizon-blend': 0.6,
            'horizon-fog-blend': 0.5,
          },
        }
      : {}),
  } satisfies StyleSpecification;
}
