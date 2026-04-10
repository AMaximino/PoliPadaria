# Consultas do Sistema

## Visao geral

O PoliPadaria admite dois grupos principais de consulta. O primeiro grupo e formado por consultas SQL executadas diretamente no banco SQLite, seja para estudo do modelo, seja para inspecao administrativa da base. O segundo grupo corresponde as consultas realizadas pela API REST, que encapsula a logica de acesso aos dados, aplica validacoes e devolve respostas em JSON.

As consultas apresentadas a seguir foram selecionadas com base no schema e no backend realmente implementados. Quando uma consulta nao esta codificada literalmente em um arquivo SQL do repositorio, ela continua sendo valida e coerente com a estrutura de tabelas e com os endpoints existentes.

## Consultas SQL

### 1. Listagem de clientes

Objetivo: recuperar os clientes cadastrados, em ordem alfabetica de nome.

```sql
SELECT id, nome, cpf
FROM clientes
ORDER BY nome ASC;
```

Explicacao: a consulta retorna os dados cadastrais basicos de cada cliente e pode ser usada como consulta introdutoria de navegacao da base.

### 2. Busca de produtos por categoria

Objetivo: listar os produtos pertencentes a uma categoria especifica.

```sql
SELECT id, nome, valor, categoria
FROM produtos
WHERE categoria = 'Panificacao'
ORDER BY nome ASC;
```

Explicacao: a consulta filtra o catalogo de produtos por categoria. Ela e util para separar itens de panificacao, confeitaria, bebidas ou salgados.

### 3. Ingredientes com estoque baixo

Objetivo: identificar ingredientes com quantidade de estoque abaixo ou igual a um limite.

```sql
SELECT id, nome, unidade, quantidade_estoque
FROM ingredientes
WHERE quantidade_estoque <= 10
ORDER BY quantidade_estoque ASC, nome ASC;
```

Explicacao: a consulta facilita o monitoramento dos insumos mais criticos da operacao.

### 4. Pedidos de um cliente

Objetivo: consultar os pedidos registrados para um cliente especifico.

```sql
SELECT id, data, total, id_cliente, id_funcionario
FROM pedidos
WHERE id_cliente = 1
ORDER BY data DESC, id DESC;
```

Explicacao: o resultado mostra o historico de pedidos do cliente selecionado, em ordem do mais recente para o mais antigo.

### 5. Itens de um pedido com `JOIN`

Objetivo: detalhar os produtos contidos em um pedido, com nome do produto e subtotal de cada item.

```sql
SELECT
  ip.id_pedido,
  ip.id_produto,
  p.nome AS nome_produto,
  ip.quantidade,
  ip.valor_unitario,
  p.valor AS valor_atual,
  ROUND(ip.quantidade * ip.valor_unitario, 2) AS subtotal
FROM itensPedido ip
INNER JOIN produtos p ON p.id = ip.id_produto
WHERE ip.id_pedido = 1
ORDER BY p.nome ASC;
```

Explicacao: esta consulta corresponde diretamente a logica usada pelo endpoint `GET /api/pedidos/:id/itens` e mostra tanto o valor historico armazenado no item quanto o valor atual do cadastro do produto.

### 6. Ingredientes de um produto

Objetivo: listar a composicao de um produto, relacionando ingredientes e quantidades usadas.

```sql
SELECT
  pi.id_produto,
  pi.id_ingrediente,
  i.nome AS nome_ingrediente,
  i.unidade,
  pi.quantidade AS quantidade_usada
FROM produtosIngredientes pi
INNER JOIN ingredientes i ON i.id = pi.id_ingrediente
WHERE pi.id_produto = 1
ORDER BY i.nome ASC;
```

Explicacao: a consulta representa a receita do produto e esta alinhada com a implementacao do endpoint `GET /api/produtos/:id/ingredientes`.

### 7. Totalizacao de pedidos por periodo

Objetivo: somar o valor vendido em um intervalo de datas.

```sql
SELECT
  COUNT(*) AS quantidade_pedidos,
  ROUND(SUM(total), 2) AS valor_total_vendido
FROM pedidos
WHERE date(data) >= date('2026-04-01')
  AND date(data) <= date('2026-04-30');
```

Explicacao: a consulta utiliza a coluna textual `data` em comparacoes por `date(...)`, o mesmo criterio adotado pela API para filtros de periodo.

### 8. Produtos mais vendidos

Objetivo: identificar os produtos com maior volume comercializado.

```sql
SELECT
  p.id,
  p.nome,
  SUM(ip.quantidade) AS quantidade_vendida,
  ROUND(SUM(ip.quantidade * ip.valor_unitario), 2) AS faturamento_estimado
FROM itensPedido ip
INNER JOIN produtos p ON p.id = ip.id_produto
GROUP BY p.id, p.nome
ORDER BY quantidade_vendida DESC, faturamento_estimado DESC
LIMIT 10;
```

Explicacao: embora nao exista um endpoint especifico para ranking de vendas, a estrutura atual da base suporta naturalmente essa consulta, inclusive com uso de `valor_unitario` para refletir o historico de preco da venda.

### 9. Consulta agregada de pedidos com cliente e funcionario

Objetivo: visualizar pedidos com seus respectivos cliente e funcionario.

```sql
SELECT
  p.id AS id_pedido,
  c.nome AS cliente,
  f.nome AS funcionario,
  p.data,
  p.total
FROM pedidos p
INNER JOIN clientes c ON c.id = p.id_cliente
INNER JOIN funcionarios f ON f.id = p.id_funcionario
ORDER BY p.data DESC;
```

Explicacao: esta consulta esta presente no arquivo [query.sql](/home/enoch/projects/PoliPadaria/schema/query.sql) do repositorio e funciona como exemplo oficial de `JOIN` entre tabelas principais.

## Consultas REST

## Endpoints basicos

### `GET /api/health`

Objetivo: verificar se o backend esta ativo.

Metodo HTTP: `GET`

Rota: `/api/health`

Parametros relevantes: nao possui.

Exemplo de requisicao:

```bash
curl http://localhost:4000/api/health
```

Exemplo de resposta resumida:

```json
{ "ok": true }
```

### `GET /api/state`

Objetivo: obter um panorama completo do estado atual das tabelas conhecidas pela aplicacao.

Metodo HTTP: `GET`

Rota: `/api/state`

Parametros relevantes: nao possui.

Exemplo de requisicao:

```bash
curl http://localhost:4000/api/state
```

Exemplo de resposta resumida: objeto JSON com chaves `clientes`, `funcionarios`, `produtos`, `ingredientes`, `pedidos`, `itensPedido` e `produtosIngredientes`, cada uma contendo um array de registros.

### `GET /api/:collection`

Objetivo: listar registros de uma colecao usando o CRUD generico.

Metodo HTTP: `GET`

Rota: `/api/:collection`

Colecoes validas: `clientes`, `funcionarios`, `pedidos`, `itensPedido`, `produtos`, `produtosIngredientes`, `ingredientes`.

Parametros relevantes:

- filtros por igualdade, como `categoria=Panificacao` ou `id_cliente=1`;
- filtros de busca parcial em texto por sufixo `_like`, como `nome_like=Pao`;
- filtros numericos por faixa com `_min` e `_max`, como `valor_min=5&valor_max=20`;
- filtros de data com `_from` e `_to`, como `data_from=2026-04-01&data_to=2026-04-30`;
- ordenacao com `sort` e `order`;
- paginacao com `limit` e `offset`.

Exemplo de requisicao:

```bash
curl "http://localhost:4000/api/produtos?categoria=Panificacao&sort=nome&order=asc&limit=5"
```

Exemplo de resposta resumida:

```json
[
  { "id": 10, "nome": "Baguete Tradicional", "valor": 7.2, "categoria": "Panificacao" }
]
```

### `POST /api/:collection`

Objetivo: criar um registro em qualquer colecao suportada pelo CRUD generico.

Metodo HTTP: `POST`

Rota: `/api/:collection`

Parametros relevantes: corpo JSON com as colunas permitidas para a entidade.

Exemplo de requisicao:

```bash
curl -X POST "http://localhost:4000/api/produtos" \
  -H "Content-Type: application/json" \
  -d '{"nome":"Produto Exemplo","valor":9.9,"categoria":"Panificacao"}'
```

Resposta: retorna o registro criado com status `201`.

### `PUT /api/:collection/:key`

Objetivo: atualizar integralmente um registro existente.

Metodo HTTP: `PUT`

Rota: `/api/:collection/:key`

Parametros relevantes:

- `:key`: chave primaria simples ou composta;
- corpo JSON com todos os campos atualizaveis da entidade.

Exemplo de chave composta: em `itensPedido`, usa-se o formato `id_pedido::id_produto`, como `/api/itensPedido/1::9`.

### `PATCH /api/:collection/:key`

Objetivo: atualizar parcialmente um registro existente.

Metodo HTTP: `PATCH`

Rota: `/api/:collection/:key`

Parametros relevantes: `:key` e corpo JSON contendo apenas os campos alterados.

### `DELETE /api/:collection/:key`

Objetivo: remover um registro da colecao indicada.

Metodo HTTP: `DELETE`

Rota: `/api/:collection/:key`

Exemplo de resposta resumida:

```json
{
  "deleted": true,
  "key": "1::9",
  "collection": "itensPedido"
}
```

## Endpoints de dominio

### `GET /api/pedidos/:id/itens`

Objetivo: listar os itens de um pedido com dados do produto.

Metodo HTTP: `GET`

Rota: `/api/pedidos/:id/itens`

Parametros relevantes: `:id` corresponde ao identificador do pedido.

Exemplo de requisicao:

```bash
curl "http://localhost:4000/api/pedidos/1/itens"
```

Exemplo de resposta resumida:

```json
[
  {
    "id_pedido": 1,
    "id_produto": 9,
    "nome_produto": "Bolo De Chocolate Inteiro",
    "quantidade": 2,
    "valor_unitario": 28.4,
    "valor_atual": 28.4,
    "subtotal": 56.8
  }
]
```

### `GET /api/produtos/:id/ingredientes`

Objetivo: listar a composicao de um produto.

Metodo HTTP: `GET`

Rota: `/api/produtos/:id/ingredientes`

Parametros relevantes: `:id` corresponde ao identificador do produto.

Exemplo de requisicao:

```bash
curl "http://localhost:4000/api/produtos/1/ingredientes"
```

Exemplo de resposta resumida:

```json
[
  {
    "id_produto": 1,
    "id_ingrediente": 1,
    "nome_ingrediente": "Farinha de Trigo",
    "unidade": "kg",
    "quantidade_usada": 0.12
  }
]
```

### `GET /api/clientes/:id/pedidos`

Objetivo: consultar o historico de pedidos de um cliente.

Metodo HTTP: `GET`

Rota: `/api/clientes/:id/pedidos`

Parametros relevantes: `:id` corresponde ao identificador do cliente.

Exemplo de requisicao:

```bash
curl "http://localhost:4000/api/clientes/1/pedidos"
```

Exemplo de resposta resumida: array de objetos da tabela `pedidos`, ordenados por `data DESC, id DESC`.

### `GET /api/ingredientes/baixo-estoque`

Objetivo: listar ingredientes com estoque abaixo ou igual a um limite.

Metodo HTTP: `GET`

Rota: `/api/ingredientes/baixo-estoque`

Parametros relevantes: query string opcional `max`, cujo valor padrao e `10`.

Exemplo de requisicao:

```bash
curl "http://localhost:4000/api/ingredientes/baixo-estoque?max=15"
```

Exemplo de resposta resumida:

```json
[
  { "id": 7, "nome": "Manteiga", "unidade": "kg", "quantidade_estoque": 14.57 }
]
```

### `POST /api/pedidos-com-itens`

Objetivo: criar um pedido com seus itens em uma unica transacao.

Metodo HTTP: `POST`

Rota: `/api/pedidos-com-itens`

Parametros relevantes:

- `data`: data e hora do pedido;
- `id_cliente`: cliente existente;
- `id_funcionario`: funcionario existente;
- `itens`: array com objetos contendo `id_produto` e `quantidade`.

Observacoes de comportamento:

- o `total` do pedido e calculado automaticamente;
- o backend verifica se cliente, funcionario e produtos existem;
- o mesmo produto nao pode aparecer repetido no array `itens`;
- `valor_unitario` e preenchido com o preco atual do produto no momento da criacao.

Exemplo de requisicao:

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

Exemplo de resposta resumida:

```json
{
  "id": 151,
  "data": "2026-04-09T10:30",
  "total": 13.73,
  "id_cliente": 2,
  "id_funcionario": 1,
  "itens": [
    {
      "id_pedido": 151,
      "id_produto": 3,
      "nome_produto": "Bolo De Cenoura Com Cobertura",
      "quantidade": 2,
      "valor_unitario": 31.83,
      "valor_atual": 31.83,
      "subtotal": 63.66
    }
  ]
}
```

Observacao: os valores exatos da resposta variam conforme o conteudo atual da base. O formato acima reflete a estrutura de retorno real da implementacao.

### `POST /api/sql`

Objetivo: executar uma instrucao SQL diretamente no banco para fins auxiliares, administrativos ou de teste.

Metodo HTTP: `POST`

Rota: `/api/sql`

Parametros relevantes: corpo JSON com a chave `query`.

Regras relevantes:

- apenas uma instrucao SQL por chamada;
- instrucoes de leitura retornam `mode: "read"` e `rows`;
- instrucoes de escrita retornam `mode: "write"` e metadados de alteracao;
- comandos com erro sintatico retornam `400`;
- violacoes de restricao retornam `409`.

Exemplo de requisicao:

```bash
curl -X POST "http://localhost:4000/api/sql" \
  -H "Content-Type: application/json" \
  -d '{"query":"SELECT COUNT(*) AS total_clientes FROM clientes"}'
```

Exemplo de resposta resumida:

```json
{
  "mode": "read",
  "rowCount": 1,
  "rows": [
    { "total_clientes": 30 }
  ]
}
```

## Observacao sobre filtros e validacao

Os filtros aceitos pelo CRUD generico nao sao livres. Eles sao validados com base no metadata de cada tabela. Isso significa que a API aceita somente colunas previamente marcadas como filtraveis e ordenaveis no backend. Essa decisao reduz a possibilidade de consultas inconsistentes e mantem aderencia entre o modelo logico e a interface HTTP.
