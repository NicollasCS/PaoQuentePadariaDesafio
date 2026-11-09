require('dotenv').config();
const bcrypt = require('bcryptjs');
const { db, initializeDatabase } = require('../database/db');

async function createAdmin() {
  initializeDatabase();
  const { ADMIN_USERNAME, ADMIN_PASSWORD, JWT_SECRET } = process.env;
  if (!ADMIN_USERNAME || ADMIN_USERNAME.trim().length < 3) {
    throw new Error('Defina ADMIN_USERNAME com pelo menos 3 caracteres.');
  }
  if (!ADMIN_PASSWORD || ADMIN_PASSWORD.length < 12) {
    throw new Error('Defina ADMIN_PASSWORD com pelo menos 12 caracteres.');
  }
  if (!JWT_SECRET || JWT_SECRET.length < 32) {
    throw new Error('Defina JWT_SECRET com pelo menos 32 caracteres.');
  }

  const hash = await bcrypt.hash(ADMIN_PASSWORD, 12);
  db.prepare(
    `INSERT INTO administradores (usuario, senha_hash)
     VALUES (?, ?)
     ON CONFLICT (usuario) DO UPDATE SET senha_hash = excluded.senha_hash`
  ).run(ADMIN_USERNAME.trim(), hash);
  console.log(`Conta administrativa "${ADMIN_USERNAME.trim()}" criada/atualizada.`);
}

createAdmin()
  .catch((error) => {
    console.error('Não foi possível criar o administrador:', error.message);
    process.exitCode = 1;
  })
  .finally(() => db.close());
