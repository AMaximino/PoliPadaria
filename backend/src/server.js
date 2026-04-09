const cors = require("cors");
const express = require("express");
const {
  deleteRecord,
  executeRawSql,
  getDefinition,
  getState,
  initializeDatabase,
  insertRecord,
  updateRecord,
} = require("./database");

const app = express();
const port = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

app.get("/api/health", (_request, response) => {
  response.json({ ok: true });
});

app.get("/api/state", async (_request, response, next) => {
  try {
    response.json(await getState());
  } catch (error) {
    next(error);
  }
});

app.post("/api/sql", async (request, response, next) => {
  try {
    const result = await executeRawSql(request.body?.query);
    response.json(result);
  } catch (error) {
    next(error);
  }
});

app.get("/api/:collection", async (request, response, next) => {
  try {
    const definition = getDefinition(request.params.collection);
    if (!definition) {
      response.status(404).json({ error: "Entidade nao encontrada." });
      return;
    }

    const state = await getState();
    response.json(state[definition.collection]);
  } catch (error) {
    next(error);
  }
});

app.post("/api/:collection", async (request, response, next) => {
  try {
    const state = await insertRecord(request.params.collection, request.body);
    response.status(201).json(state);
  } catch (error) {
    next(error);
  }
});

app.put("/api/:collection/:key", async (request, response, next) => {
  try {
    const state = await updateRecord(request.params.collection, request.params.key, request.body);
    response.json(state);
  } catch (error) {
    next(error);
  }
});

app.delete("/api/:collection/:key", async (request, response, next) => {
  try {
    const state = await deleteRecord(request.params.collection, request.params.key);
    response.json(state);
  } catch (error) {
    next(error);
  }
});

app.use((error, _request, response, _next) => {
  if (error && String(error.message || "").includes("SQLITE_CONSTRAINT")) {
    response.status(409).json({ error: "Violacao de restricao do banco de dados." });
    return;
  }

  if (error && String(error.message || "").includes("Chave primaria invalida")) {
    response.status(400).json({ error: error.message });
    return;
  }

  if (error && String(error.message || "").includes("SQLITE_ERROR")) {
    response.status(400).json({ error: `Erro de sintaxe SQL: ${error.message}` });
    return;
  }

  if (
    error &&
    (String(error.message || "").includes("A query SQL nao pode estar vazia") ||
      String(error.message || "").includes("Apenas uma instrucao SQL"))
  ) {
    response.status(400).json({ error: error.message });
    return;
  }

  console.error(error);
  response.status(500).json({ error: "Erro interno do servidor." });
});

initializeDatabase()
  .then(() => {
    app.listen(port, () => {
      console.log(`PoliPadaria backend running on http://localhost:${port}`);
    });
  })
  .catch((error) => {
    console.error("Failed to initialize database", error);
    process.exit(1);
  });