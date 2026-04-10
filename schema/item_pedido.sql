CREATE TABLE IF NOT EXISTS itensPedido (
  id_pedido INTEGER NOT NULL,
  id_produto INTEGER NOT NULL,
  quantidade REAL NOT NULL CHECK (quantidade > 0),
  valor_unitario REAL NOT NULL CHECK (valor_unitario >= 0),
  PRIMARY KEY (id_pedido, id_produto),
  FOREIGN KEY (id_pedido) REFERENCES pedidos(id) ON UPDATE CASCADE ON DELETE RESTRICT,
  FOREIGN KEY (id_produto) REFERENCES produtos(id) ON UPDATE CASCADE ON DELETE RESTRICT
);
