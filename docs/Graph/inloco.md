# Catálogo de gráficos — Avaliação In Loco

## Organização da tela

O painel é dividido em duas abas:

1. **Média**, voltada a um recorte anual detalhado;
2. **Gráfico-Evolução**, voltada à série histórica desde 2011.

As dimensões usadas são:

- `D1`: Organização Didático-Pedagógica;
- `D2`: Corpo Docente e Tutorial;
- `D3`: Infraestrutura.

O código também consome os indicadores `CC` e `AVAL`. Seus significados de negócio não estão definidos no repositório e precisam ser confirmados antes da modelagem definitiva.

## Aba Média

### Filtros

O gráfico só aparece quando todos os filtros estão selecionados, nesta ordem encadeada:

1. ano;
2. unidade acadêmica;
3. modalidade, derivada como Bacharelado ou Licenciatura;
4. campus;
5. curso.

### Média das dimensões

- **Tipo:** barras verticais agrupadas.
- **Eixo X:** unidade acadêmica presente no recorte.
- **Eixo Y:** média, de 0 a 5.
- **Séries:** D1, D2 e D3.
- **Comparação:** confronta as médias das três dimensões por unidade acadêmica no recorte anual escolhido.
- **Cálculo:** média aritmética de cada dimensão entre os registros filtrados, arredondada a duas casas.
- **Dados mínimos:** ano, unidade acadêmica, modalidade, campus, curso, D1, D2 e D3.

Embora o gráfico agrupe por unidade acadêmica, o fluxo atual exige uma unidade específica; em condições normais, o recorte tende a produzir uma única categoria no eixo X.

## Aba Gráfico-Evolução

### Filtros

Unidade acadêmica e curso são opcionais. Sem filtros, o painel usa a consolidação histórica da planilha. Com algum filtro, recalcula as médias anuais sobre os registros detalhados.

Os quatro gráficos aparecem em sequência vertical e compartilham o ano no eixo X.

### Média anual de D1, D2, D3, CC e AVAL

- **Tipo:** linhas com pontos, cinco séries.
- **Eixo X:** ano, em ordem crescente, a partir de 2011.
- **Eixo Y:** média anual, de 0 a 6 na apresentação.
- **Séries:** D1, D2, D3, CC e AVAL.
- **Comparação:** mostra a evolução conjunta das dimensões e dos dois indicadores consolidados.

### Média anual de D1, D2 e D3

- **Tipo:** linhas com pontos, três séries.
- **Eixo X:** ano.
- **Eixo Y:** média anual, de 0 a 6 na apresentação.
- **Séries:** D1, D2 e D3.
- **Comparação:** isola a evolução das três dimensões para facilitar a leitura comparativa.

### Quantidade de cursos avaliados

- **Tipo:** barras verticais, uma série.
- **Eixo X:** ano.
- **Eixo Y:** quantidade inteira de registros/cursos avaliados.
- **Comparação:** mostra a cobertura da avaliação ao longo dos anos.
- **Regra atual:** quando recalculado a partir dos dados detalhados, conta linhas por ano; a unicidade de curso deve ser validada na fonte para que a métrica represente cursos distintos.

### Média por dimensão anual

- **Tipo:** barras verticais agrupadas.
- **Eixo X:** ano.
- **Eixo Y:** média, de 0 a 5.
- **Séries:** D1, D2 e D3.
- **Comparação:** compara as dimensões dentro de cada ano e entre anos.

## Requisitos de modelagem derivados

- O registro detalhado precisa identificar ano, unidade acadêmica, modalidade, campus e curso.
- D1, D2, D3, CC e AVAL devem ser numéricos e aceitar ausência individual sem transformar ausência em zero.
- Agregados anuais devem guardar soma e quantidade válida por indicador, permitindo filtros sem média de médias.
- A quantidade de cursos avaliados deve ter uma chave canônica de curso e regra explícita de contagem distinta.
- A consolidação histórica sem filtros e o recálculo filtrado devem produzir a mesma definição de média.
- Os significados, domínios e faixas válidas de `CC` e `AVAL` precisam de definição de negócio.
