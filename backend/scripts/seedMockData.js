#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const { generateMockDataset, DEFAULT_REFERENCE_DATE } = require("../src/mockData/generator");

function parseArgs(argv) {
  const options = {
    size: "medium",
    seed: "42",
    days: 90,
    reset: false,
  };

  for (const rawArg of argv) {
    if (!rawArg.startsWith("--")) {
      continue;
    }

    const [key, rawValue] = rawArg.slice(2).split("=");
    const value = rawValue === undefined ? true : rawValue;

    if (key === "size") {
      options.size = String(value);
      continue;
    }

    if (key === "seed") {
      options.seed = String(value);
      continue;
    }

    if (key === "days") {
      options.days = Number(value);
      continue;
    }

    if (key === "reset") {
      options.reset = value === true || value === "true";
    }
  }

  if (!Number.isInteger(options.days) || options.days <= 0) {
    throw new Error('O parametro "--days" deve ser um inteiro positivo.');
  }

  return options;
}

function getDatabaseFilePath() {
  return path.join(__dirname, "..", "data", "polipadaria.sqlite3");
}

function removeDatabaseFileIfNeeded(shouldReset) {
  const databaseFile = getDatabaseFilePath();

  if (shouldReset && fs.existsSync(databaseFile)) {
    fs.rmSync(databaseFile, { force: true });
  }
}

function getNextId(db, tableName) {
  const row = db.prepare(`SELECT COALESCE(MAX(id), 0) AS maxId FROM ${tableName}`).get();
  return Number(row.maxId) + 1;
}

function hasColumn(db, tableName, columnName) {
  const columns = db.prepare(`PRAGMA table_info(${tableName})`).all();
  return columns.some((column) => column.name === columnName);
}

function insertRows(db, tableName, rows) {
  if (!rows.length) {
    return 0;
  }

  const columns = Object.keys(rows[0]);
  const placeholders = columns.map(() => "?").join(", ");
  const statement = db.prepare(
    `INSERT INTO ${tableName} (${columns.join(", ")}) VALUES (${placeholders})`
  );

  for (const row of rows) {
    statement.run(...columns.map((column) => row[column]));
  }

  return rows.length;
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  removeDatabaseFileIfNeeded(options.reset);

  const {
    closeDatabase,
    db,
    initializeDatabase,
  } = require("../src/database");

  try {
    await initializeDatabase({ skipSeed: true });

    const includeValorUnitario = hasColumn(db, "itensPedido", "valor_unitario");
    const offsets = {
      clientes: getNextId(db, "clientes"),
      funcionarios: getNextId(db, "funcionarios"),
      ingredientes: getNextId(db, "ingredientes"),
      produtos: getNextId(db, "produtos"),
      pedidos: getNextId(db, "pedidos"),
    };

    const dataset = generateMockDataset({
      size: options.size,
      seed: options.seed,
      days: options.days,
      offsets,
      includeValorUnitario,
      referenceDate: DEFAULT_REFERENCE_DATE,
    });

    db.exec("BEGIN;");
    try {
      insertRows(db, "clientes", dataset.rows.clientes);
      insertRows(db, "funcionarios", dataset.rows.funcionarios);
      insertRows(db, "ingredientes", dataset.rows.ingredientes);
      insertRows(db, "produtos", dataset.rows.produtos);
      insertRows(db, "produtosIngredientes", dataset.rows.produtosIngredientes);
      insertRows(db, "pedidos", dataset.rows.pedidos);
      insertRows(db, "itensPedido", dataset.rows.itensPedido);
      db.exec("COMMIT;");
    } catch (error) {
      db.exec("ROLLBACK;");
      throw error;
    }

    console.log("Mock data gerado com sucesso.");
    console.log(JSON.stringify(dataset.metadata, null, 2));
    console.log(
      `Modo: ${options.reset ? "reset total" : "append"} | SQLite: ${getDatabaseFilePath()}`
    );
  } finally {
    closeDatabase();
  }
}

main().catch((error) => {
  console.error("Falha ao gerar mock data.");
  console.error(error.message || error);
  process.exit(1);
});
