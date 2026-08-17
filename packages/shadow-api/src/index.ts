import Fastify from 'fastify';

// Service 100% stateless : pas de DB, pas d'auth, pas de session.
// Rate limiting / CORS pourront être ajoutés plus tard si l'API est exposée publiquement.

const shadowBodySchema = {
  type: 'object',
  required: ['lat', 'lon', 'radius', 'datetime'],
  additionalProperties: false,
  properties: {
    lat: { type: 'number', minimum: -90, maximum: 90 },
    lon: { type: 'number', minimum: -180, maximum: 180 },
    radius: { type: 'number', minimum: 10, maximum: 2000 },
    datetime: { type: 'string', format: 'date-time' },
  },
} as const;

interface ShadowBody {
  lat: number;
  lon: number;
  radius: number;
  datetime: string;
}

interface Tle {
  name: string;
  line1: string;
  line2: string;
  fetchedAt: string;
}

const ISS_TLE_URL =
  'https://celestrak.org/NORAD/elements/gp.php?CATNR=25544&FORMAT=TLE';
const TLE_TTL_MS = 7_200_000;

let tleCache: Tle | null = null;

function parseTle(raw: string): Tle | null {
  const lines = raw
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  const [name, line1, line2] = lines;
  if (!name || !line1?.startsWith('1 ') || !line2?.startsWith('2 ')) {
    return null;
  }

  return { name, line1, line2, fetchedAt: new Date().toISOString() };
}

const app = Fastify({ logger: true });

app.get('/health', async () => ({ status: 'ok' }));

app.get('/tle/iss', async (request, reply) => {
  if (tleCache && Date.now() - Date.parse(tleCache.fetchedAt) < TLE_TTL_MS) {
    return tleCache;
  }

  try {
    const res = await fetch(ISS_TLE_URL, {
      signal: AbortSignal.timeout(10_000),
    });
    if (!res.ok) {
      throw new Error(`Celestrak a répondu ${res.status}`);
    }

    const parsed = parseTle(await res.text());
    if (!parsed) {
      throw new Error('Format TLE inattendu');
    }

    tleCache = parsed;
    return parsed;
  } catch (err) {
    request.log.error({ err }, 'Récupération TLE ISS échouée');

    // Un TLE périmé reste bien plus utile qu'une erreur : la précision se dégrade lentement.
    if (tleCache) {
      return tleCache;
    }

    return reply
      .code(502)
      .send({ error: 'Bad Gateway', message: 'TLE ISS indisponible' });
  }
});

// STUB : réponse mockée à la forme finale.
// L'implémentation réelle (Overpass API + position solaire + projection d'ombres) viendra ensuite.
app.post<{ Body: ShadowBody }>(
  '/shadow',
  { schema: { body: shadowBodySchema } },
  async (request) => {
    const { lat, lon } = request.body;

    return {
      sun_position: { azimuth: 187.4, elevation: 42.1 },
      obstacles: [
        {
          id: 'way/123456789',
          type: 'building',
          height_m: 24,
          geometry: [
            [lon + 0.0004, lat + 0.0002],
            [lon + 0.0009, lat + 0.0002],
            [lon + 0.0009, lat + 0.0006],
            [lon + 0.0004, lat + 0.0006],
            [lon + 0.0004, lat + 0.0002],
          ],
        },
      ],
      shadows: [
        {
          obstacle_id: 'way/123456789',
          length_m: 26.5,
          geometry: [
            [lon + 0.0004, lat + 0.0002],
            [lon + 0.0009, lat + 0.0002],
            [lon + 0.0009, lat - 0.0001],
            [lon + 0.0004, lat - 0.0001],
            [lon + 0.0004, lat + 0.0002],
          ],
        },
      ],
    };
  },
);

const port = Number(process.env.PORT ?? 3001);

app.listen({ port, host: '0.0.0.0' }).catch((err) => {
  app.log.error(err);
  process.exit(1);
});
