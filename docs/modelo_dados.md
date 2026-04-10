# Modelo de Dados

## Visao geral do modelo relacional

O modelo de dados do PoliPadaria foi construido para representar o fluxo essencial de vendas e composicao de produtos em uma padaria. As tabelas `clientes`, `funcionarios`, `produtos`, `ingredientes` e `pedidos` funcionam como tabelas principais do dominio. Ja `itensPedido` e `produtosIngredientes` exercem papel associativo, conectando entidades e detalhando relacoes de muitos-para-muitos.

Do ponto de vista conceitual, um cliente pode realizar varios pedidos, um funcionario pode registrar varios pedidos, um pedido pode conter varios produtos e um produto pode aparecer em varios pedidos. Da mesma forma, um produto pode utilizar varios ingredientes e um ingrediente pode participar da composicao de varios produtos. Essas duas ultimas relacoes de muitos-para-muitos sao resolvidas por tabelas associativas com chave primaria composta.

## Tabela `clientes`

A tabela `clientes` armazena os dados basicos dos consumidores cadastrados no sistema. Sua finalidade e identificar quem realiza os pedidos e permitir a consulta do historico de compras por cliente.

Principais atributos:

- `id`: identificador numerico autoincremental.
- `nome`: nome do cliente.
- `cpf`: CPF textual do cliente.

A chave primaria e `id`. A coluna `cpf` possui restricao `UNIQUE`, impedindo duplicidade de cadastro para o mesmo documento. As colunas `nome` e `cpf` sao `NOT NULL`, garantindo que o cadastro nao seja gravado sem informacoes essenciais.

## Tabela `funcionarios`

A tabela `funcionarios` registra os colaboradores responsaveis pelo atendimento ou pelo registro dos pedidos. Seu papel no sistema e manter a referencia de quem realizou o lancamento da venda.

Principais atributos:

- `id`: identificador numerico autoincremental.
- `nome`: nome do funcionario.

A chave primaria e `id`. A coluna `nome` e `NOT NULL`. O modelo foi mantido propositalmente simples por se tratar de um projeto academico.

## Tabela `produtos`

A tabela `produtos` representa os itens comercializados pela padaria. Ela funciona como catalogo de venda e referencia tanto os itens dos pedidos quanto a composicao das receitas.

Principais atributos:

- `id`: identificador numerico autoincremental.
- `nome`: nome do produto.
- `valor`: preco atual do produto.
- `categoria`: classificacao do produto, como `Panificacao`, `Confeitaria`, `Salgados` ou `Bebidas`.

A chave primaria e `id`. As colunas `nome`, `valor` e `categoria` sao obrigatorias. A coluna `valor` possui a restricao `CHECK (valor >= 0)`, impedindo cadastro com preco negativo.

## Tabela `ingredientes`

A tabela `ingredientes` armazena os insumos usados na producao dos produtos. Ela permite relacionar ingredientes a receitas e consultar disponibilidade em estoque.

Principais atributos:

- `id`: identificador numerico autoincremental.
- `nome`: nome do ingrediente.
- `unidade`: unidade de medida, como `kg`, `L`, `ml` ou `un`.
- `quantidade_estoque`: quantidade disponivel em estoque.

A chave primaria e `id`. As colunas `nome`, `unidade` e `quantidade_estoque` sao `NOT NULL`. A coluna `quantidade_estoque` possui `CHECK (quantidade_estoque >= 0)`, o que impede estoques negativos.

## Tabela `pedidos`

A tabela `pedidos` registra cada venda realizada no sistema. Ela e a entidade central do processo comercial, ligando cliente, funcionario e total financeiro.

Principais atributos:

- `id`: identificador numerico autoincremental.
- `data`: data e hora do pedido em formato textual ISO local.
- `total`: valor total do pedido.
- `id_cliente`: identificador do cliente responsavel pelo pedido.
- `id_funcionario`: identificador do funcionario que registrou o pedido.

A chave primaria e `id`. As chaves estrangeiras sao `id_cliente`, que referencia `clientes(id)`, e `id_funcionario`, que referencia `funcionarios(id)`. Ambas usam `ON UPDATE CASCADE ON DELETE RESTRICT`, o que permite propagacao de atualizacao de chave e impede exclusao do registro referenciado quando houver pedidos associados. A coluna `total` possui `CHECK (total >= 0)`.

## Tabela `itensPedido`

A tabela `itensPedido` detalha os produtos contidos em cada pedido. Sua funcao e materializar a relacao entre `pedidos` e `produtos`, informando quantidade vendida e valor unitario praticado na venda.

Principais atributos:

- `id_pedido`: identificador do pedido.
- `id_produto`: identificador do produto.
- `quantidade`: quantidade vendida do produto naquele pedido.
- `valor_unitario`: preco unitario do produto no momento do pedido.

A tabela utiliza chave primaria composta por `id_pedido` e `id_produto`. Isso significa que, dentro de um mesmo pedido, um produto nao pode ser repetido em duas linhas distintas. As chaves estrangeiras sao `id_pedido`, que referencia `pedidos(id)`, e `id_produto`, que referencia `produtos(id)`. As restricoes `CHECK (quantidade > 0)` e `CHECK (valor_unitario >= 0)` protegem a consistencia quantitativa e financeira do item.

O uso de PK composta tem papel importante no modelo: alem de garantir unicidade por combinacao, ele expressa que a identidade do item nao depende de um identificador artificial separado, mas da propria associacao entre pedido e produto.

## Tabela `produtosIngredientes`

A tabela `produtosIngredientes` representa a receita de cada produto, conectando produtos aos ingredientes necessarios para sua composicao. Ela resolve a relacao muitos-para-muitos entre `produtos` e `ingredientes`.

Principais atributos:

- `id_produto`: identificador do produto.
- `id_ingrediente`: identificador do ingrediente.
- `quantidade`: quantidade do ingrediente usada na receita.

A chave primaria tambem e composta, formada por `id_produto` e `id_ingrediente`. Isso impede que o mesmo ingrediente seja associado mais de uma vez ao mesmo produto. As chaves estrangeiras apontam para `produtos(id)` e `ingredientes(id)`, novamente com `ON UPDATE CASCADE ON DELETE RESTRICT`. A coluna `quantidade` possui `CHECK (quantidade > 0)`.

Tal como ocorre em `itensPedido`, a PK composta e fundamental porque a identidade do registro decorre da propria associacao entre duas entidades principais.

## Relacionamentos

### Cliente faz Pedido

O relacionamento entre `clientes` e `pedidos` e de um-para-muitos. Um cliente pode possuir varios pedidos, mas cada pedido pertence a um unico cliente. Esse relacionamento e implementado pela FK `pedidos.id_cliente`.

### Funcionario registra Pedido

O relacionamento entre `funcionarios` e `pedidos` tambem e de um-para-muitos. Um funcionario pode registrar varios pedidos, mas cada pedido guarda referencia a apenas um funcionario. Esse vinculo e implementado pela FK `pedidos.id_funcionario`.

### Pedido contem itens

O relacionamento entre `pedidos` e `itensPedido` e de um-para-muitos. Um pedido pode conter varios itens, enquanto cada item pertence a um unico pedido. Esse vinculo e dado por `itensPedido.id_pedido`.

### Item de pedido referencia produto

O relacionamento entre `produtos` e `itensPedido` e de um-para-muitos do ponto de vista do produto: um mesmo produto pode aparecer em muitos itens de pedidos diferentes, enquanto cada item referencia um unico produto. Esse vinculo e dado por `itensPedido.id_produto`.

### Produto e composto por ingredientes

Entre `produtos` e `ingredientes` existe uma relacao conceitual de muitos-para-muitos, implementada pela tabela associativa `produtosIngredientes`. Um produto pode usar varios ingredientes e um ingrediente pode ser reutilizado em varios produtos.

## Integridade referencial

O sistema depende fortemente de integridade referencial. As FKs impedem, por exemplo, a criacao de pedido para cliente inexistente, o cadastro de item com produto nao cadastrado ou a composicao de produto com ingrediente inexistente. No backend, essas regras ainda sao reforcadas com validacao previa de payloads e verificacao de existencia de registros antes das insercoes mais sensiveis, como em `POST /api/pedidos-com-itens`.

No nivel da aplicacao, tambem ha protecao contra campos desconhecidos, tipos invalidos, datas malformadas, numeros fora do limite minimo e chaves primarias mal informadas. No nivel do banco, as restricoes garantem que mesmo um comando SQL executado diretamente nao consiga violar regras basicas sem receber erro.

## Restricoes relevantes do schema

As principais restricoes implementadas no schema atual sao as seguintes:

- `PRIMARY KEY` simples em `clientes`, `funcionarios`, `produtos`, `ingredientes` e `pedidos`.
- `PRIMARY KEY` composta em `itensPedido (id_pedido, id_produto)` e `produtosIngredientes (id_produto, id_ingrediente)`.
- `UNIQUE` em `clientes.cpf`.
- `NOT NULL` em todos os atributos obrigatorios do dominio.
- `CHECK (valor >= 0)` em `produtos.valor`.
- `CHECK (total >= 0)` em `pedidos.total`.
- `CHECK (quantidade > 0)` em `itensPedido.quantidade` e `produtosIngredientes.quantidade`.
- `CHECK (valor_unitario >= 0)` em `itensPedido.valor_unitario`.
- `CHECK (quantidade_estoque >= 0)` em `ingredientes.quantidade_estoque`.

Essas restricoes confirmam que o modelo relacional foi concebido nao apenas para armazenar dados, mas tambem para preservar a consistencia logica do dominio modelado.
