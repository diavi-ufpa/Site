// DimensoesGeraisTab.js
'use client';

import ActivityChart from '@/components/charts/ActivityChart';
import BoxplotChart from '@/components/charts/BoxplotChart';

export default function DimensoesGeraisTab({
  datasets,
  dashboardData,
  styles,
  disableZoomOptions,
  twoDecTooltip,
  renderDescritivasTable,
}) {
  return (
    <div
      style={{
        position: 'relative',
        gap: '1rem',
        overflow: 'visible',
      }}
    >
      <div className={styles.singleGrid}>
        {/* Linha 1: MÃ©dias */}
        <div id="chart-medias-dimensoes" className={styles.chartContainer}>
          <ActivityChart
            chartData={datasets.discMedias}
            title="MÃ©dias por dimensÃ£o (Discente)"
            customOptions={{
              ...disableZoomOptions,
              plugins: {
                legend: { display: false },
                tooltip: twoDecTooltip(),
              },
            }}
          />
        </div>

        <div className={styles.chartContainer}>
          {dashboardData.docDimMedias ? (
            <ActivityChart
              chartData={datasets.docMedias}
              title="MÃ©dias por dimensÃ£o (Docente)"
              customOptions={{
                ...disableZoomOptions,
                plugins: {
                  legend: { display: false },
                  tooltip: twoDecTooltip(),
                },
              }}
            />
          ) : (
            <p>Dados de mÃ©dias por dimensÃ£o (Docente) nÃ£o disponÃ­veis.</p>
          )}
        </div>

        {/* Linha 2: ProporÃ§Ãµes */}
        <div id="chart-dimensoes" className={styles.chartContainer}>
          <ActivityChart
            chartData={datasets.discProporcoes}
            title="ProporÃ§Ãµes de respostas dadas por DimensÃ£o (Discente)"
            legendPosition="overlayTopRight"
            customOptions={{
              ...disableZoomOptions,
              plugins: { tooltip: twoDecTooltip('%') },
            }}
          />
        </div>

        <div className={styles.chartContainer}>
          {dashboardData.docDimProporcoes ? (
            <ActivityChart
              chartData={datasets.docProporcoes}
              title="ProporÃ§Ãµes de respostas dadas por DimensÃ£o (Docente)"
              legendPosition="overlayTopRight"
              customOptions={{
                ...disableZoomOptions,
                plugins: { tooltip: twoDecTooltip('%') },
              }}
            />
          ) : (
            <p>Dados de proporÃ§Ãµes por dimensÃ£o (Docente) nÃ£o disponÃ­veis.</p>
          )}
        </div>
      </div>

      {/* ADICIONADO id="chart-boxplot-dimensoes" PARA O PDF ENCONTRAR O GRÃFICO */}
      <div
        id="chart-boxplot-dimensoes"
        className={styles.chartContainer}
        style={{ gridColumn: '1 / -1', minHeight: '400px' }}
      >
        {dashboardData.turmaDimBoxplot ? (
          <BoxplotChart
            apiData={dashboardData.turmaDimBoxplot}
            title="DistribuiÃ§Ã£o das MÃ©dias das AvaliaÃ§Ãµes das Turmas/Docente por DimensÃ£o"
            customOptions={disableZoomOptions}
          />
        ) : (
          <p>Dados de boxplot (Turmas/Docente por DimensÃ£o) nÃ£o disponÃ­veis.</p>
        )}
      </div>

      {/* Caixa 2: A tabela em um container separado, para nÃ£o dar sobreposiÃ§Ã£o */}
      <div
        className={styles.chartContainer}
        style={{ gridColumn: '1 / -1', height: 'auto', padding: '1.5rem' }}
      >
        <h3
          style={{
            margin: '0 0 10px 0',
            textAlign: 'center',
            width: '100%',
          }}
        >
          EstatÃ­sticas Descritivas das MÃ©dias das AvaliaÃ§Ãµes das Turmas/Docentes por
          DimensÃ£o
        </h3>

        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <div style={{ width: '100%' }}>
            {renderDescritivasTable(dashboardData.turmaDimDescritivas)}
          </div>
        </div>
      </div>
    </div>
  );
}
