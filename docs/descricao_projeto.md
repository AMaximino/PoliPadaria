# Descricao do Projeto

## Visao geral

O PoliPadaria e um sistema academico de apoio ao estudo de modelagem relacional e desenvolvimento de backend para banco de dados. O projeto representa, de forma didatica, a operacao basica de uma rede de padarias e organiza informacoes de clientes, funcionarios, produtos, ingredientes, pedidos e composicao dos produtos vendidos. A proposta central consiste em demonstrar como um dominio comercial relativamente simples pode ser traduzido para um modelo relacional consistente e exposto por meio de uma API REST.

No contexto de uso adotado, a rede de padarias precisa registrar quem compra, quem atende, quais produtos sao ofertados, quais ingredientes compoem cada item comercializado e quais pedidos foram efetivamente realizados. Com isso, o sistema atende necessidades classicas de controle operacional: cadastro de entidades basicas, consulta de pedidos, detalhamento de itens vendidos, consulta de estoque em nivel de ingrediente e observacao do relacionamento entre venda e composicao de produtos.

## Problema que o sistema resolve

O problema tratado pelo PoliPadaria e a organizacao estruturada de dados de uma operacao de vendas em padarias, substituindo um controle informal por um modelo relacional normalizado e consultavel. Em termos academicos, o projeto permite demonstrar a aplicacao de conceitos de entidades, relacionamentos, chaves primarias, chaves estrangeiras, integridade referencial, tabelas associativas e consultas com juncoes. Em termos tecnicos, o sistema oferece um backend capaz de persistir dados em SQLite, aplicar validacoes antes da gravacao e disponibilizar acesso padronizado por HTTP.

## Dominio modelado

As entidades principais do sistema sao `clientes`, `funcionarios`, `pedidos`, `itensPedido`, `produtos`, `produtosIngredientes` e `ingredientes`. Clientes representam os consumidores cadastrados. Funcionarios representam os atendentes ou operadores responsaveis pelo registro dos pedidos. Produtos representam os itens comercializados pela padaria, como paes, bolos, bebidas e salgados. Ingredientes representam insumos utilizados na producao. Pedidos registram a venda realizada, com data, total e referencias ao cliente e ao funcionario. Itens de pedido detalham quais produtos compoem cada pedido. A tabela de composicao `produtosIngredientes` conecta produtos a seus ingredientes e informa a quantidade usada em cada receita.

## Operacoes principais

Do ponto de vista funcional, o backend implementa operacoes CRUD genericas para todas as colecoes do dominio. Isso permite listar, criar, atualizar integralmente, atualizar parcialmente e excluir registros de todas as tabelas cadastradas. Alem desse CRUD basico, o sistema possui endpoints especificos de dominio, como consulta dos itens de um pedido, consulta dos ingredientes de um produto, consulta dos pedidos de um cliente, listagem de ingredientes com baixo estoque e criacao transacional de um pedido com seus itens.

A API tambem suporta filtros por igualdade, busca textual parcial, filtros por faixa numerica, filtros por periodo de data, ordenacao e paginacao. Dessa forma, o sistema nao se limita a apenas gravar dados: ele tambem demonstra tecnicas de consulta controlada e validada sobre um conjunto relacional coerente.

## Relacao entre backend, banco e API

O backend foi desenvolvido em Node.js com Express e utiliza SQLite local por meio do modulo `node:sqlite`. O arquivo [database.js](/home/enoch/projects/PoliPadaria/backend/src/database.js) atua como camada de acesso ao banco, centralizando inicializacao do schema, execucao de consultas, validacao de colecoes, montagens de filtros, operacoes CRUD e rotas de dominio. O arquivo [server.js](/home/enoch/projects/PoliPadaria/backend/src/server.js) expõe os endpoints HTTP e converte erros tecnicos e de regra em respostas apropriadas para o cliente.

O banco relacional armazena os dados persistidos no arquivo `backend/data/polipadaria.sqlite3`. A API REST e a interface de acesso aos dados. Assim, o fluxo logico do sistema e: o cliente envia uma requisicao HTTP, o servidor valida o payload e os parametros, a camada de banco executa a operacao correspondente em SQLite, e a API devolve os dados em formato JSON.

## Decisoes de projeto

Uma decisao importante do projeto foi concentrar a definicao estrutural das entidades no arquivo [dataModel.js](/home/enoch/projects/PoliPadaria/backend/src/dataModel.js). Nesse arquivo ficam declarados nome da colecao, chave primaria, colunas permitidas em insercao e atualizacao, regras de validacao, ordenacao padrao, SQL de criacao de tabela e seeds minimos. Essa abordagem reduz duplicacao de logica, porque o mesmo metadata alimenta tanto a validacao dos payloads quanto a geracao de queries do CRUD generico.

Outra decisao relevante foi manter regras de integridade em duas camadas. A primeira camada fica na aplicacao, que valida tipos, obrigatoriedade, campos desconhecidos e formatos aceitos. A segunda camada fica no banco, por meio de `PRIMARY KEY`, `FOREIGN KEY`, `UNIQUE`, `NOT NULL` e `CHECK`. Com isso, o sistema permanece didatico e ao mesmo tempo reforca o uso de boas praticas de consistencia.

Tambem merece destaque a inclusao de `valor_unitario` em `itensPedido`. Essa coluna preserva o preco do produto no momento da venda, evitando que alteracoes futuras no cadastro de produtos prejudiquem o historico dos pedidos. Trata-se de uma decisao importante de modelagem, pois separa o preco corrente do produto do preco efetivamente praticado em cada venda.

## Justificativa do uso de Node.js e SQLite

O uso de Node.js foi adequado ao objetivo do projeto por permitir desenvolvimento rapido, codigo relativamente enxuto e boa integracao com APIs REST. Como o foco e academico, a combinacao com Express favorece clareza estrutural e aprendizado, pois as rotas, middlewares e respostas HTTP ficam expostas de maneira simples.

SQLite foi escolhido por ser um banco relacional leve, embarcado e suficiente para um sistema de pequeno porte usado em contexto de disciplina. O banco nao exige servidor separado, simplifica a execucao local, facilita a distribuicao do projeto e ainda oferece suporte a chaves estrangeiras, restricoes e linguagem SQL padrao, o que o torna apropriado para demonstracoes de modelagem e consultas.

## Escopo do sistema

O escopo implementado concentra-se no backend e no banco de dados. O projeto cobre modelagem relacional, criacao e leitura de registros, relacoes entre entidades, consultas especializadas, validacoes e geracao automatizada de massa de dados. Existe tambem um frontend React no repositorio, mas o nucleo funcional solicitado e sustentado pelo backend REST e pelo SQLite.

Nao fazem parte do escopo funcionalidades tipicas de um sistema comercial completo, como autenticacao, controle de permissoes por perfil, baixa automatica de estoque por venda, faturamento fiscal, modulo financeiro, relatorios gerenciais avancados ou integracao com multiplas filiais. O foco permanece na representacao relacional do dominio e no acesso aos dados por API.

## Simplificacoes adotadas

Por se tratar de um projeto academico, algumas simplificacoes foram assumidas. O cadastro de funcionarios contem apenas identificador e nome. O cadastro de clientes utiliza nome e CPF, sem dados de endereco ou contato. O estoque e modelado em nivel de ingrediente, mas as vendas nao consomem automaticamente esse estoque. O sistema nao diferencia unidades operacionais de uma rede real de padarias, embora o dominio tenha sido descrito nesse contexto. Alem disso, o endpoint `/api/sql` foi mantido como recurso auxiliar e administrativo para fins de testes e estudo, embora tal pratica nao fosse recomendada em um ambiente de producao.

Ainda assim, mesmo com essas simplificacoes, o PoliPadaria cumpre bem o papel de projeto universitario, pois articula de forma coerente modelagem de dados, integridade relacional, consultas SQL, API REST e geracao automatizada de dados de teste.
