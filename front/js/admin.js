(() => {
  const loginView = document.getElementById('login-view');
  const dashboard = document.getElementById('dashboard-view');
  if (!loginView || !dashboard) return;
  const loginForm = document.getElementById('login-form');
  const loginMessage = document.getElementById('login-message');
  const ordersList = document.getElementById('orders-list');
  const productsList = document.getElementById('admin-products');
  const productForm = document.getElementById('product-form');
  const productMessage = document.getElementById('product-message');
  const productFormTitle = document.getElementById('product-form-title');
  const productId = document.getElementById('product-id');
  const statuses = ['Pendente', 'Em preparação', 'Pronta para retirada', 'Finalizada', 'Cancelada'];

  function setAuthenticated(value) {
    loginView.hidden = value;
    dashboard.hidden = !value;
  }

  async function api(url, options = {}) {
    const response = await fetch(url, {
      ...options,
      headers: { ...(options.body ? { 'Content-Type': 'application/json' } : {}), ...options.headers },
    });
    if (response.status === 401) {
      setAuthenticated(false);
      throw new Error('Sua sessão expirou. Entre novamente.');
    }
    if (response.status === 204) return null;
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Não foi possível concluir a solicitação.');
    return data;
  }

  function makeText(tag, className, value) {
    const element = document.createElement(tag);
    if (className) element.className = className;
    element.textContent = value;
    return element;
  }

  function renderOrders(orders) {
    ordersList.replaceChildren();
    if (!orders.length) {
      ordersList.append(makeText('p', 'empty-message', 'Ainda não há encomendas.'));
      return;
    }
    orders.forEach((order) => {
      const card = document.createElement('article');
      card.className = 'order-card';
      const main = document.createElement('div');
      const number = makeText('p', 'order-number', `Encomenda #${order.id}`);
      const name = makeText('h3', '', order.cliente);
      const phone = makeText('p', '', `Telefone: ${order.telefone}`);
      const items = makeText('p', 'order-items', order.itens.map((item) => `${item.quantidade} × ${item.nome}`).join(' · '));
      main.append(number, name, phone, items);
      const pickup = document.createElement('div');
      pickup.append(
        makeText('p', '', `Retirada: ${new Date(`${order.data_retirada.slice(0, 10)}T12:00:00`).toLocaleDateString('pt-BR')} às ${String(order.horario_retirada).slice(0, 5)}`),
        makeText('p', 'order-total', PaoQuente.formatPrice(order.valor_total)),
        makeText('p', '', order.observacoes ? `Observações: ${order.observacoes}` : 'Sem observações.')
      );
      const side = document.createElement('div');
      side.className = 'order-side';
      const label = makeText('label', '', 'Status do pedido');
      label.htmlFor = `status-${order.id}`;
      const select = document.createElement('select');
      select.id = `status-${order.id}`;
      statuses.forEach((status) => {
        const option = document.createElement('option');
        option.value = status;
        option.textContent = status;
        option.selected = status === order.status;
        select.append(option);
      });
      select.addEventListener('change', async () => {
        select.disabled = true;
        try {
          await api(`/api/admin/orders/${order.id}/status`, {
            method: 'PATCH',
            body: JSON.stringify({ status: select.value }),
          });
          order.status = select.value;
        } catch (error) {
          document.getElementById('orders-message').textContent = error.message;
          select.value = order.status;
        } finally {
          select.disabled = false;
        }
      });
      side.append(label, select);
      card.append(main, pickup, side);
      ordersList.append(card);
    });
  }

  async function loadOrders() {
    const message = document.getElementById('orders-message');
    message.textContent = '';
    try {
      renderOrders(await api('/api/admin/orders'));
    } catch (error) {
      message.textContent = error.message;
    }
  }

  function resetProductForm() {
    productForm.reset();
    productId.value = '';
    productFormTitle.textContent = 'Novo produto';
    document.getElementById('save-product').textContent = 'Cadastrar produto';
    document.getElementById('cancel-edit').hidden = true;
    productMessage.textContent = '';
  }

  async function loadProducts() {
    try {
      const products = await api('/api/products');
      productsList.replaceChildren();
      if (!products.length) {
        productsList.append(makeText('p', 'empty-message', 'Não há produtos ativos no catálogo.'));
        return;
      }
      products.forEach((product) => {
        const row = document.createElement('article');
        row.className = 'admin-product-row';
        const details = document.createElement('div');
        details.append(
          makeText('strong', '', product.nome),
          makeText('small', '', `${product.categoria} · ${PaoQuente.formatPrice(product.preco)}`)
        );
        const actions = document.createElement('div');
        actions.className = 'product-actions';
        const edit = document.createElement('button');
        edit.type = 'button';
        edit.textContent = 'Editar';
        edit.addEventListener('click', () => {
          productId.value = product.id;
          document.getElementById('product-name').value = product.nome;
          document.getElementById('product-description').value = product.descricao;
          document.getElementById('product-price').value = product.preco;
          document.getElementById('product-category').value = product.categoria;
          document.getElementById('product-image').value = product.imagem;
          productFormTitle.textContent = 'Editar produto';
          document.getElementById('save-product').textContent = 'Salvar alterações';
          document.getElementById('cancel-edit').hidden = false;
          productForm.scrollIntoView({ behavior: 'smooth', block: 'start' });
        });
        const remove = document.createElement('button');
        remove.type = 'button';
        remove.textContent = 'Excluir';
        remove.addEventListener('click', async () => {
          if (!window.confirm(`Excluir "${product.nome}" do catálogo?`)) return;
          try {
            await api(`/api/admin/products/${product.id}`, { method: 'DELETE' });
            await loadProducts();
          } catch (error) {
            document.getElementById('products-message').textContent = error.message;
          }
        });
        actions.append(edit, remove);
        row.append(details, actions);
        productsList.append(row);
      });
    } catch (error) {
      document.getElementById('products-message').textContent = error.message;
    }
  }

  loginForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    loginMessage.textContent = '';
    const data = new FormData(loginForm);
    try {
      await api('/api/admin/login', {
        method: 'POST',
        body: JSON.stringify({ usuario: data.get('usuario'), senha: data.get('senha') }),
      });
      loginForm.reset();
      setAuthenticated(true);
      await Promise.all([loadOrders(), loadProducts()]);
    } catch (error) {
      loginMessage.textContent = error.message;
    }
  });

  document.getElementById('logout-button').addEventListener('click', async () => {
    try {
      await fetch('/api/admin/logout', { method: 'POST' });
      setAuthenticated(false);
    } catch (error) {
      document.getElementById('orders-message').textContent = error.message;
    }
  });

  document.querySelectorAll('.admin-tab').forEach((button) => {
    button.addEventListener('click', () => {
      document.querySelectorAll('.admin-tab').forEach((tab) => tab.classList.toggle('active', tab === button));
      document.getElementById('orders-tab').hidden = button.dataset.tab !== 'orders';
      document.getElementById('products-tab').hidden = button.dataset.tab !== 'products';
    });
  });

  document.getElementById('cancel-edit').addEventListener('click', resetProductForm);
  productForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    productMessage.textContent = '';
    const id = productId.value;
    const payload = {
      nome: document.getElementById('product-name').value,
      descricao: document.getElementById('product-description').value,
      preco: document.getElementById('product-price').value,
      categoria: document.getElementById('product-category').value,
      imagem: document.getElementById('product-image').value,
    };
    const saveButton = document.getElementById('save-product');
    saveButton.disabled = true;
    try {
      await api(id ? `/api/admin/products/${id}` : '/api/admin/products', {
        method: id ? 'PUT' : 'POST',
        body: JSON.stringify(payload),
      });
      resetProductForm();
      document.getElementById('products-message').textContent = 'Produto salvo com sucesso.';
      document.getElementById('products-message').classList.add('success');
      await loadProducts();
    } catch (error) {
      productMessage.textContent = error.message;
    } finally {
      saveButton.disabled = false;
    }
  });

  api('/api/admin/me')
    .then(() => {
      setAuthenticated(true);
      return Promise.all([loadOrders(), loadProducts()]);
    })
    .catch(() => setAuthenticated(false));
})();
