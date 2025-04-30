// script.js

// 1) Pegue o ID real da sua planilha
const SPREADSHEET_ID = '1Ns-dGKYtrrmOfps8CSwklYp3PWjDzniahaclItoZJ1M'; 
const SHEET_URL = `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/gviz/tq?gid=0&tqx=out:json`;

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
  const lines = ['Pedido Rango in Natura:'];
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
      // DEBUG: descomente se quiser ver o raw
      // console.log(txt);
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
      }));
      renderItems();
    })
    .catch(err => console.error('Erro ao buscar Sheet:', err));
}

// liga o botão
genBtn.addEventListener('click', generateOrder);

// start
fetchSheet();
