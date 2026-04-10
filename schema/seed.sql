INSERT INTO clientes (id, nome, cpf) VALUES
  (1, 'Maria Silva', '111.111.111-11'),
  (2, 'Joao Souza', '222.222.222-22'),
  (3, 'Paula Mendes', '333.333.333-33'),
  (4, 'Rafael Martins', '444.444.444-44'),
  (5, 'Camila Rocha', '555.555.555-55'),
  (6, 'Bruno Almeida', '666.666.666-66'),
  (7, 'Lucia Fernandes', '777.777.777-77'),
  (8, 'Igor Ribeiro', '888.888.888-88'),
  (9, 'Marina Oliveira', '999.999.999-99'),
  (10, 'Thiago Nunes', '101.101.101-10');

INSERT INTO funcionarios (id, nome) VALUES
  (1, 'Ana Costa'),
  (2, 'Carlos Lima'),
  (3, 'Beatriz Prado'),
  (4, 'Daniel Moraes'),
  (5, 'Elaine Barros'),
  (6, 'Felipe Araujo'),
  (7, 'Gabriela Pinto'),
  (8, 'Henrique Torres'),
  (9, 'Isabela Gomes'),
  (10, 'Juliano Teixeira');

INSERT INTO produtos (id, nome, valor, categoria) VALUES
  (1, 'Pao Frances', 0.9, 'Panificacao'),
  (2, 'Bolo de Cenoura', 28.0, 'Confeitaria'),
  (3, 'Cafe Coado', 5.5, 'Bebidas'),
  (4, 'Croissant de Manteiga', 8.5, 'Panificacao'),
  (5, 'Sonho de Creme', 7.0, 'Confeitaria'),
  (6, 'Quiche de Alho-Poro', 18.0, 'Salgados'),
  (7, 'Pao Integral', 1.4, 'Panificacao'),
  (8, 'Brigadeiro Gourmet', 3.5, 'Confeitaria'),
  (9, 'Suco de Laranja', 6.0, 'Bebidas'),
  (10, 'Empada de Frango', 9.0, 'Salgados');

INSERT INTO ingredientes (id, nome, unidade, quantidade_estoque) VALUES
  (1, 'Farinha', 'kg', 50),
  (2, 'Acucar', 'kg', 25),
  (3, 'Fermento', 'kg', 8),
  (4, 'Cafe', 'kg', 6),
  (5, 'Ovos', 'un', 120),
  (6, 'Leite', 'l', 40),
  (7, 'Manteiga', 'kg', 15),
  (8, 'Chocolate', 'kg', 12),
  (9, 'Frango', 'kg', 18),
  (10, 'Laranja', 'kg', 20);

INSERT INTO pedidos (id, data, total, id_cliente, id_funcionario) VALUES
  (1, '2026-04-08T09:00', 1.8, 1, 2),
  (2, '2026-04-08T10:10', 28.0, 2, 1),
  (3, '2026-04-08T11:35', 11.0, 3, 3),
  (4, '2026-04-08T13:20', 8.5, 4, 4),
  (5, '2026-04-08T15:00', 21.0, 5, 5),
  (6, '2026-04-08T16:25', 18.0, 6, 6),
  (7, '2026-04-08T17:10', 8.4, 7, 7),
  (8, '2026-04-08T18:05', 35.0, 8, 8),
  (9, '2026-04-08T19:30', 12.0, 9, 9),
  (10, '2026-04-08T20:15', 18.0, 10, 10);

INSERT INTO itensPedido (id_pedido, id_produto, quantidade, valor_unitario) VALUES
  (1, 1, 2, 0.9),
  (2, 2, 1, 28.0),
  (3, 3, 2, 5.5),
  (4, 4, 1, 8.5),
  (5, 5, 3, 7.0),
  (6, 6, 1, 18.0),
  (7, 7, 6, 1.4),
  (8, 8, 10, 3.5),
  (9, 9, 2, 6.0),
  (10, 10, 2, 9.0);

INSERT INTO produtosIngredientes (id_produto, id_ingrediente, quantidade) VALUES
  (1, 1, 0.2),
  (1, 3, 0.01),
  (2, 1, 0.35),
  (2, 2, 0.2),
  (3, 4, 0.05),
  (2, 5, 3),
  (3, 2, 0.01),
  (4, 1, 0.12),
  (4, 7, 0.03),
  (5, 1, 0.1),
  (5, 2, 0.08),
  (5, 6, 0.05),
  (6, 1, 0.15),
  (6, 9, 0.12),
  (6, 6, 0.03),
  (7, 1, 0.25),
  (7, 3, 0.01),
  (8, 8, 0.04),
  (8, 2, 0.02),
  (9, 10, 0.2),
  (10, 1, 0.1),
  (10, 9, 0.08);
