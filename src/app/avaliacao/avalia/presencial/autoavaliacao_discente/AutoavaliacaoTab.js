'use client';

import ActivityChart from '@/components/charts/ActivityChart';
import BoxplotChart from '@/components/charts/BoxplotChart';
import { QUESTION_MAPPING_AVALIA } from '@/lib/questionMappingAvalia';

export default function AutoavaliacaoTab({
  // estilos / helpers
  styles,
  disableZoomOptions,
  twoDecTooltip,
  twoDecTooltipWithQuestions,
  xTicksNoRot,
  renderDescritivasTable,

  // formatters
  formatMediasItensChartData,
  formatProporcoesItensChartData,

  // âœ… subdim formatters
  formatMediasSubdimChartData,
  formatProporcoesSubdimChartData,

  // âœ… AÃ§Ã£o Docente (subdimensÃµes) - base discente
  acaoDocSubMedDisc,
  acaoDocSubPropDisc,
  acaoDocSubBoxDisc,

  // (mantidos â€” vocÃª jÃ¡ passava, mesmo que nÃ£o use aqui)
  docenteMed,
  docenteProp,
  docenteBox,

  // dados (autoavaliaÃ§Ã£o discente)
  itensAutoMed,
  itensAutoProp,
  itensAutoBox,

  // dados (atitude discente)
  itensAtitudeMedDisc,
  itensAtitudePropDisc,
  itensAtitudeBoxDisc,

  // dados (gestÃ£o discente)
  itensGestaoMedDisc,
  itensGestaoPropDisc,
  itensGestaoBoxDisc,

  // dados (processo avaliativo discente)
  procDiscMed,
  procDiscProp,
  procDiscBox,

  // dados (instalaÃ§Ãµes discente)
  itensInstalacoesMed,
  itensInstalacoesProp,
  itensInstalacoesBoxDisc,

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
        {/* ============================================================
            âœ… AUTOAVALIAÃ‡ÃƒO DISCENTE (ordem igual ao R original)
            Figura 13 (ProporÃ§Ãµes) -> Figura 11 (MÃ©dias) -> Figura 15 (Boxplot)
           ============================================================ */}
        {showDim2 && (
          <>
        {/* Figura 6 */}
        <div className={styles.chartContainer} style={{ width: '100%', minHeight: '400px' }}>
          {acaoDocSubMedDisc ? (
            <ActivityChart
              chartData={formatMediasSubdimChartData(acaoDocSubMedDisc)}
              title="MÃ©dias por SubdimensÃ£o da AvaliaÃ§Ã£o da AÃ§Ã£o Docente"
              customOptions={{
                ...disableZoomOptions,
                plugins: {
                  legend: { display: false },
                  tooltip: twoDecTooltipWithQuestions('', QUESTION_MAPPING_AVALIA.discente.autoavaliacao),
                },
                scales: { x: { ticks: xTicksNoRot }, y: { max: 4 } },
              }}
            />
          ) : (
            <p>MÃ©dias (AÃ§Ã£o Docente por SubdimensÃ£o) nÃ£o disponÃ­veis.</p>
          )}
        </div>

        {/* Figura 8 */}
        <div className={styles.chartContainer} style={{ width: '100%', minHeight: '400px' }}>
          {acaoDocSubPropDisc ? (
            <ActivityChart
              chartData={formatProporcoesSubdimChartData(acaoDocSubPropDisc)}
              title="ProporÃ§Ãµes de respostas dadas por SubdimensÃ£o da AvaliaÃ§Ã£o da AÃ§Ã£o Docente"
              customOptions={{
                ...disableZoomOptions,
                plugins: {
                  tooltip: twoDecTooltipWithQuestions('%', QUESTION_MAPPING_AVALIA.discente.autoavaliacao),
                },
                scales: { x: { ticks: xTicksNoRot }, y: { max: 100 } },
              }}
            />
          ) : (
            <p>ProporÃ§Ãµes (AÃ§Ã£o Docente por SubdimensÃ£o) nÃ£o disponÃ­veis.</p>
          )}
        </div>

        {/* âœ… Figura 10 (logo apÃ³s a Figura 8) + âœ… Tabela descritiva abaixo */}
        {acaoDocSubBoxDisc ? (
          <>
            <div className={styles.chartContainer} style={{ width: '100%', minHeight: '400px' }}>
              <BoxplotChart
                apiData={acaoDocSubBoxDisc}
                title="DistribuiÃ§Ã£o das MÃ©dias das AvaliaÃ§Ãµes das Turmas/Docentes por SubdimensÃ£o da AÃ§Ã£o Docente"
                customOptions={disableZoomOptions}
              />
            </div>

            <div className={styles.chartContainer} style={{ width: '100%', height: 'auto', padding: '1.5rem' }}>
              <h4 style={{ textAlign: 'center', marginBottom: '1rem', color: '#333' }}>
                EstatÃ­sticas descritivas â€“ AÃ§Ã£o Docente (por SubdimensÃ£o)
              </h4>
              <div style={{ display: 'flex', justifyContent: 'center' }}>
                <div style={{ width: '100%' }}>
                  {renderDescritivasTable(acaoDocSubBoxDisc)}
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className={styles.chartContainer} style={{ width: '100%', minHeight: '100px' }}>
            <p>Boxplot e EstatÃ­sticas (AÃ§Ã£o Docente por SubdimensÃ£o) nÃ£o disponÃ­veis.</p>
          </div>
        )}
          </>
        )}

              {showDim1 && (
                <>
                {/* Figura 11 */}
        <div className={styles.chartContainer} style={{ width: '100%', minHeight: '400px' }}>
          {itensAutoMed ? (
            <ActivityChart
              chartData={formatMediasItensChartData(itensAutoMed)}
              title="MÃ©dias dos itens relacionados Ã  AutoavaliaÃ§Ã£o Discente"
              customOptions={{
                ...disableZoomOptions,
                plugins: {
                  legend: { display: false },
                  tooltip: twoDecTooltipWithQuestions('', QUESTION_MAPPING_AVALIA.discente.autoavaliacao),
                },
                scales: { x: { ticks: xTicksNoRot }, y: { max: 4 } },
              }}
            />
          ) : (
            <p>MÃ©dias (AutoavaliaÃ§Ã£o) nÃ£o disponÃ­veis.</p>
          )}
        </div>

        {/* Figura 13 */}
        <div className={styles.chartContainer} style={{ width: '100%', minHeight: '400px' }}>
          {itensAutoProp ? (
            <ActivityChart
              chartData={formatProporcoesItensChartData(itensAutoProp)}
              title="ProporÃ§Ãµes de respostas dadas aos itens relacionados Ã  AutoavaliaÃ§Ã£o Discente"
              customOptions={{
                ...disableZoomOptions,
                plugins: {
                  tooltip: twoDecTooltipWithQuestions('%', QUESTION_MAPPING_AVALIA.discente.autoavaliacao),
                },
                scales: { x: { ticks: xTicksNoRot }, y: { max: 100 } },
              }}
            />
          ) : (
            <p>ProporÃ§Ãµes (AutoavaliaÃ§Ã£o) nÃ£o disponÃ­veis.</p>
          )}
        </div>



        {/* Figura 15 */}
        {itensAutoBox ? (
          <>
            <div className={styles.chartContainer} style={{ width: '100%', minHeight: '400px' }}>
              <BoxplotChart
                apiData={itensAutoBox}
                title="DistribuiÃ§Ã£o das MÃ©dias das AvaliaÃ§Ãµes das Turmas/Docentes por Item relacionado Ã  AutoavaliaÃ§Ã£o Discente"
                customOptions={disableZoomOptions}
              />
            </div>

            <div className={styles.chartContainer} style={{ width: '100%', height: 'auto', padding: '1.5rem' }}>
              <h4 style={{ textAlign: 'center', marginBottom: '1rem', color: '#333' }}>
                EstatÃ­sticas descritivas â€“ AutoavaliaÃ§Ã£o Discente (por item)
              </h4>
              <div style={{ display: 'flex', justifyContent: 'center' }}>
                <div style={{ width: '100%' }}>
                  {renderDescritivasTable(itensAutoBox)}
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className={styles.chartContainer} style={{ width: '100%', minHeight: '100px' }}>
            <p>Boxplot e EstatÃ­sticas (AutoavaliaÃ§Ã£o) nÃ£o disponÃ­veis.</p>
          </div>
        )}
          </>
        )}

        {/* ============================================================
            âœ… AÃ‡ÃƒO DOCENTE (SUBDIMENSÃ•ES) - BASE DISCENTE
            Ordem do R: Figura 8 (ProporÃ§Ãµes) -> Figura 6 (MÃ©dias) -> Figura 10 (Boxplot)
           ============================================================ */}

        {/* ============================================================
            Abaixo: blocos por item (Atitude, GestÃ£o, Processo, InstalaÃ§Ãµes)
            (seu conteÃºdo original permanece)
           ============================================================ */}

        {showDim2 && (
          <>
        {/* === ATITUDE PROFISSIONAL DISCENTE === */}
        <div className={styles.chartContainer} style={{ width: '100%', minHeight: '400px' }}>
          {itensAtitudeMedDisc ? (
            <ActivityChart
              chartData={formatMediasItensChartData(itensAtitudeMedDisc)}
              title="MÃ©dias dos itens relacionados Ã  Atitude Profissional (Discente)"
              customOptions={{
                ...disableZoomOptions,
                plugins: {
                  legend: { display: false },
                  tooltip: twoDecTooltipWithQuestions('', QUESTION_MAPPING_AVALIA.discente.atitude),
                },
                scales: { y: { max: 4 }, x: { ticks: xTicksNoRot } },
              }}
            />
          ) : (
            <p>MÃ©dias (Atitude Profissional) nÃ£o disponÃ­veis.</p>
          )}
        </div>

        <div className={styles.chartContainer} style={{ width: '100%', minHeight: '400px' }}>
          {itensAtitudePropDisc ? (
            <ActivityChart
              chartData={formatProporcoesItensChartData(itensAtitudePropDisc)}
              title="ProporÃ§Ãµes de respostas dadas aos itens relacionados Ã  Atitude Profissional (Discente)"
              customOptions={{
                ...disableZoomOptions,
                plugins: {
                  tooltip: twoDecTooltipWithQuestions('%', QUESTION_MAPPING_AVALIA.discente.atitude),
                },
                scales: { x: { ticks: xTicksNoRot }, y: { max: 100 } },
              }}
            />
          ) : (
            <p>ProporÃ§Ãµes (Atitude Profissional) nÃ£o disponÃ­veis.</p>
          )}
        </div>

        {itensAtitudeBoxDisc ? (
          <>
            <div className={styles.chartContainer} style={{ width: '100%', minHeight: '400px' }}>
              <BoxplotChart
                apiData={itensAtitudeBoxDisc}
                title="DistribuiÃ§Ã£o das MÃ©dias das AvaliaÃ§Ãµes das Turmas/Docentes por Item relacionado Ã  Atitude Profissional"
                customOptions={disableZoomOptions}
              />
            </div>

            <div className={styles.chartContainer} style={{ width: '100%', height: 'auto', padding: '1.5rem' }}>
              <h4 style={{ textAlign: 'center', marginBottom: '1rem', color: '#333' }}>
                EstatÃ­sticas descritivas â€“ Atitude Profissional (Discente)
              </h4>
              <div style={{ display: 'flex', justifyContent: 'center' }}>
                <div style={{ width: '100%' }}>
                  {renderDescritivasTable(itensAtitudeBoxDisc)}
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className={styles.chartContainer} style={{ width: '100%', minHeight: '100px' }}>
            <p>Boxplot e EstatÃ­sticas (Atitude Profissional) nÃ£o disponÃ­veis.</p>
          </div>
        )}

        {/* === GESTÃƒO DIDÃTICA DISCENTE === */}
        <div className={styles.chartContainer} style={{ width: '100%', minHeight: '400px' }}>
          {itensGestaoMedDisc ? (
            <ActivityChart
              chartData={formatMediasItensChartData(itensGestaoMedDisc)}
              title="MÃ©dias dos itens relacionados Ã  GestÃ£o DidÃ¡tica (Discente)"
              customOptions={{
                ...disableZoomOptions,
                plugins: {
                  legend: { display: false },
                  tooltip: twoDecTooltipWithQuestions('', QUESTION_MAPPING_AVALIA.discente.gestao),
                },
                scales: { y: { max: 4 }, x: { ticks: xTicksNoRot } },
              }}
            />
          ) : (
            <p>MÃ©dias (GestÃ£o DidÃ¡tica) nÃ£o disponÃ­veis.</p>
          )}
        </div>

        <div className={styles.chartContainer} style={{ width: '100%', minHeight: '400px' }}>
          {itensGestaoPropDisc ? (
            <ActivityChart
              chartData={formatProporcoesItensChartData(itensGestaoPropDisc)}
              title="ProporÃ§Ãµes de respostas dadas aos itens relacionados Ã  GestÃ£o DidÃ¡tica (Discente)"
              customOptions={{
                ...disableZoomOptions,
                plugins: {
                  tooltip: twoDecTooltipWithQuestions('%', QUESTION_MAPPING_AVALIA.discente.gestao),
                },
                scales: { x: { ticks: xTicksNoRot }, y: { max: 100 } },
              }}
            />
          ) : (
            <p>ProporÃ§Ãµes (GestÃ£o DidÃ¡tica) nÃ£o disponÃ­veis.</p>
          )}
        </div>

        {itensGestaoBoxDisc ? (
          <>
            <div className={styles.chartContainer} style={{ width: '100%', minHeight: '400px' }}>
              <BoxplotChart
                apiData={itensGestaoBoxDisc}
                title="DistribuiÃ§Ã£o das MÃ©dias das AvaliaÃ§Ãµes das Turmas/Docentes por Item relacionado Ã  GestÃ£o DidÃ¡tica"
                customOptions={disableZoomOptions}
              />
            </div>

            <div className={styles.chartContainer} style={{ width: '100%', height: 'auto', padding: '1.5rem' }}>
              <h4 style={{ textAlign: 'center', marginBottom: '1rem', color: '#333' }}>
                EstatÃ­sticas descritivas â€“ GestÃ£o DidÃ¡tica (Discente)
              </h4>
              <div style={{ display: 'flex', justifyContent: 'center' }}>
                <div style={{ width: '100%' }}>
                  {renderDescritivasTable(itensGestaoBoxDisc)}
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className={styles.chartContainer} style={{ width: '100%', minHeight: '100px' }}>
            <p>Boxplot e EstatÃ­sticas (GestÃ£o DidÃ¡tica) nÃ£o disponÃ­veis.</p>
          </div>
        )}

        {/* === PROCESSO AVALIATIVO DISCENTE === */}
        <div className={styles.chartContainer} style={{ width: '100%', minHeight: '400px' }}>
          {procDiscMed ? (
            <ActivityChart
              chartData={formatMediasItensChartData(procDiscMed)}
              title="MÃ©dias dos itens relacionados ao Processo Avaliativo (Discente)"
              customOptions={{
                ...disableZoomOptions,
                plugins: {
                  legend: { display: false },
                  tooltip: twoDecTooltipWithQuestions('', QUESTION_MAPPING_AVALIA.discente.processo),
                },
                scales: { y: { max: 4 }, x: { ticks: xTicksNoRot } },
              }}
            />
          ) : (
            <p>MÃ©dias (Processo Avaliativo) nÃ£o disponÃ­veis.</p>
          )}
        </div>

        <div className={styles.chartContainer} style={{ width: '100%', minHeight: '400px' }}>
          {procDiscProp ? (
            <ActivityChart
              chartData={formatProporcoesItensChartData(procDiscProp)}
              title="ProporÃ§Ãµes de respostas dadas aos itens relacionados ao Processo Avaliativo (Discente)"
              customOptions={{
                ...disableZoomOptions,
                plugins: {
                  tooltip: twoDecTooltipWithQuestions('%', QUESTION_MAPPING_AVALIA.discente.processo),
                },
                scales: { x: { ticks: xTicksNoRot }, y: { max: 100 } },
              }}
            />
          ) : (
            <p>ProporÃ§Ãµes (Processo Avaliativo) nÃ£o disponÃ­veis.</p>
          )}
        </div>

        {procDiscBox ? (
          <>
            <div className={styles.chartContainer} style={{ width: '100%', minHeight: '400px' }}>
              <BoxplotChart
                apiData={procDiscBox}
                title="DistribuiÃ§Ã£o das MÃ©dias das AvaliaÃ§Ãµes das Turmas/Docentes por Item relacionado ao Processo Avaliativo"
                customOptions={disableZoomOptions}
              />
            </div>

            <div className={styles.chartContainer} style={{ width: '100%', height: 'auto', padding: '1.5rem' }}>
              <h4 style={{ textAlign: 'center', marginBottom: '1rem', color: '#333' }}>
                EstatÃ­sticas descritivas â€“ Processo Avaliativo (Discente)
              </h4>
              <div style={{ display: 'flex', justifyContent: 'center' }}>
                <div style={{ width: '100%' }}>
                  {renderDescritivasTable(procDiscBox)}
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className={styles.chartContainer} style={{ width: '100%', minHeight: '100px' }}>
            <p>Boxplot e EstatÃ­sticas (Processo Avaliativo) nÃ£o disponÃ­veis.</p>
          </div>
        )}
          </>
        )}
      </div>
    </div>
  );
}
