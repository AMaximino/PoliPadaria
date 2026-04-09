-- ============================================
-- Tabela: Funcionario
-- Descrição: Armazena os dados dos funcionários
-- ============================================

CREATE TABLE Funcionario (
    id INT PRIMARY KEY AUTO_INCREMENT,
    nome VARCHAR(100) NOT NULL,
    data_cadastro TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- Índices adicionais (opcional)
-- ============================================

CREATE INDEX idx_funcionario_nome ON Funcionario(nome);

-- ============================================
-- Exemplo de inserção (opcional - para teste)
-- ============================================

-- INSERT INTO Funcionario (nome)
-- VALUES ('André Maximino');