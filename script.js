// script.js

const SPREADSHEET_ID = '1Ns-dGKYtrrmOfps8CSwklYp3PWjDzniahaclItoZJ1M';
const BASE_SHEET_URL = `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/gviz/tq?gid=0&tqx=out:json`;

let items = [];
let activeCategory = 'Todos';
let orderMode = 'Delivery';

// Elementos gerais
const gridEl        = document.getElementById('grid');
const totalEl       = document.getElementById('total');
const categoriesEl  = document.getElementById('categories');
const template      = document.getElementById('item-template');
const cartFooterEl  = document.getElementById('cart-footer');
const cartTotalEl   = document.getElementById('cart-total');
const viewCartBtn   = document.getElementById('view-cart');

// Painel do carrinho
const cartDetailsEl       = document.getElementById('cart-details');
const closeCartBtn        = document.getElementById('close-cart');
const cartItemsEl         = document.getElementById('cart-items');
const panelTotalEl        = document.getElementById('panel-total');
const sendOrderBtn        = document.getElementById('send-order');

// Modo de pedido DENTRO do Painel
const modeEntregaPanel    = document.getElementById('mode-entrega-panel');
const modeRetiradaPanel   = document.getElementById('mode-retirada-panel');

// Formatação BRL
function formatBRL(v) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

// Nome do item
function getItemName(item) {
  return item.protein && item.side
    ? `${item.protein} + ${item.side}`
    : item.protein || '';
}

// Soma total
function calcTotal() {
  return items.reduce((sum, i) => sum + i.qty * i.price, 0);
}

// Atualiza botões de modo (no painel)
function updateModeButtons() {
  modeEntregaPanel.classList.toggle('active', orderMode === 'Delivery');
  modeRetiradaPanel.classList.toggle('active', orderMode === 'Retirada');
}
modeEntregaPanel.addEventListener('click', () => {
  orderMode = 'Delivery';
  updateModeButtons();
});
modeRetiradaPanel.addEventListener('click', () => {
  orderMode = 'Retirada';
  updateModeButtons();
});
updateModeButtons();

// Estado de botões (+/–)
function updateButtonState(id) {
  const minus = document.querySelector(`.qty-btn.minus[data-id="${id}"]`);
  const plus  = document.querySelector(`.qty-btn.plus[data-id="${id}"]`);
  const it    = items[id];
  minus.disabled = it.qty === 0;
  plus.disabled  = it.qty >= it.stock;
}

// Incrementa/decrementa quantidade
function updateQty(id, delta) {
  const it = items[id];
  it.qty = Math.max(0, it.qty + delta);
  const qtyEl = document.getElementById(`qty-${id}`);
  qtyEl.textContent = it.qty;
  qtyEl.classList.add('bump');
  qtyEl.addEventListener('animationend', () => qtyEl.classList.remove('bump'), { once: true });

  const sum = calcTotal();
  totalEl.textContent = formatBRL(sum);
  updateCartFooter(sum);
  updateButtonState(id);
}

// Atualiza rodapé externo e interno do carrinho
function updateCartFooter(sum) {
  if (sum > 0) {
    cartFooterEl.style.display = 'flex';
    cartTotalEl.textContent = `Total: ${formatBRL(sum)}`;
    panelTotalEl.textContent = `Total: ${formatBRL(sum)}`;
    // Também atualiza lista de itens
    cartItemsEl.innerHTML = '';
    items.forEach(it => {
      if (it.qty > 0) {
        const li = document.createElement('li');
        li.textContent = `${it.qty}× ${getItemName(it)}`;
        cartItemsEl.appendChild(li);
      }
    });
  } else {
    cartFooterEl.style.display = 'none';
    closePanel();
  }
}

// Gera a mensagem completa com data/hora
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
  items.forEach(it => {
    if (it.qty > 0) {
      lines.push(`• ${it.qty}x ${getItemName(it)}`);
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

// Abrir e fechar painel
function openPanel() {
  updateModeButtons();
  cartDetailsEl.classList.add('open');
  viewCartBtn.style.display = 'none';
}
function closePanel() {
  cartDetailsEl.classList.remove('open');
  viewCartBtn.style.display = 'inline-block';
}
viewCartBtn.addEventListener('click', () => {
  updateCartFooter(calcTotal());
  openPanel();
});
closeCartBtn.addEventListener('click', closePanel);

// Enviar pedido
sendOrderBtn.addEventListener('click', () => {
  const msg = generateFullMessage();
  const waLink = `https://wa.me/5598983540048?text=${encodeURIComponent(msg)}`;

  sendOrderBtn.textContent = '⏳ Enviando…';
  sendOrderBtn.disabled = true;

  window.open(waLink, '_blank');
  navigator.clipboard.writeText(msg);

  setTimeout(() => {
    sendOrderBtn.textContent = 'Enviar Pedido';
    sendOrderBtn.disabled = false;
  }, 1200);
});

// Render categorias e cards
function renderCategories() {
  const avail = new Set(items.map(i => i.category));
  const order = ['Todos','Refeições','Cremes','Lanches','Sobremesas'];
  categoriesEl.innerHTML = '';
  order.forEach(cat => {
    if (cat === 'Todos' || avail.has(cat)) {
      const btn = document.createElement('button');
      btn.textContent = cat;
      btn.className = 'category-btn' + (cat === activeCategory ? ' active' : '');
      btn.addEventListener('click', () => {
        activeCategory = cat;
        renderCategories();
        renderItems();
      });
      categoriesEl.appendChild(btn);
    }
  });
}

function renderItems() {
  gridEl.innerHTML = '';
  items.filter(i => activeCategory === 'Todos' || i.category === activeCategory)
    .forEach(it => {
      const clone = template.content.cloneNode(true);
      clone.querySelector('.item-name').textContent   = getItemName(it);
      clone.querySelector('.price-tag').textContent   = formatBRL(it.price);
      clone.querySelector('.stock-count').textContent = it.stock;

      const minus = clone.querySelector('.qty-btn.minus');
      const plus  = clone.querySelector('.qty-btn.plus');
      const qtyEl = clone.querySelector('.qty-display');

      minus.dataset.id = plus.dataset.id = it.id;
      qtyEl.id            = `qty-${it.id}`;
      qtyEl.textContent   = it.qty;

      minus.addEventListener('click', () => updateQty(it.id, -1));
      plus .addEventListener('click', () => updateQty(it.id, +1));

      gridEl.appendChild(clone);
      updateButtonState(it.id);
    });
}

// Busca do Google Sheets
async function fetchSheet() {
  gridEl.innerHTML = '<p class="loader">Carregando menu…</p>';
  try {
    const res = await fetch(`${BASE_SHEET_URL}&t=${Date.now()}`);
    const txt = await res.text();
    const json = txt.slice(txt.indexOf('{'), txt.lastIndexOf('}')+1);
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
    totalEl.textContent = formatBRL(calcTotal());
    updateCartFooter(calcTotal());
  } catch(err) {
    console.error(err);
    gridEl.innerHTML = '<p>Ops, não foi possível carregar o menu.</p>';
  }
}

fetchSheet();
