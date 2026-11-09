(() => {
  const container = document.getElementById('catalog-products');
  if (!container) return;
  const message = document.getElementById('catalog-message');
  let products = [];
  let selectedCategory = 'Todos';

  function addProduct(product, button) {
    const cart = PaoQuente.readCart();
    const item = cart.find((entry) => entry.produtoId === product.id);
    if (item) item.quantidade = Math.min(100, item.quantidade + 1);
    else cart.push({ produtoId: product.id, nome: product.nome, preco: Number(product.preco), quantidade: 1 });
    localStorage.setItem(PaoQuente.cartKey, JSON.stringify(cart));
    PaoQuente.notifyCartChanged();
    message.textContent = `${product.nome} adicionado à sua encomenda.`;
    message.classList.add('success');
    button.textContent = '✓';
    window.setTimeout(() => { button.textContent = '+'; }, 800);
  }

  function render() {
    container.replaceChildren();
    const visibleProducts = selectedCategory === 'Todos'
      ? products
      : products.filter((product) => product.categoria === selectedCategory);
    if (!visibleProducts.length) {
      const empty = document.createElement('p');
      empty.className = 'empty-message';
      empty.textContent = 'Nenhum produto encontrado nesta categoria.';
      container.append(empty);
      return;
    }
    visibleProducts.forEach((product) => {
      const card = document.createElement('article');
      card.className = 'product-card';
      const image = document.createElement('img');
      image.className = 'product-image';
      image.src = product.imagem;
      image.alt = product.nome;
      image.loading = 'lazy';
      image.onerror = () => { image.hidden = true; };
      const body = document.createElement('div');
      body.className = 'product-body';
      const category = document.createElement('p');
      category.className = 'product-category';
      category.textContent = product.categoria;
      const title = document.createElement('h3');
      title.textContent = product.nome;
      const description = document.createElement('p');
      description.className = 'product-description';
      description.textContent = product.descricao;
      const bottom = document.createElement('div');
      bottom.className = 'product-bottom';
      const price = document.createElement('span');
      price.className = 'product-price';
      price.textContent = PaoQuente.formatPrice(product.preco);
      const add = document.createElement('button');
      add.className = 'add-button';
      add.type = 'button';
      add.textContent = '+';
      add.setAttribute('aria-label', `Adicionar ${product.nome} à encomenda`);
      add.addEventListener('click', () => addProduct(product, add));
      bottom.append(price, add);
      body.append(category, title, description, bottom);
      card.append(image, body);
      container.append(card);
    });
  }

  document.querySelectorAll('.filter-button').forEach((button) => {
    button.addEventListener('click', () => {
      document.querySelectorAll('.filter-button').forEach((filter) => filter.classList.remove('active'));
      button.classList.add('active');
      selectedCategory = button.dataset.category;
      render();
    });
  });

  fetch('/api/products')
    .then((response) => {
      if (!response.ok) throw new Error('Não foi possível carregar o catálogo.');
      return response.json();
    })
    .then((data) => { products = data; render(); })
    .catch(() => { container.innerHTML = '<p class="empty-message">Não foi possível carregar o catálogo. Tente novamente mais tarde.</p>'; });
})();
