// script.js

const SPREADSHEET_ID = '1Ns-dGKYtrrmOfps8CSwklYp3PWjDzniahaclItoZJ1M';
const SHEET_URL = `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/gviz/tq?gid=0&tqx=out:json`;

let items = [];
const gridEl   = document.getElementById('grid');
const totalEl  = document.getElementById('total');
const genBtn   = document.getElementById('generate');
const outputEl = document.getElementById('order-text');

// cria botão de copiar abaixo do textarea
const copyBtn = document.createElement('button');
copyBtn.textContent = 'Copiar pedido';
copyBtn.className = 'button-secondary';
copyBtn.style.marginTop = '0.5rem';
copyBtn.style.width = '100%';
copyBtn.addEventListener('click', () => {
  navigator.clipboard.writeText(outputEl.value)
    .then(() => {
      copyBtn.textContent = 'Copiado!';
      setTimeout(() => (copyBtn.textContent = 'Copiar pedido'), 2000);
    })
    .catch(err => console.error('Erro ao copiar:', err));
});
outputEl.parentNode.insertBefore(copyBtn, outputEl.nextSibling);

function formatBRL(v) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function getItemName(item) {
  if (item.protein && item.side) {
    return `${item.protein} + ${item.side}`;
  }
  return item.protein || item.side || '';
}

function calcTotal() {
  let sum = 0;
  items.forEach(it => {
    const qty = parseInt(document.getElementById(`qty-${it.id}`).textContent) || 0;
    sum += qty * it.price;
  });
  totalEl.textContent = formatBRL(sum);
}

function updateQty(id, delta) {
  const el = document.getElementById(`qty-${id}`);
  let qty = parseInt(el.textContent) || 0;
  qty = Math.max(0, qty + delta);
  el.textContent = qty;
  calcTotal();
}

function generateOrder() {
  const lines = ['Pedido Rango in Natura:'];
  items.forEach(it => {
    const qty = parseInt(document.getElementById(`qty-${it.id}`).textContent) || 0;
    if (qty > 0) {
      lines.push(`• ${qty}x ${getItemName(it)}`);
    }
  });
  lines.push(`Total: ${totalEl.textContent}`);
  outputEl.value = lines.join('\n');
  outputEl.select();
}

function renderItems() {
  gridEl.innerHTML = '';
  items.filter(it => it.stock > 0).forEach(it => {
    const card = document.createElement('div');
    card.className = 'card';
    card.innerHTML = `
      <h2>${getItemName(it)}</h2>
      <p>Preço: ${formatBRL(it.price)}</p>
      <p>Em estoque: ${it.stock}</p>
      <div class="qty-control">
        <button class="qty-btn minus" data-id="${it.id}">–</button>
        <span id="qty-${it.id}" class="qty-display">0</span>
        <button class="qty-btn plus"  data-id="${it.id}">+</button>
      </div>
    `;
    gridEl.appendChild(card);

    card.querySelector('.qty-btn.minus').addEventListener('click', () => updateQty(it.id, -1));
    card.querySelector('.qty-btn.plus').addEventListener('click', () => {
      const current = parseInt(document.getElementById(`qty-${it.id}`).textContent) || 0;
      if (current < it.stock) updateQty(it.id, +1);
    });
  });
}

function fetchSheet() {
  fetch(SHEET_URL)
    .then(r => r.text())
    .then(txt => {
      const jsonText = txt.substring(
        txt.indexOf('{'),
        txt.lastIndexOf('}') + 1
      );
      const data = JSON.parse(jsonText);
      return data.table.rows;
    })
    .then(rows => {
      items = rows.map((r, i) => ({
        id:      i,
        protein: r.c[0]?.v || '',
        side:    r.c[1]?.v || '',
        price:   parseFloat(r.c[2]?.v) || 0,
        stock:   parseInt(r.c[3]?.v)   || 0
      }))
      .filter(it => it.stock > 0);
      renderItems();
    })
    .catch(err => console.error('Erro ao buscar Sheet:', err));
}

genBtn.addEventListener('click', generateOrder);
fetchSheet();
