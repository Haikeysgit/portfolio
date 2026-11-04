import { describe, expect, it } from 'vitest';
import { PRODUCTS, initialShop, lineId, priceOf, recommend, shopReducer, subtotal, type ShopAction, type ShopState } from './state';
import { SAMPLE_BANDS, feeForDistance } from './pricing';

const run = (...a: ShopAction[]) => a.reduce<ShopState>(shopReducer, initialShop);
const candy = lineId('cloud-candy', '100ml');
const tahara50 = lineId('tahara', '50ml');

describe('prices', () => {
  it('uses the size price for products with sizes', () => expect(priceOf(tahara50)).toBe(25000));
  it('uses the base price otherwise', () => expect(priceOf(candy)).toBe(46000));
  it('prices an unknown line at 0, the way the server ignores it', () => expect(priceOf('nope:1ml')).toBe(0));
  it('subtotal re-prices from the product list', () => expect(subtotal([{ id: tahara50, qty: 2 }])).toBe(50000));
});

describe('recommend (scent match)', () => {
  const ids = (a: Parameters<typeof recommend>[0]) => recommend(a).map((p) => p.id);
  it('sweet for her', () => expect(ids({ who: 'Her', vibe: 'Sweet' })).toEqual(['cloud-candy', 'now-women']));
  it('fresh for him', () => expect(ids({ who: 'Him', vibe: 'Fresh' })).toEqual(['freeze']));
  it('soft & musky for anyone includes unisex picks', () => expect(ids({ who: 'Anyone', vibe: 'Soft & musky' })).toEqual(['terra', 'freeze', 'tahara']));
  it('every product in the demo exists in the list', () => expect(PRODUCTS.length).toBe(5));
});

describe('shopReducer', () => {
  it('adding the same line twice gives quantity 2', () => {
    expect(run({ type: 'ADD', id: candy }, { type: 'ADD', id: candy }).cart).toEqual([{ id: candy, qty: 2 }]);
  });

  it('SET_QTY to 0 removes the line', () => {
    expect(run({ type: 'ADD', id: candy }, { type: 'SET_QTY', id: candy, qty: 0 }).cart).toEqual([]);
  });

  it('CHECKOUT with an empty cart is a no-op', () => expect(shopReducer(initialShop, { type: 'CHECKOUT' })).toBe(initialShop));

  it('PAY needs a delivery distance first', () => {
    expect(run({ type: 'ADD', id: candy }, { type: 'CHECKOUT' }, { type: 'PAY' }).phase).toBe('address');
  });

  it('PAY_SUCCESS records an order for subtotal plus the delivery fee', () => {
    const s = run({ type: 'ADD', id: candy }, { type: 'ADD', id: tahara50 }, { type: 'CHECKOUT' }, { type: 'SET_KM', km: 11 }, { type: 'PAY' }, { type: 'PAY_SUCCESS', ref: 'HS-1' });
    const sub = 46000 + 25000;
    expect(s.phase).toBe('paid');
    expect(s.order).toEqual({ ref: 'HS-1', subtotal: sub, delivery: feeForDistance(SAMPLE_BANDS, 11), total: sub + 2500 });
  });

  it('a second PAY_SUCCESS changes nothing', () => {
    const paid = run({ type: 'ADD', id: candy }, { type: 'CHECKOUT' }, { type: 'SET_KM', km: 5 }, { type: 'PAY' }, { type: 'PAY_SUCCESS', ref: 'HS-1' });
    expect(shopReducer(paid, { type: 'PAY_SUCCESS', ref: 'HS-2' })).toBe(paid);
  });

  it('BROWSE leaves checkout for the shop and keeps the cart', () => {
    const s = run({ type: 'ADD', id: candy }, { type: 'CHECKOUT' }, { type: 'BROWSE' });
    expect(s.phase).toBe('browse');
    expect(s.cart).toHaveLength(1);
  });

  it('RESET returns to the initial state', () => {
    expect(run({ type: 'ADD', id: candy }, { type: 'CHECKOUT' }, { type: 'RESET' })).toEqual(initialShop);
  });
});
