import { describe, expect, it } from 'vitest';
import { PRODUCTS, initialShop, shopReducer, subtotal, type ShopAction, type ShopState } from './state';
import { SAMPLE_BANDS, feeForDistance } from './pricing';

const run = (...a: ShopAction[]) => a.reduce<ShopState>(shopReducer, initialShop);
const [p1, p2] = PRODUCTS;

describe('shopReducer', () => {
  it('adding the same product twice gives quantity 2', () => {
    expect(run({ type: 'ADD', id: p1.id }, { type: 'ADD', id: p1.id }).cart).toEqual([{ id: p1.id, qty: 2 }]);
  });

  it('SET_QTY to 0 removes the line', () => {
    expect(run({ type: 'ADD', id: p1.id }, { type: 'SET_QTY', id: p1.id, qty: 0 }).cart).toEqual([]);
  });

  it('CHECKOUT with an empty cart is a no-op', () => {
    expect(shopReducer(initialShop, { type: 'CHECKOUT' })).toBe(initialShop);
  });

  it('PAY needs a delivery distance first', () => {
    const s = run({ type: 'ADD', id: p1.id }, { type: 'OPEN_CART' }, { type: 'CHECKOUT' }, { type: 'PAY' });
    expect(s.phase).toBe('address');
  });

  it('PAY_SUCCESS records an order for subtotal plus the delivery fee', () => {
    const s = run(
      { type: 'ADD', id: p1.id },
      { type: 'ADD', id: p2.id },
      { type: 'CHECKOUT' },
      { type: 'SET_KM', km: 11 },
      { type: 'PAY' },
      { type: 'PAY_SUCCESS', ref: 'HS-1' },
    );
    const sub = p1.price + p2.price;
    expect(s.phase).toBe('paid');
    expect(s.order).toEqual({ ref: 'HS-1', subtotal: sub, delivery: feeForDistance(SAMPLE_BANDS, 11), total: sub + 2500 });
  });

  it('a second PAY_SUCCESS changes nothing', () => {
    const paid = run({ type: 'ADD', id: p1.id }, { type: 'CHECKOUT' }, { type: 'SET_KM', km: 5 }, { type: 'PAY' }, { type: 'PAY_SUCCESS', ref: 'HS-1' });
    expect(shopReducer(paid, { type: 'PAY_SUCCESS', ref: 'HS-2' })).toBe(paid);
  });

  it('subtotal re-prices from the product list, not from the cart', () => {
    expect(subtotal([{ id: p1.id, qty: 3 }])).toBe(p1.price * 3);
    expect(subtotal([{ id: 'not-a-product', qty: 1 }])).toBe(0);
  });

  it('RESET returns to the initial state', () => {
    expect(run({ type: 'ADD', id: p1.id }, { type: 'CHECKOUT' }, { type: 'RESET' })).toEqual(initialShop);
  });
});
