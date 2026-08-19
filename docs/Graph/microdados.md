# Catálogo de gráficos — Microdados Enade

## Organização da tela

O painel usa filtros encadeados de **ano**, **município** e **curso**. Após o recorte, o conteúdo é dividido em quatro abas:

1. Razão do Percentual;
2. Percentual de Acerto;
3. Tabela Ranking;
4. Questionário do Estudante.

O grão principal é ano + curso. Município organiza a seleção de cursos, mas não aparece como série dos gráficos.

## Aba Razão do Percentual

### Razão de Acertos UFPA/Brasil por tema

- **Tipo:** barras horizontais, uma série.
- **Eixo Y:** temas do Componente Específico, ordenados pela razão crescente.
- **Eixo X:** razão `percentual de acerto da UFPA / percentual de acerto do Brasil`.
- **Comparação:** mede o desempenho relativo do curso da UFPA contra o agregado Brasil em cada tema. Valor 1 indica igualdade; acima de 1 favorece a UFPA; abaixo de 1 favorece o Brasil.
- **Regra atual:** temas com razão igual a zero não são exibidos.
- **Dados mínimos:** ano, curso, grupo Enade, tema, percentuais UFPA/Brasil e razão.

## Aba Percentual de Acerto

### Percentual de acertos por tema

- **Tipo:** barras horizontais agrupadas.
- **Eixo Y:** temas do Componente Específico, ordenados pelo percentual UFPA decrescente.
- **Eixo X:** percentual de acerto, de 0% a 100%.
- **Séries:** UFPA e Brasil.
- **Comparação:** confronta diretamente o desempenho do curso da UFPA e o desempenho nacional em cada tema.
- **Dados mínimos:** ano, curso, tema, número de questões, participantes e percentual de acerto de cada universo.

## Aba Tabela Ranking

### Melhor desempenho por tema

- **Tipo:** tabela, não gráfico cartesiano.
- **Recortes selecionáveis:** todas as IES ou apenas IES públicas federais.
- **Colunas:** tema, IES com melhor desempenho, participantes da IES líder, percentual do melhor curso e percentual da UFPA.
- **Comparação:** para cada tema e grupo Enade, confronta o curso UFPA com a IES de maior percentual no recorte.
- **Dados mínimos:** ano, curso UFPA, grupo, tema, recorte, curso/IES líder, participantes e percentuais líder/UFPA.

## Aba Questionário do Estudante

A aba possui três subabas de dimensão:

1. Organização Didático-Pedagógica;
2. Infraestrutura;
3. Ampliação da Formação.

Em cada dimensão aparecem dois gráficos, um abaixo do outro.

### Média por questão

- **Tipo:** barras verticais, uma série.
- **Eixo X:** código/número da questão do QE.
- **Eixo Y:** média das respostas válidas de 1 a 6, apresentada de 0 a 6.
- **Comparação:** compara o nível médio de concordância entre as questões da dimensão.
- **Regra:** respostas 7 e 8 não entram na média.
- **Destaque visual:** maior média em verde, menor em laranja e demais em verde intermediário.

### Contagem por faixa de resposta

- **Tipo:** linhas com pontos, quatro séries.
- **Eixo X:** código/número da questão do QE.
- **Eixo Y:** quantidade de respostas.
- **Séries:** 1–2 Discordância, 3–4 Neutro, 5–6 Concordância e 7–8 Não se aplica/Não sei.
- **Comparação:** mostra como as faixas de resposta variam entre as questões da dimensão.

### Dados mínimos do QE

Ano, curso, dimensão, questão, ordem, média 1–6, contagens das quatro faixas e total de respostas. Dimensão e ordem devem ser persistidas, pois controlam a subaba e a posição do item.

## Requisitos de modelagem derivados

- Não é necessário armazenar respostas individuais para reproduzir o painel atual.
- O Componente Específico exige agregados por ano + curso + tema.
- O ranking exige ano + curso UFPA + tema + recorte.
- O QE exige ano + curso + questão, com dimensão e ordem.
- Participantes e quantidade de questões devem acompanhar percentuais para auditoria e recomposição.
- A razão pode ser calculada a partir dos percentuais, mas deve ter regra explícita para denominador Brasil igual a zero.
