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
