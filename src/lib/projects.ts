export const TRACKS = ['ai', 'blockchain', 'app'] as const;
export type Track = (typeof TRACKS)[number];
export type Filter = 'all' | Track;

const LABELS: Record<Track, string> = { ai: 'AI agents', blockchain: 'Blockchain', app: 'Apps' };

export function matchesFilter(tracks: readonly Track[], f: Filter): boolean {
  return f === 'all' || tracks.includes(f);
}

export function trackLabel(t: Track): string {
  return LABELS[t];
}

export function sortByOrder<T extends { data: { order: number } }>(items: readonly T[]): T[] {
  return [...items].sort((a, b) => a.data.order - b.data.order);
}
