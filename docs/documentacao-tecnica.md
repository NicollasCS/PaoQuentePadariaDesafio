# Documentação técnica — Pão Quente

## Resumo

Site de catálogo, encomendas e administração. As páginas usam HTML, CSS e JavaScript. O servidor usa Node.js e Express. Os dados ficam em um banco SQLite local, no arquivo `back/database/pao-quente.sqlite`.

Não é necessário instalar ou configurar um servidor de banco. O arquivo SQLite e os produtos iniciais são criados automaticamente quando o servidor inicia.

## Como iniciar

1. Instale Node.js 18 ou superior.
2. Confira o arquivo `.env`. Defina `JWT_SECRET` com pelo menos 32 caracteres, `ADMIN_USERNAME` e `ADMIN_PASSWORD` com pelo menos 12 caracteres.
3. Na pasta do projeto, execute:

   ```text
   npm install
   npm run admin:create
   npm start
   ```

4. Acesse `http://localhost:3000`. A página administrativa está em `http://localhost:3000/admin.html`.

## Testar no Postman

1. Importe a coleção `postman/Pao-Quente.postman_collection.json` e o ambiente `postman/Local.postman_environment.json`.
2. Selecione o ambiente **Pão Quente - Local**. Preencha `adminPassword` com a senha `ADMIN_PASSWORD` do `.env`.
3. Inicie o servidor e execute as chamadas da coleção em ordem.

O Postman chama a aplicação em `http://localhost:3000`. A aplicação lê e grava os dados no arquivo SQLite. Esses são dois componentes diferentes: não é preciso colocar um endereço de banco no Postman.

## Pastas importantes

- `front/`: páginas, estilos e JavaScript do navegador.
- `back/server.js`: servidor web e API.
- `back/routes/`: catálogo, encomendas e administração.
- `back/database/db.js`: abre e inicializa o banco SQLite.
- `back/sql/`: tabelas e produtos de exemplo.
- `back/database/pao-quente.sqlite`: banco criado ao iniciar; não compartilhar.
- `postman/`: coleção e ambiente de teste.

## API principal

| Método | Caminho | Função |
|---|---|---|
| GET | `/api/health` | Confere se a API está ativa |
| GET | `/api/products` | Lista produtos |
| POST | `/api/orders` | Registra uma encomenda |
| POST | `/api/admin/login` | Acessa o painel |
| GET | `/api/admin/orders` | Consulta pedidos (após login) |
| PATCH | `/api/admin/orders/:id/status` | Atualiza o status (após login) |
| POST / PUT / DELETE | `/api/admin/products` | Cadastra, edita ou desativa produtos (após login) |

O servidor busca os preços no banco antes de salvar a encomenda. A senha do administrador é armazenada como hash.

## Publicação

Para a apresentação escolar, deixe o servidor e o Postman no mesmo computador. Para uso pela internet, configure armazenamento persistente para o arquivo SQLite; o arquivo precisa sobreviver a reinícios e atualizações da hospedagem. Não publique o `.env` ou o banco de dados. Use HTTPS em uma hospedagem pública.
