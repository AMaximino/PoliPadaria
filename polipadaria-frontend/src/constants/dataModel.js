export const STORAGE_KEY = "polipadaria-db-v1";

export const ENTITY_CONFIG = {
  dashboard: {
    title: "Insights",
    collection: "__insights",
    pk: ["id"],
    fields: [{ name: "id", label: "ID", type: "number", readOnly: true }],
  },
  cliente: {
    title: "Cliente",
    collection: "clientes",
    pk: ["id"],
    autoId: true,
    fields: [
      { name: "id", label: "ID Cliente", type: "number", readOnly: true },
      { name: "nome", label: "Nome Cliente", type: "text", required: true },
      {
        name: "cpf",
        label: "CPF Cliente",
        type: "text",
        mask: "cpf",
        required: true,
      },
    ],
  },
  funcionario: {
    title: "Funcionario",
    collection: "funcionarios",
    pk: ["id"],
    autoId: true,
    fields: [
      { name: "id", label: "ID Funcionario", type: "number", readOnly: true },
      {
        name: "nome",
        label: "Nome Funcionario",
        type: "text",
        required: true,
      },
    ],
  },
  pedido: {
    title: "Pedido",
    collection: "pedidos",
    pk: ["id"],
    autoId: true,
    fields: [
      { name: "id", label: "ID Pedido", type: "number", readOnly: true },
      {
        name: "data",
        label: "Data",
        type: "datetime-local",
        required: true,
      },
      {
        name: "total",
        label: "Total",
        type: "text",
        mask: "currency",
        display: "currency",
        required: true,
      },
      {
        name: "id_cliente",
        label: "ID Cliente (FK)",
        type: "fk",
        ref: "clientes",
        required: true,
      },
      {
        name: "id_funcionario",
        label: "ID Funcionario (FK)",
        type: "fk",
        ref: "funcionarios",
        required: true,
      },
    ],
  },
  item_pedido: {
    title: "Item_Pedido",
    collection: "itensPedido",
    pk: ["id_pedido", "id_produto"],
    fields: [
      {
        name: "quantidade",
        label: "Quantidade",
        type: "number",
        min: 0,
        step: "0.01",
        required: true,
      },
      {
        name: "id_pedido",
        label: "ID Pedido (FK)",
        type: "fk",
        ref: "pedidos",
        required: true,
      },
      {
        name: "id_produto",
        label: "ID Produto (FK)",
        type: "fk",
        ref: "produtos",
        required: true,
      },
    ],
  },
  produto: {
    title: "Produto",
    collection: "produtos",
    pk: ["id"],
    autoId: true,
    fields: [
      { name: "id", label: "ID Produto", type: "number", readOnly: true },
      { name: "nome", label: "Nome", type: "text", required: true },
      {
        name: "valor",
        label: "Valor",
        type: "text",
        mask: "currency",
        display: "currency",
        required: true,
      },
      {
        name: "categoria",
        label: "Categoria",
        type: "text",
        required: true,
      },
    ],
  },
  produto_ingrediente: {
    title: "Produto_Ingrediente",
    collection: "produtosIngredientes",
    pk: ["id_produto", "id_ingrediente"],
    fields: [
      {
        name: "quantidade",
        label: "Quantidade",
        type: "number",
        min: 0,
        step: "0.01",
        required: true,
      },
      {
        name: "id_ingrediente",
        label: "ID Ingrediente (FK)",
        type: "fk",
        ref: "ingredientes",
        required: true,
      },
      {
        name: "id_produto",
        label: "ID Produto (FK)",
        type: "fk",
        ref: "produtos",
        required: true,
      },
    ],
  },
  ingrediente: {
    title: "Ingrediente",
    collection: "ingredientes",
    pk: ["id"],
    autoId: true,
    fields: [
      { name: "id", label: "ID Ingrediente", type: "number", readOnly: true },
      { name: "nome", label: "Nome", type: "text", required: true },
      { name: "unidade", label: "Unidade", type: "text", required: true },
      {
        name: "quantidade_estoque",
        label: "Quantidade Estoque",
        type: "number",
        min: 0,
        required: true,
      },
    ],
  },
  sql_console: {
    title: "SQL",
    collection: "__sqlConsole",
    pk: ["id"],
    fields: [{ name: "id", label: "ID", type: "number", readOnly: true }],
  },
};

export const TAB_ORDER = [
  "dashboard",
  "cliente",
  "funcionario",
  "pedido",
  "item_pedido",
  "produto",
  "produto_ingrediente",
  "ingrediente",
  "sql_console",
];

export const DELETE_RULES = {
  clientes: [
    {
      sourceCollection: "pedidos",
      sourceField: "id_cliente",
      label: "Pedido",
    },
  ],
  funcionarios: [
    {
      sourceCollection: "pedidos",
      sourceField: "id_funcionario",
      label: "Pedido",
    },
  ],
  pedidos: [
    {
      sourceCollection: "itensPedido",
      sourceField: "id_pedido",
      label: "Item_Pedido",
    },
  ],
  produtos: [
    {
      sourceCollection: "itensPedido",
      sourceField: "id_produto",
      label: "Item_Pedido",
    },
    {
      sourceCollection: "produtosIngredientes",
      sourceField: "id_produto",
      label: "Produto_Ingrediente",
    },
  ],
  ingredientes: [
    {
      sourceCollection: "produtosIngredientes",
      sourceField: "id_ingrediente",
      label: "Produto_Ingrediente",
    },
  ],
};

export const BASE_DB = {
  clientes: [
    { id: 1, nome: "Maria Silva", cpf: "111.111.111-11" },
    { id: 2, nome: "Joao Souza", cpf: "222.222.222-22" },
  ],
  funcionarios: [
    { id: 1, nome: "Ana Costa" },
    { id: 2, nome: "Carlos Lima" },
  ],
  pedidos: [
    {
      id: 1,
      data: "2026-04-08T09:00",
      total: 24.5,
      id_cliente: 1,
      id_funcionario: 2,
    },
  ],
  itensPedido: [{ quantidade: 2, id_pedido: 1, id_produto: 1 }],
  produtos: [
    { id: 1, nome: "Pao Frances", valor: 0.9, categoria: "Panificacao" },
    { id: 2, nome: "Bolo de Cenoura", valor: 28.0, categoria: "Confeitaria" },
  ],
  produtosIngredientes: [
    { quantidade: 0.2, id_ingrediente: 1, id_produto: 1 },
    { quantidade: 0.35, id_ingrediente: 2, id_produto: 2 },
  ],
  ingredientes: [
    { id: 1, nome: "Farinha", unidade: "kg", quantidade_estoque: 50 },
    { id: 2, nome: "Acucar", unidade: "kg", quantidade_estoque: 25 },
  ],
};
