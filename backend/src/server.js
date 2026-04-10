const cors = require("cors");
const express = require("express");
const {
  createPedidoComItens,
  deleteRecord,
  executeRawSql,
  getClientePedidos,
  getIngredientesBaixoEstoque,
  getPedidoItens,
  getProdutoIngredientes,
  getState,
  initializeDatabase,
  insertRecord,
  listRecords,
  updateRecord,
} = require("./database");
const { AppError } = require("./errors");
const {
  getCategoriasInsights,
  getClientesTop,
  getEstoqueBaixoInsights,
  getProdutosAfetadosPorEstoque,
  getProdutosMaisVendidos,
  getResumoInsights,
  getVendasPorPeriodo,
} = require("./insights");

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
    response.json(await executeRawSql(request.body?.query));
  } catch (error) {
    next(error);
  }
});

app.get("/api/pedidos/:id/itens", async (request, response, next) => {
  try {
    response.json(await getPedidoItens(request.params.id));
  } catch (error) {
    next(error);
  }
});

app.get("/api/produtos/:id/ingredientes", async (request, response, next) => {
  try {
    response.json(await getProdutoIngredientes(request.params.id));
  } catch (error) {
    next(error);
  }
});

app.get("/api/clientes/:id/pedidos", async (request, response, next) => {
  try {
    response.json(await getClientePedidos(request.params.id));
  } catch (error) {
    next(error);
  }
});

app.get("/api/ingredientes/baixo-estoque", async (request, response, next) => {
  try {
    response.json(await getIngredientesBaixoEstoque(request.query.max));
  } catch (error) {
    next(error);
  }
});

app.post("/api/pedidos-com-itens", async (request, response, next) => {
  try {
    const pedido = await createPedidoComItens(request.body);
    response.status(201).json(pedido);
  } catch (error) {
    next(error);
  }
});

app.get("/api/insights/resumo", async (request, response, next) => {
  try {
    response.json(await getResumoInsights(request.query));
  } catch (error) {
    next(error);
  }
});

app.get("/api/insights/vendas-por-periodo", async (request, response, next) => {
  try {
    response.json(await getVendasPorPeriodo(request.query));
  } catch (error) {
    next(error);
  }
});

app.get("/api/insights/produtos-mais-vendidos", async (request, response, next) => {
  try {
    response.json(await getProdutosMaisVendidos(request.query));
  } catch (error) {
    next(error);
  }
});

app.get("/api/insights/categorias", async (request, response, next) => {
  try {
    response.json(await getCategoriasInsights(request.query));
  } catch (error) {
    next(error);
  }
});

app.get("/api/insights/clientes-top", async (request, response, next) => {
  try {
    response.json(await getClientesTop(request.query));
  } catch (error) {
    next(error);
  }
});

app.get("/api/insights/estoque-baixo", async (request, response, next) => {
  try {
    response.json(await getEstoqueBaixoInsights(request.query));
  } catch (error) {
    next(error);
  }
});

app.get("/api/insights/produtos-afetados-por-estoque", async (request, response, next) => {
  try {
    response.json(await getProdutosAfetadosPorEstoque(request.query));
  } catch (error) {
    next(error);
  }
});

app.get("/api/:collection", async (request, response, next) => {
  try {
    response.json(await listRecords(request.params.collection, request.query));
  } catch (error) {
    next(error);
  }
});

app.post("/api/:collection", async (request, response, next) => {
  try {
    const record = await insertRecord(request.params.collection, request.body);
    response.status(201).json(record);
  } catch (error) {
    next(error);
  }
});

app.put("/api/:collection/:key", async (request, response, next) => {
  try {
    response.json(await updateRecord(request.params.collection, request.params.key, request.body));
  } catch (error) {
    next(error);
  }
});

app.patch("/api/:collection/:key", async (request, response, next) => {
  try {
    response.json(
      await updateRecord(request.params.collection, request.params.key, request.body, {
        partial: true,
      })
    );
  } catch (error) {
    next(error);
  }
});

app.delete("/api/:collection/:key", async (request, response, next) => {
  try {
    response.json(await deleteRecord(request.params.collection, request.params.key));
  } catch (error) {
    next(error);
  }
});

function mapSqliteConstraintMessage(error) {
  const message = `${error.message || ""} ${error.errstr || ""}`;

  if (message.includes("UNIQUE constraint failed")) {
    return "Registro duplicado para um campo unico.";
  }

  if (message.includes("FOREIGN KEY constraint failed")) {
    return "Violacao de chave estrangeira.";
  }

  if (message.includes("CHECK constraint failed")) {
    return "Violacao de regra de validacao no banco de dados.";
  }

  return "Violacao de restricao do banco de dados.";
}

app.use((error, _request, response, _next) => {
  const sqliteMessage = `${error?.message || ""} ${error?.errstr || ""}`;

  if (error instanceof AppError) {
    response.status(error.statusCode).json({ error: error.message });
    return;
  }

  if (
    error?.code === "ERR_SQLITE_ERROR" &&
    (/constraint failed/i.test(sqliteMessage) || error?.errcode === 1811)
  ) {
    response.status(409).json({ error: mapSqliteConstraintMessage(error) });
    return;
  }

  if (
    error?.code === "ERR_SQLITE_ERROR" &&
    (error?.errcode === 1 ||
      /syntax error/i.test(sqliteMessage) ||
      /sql logic error/i.test(sqliteMessage))
  ) {
    response.status(400).json({ error: `Erro de SQL: ${error.message}` });
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
