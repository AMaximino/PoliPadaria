import { useMemo, useState } from "react";
import { executeSqlQuery } from "../utils/api";

const EXAMPLE_QUERY = "SELECT id, nome FROM clientes ORDER BY id LIMIT 10;";

function SqlConsole() {
  const [query, setQuery] = useState(EXAMPLE_QUERY);
  const [running, setRunning] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [result, setResult] = useState(null);

  const columns = useMemo(() => {
    if (!result || result.mode !== "read" || !Array.isArray(result.rows) || result.rows.length === 0) {
      return [];
    }
    return Object.keys(result.rows[0]);
  }, [result]);

  async function handleRunQuery() {
    setRunning(true);
    setErrorMessage("");

    try {
      const payload = await executeSqlQuery(query);
      setResult(payload);
    } catch (error) {
      setResult(null);
      setErrorMessage(error.message || "Falha ao executar a query SQL.");
    } finally {
      setRunning(false);
    }
  }

  function handleClear() {
    setQuery("");
    setResult(null);
    setErrorMessage("");
  }

  return (
    <section className="entity-panel sql-panel">
      <h2>Console SQL</h2>
      <p className="sql-hint">
        Digite uma query SQL pura para executar no banco SQLite. Apenas uma instrucao por execucao.
      </p>

      <label className="field sql-field">
        <span>Query</span>
        <textarea
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="SELECT * FROM clientes;"
          rows={8}
          spellCheck={false}
        />
      </label>

      <div className="form-actions">
        <button type="button" onClick={handleRunQuery} disabled={running}>
          {running ? "Executando..." : "Executar"}
        </button>
        <button type="button" className="secondary" onClick={handleClear} disabled={running}>
          Limpar
        </button>
      </div>

      {errorMessage && <p className="feedback">{errorMessage}</p>}

      {result && result.mode === "write" && (
        <div className="sql-summary">
          <p>
            Instrucao executada com sucesso. Linhas afetadas: <strong>{result.changes}</strong>
          </p>
          {result.lastInsertRowid !== null && (
            <p>
              Ultimo ID inserido: <strong>{result.lastInsertRowid}</strong>
            </p>
          )}
        </div>
      )}

      {result && result.mode === "read" && (
        <>
          <p className="sql-summary">
            Consulta executada com sucesso. Registros retornados: <strong>{result.rowCount}</strong>
          </p>

          <div className="table-container">
            <table>
              <thead>
                <tr>
                  {columns.map((column) => (
                    <th key={column}>{column}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {result.rows.length === 0 && (
                  <tr>
                    <td colSpan={Math.max(1, columns.length)}>Nenhum registro encontrado.</td>
                  </tr>
                )}

                {result.rows.map((row, index) => (
                  <tr key={`${index}-${JSON.stringify(row)}`}>
                    {columns.map((column) => (
                      <td key={column}>{String(row[column] ?? "")}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <details>
            <summary>Ver resultado bruto (JSON)</summary>
            <pre className="sql-raw-result">{JSON.stringify(result, null, 2)}</pre>
          </details>
        </>
      )}
    </section>
  );
}

export default SqlConsole;
