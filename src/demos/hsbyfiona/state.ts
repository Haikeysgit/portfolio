import { SAMPLE_BANDS, feeForDistance } from './pricing';

// Real products from hsbyfiona.com (names, brands, prices, sizes, scent profiles), all in stock on 2026-11-04.
export type Product = {
  id: string; name: string; brand: string; kind: string; family: string; profile: string[];
  for: 'Her' | 'Him' | 'Everyone'; price: number; size: string; sizes?: { label: string; price: number }[]; img: string;
};
const img = (id: string) => `/images/projects/hsbyfiona/products/${id}.webp`;
export const PRODUCTS: Product[] = [
  { id: 'cloud-candy', name: 'Cloud candy', brand: 'KHADLAJ', kind: 'Perfume', family: 'Fruity', profile: ['Fruity', 'Floral', 'Sweet'], for: 'Her', price: 46000, size: '100ml', img: img('cloud-candy') },
  { id: 'now-women', name: 'Now women', brand: 'RAVE', kind: 'Perfume', family: 'Sweet', profile: ['Sweet', 'Fruity', 'Floral'], for: 'Her', price: 29000, size: '100ml', img: img('now-women') },
  { id: 'terra', name: 'Terra', brand: 'RAYHAAN', kind: 'Perfume', family: 'Soft & musky', profile: ['Soft & musky', 'Oud & woody'], for: 'Him', price: 50000, size: '100ml', img: img('terra') },
  { id: 'freeze', name: 'Freeze', brand: 'RIIFFS', kind: 'Perfume', family: 'Fresh', profile: ['Fresh', 'Soft & musky'], for: 'Him', price: 56000, size: '100ml', img: img('freeze') },
  {
    id: 'tahara', name: 'Tahara', brand: 'MUSK TAHARA', kind: 'Perfume oil', family: 'Soft & musky', profile: ['Soft & musky'], for: 'Everyone', price: 18000, size: '20ml',
    sizes: [{ label: '20ml', price: 18000 }, { label: '50ml', price: 25000 }, { label: '100ml', price: 40000 }], img: img('tahara'),
  },
];

/** A cart line is one product in one size. */
export const lineId = (productId: string, size: string) => `${productId}:${size}`;
export function priceOf(id: string): number {
  const [pid, size] = id.split(':');
  const p = PRODUCTS.find((x) => x.id === pid);
  if (!p) return 0;
  return p.sizes?.find((s) => s.label === size)?.price ?? (size === p.size ? p.price : 0);
}
export const productOf = (id: string) => PRODUCTS.find((p) => p.id === id.split(':')[0]);

/** Scent match: products whose real scent profile has the vibe, for the person asked about. */
export function recommend(a: { who: 'Her' | 'Him' | 'Anyone'; vibe: string }): Product[] {
  return PRODUCTS.filter((p) => p.profile.includes(a.vibe) && (a.who === 'Anyone' || p.for === a.who || p.for === 'Everyone'));
}

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
  | { type: 'BROWSE' }
  | { type: 'CHECKOUT' }
  | { type: 'SET_KM'; km: number }
  | { type: 'PAY' }
  | { type: 'PAY_SUCCESS'; ref: string }
  | { type: 'RESET' };

export const initialShop: ShopState = { cart: [], km: null, phase: 'browse', order: null };

/** Prices come from the product list, the way the server re-prices a cart. Unknown items count for nothing. */
export function subtotal(cart: CartLine[]): number {
  return cart.reduce((sum, l) => sum + priceOf(l.id) * l.qty, 0);
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
    case 'BROWSE':
      return { ...s, phase: 'browse' };
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
