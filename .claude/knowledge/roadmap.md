---
project: skyra
tags: [skyra, roadmap]
---

> Parent : [[skyra]]

# Roadmap — skyra

Vision cible : la carte 3D (relief + bâtiments + forêts, façon Google Maps) devient
l'écran central de l'app. Soleil, Lune, ISS, ombres portées et étoiles s'affichent
en overlay dessus. Ciel/Home/Explore deviennent secondaires ou disparaissent.

## ✅ Fait

- Redesign carte : boussole céleste repensée, pastille position, toolbar flottante, panneau Ciel (bottom sheet mobile / panneau latéral desktop) avec vraies données Soleil/Lune/ISS (2026-08-24)
- Gestes caméra libres (pitch/bearing à deux doigts) vérifiés actifs par défaut web+natif ; fix `pointerEvents="none"` sur les badges overlay de `map.tsx` qui pouvaient intercepter les gestes (2026-08-24)
- Carte 3D vectorielle OpenFreeMap : bâtiments extrudés, forêts, parcs, eau, routes principales — profil `openfreemap` par défaut, `maptiler` en vecteur si clé (2026-08-24)
- Scaffold monorepo pnpm (app Expo + shadow-api Fastify)
- Module sun-moon : position Soleil/Lune, phases, heures clés (calcul offline)
- Suivi ISS : proxy TLE (Celestrak) + propagation SGP4, prochain passage visible
- Module map : carte relief 3D (tuiles raster + terrain DEM), boussole céleste
- Écran Ciel avec fiches Soleil/Lune/ISS/heures clés

## Priorité 1 — Carte 3D façon Google Maps (socle)

- [x] Profil de tuiles vectorielles OpenFreeMap (schéma OpenMapTiles) dans `modules/map/style.ts`, remplace le raster par défaut (2026-08-24)
- [x] Couche `fill-extrusion` bâtiments (hauteur réelle) (2026-08-24)
- [x] Couche forêts/végétation (`landcover`) + zones urbaines/parcs (`landuse`) (2026-08-24)
- [x] Garder terrain DEM + hillshade sous les nouvelles couches (2026-08-24)
- [x] Profil MapTiler vecteur conservé en option premium si clé fournie (2026-08-24)
- [ ] Vérification visuelle manuelle (bâtiments 3D + forêts) — agent n'a pas pu tester en navigateur, à confirmer par l'utilisateur sur `http://localhost:8081/map`

## Priorité 2 — Carte comme écran central

- [ ] Carte = premier onglet / écran d'accueil
- [ ] Retirer Home et Explore (boilerplate Expo) de la navigation
- [x] Ciel devient un panneau accessible depuis la carte (2026-08-24) : bottom sheet draggable en mobile, panneau latéral ancré en desktop (breakpoint 768px via `useWindowDimensions`) — voir `modules/map/sky-panel*.tsx`. L'onglet Ciel (`sky.tsx`) existe toujours en parallèle, non retiré — doublon à traiter avec le retrait Home/Explore

## Priorité 3 — Overlays sur la carte

- [ ] Position Soleil/Lune + boussole céleste directement sur la vue 3D
- [ ] Trajectoire ISS en overlay
- [ ] Ombres portées en overlay (dépend de l'implémentation réelle de `/shadow`)

## Priorité 4 — Ombres portées (API + app)

- [ ] Implémenter la vraie logique `/shadow` côté shadow-api (actuellement stub mocké) : Overpass API pour les bâtiments + projection géométrique à partir de l'azimut/hauteur solaire
- [ ] Consommer l'API côté app et rendre les ombres sur la carte

## 💭 Idées / backlog

- Module `stars` (carte du ciel étoilé) — dossier vide, direction non définie (planétarium orientable vs liste des objets visibles)
