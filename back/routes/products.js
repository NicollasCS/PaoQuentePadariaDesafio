const express = require('express');
const { db } = require('../database/db');

const router = express.Router();

router.get('/', async (req, res, next) => {
  try {
    const products = db.prepare(
      'SELECT id, nome, descricao, preco, categoria, imagem, destaque FROM produtos WHERE ativo = 1 ORDER BY destaque DESC, categoria, nome'
    ).all();
    res.json(products.map((product) => ({ ...product, preco: Number(product.preco).toFixed(2) })));
  } catch (error) {
    next(error);
  }
});

module.exports = router;
