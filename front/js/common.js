(() => {
  const cartKey = 'pao-quente-cart';

  function readCart() {
    try {
      const cart = JSON.parse(localStorage.getItem(cartKey) || '[]');
      return Array.isArray(cart) ? cart : [];
    } catch {
      return [];
    }
  }

  function updateCartCount() {
    const count = readCart().reduce((sum, item) => sum + (Number(item.quantidade) || 0), 0);
    document.querySelectorAll('.cart-count').forEach((element) => { element.textContent = String(count); });
  }

  function formatPrice(value) {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(value) || 0);
  }

  function notifyCartChanged() {
    updateCartCount();
    window.dispatchEvent(new CustomEvent('cart-changed'));
  }

  window.PaoQuente = { cartKey, readCart, updateCartCount, formatPrice, notifyCartChanged };
  updateCartCount();

  document.querySelectorAll('.menu-toggle').forEach((button) => {
    button.addEventListener('click', () => {
      const nav = document.querySelector('.main-nav');
      const isOpen = nav.classList.toggle('open');
      button.setAttribute('aria-expanded', String(isOpen));
    });
  });
  const year = document.getElementById('year');
  if (year) year.textContent = String(new Date().getFullYear());
})();
