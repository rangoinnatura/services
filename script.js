// script.js

const SPREADSHEET_ID = '1Ns-dGKYtrrmOfps8CSwklYp3PWjDzniahaclItoZJ1M';
const SHEET_URL = `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/gviz/tq?gid=0&tqx=out:json`;

let items = [];
const gridEl   = document.getElementById('grid');
const totalEl  = document.getElementById('total');
const genBtn   = document.getElementById('generate');
const outputEl = document.getElementById('order-text');

// botão “Copiar pedido”
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
  if (item.protein && item.side) return `${item.protein} + ${item.side}`;
  return item.protein || item.side || '';
}

function calcTotal() {
  let sum = 0;
  items.forEach(item => {
    const qty = parseInt(document.getElementById(`qty-${item.id}`).textContent, 10) || 0;
    sum += qty * item.price;
  });
  totalEl.textContent = formatBRL(sum);
}

function updateButtonState(id) {
  const minus = document.querySelector(`.qty-btn.minus[data-id="${id}"]`);
  const plus  = document.querySelector(`.qty-btn.plus[data-id="${id}"]`);
  const qtyEl = document.getElementById(`qty-${id}`);
  const qty   = parseInt(qtyEl.textContent, 10) || 0;
  const item  = items.find(i => i.id === id);

  minus.disabled = qty === 0;
  plus.disabled  = qty >= item.stock;
}

function updateQty(id, delta) {
  const el = document.getElementById(`qty-${id}`);
  let qty = parseInt(el.textContent, 10) || 0;
  qty = Math.max(0, qty + delta);
  el.textContent = qty;
  calcTotal();

  el.classList.add('bump');
  el.addEventListener('animationend', () => el.classList.remove('bump'), { once: true });

  updateButtonState(id);
}

function generateOrder() {
  const lines = ['Pedido Rango in Natura:'];
  items.forEach(item => {
    const qty = parseInt(document.getElementById(`qty-${item.id}`).textContent, 10) || 0;
    if (qty > 0) lines.push(`• ${qty}x ${getItemName(item)}`);
  });
  lines.push(`Total: ${totalEl.textContent}`);
  outputEl.value = lines.join('\n');
  outputEl.select();
}

function renderItems() {
  gridEl.innerHTML = '';
  items.filter(i => i.stock > 0).forEach(item => {
    const card = document.createElement('div');
    card.className = 'card';
    card.innerHTML = `
      <h2>${getItemName(item)}</h2>
      <p>Preço: <span class="price-tag">${formatBRL(item.price)}</span></p>
      <p>Em estoque: ${item.stock}</p>
      <div class="qty-control">
        <button class="qty-btn minus" data-id="${item.id}">–</button>
        <span id="qty-${item.id}" class="qty-display">0</span>
        <button class="qty-btn plus" data-id="${item.id}">+</button>
      </div>
    `;
    gridEl.appendChild(card);

    const minus = card.querySelector('.qty-btn.minus');
    const plus  = card.querySelector('.qty-btn.plus');
    minus.addEventListener('click', () => updateQty(item.id, -1));
    plus.addEventListener('click',  () => updateQty(item.id, +1));
    updateButtonState(item.id);
  });
}

function fetchSheet() {
  // mostra loader
  gridEl.innerHTML = '<p class="loader">Carregando menu…</p>';

  fetch(SHEET_URL)
    .then(r => r.text())
    .then(txt => {
      const json = txt.slice(txt.indexOf('{'), txt.lastIndexOf('}')+1);
      return JSON.parse(json).table.rows;
    })
    .then(rows => {
      items = rows.map((r,i) => ({
        id:      i,
        protein: r.c[0]?.v||'',
        side:    r.c[1]?.v||'',
        price:   parseFloat(r.c[2]?.v)||0,
        stock:   parseInt(r.c[3]?.v,10)||0
      })).filter(i=>i.stock>0);
      renderItems();
    })
    .catch(err => {
      console.error('Erro ao buscar dados:', err);
      gridEl.innerHTML = '<p>Ops, não foi possível carregar o menu.</p>';
    });
}

genBtn.addEventListener('click', generateOrder);
fetchSheet();
