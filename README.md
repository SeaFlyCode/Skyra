# Skyra

Skyra — Astro & Ombres. Application mobile/web (Expo) qui affiche en temps
réel la position du Soleil, de la Lune et de l'ISS au-dessus de votre
position, ainsi qu'une carte à relief 3D pour explorer le ciel visible depuis
n'importe quel point.

## Structure

Monorepo pnpm :

- `packages/app` — application Expo/React Native (expo-router), calculs
  astronomiques hors-ligne (Soleil, Lune) et suivi ISS (propagation SGP4).
- `packages/shadow-api` — service Fastify stateless : proxy TLE ISS
  (Celestrak) et projection d'ombres portées (en cours).

## Démarrage

```bash
pnpm install

# App Expo
pnpm dev:app

# API
pnpm dev:api
```

## Stack

- Expo / React Native / expo-router
- MapLibre (carte 3D)
- Fastify (API)
- TypeScript strict sur tout le monorepo

## Licence

AGPL-3.0 + Commons Clause — voir [LICENSE](./LICENSE). Usage, modification et
republication libres, republication du code source obligatoire en cas de
modification (y compris en service réseau). L'usage commercial (vente,
hébergement payant, support payant dérivant substantiellement de Skyra)
nécessite une licence commerciale séparée auprès de l'auteur.
