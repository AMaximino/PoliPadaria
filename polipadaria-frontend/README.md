# Frontend PoliPadaria

Aplicacao React para gerenciamento de entidades da PoliPadaria com abas por entidade, CRUD completo, filtros, ordenacao, paginacao e validacoes de formulario.

## Tecnologias

- React (Create React App)
- Hooks
- Testing Library + Jest

## Estrutura

```text
polipadaria-frontend/
	src/
		components/
			EntityTabs.js
			EntityToolbar.js
			EntityForm.js
			EntityTable.js
			PaginationControls.js
		constants/
			dataModel.js
		hooks/
			usePoliPadariaCrud.js
		utils/
			api.js
			entityLogic.js
			formatters.js
			validators.js
		App.js
		App.css
```

## Como executar

No diretorio polipadaria-frontend:

```bash
npm install
npm start
```

Frontend em:

```text
http://localhost:3000
```

## Integracao com backend

O frontend chama a API em `src/utils/api.js`.

Base URL padrao:

```text
http://localhost:4000/api
```

Para alterar a URL da API, use variavel de ambiente:

```bash
REACT_APP_API_URL=http://localhost:5000/api npm start
```

## Arquitetura

### 1) Composicao da tela

- `App.js` monta a interface principal.
- O estado e as regras de negocio ficam centralizados no hook `usePoliPadariaCrud`.
- Os componentes recebem estado e handlers via props.

### 2) Modelo de dados

`src/constants/dataModel.js` define:

- entidades (campos, tipos, PK e FK)
- ordem das abas
- regras de bloqueio de exclusao no frontend
- base local de fallback inicial (`BASE_DB`)

### 3) Camada de API

`src/utils/api.js` encapsula chamadas HTTP:

- `fetchState()`
- `createRecord(collection, body)`
- `updateRecord(collection, key, body)`
- `deleteRecord(collection, key)`
- `executeSqlQuery(query)`

### 4) Hook principal

`src/hooks/usePoliPadariaCrud.js` concentra:

- bootstrap inicial de dados via API
- controle de aba ativa
- estado de formulario e edicao
- validacao por campo
- filtro global e filtro avancado
- ordenacao
- paginacao
- operacoes CRUD (create/update/delete)

## Funcionalidades

- CRUD por entidade
- Validacoes de obrigatoriedade e tipos
- Validacao e mascara de CPF
- Formatacao de moeda BRL em campos monetarios
- Validacao de data/hora (`datetime-local`)
- Validacao de FK contra dados carregados
- Filtro global por texto
- Filtro avancado por campo com operadores
- Ordenacao asc/desc por coluna
- Paginacao com tamanho de pagina configuravel
- Aba SQL para executar queries SQL puras

## Aba SQL

A aba `SQL` permite executar querys diretamente no SQLite via endpoint `POST /api/sql`.

Comportamento:

- Querys de leitura mostram tabela dinamica de resultado.
- Querys de escrita mostram quantidade de linhas afetadas e ultimo ID inserido (quando houver).
- O console aceita uma instrucao por execucao.

## Chave primaria composta

Quando a entidade possui PK composta, o frontend gera a chave no formato:

```text
valor1::valor2
```

Esse formato e enviado para endpoints de update/delete.

## Testes

Executar testes:

```bash
npm test -- --watchAll=false
```

Build de producao:

```bash
npm run build
```

## Fluxo de inicializacao

1. O hook inicializa com `BASE_DB`.
2. Em seguida, tenta carregar snapshot real do backend com `fetchState()`.
3. Se houver falha de comunicacao, o frontend exibe mensagem de erro.

## Troubleshooting

- Erro de CORS: confirme se o backend esta em execucao e com CORS habilitado.
- Porta 3000 ocupada: finalize o processo atual ou rode em outra porta.
- API fora do ar: verifique `REACT_APP_API_URL` e o endpoint `/api/health` no backend.
