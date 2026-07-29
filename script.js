const CART_KEY = 'cart';

function getCart() {
    return JSON.parse(localStorage.getItem(CART_KEY) || '[]');
}

function saveCart(cart) {
    localStorage.setItem(CART_KEY, JSON.stringify(cart));
    updateCartBadge();
}

function formatPrice(value) {
    return '$' + value.toFixed(2);
}

function updateCartBadge() {
    const cart = getCart();
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    const badge = document.querySelector('.cart-badge');

    if (badge) {
        badge.textContent = totalItems;
        badge.style.display = totalItems > 0 ? 'flex' : 'none';
    }
}

function showToast(message) {
    let toast = document.getElementById('cart-toast');

    if (!toast) {
        toast = document.createElement('div');
        toast.id = 'cart-toast';
        document.body.appendChild(toast);
    }

    toast.textContent = message;
    toast.classList.add('show');

    clearTimeout(toast.hideTimeout);
    toast.hideTimeout = setTimeout(() => {
        toast.classList.remove('show');
    }, 2000);
}

function addToCart(item) {
    const cart = getCart();
    const existing = cart.find(i => i.name === item.name);

    if (existing) {
        existing.quantity = (existing.quantity || 0) + 1;
    } else {
        cart.push({ ...item, quantity: 1 });
    }

    saveCart(cart);
    showToast(`${item.name} added to cart`);
}

function initSearch() {
    const searchInput = document.getElementById('shop-search');
    const searchForm = document.getElementById('shop-search-form');
    const noResultsMsg = document.getElementById('shop-no-results');
    const allCards = document.querySelectorAll('.shop-card');

    if (searchInput && allCards.length > 0) {
        searchInput.addEventListener('input', () => {
            const query = searchInput.value.trim().toLowerCase();
            let visibleCount = 0;

            allCards.forEach(card => {
                const title = card.querySelector('.shop-title').textContent.toLowerCase();
                const tag = card.querySelector('.shop-tag')?.textContent.toLowerCase() || '';
                const description = card.querySelector('.shop-description').textContent.toLowerCase();
                const matches = title.includes(query) || tag.includes(query) || description.includes(query);

                if (matches || query === '') {
                    card.classList.remove('hide');
                    visibleCount++;
                } else {
                    card.classList.add('hide');
                }
            });

            if (noResultsMsg) {
                noResultsMsg.style.display = visibleCount === 0 ? 'block' : 'none';
            }
        });
    }

    if (searchForm && searchInput) {
        searchForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const query = searchInput.value.trim();
            if (query) {
                window.location.href = `shop.html?q=${encodeURIComponent(query)}`;
            }
        });
    }

    const params = new URLSearchParams(window.location.search);
    const urlQuery = params.get('q');

    if (urlQuery && searchInput) {
        searchInput.value = urlQuery;
        searchInput.dispatchEvent(new Event('input'));
    }
}

function initShopCards() {
    document.querySelectorAll('.shop-card').forEach(card => {
        const button = card.querySelector('.feature-button');
        if (!button) return;

        button.addEventListener('click', () => {
            const name = card.querySelector('.shop-title').textContent;
            const priceText = card.querySelector('.feature-price').textContent;
            const price = parseFloat(priceText.replace('$', ''));
            const image = card.querySelector('img').getAttribute('src');

            addToCart({ name, price, image });
        });
    });
}

function renderCart() {
    const tableBody = document.getElementById('cart-table-body');
    if (!tableBody) return;

    const cart = getCart();
    const cartEmpty = document.getElementById('cart-empty');
    const cartTable = document.getElementById('cart-table');
    const cardsContainer = document.getElementById('cart-cards-container');
    const summary = document.getElementById('cart-summary');

    if (cart.length === 0) {
        cartEmpty.style.display = 'block';
        cartTable.style.display = 'none';
        cardsContainer.style.display = 'none';
        summary.style.display = 'none';
        return;
    }

    cartEmpty.style.display = 'none';
    cartTable.style.display = '';
    cardsContainer.style.display = '';
    summary.style.display = 'block';

    tableBody.innerHTML = '';
    cardsContainer.innerHTML = '';
    let subtotal = 0;

    cart.forEach((item, index) => {
        const lineTotal = item.price * item.quantity;
        subtotal += lineTotal;

        tableBody.innerHTML += `
            <tr>
                <td>
                    <div class="cart-product">
                        <img src="${item.image}" alt="${item.name}">
                        <span>${item.name}</span>
                    </div>
                </td>
                <td>${formatPrice(item.price)}</td>
                <td>
                    <div class="qty-stepper">
                        <button type="button" class="qty-btn" onclick="changeQty(${index}, -1)" aria-label="Decrease quantity">&minus;</button>
                        <span>${item.quantity}</span>
                        <button type="button" class="qty-btn" onclick="changeQty(${index}, 1)" aria-label="Increase quantity">&plus;</button>
                    </div>
                </td>
                <td>${formatPrice(lineTotal)}</td>
                <td><button type="button" class="remove-btn" onclick="removeItem(${index})" aria-label="Remove ${item.name}">&times;</button></td>
            </tr>
        `;

        cardsContainer.innerHTML += `
            <div class="cart-item-card">
                <img src="${item.image}" alt="${item.name}">
                <div class="cart-item-card-details">
                    <div class="cart-item-card-top">
                        <span class="cart-item-name">${item.name}</span>
                        <button type="button" class="remove-btn" onclick="removeItem(${index})" aria-label="Remove ${item.name}">&times;</button>
                    </div>
                    <div class="qty-stepper">
                        <button type="button" class="qty-btn" onclick="changeQty(${index}, -1)" aria-label="Decrease quantity">&minus;</button>
                        <span>${item.quantity}</span>
                        <button type="button" class="qty-btn" onclick="changeQty(${index}, 1)" aria-label="Increase quantity">&plus;</button>
                    </div>
                    <div class="cart-item-card-bottom">
                        <span>${formatPrice(item.price)} each</span>
                        <span class="cart-item-total">${formatPrice(lineTotal)}</span>
                    </div>
                </div>
            </div>
        `;
    });

    document.getElementById('cart-subtotal').textContent = formatPrice(subtotal);
    document.getElementById('cart-total').textContent = formatPrice(subtotal);
}

function changeQty(index, delta) {
    const cart = getCart();
    cart[index].quantity += delta;

    if (cart[index].quantity <= 0) {
        cart.splice(index, 1);
    }

    saveCart(cart);
    renderCart();
}

function removeItem(index) {
    const cart = getCart();
    cart.splice(index, 1);
    saveCart(cart);
    renderCart();
}

function renderCheckoutSummary() {
    const container = document.getElementById('checkout-items');
    if (!container) return;

    const cart = getCart();
    let subtotal = 0;
    container.innerHTML = '';

    cart.forEach(item => {
        const lineTotal = item.price * item.quantity;
        subtotal += lineTotal;

        container.innerHTML += `
            <div class="summary-row">
                <span>${item.name} &times; ${item.quantity}</span>
                <span>${formatPrice(lineTotal)}</span>
            </div>
        `;
    });

    document.getElementById('checkout-subtotal').textContent = formatPrice(subtotal);
    document.getElementById('checkout-total').textContent = formatPrice(subtotal);
}

function initCheckout() {
    const form = document.getElementById('checkout-form');
    if (!form) return;

    if (getCart().length === 0) {
        window.location.href = 'cart.html';
        return;
    }

    form.addEventListener('submit', (e) => {
        e.preventDefault();
        localStorage.removeItem(CART_KEY);
        updateCartBadge();
        document.getElementById('checkout-form-section').style.display = 'none';
        document.getElementById('thank-you-section').style.display = 'block';
    });
}

function initContactForm() {
    const form = document.getElementById('contact-form');
    if (!form) return;

    form.addEventListener('submit', (e) => {
        e.preventDefault();
        form.reset();
        showToast("Message sent! We'll be in touch soon.");
    });
}

document.addEventListener('DOMContentLoaded', () => {
    initSearch();
    initShopCards();
    updateCartBadge();
    renderCart();
    renderCheckoutSummary();
    initCheckout();
    initContactForm();
});
