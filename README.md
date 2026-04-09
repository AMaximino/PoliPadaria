# PoliPadaria
Projeto de Banco de Dados para uma padaria fictícia.



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
