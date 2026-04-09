const TABLE_DEFINITIONS = {
  clientes: {
    collection: "clientes",
    pk: ["id"],
    autoId: true,
    createSql:
      "CREATE TABLE IF NOT EXISTS clientes (id INTEGER PRIMARY KEY AUTOINCREMENT, nome TEXT NOT NULL, cpf TEXT NOT NULL UNIQUE);",
    insertColumns: ["nome", "cpf"],
    updateColumns: ["nome", "cpf"],
    seedRows: [
      { id: 1, nome: "Maria Silva", cpf: "111.111.111-11" },
      { id: 2, nome: "Joao Souza", cpf: "222.222.222-22" },
    ],
  },
  funcionarios: {
    collection: "funcionarios",
    pk: ["id"],
    autoId: true,
    createSql:
      "CREATE TABLE IF NOT EXISTS funcionarios (id INTEGER PRIMARY KEY AUTOINCREMENT, nome TEXT NOT NULL);",
    insertColumns: ["nome"],
    updateColumns: ["nome"],
    seedRows: [
      { id: 1, nome: "Ana Costa" },
      { id: 2, nome: "Carlos Lima" },
    ],
  },
  pedidos: {
    collection: "pedidos",
    pk: ["id"],
    autoId: true,
    createSql:
      "CREATE TABLE IF NOT EXISTS pedidos (id INTEGER PRIMARY KEY AUTOINCREMENT, data TEXT NOT NULL, total REAL NOT NULL, id_cliente INTEGER NOT NULL, id_funcionario INTEGER NOT NULL, FOREIGN KEY (id_cliente) REFERENCES clientes(id) ON UPDATE CASCADE ON DELETE RESTRICT, FOREIGN KEY (id_funcionario) REFERENCES funcionarios(id) ON UPDATE CASCADE ON DELETE RESTRICT);",
    insertColumns: ["data", "total", "id_cliente", "id_funcionario"],
    updateColumns: ["data", "total", "id_cliente", "id_funcionario"],
    seedRows: [
      {
        id: 1,
        data: "2026-04-08T09:00",
        total: 24.5,
        id_cliente: 1,
        id_funcionario: 2,
      },
    ],
  },
  itensPedido: {
    collection: "itensPedido",
    pk: ["id_pedido", "id_produto"],
    autoId: false,
    createSql:
      "CREATE TABLE IF NOT EXISTS itensPedido (id_pedido INTEGER NOT NULL, id_produto INTEGER NOT NULL, quantidade REAL NOT NULL, PRIMARY KEY (id_pedido, id_produto), FOREIGN KEY (id_pedido) REFERENCES pedidos(id) ON UPDATE CASCADE ON DELETE RESTRICT, FOREIGN KEY (id_produto) REFERENCES produtos(id) ON UPDATE CASCADE ON DELETE RESTRICT);",
    insertColumns: ["id_pedido", "id_produto", "quantidade"],
    updateColumns: ["id_pedido", "id_produto", "quantidade"],
    seedRows: [{ quantidade: 2, id_pedido: 1, id_produto: 1 }],
  },
  produtos: {
    collection: "produtos",
    pk: ["id"],
    autoId: true,
    createSql:
      "CREATE TABLE IF NOT EXISTS produtos (id INTEGER PRIMARY KEY AUTOINCREMENT, nome TEXT NOT NULL, valor REAL NOT NULL, categoria TEXT NOT NULL);",
    insertColumns: ["nome", "valor", "categoria"],
    updateColumns: ["nome", "valor", "categoria"],
    seedRows: [
      { id: 1, nome: "Pao Frances", valor: 0.9, categoria: "Panificacao" },
      { id: 2, nome: "Bolo de Cenoura", valor: 28.0, categoria: "Confeitaria" },
    ],
  },
  produtosIngredientes: {
    collection: "produtosIngredientes",
    pk: ["id_produto", "id_ingrediente"],
    autoId: false,
    createSql:
      "CREATE TABLE IF NOT EXISTS produtosIngredientes (id_produto INTEGER NOT NULL, id_ingrediente INTEGER NOT NULL, quantidade REAL NOT NULL, PRIMARY KEY (id_produto, id_ingrediente), FOREIGN KEY (id_produto) REFERENCES produtos(id) ON UPDATE CASCADE ON DELETE RESTRICT, FOREIGN KEY (id_ingrediente) REFERENCES ingredientes(id) ON UPDATE CASCADE ON DELETE RESTRICT);",
    insertColumns: ["id_produto", "id_ingrediente", "quantidade"],
    updateColumns: ["id_produto", "id_ingrediente", "quantidade"],
    seedRows: [
      { quantidade: 0.2, id_ingrediente: 1, id_produto: 1 },
      { quantidade: 0.35, id_ingrediente: 2, id_produto: 2 },
    ],
  },
  ingredientes: {
    collection: "ingredientes",
    pk: ["id"],
    autoId: true,
    createSql:
      "CREATE TABLE IF NOT EXISTS ingredientes (id INTEGER PRIMARY KEY AUTOINCREMENT, nome TEXT NOT NULL, unidade TEXT NOT NULL, quantidade_estoque INTEGER NOT NULL CHECK (quantidade_estoque >= 0));",
    insertColumns: ["nome", "unidade", "quantidade_estoque"],
    updateColumns: ["nome", "unidade", "quantidade_estoque"],
    seedRows: [
      { id: 1, nome: "Farinha", unidade: "kg", quantidade_estoque: 50 },
      { id: 2, nome: "Acucar", unidade: "kg", quantidade_estoque: 25 },
    ],
  },
};

const SEED_ORDER = [
  "clientes",
  "funcionarios",
  "produtos",
  "ingredientes",
  "pedidos",
  "itensPedido",
  "produtosIngredientes",
];

module.exports = {
  SEED_ORDER,
  TABLE_DEFINITIONS,
};