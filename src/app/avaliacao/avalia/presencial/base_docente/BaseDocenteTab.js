'use client';

import ActivityChart from '@/components/charts/ActivityChart';
import { QUESTION_MAPPING_AVALIA } from '@/lib/questionMappingAvalia';

export default function BaseDocenteTab({
  // ui
  styles,
  disableZoomOptions,
  twoDecTooltip,
  twoDecTooltipWithQuestions,
  xTicksNoRot,

  // formatters
  formatMediasSubdimChartData,
  formatProporcoesSubdimChartData,
  formatMediasItensChartData,
  formatProporcoesItensChartData,
  normalizeAtitudeDocenteChartData,
  formatMediasDimDocente,
  formatProporcoesDimDocente,

  // dados
  docSubMed,
  docSubProp,
  docTurmaMed,
  docTurmaProp,

  itensAtitudeMedDoc,
  itensAtitudePropDoc,

  itensGestaoMedDoc,
  itensGestaoPropDoc,

  procDocMed,
  procDocProp,

  itensInstalacoesMedDoc,
  itensInstalacoesPropDoc,

  docDimMed,
  docDimProp,

  dimensionFilter = '',
}) {
  const showDim1 = !dimensionFilter || dimensionFilter === '1';
  const showDim2 = !dimensionFilter || dimensionFilter === '2';

  return (
    <div style={{ position: 'relative', overflow: 'visible' }}>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr',
          gap: '2rem',
          width: '100%',
          overflow: 'visible',
        }}
      >
        {showDim2 && (
          <>
        {/* === 1. MÃ©dias por SubdimensÃ£o da AutoavaliaÃ§Ã£o da AÃ§Ã£o Docente === */}
        <div className={styles.chartContainer} style={{ width: '100%', minHeight: '400px' }}>
          {docSubMed ? (
            <ActivityChart
              chartData={formatMediasSubdimChartData(docSubMed)}
              title="MÃ©dias por SubdimensÃ£o da AutoavaliaÃ§Ã£o da AÃ§Ã£o Docente"
              customOptions={{
                ...disableZoomOptions,
                plugins: { legend: { display: false }, tooltip: twoDecTooltip() },
                layout: { padding: { top: 10, right: 6, bottom: 0, left: 6 } },
                scales: { y: { max: 5 }, x: { ticks: xTicksNoRot } },
              }}
            />
          ) : (
            <p>MÃ©dias (SubdimensÃ£o - Base Docente) nÃ£o disponÃ­veis.</p>
          )}
        </div>

        {/* === 2. ProporÃ§Ãµes por SubdimensÃ£o da AutoavaliaÃ§Ã£o da AÃ§Ã£o Docente === */}
        <div className={styles.chartContainer} style={{ width: '100%', minHeight: '400px' }}>
          {docSubProp ? (
            <ActivityChart
              chartData={formatProporcoesSubdimChartData(docSubProp)}
              title="ProporÃ§Ãµes de respostas dadas por SubdimensÃ£o da AutoavaliaÃ§Ã£o da AÃ§Ã£o Docente"
              customOptions={{
                ...disableZoomOptions,
                plugins: { tooltip: twoDecTooltip('%') },
                layout: { padding: { top: 50, right: 6, bottom: 0, left: 1 } },
                scales: { x: { ticks: xTicksNoRot } },
              }}
            />
          ) : (
            <p>ProporÃ§Ãµes (SubdimensÃ£o - Base Docente) nÃ£o disponÃ­veis.</p>
          )}
        </div>
            </>
          )}

          {showDim1 && (
            <>
        {/* === 3. MÃ©dias dos itens relacionados Ã  AvaliaÃ§Ã£o da Turma === */}
        <div className={styles.chartContainer} style={{ width: '100%', minHeight: '400px' }}>
          {docTurmaMed ? (
            <ActivityChart
              chartData={formatMediasItensChartData(docTurmaMed)}
              title="MÃ©dias dos itens relacionados Ã  AvaliaÃ§Ã£o da Turma"
              customOptions={{
                ...disableZoomOptions,
                plugins: {
                  legend: { display: false },
                  tooltip: twoDecTooltipWithQuestions('', QUESTION_MAPPING_AVALIA.docente.avaliacaoTurma),
                },
                layout: { padding: { top: 8, right: 6, bottom: 0, left: 6 } },
                scales: { x: { ticks: xTicksNoRot }, y: { max: 4 } },
              }}
            />
          ) : (
            <p>MÃ©dias (AvaliaÃ§Ã£o da Turma) nÃ£o disponÃ­veis.</p>
          )}
        </div>

        {/* === 4. ProporÃ§Ãµes dos itens relacionados Ã  AvaliaÃ§Ã£o da Turma === */}
        <div className={styles.chartContainer} style={{ width: '100%', minHeight: '400px' }}>
          {docTurmaProp ? (
            <ActivityChart
              chartData={formatProporcoesItensChartData(docTurmaProp)}
              title="ProporÃ§Ãµes de respostas dadas aos itens relacionados Ã  AvaliaÃ§Ã£o da Turma"
              customOptions={{
                ...disableZoomOptions,
                plugins: {
                  tooltip: twoDecTooltipWithQuestions('%', QUESTION_MAPPING_AVALIA.docente.avaliacaoTurma),
                },
                layout: { padding: { top: 8, right: -12, bottom: 0, left: -30 } },
                scales: { y: { max: 100 }, x: { ticks: xTicksNoRot } },
              }}
            />
          ) : (
            <p>ProporÃ§Ãµes (AvaliaÃ§Ã£o da Turma) nÃ£o disponÃ­veis.</p>
          )}
        </div>
            </>
          )}

          {showDim2 && (
            <>
        {/* === 5. MÃ©dias dos itens relacionados Ã  Atitude Profissional (Docente) === */}
        <div className={styles.chartContainer} style={{ width: '100%', minHeight: '400px' }}>
          {itensAtitudeMedDoc ? (
            <ActivityChart
              chartData={normalizeAtitudeDocenteChartData(
                formatMediasItensChartData(itensAtitudeMedDoc)
              )}
              title="MÃ©dias dos itens relacionados Ã  Atitude Profissional (Docente)"
              customOptions={{
                ...disableZoomOptions,
                plugins: {
                  legend: { display: false },
                  tooltip: twoDecTooltipWithQuestions('', QUESTION_MAPPING_AVALIA.docente.atitude),
                },
                scales: { y: { max: 4 }, x: { ticks: xTicksNoRot } },
              }}
            />
          ) : (
            <p>MÃ©dias (Atitude Profissional) nÃ£o disponÃ­veis.</p>
          )}
        </div>

        {/* === 6. ProporÃ§Ãµes dos itens relacionados Ã  Atitude Profissional (Docente) === */}
        <div className={styles.chartContainer} style={{ width: '100%', minHeight: '400px' }}>
          {itensAtitudePropDoc ? (
            <ActivityChart
              chartData={normalizeAtitudeDocenteChartData(
                formatProporcoesItensChartData(itensAtitudePropDoc)
              )}
              title="ProporÃ§Ãµes de respostas dadas aos itens relacionados Ã  Atitude Profissional (Docente)"
              customOptions={{
                ...disableZoomOptions,
                plugins: {
                  tooltip: twoDecTooltipWithQuestions('%', QUESTION_MAPPING_AVALIA.docente.atitude),
                },
                scales: { x: { ticks: xTicksNoRot }, y: { max: 100 } },
              }}
            />
          ) : (
            <p>ProporÃ§Ãµes (Atitude Profissional) nÃ£o disponÃ­veis.</p>
          )}
        </div>

        {/* === 7. MÃ©dias dos itens relacionados Ã  GestÃ£o DidÃ¡tica (Docente) === */}
        <div className={styles.chartContainer} style={{ width: '100%', minHeight: '400px' }}>
          {itensGestaoMedDoc && itensGestaoMedDoc.length > 0 ? (
            <ActivityChart
              chartData={formatMediasItensChartData(itensGestaoMedDoc)}
              title="MÃ©dias dos itens relacionados Ã  GestÃ£o DidÃ¡tica (Docente)"
              customOptions={{
                ...disableZoomOptions,
                plugins: {
                  legend: { display: false },
                  tooltip: twoDecTooltipWithQuestions('', QUESTION_MAPPING_AVALIA.docente.gestao),
                },
                scales: { y: { max: 4 }, x: { ticks: xTicksNoRot } },
              }}
            />
          ) : (
            <p>MÃ©dias (GestÃ£o DidÃ¡tica) nÃ£o disponÃ­veis.</p>
          )}
        </div>

        {/* === 8. ProporÃ§Ãµes dos itens relacionados Ã  GestÃ£o DidÃ¡tica (Docente) === */}
        <div className={styles.chartContainer} style={{ width: '100%', minHeight: '400px' }}>
          {itensGestaoPropDoc && itensGestaoPropDoc.length > 0 ? (
            <ActivityChart
              chartData={formatProporcoesItensChartData(itensGestaoPropDoc)}
              title="ProporÃ§Ãµes de respostas dadas aos itens relacionados Ã  GestÃ£o DidÃ¡tica (Docente)"
              customOptions={{
                ...disableZoomOptions,
                plugins: {
                  tooltip: twoDecTooltipWithQuestions('%', QUESTION_MAPPING_AVALIA.docente.gestao),
                },
                scales: { x: { ticks: xTicksNoRot }, y: { max: 100 } },
              }}
            />
          ) : (
            <p>ProporÃ§Ãµes (GestÃ£o DidÃ¡tica) nÃ£o disponÃ­veis.</p>
          )}
        </div>

        {/* === 9. MÃ©dias dos itens relacionados ao Processo Avaliativo (Docente) === */}
        <div className={styles.chartContainer} style={{ width: '100%', minHeight: '400px' }}>
          {procDocMed ? (
            <ActivityChart
              chartData={formatMediasItensChartData(procDocMed)}
              title="MÃ©dias dos itens relacionados ao Processo Avaliativo (Docente)"
              customOptions={{
                ...disableZoomOptions,
                plugins: {
                  legend: { display: false },
                  tooltip: twoDecTooltipWithQuestions('', QUESTION_MAPPING_AVALIA.docente.processo),
                },
                scales: { y: { max: 4 }, x: { ticks: xTicksNoRot } },
              }}
            />
          ) : (
            <p>MÃ©dias (Processo Avaliativo) nÃ£o disponÃ­veis.</p>
          )}
        </div>

        {/* === 10. ProporÃ§Ãµes dos itens relacionados ao Processo Avaliativo (Docente) === */}
        <div className={styles.chartContainer} style={{ width: '100%', minHeight: '400px' }}>
          {procDocProp ? (
            <ActivityChart
              chartData={formatProporcoesItensChartData(procDocProp)}
              title="ProporÃ§Ãµes de respostas dadas aos itens relacionados ao Processo Avaliativo (Docente)"
              customOptions={{
                ...disableZoomOptions,
                plugins: {
                  tooltip: twoDecTooltipWithQuestions('%', QUESTION_MAPPING_AVALIA.docente.processo),
                },
                scales: { x: { ticks: xTicksNoRot }, y: { max: 100 } },
              }}
            />
          ) : (
            <p>ProporÃ§Ãµes (Processo Avaliativo) nÃ£o disponÃ­veis.</p>
          )}
        </div>
            </>
          )}

      </div>
    </div>
  );
}
