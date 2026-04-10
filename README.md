# PoliPadaria
Projeto de Banco de Dados para uma padaria ficticia.



## Integrantes
André Akira Horigoshi Maximino - 15493801
Diego Fontes de Avila - 15447910
João Victor Costa Teodoro - 15463850
Matheus Davi Leão - 15520593
Sophia Soares Mariano - 15511213


## Link para o Diagrama Entidade Relacionamento
[Diagrama E-R](https://drive.google.com/file/d/1Cgvp6L7C3dfc8NdDjfqEhgIyELqzkY4O/view?usp=sharing)

## Documentacao

- [Frontend](polipadaria-frontend/README.md)
- [Backend](backend/README.md)
- [Documentacao academica consolidada](docs/README.md)
- [Descricao do projeto](docs/descricao_projeto.md)
- [Modelo de dados](docs/modelo_dados.md)
- [Consultas](docs/consultas.md)
- [Geracao de dados mock](docs/geracao_mock.md)
- [Relatorio de atividades](docs/relatorio_atividades.md)
- [Manual do usuario](docs/manual_usuario.md)

## Execucao local

Um comando (frontend + backend):

```bash
npm install
npm run dev
```

Instalacao inicial dos subprojetos (opcional):

```bash
npm run install:all
```

Backend SQLite:

```bash
cd backend
npm install
npm start
```

Frontend React:

```bash
cd polipadaria-frontend
npm install
npm start
```

O frontend consome a API em `http://localhost:4000/api` por padrao. O arquivo do banco fica em `backend/data/polipadaria.sqlite3`.

## Resumo do backend

O backend foi evoluido para continuar simples, mas agora com:

- validacao de payload antes do SQLite
- filtros, ordenacao e paginacao no CRUD generico
- endpoints de dominio para pedidos, ingredientes e composicao de produtos
- criacao transacional de pedido com itens em `POST /api/pedidos-com-itens`
- `valor_unitario` em `itensPedido` para preservar historico de preco
- camada de insights operacionais em `/api/insights`
- dashboard no frontend para resumo, vendas, clientes, produtos e estoque critico

Exemplos:

```bash
curl "http://localhost:4000/api/produtos?categoria=Panificacao"
curl "http://localhost:4000/api/produtos?nome_like=Pao&sort=valor&order=asc"
curl "http://localhost:4000/api/ingredientes/baixo-estoque?max=10"
curl "http://localhost:4000/api/produtos/1/ingredientes"
curl "http://localhost:4000/api/insights/resumo"
curl "http://localhost:4000/api/insights/produtos-mais-vendidos?limit=5"
```

Detalhes completos da API estao em [backend/README.md](backend/README.md).
