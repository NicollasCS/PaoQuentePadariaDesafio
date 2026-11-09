(() => {
  const list = document.getElementById('cart-items');
  const totalElement = document.getElementById('cart-total');
  const form = document.getElementById('checkout-form');
  if (!list || !form) return;
  const message = document.getElementById('checkout-message');
  const submitButton = document.getElementById('submit-order');
  const dateInput = document.getElementById('pickup-date');
  const today = new Date();
  dateInput.min = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

  function saveCart(cart) {
    localStorage.setItem(PaoQuente.cartKey, JSON.stringify(cart));
    PaoQuente.notifyCartChanged();
  }

  function renderCart() {
    const cart = PaoQuente.readCart();
    list.replaceChildren();
    if (!cart.length) {
      const empty = document.createElement('p');
      empty.className = 'empty-message';
      empty.textContent = 'Seu carrinho está vazio. Visite o catálogo para escolher seus favoritos.';
      const link = document.createElement('a');
      link.className = 'text-link';
      link.href = '/catalogo.html';
      link.textContent = 'Ir para o catálogo';
      list.append(empty, link);
      totalElement.textContent = PaoQuente.formatPrice(0);
      submitButton.disabled = true;
      return;
    }
    submitButton.disabled = false;
    let total = 0;
    cart.forEach((item) => {
      const lineTotal = Number(item.preco) * Number(item.quantidade);
      total += lineTotal;
      const row = document.createElement('div');
      row.className = 'cart-line';
      const description = document.createElement('div');
      const title = document.createElement('h3');
      title.textContent = item.nome;
      const price = document.createElement('p');
      price.textContent = `${PaoQuente.formatPrice(item.preco)} cada · ${PaoQuente.formatPrice(lineTotal)}`;
      description.append(title, price);
      const quantity = document.createElement('div');
      quantity.className = 'quantity-control';
      const decrease = document.createElement('button');
      decrease.type = 'button';
      decrease.textContent = '−';
      decrease.setAttribute('aria-label', `Diminuir quantidade de ${item.nome}`);
      decrease.addEventListener('click', () => {
        const current = PaoQuente.readCart();
        const target = current.find((entry) => entry.produtoId === item.produtoId);
        if (!target) return;
        target.quantidade -= 1;
        saveCart(current.filter((entry) => entry.quantidade > 0));
        renderCart();
      });
      const count = document.createElement('output');
      count.textContent = String(item.quantidade);
      const increase = document.createElement('button');
      increase.type = 'button';
      increase.textContent = '+';
      increase.setAttribute('aria-label', `Aumentar quantidade de ${item.nome}`);
      increase.addEventListener('click', () => {
        const current = PaoQuente.readCart();
        const target = current.find((entry) => entry.produtoId === item.produtoId);
        if (!target || target.quantidade >= 100) return;
        target.quantidade += 1;
        saveCart(current);
        renderCart();
      });
      quantity.append(decrease, count, increase);
      const remove = document.createElement('button');
      remove.type = 'button';
      remove.className = 'remove-item';
      remove.textContent = 'Remover';
      remove.addEventListener('click', () => {
        saveCart(PaoQuente.readCart().filter((entry) => entry.produtoId !== item.produtoId));
        renderCart();
      });
      row.append(description, quantity, remove);
      list.append(row);
    });
    totalElement.textContent = PaoQuente.formatPrice(total);
  }

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    message.textContent = '';
    const cart = PaoQuente.readCart();
    if (!cart.length) {
      message.textContent = 'Adicione ao menos um produto antes de confirmar.';
      return;
    }
    submitButton.disabled = true;
    submitButton.textContent = 'Enviando...';
    let orderConfirmed = false;
    const formData = new FormData(form);
    const payload = {
      nome: formData.get('nome'),
      telefone: formData.get('telefone'),
      dataRetirada: formData.get('dataRetirada'),
      horarioRetirada: formData.get('horarioRetirada'),
      observacoes: formData.get('observacoes'),
      itens: cart.map((item) => ({ produtoId: item.produtoId, quantidade: item.quantidade })),
    };
    try {
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Não foi possível confirmar a encomenda.');
      saveCart([]);
      orderConfirmed = true;
      list.replaceChildren();
      const confirmation = document.createElement('div');
      confirmation.className = 'confirmation-message';
      const title = document.createElement('h3');
      title.textContent = `Encomenda #${result.numero} confirmada!`;
      const details = document.createElement('p');
      details.textContent = `Recebemos seu pedido no valor de ${PaoQuente.formatPrice(result.valorTotal)}. Aguardamos você na data e horário escolhidos.`;
      confirmation.append(title, details);
      list.append(confirmation);
      totalElement.textContent = PaoQuente.formatPrice(result.valorTotal);
      form.reset();
      message.className = 'status-message success';
      message.textContent = 'Tudo certo! Anote o número da encomenda para consultar com a equipe.';
    } catch (error) {
      message.className = 'status-message';
      message.textContent = error.message;
    } finally {
      if (orderConfirmed) {
        submitButton.disabled = true;
        submitButton.textContent = 'Encomenda confirmada';
      } else {
        submitButton.disabled = false;
        submitButton.textContent = 'Confirmar encomenda →';
        renderCart();
      }
    }
  });

  renderCart();
})();
