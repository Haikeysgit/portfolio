import { SAMPLE_BANDS, feeForDistance } from './pricing';

// Names and prices from hsbyfiona.com on 2026-11-04.
export const PRODUCTS = [
  { id: 'qissa-pink', name: 'Qissa Pink', kind: 'Perfume', price: 27000, img: '/images/projects/hsbyfiona/products/qissa-pink.webp' },
  { id: 'bond', name: 'Bond', kind: 'Perfume', price: 13000, img: '/images/projects/hsbyfiona/products/bond.webp' },
  { id: 'cloud-candy', name: 'Cloud Candy', kind: 'Perfume', price: 46000, img: '/images/projects/hsbyfiona/products/cloud-candy.webp' },
  { id: 'tahara', name: 'Tahara', kind: 'Perfume oil', price: 18000, img: '/images/projects/hsbyfiona/products/tahara.webp' },
] as const;

// Road distances from the store's own notes (convex/delivery/akurePricing.ts).
export const PLACES = [
  { name: 'FUTA', km: 11 },
  { name: 'Central Akure', km: 20 },
  { name: 'Oba-Ile', km: 26 },
] as const;

export type CartLine = { id: string; qty: number };
export type Order = { ref: string; subtotal: number; delivery: number; total: number };
export type ShopState = {
  cart: CartLine[];
  km: number | null;
  phase: 'browse' | 'cart' | 'address' | 'pay' | 'paid';
  order: Order | null;
};
export type ShopAction =
  | { type: 'ADD'; id: string }
  | { type: 'REMOVE'; id: string }
  | { type: 'SET_QTY'; id: string; qty: number }
  | { type: 'OPEN_CART' }
  | { type: 'BACK' }
  | { type: 'CHECKOUT' }
  | { type: 'SET_KM'; km: number }
  | { type: 'PAY' }
  | { type: 'PAY_SUCCESS'; ref: string }
  | { type: 'RESET' };

export const initialShop: ShopState = { cart: [], km: null, phase: 'browse', order: null };

/** Prices come from the product list, the way the server re-prices a cart. Unknown items count for nothing. */
export function subtotal(cart: CartLine[]): number {
  return cart.reduce((sum, l) => sum + (PRODUCTS.find((p) => p.id === l.id)?.price ?? 0) * l.qty, 0);
}

const setQty = (cart: CartLine[], id: string, qty: number) =>
  qty <= 0
    ? cart.filter((l) => l.id !== id)
    : cart.some((l) => l.id === id)
      ? cart.map((l) => (l.id === id ? { ...l, qty } : l))
      : [...cart, { id, qty }];

export function shopReducer(s: ShopState, a: ShopAction): ShopState {
  if (s.phase === 'paid' && a.type !== 'RESET') return s;
  switch (a.type) {
    case 'ADD':
      return { ...s, cart: setQty(s.cart, a.id, (s.cart.find((l) => l.id === a.id)?.qty ?? 0) + 1) };
    case 'REMOVE':
      return { ...s, cart: setQty(s.cart, a.id, 0) };
    case 'SET_QTY':
      return { ...s, cart: setQty(s.cart, a.id, a.qty) };
    case 'OPEN_CART':
      return { ...s, phase: 'cart' };
    case 'BACK':
      return { ...s, phase: s.phase === 'pay' ? 'address' : s.phase === 'address' ? 'cart' : 'browse' };
    case 'CHECKOUT':
      return s.cart.length ? { ...s, phase: 'address' } : s;
    case 'SET_KM':
      return { ...s, km: a.km };
    case 'PAY':
      return s.km !== null && s.cart.length ? { ...s, phase: 'pay' } : s;
    case 'PAY_SUCCESS': {
      if (s.phase !== 'pay' || s.km === null) return s;
      const sub = subtotal(s.cart);
      const delivery = feeForDistance(SAMPLE_BANDS, s.km);
      return { ...s, phase: 'paid', order: { ref: a.ref, subtotal: sub, delivery, total: sub + delivery } };
    }
    case 'RESET':
      return initialShop;
  }
}
