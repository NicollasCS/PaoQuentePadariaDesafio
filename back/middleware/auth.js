const jwt = require('jsonwebtoken');

function requireAdmin(req, res, next) {
  const token = req.cookies?.adminToken;
  if (!token) {
    return res.status(401).json({ error: 'Acesso administrativo necessário.' });
  }

  try {
    req.admin = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch {
    res.clearCookie('adminToken');
    return res.status(401).json({ error: 'Sessão inválida ou expirada. Entre novamente.' });
  }
}

module.exports = requireAdmin;
