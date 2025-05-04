const SPREADSHEET_ID = '1Ns-dGKYtrrmOfps8CSwklYp3PWjDzniahaclItoZJ1M';
const BASE_SHEET_URL = `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/gviz/tq?gid=0&tqx=out:json`;

let items = [];
let activeCategory = 'Todos';
let orderMode = 'Delivery';

const gridEl        = document.getElementById('grid');
const totalEl       = document.getElementById('total');
const categoriesEl  = document.getElementById('categories');
const template      = document.getElementById('item-template');
const modeEntrega   = document.getElementById('mode-entrega');
const modeRetirada  = document.getElementById('mode-retirada');
const cartFooterEl  = document.getElementById('cart-footer');
const cartTotalEl   = document.getElementById('cart-total');
const viewCartBtn   = document.getElementById('view-cart');
const cartDetailsEl = document.getElementById('cart-details');
const closeCartBtn  = document.getElementById('close-cart');
const cartItemsEl   = document.getElementById('cart-items');
const panelTotalEl  = document.getElementById('panel-total');
const sendOrderBtn  = document.getElementById('send-order');

function formatBRL(v) {
  return v.toLocaleString('pt-BR',{style:'currency',currency:'BRL'});
}

function getItemName(i) {
  return i.protein && i.side ? `${i.protein} + ${i.side}` : i.protein||'';
}

function calcTotal() {
  return items.reduce((s,i)=>s + i.qty*i.price,0);
}

// Modos de pedido
function updateModeButtons() {
  modeEntrega.classList.toggle('active', orderMode==='Delivery');
  modeRetirada.classList.toggle('active', orderMode==='Retirada');
}
modeEntrega.addEventListener('click',()=>{ orderMode='Delivery'; updateModeButtons(); });
modeRetirada.addEventListener('click',()=>{ orderMode='Retirada'; updateModeButtons(); });
updateModeButtons();

// Quantidade
function updateButtonState(id){
  const m=document.querySelector(`.qty-btn.minus[data-id="${id}"]`);
  const p=document.querySelector(`.qty-btn.plus[data-id="${id}"]`);
  const it=items[id];
  m.disabled = it.qty===0;
  p.disabled = it.qty>=it.stock;
}

function updateQty(id,delta){
  const it = items[id];
  it.qty = Math.max(0, it.qty+delta);
  const qtyEl = document.getElementById(`qty-${id}`);
  qtyEl.textContent = it.qty;
  qtyEl.classList.add('bump');
  qtyEl.addEventListener('animationend',()=>qtyEl.classList.remove('bump'),{once:true});
  const sum = calcTotal();
  totalEl.textContent = formatBRL(sum);
  updateCartFooter(sum);
  updateButtonState(id);
}

// Atualiza rodapé externo e painel interno
function updateCartFooter(sum){
  if(sum>0){
    cartFooterEl.style.display='flex';
    cartTotalEl.textContent = `Total: ${formatBRL(sum)}`;
    panelTotalEl.textContent = `Total: ${formatBRL(sum)}`;
    cartItemsEl.innerHTML='';
    items.forEach(it=>{
      if(it.qty>0){
        const li=document.createElement('li');
        li.textContent=`${it.qty}× ${getItemName(it)}`;
        cartItemsEl.appendChild(li);
      }
    });
  } else {
    cartFooterEl.style.display='none';
    closePanel();
  }
}

// Monta mensagem WhatsApp
function generateFullMessage(){
  const now=new Date();
  const d=now.toLocaleDateString('pt-BR',{day:'2-digit',month:'long',year:'numeric'});
  const t=now.toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'});
  const lines=[
    '🛒 *Pedido Pronta Entrega Rango in Natura*',
    `📅 ${d} às ${t}`,''
  ];
  items.forEach(it=>{ if(it.qty>0) lines.push(`• ${it.qty}x ${getItemName(it)}`); });
  lines.push(
    '','💰 *Total:* '+formatBRL(calcTotal()),
    orderMode==='Delivery'
      ? '🛵 *Modo de entrega:* Delivery (valor à combinar)'
      : '🏬 *Modo de entrega:* Retirada',
    '','Comer bem nunca foi tão fácil! 💚'
  );
  return lines.join('\n');
}

// Abrir/fechar painel
function openPanel(){
  cartDetailsEl.classList.add('open');
  viewCartBtn.style.display='none';
}
function closePanel(){
  cartDetailsEl.classList.remove('open');
  viewCartBtn.style.display='inline-block';
}
viewCartBtn.addEventListener('click',()=>{
  updateCartFooter(calcTotal());
  openPanel();
});
closeCartBtn.addEventListener('click',closePanel);

// Enviar pedido
sendOrderBtn.addEventListener('click',()=>{
  const msg=generateFullMessage();
  const wa=`https://wa.me/5598983540048?text=${encodeURIComponent(msg)}`;
  sendOrderBtn.textContent='⏳ Enviando…';
  sendOrderBtn.disabled=true;
  window.open(wa,'_blank');
  navigator.clipboard.writeText(msg).catch(()=>{});
  setTimeout(()=>{
    sendOrderBtn.textContent='Enviar Pedido';
    sendOrderBtn.disabled=false;
  },1200);
});

// Render categorias e itens
function renderCategories(){
  const avail=new Set(items.map(i=>i.category));
  const order=['Todos','Refeições','Cremes','Lanches','Sobremesas'];
  categoriesEl.innerHTML='';
  order.forEach(cat=>{
    if(cat==='Todos'||avail.has(cat)){
      const btn=document.createElement('button');
      btn.textContent=cat;
      btn.className='category-btn'+(cat===activeCategory?' active':'');
      btn.addEventListener('click',()=>{
        activeCategory=cat;
        renderCategories();
        renderItems();
      });
      categoriesEl.appendChild(btn);
    }
  });
}

function renderItems(){
  gridEl.innerHTML='';
  items.filter(i=>activeCategory==='Todos'||i.category===activeCategory)
    .forEach(it=>{
      const c=template.content.cloneNode(true);
      c.querySelector('.item-name').textContent=getItemName(it);
      c.querySelector('.price-tag').textContent=formatBRL(it.price);
      c.querySelector('.stock-count').textContent=it.stock;
      const minus=c.querySelector('.qty-btn.minus');
      const plus=c.querySelector('.qty-btn.plus');
      const qty=c.querySelector('.qty-display');
      minus.dataset.id=plus.dataset.id=it.id;
      qty.id=`qty-${it.id}`;
      qty.textContent=it.qty;
      minus.addEventListener('click',()=>updateQty(it.id,-1));
      plus.addEventListener('click',()=>updateQty(it.id,1));
      gridEl.appendChild(c);
      updateButtonState(it.id);
    });
}

async function fetchSheet(){
  gridEl.innerHTML='<p class="loader">Carregando menu…</p>';
  try{
    const res=await fetch(`${BASE_SHEET_URL}&t=${Date.now()}`);
    const txt=await res.text();
    const json=txt.slice(txt.indexOf('{'),txt.lastIndexOf('}')+1);
    const rows=JSON.parse(json).table.rows;
    items=rows.map((r,i)=>({
      id:i,
      protein:r.c[0]?.v||'',
      side:r.c[1]?.v||'',
      price:parseFloat(r.c[2]?.v)||0,
      stock:parseInt(r.c[3]?.v,10)||0,
      category:r.c[4]?.v||'Refeição',
      qty:0
    })).filter(i=>i.stock>0&&i.price>0&&i.protein);
    renderCategories();
    renderItems();
    totalEl.textContent=formatBRL(calcTotal());
    updateCartFooter(calcTotal());
  }catch(e){
    console.error(e);
    gridEl.innerHTML='<p>Ops, não foi possível carregar o menu.</p>';
  }
}

fetchSheet();
