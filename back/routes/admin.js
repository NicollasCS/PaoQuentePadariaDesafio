const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const rateLimit = require('express-rate-limit');
const { db } = require('../database/db');
const requireAdmin = require('../middleware/auth');

const router = express.Router();
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { error: 'Muitas tentativas. Aguarde 15 minutos e tente novamente.' },
});
const statuses = ['Pendente', 'Em preparação', 'Pronta para retirada', 'Finalizada', 'Cancelada'];

router.post('/login', loginLimiter, async (req, res, next) => {
  const { usuario, senha } = req.body;
  if (typeof usuario !== 'string' || typeof senha !== 'string') {
    return res.status(400).json({ error: 'Informe usuário e senha.' });
  }

  try {
    const admin = db.prepare('SELECT id, usuario, senha_hash FROM administradores WHERE usuario = ?').get(usuario.trim());
    if (!admin || !(await bcrypt.compare(senha, admin.senha_hash))) {
      return res.status(401).json({ error: 'Usuário ou senha incorretos.' });
    }

    const token = jwt.sign({ id: admin.id, usuario: admin.usuario }, process.env.JWT_SECRET, { expiresIn: '8h' });
    res.cookie('adminToken', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 8 * 60 * 60 * 1000,
    });
    res.json({ usuario: admin.usuario });
  } catch (error) {
    next(error);
  }
});

router.post('/logout', (req, res) => {
  res.clearCookie('adminToken', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
  });
  res.sendStatus(204);
});

router.get('/me', requireAdmin, (req, res) => res.json({ usuario: req.admin.usuario }));

router.get('/orders', requireAdmin, async (req, res, next) => {
  try {
    const orders = db.prepare(
      `SELECT e.id, c.nome AS cliente, c.telefone, e.data_retirada, e.horario_retirada,
              e.observacoes, e.status, e.valor_total, e.data_criacao
       FROM encomendas e
       JOIN clientes c ON c.id = e.cliente_id
       ORDER BY e.data_criacao DESC`
    ).all();
    const items = db.prepare(
      `SELECT ie.encomenda_id, ie.nome_produto AS nome, ie.quantidade, ie.preco_unitario
       FROM itens_encomenda ie
       ORDER BY ie.encomenda_id DESC, ie.id`
    ).all();
    const itemsByOrder = new Map();
    for (const item of items) {
      if (!itemsByOrder.has(item.encomenda_id)) itemsByOrder.set(item.encomenda_id, []);
      itemsByOrder.get(item.encomenda_id).push(item);
    }
    res.json(orders.map((order) => ({
      ...order,
      valor_total: Number(order.valor_total).toFixed(2),
      itens: (itemsByOrder.get(order.id) || []).map((item) => ({
        ...item,
        preco_unitario: Number(item.preco_unitario).toFixed(2),
      })),
    })));
  } catch (error) {
    next(error);
  }
});

router.patch('/orders/:id/status', requireAdmin, async (req, res, next) => {
  const id = Number(req.params.id);
  const { status } = req.body;
  if (!Number.isSafeInteger(id) || id < 1 || !statuses.includes(status)) {
    return res.status(400).json({ error: 'Encomenda ou status inválido.' });
  }
  try {
    const result = db.prepare('UPDATE encomendas SET status = ? WHERE id = ?').run(status, id);
    if (result.changes === 0) return res.status(404).json({ error: 'Encomenda não encontrada.' });
    res.json({ id, status });
  } catch (error) {
    next(error);
  }
});

function validateProduct(body) {
  const { nome, descricao, preco, categoria, imagem } = body;
  if (
    typeof nome !== 'string' || nome.trim().length < 2 || nome.trim().length > 120 ||
    typeof descricao !== 'string' || descricao.trim().length < 2 || descricao.trim().length > 500 ||
    !Number.isFinite(Number(preco)) || Number(preco) <= 0 || Number(preco) > 100000 ||
    !['Pães', 'Bolos'].includes(categoria) ||
    typeof imagem !== 'string' || imagem.trim().length < 5 || imagem.trim().length > 500
  ) return 'Preencha nome, descrição, preço positivo, categoria e URL da imagem corretamente.';
  try {
    const url = new URL(imagem);
    if (url.protocol !== 'https:') return 'A imagem deve usar um endereço HTTPS.';
  } catch {
    return 'Informe uma URL válida para a imagem.';
  }
  return null;
}

router.post('/products', requireAdmin, async (req, res, next) => {
  const validationError = validateProduct(req.body);
  if (validationError) return res.status(400).json({ error: validationError });
  const { nome, descricao, preco, categoria, imagem } = req.body;
  try {
    const result = db.prepare(
      `INSERT INTO produtos (nome, descricao, preco, categoria, imagem)
       VALUES (?, ?, ?, ?, ?)`
    ).run(nome.trim(), descricao.trim(), Number(preco).toFixed(2), categoria, imagem.trim());
    const product = db.prepare(
      'SELECT id, nome, descricao, preco, categoria, imagem FROM produtos WHERE id = ?'
    ).get(result.lastInsertRowid);
    res.status(201).json({ ...product, preco: Number(product.preco).toFixed(2) });
  } catch (error) {
    if (error.code === 'SQLITE_CONSTRAINT_UNIQUE') return res.status(409).json({ error: 'Já existe um produto com esse nome.' });
    next(error);
  }
});

router.put('/products/:id', requireAdmin, async (req, res, next) => {
  const id = Number(req.params.id);
  const validationError = validateProduct(req.body);
  if (!Number.isSafeInteger(id) || id < 1) return res.status(400).json({ error: 'Produto inválido.' });
  if (validationError) return res.status(400).json({ error: validationError });
  const { nome, descricao, preco, categoria, imagem } = req.body;
  try {
    const result = db.prepare(
      `UPDATE produtos SET nome = ?, descricao = ?, preco = ?, categoria = ?, imagem = ?
       WHERE id = ? AND ativo = 1`
    ).run(nome.trim(), descricao.trim(), Number(preco).toFixed(2), categoria, imagem.trim(), id);
    if (result.changes === 0) return res.status(404).json({ error: 'Produto não encontrado.' });
    const product = db.prepare(
      'SELECT id, nome, descricao, preco, categoria, imagem FROM produtos WHERE id = ?'
    ).get(id);
    res.json({ ...product, preco: Number(product.preco).toFixed(2) });
  } catch (error) {
    if (error.code === 'SQLITE_CONSTRAINT_UNIQUE') return res.status(409).json({ error: 'Já existe um produto com esse nome.' });
    next(error);
  }
});

router.delete('/products/:id', requireAdmin, async (req, res, next) => {
  const id = Number(req.params.id);
  if (!Number.isSafeInteger(id) || id < 1) return res.status(400).json({ error: 'Produto inválido.' });
  try {
    const result = db.prepare('UPDATE produtos SET ativo = 0 WHERE id = ? AND ativo = 1').run(id);
    if (result.changes === 0) return res.status(404).json({ error: 'Produto não encontrado.' });
    res.sendStatus(204);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
