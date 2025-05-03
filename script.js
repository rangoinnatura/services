const SPREADSHEET_ID = '1Ns-dGKYtrrmOfps8CSwklYp3PWjDzniahaclItoZJ1M';
const BASE_SHEET_URL = `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/gviz/tq?gid=0&tqx=out:json`;

let items = [];
let activeCategory = 'Todos';
let orderMode = 'Delivery';

const gridEl         = document.getElementById('grid');
const totalEl        = document.getElementById('total');
const categoriesEl   = document.getElementById('categories');
const template       = document.getElementById('item-template');
const modeEntrega    = document.getElementById('mode-entrega');
const modeRetirada   = document.getElementById('mode-retirada');
const cartFooterEl   = document.getElementById('cart-footer');
const cartTotalEl    = document.getElementById('cart-total');
const viewCartBtn    = document.getElementById('view-cart');
const cartDetailsEl  = document.getElementById('cart-details');
const closeCartBtn   = document.getElementById('close-cart');
const cartItemsEl    = document.getElementById('cart-items');
const panelTotalEl   = document.getElementById('panel-total');
const sendOrderBtn   = document.getElementById('send-order');

// Atualiza destaque dos modos
function updateModeButtons() {
  modeEntrega.classList.toggle('active', orderMode === 'Delivery');
  modeRetirada.classList.toggle('active', orderMode === 'Retirada');
}
modeEntrega.addEventListener('click', () => { orderMode = 'Delivery'; updateModeButtons(); });
modeRetirada.addEventListener('click', () => { orderMode = 'Retirada'; updateModeButtons(); });
updateModeButtons();

function formatBRL(v) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function getItemName(item) {
  return item.protein && item.side
    ? `${item.protein} + ${item.side}`
    : item.protein || '';
}

function calcTotal() {
  return items.reduce((acc, i) => acc + i.qty * i.price, 0);
}

function updateButtonState(id) {
  const minus = document.querySelector(`.qty-btn.minus[data-id="${id}"]`);
  const plus  = document.querySelector(`.qty-btn.plus[data-id="${id}"]`);
  const item  = items[id];
  minus.disabled = item.qty === 0;
  plus.disabled  = item.qty >= item.stock;
}

function updateQty(id, delta) {
  const item = items[id];
  item.qty = Math.max(0, item.qty + delta);

  const qtyEl = document.getElementById(`qty-${id}`);
  qtyEl.textContent = item.qty;
  qtyEl.classList.add('bump');
  qtyEl.addEventListener('animationend', () => qtyEl.classList.remove('bump'), { once: true });

  const sum = calcTotal();
  totalEl.textContent  = formatBRL(sum);
  updateCartFooter(sum);
  updateButtonState(id);
}

// Atualiza rodapé e painel de itens
function updateCartFooter(sum) {
  if (sum > 0) {
    cartFooterEl.classList.remove('hidden');
    cartTotalEl.textContent = formatBRL(sum);
  } else {
    cartFooterEl.classList.add('hidden');
    cartDetailsEl.classList.add('hidden');
  }
  // preenche lista do carrinho
  cartItemsEl.innerHTML = '';
  items.forEach(item => {
    if (item.qty > 0) {
      const li = document.createElement('li');
      li.textContent = `${item.qty}× ${getItemName(item)}`;
      cartItemsEl.appendChild(li);
    }
  });
  panelTotalEl.textContent = `Total: ${formatBRL(calcTotal())}`;
}

// Monta mensagem completa pro WhatsApp e retorna string
function generateFullMessage() {
  const now = new Date();
  const dateStr = now.toLocaleDateString('pt-BR', {
    day: '2-digit', month: 'long', year: 'numeric'
  });
  const timeStr = now.toLocaleTimeString('pt-BR', {
    hour: '2-digit', minute: '2-digit'
  });

  const lines = [
    '🛒 *Pedido Pronta Entrega Rango in Natura*',
    `📅 ${dateStr} às ${timeStr}`,
    ''
  ];
  items.forEach(item => {
    if (item.qty > 0) {
      lines.push(`• ${item.qty}x ${getItemName(item)}`);
    }
  });
  lines.push(
    '',
    `💰 *Total:* ${formatBRL(calcTotal())}`,
    orderMode === 'Delivery'
      ? '🛵 *Modo de entrega:* Delivery (valor à combinar)'
      : '🏬 *Modo de entrega:* Retirada',
    '',
    'Comer bem nunca foi tão fácil! 💚'
  );

  return lines.join('\n');
}

// Evento de abrir carrinho
viewCartBtn.addEventListener('click', () => {
  updateCartFooter(calcTotal());
  cartDetailsEl.classList.remove('hidden');
});

// Evento de fechar carrinho
closeCartBtn.addEventListener('click', () => {
  cartDetailsEl.classList.add('hidden');
});

// Evento de envio
sendOrderBtn.addEventListener('click', () => {
  const msg = generateFullMessage();
  sendOrderBtn.textContent = '⏳ Enviando…';
  sendOrderBtn.disabled = true;
  navigator.clipboard.writeText(msg)
    .then(() => {
      const waLink = `https://wa.me/5598983540048?text=${encodeURIComponent(msg)}`;
      window.open(waLink, '_blank');
    })
    .finally(() => {
      sendOrderBtn.textContent = 'Enviar Pedido';
      sendOrderBtn.disabled = false;
    });
});

// Render de categorias e itens
function renderCategories() {
  const available = new Set(items.map(i => i.category));
  const order     = ['Todos','Refeições','Cremes','Lanches','Sobremesas'];
  const cats      = order.filter(cat => cat === 'Todos' || available.has(cat));
  categoriesEl.innerHTML = '';
  cats.forEach(cat => {
    const btn = document.createElement('button');
    btn.textContent = cat;
    btn.className = 'category-btn' + (cat === activeCategory ? ' active' : '');
    btn.addEventListener('click', () => {
      activeCategory = cat;
      renderCategories();
      renderItems();
    });
    categoriesEl.appendChild(btn);
  });
}

function renderItems() {
  gridEl.innerHTML = '';
  const toShow = items.filter(i => activeCategory === 'Todos' || i.category === activeCategory);
  toShow.forEach(item => {
    const clone = template.content.cloneNode(true);
    clone.querySelector('.item-name').textContent   = getItemName(item);
    clone.querySelector('.price-tag').textContent   = formatBRL(item.price);
    clone.querySelector('.stock-count').textContent = item.stock;

    const minusBtn = clone.querySelector('.qty-btn.minus');
    const plusBtn  = clone.querySelector('.qty-btn.plus');
    const qtyEl    = clone.querySelector('.qty-display');

    minusBtn.dataset.id = item.id;
    plusBtn.dataset.id  = item.id;
    qtyEl.id            = `qty-${item.id}`;
    qtyEl.textContent   = item.qty;

    minusBtn.addEventListener('click', () => updateQty(item.id, -1));
    plusBtn.addEventListener('click', () => updateQty(item.id, +1));

    gridEl.appendChild(clone);
    updateButtonState(item.id);
  });
}

// Busca dados e inicia
async function fetchSheet() {
  gridEl.innerHTML = '<p class="loader">Carregando menu…</p>';
  try {
    const res  = await fetch(`${BASE_SHEET_URL}&t=${Date.now()}`);
    const txt  = await res.text();
    const json = txt.slice(txt.indexOf('{'), txt.lastIndexOf('}') + 1);
    const rows = JSON.parse(json).table.rows;
    items = rows.map((r,i) => ({
      id:       i,
      protein:  r.c[0]?.v || '',
      side:     r.c[1]?.v || '',
      price:    parseFloat(r.c[2]?.v) || 0,
      stock:    parseInt(r.c[3]?.v,10) || 0,
      category: r.c[4]?.v || 'Refeição',
      qty:      0
    }))
    .filter(item =>
      item.stock > 0 &&
      item.price > 0 &&
      Boolean(item.protein)
    );

    renderCategories();
    renderItems();
    const initialSum = calcTotal();
    totalEl.textContent = formatBRL(initialSum);
    updateCartFooter(initialSum);
  } catch(err) {
    console.error('Erro ao buscar dados:', err);
    gridEl.innerHTML = '<p>Ops, não foi possível carregar o menu.</p>';
  }
}

fetchSheet();
