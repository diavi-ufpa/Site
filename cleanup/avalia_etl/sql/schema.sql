BEGIN;

CREATE SCHEMA IF NOT EXISTS avalia_presencial_graph;
SET search_path TO avalia_presencial_graph, public;

CREATE TABLE questionario_versao (
    questionario_versao_id SMALLSERIAL PRIMARY KEY,
    codigo                  TEXT NOT NULL UNIQUE,
    descricao               TEXT NOT NULL,
    vigente_desde_ano       SMALLINT NOT NULL CHECK (vigente_desde_ano >= 2000),
    vigente_desde_periodo   SMALLINT NOT NULL CHECK (vigente_desde_periodo BETWEEN 1 AND 6),
    catalogo_sha256         CHAR(64) NOT NULL CHECK (catalogo_sha256 ~ '^[0-9a-f]{64}$'),
    criado_em               TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (vigente_desde_ano, vigente_desde_periodo)
);

CREATE TABLE campus (
    campus_id SMALLSERIAL PRIMARY KEY,
    codigo    TEXT NOT NULL UNIQUE,
    nome      TEXT NOT NULL UNIQUE
);

CREATE TABLE curso (
    curso_id SMALLSERIAL PRIMARY KEY,
    codigo   TEXT NOT NULL UNIQUE,
    nome     TEXT NOT NULL UNIQUE
);

CREATE TABLE agrupador (
    agrupador_id           SMALLSERIAL PRIMARY KEY,
    questionario_versao_id SMALLINT NOT NULL REFERENCES questionario_versao,
    instrumento            TEXT NOT NULL CHECK (instrumento IN ('DISC', 'DOC')),
    familia                TEXT NOT NULL CHECK (familia IN ('LIKERT', 'ATIVIDADE')),
    nivel                  TEXT NOT NULL CHECK (nivel IN ('DIMENSAO', 'SUBDIMENSAO', 'ITEM')),
    codigo                 TEXT NOT NULL,
    rotulo                 TEXT NOT NULL,
    ordem_bloco            SMALLINT NOT NULL CHECK (ordem_bloco > 0),
    ordem_item             SMALLINT NOT NULL CHECK (ordem_item > 0),
    UNIQUE (questionario_versao_id, instrumento, familia, nivel, codigo)
);

CREATE INDEX agrupador_ordem_idx
    ON agrupador (questionario_versao_id, instrumento, familia, nivel, ordem_bloco, ordem_item);

CREATE TABLE item_questionario (
    item_questionario_id   SMALLSERIAL PRIMARY KEY,
    questionario_versao_id SMALLINT NOT NULL REFERENCES questionario_versao,
    instrumento            TEXT NOT NULL CHECK (instrumento IN ('DISC', 'DOC')),
    familia                TEXT NOT NULL CHECK (familia IN ('LIKERT', 'ATIVIDADE')),
    coluna_origem          TEXT NOT NULL,
    coluna_media_origem    TEXT,
    codigo                 TEXT NOT NULL,
    enunciado              TEXT NOT NULL,
    dimensao_codigo        TEXT NOT NULL,
    subdimensao_codigo     TEXT,
    ordem_bloco            SMALLINT NOT NULL CHECK (ordem_bloco > 0),
    ordem_item             SMALLINT NOT NULL CHECK (ordem_item > 0),
    UNIQUE (questionario_versao_id, instrumento, familia, coluna_origem),
    UNIQUE (questionario_versao_id, instrumento, familia, codigo)
);

CREATE TABLE semestre (
    semestre_id             SMALLSERIAL PRIMARY KEY,
    ano                     SMALLINT NOT NULL CHECK (ano >= 2000),
    periodo                 SMALLINT NOT NULL CHECK (periodo BETWEEN 1 AND 6),
    questionario_versao_id  SMALLINT NOT NULL REFERENCES questionario_versao,
    versao_calculo          TEXT NOT NULL,
    entidades_versao        SMALLINT NOT NULL CHECK (entidades_versao > 0),
    entidades_sha256        CHAR(64) NOT NULL CHECK (entidades_sha256 ~ '^[0-9a-f]{64}$'),
    arquivo_disc            TEXT NOT NULL,
    arquivo_doc             TEXT NOT NULL,
    sha256_disc             CHAR(64) NOT NULL CHECK (sha256_disc ~ '^[0-9a-f]{64}$'),
    sha256_doc              CHAR(64) NOT NULL CHECK (sha256_doc ~ '^[0-9a-f]{64}$'),
    linhas_disc             INTEGER NOT NULL CHECK (linhas_disc >= 0),
    linhas_doc              INTEGER NOT NULL CHECK (linhas_doc >= 0),
    inserido_em             TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    codigo                  TEXT GENERATED ALWAYS AS (ano::TEXT || '-' || periodo::TEXT) STORED,
    UNIQUE (ano, periodo)
);

CREATE TABLE recorte (
    recorte_id BIGSERIAL PRIMARY KEY,
    semestre_id SMALLINT NOT NULL REFERENCES semestre ON DELETE RESTRICT,
    nivel        TEXT NOT NULL CHECK (nivel IN ('SEMESTRE', 'CAMPUS', 'CURSO', 'CAMPUS_CURSO')),
    campus_id    SMALLINT REFERENCES campus,
    curso_id     SMALLINT REFERENCES curso,
    CHECK (
        (nivel = 'SEMESTRE'     AND campus_id IS NULL     AND curso_id IS NULL) OR
        (nivel = 'CAMPUS'       AND campus_id IS NOT NULL AND curso_id IS NULL) OR
        (nivel = 'CURSO'        AND campus_id IS NULL     AND curso_id IS NOT NULL) OR
        (nivel = 'CAMPUS_CURSO' AND campus_id IS NOT NULL AND curso_id IS NOT NULL)
    )
);

CREATE UNIQUE INDEX recorte_semestre_uq
    ON recorte (semestre_id) WHERE nivel = 'SEMESTRE';
CREATE UNIQUE INDEX recorte_campus_uq
    ON recorte (semestre_id, campus_id) WHERE nivel = 'CAMPUS';
CREATE UNIQUE INDEX recorte_curso_uq
    ON recorte (semestre_id, curso_id) WHERE nivel = 'CURSO';
CREATE UNIQUE INDEX recorte_campus_curso_uq
    ON recorte (semestre_id, campus_id, curso_id) WHERE nivel = 'CAMPUS_CURSO';
CREATE INDEX recorte_filtro_idx
    ON recorte (semestre_id, campus_id, curso_id, nivel);

CREATE TABLE resultado_resumo (
    recorte_id             BIGINT PRIMARY KEY REFERENCES recorte ON DELETE RESTRICT,
    total_respondentes     INTEGER NOT NULL CHECK (total_respondentes >= 0),
    total_docentes         INTEGER NOT NULL DEFAULT 0 CHECK (total_docentes >= 0),
    total_turmas           INTEGER NOT NULL DEFAULT 0 CHECK (total_turmas >= 0),
    melhor_campus_id       SMALLINT REFERENCES campus,
    melhor_campus_media    NUMERIC(7,4) CHECK (melhor_campus_media BETWEEN 1 AND 4),
    pior_campus_id         SMALLINT REFERENCES campus,
    pior_campus_media      NUMERIC(7,4) CHECK (pior_campus_media BETWEEN 1 AND 4),
    CHECK ((melhor_campus_id IS NULL) = (melhor_campus_media IS NULL)),
    CHECK ((pior_campus_id IS NULL) = (pior_campus_media IS NULL))
);

CREATE TABLE resultado_media_likert (
    recorte_id   BIGINT NOT NULL REFERENCES recorte ON DELETE RESTRICT,
    agrupador_id SMALLINT NOT NULL REFERENCES agrupador,
    soma         BIGINT NOT NULL CHECK (soma >= 0),
    quantidade   INTEGER NOT NULL CHECK (quantidade > 0),
    media        NUMERIC(7,4) NOT NULL CHECK (media BETWEEN 1 AND 4),
    PRIMARY KEY (recorte_id, agrupador_id)
);

CREATE TABLE resultado_proporcao_likert (
    recorte_id   BIGINT NOT NULL REFERENCES recorte ON DELETE RESTRICT,
    agrupador_id SMALLINT NOT NULL REFERENCES agrupador,
    valor_likert SMALLINT NOT NULL CHECK (valor_likert BETWEEN 1 AND 4),
    quantidade   INTEGER NOT NULL CHECK (quantidade >= 0),
    total        INTEGER NOT NULL CHECK (total > 0),
    percentual   NUMERIC(7,4) NOT NULL CHECK (percentual BETWEEN 0 AND 100),
    PRIMARY KEY (recorte_id, agrupador_id, valor_likert),
    CHECK (quantidade <= total)
);

CREATE TABLE resultado_boxplot (
    recorte_id   BIGINT NOT NULL REFERENCES recorte ON DELETE RESTRICT,
    agrupador_id SMALLINT NOT NULL REFERENCES agrupador,
    minimo       NUMERIC(7,4) NOT NULL CHECK (minimo BETWEEN 0 AND 4),
    q1           NUMERIC(7,4) NOT NULL CHECK (q1 BETWEEN 0 AND 4),
    mediana      NUMERIC(7,4) NOT NULL CHECK (mediana BETWEEN 0 AND 4),
    media        NUMERIC(7,4) NOT NULL CHECK (media BETWEEN 0 AND 4),
    q3           NUMERIC(7,4) NOT NULL CHECK (q3 BETWEEN 0 AND 4),
    maximo       NUMERIC(7,4) NOT NULL CHECK (maximo BETWEEN 0 AND 4),
    quantidade   INTEGER NOT NULL CHECK (quantidade > 0),
    PRIMARY KEY (recorte_id, agrupador_id),
    CHECK (minimo <= q1 AND q1 <= mediana AND mediana <= q3 AND q3 <= maximo)
);

CREATE TABLE resultado_boxplot_outlier (
    recorte_id   BIGINT NOT NULL,
    agrupador_id SMALLINT NOT NULL,
    sequencia    INTEGER NOT NULL CHECK (sequencia > 0),
    valor        NUMERIC(7,4) NOT NULL CHECK (valor BETWEEN 0 AND 4),
    PRIMARY KEY (recorte_id, agrupador_id, sequencia),
    FOREIGN KEY (recorte_id, agrupador_id)
        REFERENCES resultado_boxplot (recorte_id, agrupador_id) ON DELETE RESTRICT
);

CREATE TABLE resultado_atividade (
    recorte_id         BIGINT NOT NULL REFERENCES recorte ON DELETE RESTRICT,
    agrupador_id       SMALLINT NOT NULL REFERENCES agrupador,
    quantidade_positiva INTEGER NOT NULL CHECK (quantidade_positiva >= 0),
    total              INTEGER NOT NULL CHECK (total > 0),
    percentual         NUMERIC(7,4) NOT NULL CHECK (percentual BETWEEN 0 AND 100),
    PRIMARY KEY (recorte_id, agrupador_id),
    CHECK (quantidade_positiva <= total)
);

CREATE TABLE ranking_media_curso (
    recorte_id   BIGINT NOT NULL REFERENCES recorte ON DELETE RESTRICT,
    agrupador_id SMALLINT NOT NULL REFERENCES agrupador,
    posicao      SMALLINT NOT NULL CHECK (posicao BETWEEN 1 AND 20),
    curso_id     SMALLINT NOT NULL REFERENCES curso,
    soma         BIGINT NOT NULL CHECK (soma >= 0),
    quantidade   INTEGER NOT NULL CHECK (quantidade > 0),
    media        NUMERIC(7,4) NOT NULL CHECK (media BETWEEN 1 AND 4),
    PRIMARY KEY (recorte_id, agrupador_id, posicao),
    UNIQUE (recorte_id, agrupador_id, curso_id)
);

CREATE TABLE ranking_atividade_curso (
    recorte_id          BIGINT NOT NULL REFERENCES recorte ON DELETE RESTRICT,
    instrumento         TEXT NOT NULL CHECK (instrumento IN ('DISC', 'DOC')),
    posicao             SMALLINT NOT NULL CHECK (posicao BETWEEN 1 AND 20),
    curso_id            SMALLINT NOT NULL REFERENCES curso,
    quantidade_positiva INTEGER NOT NULL CHECK (quantidade_positiva >= 0),
    total               INTEGER NOT NULL CHECK (total > 0),
    percentual          NUMERIC(7,4) NOT NULL CHECK (percentual BETWEEN 0 AND 100),
    PRIMARY KEY (recorte_id, instrumento, posicao),
    UNIQUE (recorte_id, instrumento, curso_id),
    CHECK (quantidade_positiva <= total)
);

COMMIT;
