CREATE TABLE IF NOT EXISTS produtosIngredientes (
  id_produto INTEGER NOT NULL,
  id_ingrediente INTEGER NOT NULL,
  quantidade REAL NOT NULL CHECK (quantidade > 0),
  PRIMARY KEY (id_produto, id_ingrediente),
  FOREIGN KEY (id_produto) REFERENCES produtos(id) ON UPDATE CASCADE ON DELETE RESTRICT,
  FOREIGN KEY (id_ingrediente) REFERENCES ingredientes(id) ON UPDATE CASCADE ON DELETE RESTRICT
);
