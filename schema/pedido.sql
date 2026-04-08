-- ============================================
-- Tabela: Pedido
-- Descrição: Armazena pedidos realizados pelos clientes
-- ============================================

CREATE TABLE Pedido (
    id INT AUTO_INCREMENT,
    cliente_id INT NOT NULL,
    data_pedido TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(50) DEFAULT 'PENDENTE',
    valor_total DECIMAL(10,2) DEFAULT 0,

    CONSTRAINT pk_pedido PRIMARY KEY (id),

    CONSTRAINT fk_pedido_cliente
        FOREIGN KEY (cliente_id)
        REFERENCES Cliente(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,

    CONSTRAINT chk_valor_total CHECK (valor_total >= 0)
);

-- Índices úteis
CREATE INDEX idx_pedido_cliente ON Pedido(cliente_id);
CREATE INDEX idx_pedido_data ON Pedido(data_pedido);