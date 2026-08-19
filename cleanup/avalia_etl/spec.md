# Especificação — banco de gráficos do Avalia Presencial

## Problema

O painel atual depende de cálculos sobre planilhas ou respostas detalhadas durante a requisição. Isso aumenta latência, custo de consulta e volume armazenado, embora as fontes de um semestre publicado não mudem.

## Solução

O `avalia-etl` recebe um par de arquivos DISC/DOC de um novo semestre, normaliza e valida as fontes, calcula localmente todas as saídas descritas em `graficos.md` e insere somente resultados agregados em um PostgreSQL independente de até 500 MB.

O fluxo é append-only por semestre:

```text
DISC + DOC → validação local → pré-cálculo → transação única → banco de gráficos
```

Um semestre existente é recusado. Não há atualização, ativação, substituição ou versionamento operacional de cargas.

## Fontes de verdade

- As planilhas DISC/DOC são a fonte dos valores.
- `config/questionarios.json` define perguntas, agrupamentos, textos, ordem e vigência.
- `config/entidades.json` define os nomes canônicos e aliases de campi e cursos.
- `graficos.md` define as fórmulas e os grãos das saídas.

## Recortes obrigatórios

Cada família aplicável é calculada para:

- semestre;
- semestre + campus;
- semestre + curso, somando todos os campi onde o curso existe;
- semestre + campus + curso.

Rankings ignoram o curso selecionado e persistem o top 20 final para cada campus e para todos os campi.

## Requisitos de integridade

- Dois arquivos por semestre, um DISC e um DOC.
- CSV em UTF-8 ou XLSX com exatamente uma planilha.
- Semestre da execução compatível com nomes e metadados das fontes.
- Campi e cursos presentes no catálogo normalizado.
- Todo item encontrado presente na versão vigente do questionário.
- Valores, percentuais, contagens e estatísticas dentro das faixas documentadas.
- SHA-256 das fontes e da versão do questionário registrados.
- Nenhuma resposta individual, matrícula ou oferta persistida.
- Nenhum resultado parcial após falha.

## Consumo

O `Site` será adaptado separadamente. O banco fornece valores relacionais tipados; a API futura apenas selecionará o recorte, ordenará pelo catálogo e converterá as linhas para o JSON já esperado pelos componentes.
