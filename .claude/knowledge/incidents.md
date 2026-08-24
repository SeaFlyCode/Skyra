---
project: skyra
tags: [skyra, incidents]
---

> Parent : [[skyra]]

# Incidents — skyra

Historique des bugs rencontrés, root causes et fix. Ordre chronologique inverse (plus récent en haut).

## Format

```markdown
## YYYY-MM-DD — Titre court
**Symptôme** : ce qu'on observait
**Root cause** : vraie cause
**Fix** : ce qui a été fait
**Commit** : `<sha>`
**Leçon** : (optionnel) à retenir pour la suite
```

---

## 2026-08-24 — Worker maplibre-gl bloqué (MIME text/html) sur Expo web
**Symptôme** : ouverture de l'écran Carte en web → erreur console « chargement du worker à l'adresse .../node_modules/expo-router/maplibre-gl-worker.mjs bloqué, type MIME interdit (text/html) » + erreur de sécurité file:///. Carte non fonctionnelle en web.
**Root cause** : `maplibre-gl` v6 instancie son worker via `new Worker(new URL('./maplibre-gl-worker.mjs', import.meta.url))`. Sous Metro (bundler web d'Expo Router), tout le code est empaqueté dans un seul bundle servi depuis `node_modules/expo-router/entry.bundle` — `import.meta.url` du module `maplibre-gl` pointe donc vers ce bundle d'entrée au lieu de son propre fichier, et l'URL relative résolue est absurde. Metro renvoie une 404 en HTML → blocage MIME.
**Fix** : dans `relief-map.web.tsx`, appel explicite à `setWorkerUrl()` (API officielle maplibre-gl) avant la création de la `Map`, pointant vers `https://unpkg.com/maplibre-gl@<version installée>/dist/maplibre-gl-worker.mjs` (version lue dynamiquement depuis `maplibre-gl/package.json`, donc reste synchronisée après upgrade). maplibre-gl détecte l'URL cross-origin et charge le worker via blob import — pas de souci CORS.
**Commit** : non commité au moment de la rédaction
**Leçon** : `maplibre-gl` (web) ne fonctionne pas nativement sous Metro sans configurer explicitement `workerUrl` — à garder en tête si le bundler web change à l'avenir.
