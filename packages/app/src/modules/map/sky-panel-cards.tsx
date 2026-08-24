import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { ISS_ACCENT, MOON_ACCENT, SUN_ACCENT } from './accents';
import type { SkyData } from './use-sky-data';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { MIN_PASS_ELEVATION } from '@/modules/iss';
import { cardinalDirection, formatAngle, formatPassWindow } from '@/modules/sun-moon';

/**
 * Cartes détaillées Soleil / Lune / ISS du panneau Ciel déployé. Style propre
 * au panneau flottant (fond translucide sur carte sombre) — volontairement
 * distinct des cartes de l'écran `sky.tsx` (fond plein `backgroundElement`),
 * mais mêmes informations clés et mêmes fonctions de calcul/format.
 */
export function SkyPanelCards({ data, now }: { data: SkyData; now: Date }) {
  const { sun, moon, moonPhase, iss } = data;

  return (
    <>
      <Card
        title="Soleil"
        accent={SUN_ACCENT}
        subtitle={sun.elevation > 0 ? "au-dessus de l'horizon" : "sous l'horizon"}>
        <Row label="Azimut" value={`${formatAngle(sun.azimuth)} ${cardinalDirection(sun.azimuth)}`} />
        <Row label="Hauteur" value={formatAngle(sun.elevation)} />
        <HorizonBar elevation={sun.elevation} accent={SUN_ACCENT} />
      </Card>

      <Card title="Lune" accent={MOON_ACCENT} subtitle={moonPhase.name}>
        <Row label="Illumination" value={`${Math.round(moonPhase.illumination * 100)} %`} />
        <Row label="Distance" value={`${Math.round(moon.distanceKm).toLocaleString()} km`} />
      </Card>

      <Card
        title="ISS"
        accent={ISS_ACCENT}
        subtitle={
          iss.status === 'pending'
            ? 'récupération du TLE…'
            : iss.status === 'error'
              ? 'hors ligne'
              : iss.nextPass
                ? 'prochain passage'
                : 'aucun passage 48 h'
        }>
        {iss.nextPass ? (
          <>
            <Row label="Passage" value={formatPassWindow(iss.nextPass, now)} />
            <Row
              label="Culmination"
              value={`${formatAngle(iss.nextPass.maxElevation)} ${cardinalDirection(iss.nextPass.peakAzimuth)}`}
            />
            <ThemedText type="code" style={styles.notice}>
              station éclairée, ciel sombre, hauteur &gt; {MIN_PASS_ELEVATION}°
            </ThemedText>
          </>
        ) : (
          <ThemedText type="code" style={styles.notice}>
            {iss.error ?? 'Aucun passage visible dans les 48 h'}
          </ThemedText>
        )}
      </Card>
    </>
  );
}

function Card({
  title,
  accent,
  subtitle,
  children,
}: {
  title: string;
  accent: string;
  subtitle: string;
  children: ReactNode;
}) {
  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.cardTitleGroup}>
          <View style={[styles.dot, { backgroundColor: accent }]} />
          <ThemedText type="code" style={styles.cardTitle}>
            {title}
          </ThemedText>
        </View>
        <ThemedText type="code" style={styles.cardSubtitle}>
          {subtitle}
        </ThemedText>
      </View>
      {children}
    </View>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row}>
      <ThemedText type="code" style={styles.label}>
        {label}
      </ThemedText>
      <ThemedText type="code" style={styles.value}>
        {value}
      </ThemedText>
    </View>
  );
}

/** Repère visuel de la hauteur du Soleil au-dessus de l'horizon, -90° à +90°. */
function HorizonBar({ elevation, accent }: { elevation: number; accent: string }) {
  const clamped = Math.max(-90, Math.min(90, elevation));
  const position = ((clamped + 90) / 180) * 100;

  return (
    <View style={styles.horizonBar}>
      <View style={styles.horizonMid} />
      <View style={[styles.horizonDot, { left: `${position}%`, backgroundColor: accent }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF0D',
    borderRadius: Spacing.four,
    padding: Spacing.three,
    gap: Spacing.one + Spacing.half,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.one,
    gap: Spacing.two,
  },
  cardTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  cardTitle: {
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    color: '#FFFFFFF2',
  },
  cardSubtitle: {
    fontSize: 11,
    color: '#FFFFFF66',
    flexShrink: 1,
    textAlign: 'right',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.three,
  },
  label: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '500',
    color: '#FFFFFF99',
  },
  value: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '700',
    color: '#FFFFFFF2',
  },
  notice: {
    fontSize: 12,
    color: '#FFFFFF66',
  },
  horizonBar: {
    marginTop: Spacing.one,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FFFFFF14',
  },
  horizonMid: {
    position: 'absolute',
    left: '50%',
    top: 0,
    bottom: 0,
    width: 1,
    backgroundColor: '#FFFFFF33',
  },
  horizonDot: {
    position: 'absolute',
    top: '50%',
    width: 8,
    height: 8,
    marginLeft: -4,
    marginTop: -4,
    borderRadius: 4,
  },
});
