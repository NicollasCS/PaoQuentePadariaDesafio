# Pão Quente

Sistema de catálogo e encomendas com HTML, CSS, JavaScript, Express e SQLite. O banco SQLite é um arquivo criado automaticamente; não precisa instalar ou iniciar um servidor de banco.

## Iniciar

1. Instale o Node.js 18 ou superior.
2. No arquivo `.env`, configure `JWT_SECRET`, `ADMIN_USERNAME` e `ADMIN_PASSWORD` (senha com pelo menos 12 caracteres). O banco será criado em `back/database/pao-quente.sqlite`.
3. Na pasta do projeto, abra um terminal e rode:

   ```text
   npm install
   npm run admin:create
   npm start
   ```

Abra `http://localhost:3000`. Deixe o terminal aberto enquanto usa o sistema. Para parar, pressione **Ctrl+C** no terminal.

## Postman

Importe `postman/Pao-Quente.postman_collection.json` e `postman/Local.postman_environment.json`. Selecione **Pão Quente - Local**, preencha `adminPassword` com a senha do `.env` e execute as requisições na ordem.

Não compartilhe o `.env` nem o arquivo local do banco.

Mais detalhes: [Documentação técnica](docs/documentacao-tecnica.md) e [Manual da equipe](docs/manual-usuario.md).
