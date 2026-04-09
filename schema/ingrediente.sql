-- ============================================
-- Tabela: Ingrediente
-- Descrição: Armazena os ingredientes
-- ============================================
CREATE TABLE Ingrediente(
    id int PRIMARY KEY AUTOINCREMENT,
    nome VARCHAR(30) NOT NULL,
    unidade VARCHAR(20) NOT NULL,
    quantidade_Estoque INT,
    CONSTRAINT chk_Quantidade_Estoque CHECK (Quantidade_Estoque >= 0),
);
-- Índices úteis
CREATE INDEX idx_ingrediente_nome ON Ingrediente (nome);