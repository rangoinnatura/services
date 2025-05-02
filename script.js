// script.js

const SPREADSHEET_ID = '1Ns-dGKYtrrmOfps8CSwklYp3PWjDzniahaclItoZJ1M';
const BASE_SHEET_URL = `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/gviz/tq?gid=0&tqx=out:json`;

let items = [];
let activeCategory = 'Todos';
let orderMode = 'Entrega'; // estado atual do modo

const gridEl       = document.getElementById('grid');
const totalEl      = document.getElementById('total');
const genBtn       = document.getElementById('generate');
const outputEl     = document.getElementById('order-text');
const categoriesEl = document.getElementById('categories');
const template     = document.getElementById('item-template');
const modeEntrega  = document.getElementById('mode-entrega');
const modeRetirada = document.getElementById('mode-retirada');

// inicializa botões de modo
function updateModeButtons() {
  if (orderMode === 'Entrega') {
    modeEntrega.classList.add('active');
    modeRetirada.classList.remove('active');
  } else {
    modeEntrega.classList.remove('active');
    modeRetirada.classList.add('active');
  }
}
modeEntrega.addEventListener('click', () => { orderMode = 'Entrega'; updateModeButtons(); });
modeRetirada.addEventListener('click', () => { orderMode = 'Retirada'; updateModeButtons(); });
updateModeButtons();

// cria botão “Copiar pedido”
const copyBtn = document.createElement('button');
copyBtn.textContent     = 'Copiar pedido';
copyBtn.className       = 'button-secondary';
copyBtn.style.width     = '100%';
copyBtn.style.marginTop = '0.5rem';
copyBtn.addEventListener('click', () => {
  navigator.clipboard.writeText(outputEl.value)
    .then(() => {
      copyBtn.textContent = 'Copiado!';
      copyBtn.classList.add('copied');
      setTimeout(() => {
        copyBtn.textContent = 'Copiar pedido';
        copyBtn.classList.remove('copied');
      }, 2000);
    })
    .catch(err => console.error('Erro ao copiar:', err));
});
outputEl.parentNode.insertBefore(copyBtn, outputEl.nextSibling);

function formatBRL(v) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}
function getItemName(item) {
  return item.protein && item.side
    ? `${item.protein} + ${item.side}`
    : item.protein || item.side || '';
}
function calcTotal() {
  const sum = items.reduce((acc, i) => acc + (i.qty * i.price), 0);
  totalEl.textContent = formatBRL(sum);
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
  calcTotal();
  qtyEl.classList.add('bump');
  qtyEl.addEventListener('animationend', () => qtyEl.classList.remove('bump'), { once: true });
  updateButtonState(id);
}

// Gera o texto final incluindo modo, data/hora e mensagem estilizada
function generateOrder() {
  const now = new Date();
  const dateStr = now.toLocaleDateString('pt-BR', {
    day:   '2-digit',
    month: 'long',
    year:  'numeric'
  });
  const timeStr = now.toLocaleTimeString('pt-BR', {
    hour:   '2-digit',
    minute: '2-digit'
  });

  const lines = [];
  lines.push('🛒 *Pedido Pronta Entrega Rango in Natura*');
  lines.push(`📅 ${dateStr} às ${timeStr}`);
  lines.push(`📍 ${orderMode === 'Entrega' ? '🚚 Entrega' : '🏬 Retirada'}`);
  lines.push('');
  items.forEach(item => {
    if (item.qty > 0) {
      lines.push(`• ${item.qty}x ${getItemName(item)}`);
    }
  });
  lines.push('');
  lines.push(`💰 *Total:* ${totalEl.textContent}`);
  lines.push('');
  lines.push('Comer bem nunca foi tão fácil! 💚');

  outputEl.value = lines.join('\n');
  outputEl.select();
}

function renderCategories() {
  const available = new Set(items.map(i => i.category));
  const order     = ['Todos','Refeições','Cremes','Lanches','Sobremesas'];
  const cats      = order.filter(cat => cat === 'Todos' || available.has(cat));
  categoriesEl.innerHTML = '';
  cats.forEach(cat => {
    const btn = document.createElement('button');
    btn.textContent = cat;
    btn.className   = 'category-btn' + (cat === activeCategory ? ' active' : '');
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
  const toShow = items.filter(
    i => activeCategory === 'Todos' || i.category === activeCategory
  );
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
    plusBtn.addEventListener('click',  () => updateQty(item.id, +1));
    gridEl.appendChild(clone);
    updateButtonState(item.id);
  });
}

async function fetchSheet() {
  const url = `${BASE_SHEET_URL}&t=${Date.now()}`;
  gridEl.innerHTML = '<p class="loader">Carregando menu…</p>';
  try {
    const res  = await fetch(url);
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
    })).filter(i => i.stock > 0);
    renderCategories();
    renderItems();
    calcTotal();
  } catch(err) {
    console.error('Erro ao buscar dados:', err);
    gridEl.innerHTML = '<p>Ops, não foi possível carregar o menu.</p>';
  }
}

genBtn.addEventListener('click', generateOrder);
fetchSheet();
