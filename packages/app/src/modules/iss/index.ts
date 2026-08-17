/**
 * Module iss — position temps réel de la Station spatiale internationale et
 * prochains passages visibles.
 *
 * Le seul apport réseau est le TLE (deux lignes d'éléments orbitaux), récupéré
 * en amont par {@link useIssPosition} ; tout le reste est de la propagation
 * SGP4 locale et pure.
 */

export {
  createSatrec,
  getIssPosition,
  getIssVisibility,
  observerGeodetic,
  type IssPosition,
  type IssTle,
  type Observer,
} from './orbit';

export {
  findNextVisiblePass,
  MIN_PASS_ELEVATION,
  MAX_SUN_ELEVATION,
  type IssPass,
} from './passes';
