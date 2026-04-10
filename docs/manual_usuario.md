# Manual do Usuario

## Objetivo do sistema

O PoliPadaria e um sistema academico voltado ao cadastro e consulta de dados de uma padaria, com enfase em modelagem relacional e operacao via API REST. O backend permite cadastrar clientes, funcionarios, produtos, ingredientes e pedidos, alem de consultar relacoes entre essas entidades e executar consultas auxiliares no banco SQLite.

## Requisitos para execucao

Para executar o projeto localmente, recomenda-se ter instalado:

- Node.js em versao compativel com o modulo `node:sqlite` usado pelo backend;
- npm;
- sistema operacional com permissao de escrita no diretorio `backend/data`.

O backend usa SQLite embarcado, portanto nao e necessario instalar um servidor de banco de dados separado.

## Instalacao

Na raiz do repositorio, execute:

```bash
npm install
```

Caso deseje instalar tambem as dependencias dos subprojetos explicitamente, use:

```bash
npm run install:all
```

Para instalar apenas o backend:

```bash
cd backend
npm install
```

## Como iniciar o backend

Na pasta `backend`, execute:

```bash
npm start
```

Por padrao, a API sera iniciada em:

```text
http://localhost:4000
```

Logo, a URL base das rotas da aplicacao sera:

```text
http://localhost:4000/api
```

O arquivo de banco SQLite sera criado ou reutilizado em:

```text
backend/data/polipadaria.sqlite3
```

Na raiz do projeto, tambem e possivel iniciar frontend e backend juntos com:

```bash
npm run dev
```

## Preparacao do banco

Ao iniciar o backend, o sistema executa automaticamente a inicializacao do schema. Se as tabelas ainda nao existirem, elas sao criadas. Se o banco estiver vazio, o backend insere um conjunto minimo de seeds iniciais. Esse seed basico inclui clientes, funcionarios, produtos, ingredientes, um pedido inicial, seus itens e a composicao dos produtos.

Se houver uma base local antiga com schema anterior, o backend tenta reconstruir o schema para a versao atual preservando os dados conhecidos do projeto.

## Como gerar dados mock

Para gerar massa de dados automatica no backend, use:

```bash
npm run seed:mock -- --size=medium --seed=42 --days=90 --reset
```

Ou, diretamente:

```bash
node scripts/seedMockData.js --size=medium --seed=42 --days=90 --reset
```

Parametros disponiveis:

- `--size`: `small`, `medium` ou `large`;
- `--seed`: semente pseudoaleatoria reprodutivel;
- `--days`: quantidade de dias para distribuir os pedidos;
- `--reset`: remove o banco atual e recria a base antes da insercao.

Exemplos:

```bash
npm run seed:mock -- --size=small --seed=7 --days=30 --reset
npm run seed:mock -- --size=medium --seed=42 --days=90 --reset
npm run seed:mock -- --size=large --seed=2026 --days=180 --reset
```

Sem `--reset`, os novos registros sao adicionados ao banco existente.

## Como acessar a API

### Verificacao rapida de funcionamento

```bash
curl http://localhost:4000/api/health
```

Resposta esperada:

```json
{ "ok": true }
```

### Estado geral da base

```bash
curl http://localhost:4000/api/state
```

Essa rota retorna um objeto JSON com todas as colecoes conhecidas pela aplicacao.

## Teste dos endpoints principais

### Listar produtos

```bash
curl "http://localhost:4000/api/produtos"
```

### Filtrar produtos por categoria

```bash
curl "http://localhost:4000/api/produtos?categoria=Panificacao"
```

### Buscar produtos por nome parcial

```bash
curl "http://localhost:4000/api/produtos?nome_like=Pao&sort=valor&order=asc"
```

### Listar ingredientes com estoque baixo

```bash
curl "http://localhost:4000/api/ingredientes/baixo-estoque?max=10"
```

### Consultar os itens de um pedido

```bash
curl "http://localhost:4000/api/pedidos/1/itens"
```

### Consultar ingredientes de um produto

```bash
curl "http://localhost:4000/api/produtos/1/ingredientes"
```

### Consultar pedidos de um cliente

```bash
curl "http://localhost:4000/api/clientes/1/pedidos"
```

### Criar um novo produto

```bash
curl -X POST "http://localhost:4000/api/produtos" \
  -H "Content-Type: application/json" \
  -d '{"nome":"Produto Exemplo","valor":9.9,"categoria":"Panificacao"}'
```

### Criar pedido com itens

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

## Uso de filtros, ordenacao e paginacao

O endpoint `GET /api/:collection` aceita filtros validados pelo backend. Os padroes disponiveis sao:

- igualdade: `campo=valor`
- busca textual parcial: `campo_like=valor`
- faixa numerica: `campo_min=valor` e `campo_max=valor`
- faixa de data: `campo_from=AAAA-MM-DD` e `campo_to=AAAA-MM-DD`
- ordenacao: `sort=campo&order=asc|desc`
- paginacao: `limit=10&offset=20`

Exemplos:

```bash
curl "http://localhost:4000/api/pedidos?id_cliente=1&data_from=2026-04-01&data_to=2026-04-30"
curl "http://localhost:4000/api/ingredientes?quantidade_estoque_max=10&sort=quantidade_estoque&order=asc"
curl "http://localhost:4000/api/produtos?limit=10&offset=20"
```

Se um filtro ou coluna de ordenacao nao forem permitidos para aquela colecao, a API retornara erro `400`.

## Chaves primarias compostas

As tabelas `itensPedido` e `produtosIngredientes` usam chave primaria composta. Nesses casos, o parametro `:key` das rotas de atualizacao e exclusao deve usar o formato:

```text
valor1::valor2
```

Exemplos:

```bash
curl -X DELETE "http://localhost:4000/api/itensPedido/1::9"
curl -X PATCH "http://localhost:4000/api/produtosIngredientes/2::4" \
  -H "Content-Type: application/json" \
  -d '{"quantidade":0.25}'
```

## Como interpretar as respostas

As respostas da API sao sempre em JSON. Em operacoes de listagem, o retorno e um array de objetos. Em consultas de dominio, o retorno pode ser um array enriquecido com dados de `JOIN`. Em criacoes ou atualizacoes, a API devolve o registro persistido. Em exclusoes, devolve um objeto simples com a confirmacao da remocao.

No endpoint `/api/sql`, as respostas assumem dois formatos:

- consultas de leitura retornam `mode`, `rowCount` e `rows`;
- consultas de escrita retornam `mode`, `changes` e `lastInsertRowid`.

## Uso do endpoint `/api/sql`

O endpoint `/api/sql` deve ser entendido como recurso auxiliar e administrativo. Ele existe para facilitar testes, inspecao do banco e demonstracao da disciplina. Nao representa a forma principal de uso funcional do sistema.

Exemplo de leitura:

```bash
curl -X POST "http://localhost:4000/api/sql" \
  -H "Content-Type: application/json" \
  -d '{"query":"SELECT COUNT(*) AS total_clientes FROM clientes"}'
```

Exemplo de escrita:

```bash
curl -X POST "http://localhost:4000/api/sql" \
  -H "Content-Type: application/json" \
  -d '{"query":"UPDATE produtos SET valor = 12.5 WHERE id = 1"}'
```

Restricoes importantes:

- apenas uma instrucao SQL por chamada;
- SQL com erro sintatico retorna `400`;
- violacoes de integridade retornam `409`.

## Principais erros e interpretacao

### `400 Bad Request`

Indica erro de entrada ou de comando. Pode ocorrer por payload invalido, filtro nao permitido, chave primaria malformada, data invalida ou SQL incorreto no endpoint `/api/sql`.

### `404 Not Found`

Indica entidade inexistente ou registro nao encontrado. Ocorre, por exemplo, quando a colecao informada nao faz parte do modelo ou quando o identificador nao corresponde a nenhum registro.

### `409 Conflict`

Indica violacao de restricao do banco. Os casos mais comuns sao duplicidade em campo unico, violacao de chave estrangeira e quebra de regra `CHECK`.

### `500 Internal Server Error`

Indica erro inesperado no backend. Em geral, deve ser investigado com base no terminal onde o servidor foi iniciado.

## Encerramento

Com os comandos acima, e possivel instalar, iniciar, popular e testar o backend do PoliPadaria integralmente. Para uso academico, recomenda-se manter o `README.md` do projeto e a pasta `docs/` como referencia principal de consulta.
