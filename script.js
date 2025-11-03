/* Halwa — simplified interactions
   - persistent cart (localStorage)
   - header mini-cart + indicator
   - cart page render and checkout helpers
   - lightbox uses data-high if present; placeholders (data-needs-image) are skipped
   - toast for feedback
*/

/* ---------- Toast ---------- */
function showToast(msg, timeout = 3000){
  const t = document.getElementById('toast');
  if(!t) return;
  t.textContent = msg;
  t.style.display = 'block';
  t.style.opacity = '1';
  clearTimeout(t._timer);
  t._timer = setTimeout(()=>{ t.style.opacity = '0'; t.style.display = 'none'; }, timeout);
}

/* ---------- Cart persistence ---------- */
const CART_KEY = 'halwa_cart_v1';
function getCart(){ try { return JSON.parse(localStorage.getItem(CART_KEY) || '[]'); } catch(e){ return []; } }
function saveCart(cart){ try { localStorage.setItem(CART_KEY, JSON.stringify(cart || [])); } catch(e){} }

/* Add item: simple dedupe by name */
function addToCart(name, opts = {}){
  const cart = getCart();
  const found = cart.find(i => i.name === name);
  if(found){ found.qty = (found.qty || 1) + 1; } else {
    cart.push({ id: opts.id || ('p_' + Math.random().toString(36).slice(2,9)), name, price: Number(opts.price || 79), qty: opts.qty || 1, img: opts.img || '', dataHigh: opts.dataHigh || '' });
  }
  saveCart(cart);
  updateCartIndicator();
  showToast(`"${name}" added to cart.`);
}

/* Remove / update */
function removeFromCart(idx){ const cart = getCart(); if(idx>=0 && idx<cart.length){ cart.splice(idx,1); saveCart(cart); updateCartIndicator(); showToast('Item removed'); } }
function updateQuantity(idx, qty){ const cart = getCart(); if(idx>=0 && idx<cart.length){ cart[idx].qty = Math.max(0, Math.floor(qty)||0); if(cart[idx].qty === 0) cart.splice(idx,1); saveCart(cart); updateCartIndicator(); } }

function cartTotals(cart){ const items = cart || getCart(); let subtotal = 0; items.forEach(i=> subtotal += (Number(i.price)||0)*(Number(i.qty)||0)); const shipping = items.length ? 6.00 : 0.00; const tax = +(subtotal * 0.07).toFixed(2); const total = +(subtotal + shipping + tax).toFixed(2); return {subtotal: +subtotal.toFixed(2), shipping, tax, total, itemsCount: items.reduce((s,i)=>s+(i.qty||0),0)} }

/* ---------- Header indicator and mini-cart ---------- */
function updateCartIndicator(){
  const countEls = document.querySelectorAll('#cartCount');
  const totals = cartTotals(getCart());
  countEls.forEach(el => el.textContent = totals.itemsCount || 0);
  renderMiniCart();
}

function renderMiniCart(){
  const itemsWrap = document.getElementById('miniCartItems');
  const subtotalEl = document.getElementById('miniCartSubtotal');
  if(!itemsWrap || !subtotalEl) return;
  const cart = getCart();
  if(!cart.length){ itemsWrap.innerHTML = `<div style="padding:10px;color:var(--muted)">Your cart is empty.</div>`; subtotalEl.textContent = ''; return; }
  itemsWrap.innerHTML = '';
  cart.forEach((it, idx) => {
    const row = document.createElement('div'); row.className = 'mini-cart-item';
    row.innerHTML = `${it.img ? `<img src="${escapeHtml(it.img)}" alt="${escapeHtml(it.name)}">` : ''}<div style="flex:1"><div style="font-weight:700">${escapeHtml(it.name)}</div><div style="font-size:13px;color:var(--muted)">${it.qty} × $${(Number(it.price)||0).toFixed(2)}</div></div><div><button class="btn btn-outline mini-remove" data-idx="${idx}">Remove</button></div>`;
    itemsWrap.appendChild(row);
  });
  const totals = cartTotals(cart);
  subtotalEl.textContent = `Subtotal: $${totals.subtotal.toFixed(2)}`;
  itemsWrap.querySelectorAll('.mini-remove').forEach(btn => btn.addEventListener('click', () => { removeFromCart(Number(btn.dataset.idx)); renderMiniCart(); }));
}

/* ---------- Cart page renderer ---------- */
function renderCartPage(rootEl){
  if(!rootEl) return;
  const cart = getCart();
  if(!cart.length){
    rootEl.innerHTML = `<div class="empty-msg"><h3>Your basket is empty</h3><p>Add items from the Home or Gallery pages. Cart is stored locally in this browser.</p><p style="margin-top:12px"><a class="btn btn-primary" href="index.html">Continue shopping</a></p></div>`;
    updateCartIndicator();
    return;
  }

  const table = document.createElement('table'); table.className = 'cart-table';
  table.innerHTML = `<thead><tr><th>Product</th><th>Price</th><th>Qty</th><th>Line</th><th></th></tr></thead>`;
  const tbody = document.createElement('tbody');

  cart.forEach((it, idx) => {
    const line = (Number(it.price)||0)*(Number(it.qty)||0);
    const tr = document.createElement('tr');
    tr.innerHTML = `<td style="display:flex;align-items:center;gap:12px">${it.img?`<img class="cart-item-media" src="${escapeHtml(it.img)}" alt="${escapeHtml(it.name)}">`:''}<div style="font-weight:700">${escapeHtml(it.name)}</div></td><td>$${(Number(it.price)||0).toFixed(2)}</td><td><input class="qty-input" type="number" min="0" value="${Number(it.qty)||1}" data-idx="${idx}"></td><td>$${line.toFixed(2)}</td><td><button class="btn btn-outline remove-btn" data-idx="${idx}">Remove</button></td>`;
    tbody.appendChild(tr);
  });

  table.appendChild(tbody);
  const totals = cartTotals(cart);
  const totalsHtml = document.createElement('div');
  totalsHtml.style.marginTop = '14px';
  totalsHtml.innerHTML = `<div style="display:flex;justify-content:space-between;gap:12px"><div><div style="font-size:14px;color:var(--muted)">Subtotal</div><div style="font-weight:700;font-size:18px">$${totals.subtotal.toFixed(2)}</div></div><div><div style="font-size:14px;color:var(--muted)">Shipping</div><div style="font-weight:700">$${totals.shipping.toFixed(2)}</div></div><div><div style="font-size:14px;color:var(--muted)">Tax</div><div style="font-weight:700">$${totals.tax.toFixed(2)}</div></div><div><div style="font-size:14px;color:var(--muted)">Total</div><div style="font-weight:900;font-size:20px">$${totals.total.toFixed(2)}</div></div></div><div style="display:flex;justify-content:space-between;align-items:center;margin-top:12px"><a class="btn btn-ghost" href="index.html">Continue shopping</a><div style="display:flex;gap:8px"><button id="clearCartBtn" class="btn btn-outline">Clear cart</button><a id="checkoutBtn" class="btn btn-primary" href="checkout.html">Checkout</a></div></div>`;

  rootEl.innerHTML = ''; rootEl.appendChild(table); rootEl.appendChild(totalsHtml);

  // events
  tbody.querySelectorAll('.qty-input').forEach(inp => inp.addEventListener('change', () => { const idx = Number(inp.dataset.idx); updateQuantity(idx, Number(inp.value)); renderCartPage(rootEl); }));
  tbody.querySelectorAll('.remove-btn').forEach(btn => btn.addEventListener('click', () => { removeFromCart(Number(btn.dataset.idx)); renderCartPage(rootEl); }));
  document.getElementById('clearCartBtn').addEventListener('click', () => { saveCart([]); renderCartPage(rootEl); showToast('Cart cleared'); updateCartIndicator(); });
}

/* ---------- Lightbox & image placeholder handling ---------- */
function openLightbox(imgEl){
  if(!imgEl) return;
  if(imgEl.dataset && imgEl.dataset.needsImage === '1') return; // skip placeholders
  const lb = document.getElementById('lightbox'), lbImg = document.getElementById('lightbox-img');
  if(!lb || !lbImg) return;
  lbImg.src = imgEl.dataset.high || imgEl.src;
  lb.classList.add('show'); document.body.style.overflow = 'hidden';
}
function closeLightbox(ev){ if(ev) ev.stopPropagation(); const lb = document.getElementById('lightbox'); if(!lb) return; lb.classList.remove('show'); const lbImg = document.getElementById('lightbox-img'); if(lbImg) lbImg.src = ''; document.body.style.overflow = ''; }

/* Skip fallback for placeholders; otherwise basic fallback */
function replaceBrokenImages(){
  const fallback = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==';
  document.querySelectorAll('img').forEach(img => {
    if(img.dataset && img.dataset.needsImage === '1') return; // placeholder you will replace
    if(img._handled) return;
    img._handled = true;
    img.addEventListener('error', function onerr(){
      if(img.dataset._retried){ img.src = fallback; img.removeEventListener('error', onerr); return; }
      img.dataset._retried = '1'; img.src = fallback;
    }, {passive:true});
  });
}

/* ---------- Navigation / mini-cart toggle / initialization ---------- */
document.addEventListener('DOMContentLoaded', () => {
  replaceBrokenImages();
  updateCartIndicator();

  // cart button & mini-cart toggle
  const cartBtn = document.getElementById('cartBtn');
  const mini = document.getElementById('miniCart');
  if(cartBtn && mini){
    cartBtn.addEventListener('click', (e) => { const open = mini.classList.toggle('show'); cartBtn.setAttribute('aria-expanded', String(open)); mini.setAttribute('aria-hidden', String(!open)); renderMiniCart(); e.stopPropagation(); });
    document.addEventListener('click', (e) => { if(!mini.classList.contains('show')) return; if(mini.contains(e.target) || cartBtn.contains(e.target)) return; mini.classList.remove('show'); cartBtn.setAttribute('aria-expanded','false'); mini.setAttribute('aria-hidden','true'); });
  }

  // contact form behavior (demo)
  const contactForm = document.getElementById('contactForm');
  if(contactForm) contactForm.addEventListener('submit', (e) => { e.preventDefault(); const name = contactForm.name?.value?.trim() || 'Friend'; if(!contactForm.email.value || !contactForm.message.value){ showToast('Complete required fields.'); return; } showToast(`Thanks ${name}! Your message is noted (demo).`); contactForm.reset(); });
});

/* ---------- helpers ---------- */
function escapeHtml(str){ return String(str||'').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
function populateCheckoutSummary(el){ if(!el) return; const totals = cartTotals(getCart()); if(!totals || totals.itemsCount === 0){ el.innerHTML = `<div style="font-size:14px;color:var(--muted)">Your cart is empty. <a href="index.html">Continue shopping</a></div>`; return; } el.innerHTML = `<div style="display:flex;justify-content:space-between"><div>Items</div><div>${totals.itemsCount}</div></div><div style="display:flex;justify-content:space-between"><div>Subtotal</div><div>$${totals.subtotal.toFixed(2)}</div></div><div style="display:flex;justify-content:space-between"><div>Shipping</div><div>$${totals.shipping.toFixed(2)}</div></div><div style="display:flex;justify-content:space-between"><div>Tax</div><div>$${totals.tax.toFixed(2)}</div></div><hr style="margin:12px 0"><div style="display:flex;justify-content:space-between;font-weight:700"><div>Total</div><div>$${totals.total.toFixed(2)}</div></div>`; }