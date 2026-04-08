-- ============================================
-- Tabela: Produto
-- Descrição: Armazena os produtos disponíveis
-- ============================================

CREATE TABLE Produto (
    id INT AUTO_INCREMENT,
    nome VARCHAR(120) NOT NULL,
    descricao TEXT,
    preco DECIMAL(10,2) NOT NULL,
    estoque INT DEFAULT 0,
    ativo BOOLEAN DEFAULT TRUE,

    CONSTRAINT pk_produto PRIMARY KEY (id),
    CONSTRAINT chk_preco_positivo CHECK (preco >= 0),
    CONSTRAINT chk_estoque_positivo CHECK (estoque >= 0)
);

-- Índice para busca por nome
CREATE INDEX idx_produto_nome ON Produto(nome);

-- ============================================
-- Exemplo de inserção
-- ============================================

-- INSERT INTO Produto (nome, preco, estoque)
-- VALUES ('Notebook', 3500.00, 10);