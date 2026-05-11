const $ = (selector, parent = document) => parent.querySelector(selector);
const $$ = (selector, parent = document) => Array.from(parent.querySelectorAll(selector));
function getCart() {
  return JSON.parse(localStorage.getItem('freshShopCart') || '[]');
}
function saveCart(cart) {
  localStorage.setItem('freshShopCart', JSON.stringify(cart));
}
function money(value) {
  return Number(value).toLocaleString('en-US') + ' EGP';
}
function cleanCart() {
  return getCart().filter(item => item.name && Number(item.price)).map(item => ({
    name: item.name,
    price: Number(item.price),
    qty: Math.max(1, Number(item.qty) || 1)
  }));
}
function updateCartCount() {
  const count = cleanCart().reduce((total, item) => total + item.qty, 0);
  $$('[data-count]').forEach(box => {
    box.textContent = count;
    box.classList.toggle('show', count > 0);
  });
}
function showToast(text) {
  const box = $('[data-toast]');
  if (!box) return;
  box.textContent = text;
  box.classList.add('show');
  setTimeout(() => box.classList.remove('show'), 1200);
}
function addToCart(button) {
  const cart = cleanCart();
  const found = cart.find(item => item.name === button.dataset.name);
  if (found) found.qty++;
  else cart.push({ name: button.dataset.name, price: Number(button.dataset.price), qty: 1 });
  saveCart(cart);
  drawCart();
  updateCartCount();
  showToast(button.dataset.name + ' added to your order.');
}
function changeQty(index, step) {
  const cart = cleanCart();
  if (!cart[index]) return;
  cart[index].qty += step;
  if (cart[index].qty < 1) cart.splice(index, 1);
  saveCart(cart);
  drawCart();
  updateCartCount();
}
function drawCart() {
  const body = $('[data-items]');
  if (!body) return;
  const cart = cleanCart();
  body.innerHTML = '';
  cart.forEach((item, index) => {
    const row = document.createElement('tr');
    row.innerHTML = '<td data-line-name=""></td><td data-line-price=""></td><td><span class="qty"><button data-minus="" type="button">-</button><strong data-line-qty=""></strong><button data-plus="" type="button">+</button></span></td><td data-line-sum=""></td><td><button class="mini-btn" data-remove="" type="button">Remove</button></td>';
    $('[data-line-name]', row).textContent = item.name;
    $('[data-line-price]', row).textContent = money(item.price);
    $('[data-line-qty]', row).textContent = item.qty;
    $('[data-line-sum]', row).textContent = money(item.price * item.qty);
    $('[data-minus]', row).dataset.index = index;
    $('[data-plus]', row).dataset.index = index;
    $('[data-remove]', row).dataset.index = index;
    body.appendChild(row);
  });
  const total = cart.reduce((sum, item) => sum + item.price * item.qty, 0);
  if ($('[data-empty]')) $('[data-empty]').classList.toggle('show', cart.length === 0);
  if ($('[data-cart-total]')) $('[data-cart-total]').textContent = money(total);
  if ($('[data-checkout]')) $('[data-checkout]').disabled = cart.length === 0;
}
function showBill() {
  const cart = cleanCart();
  const bill = $('[data-bill]');
  const receipt = $('[data-receipt]');
  if (!cart.length) return showToast('Your cart is empty.');
  if (!bill || !receipt) return;
  const lines = cart.map(item => '<p class="bill-line"><span>' + item.name + ' x ' + item.qty + '</span><span>' + money(item.price * item.qty) + '</span></p>');
  const total = cart.reduce((sum, item) => sum + item.price * item.qty, 0);
  receipt.innerHTML = lines.join('') + '<p class="bill-total"><span>Total</span><span>' + money(total) + '</span></p>';
  bill.classList.add('show');
}
function setTheme(mode) {
  document.body.classList.toggle('night', mode === 'night');
  localStorage.setItem('freshTheme', mode);
  $$('[data-theme-text]').forEach(text => text.textContent = mode === 'night' ? 'Light' : 'Night');
  $$('[data-theme-symbol]').forEach(icon => icon.textContent = mode === 'night' ? '☀️' : '🌙');
}
function formMessage(form, text, error) {
  const box = $('[data-message]', form.parentElement);
  if (!box) return;
  box.textContent = text;
  box.classList.toggle('error', error);
  box.classList.add('show');
}
function checkField(field) {
  const box = field.closest('.input-box');
  const value = field.value.trim();
  let ok = true;
  if (field.required && value === '') ok = false;
  if (ok && field.type === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) ok = false;
  if (ok && field.type === 'tel' && !/^[0-9+\-\s]{8,}$/.test(value)) ok = false;
  if (ok && field.type === 'number' && Number(value) < Number(field.min || 0)) ok = false;
  if (ok && field.minLength > 0 && value.length < field.minLength) ok = false;
  if (ok && field.type === 'date') {
    const today = new Date().toISOString().split('T')[0];
    if (value < today) ok = false;
  }
  if (ok && field.dataset.match) {
    const first = $(field.dataset.match);
    if (first && value !== first.value.trim()) ok = false;
  }
  if (box) box.classList.toggle('bad', !ok);
  return ok;
}
function validForm(form) {
  let ok = true;
  for (const field of $$('input, textarea, select', form)) {
    if (!checkField(field) && ok) {
      ok = false;
      field.focus();
    }
  }
  if (!ok) formMessage(form, 'Please fix the highlighted fields.', true);
  return ok;
}
function sendForm(form) {
  if (!validForm(form)) return;
  sessionStorage.setItem('freshLastForm', location.pathname.split('/').pop());
  document.cookie = 'freshLastForm=' + encodeURIComponent(location.pathname.split('/').pop()) + '; max-age=2592000; path=/';
  formMessage(form, form.dataset.success || 'Done successfully.', false);
  form.reset();
}
document.addEventListener('DOMContentLoaded', () => {
  $$('[data-form]').forEach(form => form.noValidate = true);
  $$('input[type="date"]').forEach(input => input.min = new Date().toISOString().split('T')[0]);
  sessionStorage.setItem('freshLastPage', location.pathname.split('/').pop() || 'index.html');
  document.cookie = 'freshLastVisit=' + encodeURIComponent(location.pathname) + '; max-age=2592000; path=/';
  setTheme(localStorage.getItem('freshTheme') === 'night' ? 'night' : 'day');
  drawCart();
  updateCartCount();
});
document.addEventListener('click', event => {
  const target = event.target;
  if (target.closest('[data-theme-btn]')) setTheme(document.body.classList.contains('night') ? 'day' : 'night');
  if (target.closest('[data-add]')) addToCart(target.closest('[data-add]'));
  if (target.closest('[data-plus]')) changeQty(Number(target.closest('[data-plus]').dataset.index), 1);
  if (target.closest('[data-minus]')) changeQty(Number(target.closest('[data-minus]').dataset.index), -1);
  if (target.closest('[data-remove]')) changeQty(Number(target.closest('[data-remove]').dataset.index), -999);
  if (target.closest('[data-clear]')) {
    saveCart([]);
    drawCart();
    updateCartCount();
    if ($('[data-bill]')) $('[data-bill]').classList.remove('show');
  }
  if (target.closest('[data-checkout]')) showBill();
});
document.addEventListener('input', event => {
  if (event.target.closest('[data-form]')) checkField(event.target);
});
document.addEventListener('submit', event => {
  if (!event.target.matches('[data-form]')) return;
  event.preventDefault();
  sendForm(event.target);
});
