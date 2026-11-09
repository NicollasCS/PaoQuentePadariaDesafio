(() => {
  const container = document.getElementById('featured-products');
  if (!container) return;

  function renderFeatured(products) {
    container.replaceChildren();
    const featured = products.slice(0, 4);
    if (!featured.length) {
      const empty = document.createElement('p');
      empty.className = 'empty-message';
      empty.textContent = 'Ainda não há produtos disponíveis.';
      container.append(empty);
      return;
    }
    featured.forEach((product) => {
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
      add.addEventListener('click', () => {
        const cart = PaoQuente.readCart();
        const item = cart.find((entry) => entry.produtoId === product.id);
        if (item) item.quantidade += 1;
        else cart.push({ produtoId: product.id, nome: product.nome, preco: Number(product.preco), quantidade: 1 });
        localStorage.setItem(PaoQuente.cartKey, JSON.stringify(cart));
        PaoQuente.notifyCartChanged();
        add.textContent = '✓';
        window.setTimeout(() => { add.textContent = '+'; }, 900);
      });
      bottom.append(price, add);
      body.append(category, title, description, bottom);
      card.append(image, body);
      container.append(card);
    });
  }

  fetch('/api/products')
    .then((response) => {
      if (!response.ok) throw new Error('Não foi possível carregar os produtos.');
      return response.json();
    })
    .then(renderFeatured)
    .catch(() => { container.innerHTML = '<p class="empty-message">Não foi possível carregar os destaques. Tente novamente mais tarde.</p>'; });
})();
