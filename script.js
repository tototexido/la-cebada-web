const WHATSAPP_NUMBER = '541150373123';

const initialStock = {
  'torpedo-joyero|color:Suela': 2,
  'torpedo-joyero|color:Borravino': 1,
  'torpedo-joyero|color:Chocolate': 1,
  'torpedo-joyero|color:Negro': 1,
  'bombillon-simple|formato:Curvo|pico:Bronce': 2,
  'bombillon-simple|formato:Recto|pico:Bronce': 2,
  'bombillon-premium|formato:Curvo|pico:Bronce': 2,
  'bombillon-premium|formato:Curvo|pico:Alpaca': 1
};

const products = {
  'torpedo-joyero': {
    name: 'Torpedo cincelado joyero',
    price: 60000,
    qtyInput: 'mateQty',
    addButton: 'mateAddButton',
    stockBadge: 'mateStockBadge',
    stockMessage: 'mateStockMessage',
    getOptions: () => ({
      color: document.getElementById('mateColorSelect').value,
    }),
  },
  'bombillon-simple': {
    name: 'Bombillón anilla simple',
    price: 30000,
    qtyInput: 'bombillonSimpleQty',
    addButton: 'bombillonSimpleAddButton',
    stockBadge: 'bombillonSimpleStockBadge',
    stockMessage: 'bombillonSimpleStockMessage',
    getOptions: () => ({
      formato: document.getElementById('bombillonSimpleShapeSelect').value,
      pico: document.getElementById('bombillonSimpleTipSelect').value,
    }),
  },
  'bombillon-premium': {
    name: 'Bombillón cincelado premium ancho',
    price: 32000,
    qtyInput: 'bombillonPremiumQty',
    addButton: 'bombillonPremiumAddButton',
    stockBadge: 'bombillonPremiumStockBadge',
    stockMessage: 'bombillonPremiumStockMessage',
    getOptions: () => ({
      formato: document.getElementById('bombillonPremiumShapeSelect').value,
      pico: document.getElementById('bombillonPremiumTipSelect').value,
    }),
  }
};

let cart = [];

const navToggle = document.querySelector('.nav-toggle');
const navLinks = document.querySelector('.nav-links');

navToggle?.addEventListener('click', () => {
  const isOpen = navLinks.classList.toggle('open');
  navToggle.setAttribute('aria-expanded', String(isOpen));
});

document.querySelectorAll('.nav-links a').forEach(link => {
  link.addEventListener('click', () => {
    navLinks.classList.remove('open');
    navToggle?.setAttribute('aria-expanded', 'false');
  });
});

const mateThumbButtons = document.querySelectorAll('#mateThumbs .thumb');
const mateMainImage = document.getElementById('mateMainImage');
const mateColorSelect = document.getElementById('mateColorSelect');

mateThumbButtons.forEach((button, index) => {
  button.addEventListener('click', () => {
    mateThumbButtons.forEach(btn => btn.classList.remove('active'));
    button.classList.add('active');
    mateMainImage.src = button.dataset.image;
    mateMainImage.dataset.zoomSrc = button.dataset.image;
    mateMainImage.alt = `Mate Torpedo cincelado joyero color ${button.dataset.colorName}`;
    mateColorSelect.selectedIndex = index;
    updateStockUI();
  });
});

mateColorSelect.addEventListener('change', () => {
  const selected = [...mateThumbButtons].find(btn => btn.dataset.colorName.toLowerCase() === mateColorSelect.value.toLowerCase());
  if (selected) selected.click();
  updateStockUI();
});

['bombillonSimpleShapeSelect', 'bombillonPremiumTipSelect'].forEach(id => {
  const element = document.getElementById(id);
  element?.addEventListener('change', updateStockUI);
});

function formatCurrency(value) {
  return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(value);
}

function normalizeOptions(options) {
  return Object.entries(options)
    .map(([key, value]) => `${key}:${value}`)
    .join('|');
}

function buildCartKey(productId, options) {
  return `${productId}|${normalizeOptions(options)}`;
}

function getProductStockKey(productId) {
  const product = products[productId];
  return buildCartKey(productId, product.getOptions());
}

function getQtyInCart(stockKey) {
  return cart
    .filter(item => item.key === stockKey)
    .reduce((acc, item) => acc + item.qty, 0);
}

function getAvailableStock(productId) {
  const stockKey = getProductStockKey(productId);
  const baseStock = initialStock[stockKey] || 0;
  return Math.max(0, baseStock - getQtyInCart(stockKey));
}

function updateProductStockUI(productId) {
  const product = products[productId];
  const available = getAvailableStock(productId);
  const qtyInput = document.getElementById(product.qtyInput);
  const addButton = document.getElementById(product.addButton);
  const badge = document.getElementById(product.stockBadge);
  const message = document.getElementById(product.stockMessage);

  if (!qtyInput || !addButton || !badge || !message) return;

  qtyInput.max = String(Math.max(available, 1));

  if (available <= 0) {
    addButton.disabled = true;
    qtyInput.disabled = true;
    badge.hidden = false;
    message.textContent = 'Sin stock para esta variante.';
  } else {
    addButton.disabled = false;
    qtyInput.disabled = false;
    badge.hidden = true;
    message.textContent = '';
    if (Number(qtyInput.value || 1) > available) {
      qtyInput.value = available;
    }
  }
}

function updateStockUI() {
  Object.keys(products).forEach(updateProductStockUI);
}

function addToCart(productId) {
  const product = products[productId];
  const qtyInput = document.getElementById(product.qtyInput);
  const qty = Math.max(1, Number(qtyInput.value || 1));
  const options = product.getOptions();
  const key = buildCartKey(productId, options);
  const available = getAvailableStock(productId);

  if (available <= 0) {
    updateStockUI();
    return;
  }

  if (qty > available) {
    alert('No hay suficiente stock disponible para esa variante.');
    qtyInput.value = available;
    updateStockUI();
    return;
  }

  const existing = cart.find(item => item.key === key);

  if (existing) {
    existing.qty += qty;
  } else {
    cart.push({
      key,
      productId,
      name: product.name,
      price: product.price,
      options,
      qty,
    });
  }

  renderCart();
  updateStockUI();
  openCart();
}

document.querySelectorAll('.add-to-cart').forEach(button => {
  button.addEventListener('click', () => addToCart(button.dataset.productId));
});

const cartDrawer = document.getElementById('cartDrawer');
const cartBackdrop = document.getElementById('cartBackdrop');
const openCartButton = document.getElementById('openCartButton');
const floatingCartButton = document.getElementById('floatingCartButton');
const closeCartButton = document.getElementById('closeCartButton');
const cartItems = document.getElementById('cartItems');
const emptyCartMessage = document.getElementById('emptyCartMessage');
const cartTotal = document.getElementById('cartTotal');
const cartCount = document.getElementById('cartCount');
const floatingCartCount = document.getElementById('floatingCartCount');
const checkoutWhatsappButton = document.getElementById('checkoutWhatsappButton');
const checkoutForm = document.getElementById('checkoutForm');

function openCart() {
  cartDrawer.classList.add('open');
  cartBackdrop.classList.add('visible');
  cartDrawer.setAttribute('aria-hidden', 'false');
  document.body.classList.add('no-scroll');
}

function closeCart() {
  cartDrawer.classList.remove('open');
  cartBackdrop.classList.remove('visible');
  cartDrawer.setAttribute('aria-hidden', 'true');
  document.body.classList.remove('no-scroll');
}

openCartButton?.addEventListener('click', openCart);
floatingCartButton?.addEventListener('click', openCart);
closeCartButton?.addEventListener('click', closeCart);
cartBackdrop?.addEventListener('click', closeCart);

function removeItem(itemKey) {
  cart = cart.filter(item => item.key !== itemKey);
  renderCart();
  updateStockUI();
}

function changeQty(itemKey, delta) {
  const item = cart.find(entry => entry.key === itemKey);
  if (!item) return;

  const maxStock = initialStock[item.key] || item.qty;
  const nextQty = item.qty + delta;

  if (nextQty < 1) return;

  if (nextQty > maxStock) {
    alert('No hay más stock disponible para esta variante.');
    return;
  }

  item.qty = nextQty;
  renderCart();
  updateStockUI();
}

function getTotal() {
  return cart.reduce((acc, item) => acc + item.price * item.qty, 0);
}

function renderCart() {
  cartItems.innerHTML = '';

  if (cart.length === 0) {
    emptyCartMessage.style.display = 'block';
  } else {
    emptyCartMessage.style.display = 'none';
  }

  cart.forEach(item => {
    const article = document.createElement('article');
    article.className = 'cart-item';

    const optionsList = Object.entries(item.options)
      .map(([key, value]) => `<p><strong>${capitalize(key)}:</strong> ${value}</p>`)
      .join('');

    const canAddMore = item.qty < (initialStock[item.key] || item.qty);

    article.innerHTML = `
      <div class="cart-item-top">
        <div>
          <h4>${item.name}</h4>
          ${optionsList}
          <small>${formatCurrency(item.price)} c/u</small>
        </div>
        <button type="button" data-remove="${item.key}">Eliminar</button>
      </div>
      <div class="cart-item-actions">
        <div>
          <button type="button" data-qty="minus" data-key="${item.key}">-</button>
          <span style="padding:0 10px;font-weight:900;">${item.qty}</span>
          <button type="button" data-qty="plus" data-key="${item.key}" ${canAddMore ? '' : 'disabled'}>+</button>
        </div>
        <strong>${formatCurrency(item.price * item.qty)}</strong>
      </div>
    `;

    cartItems.appendChild(article);
  });

  document.querySelectorAll('[data-remove]').forEach(button => {
    button.addEventListener('click', () => removeItem(button.dataset.remove));
  });

  document.querySelectorAll('[data-qty]').forEach(button => {
    button.addEventListener('click', () => {
      const delta = button.dataset.qty === 'plus' ? 1 : -1;
      changeQty(button.dataset.key, delta);
    });
  });

  const total = getTotal();
  cartTotal.textContent = formatCurrency(total);

  const totalUnits = cart.reduce((acc, item) => acc + item.qty, 0);
  cartCount.textContent = totalUnits;
  floatingCartCount.textContent = totalUnits;
}

function buildWhatsappMessage(formData) {
  const lines = cart.map((item, index) => {
    const options = Object.entries(item.options)
      .map(([key, value]) => `${capitalize(key)}: ${value}`)
      .join(', ');
    return `${index + 1}. ${item.name} | ${options} | Cantidad: ${item.qty} | Subtotal: ${formatCurrency(item.price * item.qty)}`;
  }).join('\n');

  return `Hola La Cebada, quiero finalizar esta compra:

PRODUCTOS:
${lines}

TOTAL ESTIMADO: ${formatCurrency(getTotal())}

DATOS PARA ENVÍO:
Nombre y apellido: ${formData.get('nombre')}
Teléfono: ${formData.get('telefono')}
Email: ${formData.get('email')}
Provincia: ${formData.get('provincia')}
Localidad: ${formData.get('localidad')}
Código postal: ${formData.get('cp')}
Dirección: ${formData.get('direccion')}

Medio de pago: Transferencia bancaria.

Quedo atento/a para coordinar pago y envío por Correo Argentino.`;
}

checkoutWhatsappButton.addEventListener('click', () => {
  if (cart.length === 0) {
    alert('Agregá al menos un producto al carrito antes de finalizar la compra.');
    return;
  }

  if (!checkoutForm.reportValidity()) {
    return;
  }

  const formData = new FormData(checkoutForm);
  const message = buildWhatsappMessage(formData);
  const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
  window.open(url, '_blank', 'noopener');
});

function capitalize(text) {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

document.getElementById('scrollToProducts').addEventListener('click', () => {
  document.getElementById('productos').scrollIntoView({ behavior: 'smooth' });
});

const imageModal = document.getElementById('imageModal');
const imageModalImg = document.getElementById('imageModalImg');
const imageModalClose = document.getElementById('imageModalClose');

document.addEventListener('click', event => {
  const zoomable = event.target.closest('.zoomable');
  if (!zoomable) return;

  imageModalImg.src = zoomable.dataset.zoomSrc || zoomable.src;
  imageModalImg.alt = zoomable.alt || 'Imagen ampliada';
  imageModal.classList.add('open');
  imageModal.setAttribute('aria-hidden', 'false');
  document.body.classList.add('no-scroll');
});

function closeImageModal() {
  imageModal.classList.remove('open');
  imageModal.setAttribute('aria-hidden', 'true');
  imageModalImg.src = '';
  document.body.classList.remove('no-scroll');
}

imageModalClose.addEventListener('click', closeImageModal);
imageModal.addEventListener('click', event => {
  if (event.target === imageModal) closeImageModal();
});

document.addEventListener('keydown', event => {
  if (event.key === 'Escape') {
    closeImageModal();
    closeCart();
  }
});

document.getElementById('year').textContent = new Date().getFullYear();

renderCart();
updateStockUI();
