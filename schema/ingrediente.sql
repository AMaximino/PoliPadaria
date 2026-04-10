CREATE TABLE IF NOT EXISTS ingredientes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nome TEXT NOT NULL,
  unidade TEXT NOT NULL,
  quantidade_estoque REAL NOT NULL CHECK (quantidade_estoque >= 0)
);
