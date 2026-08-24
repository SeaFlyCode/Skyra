/**
 * Formatage partagé des lectures Soleil / Lune / ISS. Utilisé à la fois par
 * l'écran Ciel (`app/sky.tsx`) et par le panneau Ciel de l'écran Carte
 * (`modules/map/sky-panel-*`) pour ne jamais dupliquer cette logique.
 */

import type { IssPass } from '@/modules/iss';

import type { TimeWindow } from './sun';

export function formatTime(date: Date | null): string {
  if (!date) return '—';
  return date.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
}

export function formatWindow(window: TimeWindow): string {
  if (!window.start || !window.end) return '—';
  return `${formatTime(window.start)} → ${formatTime(window.end)}`;
}

export function formatAngle(degrees: number): string {
  return `${degrees.toFixed(1)}°`;
}

export function formatDuration(minutes: number | null): string {
  if (minutes === null) return '—';
  const total = Math.round(minutes);
  return `${Math.floor(total / 60)} h ${String(total % 60).padStart(2, '0')}`;
}

export function formatPassWindow(pass: IssPass, now: Date): string {
  const sameDay = pass.start.toDateString() === now.toDateString();
  const day = sameDay
    ? ''
    : `${pass.start.toLocaleDateString(undefined, { weekday: 'short', day: 'numeric' })} · `;
  return `${day}${formatTime(pass.start)} → ${formatTime(pass.end)}`;
}
