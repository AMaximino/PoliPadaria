# Geracao de Dados Mock

## Finalidade da geracao automatizada

A geracao de dados mock foi incorporada ao PoliPadaria para viabilizar testes, demonstracoes e validacao do modelo com uma massa de dados maior e mais variada do que o pequeno seed inicial do projeto. Em um contexto academico, essa etapa e especialmente importante porque permite submeter consultas SQL, exercitar filtros da API, avaliar o comportamento das relacoes entre tabelas e demonstrar o funcionamento do sistema em um cenario mais proximo de uma operacao real.

O script responsavel por esse processo e [seedMockData.js](/home/enoch/projects/PoliPadaria/backend/scripts/seedMockData.js), que utiliza o gerador definido em [generator.js](/home/enoch/projects/PoliPadaria/backend/src/mockData/generator.js), os catalogos em [catalogs.js](/home/enoch/projects/PoliPadaria/backend/src/mockData/catalogs.js) e um gerador pseudoaleatorio deterministico em [random.js](/home/enoch/projects/PoliPadaria/backend/src/mockData/random.js).

## Entidades geradas

O processo automatizado gera registros para as seguintes entidades:

- `clientes`
- `funcionarios`
- `ingredientes`
- `produtos`
- `produtosIngredientes`
- `pedidos`
- `itensPedido`

Essa ordem nao e arbitraria. Ela respeita as dependencias impostas por chaves estrangeiras. Primeiro sao geradas as tabelas sem dependencia externa direta, como clientes, funcionarios, ingredientes e produtos. Em seguida, sao construidas as tabelas associativas e transacionais, como `produtosIngredientes`, `pedidos` e `itensPedido`.

## Ordem de geracao e respeito as chaves estrangeiras

A logica de geracao segue uma sequencia que preserva a integridade referencial. Inicialmente, o script determina os proximos identificadores disponiveis em cada tabela, o que permite tanto recriar o banco do zero quanto adicionar novos dados por append. Depois disso:

1. sao gerados clientes e funcionarios;
2. sao gerados ingredientes;
3. sao gerados produtos compativeis com os ingredientes disponiveis;
4. e montada a tabela `produtosIngredientes`, que funciona como receita dos produtos;
5. sao gerados pedidos referenciando clientes e funcionarios existentes;
6. sao gerados itens de pedido referenciando pedidos e produtos validos.

Essa sequencia garante que toda FK apontara para um registro ja existente no momento da insercao.

## Reprodutibilidade por seed

Um aspecto importante da abordagem adotada e a reprodutibilidade. O sistema utiliza um gerador pseudoaleatorio interno baseado em seed textual. Isso significa que, com os mesmos parametros de tamanho, seed e janela de dias, o conjunto de dados gerado sera o mesmo. Para reforcar esse comportamento, o gerador utiliza uma data de referencia fixa (`2026-04-09T23:59:59`) e distribui os pedidos para tras dentro do intervalo especificado.

Esse cuidado e particularmente util em entregas academicas, porque permite reproduzir experimentos, manter coerencia entre relatorios e capturas de tela e comparar resultados de consultas ao longo do tempo.

## Catalogos fixos e aleatoriedade controlada

A estrategia de geracao combina catalogos fixos com variacao estatistica controlada. Os catalogos definem vocabulario, ingredientes, familias de produto, faixas de estoque, categorias e receitas-base. A aleatoriedade atua sobre a selecao de nomes, composicao final dos produtos, pequenas variacoes de preco, popularidade relativa, horarios de pedido e quantidade de itens comprados.

Essa combinacao evita que o resultado pareca inteiramente arbitrario. Em vez de nomes ou produtos puramente artificiais, o sistema monta dados plausiveis a partir de um repertorio de padaria, como paes, bolos, cafe, salgados, recheios e ingredientes culinarios.

## Geracao de clientes e funcionarios

Clientes e funcionarios recebem nomes compostos a partir de catalogos de primeiros nomes e sobrenomes comuns. O gerador evita repeticoes simples ao trabalhar com combinacoes e conjuntos unicos. No caso dos clientes, cada registro tambem recebe um CPF falso, mas unico, construido a partir de uma transformacao deterministica do indice do registro. Esse CPF nao busca validacao civil real; seu objetivo e apenas atender ao papel de identificador textual consistente dentro do sistema.

Tanto clientes quanto funcionarios tambem recebem pesos internos de escolha. Esses pesos nao sao gravados na base final, mas sao usados durante a simulacao dos pedidos para tornar alguns clientes e alguns funcionarios mais frequentes do que outros.

## Geracao de ingredientes

Os ingredientes sao gerados a partir de um catalogo fixo que contem nome, unidade e faixa de estoque plausivel. O script sorteia a quantidade inicial dentro dessa faixa, preservando a unidade de medida adequada. Assim, ingredientes vendidos ou consumidos em quilos usam valores com casas decimais, enquanto itens unitarios, como ovos, sao gerados como quantidades inteiras.

Essa decisao melhora a consistencia semantica da base e produz exemplos mais realistas para consultas de estoque baixo.

## Geracao de produtos e receitas

Os produtos sao construidos a partir de familias de produto, como panificacao, confeitaria, salgados e bebidas. Cada familia possui um nome-base, categoria, preco-base, nivel de popularidade, faixa de quantidade vendida por item e receita-base. A partir dessas familias surgem variantes, como tipos tradicionais, integrais, recheados, minis, especiais ou premium.

Antes de gerar um produto, o sistema verifica se todos os ingredientes necessarios para aquela receita estao disponiveis no conjunto de ingredientes gerado. Somente combinacoes validas sao consideradas candidatas. Em seguida, o algoritmo seleciona produtos usando amostragem ponderada por popularidade, o que torna certos produtos mais provaveis do que outros, preservando diversidade sem perder plausibilidade comercial.

O preco final do produto nao e fixado exatamente no preco-base. Ha um pequeno fator de variacao controlada, o que evita uma base excessivamente uniforme e torna os dados mais proximos de uma operacao real.

## Geracao da tabela `produtosIngredientes`

Depois que os produtos sao definidos, suas receitas sao convertidas automaticamente em linhas da tabela `produtosIngredientes`. Cada linha registra a relacao entre um produto e um ingrediente, bem como a quantidade utilizada. Como as receitas sao derivadas de catalogos estruturados, a tabela associativa tambem nasce de forma consistente, sem violar a PK composta e sem depender de insercao manual.

## Geracao de pedidos e itens

Os pedidos sao gerados com base em uma distribuicao temporal plausivel para padarias. Em vez de horarios aleatorios uniformes, o algoritmo privilegia faixas como inicio da manha, horario de almoco, meio da tarde e inicio da noite. Com isso, os registros ficam concentrados em janelas mais criveis de consumo.

Cada pedido seleciona um cliente e um funcionario por peso, o que cria recorrencia controlada. O numero de itens por pedido tambem segue distribuicao ponderada, favorecendo pedidos pequenos e medios, com menor incidencia de pedidos muito grandes. Dentro de cada pedido, os produtos escolhidos sao amostrados sem repeticao, o que impede que o mesmo produto apareca duas vezes como linhas distintas no mesmo pedido e preserva a regra da PK composta de `itensPedido`.

## Quantidades, produtos populares e plausibilidade comercial

A quantidade de cada produto dentro de um pedido e definida a partir da faixa de consumo associada a cada familia. Produtos de consumo rapido, como pao frances e cafe, admitem quantidades maiores. Ja bolos inteiros, quiches ou tortas tendem a aparecer com quantidades menores. Essa escolha melhora a coerencia estatistica da base.

O sistema tambem considera popularidade relativa dos produtos. Itens como cafe coado e paes tradicionais recebem pesos maiores, tornando-se mais frequentes nas vendas simuladas. Produtos mais especializados ou premium aparecem com menor incidencia. Como resultado, consultas de ranking de vendas, faturamento e analise de mix tendem a produzir resultados mais convincentes.

## Calculo do total dos pedidos

O valor total de cada pedido e calculado automaticamente a partir da soma dos subtotais de seus itens, isto e, `quantidade * valor do produto`. Esse total e arredondado para duas casas decimais antes de ser gravado em `pedidos.total`. Quando a coluna `valor_unitario` existe em `itensPedido`, o script tambem armazena esse valor historico em cada item, o que mantem coerencia entre pedido e detalhamento.

Essa abordagem reduz inconsistencias entre total do pedido e composicao dos itens, uma vez que ambos derivam da mesma regra de calculo.

## Tamanhos de dataset disponiveis

O gerador suporta tres perfis de massa:

- `small`: 30 clientes, 6 funcionarios, 15 ingredientes, 20 produtos e 150 pedidos;
- `medium`: 200 clientes, 15 funcionarios, 30 ingredientes, 50 produtos e 2000 pedidos;
- `large`: 1000 clientes, 40 funcionarios, 60 ingredientes, 120 produtos e 15000 pedidos.

O numero de linhas em `produtosIngredientes` e `itensPedido` varia de acordo com as receitas e com a distribuicao dos pedidos, mas e sempre calculado de forma consistente com as tabelas principais.

## Modos de execucao

O script pode operar em dois modos. Com `--reset`, o arquivo SQLite e removido e o banco e reconstruido do zero antes da insercao. Sem `--reset`, o gerador faz append, calculando os proximos IDs disponiveis e acrescentando novos registros ao conjunto ja existente.

Essa flexibilidade e util porque permite tanto cenarios de reproducao integral quanto expansao incremental da base para testes de volume.

## Vantagens da abordagem adotada

A estrategia empregada apresenta varias vantagens. Em primeiro lugar, reduz o trabalho manual de montagem da base e elimina a necessidade de manter centenas de comandos `INSERT` escritos a mao. Em segundo lugar, preserva a integridade referencial e o realismo do dominio, evitando combinacoes sem sentido. Em terceiro lugar, aumenta o valor didatico do projeto, pois as consultas podem ser executadas sobre um conjunto de dados mais rico e mais proximo de um cenario real.

Em sintese, a geracao mock do PoliPadaria nao foi pensada apenas como preenchimento automatico de tabelas, mas como extensao natural do proprio modelo de dados, garantindo consistencia, variedade e utilidade analitica para a disciplina.
