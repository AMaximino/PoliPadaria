const fs = require("fs");
const path = require("path");
const { DatabaseSync } = require("node:sqlite");
const { SEED_ORDER, TABLE_DEFINITIONS, TABLE_NAMES } = require("./dataModel");
const { BadRequestError, NotFoundError, ValidationError } = require("./errors");
const {
  ensurePlainObject,
  normalizeFieldValue,
  parsePrimaryKey,
  validatePayload,
} = require("./validation");

const CURRENT_SCHEMA_VERSION = 2;
const dataDir = path.join(__dirname, "..", "data");
const dbPath = path.join(dataDir, "polipadaria.sqlite3");
const schemaDir = path.join(__dirname, "..", "..", "schema");
const SCHEMA_TABLE_FILES = [
  "cliente.sql",
  "funcionario.sql",
  "produto.sql",
  "ingrediente.sql",
  "pedido.sql",
  "item_pedido.sql",
  "produto_ingrediente.sql",
];
const SCHEMA_SEED_FILE = "seed.sql";

if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const db = new DatabaseSync(dbPath);

function run(sql, params = []) {
  const statement = db.prepare(sql);
  return statement.run(...params);
}

function all(sql, params = []) {
  const statement = db.prepare(sql);
  return statement.all(...params);
}

function get(sql, params = []) {
  const statement = db.prepare(sql);
  return statement.get(...params);
}

function exec(sql) {
  db.exec(sql);
}

function readSchemaSqlFile(fileName) {
  const filePath = path.join(schemaDir, fileName);
  return fs.readFileSync(filePath, "utf8");
}

function createSchemaFromSqlFiles() {
  for (const fileName of SCHEMA_TABLE_FILES) {
    exec(readSchemaSqlFile(fileName));
  }
}

function seedFromSqlFile() {
  exec(readSchemaSqlFile(SCHEMA_SEED_FILE));
}

function splitColumns(columns) {
  return columns.join(", ");
}

function buildWhereClause(columns) {
  return columns.map((field) => `${field} = ?`).join(" AND ");
}

function buildInsertStatement(tableName, columns) {
  const placeholders = columns.map(() => "?").join(", ");
  return `INSERT INTO ${tableName} (${splitColumns(columns)}) VALUES (${placeholders})`;
}

function getDefinition(collection) {
  return TABLE_DEFINITIONS[collection] || null;
}

function requireDefinition(collection) {
  const definition = getDefinition(collection);
  if (!definition) {
    throw new NotFoundError("Entidade nao encontrada.");
  }
  return definition;
}

function getDefaultOrder(definition) {
  return definition.defaultSort || { column: definition.pk[0], order: "asc" };
}

function normalizeId(fieldName, fieldMeta, rawValue) {
  return normalizeFieldValue(fieldName, { ...fieldMeta, required: true }, rawValue);
}

function getPkValueFromRecord(definition, record) {
  return definition.pk.map((field) => String(record[field])).join("::");
}

function parseKey(definition, key) {
  return parsePrimaryKey(definition, key);
}

function findByPk(definition, keyValues) {
  return (
    get(
      `SELECT * FROM ${definition.collection} WHERE ${buildWhereClause(definition.pk)}`,
      keyValues
    ) || null
  );
}

function requireRecordByPk(definition, keyValues, message = "Registro nao encontrado.") {
  const record = findByPk(definition, keyValues);
  if (!record) {
    throw new NotFoundError(message);
  }
  return record;
}

function getAppTables() {
  return new Set(
    all("SELECT name FROM sqlite_master WHERE type = 'table'")
      .map((row) => row.name)
      .filter((name) => TABLE_NAMES.includes(name))
  );
}

function getSchemaVersion() {
  const row = get("PRAGMA user_version");
  return Number(row?.user_version || 0);
}

function captureExistingData(existingTables) {
  const snapshot = {};

  for (const collection of SEED_ORDER) {
    const definition = TABLE_DEFINITIONS[collection];
    if (!existingTables.has(definition.collection)) {
      snapshot[definition.collection] = [];
      continue;
    }

    snapshot[definition.collection] = all(`SELECT * FROM ${definition.collection}`);
  }

  return snapshot;
}

function transformPreservedRow(definition, row, preservedProductsById) {
  const transformed = {};

  for (const fieldName of Object.keys(definition.fields)) {
    if (row[fieldName] !== undefined) {
      transformed[fieldName] = row[fieldName];
    }
  }

  if (definition.collection === "itensPedido" && transformed.valor_unitario === undefined) {
    const product = preservedProductsById.get(Number(transformed.id_produto));
    transformed.valor_unitario = product ? Number(product.valor) : 0;
  }

  return transformed;
}

function rebuildSchemaFromSnapshot(snapshot) {
  const preservedProductsById = new Map(
    (snapshot.produtos || []).map((product) => [Number(product.id), product])
  );

  exec("PRAGMA foreign_keys = OFF;");
  exec("BEGIN;");

  try {
    for (const collection of [...SEED_ORDER].reverse()) {
      exec(`DROP TABLE IF EXISTS ${collection};`);
    }

    createSchemaFromSqlFiles();

    for (const collection of SEED_ORDER) {
      const definition = TABLE_DEFINITIONS[collection];
      const rows = snapshot[definition.collection] || [];

      for (const row of rows) {
        const transformed = transformPreservedRow(definition, row, preservedProductsById);
        const columns = Object.keys(transformed).filter((fieldName) => definition.fields[fieldName]);

        if (columns.length === 0) {
          continue;
        }

        const values = columns.map((fieldName) =>
          normalizeFieldValue(fieldName, definition.fields[fieldName], transformed[fieldName])
        );

        run(buildInsertStatement(definition.collection, columns), values);
      }
    }

    exec(`PRAGMA user_version = ${CURRENT_SCHEMA_VERSION};`);
    exec("COMMIT;");
  } catch (error) {
    exec("ROLLBACK;");
    throw error;
  } finally {
    exec("PRAGMA foreign_keys = ON;");
  }
}

function seedIfEmpty() {
  const allTablesEmpty = SEED_ORDER.every((collection) => {
    const definition = TABLE_DEFINITIONS[collection];
    const countRow = get(`SELECT COUNT(*) AS count FROM ${definition.collection}`);
    return Number(countRow.count) === 0;
  });

  if (allTablesEmpty) {
    try {
      seedFromSqlFile();
      return;
    } catch (error) {
      // Fallback para seed em JavaScript caso os arquivos SQL nao estejam disponiveis.
    }
  }

  for (const collection of SEED_ORDER) {
    const definition = TABLE_DEFINITIONS[collection];
    const countRow = get(`SELECT COUNT(*) AS count FROM ${definition.collection}`);

    if (Number(countRow.count) > 0) {
      continue;
    }

    for (const seedRow of definition.seedRows) {
      const columns = Object.keys(seedRow);
      const values = columns.map((fieldName) =>
        normalizeFieldValue(fieldName, definition.fields[fieldName], seedRow[fieldName])
      );
      run(buildInsertStatement(definition.collection, columns), values);
    }
  }
}

async function initializeDatabase(options = {}) {
  const { skipSeed = false } = options;
  exec("PRAGMA foreign_keys = ON;");

  const existingTables = getAppTables();
  const hasExistingSchema = existingTables.size > 0;

  if (hasExistingSchema && getSchemaVersion() < CURRENT_SCHEMA_VERSION) {
    const snapshot = captureExistingData(existingTables);
    rebuildSchemaFromSnapshot(snapshot);
  } else {
    createSchemaFromSqlFiles();
    exec(`PRAGMA user_version = ${CURRENT_SCHEMA_VERSION};`);
  }

  if (!skipSeed) {
    seedIfEmpty();
  }
}

function closeDatabase() {
  db.close();
}

function buildListQuery(definition, rawQuery = {}) {
  const reservedParams = new Set(["sort", "order", "limit", "offset"]);
  const clauses = [];
  const params = [];

  for (const [queryKey, rawValue] of Object.entries(rawQuery)) {
    if (reservedParams.has(queryKey)) {
      continue;
    }

    if (Array.isArray(rawValue)) {
      throw new BadRequestError(`O parametro "${queryKey}" deve ser informado apenas uma vez.`);
    }

    if (queryKey.endsWith("_like")) {
      const fieldName = queryKey.slice(0, -5);
      const fieldMeta = definition.fields[fieldName];

      if (!fieldMeta || !fieldMeta.filterable || !fieldMeta.allowLike) {
        throw new BadRequestError(`Filtro invalido: "${queryKey}".`);
      }

      const normalized = normalizeFieldValue(fieldName, fieldMeta, rawValue);
      clauses.push(`${fieldName} LIKE ? COLLATE NOCASE`);
      params.push(`%${normalized}%`);
      continue;
    }

    if (queryKey.endsWith("_min") || queryKey.endsWith("_max")) {
      const fieldName = queryKey.slice(0, -4);
      const fieldMeta = definition.fields[fieldName];

      if (!fieldMeta || !fieldMeta.filterable || !fieldMeta.allowRange) {
        throw new BadRequestError(`Filtro invalido: "${queryKey}".`);
      }

      if (fieldMeta.type !== "integer" && fieldMeta.type !== "real") {
        throw new BadRequestError(`Filtro "${queryKey}" so pode ser usado em campos numericos.`);
      }

      const normalized = normalizeFieldValue(fieldName, fieldMeta, rawValue);
      clauses.push(`${fieldName} ${queryKey.endsWith("_min") ? ">=" : "<="} ?`);
      params.push(normalized);
      continue;
    }

    if (queryKey.endsWith("_from") || queryKey.endsWith("_to")) {
      const fieldName = queryKey.slice(0, queryKey.endsWith("_from") ? -5 : -3);
      const fieldMeta = definition.fields[fieldName];

      if (!fieldMeta || !fieldMeta.filterable || !fieldMeta.allowRange) {
        throw new BadRequestError(`Filtro invalido: "${queryKey}".`);
      }

      if (fieldMeta.type !== "datetime") {
        throw new BadRequestError(`Filtro "${queryKey}" so pode ser usado em campos de data.`);
      }

      const normalized = normalizeFieldValue(fieldName, fieldMeta, rawValue);
      clauses.push(`date(${fieldName}) ${queryKey.endsWith("_from") ? ">=" : "<="} date(?)`);
      params.push(normalized);
      continue;
    }

    const fieldMeta = definition.fields[queryKey];
    if (!fieldMeta || !fieldMeta.filterable) {
      throw new BadRequestError(`Filtro invalido: "${queryKey}".`);
    }

    const normalized = normalizeFieldValue(queryKey, fieldMeta, rawValue);
    clauses.push(`${queryKey} = ?`);
    params.push(normalized);
  }

  const defaultOrder = getDefaultOrder(definition);
  const sortColumn = rawQuery.sort ? String(rawQuery.sort) : defaultOrder.column;
  const sortMeta = definition.fields[sortColumn];

  if (!sortMeta || !sortMeta.sortable) {
    throw new BadRequestError(`Ordenacao invalida: "${sortColumn}".`);
  }

  const order = rawQuery.order ? String(rawQuery.order).toLowerCase() : defaultOrder.order;
  if (order !== "asc" && order !== "desc") {
    throw new BadRequestError('O parametro "order" deve ser "asc" ou "desc".');
  }

  let limitClause = "";
  if (rawQuery.limit !== undefined) {
    const limit = normalizeFieldValue(
      "limit",
      { type: "integer", required: true, min: 1 },
      rawQuery.limit
    );

    if (limit > 100) {
      throw new BadRequestError('O parametro "limit" nao pode ser maior que 100.');
    }

    limitClause = " LIMIT ?";
    params.push(limit);
  }

  if (rawQuery.offset !== undefined) {
    const offset = normalizeFieldValue(
      "offset",
      { type: "integer", required: true, min: 0 },
      rawQuery.offset
    );

    if (!limitClause) {
      limitClause = " LIMIT -1";
    }

    limitClause += " OFFSET ?";
    params.push(offset);
  }

  const whereClause = clauses.length > 0 ? ` WHERE ${clauses.join(" AND ")}` : "";
  const orderClause = ` ORDER BY ${sortColumn} ${order.toUpperCase()}`;

  return {
    sql: `SELECT * FROM ${definition.collection}${whereClause}${orderClause}${limitClause}`,
    params,
  };
}

async function getState() {
  const state = {};

  for (const collection of SEED_ORDER) {
    const definition = TABLE_DEFINITIONS[collection];
    const defaultOrder = getDefaultOrder(definition);
    state[definition.collection] = all(
      `SELECT * FROM ${definition.collection} ORDER BY ${defaultOrder.column} ${defaultOrder.order.toUpperCase()}`
    );
  }

  return state;
}

async function listRecords(collection, query) {
  const definition = requireDefinition(collection);
  const { sql, params } = buildListQuery(definition, query);
  return all(sql, params);
}

async function insertRecord(collection, body) {
  const definition = requireDefinition(collection);
  const payload = validatePayload(definition, body, "create");
  const columns = definition.insertColumns;
  const values = columns.map((fieldName) => payload[fieldName]);
  const result = run(buildInsertStatement(definition.collection, columns), values);

  const keyValues = definition.autoId
    ? [Number(result.lastInsertRowid)]
    : definition.pk.map((fieldName) => payload[fieldName]);

  return requireRecordByPk(definition, keyValues);
}

async function updateRecord(collection, key, body, options = {}) {
  const definition = requireDefinition(collection);
  const keyValues = parseKey(definition, key);
  requireRecordByPk(definition, keyValues);

  const mode = options.partial ? "patch" : "replace";
  const payload = validatePayload(definition, body, mode);
  const columns = options.partial ? Object.keys(payload) : definition.updateColumns;
  const setClause = columns.map((fieldName) => `${fieldName} = ?`).join(", ");
  const values = columns.map((fieldName) => payload[fieldName]);

  run(
    `UPDATE ${definition.collection} SET ${setClause} WHERE ${buildWhereClause(definition.pk)}`,
    [...values, ...keyValues]
  );

  return requireRecordByPk(definition, keyValues);
}

async function deleteRecord(collection, key) {
  const definition = requireDefinition(collection);
  const keyValues = parseKey(definition, key);
  const existing = requireRecordByPk(definition, keyValues);

  run(`DELETE FROM ${definition.collection} WHERE ${buildWhereClause(definition.pk)}`, keyValues);

  return {
    deleted: true,
    key: getPkValueFromRecord(definition, existing),
    collection: definition.collection,
  };
}

function countStatements(query) {
  return query
    .split(";")
    .map((part) => part.trim())
    .filter(Boolean).length;
}

function isReadQuery(query) {
  const normalized = query.trim().replace(/^;+/, "").trim().toLowerCase();
  return (
    normalized.startsWith("select") ||
    normalized.startsWith("with") ||
    normalized.startsWith("pragma") ||
    normalized.startsWith("explain")
  );
}

async function executeRawSql(query) {
  if (typeof query !== "string" || !query.trim()) {
    throw new BadRequestError("A query SQL nao pode estar vazia.");
  }

  if (countStatements(query) > 1) {
    throw new BadRequestError("Apenas uma instrucao SQL por execucao e permitida.");
  }

  const statement = query.trim().replace(/;+$/g, "").trim();

  try {
    if (isReadQuery(statement)) {
      const rows = all(statement);
      return {
        mode: "read",
        rowCount: rows.length,
        rows,
      };
    }

    const result = run(statement);
    return {
      mode: "write",
      changes: Number(result.changes || 0),
      lastInsertRowid:
        result.lastInsertRowid === undefined || result.lastInsertRowid === null
          ? null
          : Number(result.lastInsertRowid),
    };
  } catch (error) {
    const sqliteSummary = `${error.code || ""} ${error.errstr || ""} ${error.message || ""}`;
    if (
      error.code === "ERR_SQLITE_ERROR" &&
      (error.errcode === 1 ||
        /syntax error/i.test(sqliteSummary) ||
        /sql logic error/i.test(sqliteSummary))
    ) {
      throw new BadRequestError(`Erro de SQL: ${error.message}`);
    }

    throw error;
  }
}

function parseSingleId(collection, rawId) {
  const definition = requireDefinition(collection);
  return normalizeId("id", definition.fields.id, rawId);
}

async function getPedidoItens(rawPedidoId) {
  const pedidoId = parseSingleId("pedidos", rawPedidoId);
  requireRecordByPk(TABLE_DEFINITIONS.pedidos, [pedidoId], "Pedido nao encontrado.");

  return all(
    `
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
      WHERE ip.id_pedido = ?
      ORDER BY p.nome ASC
    `,
    [pedidoId]
  );
}

async function getProdutoIngredientes(rawProdutoId) {
  const produtoId = parseSingleId("produtos", rawProdutoId);
  requireRecordByPk(TABLE_DEFINITIONS.produtos, [produtoId], "Produto nao encontrado.");

  return all(
    `
      SELECT
        pi.id_produto,
        pi.id_ingrediente,
        i.nome AS nome_ingrediente,
        i.unidade,
        pi.quantidade AS quantidade_usada
      FROM produtosIngredientes pi
      INNER JOIN ingredientes i ON i.id = pi.id_ingrediente
      WHERE pi.id_produto = ?
      ORDER BY i.nome ASC
    `,
    [produtoId]
  );
}

async function getClientePedidos(rawClienteId) {
  const clienteId = parseSingleId("clientes", rawClienteId);
  requireRecordByPk(TABLE_DEFINITIONS.clientes, [clienteId], "Cliente nao encontrado.");

  return all(
    `
      SELECT *
      FROM pedidos
      WHERE id_cliente = ?
      ORDER BY data DESC, id DESC
    `,
    [clienteId]
  );
}

async function getIngredientesBaixoEstoque(rawMax) {
  const max =
    rawMax === undefined
      ? 10
      : normalizeFieldValue(
          "max",
          { type: "real", required: true, min: 0 },
          rawMax
        );

  return all(
    `
      SELECT *
      FROM ingredientes
      WHERE quantidade_estoque <= ?
      ORDER BY quantidade_estoque ASC, nome ASC
    `,
    [max]
  );
}

function validatePedidoComItensPayload(body) {
  ensurePlainObject(body);

  const allowedKeys = new Set(["data", "id_cliente", "id_funcionario", "itens"]);
  const unknownKeys = Object.keys(body).filter((key) => !allowedKeys.has(key));

  if (unknownKeys.length > 0) {
    throw new ValidationError(`Campos desconhecidos no pedido: ${unknownKeys.join(", ")}.`);
  }

  const pedidoDefinition = TABLE_DEFINITIONS.pedidos;
  const itemDefinition = TABLE_DEFINITIONS.itensPedido;

  const pedido = {
    data: normalizeFieldValue("data", pedidoDefinition.fields.data, body.data),
    id_cliente: normalizeFieldValue(
      "id_cliente",
      pedidoDefinition.fields.id_cliente,
      body.id_cliente
    ),
    id_funcionario: normalizeFieldValue(
      "id_funcionario",
      pedidoDefinition.fields.id_funcionario,
      body.id_funcionario
    ),
  };

  if (!Array.isArray(body.itens) || body.itens.length === 0) {
    throw new ValidationError("Informe ao menos um item no pedido.");
  }

  if (!findByPk(TABLE_DEFINITIONS.clientes, [pedido.id_cliente])) {
    throw new ValidationError(`Cliente "${pedido.id_cliente}" nao existe.`);
  }

  if (!findByPk(TABLE_DEFINITIONS.funcionarios, [pedido.id_funcionario])) {
    throw new ValidationError(`Funcionario "${pedido.id_funcionario}" nao existe.`);
  }

  const productIds = new Set();
  const items = body.itens.map((rawItem, index) => {
    ensurePlainObject(rawItem, `O item ${index + 1} deve ser um objeto JSON.`);

    const unknownItemKeys = Object.keys(rawItem).filter(
      (key) => !["id_produto", "quantidade"].includes(key)
    );
    if (unknownItemKeys.length > 0) {
      throw new ValidationError(
        `Campos desconhecidos no item ${index + 1}: ${unknownItemKeys.join(", ")}.`
      );
    }

    const id_produto = normalizeFieldValue(
      "id_produto",
      itemDefinition.fields.id_produto,
      rawItem.id_produto
    );
    const quantidade = normalizeFieldValue(
      "quantidade",
      itemDefinition.fields.quantidade,
      rawItem.quantidade
    );

    if (productIds.has(id_produto)) {
      throw new ValidationError(`O produto "${id_produto}" foi informado mais de uma vez.`);
    }
    productIds.add(id_produto);

    const produto = findByPk(TABLE_DEFINITIONS.produtos, [id_produto]);
    if (!produto) {
      throw new ValidationError(`Produto "${id_produto}" nao existe.`);
    }

    return {
      id_produto,
      quantidade,
      valor_unitario: Number(produto.valor),
    };
  });

  return { pedido, items };
}

async function createPedidoComItens(body) {
  const { pedido, items } = validatePedidoComItensPayload(body);
  const total = Number(
    items.reduce((sum, item) => sum + item.quantidade * item.valor_unitario, 0).toFixed(2)
  );

  let pedidoId = null;

  exec("BEGIN;");
  try {
    const pedidoResult = run(
      buildInsertStatement("pedidos", ["data", "total", "id_cliente", "id_funcionario"]),
      [pedido.data, total, pedido.id_cliente, pedido.id_funcionario]
    );

    pedidoId = Number(pedidoResult.lastInsertRowid);

    for (const item of items) {
      run(
        buildInsertStatement("itensPedido", [
          "id_pedido",
          "id_produto",
          "quantidade",
          "valor_unitario",
        ]),
        [pedidoId, item.id_produto, item.quantidade, item.valor_unitario]
      );
    }

    exec("COMMIT;");
  } catch (error) {
    exec("ROLLBACK;");
    throw error;
  }

  return {
    ...requireRecordByPk(TABLE_DEFINITIONS.pedidos, [pedidoId]),
    itens: await getPedidoItens(pedidoId),
  };
}

module.exports = {
  db,
  dbPath,
  initializeDatabase,
  closeDatabase,
  getState,
  listRecords,
  insertRecord,
  updateRecord,
  deleteRecord,
  executeRawSql,
  getDefinition,
  getPkValueFromRecord,
  parseKey,
  getPedidoItens,
  getProdutoIngredientes,
  getClientePedidos,
  getIngredientesBaixoEstoque,
  createPedidoComItens,
};
