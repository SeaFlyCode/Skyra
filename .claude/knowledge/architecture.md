---
project: skyra
tags: [skyra, architecture]
---

> Parent : [[skyra]]

# Architecture — skyra

## Vue d'ensemble

Monorepo pnpm avec deux packages : une app Expo/React Native (expo-router) et
une API Fastify stateless. Les calculs Soleil/Lune sont faits hors-ligne dans
l'app ; l'ISS et les ombres dépendent de données externes proxifiées par
l'API.

## Composants

### app (Expo/React Native)
- **Rôle** : UI mobile/web — carte 3D, fiches Soleil/Lune/ISS, navigation par onglets
- **Stack** : Expo, expo-router, MapLibre (`@maplibre/maplibre-react-native` natif, `maplibre-gl` web)
- **Chemin** : `packages/app`
- **Navigation** : écran unique, pas de barre d'onglets — la carte (`app/index.tsx`, ex `map.tsx`) est le point d'entrée direct via `Slot` dans `_layout.tsx`. Home/Explore/Ciel (boilerplate + doublon) retirés le 2026-08-25 ; `app-tabs.tsx` supprimé (à reconstruire si des tabs reviennent, ex. modules `shadow`/`stars`)

### shadow-api (Fastify)
- **Rôle** : proxy TLE ISS (Celestrak, cache 2h) + endpoint `/shadow` (stub mocké, projection d'ombres à implémenter)
- **Stack** : Fastify, TypeScript, stateless (pas de DB ni auth)
- **Chemin** : `packages/shadow-api`

## Modules app notables

- `modules/sun-moon` — calcul offline position Soleil/Lune, phases, heures clés
- `modules/iss` — propagation SGP4, calcul des passages visibles (`MIN_PASS_ELEVATION`)
- `modules/map` — carte relief 3D (style MapLibre construit à la main, deux profils de tuiles vectorielles schéma OpenMapTiles : `maptiler` si clé `EXPO_PUBLIC_MAPTILER_KEY`, `openfreemap` par défaut sans clé via `https://tiles.openfreemap.org/planet`). Couches thématiques : `water`, `landcover-wood` (forêts), `landuse-park`, `roads-major`, `buildings-2d`/`buildings-3d` (fill-extrusion, hauteur `render_height`/`height`). Terrain 3D (raster-dem) + hillshade en dessous, inchangés. Overlays géographiques Soleil/Lune/ISS ajoutés en sources/couches GeoJSON dynamiques (`sky-overlay.ts` : specs partagées web/natif, `celestial-ground.ts` : projection azimut/élévation → point sol à distance fixe) — appliqués impérativement (`addSource`/`setData`) en web, déclarativement (`<GeoJSONSource>`/`<Layer>`) en natif
- `modules/shadow` — placeholder vide, réservé aux ombres portées
- `modules/stars` — placeholder vide, réservé à la carte du ciel étoilé

## Flux principaux

- Carte : `map.tsx` → `ReliefMap` (native/web) → style MapLibre (`buildMapStyle`) avec sources basemap raster + terrain-DEM raster → overlay `SkyCompass` calculé côté app
- ISS : `use-iss-position` hook → fetch `/tle/iss` sur shadow-api → propagation SGP4 locale → affichage carte Ciel

## Décisions structurantes

### 2026-08-24 — Carte 3D comme écran central, tuiles vectorielles OpenFreeMap
**Contexte** : le style de carte actuel n'affiche que du raster (imagerie + hillshade), pas de bâtiments ni de forêts. Vision produit clarifiée avec l'utilisateur : une expérience façon Google Maps 3D (relief + bâtiments + forêts) comme écran central, avec Soleil/Lune/ISS/ombres/étoiles en overlay dessus.
**Choix** : passage à des tuiles vectorielles schéma OpenMapTiles, fournisseur OpenFreeMap par défaut (gratuit, sans clé), MapTiler vecteur en option premium. Ajout de couches `fill-extrusion` (bâtiments) et `landcover`/`landuse` (forêts, parcs). La carte remplacera à terme Home/Explore comme écran d'accueil.
**Raison** : cohérence avec l'esprit "fonctionne sans compte" déjà en place (profil OSM par défaut) tout en débloquant le rendu 3D riche nécessaire à la vision produit.
**Alternatives écartées** : MapTiler uniquement (nécessite une clé dès le premier lancement, contraire à l'esprit du projet).
