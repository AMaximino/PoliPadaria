const fs = require("fs");
const path = require("path");
const { DatabaseSync } = require("node:sqlite");
const { SEED_ORDER, TABLE_DEFINITIONS } = require("./dataModel");

const dataDir = path.join(__dirname, "..", "data");
const dbPath = path.join(dataDir, "polipadaria.sqlite3");

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

function splitColumns(columns) {
  return columns.join(", ");
}

function buildWhereClause(pk) {
  return pk.map((field) => `${field} = ?`).join(" AND ");
}

function toNumberIfNeeded(columnName, value) {
  if (value === null || value === undefined) {
    return value;
  }

  if (
    columnName === "id" ||
    columnName === "id_cliente" ||
    columnName === "id_funcionario" ||
    columnName === "id_pedido" ||
    columnName === "id_produto" ||
    columnName === "id_ingrediente" ||
    columnName === "total" ||
    columnName === "valor" ||
    columnName === "quantidade" ||
    columnName === "quantidade_estoque"
  ) {
    return Number(value);
  }

  return value;
}

function normalizeRecord(definition, record) {
  const normalized = {};

  Object.keys(record).forEach((key) => {
    normalized[key] = toNumberIfNeeded(key, record[key]);
  });

  return normalized;
}

async function initializeDatabase() {
  exec("PRAGMA foreign_keys = ON;");

  for (const key of SEED_ORDER) {
    const definition = TABLE_DEFINITIONS[key];
    exec(definition.createSql);
  }

  for (const key of SEED_ORDER) {
    const definition = TABLE_DEFINITIONS[key];
    const countRow = get(`SELECT COUNT(*) AS count FROM ${definition.collection}`);

    if (countRow.count > 0) {
      continue;
    }

    for (const seedRow of definition.seedRows) {
      const columns = Object.keys(seedRow);
      const placeholders = columns.map(() => "?").join(", ");
      const values = columns.map((column) => toNumberIfNeeded(column, seedRow[column]));
      run(
        `INSERT INTO ${definition.collection} (${splitColumns(columns)}) VALUES (${placeholders})`,
        values
      );
    }
  }
}

async function getState() {
  const state = {};

  for (const key of SEED_ORDER) {
    const definition = TABLE_DEFINITIONS[key];
    const rows = all(`SELECT * FROM ${definition.collection}`);
    state[definition.collection] = rows;
  }

  return state;
}

function getDefinition(collection) {
  return TABLE_DEFINITIONS[collection];
}

function parseKey(definition, key) {
  const rawParts = String(key).split("::");
  if (rawParts.length !== definition.pk.length) {
    throw new Error("Chave primaria invalida.");
  }

  return definition.pk.map((field, index) => toNumberIfNeeded(field, rawParts[index]));
}

function getPkValueFromRecord(definition, record) {
  return definition.pk.map((field) => String(record[field])).join("::");
}

function buildInsertPayload(definition, body) {
  const payload = {};
  const columns = definition.autoId ? definition.insertColumns : definition.insertColumns;

  columns.forEach((column) => {
    if (body[column] === undefined) {
      payload[column] = null;
      return;
    }

    payload[column] = toNumberIfNeeded(column, body[column]);
  });

  return payload;
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
    throw new Error("A query SQL nao pode estar vazia.");
  }

  if (countStatements(query) > 1) {
    throw new Error("Apenas uma instrucao SQL por execucao e permitida.");
  }

  const statement = query.trim().replace(/;+$/g, "").trim();

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
}

async function insertRecord(collection, body) {
  const definition = getDefinition(collection);
  if (!definition) {
    throw new Error("Entidade desconhecida.");
  }

  const payload = buildInsertPayload(definition, body);
  const columns = definition.insertColumns;
  const values = columns.map((column) => payload[column]);
  const placeholders = columns.map(() => "?").join(", ");

  run(
    `INSERT INTO ${definition.collection} (${splitColumns(columns)}) VALUES (${placeholders})`,
    values
  );

  if (!definition.autoId) {
    return getState();
  }

  return getState();
}

async function updateRecord(collection, key, body) {
  const definition = getDefinition(collection);
  if (!definition) {
    throw new Error("Entidade desconhecida.");
  }

  const whereValues = parseKey(definition, key);
  const columns = definition.updateColumns;
  const values = columns.map((column) => toNumberIfNeeded(column, body[column]));
  const setClause = columns.map((column) => `${column} = ?`).join(", ");

  run(
    `UPDATE ${definition.collection} SET ${setClause} WHERE ${buildWhereClause(definition.pk)} `,
    [...values, ...whereValues]
  );

  return getState();
}

async function deleteRecord(collection, key) {
  const definition = getDefinition(collection);
  if (!definition) {
    throw new Error("Entidade desconhecida.");
  }

  const whereValues = parseKey(definition, key);
  run(`DELETE FROM ${definition.collection} WHERE ${buildWhereClause(definition.pk)}`, whereValues);
  return getState();
}

module.exports = {
  db,
  initializeDatabase,
  getState,
  insertRecord,
  updateRecord,
  deleteRecord,
  executeRawSql,
  getDefinition,
  getPkValueFromRecord,
  parseKey,
  normalizeRecord,
};