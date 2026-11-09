CREATE TABLE IF NOT EXISTS produtos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nome VARCHAR(120) NOT NULL UNIQUE,
    descricao VARCHAR(500) NOT NULL,
    preco NUMERIC NOT NULL CHECK (preco > 0),
    categoria VARCHAR(40) NOT NULL CHECK (categoria IN ('Pães', 'Bolos')),
    imagem VARCHAR(500) NOT NULL,
    ativo BOOLEAN NOT NULL DEFAULT TRUE,
    destaque BOOLEAN NOT NULL DEFAULT FALSE,
    data_criacao TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS clientes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nome VARCHAR(100) NOT NULL,
    telefone VARCHAR(20) NOT NULL UNIQUE,
    data_criacao TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS encomendas (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    cliente_id INTEGER NOT NULL REFERENCES clientes(id),
    data_retirada TEXT NOT NULL,
    horario_retirada TEXT NOT NULL,
    observacoes VARCHAR(500) NOT NULL DEFAULT '',
    status VARCHAR(30) NOT NULL DEFAULT 'Pendente'
        CHECK (status IN ('Pendente', 'Em preparação', 'Pronta para retirada', 'Finalizada', 'Cancelada')),
    valor_total NUMERIC NOT NULL CHECK (valor_total >= 0),
    data_criacao TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS itens_encomenda (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    encomenda_id INTEGER NOT NULL REFERENCES encomendas(id) ON DELETE CASCADE,
    produto_id INTEGER REFERENCES produtos(id) ON DELETE SET NULL,
    nome_produto VARCHAR(120) NOT NULL,
    quantidade INTEGER NOT NULL CHECK (quantidade >= 1),
    preco_unitario NUMERIC NOT NULL CHECK (preco_unitario > 0)
);

CREATE TABLE IF NOT EXISTS administradores (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    usuario VARCHAR(80) NOT NULL UNIQUE,
    senha_hash VARCHAR(100) NOT NULL,
    data_criacao TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_encomendas_data_retirada ON encomendas(data_retirada);
CREATE INDEX IF NOT EXISTS idx_encomendas_status ON encomendas(status);
CREATE INDEX IF NOT EXISTS idx_itens_encomenda_id ON itens_encomenda(encomenda_id);
