import { useEffect, useMemo, useState } from "react";
import { fetchInsights } from "../utils/api";
import { toCurrencyInput } from "../utils/formatters";

function formatNumber(value, options = {}) {
  return Number(value || 0).toLocaleString("pt-BR", options);
}

function formatCurrency(value) {
  return toCurrencyInput(Number(value || 0));
}

function buildQueryString(params) {
  const searchParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") {
      return;
    }

    searchParams.set(key, String(value));
  });

  const text = searchParams.toString();
  return text ? `?${text}` : "";
}

function SimpleTable({ columns, rows, emptyMessage }) {
  return (
    <div className="table-container dashboard-table">
      <table>
        <thead>
          <tr>
            {columns.map((column) => (
              <th key={column.key}>{column.label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 && (
            <tr>
              <td colSpan={columns.length}>{emptyMessage}</td>
            </tr>
          )}

          {rows.map((row, index) => (
            <tr key={row.id || row.periodo || `${index}-${JSON.stringify(row)}`}>
              {columns.map((column) => (
                <td key={column.key}>{column.render ? column.render(row) : String(row[column.key] ?? "")}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function InsightsDashboard() {
  const [filters, setFilters] = useState({
    from: "",
    to: "",
    groupBy: "day",
    limit: "8",
    max: "10",
  });
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [payload, setPayload] = useState({
    resumo: null,
    vendasPorPeriodo: [],
    produtosMaisVendidos: [],
    categorias: [],
    clientesTop: [],
    estoqueBaixo: [],
    produtosAfetados: [],
  });

  useEffect(() => {
    let cancelled = false;

    async function loadInsights() {
      setLoading(true);
      setErrorMessage("");

      const periodQuery = buildQueryString({
        from: filters.from,
        to: filters.to,
      });

      try {
        const [
          resumo,
          vendasPorPeriodo,
          produtosMaisVendidos,
          categorias,
          clientesTop,
          estoqueBaixo,
          produtosAfetados,
        ] = await Promise.all([
          fetchInsights(`/insights/resumo${buildQueryString({
            from: filters.from,
            to: filters.to,
            max: filters.max,
          })}`),
          fetchInsights(`/insights/vendas-por-periodo${buildQueryString({
            from: filters.from,
            to: filters.to,
            groupBy: filters.groupBy,
          })}`),
          fetchInsights(`/insights/produtos-mais-vendidos${buildQueryString({
            from: filters.from,
            to: filters.to,
            limit: filters.limit,
          })}`),
          fetchInsights(`/insights/categorias${periodQuery}`),
          fetchInsights(`/insights/clientes-top${buildQueryString({
            from: filters.from,
            to: filters.to,
            limit: filters.limit,
          })}`),
          fetchInsights(`/insights/estoque-baixo${buildQueryString({
            max: filters.max,
          })}`),
          fetchInsights(`/insights/produtos-afetados-por-estoque${buildQueryString({
            max: filters.max,
          })}`),
        ]);

        if (!cancelled) {
          setPayload({
            resumo,
            vendasPorPeriodo,
            produtosMaisVendidos,
            categorias,
            clientesTop,
            estoqueBaixo,
            produtosAfetados,
          });
        }
      } catch (error) {
        if (!cancelled) {
          setErrorMessage(error.message || "Nao foi possivel carregar os insights operacionais.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadInsights();

    return () => {
      cancelled = true;
    };
  }, [filters.from, filters.groupBy, filters.limit, filters.max, filters.to]);

  function handleFilterChange(name, value) {
    setFilters((current) => ({
      ...current,
      [name]: value,
    }));
  }

  function handleClearFilters() {
    setFilters({
      from: "",
      to: "",
      groupBy: "day",
      limit: "8",
      max: "10",
    });
  }

  const maxPeriodoValue = useMemo(
    () => Math.max(1, ...payload.vendasPorPeriodo.map((item) => Number(item.valor_total || 0))),
    [payload.vendasPorPeriodo]
  );

  const summaryCards = payload.resumo
    ? [
        { label: "Faturamento", value: formatCurrency(payload.resumo.total_faturado) },
        { label: "Pedidos", value: formatNumber(payload.resumo.total_pedidos) },
        { label: "Ticket medio", value: formatCurrency(payload.resumo.ticket_medio) },
        { label: "Clientes", value: formatNumber(payload.resumo.total_clientes) },
        { label: "Produtos", value: formatNumber(payload.resumo.total_produtos) },
        { label: "Ingredientes criticos", value: formatNumber(payload.resumo.ingredientes_criticos) },
      ]
    : [];

  return (
    <section className="entity-panel insights-panel">
      <div className="insights-header">
        <div>
          <h2>Dashboard operacional</h2>
          <p className="dashboard-intro">
            Visao resumida das vendas, clientes, produtos e ingredientes para demonstracao do sistema.
          </p>
        </div>

        <div className="toolbar insights-filters">
          <label className="field compact">
            <span>Periodo inicial</span>
            <input
              type="date"
              value={filters.from}
              onChange={(event) => handleFilterChange("from", event.target.value)}
            />
          </label>

          <label className="field compact">
            <span>Periodo final</span>
            <input
              type="date"
              value={filters.to}
              onChange={(event) => handleFilterChange("to", event.target.value)}
            />
          </label>

          <label className="field compact">
            <span>Agrupamento</span>
            <select
              value={filters.groupBy}
              onChange={(event) => handleFilterChange("groupBy", event.target.value)}
            >
              <option value="day">Dia</option>
              <option value="month">Mes</option>
            </select>
          </label>

          <label className="field compact">
            <span>Top N</span>
            <input
              type="number"
              min="1"
              max="20"
              value={filters.limit}
              onChange={(event) => handleFilterChange("limit", event.target.value)}
            />
          </label>

          <label className="field compact">
            <span>Estoque critico ate</span>
            <input
              type="number"
              min="0"
              step="0.01"
              value={filters.max}
              onChange={(event) => handleFilterChange("max", event.target.value)}
            />
          </label>

          <div className="toolbar-actions">
            <button type="button" className="secondary" onClick={handleClearFilters}>
              Limpar filtros
            </button>
          </div>
        </div>
      </div>

      {loading && <p className="feedback">Carregando insights operacionais...</p>}
      {errorMessage && <p className="feedback">{errorMessage}</p>}

      {!loading && !errorMessage && (
        <>
          <div className="insights-summary-grid">
            {summaryCards.map((card) => (
              <article key={card.label} className="summary-card">
                <span className="summary-card-label">{card.label}</span>
                <strong className="summary-card-value">{card.value}</strong>
              </article>
            ))}
          </div>

          <div className="dashboard-layout">
            <section className="dashboard-section dashboard-section-wide">
              <div className="section-title-row">
                <h3>Vendas por periodo</h3>
                <span className="section-caption">
                  {filters.groupBy === "month" ? "Agrupado por mes" : "Agrupado por dia"}
                </span>
              </div>

              {payload.vendasPorPeriodo.length === 0 ? (
                <p className="empty-state">Nao ha vendas no periodo selecionado.</p>
              ) : (
                <div className="sales-bars">
                  {payload.vendasPorPeriodo.map((item) => (
                    <div key={item.periodo} className="sales-bar-row">
                      <div className="sales-bar-meta">
                        <strong>{item.periodo}</strong>
                        <span>
                          {formatCurrency(item.valor_total)} em {formatNumber(item.quantidade_pedidos)} pedido(s)
                        </span>
                      </div>
                      <div className="sales-bar-track">
                        <div
                          className="sales-bar-fill"
                          style={{ width: `${(Number(item.valor_total || 0) / maxPeriodoValue) * 100}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>

            <section className="dashboard-section">
              <h3>Produtos mais vendidos</h3>
              <SimpleTable
                columns={[
                  { key: "nome_produto", label: "Produto" },
                  { key: "categoria", label: "Categoria" },
                  {
                    key: "quantidade_total_vendida",
                    label: "Quantidade",
                    render: (row) => formatNumber(row.quantidade_total_vendida),
                  },
                  {
                    key: "receita_total",
                    label: "Receita",
                    render: (row) => formatCurrency(row.receita_total),
                  },
                ]}
                rows={payload.produtosMaisVendidos}
                emptyMessage="Nenhum produto vendido no recorte atual."
              />
            </section>

            <section className="dashboard-section">
              <h3>Clientes com maior volume de compra</h3>
              <SimpleTable
                columns={[
                  { key: "nome", label: "Cliente" },
                  {
                    key: "quantidade_pedidos",
                    label: "Pedidos",
                    render: (row) => formatNumber(row.quantidade_pedidos),
                  },
                  {
                    key: "valor_total_gasto",
                    label: "Valor total",
                    render: (row) => formatCurrency(row.valor_total_gasto),
                  },
                  {
                    key: "ticket_medio",
                    label: "Ticket medio",
                    render: (row) => formatCurrency(row.ticket_medio),
                  },
                ]}
                rows={payload.clientesTop}
                emptyMessage="Nenhum cliente com pedidos no recorte selecionado."
              />
            </section>

            <section className="dashboard-section">
              <h3>Categorias com melhor desempenho</h3>
              <SimpleTable
                columns={[
                  { key: "categoria", label: "Categoria" },
                  {
                    key: "quantidade_vendida",
                    label: "Quantidade",
                    render: (row) => formatNumber(row.quantidade_vendida),
                  },
                  {
                    key: "valor_total_vendido",
                    label: "Valor total",
                    render: (row) => formatCurrency(row.valor_total_vendido),
                  },
                ]}
                rows={payload.categorias}
                emptyMessage="Nenhuma categoria encontrada para o periodo."
              />
            </section>

            <section className="dashboard-section">
              <h3>Ingredientes com estoque baixo</h3>
              <SimpleTable
                columns={[
                  { key: "nome", label: "Ingrediente" },
                  { key: "unidade", label: "Unidade" },
                  {
                    key: "quantidade_estoque",
                    label: "Estoque",
                    render: (row) => formatNumber(row.quantidade_estoque),
                  },
                ]}
                rows={payload.estoqueBaixo}
                emptyMessage="Nenhum ingrediente critico com o limiar informado."
              />
            </section>

            <section className="dashboard-section dashboard-section-wide">
              <h3>Produtos afetados por ingredientes criticos</h3>
              <SimpleTable
                columns={[
                  { key: "nome_produto", label: "Produto" },
                  { key: "categoria", label: "Categoria" },
                  { key: "nome_ingrediente", label: "Ingrediente critico" },
                  {
                    key: "quantidade_estoque",
                    label: "Estoque atual",
                    render: (row) => `${formatNumber(row.quantidade_estoque)} ${row.unidade}`,
                  },
                  {
                    key: "quantidade_usada",
                    label: "Uso na receita",
                    render: (row) => `${formatNumber(row.quantidade_usada)} ${row.unidade}`,
                  },
                ]}
                rows={payload.produtosAfetados}
                emptyMessage="Nenhum produto depende de ingrediente abaixo do limiar."
              />
            </section>
          </div>
        </>
      )}
    </section>
  );
}

export default InsightsDashboard;
