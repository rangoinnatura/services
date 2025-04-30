// script.js
const SHEET_URL = 'https://docs.google.com/spreadsheets/d/YOUR_SHEET_ID/gviz/tq?tqx=out:json'; 
// 1) Publique a Sheet como JSON e cole o link acima.
// 2) A resposta vem com prefixo "/*O_o*/", vamos removê-lo.

let items = [];
const gridEl   = document.getElementById('grid');
const totalEl  = document.getElementById('total');
const genBtn   = document.getElementById('generate');
const outputEl = document.getElementById('order-text');

function formatBRL(v) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function calcTotal() {
  let sum = 0;
  items.forEach(it => {
    const qty = parseInt(document.getElementById(`qty-${it.id}`).value) || 0;
    sum += qty * it.price;
  });
  totalEl.textContent = formatBRL(sum);
}

function generateOrder() {
  let lines = ['Pedido Rango in Natura:'];
  items.forEach(it => {
    const qty = parseInt(document.getElementById(`qty-${it.id}`).value) || 0;
    if (qty > 0) {
      lines.push(`• ${qty}x ${it.protein} + ${it.side}`);
    }
  });
  lines.push(`Total: ${totalEl.textContent}`);
  outputEl.value = lines.join('\n');
  outputEl.select();
}

function renderItems() {
  gridEl.innerHTML = '';
  items.forEach(it => {
    const card = document.createElement('div');
    card.className = 'card';
    card.innerHTML = `
      <h2>${it.protein} + ${it.side}</h2>
      <p>Preço: ${formatBRL(it.price)}</p>
      <p>Em estoque: ${it.stock}</p>
      <label>
        Qtd:
        <input
          type="number"
          id="qty-${it.id}"
          min="0"
          max="${it.stock}"
          value="0"
        />
      </label>
    `;
    gridEl.appendChild(card);
    document
      .getElementById(`qty-${it.id}`)
      .addEventListener('input', calcTotal);
  });
}

function fetchSheet() {
  fetch(SHEET_URL)
    .then(r => r.text())
    .then(txt => {
      const json = JSON.parse(txt.substring(txt.indexOf('{')));
      const rows = json.table.rows;
      items = rows.map((r, i) => ({
        id:      i,
        protein: r.c[0]?.v || '',
        side:    r.c[1]?.v || '',
        price:   parseFloat(r.c[2]?.v) || 0,
        stock:   parseInt(r.c[3]?.v) || 0
      }));
      renderItems();
    })
    .catch(err => console.error('Erro ao buscar Sheet:', err));
}

// bind events
genBtn.addEventListener('click', generateOrder);

// inicializa
fetchSheet();
