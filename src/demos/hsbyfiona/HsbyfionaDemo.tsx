import { useEffect, useReducer, useState } from 'react';
import { PLACES, PRODUCTS, initialShop, shopReducer, subtotal } from './state';
import { SAMPLE_BANDS, feeForDistance } from './pricing';
import './hsbyfiona.css';

const naira = (n: number) => '₦' + n.toLocaleString('en-NG');

const NOTES: Record<string, string> = {
  browse: 'Pages are plain HTML from the server. Only the cart, checkout and search ship JavaScript.',
  cart: 'The cart only holds product IDs and quantities. Prices shown here are never trusted at checkout.',
  address: 'Checkout re-prices the cart on the server, checks stock, measures the road distance and creates an unpaid order.',
  pay: "Paystack takes the payment. Its signed webhook, or the redirect check, confirms the exact total before anything else happens.",
  paid: 'Marked paid once, for the exact amount. Stock goes down and a PDF receipt is emailed to you and the owner.',
};

export default function HsbyfionaDemo() {
  const [s, dispatch] = useReducer(shopReducer, initialShop);
  const [paying, setPaying] = useState(false);
  const count = s.cart.reduce((n, l) => n + l.qty, 0);
  const sub = subtotal(s.cart);
  const fee = s.km === null ? null : feeForDistance(SAMPLE_BANDS, s.km);
  const place = PLACES.find((p) => p.km === s.km);

  useEffect(() => {
    if (!paying) return;
    const t = setTimeout(() => {
      dispatch({ type: 'PAY_SUCCESS', ref: 'HS-' + Math.floor(100000 + Math.random() * 900000) });
      setPaying(false);
    }, 1100);
    return () => clearTimeout(t);
  }, [paying]);

  return (
    <div className="hs">
      <div className="hs-app">
        <header className="hs-top">
          <span className="hs-brand">HS by Fiona</span>
          <div className="hs-top-r">
            {s.phase === 'browse' && (
              <button type="button" className="hs-cartbtn" onClick={() => dispatch({ type: 'OPEN_CART' })}>
                Cart{count > 0 && <span className="hs-badge">{count}</span>}
              </button>
            )}
            <button type="button" className="hs-link" onClick={() => { setPaying(false); dispatch({ type: 'RESET' }); }}>Reset</button>
          </div>
        </header>

        {s.phase === 'browse' && (
          <div className="hs-grid">
            {PRODUCTS.map((p) => (
              <article key={p.id} className="hs-card">
                <img src={p.img} alt={`${p.name} ${p.kind.toLowerCase()} bottle`} width="240" height="240" loading="lazy" />
                <div className="hs-card-b">
                  <p className="hs-name">{p.name}</p>
                  <p className="hs-kind">{p.kind}</p>
                  <p className="hs-price">{naira(p.price)}</p>
                  <button type="button" className="hs-btn hs-sm" onClick={() => dispatch({ type: 'ADD', id: p.id })}>
                    Add to cart
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}

        {s.phase === 'cart' && (
          <section className="hs-panel">
            <button type="button" className="hs-link" onClick={() => dispatch({ type: 'BACK' })}>← Keep shopping</button>
            <h4>Your cart</h4>
            {s.cart.length === 0 && <p className="hs-dim">Your cart is empty.</p>}
            <ul className="hs-lines">
              {s.cart.map((l) => {
                const p = PRODUCTS.find((x) => x.id === l.id)!;
                return (
                  <li key={l.id}>
                    <img src={p.img} alt="" width="48" height="48" />
                    <span className="hs-ln">{p.name}<small>{naira(p.price)}</small></span>
                    <span className="hs-qty">
                      <button type="button" aria-label={`One fewer ${p.name}`} onClick={() => dispatch({ type: 'SET_QTY', id: l.id, qty: l.qty - 1 })}>−</button>
                      <span>{l.qty}</span>
                      <button type="button" aria-label={`One more ${p.name}`} onClick={() => dispatch({ type: 'SET_QTY', id: l.id, qty: l.qty + 1 })}>+</button>
                    </span>
                  </li>
                );
              })}
            </ul>
            <div className="hs-sum"><span>Subtotal</span><strong>{naira(sub)}</strong></div>
            <button type="button" className="hs-btn" disabled={!s.cart.length} onClick={() => dispatch({ type: 'CHECKOUT' })}>Checkout</button>
          </section>
        )}

        {s.phase === 'address' && (
          <section className="hs-panel">
            <button type="button" className="hs-link" onClick={() => dispatch({ type: 'BACK' })}>← Back to cart</button>
            <h4>Where should we deliver?</h4>
            <div className="hs-places" role="group" aria-label="Delivery area">
              {PLACES.map((p) => (
                <button key={p.name} type="button" aria-pressed={s.km === p.km} onClick={() => dispatch({ type: 'SET_KM', km: p.km })}>
                  <strong>{p.name}</strong>
                  <small>{p.km} km by road · {naira(feeForDistance(SAMPLE_BANDS, p.km))}</small>
                </button>
              ))}
            </div>
            <div className="hs-sum"><span>Subtotal</span><span>{naira(sub)}</span></div>
            <div className="hs-sum"><span>Delivery{place ? ` to ${place.name}` : ''}</span><span>{fee === null ? '—' : naira(fee)}</span></div>
            <div className="hs-sum hs-total"><span>Total</span><strong>{fee === null ? '—' : naira(sub + fee)}</strong></div>
            <button type="button" className="hs-btn" disabled={s.km === null} onClick={() => dispatch({ type: 'PAY' })}>Pay with Paystack</button>
          </section>
        )}

        {s.phase === 'pay' && (
          <div className="hs-modal" role="dialog" aria-modal="true" aria-label="Demo checkout">
            <div className="hs-modal-in">
              <p className="hs-kicker">Demo checkout · no real payment</p>
              <h5>Pay {naira(sub + (fee ?? 0))}</h5>
              <div className="hs-fake">Test card ···· 4081</div>
              <button type="button" className="hs-btn" disabled={paying} onClick={() => setPaying(true)}>
                {paying ? 'Confirming payment…' : 'Pay now'}
              </button>
              <button type="button" className="hs-link" disabled={paying} onClick={() => dispatch({ type: 'BACK' })}>Cancel</button>
            </div>
          </div>
        )}

        {s.phase === 'paid' && s.order && (
          <section className="hs-panel hs-receipt">
            <p className="hs-kicker">Order confirmed</p>
            <h4>Receipt {s.order.ref}</h4>
            <ul className="hs-rlines">
              {s.cart.map((l) => {
                const p = PRODUCTS.find((x) => x.id === l.id)!;
                return <li key={l.id}><span>{l.qty} × {p.name}</span><span>{naira(p.price * l.qty)}</span></li>;
              })}
              <li><span>Delivery to {place?.name}</span><span>{naira(s.order.delivery)}</span></li>
              <li className="hs-total"><span>Paid</span><strong>{naira(s.order.total)}</strong></li>
            </ul>
            <p className="hs-dim">A PDF copy of this receipt was emailed to you and to the shop.</p>
          </section>
        )}
      </div>

      <aside className="hs-notes" aria-live="polite">
        <p className="hs-kicker">Behind the scenes</p>
        <p>{NOTES[s.phase]}</p>
        <ol className="hs-steps">
          {(['browse', 'cart', 'address', 'pay', 'paid'] as const).map((ph) => (
            <li key={ph} className={ph === s.phase ? 'is-on' : ''}>{{ browse: 'Browse', cart: 'Cart', address: 'Delivery', pay: 'Payment', paid: 'Receipt' }[ph]}</li>
          ))}
        </ol>
      </aside>
    </div>
  );
}
