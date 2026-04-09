-- ============================================
-- Tabela: Item Pedido
-- Descrição: Relaciona apenas um item de um produto
-- ============================================

CREATE TABLE Item_Pedido (
    id INT AUTO_INCREMENT,
    id_pedido INT NOT NULL,
    id_produto INT NOT NULL,
    quantidade INT DEFAULT 0,

    CONSTRAINT pk_item_pedido PRIMARY KEY (id),

    CONSTRAINT fk_item_pedido_pedido
        FOREIGN KEY (id_pedido)
        REFERENCES Pedido(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,

    CONSTRAINT fk_item_pedido_produto
        FOREIGN KEY (id_produto)
        REFERENCES Pedido(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,

    CONSTRAINT chk_valor_total CHECK (valor_total >= 0)
);

-- Índices úteis
CREATE INDEX idx_item_pedido_pedido ON Item_Pedido(id_pedido);
CREATE INDEX idx_item_pedido_produto ON Item_Pedido(id_produto);
CREATE INDEX idx_item_pedido_quantidade ON Item_Pedido(quantidade);