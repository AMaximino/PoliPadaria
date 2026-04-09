-- ============================================
-- Tabela: Produto
-- Descrição: Armazena os produtos disponíveis
-- ============================================

CREATE TABLE Produto (
    id INT PRIMARY KEY AUTO_INCREMENT,
    nome VARCHAR(120) NOT NULL,
    valor DECIMAL(10,2) NOT NULL,
    Categoria VARCHAR(20) NOT NULL,
    CONSTRAINT chk_preco_positivo CHECK (valor >= 0)
);

-- Índice para busca por nome
CREATE INDEX idx_produto_nome ON Produto(nome);

