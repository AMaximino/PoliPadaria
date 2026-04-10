# Relatorio de Atividades

## Introducao

O desenvolvimento do PoliPadaria teve como objetivo principal construir um sistema academico capaz de demonstrar, de forma integrada, conceitos de modelagem de banco de dados, persistencia relacional e exposicao de servicos por API REST. O dominio escolhido foi o de uma rede de padarias, por permitir representar entidades comerciais familiares, relacoes de venda e composicao de produtos, sem perder clareza didatica.

Ao longo do projeto, buscou-se equilibrar simplicidade de implementacao com consistencia tecnica. Por esse motivo, a solucao adotada combina backend em Node.js com Express, banco de dados SQLite local, validacao de entrada no nivel da aplicacao e restricoes de integridade no nivel do banco.

## Levantamento de requisitos

Na etapa inicial, foram identificadas as necessidades centrais do sistema. Era necessario cadastrar clientes, funcionarios, produtos e ingredientes, registrar pedidos, associar produtos aos pedidos e relacionar produtos aos ingredientes usados em sua composicao. Tambem se mostrou importante possibilitar consultas tanto em nivel operacional quanto em nivel academico, o que levou a definicao de rotas de listagem, filtros por atributos e endpoints especializados.

Outro requisito relevante foi permitir experimentacao com volume maior de dados. Essa necessidade motivou a criacao posterior de um gerador automatizado de massa mock, capaz de preencher o banco com registros coerentes e reutilizaveis em demonstracoes e testes.

## Modelagem do banco

A modelagem relacional foi estruturada em torno de sete tabelas: `clientes`, `funcionarios`, `pedidos`, `itensPedido`, `produtos`, `produtosIngredientes` e `ingredientes`. As tabelas `itensPedido` e `produtosIngredientes` foram definidas como associativas, com chaves primarias compostas, para representar corretamente relacoes muitos-para-muitos.

Durante essa fase, tambem foram definidas as restricoes essenciais do schema, como `NOT NULL`, `UNIQUE` para CPF, `CHECK` para impedir valores negativos ou quantidades invalidas e `FOREIGN KEY` para garantir consistencia entre pedidos, clientes, funcionarios, produtos e ingredientes. A opcao por `ON DELETE RESTRICT` reforcou a ideia de preservacao historica dos registros vinculados.

## Implementacao do backend

Com o modelo relacional definido, o backend foi implementado em Node.js com Express. A arquitetura foi mantida simples, mas com responsabilidades bem separadas. O servidor HTTP passou a concentrar as rotas e o tratamento de erros, enquanto a camada de banco centralizou inicializacao do schema, operacoes CRUD e consultas de dominio.

Um ponto importante da implementacao foi a criacao de um metadata central das entidades. Em vez de duplicar regras em varios pontos do codigo, o projeto passou a descrever cada tabela em `dataModel.js`, informando chaves, campos permitidos, regras de validacao, SQL de criacao e ordenacao padrao. Essa estrategia facilitou a manutencao e tornou possivel um CRUD generico consistente entre todas as colecoes.

## Definicao da API

A API foi desenhada em dois niveis. O primeiro nivel contem rotas genericas, como `GET /api/:collection`, `POST /api/:collection`, `PUT`, `PATCH` e `DELETE`, permitindo operar sobre qualquer entidade conhecida pelo modelo. O segundo nivel contem rotas de dominio, usadas quando a consulta depende de juncoes ou de comportamento transacional especifico.

Entre as rotas especializadas implementadas, destacam-se a consulta dos itens de um pedido, a consulta dos ingredientes de um produto, a consulta do historico de pedidos de um cliente, a listagem de ingredientes com baixo estoque e a criacao de pedido com itens em uma unica transacao. Tambem foi mantido um endpoint auxiliar de SQL para fins de inspecao e estudo da disciplina.

## Validacoes e integridade

Uma preocupacao recorrente durante o desenvolvimento foi evitar inconsistencias entre a camada HTTP e a camada relacional. Para isso, o backend passou a validar payloads antes de executar operacoes no SQLite. O sistema verifica se o corpo recebido e um objeto JSON valido, rejeita campos desconhecidos, exige atributos obrigatorios, normaliza texto, numeros e datas e interpreta corretamente chaves primarias simples e compostas.

No caso da criacao transacional de pedidos, a validacao vai alem da tipagem. O backend confere se cliente, funcionario e produtos informados existem, se o pedido possui ao menos um item e se o mesmo produto nao foi repetido no array de itens. O banco, por sua vez, reforca essas regras com suas restricoes nativas, funcionando como camada final de seguranca.

## Geracao de massa de dados

Com o backend funcional, observou-se que o seed inicial era util apenas para verificacoes basicas. Para permitir consultas mais significativas, foi desenvolvido um gerador de dados mock. Esse gerador foi planejado para respeitar o dominio do sistema, produzindo nomes de pessoas plausiveis, CPFs falsos unicos, catalogos realistas de ingredientes, receitas coerentes e distribuicao temporal de pedidos em horarios tipicos de uma padaria.

Tambem foi incorporado o conceito de seed reproduzivel, de modo que os mesmos parametros produzam o mesmo dataset. Essa decisao contribui para testes repetiveis, comparacao entre resultados e estabilidade da documentacao academica.

## Testes e validacao do sistema

A validacao do sistema ocorreu por meio da execucao local do backend, uso dos seeds iniciais, geracao de massa mock e chamadas diretas aos endpoints HTTP. Foram confirmados o funcionamento das rotas basicas, a leitura do estado geral, a aplicacao de filtros, a consulta de relacoes por `JOIN`, o endpoint de SQL auxiliar e a criacao transacional de pedidos com itens.

Tambem foi verificado o comportamento de erros esperados, como tentativas de inserir dados duplicados, violacoes de chave estrangeira, envio de SQL invalido e uso de filtros nao permitidos. Esse processo demonstrou que o sistema nao apenas opera em cenarios validos, mas tambem responde adequadamente a entradas inconsistentes.

## Dificuldades encontradas

Uma das principais dificuldades do projeto esteve na conciliacao entre simplicidade academica e consistencia tecnica. Um CRUD generico, por exemplo, reduz repeticao de codigo, mas exige um metadata robusto para impedir operacoes invalidas. Outro desafio foi preservar historico de preco nos pedidos, o que levou a inclusao da coluna `valor_unitario` em `itensPedido`.

Tambem houve a necessidade de manter compatibilidade com bases locais anteriores. Por isso, a inicializacao do banco passou a prever reconstrucao controlada do schema quando a versao armazenada for inferior a versao atual, preservando dados conhecidos do projeto.

## Decisoes de projeto

Entre as decisoes mais importantes, destacam-se a escolha de SQLite pela leveza e facilidade de distribuicao, a escolha de Express pela simplicidade da camada HTTP, a centralizacao do metadata das entidades em um unico arquivo, o uso de validacao antes da gravacao e a inclusao de endpoints de dominio para consultas mais ricas.

Tambem foi decisiva a opcao por manter `POST /api/sql` como endpoint auxiliar. Embora nao se trate de pratica recomendada para ambiente produtivo, sua existencia faz sentido no contexto da disciplina, pois simplifica a demonstracao de comandos SQL sobre a mesma base usada pela aplicacao.

## Resultados obtidos

O resultado final foi um backend funcional, com schema relacional consistente, suporte a operacoes CRUD, consultas especializadas, validacao de entrada, tratamento de erros e geracao de dados mock em diferentes escalas. O projeto consegue demonstrar, na pratica, como entidades e relacionamentos de um dominio comercial podem ser convertidos em um banco relacional navegavel tanto por SQL quanto por API.

Os resultados tambem indicam que a estrutura adotada favorece manutencao e extensao. Novas entidades ou novos filtros podem ser incorporados com baixo custo relativo, desde que respeitem o padrao ja estabelecido pelo metadata e pela camada de banco.

## Conclusao

O PoliPadaria atingiu seu objetivo como projeto academico de bancos de dados e backend. A aplicacao traduz de maneira clara um dominio realista para um modelo relacional, implementa regras de integridade importantes e oferece meios praticos de consulta, teste e demonstracao. A incorporacao de massa de dados automatizada ampliou significativamente o valor pedagogico da solucao.

Em sintese, o projeto nao apenas entrega um sistema executavel, mas tambem um estudo aplicado de modelagem relacional, acesso a dados e exposicao de servicos, adequado ao contexto universitario em que foi concebido.
