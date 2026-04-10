SELECT
  p.id AS id_pedido,
  c.nome AS cliente,
  f.nome AS funcionario,
  p.data,
  p.total
FROM pedidos p
INNER JOIN clientes c ON c.id = p.id_cliente
INNER JOIN funcionarios f ON f.id = p.id_funcionario
ORDER BY p.data DESC;
