# Backend PoliPadaria

Backend em Node.js + Express com SQLite local para o sistema da PoliPadaria. A API continua pequena e didatica, mas agora tem validacao de payload, filtros seguros, ordenacao, paginacao, rotas de dominio e criacao transacional de pedidos com itens.

## Stack

- Node.js
- Express
- SQLite com `node:sqlite`
- CommonJS

## Estrutura

```text
backend/
  data/
    polipadaria.sqlite3
  scripts/
    seedMockData.js
  src/
    dataModel.js
    database.js
    errors.js
    mockData/
      catalogs.js
      generator.js
      random.js
    server.js
    validation.js
  package.json
```

## Como executar

No diretorio `backend`:

```bash
npm install
npm start
npm run seed:mock -- --size=medium --seed=42 --days=90 --reset
```

API padrao:

```text
http://localhost:4000
```

Arquivo SQLite:

```text
backend/data/polipadaria.sqlite3
```

## Entidades

- `clientes`
- `funcionarios`
- `pedidos`
- `itensPedido`
- `produtos`
- `produtosIngredientes`
- `ingredientes`

## Geracao automatizada de mock data

O backend agora possui um gerador automatizado de massa de dados para SQLite, com foco em coerencia de dominio e reproducibilidade.

- clientes com nomes plausiveis e CPF fake unico
- funcionarios com nomes realistas
- ingredientes e produtos baseados em catalogos de padaria
- receitas plausiveis em `produtosIngredientes`
- pedidos distribuidos em horarios tipicos
- itens sem repeticao do mesmo produto no mesmo pedido
- total de pedido calculado a partir dos itens
- suporte a `valor_unitario` quando a coluna existir

### Como executar

```bash
npm run seed:mock -- --size=medium --seed=42 --days=90 --reset
```

Ou diretamente:

```bash
node scripts/seedMockData.js --size=medium --seed=42 --days=90 --reset
```

### Parametros

- `--size`: `small`, `medium` ou `large`
- `--seed`: seed pseudoaleatoria reprodutivel
- `--days`: quantidade de dias para distribuir os pedidos
- `--reset`: remove o arquivo SQLite antes de recriar e popular a base

### Exemplos

```bash
npm run seed:mock -- --size=small --seed=7 --days=30 --reset
npm run seed:mock -- --size=medium --seed=42 --days=90 --reset
npm run seed:mock -- --size=large --seed=2026 --days=180 --reset
node scripts/seedMockData.js --size=medium --seed=42 --days=90
```

### Tamanhos de dataset

- `small`: 30 clientes, 6 funcionarios, 15 ingredientes, 20 produtos, 150 pedidos
- `medium`: 200 clientes, 15 funcionarios, 30 ingredientes, 50 produtos, 2000 pedidos
- `large`: 1000 clientes, 40 funcionarios, 60 ingredientes, 120 produtos, 15000 pedidos

### Reproducibilidade

O gerador usa um RNG interno com seed. Com os mesmos parametros de `size`, `seed` e `days`, o dataset gerado e o mesmo.

Para evitar variacao por data de execucao, o script usa uma data de referencia fixa interna e distribui os pedidos para tras dentro da janela configurada.

### Reset e append

- Com `--reset`, a base e recriada do zero.
- Sem `--reset`, o script faz append usando os proximos IDs disponiveis.
- O script detecta a coluna `valor_unitario` em `itensPedido` e preenche automaticamente quando ela existir.

### Garantias de consistencia

- `produtosIngredientes` sem duplicidade de PK composta
- `itensPedido` sem duplicidade do mesmo produto dentro do pedido
- totais de `pedidos` coerentes com os itens
- foreign keys validas
- pesos simples de popularidade para clientes e produtos
- horarios de pedido plausiveis para operacao de padaria

## Modelo e validacao

O arquivo [dataModel.js](/home/enoch/projects/PoliPadaria/backend/src/dataModel.js) define:

- chave primaria simples ou composta
- colunas de insercao e atualizacao
- metadados de campo
- tipo logico (`integer`, `real`, `text`, `datetime`)
- obrigatoriedade
- minimo permitido
- colunas filtraveis
- colunas ordenaveis
- seeds iniciais

Antes de gravar no SQLite, a API valida:

- entidade existente
- campos desconhecidos
- campos obrigatorios ausentes
- tipos invalidos
- texto vazio em campos obrigatorios
- minimos numericos
- enums, quando houver

## Schema SQLite

O schema inclui regras importantes no banco:

- `produtos.valor >= 0`
- `pedidos.total >= 0`
- `itensPedido.quantidade > 0`
- `itensPedido.valor_unitario >= 0`
- `produtosIngredientes.quantidade > 0`
- `ingredientes.quantidade_estoque >= 0`

`itensPedido.valor_unitario` preserva o preco do produto no momento da venda.

## CRUD generico

### Listar colecao

- `GET /api/:collection`

Exemplo:

```bash
curl "http://localhost:4000/api/produtos"
```

### Criar registro

- `POST /api/:collection`
- retorna o registro criado
- status `201`

Exemplo:

```bash
curl -X POST "http://localhost:4000/api/produtos" \
  -H "Content-Type: application/json" \
  -d '{"nome":"Sonho","valor":7.5,"categoria":"Confeitaria"}'
```

### Atualizar registro completo

- `PUT /api/:collection/:key`
- retorna o registro atualizado
- exige todos os campos de atualizacao da entidade

### Atualizar registro parcialmente

- `PATCH /api/:collection/:key`
- retorna o registro atualizado
- aceita apenas os campos que vao mudar

### Remover registro

- `DELETE /api/:collection/:key`
- retorna confirmacao simples:

```json
{
  "deleted": true,
  "key": "1::2",
  "collection": "itensPedido"
}
```

## Chave primaria composta

Quando a PK tem mais de uma coluna, use o formato:

```text
valor1::valor2
```

Exemplos:

- `itensPedido`: `/api/itensPedido/1::2`
- `produtosIngredientes`: `/api/produtosIngredientes/2::4`

## Filtros, ordenacao e paginacao

`GET /api/:collection` aceita:

- filtro por igualdade: `campo=valor`
- busca parcial em texto: `campo_like=valor`
- faixa numerica: `campo_min=valor` e `campo_max=valor`
- faixa de data: `campo_from=2026-04-01` e `campo_to=2026-04-30`
- ordenacao: `sort=campo&order=asc|desc`
- paginacao: `limit=10&offset=20`

Os filtros e a ordenacao sao validados pelo metadata do modelo. Colunas arbitrarias nao sao aceitas.

Exemplos:

```bash
curl "http://localhost:4000/api/produtos?categoria=Panificacao"
curl "http://localhost:4000/api/produtos?nome_like=Pao&sort=valor&order=asc"
curl "http://localhost:4000/api/pedidos?id_cliente=1&data_from=2026-04-01&data_to=2026-04-30"
curl "http://localhost:4000/api/ingredientes?quantidade_estoque_max=10&sort=quantidade_estoque&order=asc"
curl "http://localhost:4000/api/produtos?limit=10&offset=20"
```

## Endpoints de dominio

### Itens de um pedido

- `GET /api/pedidos/:id/itens`

Retorna os itens do pedido com dados do produto:

- `id_produto`
- `nome_produto`
- `quantidade`
- `valor_unitario`
- `valor_atual`
- `subtotal`

Exemplo:

```bash
curl "http://localhost:4000/api/pedidos/1/itens"
```

### Ingredientes de um produto

- `GET /api/produtos/:id/ingredientes`

Retorna:

- `id_ingrediente`
- `nome_ingrediente`
- `unidade`
- `quantidade_usada`

Exemplo:

```bash
curl "http://localhost:4000/api/produtos/1/ingredientes"
```

### Pedidos de um cliente

- `GET /api/clientes/:id/pedidos`

Exemplo:

```bash
curl "http://localhost:4000/api/clientes/1/pedidos"
```

### Ingredientes com baixo estoque

- `GET /api/ingredientes/baixo-estoque`
- query opcional: `max`
- valor padrao: `10`

Exemplo:

```bash
curl "http://localhost:4000/api/ingredientes/baixo-estoque?max=10"
```

## Criacao de pedido com itens

- `POST /api/pedidos-com-itens`
- cria pedido e itens em uma unica transacao
- calcula `total` automaticamente
- valida cliente, funcionario, produtos e quantidades
- grava `valor_unitario` em cada item

Exemplo:

```bash
curl -X POST "http://localhost:4000/api/pedidos-com-itens" \
  -H "Content-Type: application/json" \
  -d '{
    "data": "2026-04-09T10:30",
    "id_cliente": 2,
    "id_funcionario": 1,
    "itens": [
      { "id_produto": 1, "quantidade": 3 },
      { "id_produto": 3, "quantidade": 2 }
    ]
  }'
```

Resposta esperada:

```json
{
  "id": 2,
  "data": "2026-04-09T10:30",
  "total": 13.7,
  "id_cliente": 2,
  "id_funcionario": 1,
  "itens": [
    {
      "id_pedido": 2,
      "id_produto": 3,
      "nome_produto": "Cafe Coado",
      "quantidade": 2,
      "valor_unitario": 5.5,
      "valor_atual": 5.5,
      "subtotal": 11
    }
  ]
}
```

## Endpoint auxiliar `/api/sql`

- `POST /api/sql`
- aceita apenas uma instrucao SQL por chamada
- suporta leitura e escrita
- e util para inspecao, depuracao e testes da disciplina

Exemplo:

```bash
curl -X POST "http://localhost:4000/api/sql" \
  -H "Content-Type: application/json" \
  -d '{"query":"SELECT * FROM produtos;"}'
```

Observacao importante: `/api/sql` e um endpoint administrativo/auxiliar. As funcionalidades da aplicacao devem usar as rotas de negocio e o CRUD da API.

## Erros comuns

- `400 Bad Request`
  - payload invalido
  - chave primaria invalida
  - filtro invalido
  - SQL invalido em `/api/sql`
- `404 Not Found`
  - entidade desconhecida
  - registro nao encontrado
- `409 Conflict`
  - violacao de unicidade
  - violacao de chave estrangeira
  - violacao de `CHECK`
- `500 Internal Server Error`
  - erro inesperado no servidor

## Observacoes

- A inicializacao aplica o schema automaticamente.
- Se existir um banco local antigo sem `valor_unitario` ou sem os `CHECK`s novos, o backend reconstrui o schema mantendo os dados conhecidos do projeto.
- `GET /api/state` continua disponivel para inspecao rapida do estado completo.

## Endpoints de insights

O backend inclui uma camada simples de insights operacionais em `/api/insights`, pensada para demonstracao academica e leitura gerencial do sistema.

### Rotas disponiveis

- `GET /api/insights/resumo`
  - retorna total de pedidos, faturamento, ticket medio, totais cadastrais e quantidade de ingredientes criticos
  - aceita `from`, `to` e `max`
- `GET /api/insights/vendas-por-periodo`
  - agrega pedidos e faturamento por `day` ou `month`
  - aceita `from`, `to` e `groupBy`
- `GET /api/insights/produtos-mais-vendidos`
  - retorna ranking de produtos por quantidade vendida e receita
  - aceita `limit`, `from` e `to`
- `GET /api/insights/categorias`
  - resume quantidade vendida e valor total por categoria
  - aceita `from` e `to`
- `GET /api/insights/clientes-top`
  - lista clientes com maior valor gasto e quantidade de pedidos
  - aceita `limit`, `from` e `to`
- `GET /api/insights/estoque-baixo`
  - lista ingredientes com estoque abaixo do limiar
  - aceita `max`
- `GET /api/insights/produtos-afetados-por-estoque`
  - relaciona produtos a ingredientes criticos usados na composicao
  - aceita `max`

### Exemplos

```bash
curl "http://localhost:4000/api/insights/resumo?from=2026-03-01&to=2026-04-09"
curl "http://localhost:4000/api/insights/vendas-por-periodo?groupBy=day"
curl "http://localhost:4000/api/insights/produtos-mais-vendidos?limit=5"
curl "http://localhost:4000/api/insights/clientes-top?limit=5&from=2026-04-01"
curl "http://localhost:4000/api/insights/estoque-baixo?max=12"
curl "http://localhost:4000/api/insights/produtos-afetados-por-estoque?max=12"
```

Os filtros sao validados no backend e as consultas usam placeholders no SQLite.
