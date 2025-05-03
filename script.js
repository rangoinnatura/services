// script.js

const SPREADSHEET_ID = '1Ns-dGKYtrrmOfps8CSwklYp3PWjDzniahaclItoZJ1M';
const BASE_SHEET_URL = `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/gviz/tq?gid=0&tqx=out:json`;

let items = [];
let activeCategory = 'Todos';
let orderMode = 'Delivery';

const gridEl       = document.getElementById('grid');
const totalEl      = document.getElementById('total');
const genBtn       = document.getElementById('generate');
const outputEl     = document.getElementById('order-text');
const categoriesEl = document.getElementById('categories');
const template     = document.getElementById('item-template');
const modeEntrega  = document.getElementById('mode-entrega');
const modeRetirada = document.getElementById('mode-retirada');

// Inicializa botões de modo
function updateModeButtons() {
  modeEntrega.classList.toggle('active', orderMode === 'Delivery');
  modeRetirada.classList.toggle('active', orderMode === 'Retirada');
}
modeEntrega.addEventListener('click', () => { orderMode = 'Delivery'; updateModeButtons(); });
modeRetirada.addEventListener('click',  () => { orderMode = 'Retirada';  updateModeButtons(); });
updateModeButtons();

// Cria botão “Fazer pedido” com SVG inline
const copyBtn = document.createElement('button');
copyBtn.className       = 'button-secondary';
copyBtn.style.width     = '100%';
copyBtn.style.marginTop = '0.5rem';
copyBtn.innerHTML = `
  <svg width="20" height="20" viewBox="0 0 448 512" fill="currentColor"
       style="vertical-align:middle;margin-right:8px;">
    <path d="M380.9 97.1c-41.4-41.4-97.1-64.2-156.4-64.2-59.3
      0-115 22.8-156.4 64.2-41.4 41.4-64.2 97.1-64.2
      156.4 0 59.3 22.8 115 64.2 156.4l-42.3
      147.4 147.4-42.3c41.4 41.4 97.1 64.2 156.4
      64.2 59.3 0 115-22.8 156.4-64.2 41.4-41.4
      64.2-97.1 64.2-156.4 0-59.3-22.8-115-64.2-156.4zM256.2
      378.3c-18.4 0-36.5-4.9-51.9-14.1l-7.4-4.4-46.3
      13.3 13.3-46.3-4.4-7.4c-9.2-15.4-14.1-33.5-14.1-51.9
      0-64.6 52.4-117 117-117 31.3 0 60.2 12.2
      82.2 34.3 22.1 22.1 34.3 50.9 34.3
      82.2-.1 64.6-52.5 117-117.1 117zm63.2-85.6c-9.7-4.8-57
      -28.1-65.8-31.3-8.8-3.2-15.2-4.9-21.6 4.8s-24.8
      31.3-30.4 37.7c-5.6 6.4-11.3 7.2-20.9
      2.4-9.7-4.8-40.9-15.1-78-48.3-28.8-25.6-48.2-57.3
      -53.9-67-5.6-9.7-.6-15 4.2-19.8
      4.3-4.3 9.7-11.3 14.6-17
      4.8-5.6 6.4-9.7 9.7-16.1
      3.2-6.4 1.6-12 0.8-16.8-0.8-4.8-21.6-52-29.6-71.3
      -7.8-19.4-15.7-16.8-21.6-17.1-5.6-.3-12.8-.8-19.5-.8
      -6.6 0-17.1 2.4-26.1
      12-9 9.7-34.3 33.5-34.3
      81.5s35.1 94.6 40.1
      101.3c5 6.6 69.1 105.5
      167.6 147.8 23.4 10.1
      41.6 16.2 55.9
      20.7 23.5 7.6
      44.8 6.5 61.6
      3.9 18.8-2.9 57-23.3
      65.1-45.8 8.1-22.8
      8.1-42.4 5.7-45.8
      -2.4-3.3-8.8-5.6-18.5-10.4z"/>
  </svg>
  Fazer pedido
`;
copyBtn.addEventListener('click', () => {
  navigator.clipboard.writeText(outputEl.value)
    .then(() => {
      copyBtn.innerHTML = '✅ Copiado!';
      copyBtn.classList.add('copied');
      setTimeout(() => {
        const waLink = `https://wa.me/5598983540048?text=${encodeURIComponent(outputEl.value)}`;
        window.open(waLink, '_blank');
        copyBtn.innerHTML = `
          <svg width="20" height="20" viewBox="0 0 448 512" fill="currentColor"
               style="vertical-align:middle;margin-right:8px;">
            <path d="M380.9 97.1c-41.4-41.4-97.1-64.2-156.4-64.2-59.3
              0-115 22.8-156.4 64.2-41.4 41.4-64.2 97.1-64.2
              156.4 0 59.3 22.8 115 64.2 156.4l-42.3
              147.4 147.4-42.3c41.4 41.4 97.1 64.2 156.4
              64.2 59.3 0 115-22.8 156.4-64.2 41.4-41.4
              64.2-97.1 64.2-156.4 0-59.3-22.8-115-64.2-156.4zM256.2
              378.3c-18.4 0-36.5-4.9-51.9-14.1l-7.4-4.4-46.3
              13.3 13.3-46.3-4.4-7.4c-9.2-15.4-14.1-33.5-14.1-51.9
              0-64.6 52.4-117 117-117 31.3 0 60.2 12.2
              82.2 34.3 22.1 22.1 34.3 50.9 34.3
              82.2-.1 64.6-52.5 117-117.1 117zm63.2-85.6c-9.7-4.8-57
              -28.1-65.8-31.3-8.8-3.2-15.2-4.9-21.6 4.8s-24.8
              31.3-30.4 37.7c-5.6 6.4-11.3 7.2-20.9
              2.4-9.7-4.8-40.9-15.1-78-48.3-28.8-25.6-48.2-57.3
              -53.9-67-5.6-9.7-.6-15 4.2-19.8
              4.3-4.3 9.7-11.3 14.6-17
              4.8-5.6 6.4-9.7 9.7-16.1
              3.2-6.4 1.6-12 0.8-16.8-0.8-4.8-21.6-52-29.6-71.3
              -7.8-19.4-15.7-16.8-21.6-17.1-5.6-.3-12.8-.8-19.5-.8
              -6.6 0-17.1 2.4-26.1
              12-9 9.7-34.3 33.5-34.3
              81.5s35.1 94.6 40.1
              101.3c5 6.6 69.1 105.5
              167.6 147.8 23.4 10.1
              41.6 16.2 55.9
              20.7 23.5 7.6
              44.8 6.5 61.6
              3.9 18.8-2.9 57-23.3
              65.1-45.8 8.1-22.8
              8.1-42.4 5.7-45.8
              -2.4-3.3-8.8-5.6-18.5-10.4z"/>
          </svg>
          Fazer pedido
        `;
        copyBtn.classList.remove('copied');
      }, 500);
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
  const sum = items.reduce((acc, i) => acc + i.qty * i.price, 0);
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

function generateOrder() {
  const now = new Date();
  const dateStr = now.toLocaleDateString('pt-BR', {
    day: '2-digit', month: 'long', year: 'numeric'
  });
  const timeStr = now.toLocaleTimeString('pt-BR', {
    hour: '2-digit', minute: '2-digit'
  });

  const lines = [];
  lines.push('🛒 *Pedido Pronta Entrega Rango in Natura*');
  lines.push(`📅 ${dateStr} às ${timeStr}`);
  lines.push('');
  items.forEach(item => {
    if (item.qty > 0) lines.push(`• ${item.qty}x ${getItemName(item)}`);
  });
  lines.push('');
  lines.push(`💰 *Total:* ${totalEl.textContent}`);
  if (orderMode === 'Delivery') {
    lines.push(`🛵 *Modo de entrega:* Delivery (valor à combinar)`);
  } else {
    lines.push(`🏬 *Modo de entrega:* Retirada`);
  }
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
    }))
    .filter(item =>
      item.stock > 0 &&
      item.price > 0 &&
      Boolean(item.protein)
    );

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
