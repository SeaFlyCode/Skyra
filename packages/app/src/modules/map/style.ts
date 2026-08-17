/**
 * Style MapLibre du module carte — construit à la main plutôt que chargé depuis
 * une URL distante, pour que la même spécification serve au web (maplibre-gl) et
 * au natif (@maplibre/maplibre-react-native), terrain 3D compris.
 *
 * Deux profils de tuiles :
 *
 * - `maptier` : activé si `EXPO_PUBLIC_MAPTILER_KEY` est défini. Imagerie
 *   satellite + terrain-RGB MapTiler, nettement plus détaillé. Créez une clé
 *   gratuite sur https://cloud.maptiler.com puis ajoutez dans `.env` :
 *     EXPO_PUBLIC_MAPTILER_KEY=votre_cle
 *
 * - `openstreetmap` : profil par défaut, sans aucune clé ni compte. Fond OSM et
 *   modèle numérique de terrain AWS Terrain Tiles (encodage Terrarium, domaine
 *   public). Le relief 3D fonctionne donc dès le premier lancement.
 *
 * Aucune clé n'est écrite en dur : l'absence de clé dégrade la qualité des
 * tuiles, jamais le fonctionnement.
 */

import type { StyleSpecification } from '@maplibre/maplibre-gl-style-spec';

/** Exagération verticale du relief : lisible sans caricaturer la topographie. */
export const TERRAIN_EXAGGERATION = 1.4;

/** Inclinaison initiale, assez forte pour que le relief se voie d'emblée. */
export const INITIAL_PITCH = 62;
export const INITIAL_ZOOM = 12;
export const MAX_PITCH = 80;

const MAPTILER_KEY = process.env.EXPO_PUBLIC_MAPTILER_KEY;

export type TileProfile = 'maptiler' | 'openstreetmap';

export const tileProfile: TileProfile = MAPTILER_KEY ? 'maptiler' : 'openstreetmap';

/** Message affiché à l'utilisateur quand on tourne sur le profil sans clé. */
export const tileProfileNotice =
  tileProfile === 'maptiler'
    ? null
    : 'Tuiles OpenStreetMap + relief AWS Terrain. Définissez EXPO_PUBLIC_MAPTILER_KEY pour l’imagerie satellite haute résolution.';

const OSM_ATTRIBUTION = '© OpenStreetMap contributors';
const AWS_TERRAIN_ATTRIBUTION = 'Relief © AWS Terrain Tiles';
const MAPTILER_ATTRIBUTION = '© MapTiler © OpenStreetMap contributors';

type BasemapSource = {
  tiles: string[];
  tileSize: number;
  maxzoom: number;
  attribution: string;
};

type TerrainSource = {
  tiles: string[];
  tileSize: number;
  maxzoom: number;
  encoding: 'mapbox' | 'terrarium';
  attribution: string;
};

const basemap: BasemapSource =
  tileProfile === 'maptiler'
    ? {
        tiles: [`https://api.maptiler.com/tiles/satellite-v2/{z}/{x}/{y}.jpg?key=${MAPTILER_KEY}`],
        tileSize: 512,
        maxzoom: 20,
        attribution: MAPTILER_ATTRIBUTION,
      }
    : {
        tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
        tileSize: 256,
        maxzoom: 19,
        attribution: OSM_ATTRIBUTION,
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
export const BASEMAP_SOURCE_ID = 'skyra-basemap';

export type MapStyleOptions = {
  /**
   * Ajoute la couche `sky` atmosphérique. Réservée au web : MapLibre Native
   * ignore ou rejette la spécification selon la plateforme.
   */
  sky?: boolean;
};

export function buildMapStyle({ sky = false }: MapStyleOptions = {}): StyleSpecification {
  return {
    version: 8,
    name: 'Skyra Relief',
    sources: {
      [BASEMAP_SOURCE_ID]: {
        type: 'raster',
        tiles: basemap.tiles,
        tileSize: basemap.tileSize,
        maxzoom: basemap.maxzoom,
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
        id: 'basemap',
        type: 'raster',
        source: BASEMAP_SOURCE_ID,
        paint: { 'raster-opacity': 1 },
      },
      {
        // Le hillshade renforce la lecture du relief quand la caméra est à plat.
        id: 'hillshade',
        type: 'hillshade',
        source: TERRAIN_SOURCE_ID,
        paint: {
          'hillshade-exaggeration': 0.35,
          'hillshade-shadow-color': '#0A0E14',
          'hillshade-highlight-color': '#FFF3DC',
        },
      },
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
