-- ============================================
-- Tabela: Cliente
-- Descrição: Armazena os dados dos clientes
-- ============================================

CREATE TABLE Cliente (
    id INT PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    telefone VARCHAR(20),
    data_cadastro TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- Índices adicionais (opcional)
-- ============================================

CREATE INDEX idx_cliente_nome ON Cliente(nome);

-- ============================================
-- Exemplo de inserção (opcional - para teste)
-- ============================================

-- INSERT INTO Cliente (nome, email, telefone)
-- VALUES ('André Maximino', 'andre@email.com', '11999999999');