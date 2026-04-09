-- ============================================
-- Tabela: Produto Ingrediente
-- Descrição: Relaciona um produto com vários itens de ingredientes
-- ============================================

CREATE TABLE Produto_Ingrediente (
    id_produto INT,
    id_ingrediente INT,
    quantidade DECIMAL(10,2),
    PRIMARY KEY (id_produto, id_ingrediente),
    FOREIGN KEY (id_produto) REFERENCES Produto(id_produto),
    FOREIGN KEY (id_ingrediente) REFERENCES Ingrediente(id_ingrediente)
);

-- Índices úteis
CREATE INDEX idx_produto_ingrediente_quantidade ON Produto_Ingrediente(quantidade);
