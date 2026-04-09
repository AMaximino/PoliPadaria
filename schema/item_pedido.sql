-- ============================================
-- Tabela: Item Pedido
-- Descrição: Relaciona apenas um item de um pedido
-- ============================================
CREATE TABLE Item_Pedido (
    id_pedido INT,
    id_produto INT,
    quantidade DECIMAL(10,2),
    PRIMARY KEY (id_pedido, id_produto),
    FOREIGN KEY (id_pedido) REFERENCES Pedido(id_pedido),
    FOREIGN KEY (id_produto) REFERENCES Produto(id_produto)
);

-- Índices úteis
CREATE INDEX idx_item_pedido_quantidade ON Item_Pedido(quantidade);