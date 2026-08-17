import { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';
import { useIssPosition } from '@/hooks/use-iss-position';
import { DEFAULT_OBSERVER, useObserverLocation } from '@/hooks/use-observer-location';
import { MIN_PASS_ELEVATION, type IssPass } from '@/modules/iss';
import {
  cardinalDirection,
  getMoonPhase,
  getMoonPosition,
  getSunPosition,
  getSunTimes,
  type TimeWindow,
} from '@/modules/sun-moon';

const SUN_ACCENT = '#E8A33D';
const MOON_ACCENT = '#7FA6D8';
const ISS_ACCENT = '#5FD3A6';
const REFRESH_INTERVAL_MS = 30_000;

function formatTime(date: Date | null): string {
  if (!date) return '—';
  return date.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
}

function formatWindow(window: TimeWindow): string {
  if (!window.start || !window.end) return '—';
  return `${formatTime(window.start)} → ${formatTime(window.end)}`;
}

function formatAngle(degrees: number): string {
  return `${degrees.toFixed(1)}°`;
}

function formatDuration(minutes: number | null): string {
  if (minutes === null) return '—';
  const total = Math.round(minutes);
  return `${Math.floor(total / 60)} h ${String(total % 60).padStart(2, '0')}`;
}

function formatPassWindow(pass: IssPass, now: Date): string {
  const sameDay = pass.start.toDateString() === now.toDateString();
  const day = sameDay
    ? ''
    : `${pass.start.toLocaleDateString(undefined, { weekday: 'short', day: 'numeric' })} · `;
  return `${day}${formatTime(pass.start)} → ${formatTime(pass.end)}`;
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row}>
      <ThemedText type="small" themeColor="textSecondary">
        {label}
      </ThemedText>
      <ThemedText type="smallBold">{value}</ThemedText>
    </View>
  );
}

/** Repère visuel de la hauteur au-dessus de l'horizon, de -90° à +90°. */
function HorizonMeter({ elevation, accent }: { elevation: number; accent: string }) {
  const clamped = Math.max(-90, Math.min(90, elevation));
  return (
    <View style={styles.meter}>
      <ThemedView type="backgroundSelected" style={styles.meterTrack}>
        <View style={styles.meterHorizon} />
        <View
          style={[
            styles.meterMarker,
            { backgroundColor: accent, left: `${((clamped + 90) / 180) * 100}%` },
          ]}
        />
      </ThemedView>
      <View style={styles.meterLabels}>
        <ThemedText type="code" themeColor="textSecondary">
          -90°
        </ThemedText>
        <ThemedText type="code" themeColor="textSecondary">
          horizon
        </ThemedText>
        <ThemedText type="code" themeColor="textSecondary">
          +90°
        </ThemedText>
      </View>
    </View>
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
  children: React.ReactNode;
}) {
  return (
    <ThemedView type="backgroundElement" style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={[styles.cardDot, { backgroundColor: accent }]} />
        <ThemedText type="smallBold" style={styles.cardTitle}>
          {title}
        </ThemedText>
        <ThemedText type="code" themeColor="textSecondary">
          {subtitle}
        </ThemedText>
      </View>
      {children}
    </ThemedView>
  );
}

/**
 * L'ISS a son propre rythme : le TLE vient du réseau et la station traverse le
 * ciel en quelques minutes, d'où un rafraîchissement bien plus rapide que le
 * reste de l'écran.
 */
function IssCard({
  latitude,
  longitude,
  now,
}: {
  latitude: number;
  longitude: number;
  now: Date;
}) {
  const { position, nextPass, status, error } = useIssPosition(latitude, longitude);

  const subtitle =
    status === 'pending'
      ? 'récupération du TLE…'
      : status === 'error'
        ? 'hors ligne'
        : position === null
          ? 'propagation impossible'
          : position.elevation > 0
            ? position.sunlit
              ? 'au-dessus de l’horizon, éclairée'
              : 'au-dessus de l’horizon, dans l’ombre'
            : 'sous l’horizon';

  return (
    <Card title="ISS" accent={ISS_ACCENT} subtitle={subtitle}>
      {error !== null && (
        <ThemedText type="small" themeColor="textSecondary" style={styles.notice}>
          {error}
        </ThemedText>
      )}

      {position !== null && (
        <>
          <Row
            label="Azimut"
            value={`${formatAngle(position.azimuth)} ${cardinalDirection(position.azimuth)}`}
          />
          <Row label="Hauteur" value={formatAngle(position.elevation)} />
          <Row label="Altitude" value={`${Math.round(position.altitudeKm)} km`} />
          <Row label="Distance" value={`${Math.round(position.rangeKm).toLocaleString()} km`} />
          <Row label="Vitesse" value={`${position.speedKmS.toFixed(2)} km/s`} />
          <Row
            label="Survole"
            value={`${position.latitude.toFixed(2)}° / ${position.longitude.toFixed(2)}°`}
          />
          <HorizonMeter elevation={position.elevation} accent={ISS_ACCENT} />
        </>
      )}

      {status === 'ready' && (
        <>
          <View style={styles.separator} />
          {nextPass === null ? (
            <ThemedText type="small" themeColor="textSecondary">
              Aucun passage visible dans les 48 h
            </ThemedText>
          ) : (
            <>
              <Row label="Prochain passage" value={formatPassWindow(nextPass, now)} />
              <Row
                label="Culmination"
                value={`${formatAngle(nextPass.maxElevation)} ${cardinalDirection(nextPass.peakAzimuth)} à ${formatTime(nextPass.peak)}`}
              />
              <Row
                label="Trajet"
                value={`${cardinalDirection(nextPass.startAzimuth)} → ${cardinalDirection(nextPass.endAzimuth)} · ${Math.round(nextPass.durationSeconds / 60)} min`}
              />
              <ThemedText type="code" themeColor="textSecondary">
                station éclairée, ciel sombre, hauteur &gt; {MIN_PASS_ELEVATION}°
              </ThemedText>
            </>
          )}
        </>
      )}
    </Card>
  );
}

/**
 * Le rendu web est pré-généré à l'export : le calcul est fait après le montage
 * pour ne jamais afficher une position figée à l'heure du build.
 */
function SkyReadout({
  latitude,
  longitude,
  now,
}: {
  latitude: number;
  longitude: number;
  now: Date;
}) {
  const sun = useMemo(
    () => getSunPosition(latitude, longitude, now),
    [latitude, longitude, now]
  );
  const moon = useMemo(
    () => getMoonPosition(latitude, longitude, now),
    [latitude, longitude, now]
  );
  const phase = useMemo(() => getMoonPhase(now), [now]);
  const times = useMemo(() => getSunTimes(latitude, longitude, now), [latitude, longitude, now]);

  const dayState = times.polarDay
    ? 'Jour polaire — le Soleil ne se couche pas'
    : times.polarNight
      ? 'Nuit polaire — le Soleil ne se lève pas'
      : null;

  return (
    <>
    <Card
      title="Soleil"
      accent={SUN_ACCENT}
      subtitle={sun.elevation > 0 ? 'au-dessus de l’horizon' : 'sous l’horizon'}>
      <Row
        label="Azimut"
        value={`${formatAngle(sun.azimuth)} ${cardinalDirection(sun.azimuth)}`}
      />
      <Row label="Hauteur" value={formatAngle(sun.elevation)} />
      <Row label="Hauteur apparente" value={formatAngle(sun.apparentElevation)} />
      <HorizonMeter elevation={sun.elevation} accent={SUN_ACCENT} />
    </Card>

    <Card title="Lune" accent={MOON_ACCENT} subtitle={phase.name}>
      <Row
        label="Azimut"
        value={`${formatAngle(moon.azimuth)} ${cardinalDirection(moon.azimuth)}`}
      />
      <Row label="Hauteur" value={formatAngle(moon.elevation)} />
      <Row label="Illumination" value={`${(phase.illumination * 100).toFixed(0)} %`} />
      <Row
        label="Âge"
        value={`${phase.ageDays.toFixed(1)} j — ${phase.waxing ? 'croissante' : 'décroissante'}`}
      />
      <Row label="Distance" value={`${Math.round(moon.distanceKm).toLocaleString()} km`} />
      <HorizonMeter elevation={moon.elevation} accent={MOON_ACCENT} />
    </Card>

    <IssCard latitude={latitude} longitude={longitude} now={now} />

    <Card
      title="Heures clés"
      accent={SUN_ACCENT}
      subtitle={formatDuration(times.dayLengthMinutes)}>
      {dayState && (
        <ThemedText type="small" themeColor="textSecondary" style={styles.notice}>
          {dayState}
        </ThemedText>
      )}
      <Row label="Lever" value={formatTime(times.sunrise)} />
      <Row label="Midi solaire" value={formatTime(times.solarNoon)} />
      <Row label="Coucher" value={formatTime(times.sunset)} />
      <View style={styles.separator} />
      <Row label="Blue hour matin" value={formatWindow(times.blueHourMorning)} />
      <Row label="Golden hour matin" value={formatWindow(times.goldenHourMorning)} />
      <Row label="Golden hour soir" value={formatWindow(times.goldenHourEvening)} />
      <Row label="Blue hour soir" value={formatWindow(times.blueHourEvening)} />
    </Card>

    <ThemedText type="code" themeColor="textSecondary" style={styles.footer}>
      Soleil et Lune hors-ligne · ISS propagée depuis le TLE · {formatTime(now)}
    </ThemedText>
    </>
  );
}

export default function SkyScreen() {
  const { location, status, fallbackReason, retry } = useObserverLocation();
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    setNow(new Date());
    const timer = setInterval(() => setNow(new Date()), REFRESH_INTERVAL_MS);
    return () => clearInterval(timer);
  }, []);

  return (
    <ThemedView style={styles.screen}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            <ThemedText type="subtitle">Ciel</ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              {status === 'pending'
                ? 'Recherche de votre position…'
                : `${location.latitude.toFixed(4)}° / ${location.longitude.toFixed(4)}°`}
            </ThemedText>
            {status === 'fallback' && (
              <Pressable onPress={retry} style={({ pressed }) => pressed && styles.pressed}>
                <ThemedText type="small" themeColor="textSecondary">
                  {fallbackReason} — repli sur {DEFAULT_OBSERVER.label}.{' '}
                  <ThemedText type="linkPrimary">Réessayer</ThemedText>
                </ThemedText>
              </Pressable>
            )}
          </View>

          {now === null ? (
            <ThemedText type="small" themeColor="textSecondary" style={styles.footer}>
              Calcul en cours…
            </ThemedText>
          ) : (
            <SkyReadout
              latitude={location.latitude}
              longitude={location.longitude}
              now={now}
            />
          )}
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
  },
  safeArea: {
    flex: 1,
    maxWidth: MaxContentWidth,
    width: '100%',
  },
  content: {
    padding: Spacing.three,
    gap: Spacing.three,
    paddingBottom: BottomTabInset + Spacing.six,
  },
  header: {
    gap: Spacing.half,
    paddingHorizontal: Spacing.one,
    paddingTop: Spacing.three,
  },
  pressed: {
    opacity: 0.7,
  },
  card: {
    borderRadius: Spacing.four,
    padding: Spacing.three,
    gap: Spacing.two,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    marginBottom: Spacing.one,
  },
  cardDot: {
    width: Spacing.two,
    height: Spacing.two,
    borderRadius: Spacing.one,
  },
  cardTitle: {
    marginRight: 'auto',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.three,
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#8883',
    marginVertical: Spacing.one,
  },
  notice: {
    marginBottom: Spacing.one,
  },
  meter: {
    marginTop: Spacing.two,
    gap: Spacing.one,
  },
  meterTrack: {
    height: Spacing.two,
    borderRadius: Spacing.one,
    justifyContent: 'center',
  },
  meterHorizon: {
    position: 'absolute',
    left: '50%',
    width: StyleSheet.hairlineWidth * 2,
    height: '100%',
    backgroundColor: '#8886',
  },
  meterMarker: {
    position: 'absolute',
    width: Spacing.two,
    height: Spacing.two,
    borderRadius: Spacing.one,
    marginLeft: -Spacing.one,
  },
  meterLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  footer: {
    textAlign: 'center',
    paddingTop: Spacing.two,
  },
});
