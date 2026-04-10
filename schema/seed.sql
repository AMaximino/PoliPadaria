INSERT INTO clientes (id, nome, cpf) VALUES
  (1, 'Maria Silva', '111.111.111-11'),
  (2, 'Joao Souza', '222.222.222-22');

INSERT INTO funcionarios (id, nome) VALUES
  (1, 'Ana Costa'),
  (2, 'Carlos Lima');

INSERT INTO produtos (id, nome, valor, categoria) VALUES
  (1, 'Pao Frances', 0.9, 'Panificacao'),
  (2, 'Bolo de Cenoura', 28.0, 'Confeitaria'),
  (3, 'Cafe Coado', 5.5, 'Bebidas');

INSERT INTO ingredientes (id, nome, unidade, quantidade_estoque) VALUES
  (1, 'Farinha', 'kg', 50),
  (2, 'Acucar', 'kg', 25),
  (3, 'Fermento', 'kg', 8),
  (4, 'Cafe', 'kg', 6);

INSERT INTO pedidos (id, data, total, id_cliente, id_funcionario) VALUES
  (1, '2026-04-08T09:00', 29.8, 1, 2);

INSERT INTO itensPedido (id_pedido, id_produto, quantidade, valor_unitario) VALUES
  (1, 1, 2, 0.9),
  (1, 2, 1, 28.0);

INSERT INTO produtosIngredientes (id_produto, id_ingrediente, quantidade) VALUES
  (1, 1, 0.2),
  (1, 3, 0.01),
  (2, 1, 0.35),
  (2, 2, 0.2),
  (3, 4, 0.05);
