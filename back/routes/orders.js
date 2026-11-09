const express = require('express');
const { db } = require('../database/db');

const router = express.Router();
const phonePattern = /^[0-9+()\s-]{10,20}$/;

function saoPauloDate() {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Sao_Paulo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());
}

router.post('/', async (req, res, next) => {
  const { nome, telefone, dataRetirada, horarioRetirada, observacoes = '', itens } = req.body;

  if (typeof nome !== 'string' || nome.trim().length < 2 || nome.trim().length > 100) {
    return res.status(400).json({ error: 'Informe um nome com pelo menos 2 caracteres.' });
  }
  if (typeof telefone !== 'string' || !phonePattern.test(telefone.trim())) {
    return res.status(400).json({ error: 'Informe um telefone válido.' });
  }
  if (
    typeof dataRetirada !== 'string' ||
    !/^\d{4}-\d{2}-\d{2}$/.test(dataRetirada) ||
    Number.isNaN(Date.parse(`${dataRetirada}T12:00:00Z`)) ||
    new Date(`${dataRetirada}T12:00:00Z`).toISOString().slice(0, 10) !== dataRetirada ||
    dataRetirada < saoPauloDate()
  ) {
    return res.status(400).json({ error: 'Escolha uma data de retirada válida, a partir de hoje.' });
  }
  if (typeof horarioRetirada !== 'string' || !/^([01]\d|2[0-3]):[0-5]\d$/.test(horarioRetirada)) {
    return res.status(400).json({ error: 'Informe um horário de retirada válido.' });
  }
  if (typeof observacoes !== 'string' || observacoes.length > 500) {
    return res.status(400).json({ error: 'As observações devem ter até 500 caracteres.' });
  }
  if (!Array.isArray(itens) || itens.length === 0 || itens.length > 50) {
    return res.status(400).json({ error: 'Adicione ao menos um produto à encomenda.' });
  }

  const quantities = new Map();
  for (const item of itens) {
    const id = Number(item?.produtoId);
    const quantidade = Number(item?.quantidade);
    if (!Number.isSafeInteger(id) || id < 1 || !Number.isSafeInteger(quantidade) || quantidade < 1 || quantidade > 100) {
      return res.status(400).json({ error: 'Produto ou quantidade inválida. Cada quantidade deve ser de 1 a 100.' });
    }
    quantities.set(id, (quantities.get(id) || 0) + quantidade);
    if (quantities.get(id) > 100) {
      return res.status(400).json({ error: 'A quantidade máxima por produto é 100.' });
    }
  }

  try {
    const ids = [...quantities.keys()];
    const placeholders = ids.map(() => '?').join(', ');
    const products = db.prepare(
      `SELECT id, nome, preco FROM produtos WHERE id IN (${placeholders}) AND ativo = 1`
    ).all(...ids);
    if (products.length !== ids.length) {
      return res.status(400).json({ error: 'Um ou mais produtos não estão mais disponíveis. Atualize o catálogo.' });
    }

    const productById = new Map(products.map((product) => [product.id, product]));
    const totalCents = [...quantities].reduce(
      (sum, [id, quantity]) => sum + Math.round(Number(productById.get(id).preco) * 100) * quantity,
      0
    );
    const total = (totalCents / 100).toFixed(2);
    const createOrder = db.transaction(() => {
      db.prepare(
        `INSERT INTO clientes (nome, telefone)
         VALUES (?, ?)
         ON CONFLICT (telefone) DO UPDATE SET nome = excluded.nome`
      ).run(nome.trim(), telefone.trim());
      const customer = db.prepare('SELECT id FROM clientes WHERE telefone = ?').get(telefone.trim());
      const orderResult = db.prepare(
        `INSERT INTO encomendas (cliente_id, data_retirada, horario_retirada, observacoes, valor_total)
         VALUES (?, ?, ?, ?, ?)`
      ).run(customer.id, dataRetirada, horarioRetirada, observacoes.trim(), total);
      const insertItem = db.prepare(
        `INSERT INTO itens_encomenda (encomenda_id, produto_id, nome_produto, quantidade, preco_unitario)
         VALUES (?, ?, ?, ?, ?)`
      );
      for (const [id, quantity] of quantities) {
        const product = productById.get(id);
        insertItem.run(orderResult.lastInsertRowid, id, product.nome, quantity, product.preco);
      }
      return orderResult.lastInsertRowid;
    });

    const orderNumber = createOrder();
    res.status(201).json({ numero: orderNumber, valorTotal: Number(total) });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
