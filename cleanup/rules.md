# Regras do Cleanup — Avalia Presencial

> Documento normativo que define como a interface gráfica e os scripts de carga
> devem se comportar. Qualquer alteração de lógica deve ser refletida aqui.

---

## 1. Fonte de dados

| Prioridade | Fonte             | Status   |
|-----------|-------------------|----------|
| **1**     | Banco `avalia-graph` (PostgreSQL) | **ATIVO** — sempre utilizado |
| 2         | HuggingFace (API legada)         | **DESLIGADO** — não será consultado |

- O front-end do site (`avaliaDataSource.js`) já define `DEFAULT_AVALIA_DATA_SOURCE = 'graph-database'`.
- A rota `/api/dashboard-cache` (HuggingFace) permanece no código para referência, mas **não deve ser usada como fonte primária**.

---

## 2. Validação de ano e período

### 2.1 Origem do ano/período

O ano e o período são definidos **pelo operador na interface gráfica** (campos `Ano` e `Período`).

### 2.2 Detecção automática a partir do nome do arquivo

Quando o operador seleciona um arquivo cujo nome segue o padrão `DISC_AAAA_P` ou `DOC_AAAA_P`:

- O sistema **detecta** o ano e o período embutidos no nome.
- Se os campos de ano/período na interface estiverem com valores diferentes, o sistema **avisa** o operador com uma mensagem informativa (não impede a seleção).
- O operador decide se ajusta os campos da interface ou ignora o aviso.

### 2.3 Colunas ANO e PERIODO na planilha DOC

- A coluna `ANO` e `PERIODO` dentro da planilha DOC **não é mais obrigatória** para validação.
- Se essas colunas existirem **e** contiverem valores, o sistema verifica se coincidem com o semestre selecionado na interface:
  - **Coincidem** → prossegue normalmente.
  - **Divergem** → o sistema emite um **aviso** no log, mas **não impede** a carga. O semestre da interface prevalece.
- Se as colunas não existirem ou estiverem vazias, nenhum aviso é emitido.

---

## 3. Verificação de cargas existentes no banco

### 3.1 Ao verificar conexão

Quando o operador verifica a conexão com o banco, o sistema:

1. Lista todos os semestres já publicados.
2. Exibe os semestres publicados na tela do Avalia Presencial.
3. Armazena internamente a lista de semestres importados.

### 3.2 Ao selecionar o período na interface

Quando o operador altera o ano ou período para uma nova carga:

- Se o semestre `AAAA-P` já existir no banco, o sistema exibe **imediatamente** uma mensagem vermelha: _"O semestre AAAA-P já foi publicado e não pode ser substituído."_
- O botão "Validar arquivos" fica **desabilitado** enquanto o semestre selecionado já existir.
- Essa verificação usa a lista carregada na última verificação de conexão.

### 3.3 Consulta SQL manual

O arquivo `avalia_etl/sql/consulta_cargas.sql` contém queries prontas para:

- Listar todos os semestres publicados com metadados completos.
- Contar recortes por semestre.
- Verificar espaço do banco.
- Listar campi e cursos cadastrados.

---

## 4. Fluxo de upload (publicação)

1. Operador seleciona ano e período na interface.
2. Sistema verifica se o semestre já existe (Regra 3.2) — se sim, bloqueia.
3. Operador seleciona os arquivos DISC e DOC.
4. Sistema detecta ano/período do nome do arquivo e avisa se divergir (Regra 2.2).
5. Operador clica em "Validar arquivos":
   - Resolução de entidades (campus/curso desconhecidos).
   - Cálculo local sem gravar no banco.
   - Colunas ANO/PERIODO do DOC são verificadas apenas como aviso (Regra 2.3).
6. Após validação, operador marca checkbox e publica.
7. Publicação é atômica e imutável — uma vez gravada, não pode ser sobrescrita.

---

## 5. Formato de arquivos aceitos

- **CSV**: UTF-8 com ou sem BOM, delimitador `;`, uma linha de cabeçalho.
- **XLSX**: exatamente uma planilha interna; mais de uma provoca erro.
- Arquivos com sufixo `_SNTZD` são derivados legados e **serão recusados**.

---

## 6. Nomenclatura obrigatória

Os arquivos devem seguir o padrão:

- `DISC_<ANO>_<PERIODO>.csv` ou `DISC_<ANO>_<PERIODO>.xlsx`
- `DOC_<ANO>_<PERIODO>.csv` ou `DOC_<ANO>_<PERIODO>.xlsx`

A comparação de nome é case-insensitive no prefixo.

---

## 7. Gitignore

Arquivos `*.xlsx` e `*.csv` estão no `.gitignore` dos seguintes locais:

- `Site/.gitignore`
- `Site/cleanup/.gitignore`
- `Trata-Dados/.gitignore`

Dados brutos **nunca** devem ser versionados.

---

## 8. Segurança e privacidade

- A URL do banco de dados nunca é exibida em logs de execução.
- Nenhuma resposta individual, matrícula ou dado pessoal é enviado ao PostgreSQL.
- Somente resultados agregados (médias, proporções, boxplots, rankings) são persistidos.
- Os arquivos são processados localmente no computador do operador.

---

## 9. Resolução e Sanitização de Entidades

### 9.1 Validação de Cursos e Campi
- Não existe etapa de mapeamento de sinônimos ("x equivale a y") na interface gráfica para cursos nem para campi. Quaisquer novas entidades não cadastradas são identificadas, sanitizadas e automaticamente inseridas no banco de dados durante a carga do período correspondente.

### 9.2 Sanitização obrigatória de Cursos
- Os nomes dos cursos devem ser convertidos **totalmente para maiúsculas, sem acentos, e sem espaços** (separados apenas por hífens simples, ex: `MATEMATICA-INTENSIVO-BACHARELADO`).

### 9.3 Verificação de Duplicidade/Divergência no mesmo Período
- Cada período e campus possui seus próprios cursos, contudo, não devem existir cursos com nomes excessivamente semelhantes dentro do mesmo período e no mesmo campus (ex: `MATEMATICA-INTENSIVO-BACHARELADO` e `MATEMATICA-INTENSIV-BACHARELADO`).
- Quando forem detectados nomes semelhantes, o sistema deve apresentar um alerta formal informando sobre a possível divergência de grafia no período e campus correspondentes.
- Este alerta **não é impeditivo**: a carga de dados poderá prosseguir sob responsabilidade do operador caso ele confirme a execução (ou seja, a publicação não será bloqueada por isso, mas caberá ao operador validar ou corrigir a planilha na origem).

---

## 10. Padrões Visuais e Temas (UI/UX)

### 10.1 Compatibilidade com Temas do Sistema Operacional (Dark Mode)
- Todas as janelas (`QMainWindow`), diálogos (`QDialog`, `QMessageBox`), abas (`QTabWidget`, `QTabBar`) e containers principais devem ter seu fundo configurado explicitamente como **branco** (`#ffffff`) via QSS.
- Essa especificação garante consistência de contraste e evita que componentes gráficos incorporem cores escuras nativas do sistema operacional (como Windows Dark Mode), o que prejudicaria a legibilidade de textos e painéis da interface.

---

## 11. Tratamento de Erros e Mensagens de Validação

### 11.1 Indicação do arquivo de origem nos erros

Qualquer erro de validação de dados ou inconsistência de estrutura que interrompa o processo (por exemplo, no script `load_graph_db.py` ou na interface gráfica) deve, obrigatoriamente, indicar em qual arquivo (DISC ou DOC) o problema foi encontrado.

- **Formato padrão das mensagens**: As mensagens de erro que impedem a validação de um arquivo devem conter o nome do arquivo (ou rótulo descritivo) entre colchetes como prefixo da mensagem.
  - *Exemplo*: `[DOC_2025_4.xlsx] Colunas duplicadas após normalização: CAMPUS.`
  - *Exemplo*: `[DISC_2025_4.csv] Base DISC sem colunas obrigatórias: MATRICULA.`
- Essa regra aplica-se a:
  - Formatos não suportados ou erros de leitura de planilhas.
  - Colunas duplicadas após normalização de cabeçalhos.
  - Colunas obrigatórias ausentes.
  - Itens ou perguntas fora da versão do questionário.
  - Valores nulos/vazios em campos obrigatórios (ex: matrícula ou ID da oferta).
  - Valores fora da escala inteira esperada (ex: respostas de escala Likert fora de 1..4).
  - Valores inválidos ou não-numéricos em campos de atividade.
