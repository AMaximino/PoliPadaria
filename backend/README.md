# Backend PoliPadaria

API REST em Node.js + Express com persistencia em SQLite para suportar o CRUD do sistema da PoliPadaria.

## Tecnologias

- Node.js
- Express
- SQLite (modulo nativo `node:sqlite`)
- CORS

## Estrutura

```text
backend/
  data/
    polipadaria.sqlite3
  src/
    dataModel.js
    database.js
    server.js
  package.json
```

## Como executar

No diretorio backend:

```bash
npm install
npm start
```

A API sobe, por padrao, em:

```text
http://localhost:4000
```

## Banco de dados

- Arquivo SQLite: `backend/data/polipadaria.sqlite3`
- O schema e criado automaticamente no startup.
- O seed inicial e aplicado apenas se as tabelas estiverem vazias.
- A ordem de criacao/seed esta definida em `src/dataModel.js`.

## Entidades

As colecoes expostas pela API sao:

- clientes
- funcionarios
- pedidos
- itensPedido
- produtos
- produtosIngredientes
- ingredientes

## Endpoints

### Health

- GET `/api/health`
- Resposta:

```json
{ "ok": true }
```

### Estado completo

- GET `/api/state`
- Retorna um objeto com todas as colecoes (snapshot completo).

### Listar por colecao

- GET `/api/:collection`
- Exemplo: GET `/api/clientes`

### Criar registro

- POST `/api/:collection`
- Body: JSON com os campos da entidade
- Retorno: estado completo atualizado

### Atualizar registro

- PUT `/api/:collection/:key`
- Body: JSON com os campos da entidade
- Retorno: estado completo atualizado

### Excluir registro

- DELETE `/api/:collection/:key`
- Retorno: estado completo atualizado

### Executar SQL puro

- POST `/api/sql`
- Body:

```json
{ "query": "SELECT * FROM clientes;" }
```

- Retornos possiveis:
  - Query de leitura (`SELECT`, `WITH`, `PRAGMA`, `EXPLAIN`):

```json
{
  "mode": "read",
  "rowCount": 2,
  "rows": [
    { "id": 1, "nome": "Maria Silva", "cpf": "111.111.111-11" },
    { "id": 2, "nome": "Joao Souza", "cpf": "222.222.222-22" }
  ]
}
```

  - Query de escrita (`INSERT`, `UPDATE`, `DELETE`, etc):

```json
{
  "mode": "write",
  "changes": 1,
  "lastInsertRowid": 3
}
```

Observacao: o endpoint aceita apenas uma instrucao SQL por execucao.

## Formato da chave primaria (:key)

Para todas as rotas que usam `:key`, o backend espera:

- PK simples: `valor`
- PK composta: `valor1::valor2`

Exemplo para `itensPedido` (PK: `id_pedido`, `id_produto`):

```text
/api/itensPedido/1::2
```

## Regras de erro

O middleware de erro em `src/server.js` trata:

- Restricao SQLite (`SQLITE_CONSTRAINT`) -> HTTP 409
- Chave primaria invalida -> HTTP 400
- Outros erros -> HTTP 500

## Variaveis de ambiente

- `PORT`: porta da API (padrao 4000)

Exemplo:

```bash
PORT=5000 npm start
```

## Integracao com frontend

Por padrao, o frontend consome:

```text
http://localhost:4000/api
```

Se necessario, altere no frontend via `REACT_APP_API_URL`.

## Observacoes

- O backend habilita `PRAGMA foreign_keys = ON`.
- Mesmo com validacoes no frontend, a integridade final e garantida pelo SQLite.
