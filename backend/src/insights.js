const { db } = require("./database");
const { BadRequestError } = require("./errors");
const { normalizeFieldValue } = require("./validation");

function all(sql, params = []) {
  return db.prepare(sql).all(...params);
}

function get(sql, params = []) {
  return db.prepare(sql).get(...params);
}

function normalizeOptionalDate(value, paramName) {
  if (value === undefined || value === null || value === "") {
    return null;
  }

  return normalizeFieldValue(paramName, { type: "datetime", required: true }, value);
}

function parseDateRange(query = {}) {
  const from = normalizeOptionalDate(query.from, "from");
  const to = normalizeOptionalDate(query.to, "to");

  if (from && to && Date.parse(from) > Date.parse(to)) {
    throw new BadRequestError('O parametro "from" nao pode ser maior que "to".');
  }

  return { from, to };
}

function parseLimit(rawLimit, defaultValue = 10) {
  if (rawLimit === undefined || rawLimit === null || rawLimit === "") {
    return defaultValue;
  }

  const limit = normalizeFieldValue("limit", { type: "integer", required: true, min: 1 }, rawLimit);
  if (limit > 100) {
    throw new BadRequestError('O parametro "limit" nao pode ser maior que 100.');
  }
  return limit;
}

function parseMax(rawMax, defaultValue = 10) {
  if (rawMax === undefined || rawMax === null || rawMax === "") {
    return defaultValue;
  }

  return normalizeFieldValue("max", { type: "real", required: true, min: 0 }, rawMax);
}

function parseGroupBy(rawGroupBy) {
  if (rawGroupBy === undefined || rawGroupBy === null || rawGroupBy === "") {
    return "day";
  }

  const groupBy = String(rawGroupBy).toLowerCase();
  if (groupBy !== "day" && groupBy !== "month") {
    throw new BadRequestError('O parametro "groupBy" deve ser "day" ou "month".');
  }

  return groupBy;
}

function buildPedidoDateClause({ from, to }, column = "p.data") {
  const clauses = [];
  const params = [];

  if (from) {
    clauses.push(`date(${column}) >= date(?)`);
    params.push(from);
  }

  if (to) {
    clauses.push(`date(${column}) <= date(?)`);
    params.push(to);
  }

  return {
    whereClause: clauses.length > 0 ? ` WHERE ${clauses.join(" AND ")}` : "",
    params,
  };
}

async function getResumoInsights(query = {}) {
  const range = parseDateRange(query);
  const max = parseMax(query.max, 10);
  const { whereClause, params } = buildPedidoDateClause(range);

  const pedidosRow = get(
    `
      SELECT
        COUNT(*) AS total_pedidos,
        ROUND(COALESCE(SUM(total), 0), 2) AS total_faturado,
        ROUND(COALESCE(AVG(total), 0), 2) AS ticket_medio
      FROM pedidos p
      ${whereClause}
    `,
    params
  );

  const countsRow = get(
    `
      SELECT
        (SELECT COUNT(*) FROM clientes) AS total_clientes,
        (SELECT COUNT(*) FROM produtos) AS total_produtos,
        (SELECT COUNT(*) FROM ingredientes) AS total_ingredientes,
        (
          SELECT COUNT(*)
          FROM ingredientes
          WHERE quantidade_estoque <= ?
        ) AS ingredientes_criticos
    `,
    [max]
  );

  return {
    periodo: range,
    limite_estoque_baixo: max,
    total_pedidos: Number(pedidosRow.total_pedidos || 0),
    total_faturado: Number(pedidosRow.total_faturado || 0),
    ticket_medio: Number(pedidosRow.ticket_medio || 0),
    total_clientes: Number(countsRow.total_clientes || 0),
    total_produtos: Number(countsRow.total_produtos || 0),
    total_ingredientes: Number(countsRow.total_ingredientes || 0),
    ingredientes_criticos: Number(countsRow.ingredientes_criticos || 0),
  };
}

async function getVendasPorPeriodo(query = {}) {
  const range = parseDateRange(query);
  const groupBy = parseGroupBy(query.groupBy);
  const { whereClause, params } = buildPedidoDateClause(range);
  const periodExpression =
    groupBy === "month" ? "strftime('%Y-%m', p.data)" : "date(p.data)";

  return all(
    `
      SELECT
        ${periodExpression} AS periodo,
        COUNT(*) AS quantidade_pedidos,
        ROUND(COALESCE(SUM(p.total), 0), 2) AS valor_total,
        ROUND(COALESCE(AVG(p.total), 0), 2) AS ticket_medio
      FROM pedidos p
      ${whereClause}
      GROUP BY ${periodExpression}
      ORDER BY ${periodExpression} ASC
    `,
    params
  ).map((row) => ({
    periodo: row.periodo,
    quantidade_pedidos: Number(row.quantidade_pedidos || 0),
    valor_total: Number(row.valor_total || 0),
    ticket_medio: Number(row.ticket_medio || 0),
  }));
}

async function getProdutosMaisVendidos(query = {}) {
  const range = parseDateRange(query);
  const limit = parseLimit(query.limit, 10);
  const { whereClause, params } = buildPedidoDateClause(range);

  return all(
    `
      SELECT
        p.id AS id_produto,
        p.nome AS nome_produto,
        p.categoria,
        ROUND(COALESCE(SUM(ip.quantidade), 0), 2) AS quantidade_total_vendida,
        ROUND(COALESCE(SUM(ip.quantidade * ip.valor_unitario), 0), 2) AS receita_total
      FROM itensPedido ip
      INNER JOIN pedidos ped ON ped.id = ip.id_pedido
      INNER JOIN produtos p ON p.id = ip.id_produto
      ${whereClause.replace(/p\.data/g, "ped.data")}
      GROUP BY p.id, p.nome, p.categoria
      ORDER BY quantidade_total_vendida DESC, receita_total DESC, p.nome ASC
      LIMIT ?
    `,
    [...params, limit]
  ).map((row) => ({
    id_produto: Number(row.id_produto),
    nome_produto: row.nome_produto,
    categoria: row.categoria,
    quantidade_total_vendida: Number(row.quantidade_total_vendida || 0),
    receita_total: Number(row.receita_total || 0),
  }));
}

async function getCategoriasInsights(query = {}) {
  const range = parseDateRange(query);
  const { whereClause, params } = buildPedidoDateClause(range);

  return all(
    `
      SELECT
        p.categoria,
        ROUND(COALESCE(SUM(ip.quantidade), 0), 2) AS quantidade_vendida,
        ROUND(COALESCE(SUM(ip.quantidade * ip.valor_unitario), 0), 2) AS valor_total_vendido
      FROM itensPedido ip
      INNER JOIN pedidos ped ON ped.id = ip.id_pedido
      INNER JOIN produtos p ON p.id = ip.id_produto
      ${whereClause.replace(/p\.data/g, "ped.data")}
      GROUP BY p.categoria
      ORDER BY valor_total_vendido DESC, quantidade_vendida DESC, p.categoria ASC
    `,
    params
  ).map((row) => ({
    categoria: row.categoria,
    quantidade_vendida: Number(row.quantidade_vendida || 0),
    valor_total_vendido: Number(row.valor_total_vendido || 0),
  }));
}

async function getClientesTop(query = {}) {
  const range = parseDateRange(query);
  const limit = parseLimit(query.limit, 10);
  const { whereClause, params } = buildPedidoDateClause(range);

  return all(
    `
      SELECT
        c.id AS id_cliente,
        c.nome,
        COUNT(p.id) AS quantidade_pedidos,
        ROUND(COALESCE(SUM(p.total), 0), 2) AS valor_total_gasto,
        ROUND(COALESCE(AVG(p.total), 0), 2) AS ticket_medio
      FROM clientes c
      INNER JOIN pedidos p ON p.id_cliente = c.id
      ${whereClause}
      GROUP BY c.id, c.nome
      ORDER BY valor_total_gasto DESC, quantidade_pedidos DESC, c.nome ASC
      LIMIT ?
    `,
    [...params, limit]
  ).map((row) => ({
    id_cliente: Number(row.id_cliente),
    nome: row.nome,
    quantidade_pedidos: Number(row.quantidade_pedidos || 0),
    valor_total_gasto: Number(row.valor_total_gasto || 0),
    ticket_medio: Number(row.ticket_medio || 0),
  }));
}

async function getEstoqueBaixoInsights(query = {}) {
  const max = parseMax(query.max, 10);

  return all(
    `
      SELECT
        id,
        nome,
        unidade,
        quantidade_estoque
      FROM ingredientes
      WHERE quantidade_estoque <= ?
      ORDER BY quantidade_estoque ASC, nome ASC
    `,
    [max]
  ).map((row) => ({
    id: Number(row.id),
    nome: row.nome,
    unidade: row.unidade,
    quantidade_estoque: Number(row.quantidade_estoque || 0),
  }));
}

async function getProdutosAfetadosPorEstoque(query = {}) {
  const max = parseMax(query.max, 10);

  return all(
    `
      SELECT
        p.id AS id_produto,
        p.nome AS nome_produto,
        p.categoria,
        i.id AS id_ingrediente,
        i.nome AS nome_ingrediente,
        i.unidade,
        i.quantidade_estoque,
        pi.quantidade AS quantidade_usada
      FROM produtosIngredientes pi
      INNER JOIN produtos p ON p.id = pi.id_produto
      INNER JOIN ingredientes i ON i.id = pi.id_ingrediente
      WHERE i.quantidade_estoque <= ?
      ORDER BY i.quantidade_estoque ASC, p.nome ASC, i.nome ASC
    `,
    [max]
  ).map((row) => ({
    id_produto: Number(row.id_produto),
    nome_produto: row.nome_produto,
    categoria: row.categoria,
    id_ingrediente: Number(row.id_ingrediente),
    nome_ingrediente: row.nome_ingrediente,
    unidade: row.unidade,
    quantidade_estoque: Number(row.quantidade_estoque || 0),
    quantidade_usada: Number(row.quantidade_usada || 0),
  }));
}

module.exports = {
  getResumoInsights,
  getVendasPorPeriodo,
  getProdutosMaisVendidos,
  getCategoriasInsights,
  getClientesTop,
  getEstoqueBaixoInsights,
  getProdutosAfetadosPorEstoque,
};
