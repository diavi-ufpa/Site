'use client';

import ActivityChart from '@/components/charts/ActivityChart';
import BoxplotChart from '@/components/charts/BoxplotChart';
import { QUESTION_MAPPING_AVALIA } from '@/lib/questionMappingAvalia';

export default function BaseDocenteTab({
  // ui
  styles,
  disableZoomOptions,
  twoDecTooltip,
  twoDecTooltipWithQuestions,
  xTicksNoRot,
  renderDescritivasTable,

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
  docSubBox,
  docTurmaMed,
  docTurmaProp,
  docTurmaBox,

  itensAtitudeMedDoc,
  itensAtitudePropDoc,
  itensAtitudeBoxDoc,

  itensGestaoMedDoc,
  itensGestaoPropDoc,
  itensGestaoBoxDoc,

  procDocMed,
  procDocProp,
  procDocBox,

  itensInstalacoesMedDoc,
  itensInstalacoesPropDoc,

  docDimMed,
  docDimProp,
  docDimBox,

  dimensionFilter = '',
}) {
  const showDim1 = !dimensionFilter || dimensionFilter === '1';
  const showDim2 = !dimensionFilter || dimensionFilter === '2';

  const BoxplotSection = ({ data, title, statsTitle }) => {
    if (!data) return null;

    return (
      <>
        <div className={styles.chartContainer} style={{ width: '100%', minHeight: '400px' }}>
          <BoxplotChart
            apiData={data}
            title={title}
            customOptions={disableZoomOptions}
          />
        </div>

        {renderDescritivasTable && (
          <div className={styles.chartContainer} style={{ width: '100%', height: 'auto', padding: '1.5rem' }}>
            <h4 style={{ textAlign: 'center', marginBottom: '1rem', color: '#333' }}>
              {statsTitle}
            </h4>
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <div style={{ width: '100%' }}>
                {renderDescritivasTable(data)}
              </div>
            </div>
          </div>
        )}
      </>
    );
  };

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
        {/* === 1. Médias por Subdimensão da Autoavaliação da Ação Docente === */}
        <div className={styles.chartContainer} style={{ width: '100%', minHeight: '400px' }}>
          {docSubMed ? (
            <ActivityChart
              chartData={formatMediasSubdimChartData(docSubMed)}
              title="Médias por Subdimensão da Autoavaliação da Ação Docente"
              customOptions={{
                ...disableZoomOptions,
                plugins: { legend: { display: false }, tooltip: twoDecTooltip() },
                layout: { padding: { top: 10, right: 6, bottom: 0, left: 6 } },
                scales: { y: { max: 5 }, x: { ticks: xTicksNoRot } },
              }}
            />
          ) : (
            <p>Médias (Subdimensão - Base Docente) não disponíveis.</p>
          )}
        </div>

        {/* === 2. Proporções por Subdimensão da Autoavaliação da Ação Docente === */}
        <div className={styles.chartContainer} style={{ width: '100%', minHeight: '400px' }}>
          {docSubProp ? (
            <ActivityChart
              chartData={formatProporcoesSubdimChartData(docSubProp)}
              title="Proporções de respostas dadas por Subdimensão da Autoavaliação da Ação Docente"
              customOptions={{
                ...disableZoomOptions,
                plugins: { tooltip: twoDecTooltip('%') },
                layout: { padding: { top: 50, right: 6, bottom: 0, left: 1 } },
                scales: { x: { ticks: xTicksNoRot } },
              }}
            />
          ) : (
            <p>Proporções (Subdimensão - Base Docente) não disponíveis.</p>
          )}
        </div>

        <BoxplotSection
          data={docSubBox}
          title="Boxplot - Autoavaliacao da Acao Docente por Subdimensao"
          statsTitle="Estatisticas descritivas - Autoavaliacao da Acao Docente por Subdimensao"
        />
            </>
          )}

          {showDim1 && (
            <>
        {/* === 3. Médias dos itens relacionados à Avaliação da Turma === */}
        <div className={styles.chartContainer} style={{ width: '100%', minHeight: '400px' }}>
          {docTurmaMed ? (
            <ActivityChart
              chartData={formatMediasItensChartData(docTurmaMed)}
              title="Médias dos itens relacionados à Avaliação da Turma"
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
            <p>Médias (Avaliação da Turma) não disponíveis.</p>
          )}
        </div>

        {/* === 4. Proporções dos itens relacionados à Avaliação da Turma === */}
        <div className={styles.chartContainer} style={{ width: '100%', minHeight: '400px' }}>
          {docTurmaProp ? (
            <ActivityChart
              chartData={formatProporcoesItensChartData(docTurmaProp)}
              title="Proporções de respostas dadas aos itens relacionados à Avaliação da Turma"
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
            <p>Proporções (Avaliação da Turma) não disponíveis.</p>
          )}
        </div>

        <BoxplotSection
          data={docTurmaBox}
          title="Boxplot - Avaliacao da Turma por Item"
          statsTitle="Estatisticas descritivas - Avaliacao da Turma por Item"
        />
            </>
          )}

          {showDim2 && (
            <>
        {/* === 5. Médias dos itens relacionados à Atitude Profissional (Docente) === */}
        <div className={styles.chartContainer} style={{ width: '100%', minHeight: '400px' }}>
          {itensAtitudeMedDoc ? (
            <ActivityChart
              chartData={normalizeAtitudeDocenteChartData(
                formatMediasItensChartData(itensAtitudeMedDoc)
              )}
              title="Médias dos itens relacionados à Atitude Profissional (Docente)"
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
            <p>Médias (Atitude Profissional) não disponíveis.</p>
          )}
        </div>

        {/* === 6. Proporções dos itens relacionados à Atitude Profissional (Docente) === */}
        <div className={styles.chartContainer} style={{ width: '100%', minHeight: '400px' }}>
          {itensAtitudePropDoc ? (
            <ActivityChart
              chartData={normalizeAtitudeDocenteChartData(
                formatProporcoesItensChartData(itensAtitudePropDoc)
              )}
              title="Proporções de respostas dadas aos itens relacionados à Atitude Profissional (Docente)"
              customOptions={{
                ...disableZoomOptions,
                plugins: {
                  tooltip: twoDecTooltipWithQuestions('%', QUESTION_MAPPING_AVALIA.docente.atitude),
                },
                scales: { x: { ticks: xTicksNoRot }, y: { max: 100 } },
              }}
            />
          ) : (
            <p>Proporções (Atitude Profissional) não disponíveis.</p>
          )}
        </div>

        {/* === 7. Médias dos itens relacionados à Gestão Didática (Docente) === */}
        <BoxplotSection
          data={itensAtitudeBoxDoc}
          title="Boxplot - Atitude Profissional (Docente)"
          statsTitle="Estatisticas descritivas - Atitude Profissional (Docente)"
        />

        <div className={styles.chartContainer} style={{ width: '100%', minHeight: '400px' }}>
          {itensGestaoMedDoc && itensGestaoMedDoc.length > 0 ? (
            <ActivityChart
              chartData={formatMediasItensChartData(itensGestaoMedDoc)}
              title="Médias dos itens relacionados à Gestão Didática (Docente)"
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
            <p>Médias (Gestão Didática) não disponíveis.</p>
          )}
        </div>

        {/* === 8. Proporções dos itens relacionados à Gestão Didática (Docente) === */}
        <div className={styles.chartContainer} style={{ width: '100%', minHeight: '400px' }}>
          {itensGestaoPropDoc && itensGestaoPropDoc.length > 0 ? (
            <ActivityChart
              chartData={formatProporcoesItensChartData(itensGestaoPropDoc)}
              title="Proporções de respostas dadas aos itens relacionados à Gestão Didática (Docente)"
              customOptions={{
                ...disableZoomOptions,
                plugins: {
                  tooltip: twoDecTooltipWithQuestions('%', QUESTION_MAPPING_AVALIA.docente.gestao),
                },
                scales: { x: { ticks: xTicksNoRot }, y: { max: 100 } },
              }}
            />
          ) : (
            <p>Proporções (Gestão Didática) não disponíveis.</p>
          )}
        </div>

        {/* === 9. Médias dos itens relacionados ao Processo Avaliativo (Docente) === */}
        <BoxplotSection
          data={itensGestaoBoxDoc}
          title="Boxplot - Gestao Didatica (Docente)"
          statsTitle="Estatisticas descritivas - Gestao Didatica (Docente)"
        />

        <div className={styles.chartContainer} style={{ width: '100%', minHeight: '400px' }}>
          {procDocMed ? (
            <ActivityChart
              chartData={formatMediasItensChartData(procDocMed)}
              title="Médias dos itens relacionados ao Processo Avaliativo (Docente)"
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
            <p>Médias (Processo Avaliativo) não disponíveis.</p>
          )}
        </div>

        {/* === 10. Proporções dos itens relacionados ao Processo Avaliativo (Docente) === */}
        <div className={styles.chartContainer} style={{ width: '100%', minHeight: '400px' }}>
          {procDocProp ? (
            <ActivityChart
              chartData={formatProporcoesItensChartData(procDocProp)}
              title="Proporções de respostas dadas aos itens relacionados ao Processo Avaliativo (Docente)"
              customOptions={{
                ...disableZoomOptions,
                plugins: {
                  tooltip: twoDecTooltipWithQuestions('%', QUESTION_MAPPING_AVALIA.docente.processo),
                },
                scales: { x: { ticks: xTicksNoRot }, y: { max: 100 } },
              }}
            />
          ) : (
            <p>Proporções (Processo Avaliativo) não disponíveis.</p>
          )}
        </div>

        <BoxplotSection
          data={procDocBox}
          title="Boxplot - Processo Avaliativo (Docente)"
          statsTitle="Estatisticas descritivas - Processo Avaliativo (Docente)"
        />

        <BoxplotSection
          data={docDimBox}
          title="Boxplot - Acao Docente por Dimensao"
          statsTitle="Estatisticas descritivas - Acao Docente por Dimensao"
        />
            </>
          )}

      </div>
    </div>
  );
}
