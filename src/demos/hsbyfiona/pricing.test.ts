import { describe, expect, it } from 'vitest';
import { SAMPLE_BANDS, feeForDistance } from './pricing';

describe('feeForDistance (same bands as the live store)', () => {
  it('charges ₦1,500 up to 6 km', () => expect(feeForDistance(SAMPLE_BANDS, 6)).toBe(1500));
  it('moves to the next band just past 6 km', () => expect(feeForDistance(SAMPLE_BANDS, 6.1)).toBe(2500));
  it('charges ₦3,500 at 20 km', () => expect(feeForDistance(SAMPLE_BANDS, 20)).toBe(3500));
  it('uses the open-ended band beyond 25 km', () => expect(feeForDistance(SAMPLE_BANDS, 26)).toBe(4500));
});
