// Delivery pricing copied from the live store (convex/delivery/akurePricing.ts): road distance in bands.

/** One distance band. The last band has no `upToKm`: it covers everything further. */
export type Band = { upToKm?: number; fee: number };

export const SAMPLE_BANDS: Band[] = [
  { upToKm: 6, fee: 1500 },
  { upToKm: 12, fee: 2500 },
  { upToKm: 17, fee: 3000 },
  { upToKm: 21, fee: 3500 },
  { upToKm: 25, fee: 4000 },
  { fee: 4500 },
];

/** The fee for a road distance, from the first band it fits in. */
export function feeForDistance(bands: Band[], km: number): number {
  for (const band of bands) {
    if (band.upToKm === undefined || km <= band.upToKm) return band.fee;
  }
  return bands.at(-1)?.fee ?? 0;
}
