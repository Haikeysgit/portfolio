import { useEffect, useReducer, useState } from 'react';
import { PLACES, PRODUCTS, initialShop, lineId, priceOf, productOf, recommend, shopReducer, subtotal, type Product } from './state';
import { SAMPLE_BANDS, feeForDistance } from './pricing';
import './hsbyfiona.css';

// A replica of hsbyfiona.com in the store's own branding (plum and blush, Cormorant Garamond + Jost), on demo data.

type View = 'intro' | 'shop' | 'product' | 'scent' | 'track';
const naira = (n: number) => '₦' + n.toLocaleString('en-NG');
const FILTERS = ['All', 'Perfumes', 'Oils'] as const;
const VIBES = ['Sweet', 'Fresh', 'Soft & musky'];

export default function HsbyfionaDemo() {
  const [s, dispatch] = useReducer(shopReducer, initialShop);
  const [view, setView] = useState<View>('intro');
  const [pid, setPid] = useState(PRODUCTS[0].id);
  const [size, setSize] = useState(PRODUCTS[0].size);
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>('All');
  const [paying, setPaying] = useState(false);
  const [toast, setToast] = useState<{ id: number; text: string } | null>(null);
  const [quiz, setQuiz] = useState<{ who?: 'Her' | 'Him' | 'Anyone'; vibe?: string }>({});
  const count = s.cart.reduce((n, l) => n + l.qty, 0);
  const sub = subtotal(s.cart);
  const fee = s.km === null ? null : feeForDistance(SAMPLE_BANDS, s.km);
  const place = PLACES.find((p) => p.km === s.km);
  const product = PRODUCTS.find((p) => p.id === pid)!;
  const cartOpen = s.phase === 'cart';
  const checkingOut = s.phase === 'address' || s.phase === 'pay';

  useEffect(() => {
    if (view !== 'intro') return;
    const t = setTimeout(() => setView('shop'), 2600);
    return () => clearTimeout(t);
  }, [view]);
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 2000);
    return () => clearTimeout(t);
  }, [toast]);
  useEffect(() => {
    if (!paying) return;
    const t = setTimeout(() => {
      dispatch({ type: 'PAY_SUCCESS', ref: 'HS-' + Math.floor(100000 + Math.random() * 900000) });
      setPaying(false);
    }, 1200);
    return () => clearTimeout(t);
  }, [paying]);

  const openProduct = (p: Product) => {
    setPid(p.id);
    setSize(p.size);
    setView('product');
  };
  const add = () => {
    dispatch({ type: 'ADD', id: lineId(product.id, size) });
    setToast({ id: Date.now(), text: `${product.name} added to cart` });
  };
  const goTab = (v: View) => {
    if (s.phase !== 'paid') dispatch({ type: 'BROWSE' });
    setView(v);
  };
  const restart = () => {
    setPaying(false);
    setQuiz({});
    dispatch({ type: 'RESET' });
    setView('intro');
  };
  const shown = PRODUCTS.filter((p) => filter === 'All' || (filter === 'Oils' ? p.kind === 'Perfume oil' : p.kind === 'Perfume'));

  if (view === 'intro') {
    return (
      <div className="hsj">
        <button type="button" className="hs-intro" onClick={() => setView('shop')} aria-label="Enter the shop">
          <span className="hs-intro-k">Welcome to</span>
          <span className="hs-intro-t">Heavenscented</span>
          <span className="hs-intro-by">by Fiona</span>
          <span className="hs-intro-tap">Tap to enter</span>
        </button>
      </div>
    );
  }

  return (
    <div className="hsj">
      <div className="hs-shell">
        <header className="hs-top">
          <button type="button" className="hs-logo" onClick={() => goTab('shop')}>HS <em>by Fiona</em></button>
          <div className="hs-top-r">
            <button type="button" className="hs-text" onClick={restart}>Restart</button>
            <button type="button" className="hs-bag" aria-label={`Cart, ${count} items`} onClick={() => dispatch({ type: 'OPEN_CART' })}>
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 8h14l-1.2 11.2a2 2 0 0 1-2 1.8H8.2a2 2 0 0 1-2-1.8z" /><path d="M9 8V6.5a3 3 0 0 1 6 0V8" /></svg>
              {count > 0 && <span key={count} className="hs-badge">{count}</span>}
            </button>
          </div>
        </header>

        {toast && <div key={toast.id} className="hs-toast" role="status">{toast.text}</div>}

        <main className="hs-main hs-screen" key={s.phase === 'paid' ? 'order' : checkingOut ? 'checkout' : view + pid}>
          {s.phase === 'paid' && s.order ? (
            <section className="hs-order">
              <p className="hs-eyebrow">Order confirmed</p>
              <h2 className="hs-h">Thank you. It's on its way to you.</h2>
              <p className="hs-mut">Order {s.order.ref} · a PDF receipt was emailed to you and to the shop.</p>
              <ol className="hs-timeline">
                {['Paid', 'Being packed', 'Out for delivery', 'Delivered'].map((t, i) => (
                  <li key={t} className={i === 0 ? 'is-done' : ''}><span className="hs-dot" />{t}{i === 0 && <small> · just now</small>}</li>
                ))}
              </ol>
              <div className="hs-receipt">
                <p className="hs-receipt-h">HS by Fiona · Receipt</p>
                {s.cart.map((l) => {
                  const p = productOf(l.id)!;
                  return <div key={l.id} className="hs-rl"><span>{l.qty} × {p.name} · {l.id.split(':')[1]}</span><span>{naira(priceOf(l.id) * l.qty)}</span></div>;
                })}
                <div className="hs-rl"><span>Delivery to {place?.name} ({place?.km} km)</span><span>{naira(s.order.delivery)}</span></div>
                <div className="hs-rl hs-rl-total"><span>Paid</span><span>{naira(s.order.total)}</span></div>
              </div>
              <button type="button" className="hs-btn" onClick={restart}>Shop again</button>
            </section>
          ) : checkingOut ? (
            <section className="hs-checkout">
              <button type="button" className="hs-back" onClick={() => dispatch({ type: 'BACK' })}>← Cart</button>
              <h2 className="hs-h">Checkout</h2>
              <p className="hs-label">Deliver to</p>
              <div className="hs-places" role="group" aria-label="Delivery area">
                {PLACES.map((p) => (
                  <button key={p.name} type="button" aria-pressed={s.km === p.km} onClick={() => dispatch({ type: 'SET_KM', km: p.km })}>
                    <span><strong>{p.name}</strong><small>{p.km} km by road from the shop</small></span>
                    <span className="hs-fee">{naira(feeForDistance(SAMPLE_BANDS, p.km))}</span>
                  </button>
                ))}
              </div>
              <div className="hs-sum"><span>Subtotal</span><span>{naira(sub)}</span></div>
              <div className="hs-sum"><span>Delivery</span><span>{fee === null ? 'Pick an area' : naira(fee)}</span></div>
              <div className="hs-sum hs-sum-total"><span>Total</span><span>{fee === null ? '—' : naira(sub + fee)}</span></div>
              <p className="hs-note">Prices are checked again on the server before you pay. The page can't change what you're charged.</p>
              <button type="button" className="hs-btn" disabled={s.km === null} onClick={() => dispatch({ type: 'PAY' })}>Pay {fee === null ? '' : naira(sub + fee)}</button>
            </section>
          ) : view === 'shop' ? (
            <section>
              <h1 className="hs-hero">Perfumes, oils and mists, <em>delivered across Akure.</em></h1>
              <div className="hs-chips" role="group" aria-label="Filter">
                {FILTERS.map((f) => <button key={f} type="button" aria-pressed={filter === f} onClick={() => setFilter(f)}>{f}</button>)}
              </div>
              <div className="hs-grid">
                {shown.map((p, i) => (
                  <button key={p.id} type="button" className="hs-card" style={{ animationDelay: `${i * 60}ms` }} onClick={() => openProduct(p)}>
                    <img src={p.img} alt={`${p.name} by ${p.brand}`} width="240" height="240" loading="lazy" />
                    <span className="hs-card-b">
                      <span className="hs-brand">{p.brand}</span>
                      <span className="hs-name">{p.name}</span>
                      <span className="hs-price">{p.sizes ? 'From ' : ''}{naira(p.price)}</span>
                    </span>
                  </button>
                ))}
              </div>
            </section>
          ) : view === 'product' ? (
            <section className="hs-product">
              <button type="button" className="hs-back" onClick={() => setView('shop')}>← Shop</button>
              <div className="hs-pgrid">
                <img className="hs-pimg" src={product.img} alt={`${product.name} by ${product.brand}`} width="480" height="480" />
                <div className="hs-pinfo">
                  <p className="hs-crumb">{product.kind === 'Perfume oil' ? 'Oils' : 'Perfumes'} › {product.family}</p>
                  <p className="hs-brand">{product.brand}</p>
                  <h2 className="hs-pname">{product.name} <span>— {product.kind}</span></h2>
                  <p className="hs-pprice">{naira(priceOf(lineId(product.id, size)))} <small>/ {size}</small></p>
                  {product.sizes && (
                    <div className="hs-chips" role="group" aria-label="Size">
                      {product.sizes.map((z) => <button key={z.label} type="button" aria-pressed={size === z.label} onClick={() => setSize(z.label)}>{z.label} · {naira(z.price)}</button>)}
                    </div>
                  )}
                  <div className="hs-tags">{product.profile.map((t) => <span key={t}>{t}</span>)}<span>For {product.for.toLowerCase()}</span></div>
                  <div className="hs-two">
                    <button type="button" className="hs-btn hs-btn-soft" onClick={add}>Add to cart</button>
                    <button type="button" className="hs-btn" onClick={() => { add(); dispatch({ type: 'CHECKOUT' }); }}>Buy now</button>
                  </div>
                  <p className="hs-note">Delivery to Akure and every state in Nigeria. The exact fee shows at checkout.</p>
                </div>
              </div>
            </section>
          ) : view === 'scent' ? (
            <section className="hs-scent">
              <p className="hs-eyebrow">Scent match · {quiz.who ? (quiz.vibe ? 'Your picks' : '2 of 2') : '1 of 2'}</p>
              {!quiz.who ? (
                <>
                  <h2 className="hs-h">Who is it for?</h2>
                  <div className="hs-options">{(['Her', 'Him', 'Anyone'] as const).map((w) => <button key={w} type="button" onClick={() => setQuiz({ who: w })}>{w === 'Anyone' ? 'Anyone' : `For ${w.toLowerCase()}`}</button>)}</div>
                </>
              ) : !quiz.vibe ? (
                <>
                  <h2 className="hs-h">What should it smell like?</h2>
                  <div className="hs-options">{VIBES.map((v) => <button key={v} type="button" onClick={() => setQuiz({ ...quiz, vibe: v })}>{v}</button>)}</div>
                  <button type="button" className="hs-text" onClick={() => setQuiz({})}>← Back</button>
                </>
              ) : (
                <>
                  <h2 className="hs-h">We think you'll love these.</h2>
                  <div className="hs-grid">
                    {recommend({ who: quiz.who, vibe: quiz.vibe }).map((p, i) => (
                      <button key={p.id} type="button" className="hs-card" style={{ animationDelay: `${i * 70}ms` }} onClick={() => openProduct(p)}>
                        <img src={p.img} alt={`${p.name} by ${p.brand}`} width="240" height="240" />
                        <span className="hs-card-b"><span className="hs-brand">{p.brand}</span><span className="hs-name">{p.name}</span><span className="hs-price">{naira(p.price)}</span></span>
                      </button>
                    ))}
                  </div>
                  <button type="button" className="hs-text" onClick={() => setQuiz({})}>Start again</button>
                </>
              )}
            </section>
          ) : (
            <section>
              <h2 className="hs-h">Track an order</h2>
              <p className="hs-mut">Place an order in this demo and its status shows here, step by step.</p>
              <ol className="hs-timeline">
                {['Paid', 'Being packed', 'Out for delivery', 'Delivered'].map((t) => <li key={t}><span className="hs-dot" />{t}</li>)}
              </ol>
              <button type="button" className="hs-btn" onClick={() => goTab('shop')}>Go shopping</button>
            </section>
          )}
        </main>

        <nav className="hs-tabs" aria-label="Main">
          {([['shop', 'Shop'], ['scent', 'Scent match'], ['track', 'Track']] as const).map(([v, label]) => (
            <button key={v} type="button" aria-current={view === v || (v === 'shop' && view === 'product') ? 'page' : undefined} onClick={() => goTab(v)}>{label}</button>
          ))}
        </nav>
      </div>

      {cartOpen && (
        <div className="hs-scrim" onClick={(e) => e.target === e.currentTarget && dispatch({ type: 'BACK' })}>
          <div className="hs-sheet" role="dialog" aria-modal="true" aria-label="Cart">
            <span className="hs-grab" aria-hidden="true" />
            <h3 className="hs-h hs-h-sm">Your cart</h3>
            {s.cart.length === 0 && <p className="hs-mut">Your cart is empty.</p>}
            <ul className="hs-lines">
              {s.cart.map((l) => {
                const p = productOf(l.id)!;
                return (
                  <li key={l.id}>
                    <img src={p.img} alt="" width="52" height="52" />
                    <span className="hs-ln"><strong>{p.name}</strong><small>{l.id.split(':')[1]} · {naira(priceOf(l.id))}</small></span>
                    <span className="hs-qty">
                      <button type="button" aria-label={`One fewer ${p.name}`} onClick={() => dispatch({ type: 'SET_QTY', id: l.id, qty: l.qty - 1 })}>−</button>
                      <span>{l.qty}</span>
                      <button type="button" aria-label={`One more ${p.name}`} onClick={() => dispatch({ type: 'SET_QTY', id: l.id, qty: l.qty + 1 })}>+</button>
                    </span>
                  </li>
                );
              })}
            </ul>
            <div className="hs-sum hs-sum-total"><span>Subtotal</span><span>{naira(sub)}</span></div>
            <button type="button" className="hs-btn" disabled={!s.cart.length} onClick={() => dispatch({ type: 'CHECKOUT' })}>Checkout</button>
          </div>
        </div>
      )}

      {s.phase === 'pay' && (
        <div className="hs-scrim hs-scrim-c">
          <div className="hs-paybox" role="dialog" aria-modal="true" aria-label="Demo payment">
            <p className="hs-eyebrow">Demo payment · no card is charged</p>
            <p className="hs-payamt">{naira(sub + (fee ?? 0))}</p>
            <p className="hs-mut">In the real store this is Paystack's checkout. The order is only marked paid when Paystack confirms the exact total.</p>
            <button type="button" className="hs-btn" disabled={paying} onClick={() => setPaying(true)}>{paying ? 'Confirming payment…' : 'Pay now'}</button>
            <button type="button" className="hs-text" disabled={paying} onClick={() => dispatch({ type: 'BACK' })}>Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
}
