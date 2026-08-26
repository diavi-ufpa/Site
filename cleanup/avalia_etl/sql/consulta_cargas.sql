-- ============================================================================
-- Consulta de cargas existentes no banco avalia-graph
-- Execute diretamente no seu editor SQL (DBeaver, pgAdmin, etc.)
-- ============================================================================

-- 1. Listar todos os semestres publicados com metadados
SELECT
    s.semestre_id,
    s.codigo            AS semestre,
    s.ano,
    s.periodo,
    qv.codigo           AS questionario,
    s.versao_calculo,
    s.arquivo_disc,
    s.arquivo_doc,
    s.linhas_disc,
    s.linhas_doc,
    s.sha256_disc,
    s.sha256_doc,
    s.entidades_versao,
    s.inserido_em
FROM avalia_presencial_graph.semestre s
JOIN avalia_presencial_graph.questionario_versao qv
    ON qv.questionario_versao_id = s.questionario_versao_id
ORDER BY s.ano DESC, s.periodo DESC;


-- 2. Resumo rápido: quais semestres existem
SELECT codigo AS semestre, inserido_em
FROM avalia_presencial_graph.semestre
ORDER BY ano DESC, periodo DESC;


-- 3. Contagem de recortes por semestre
SELECT
    s.codigo          AS semestre,
    COUNT(r.recorte_id) AS total_recortes
FROM avalia_presencial_graph.semestre s
LEFT JOIN avalia_presencial_graph.recorte r
    ON r.semestre_id = s.semestre_id
GROUP BY s.codigo, s.ano, s.periodo
ORDER BY s.ano DESC, s.periodo DESC;


-- 4. Espaço consumido pelo banco
SELECT pg_size_pretty(pg_database_size(current_database())) AS tamanho_banco;


-- 5. Campi e cursos cadastrados
SELECT campus_id, codigo, nome
FROM avalia_presencial_graph.campus
ORDER BY nome;

SELECT curso_id, codigo, nome
FROM avalia_presencial_graph.curso
ORDER BY nome;
