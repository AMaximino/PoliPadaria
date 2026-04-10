const TABLE_DEFINITIONS = {
  clientes: {
    collection: "clientes",
    pk: ["id"],
    autoId: true,
    insertColumns: ["nome", "cpf"],
    updateColumns: ["nome", "cpf"],
    defaultSort: { column: "id", order: "asc" },
    fields: {
      id: { type: "integer", generated: true, sortable: true, filterable: true },
      nome: {
        type: "text",
        required: true,
        allowEmpty: false,
        sortable: true,
        filterable: true,
        allowLike: true,
      },
      cpf: {
        type: "text",
        required: true,
        allowEmpty: false,
        sortable: true,
        filterable: true,
      },
    },
    createSql: `
      CREATE TABLE IF NOT EXISTS clientes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nome TEXT NOT NULL,
        cpf TEXT NOT NULL UNIQUE
      );
    `,
    seedRows: [
      { id: 1, nome: "Maria Silva", cpf: "111.111.111-11" },
      { id: 2, nome: "Joao Souza", cpf: "222.222.222-22" },
    ],
  },
  funcionarios: {
    collection: "funcionarios",
    pk: ["id"],
    autoId: true,
    insertColumns: ["nome"],
    updateColumns: ["nome"],
    defaultSort: { column: "id", order: "asc" },
    fields: {
      id: { type: "integer", generated: true, sortable: true, filterable: true },
      nome: {
        type: "text",
        required: true,
        allowEmpty: false,
        sortable: true,
        filterable: true,
        allowLike: true,
      },
    },
    createSql: `
      CREATE TABLE IF NOT EXISTS funcionarios (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nome TEXT NOT NULL
      );
    `,
    seedRows: [
      { id: 1, nome: "Ana Costa" },
      { id: 2, nome: "Carlos Lima" },
    ],
  },
  pedidos: {
    collection: "pedidos",
    pk: ["id"],
    autoId: true,
    insertColumns: ["data", "total", "id_cliente", "id_funcionario"],
    updateColumns: ["data", "total", "id_cliente", "id_funcionario"],
    defaultSort: { column: "data", order: "desc" },
    fields: {
      id: { type: "integer", generated: true, sortable: true, filterable: true },
      data: {
        type: "datetime",
        required: true,
        allowEmpty: false,
        sortable: true,
        filterable: true,
        allowRange: true,
      },
      total: {
        type: "real",
        required: true,
        min: 0,
        sortable: true,
        filterable: true,
        allowRange: true,
      },
      id_cliente: {
        type: "integer",
        required: true,
        sortable: true,
        filterable: true,
        allowRange: true,
        references: { collection: "clientes", field: "id" },
      },
      id_funcionario: {
        type: "integer",
        required: true,
        sortable: true,
        filterable: true,
        allowRange: true,
        references: { collection: "funcionarios", field: "id" },
      },
    },
    createSql: `
      CREATE TABLE IF NOT EXISTS pedidos (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        data TEXT NOT NULL,
        total REAL NOT NULL CHECK (total >= 0),
        id_cliente INTEGER NOT NULL,
        id_funcionario INTEGER NOT NULL,
        FOREIGN KEY (id_cliente) REFERENCES clientes(id) ON UPDATE CASCADE ON DELETE RESTRICT,
        FOREIGN KEY (id_funcionario) REFERENCES funcionarios(id) ON UPDATE CASCADE ON DELETE RESTRICT
      );
    `,
    seedRows: [
      {
        id: 1,
        data: "2026-04-08T09:00",
        total: 29.8,
        id_cliente: 1,
        id_funcionario: 2,
      },
    ],
  },
  itensPedido: {
    collection: "itensPedido",
    pk: ["id_pedido", "id_produto"],
    autoId: false,
    insertColumns: ["id_pedido", "id_produto", "quantidade", "valor_unitario"],
    updateColumns: ["quantidade", "valor_unitario"],
    defaultSort: { column: "id_pedido", order: "asc" },
    fields: {
      id_pedido: {
        type: "integer",
        required: true,
        sortable: true,
        filterable: true,
        allowRange: true,
        references: { collection: "pedidos", field: "id" },
      },
      id_produto: {
        type: "integer",
        required: true,
        sortable: true,
        filterable: true,
        allowRange: true,
        references: { collection: "produtos", field: "id" },
      },
      quantidade: {
        type: "real",
        required: true,
        min: 0.000001,
        sortable: true,
        filterable: true,
        allowRange: true,
      },
      valor_unitario: {
        type: "real",
        required: true,
        min: 0,
        sortable: true,
        filterable: true,
        allowRange: true,
      },
    },
    createSql: `
      CREATE TABLE IF NOT EXISTS itensPedido (
        id_pedido INTEGER NOT NULL,
        id_produto INTEGER NOT NULL,
        quantidade REAL NOT NULL CHECK (quantidade > 0),
        valor_unitario REAL NOT NULL CHECK (valor_unitario >= 0),
        PRIMARY KEY (id_pedido, id_produto),
        FOREIGN KEY (id_pedido) REFERENCES pedidos(id) ON UPDATE CASCADE ON DELETE RESTRICT,
        FOREIGN KEY (id_produto) REFERENCES produtos(id) ON UPDATE CASCADE ON DELETE RESTRICT
      );
    `,
    seedRows: [
      { id_pedido: 1, id_produto: 1, quantidade: 2, valor_unitario: 0.9 },
      { id_pedido: 1, id_produto: 2, quantidade: 1, valor_unitario: 28.0 },
    ],
  },
  produtos: {
    collection: "produtos",
    pk: ["id"],
    autoId: true,
    insertColumns: ["nome", "valor", "categoria"],
    updateColumns: ["nome", "valor", "categoria"],
    defaultSort: { column: "nome", order: "asc" },
    fields: {
      id: { type: "integer", generated: true, sortable: true, filterable: true },
      nome: {
        type: "text",
        required: true,
        allowEmpty: false,
        sortable: true,
        filterable: true,
        allowLike: true,
      },
      valor: {
        type: "real",
        required: true,
        min: 0,
        sortable: true,
        filterable: true,
        allowRange: true,
      },
      categoria: {
        type: "text",
        required: true,
        allowEmpty: false,
        sortable: true,
        filterable: true,
        allowLike: true,
      },
    },
    createSql: `
      CREATE TABLE IF NOT EXISTS produtos (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nome TEXT NOT NULL,
        valor REAL NOT NULL CHECK (valor >= 0),
        categoria TEXT NOT NULL
      );
    `,
    seedRows: [
      { id: 1, nome: "Pao Frances", valor: 0.9, categoria: "Panificacao" },
      { id: 2, nome: "Bolo de Cenoura", valor: 28.0, categoria: "Confeitaria" },
      { id: 3, nome: "Cafe Coado", valor: 5.5, categoria: "Bebidas" },
    ],
  },
  produtosIngredientes: {
    collection: "produtosIngredientes",
    pk: ["id_produto", "id_ingrediente"],
    autoId: false,
    insertColumns: ["id_produto", "id_ingrediente", "quantidade"],
    updateColumns: ["quantidade"],
    defaultSort: { column: "id_produto", order: "asc" },
    fields: {
      id_produto: {
        type: "integer",
        required: true,
        sortable: true,
        filterable: true,
        allowRange: true,
        references: { collection: "produtos", field: "id" },
      },
      id_ingrediente: {
        type: "integer",
        required: true,
        sortable: true,
        filterable: true,
        allowRange: true,
        references: { collection: "ingredientes", field: "id" },
      },
      quantidade: {
        type: "real",
        required: true,
        min: 0.000001,
        sortable: true,
        filterable: true,
        allowRange: true,
      },
    },
    createSql: `
      CREATE TABLE IF NOT EXISTS produtosIngredientes (
        id_produto INTEGER NOT NULL,
        id_ingrediente INTEGER NOT NULL,
        quantidade REAL NOT NULL CHECK (quantidade > 0),
        PRIMARY KEY (id_produto, id_ingrediente),
        FOREIGN KEY (id_produto) REFERENCES produtos(id) ON UPDATE CASCADE ON DELETE RESTRICT,
        FOREIGN KEY (id_ingrediente) REFERENCES ingredientes(id) ON UPDATE CASCADE ON DELETE RESTRICT
      );
    `,
    seedRows: [
      { id_produto: 1, id_ingrediente: 1, quantidade: 0.2 },
      { id_produto: 1, id_ingrediente: 3, quantidade: 0.01 },
      { id_produto: 2, id_ingrediente: 1, quantidade: 0.35 },
      { id_produto: 2, id_ingrediente: 2, quantidade: 0.2 },
      { id_produto: 3, id_ingrediente: 4, quantidade: 0.05 },
    ],
  },
  ingredientes: {
    collection: "ingredientes",
    pk: ["id"],
    autoId: true,
    insertColumns: ["nome", "unidade", "quantidade_estoque"],
    updateColumns: ["nome", "unidade", "quantidade_estoque"],
    defaultSort: { column: "nome", order: "asc" },
    fields: {
      id: { type: "integer", generated: true, sortable: true, filterable: true },
      nome: {
        type: "text",
        required: true,
        allowEmpty: false,
        sortable: true,
        filterable: true,
        allowLike: true,
      },
      unidade: {
        type: "text",
        required: true,
        allowEmpty: false,
        sortable: true,
        filterable: true,
      },
      quantidade_estoque: {
        type: "real",
        required: true,
        min: 0,
        sortable: true,
        filterable: true,
        allowRange: true,
      },
    },
    createSql: `
      CREATE TABLE IF NOT EXISTS ingredientes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nome TEXT NOT NULL,
        unidade TEXT NOT NULL,
        quantidade_estoque REAL NOT NULL CHECK (quantidade_estoque >= 0)
      );
    `,
    seedRows: [
      { id: 1, nome: "Farinha", unidade: "kg", quantidade_estoque: 50 },
      { id: 2, nome: "Acucar", unidade: "kg", quantidade_estoque: 25 },
      { id: 3, nome: "Fermento", unidade: "kg", quantidade_estoque: 8 },
      { id: 4, nome: "Cafe", unidade: "kg", quantidade_estoque: 6 },
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

const TABLE_NAMES = Object.keys(TABLE_DEFINITIONS);

module.exports = {
  SEED_ORDER,
  TABLE_DEFINITIONS,
  TABLE_NAMES,
};
