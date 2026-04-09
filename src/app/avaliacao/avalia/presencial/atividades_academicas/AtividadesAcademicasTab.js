'use client';

import ActivityChart from '@/components/charts/ActivityChart';

// ======================================================
// Helpers: escala Y dinÃ¢mica (pra nÃ£o ficar "grandÃ£o" com valores pequenos)
// ======================================================
function niceCeil(v) {
  if (v <= 5) return 5;
  if (v <= 10) return 10;
  if (v <= 15) return 15;
  if (v <= 20) return 20;
  if (v <= 25) return 25;
  if (v <= 30) return 30;
  if (v <= 40) return 40;
  if (v <= 50) return 50;
  if (v <= 75) return 75;
  return 100;
}

function getMaxFromChartData(chartData) {
  const all = (chartData?.datasets || [])
    .flatMap((ds) => (ds?.data || []).map((x) => Number(x)))
    .filter((v) => Number.isFinite(v));

  return all.length ? Math.max(...all) : 0;
}

function yOptionsSmart(chartData) {
  const maxVal = getMaxFromChartData(chartData);

  // se nÃ£o tiver dados, cai no padrÃ£o
  if (!Number.isFinite(maxVal) || maxVal <= 0) {
    return {
      min: 0,
      max: 100,
      ticks: { stepSize: 50 },
    };
  }

  // se passar de ~50%, usa 0â€“100 com 0/50/100
  if (maxVal >= 50) {
    return {
      min: 0,
      max: 100,
      ticks: {
        stepSize: 50,
        callback: (v) => (v === 0 || v === 50 || v === 100 ? v : ''),
      },
    };
  }

  // caso comum: valores pequenos -> escala dinÃ¢mica atÃ© um pouco acima do mÃ¡ximo
  const padded = maxVal * 1.1; // +10% de folga
  const yMax = niceCeil(padded);

  // ticks enxutos: 0, metade, topo (3 marcas)
  const step = yMax / 2;

  return {
    min: 0,
    max: yMax,
    ticks: {
      stepSize: step,
      callback: (v) => v,
    },
  };
}

export default function AtividadesAcademicasTab({
  styles,
  disableZoomOptions,
  twoDecTooltip,
  xTicksNoRot,

  // dados
  discenteChartData, // jÃ¡ formatado (datasets.atividades)
  atividadesDoc, // raw da API

  // formatter
  formatAtividadesChartData,
}) {
  // monta o chart do docente 1x pra reaproveitar (evita chamar formatter vÃ¡rias vezes)
  const docenteChartData = atividadesDoc ? formatAtividadesChartData(atividadesDoc) : null;

  return (
    <div style={{ position: 'relative' }}>
      <div className={styles.dashboardLayout} style={{ gridTemplateColumns: '1fr' }}>
        <div className={styles.chartContainerFlex}>
          <ActivityChart
            chartData={discenteChartData}
            title="Percentual de ParticipaÃ§Ã£o em Atividades (Discente)"
            customOptions={{
              ...disableZoomOptions,
              plugins: { tooltip: twoDecTooltip('%') },
              scales: {
                x: { ticks: xTicksNoRot },
                y: yOptionsSmart(discenteChartData),
              },
            }}
          />
        </div>

        <div className={styles.chartContainerFlex}>
          {docenteChartData ? (
            <ActivityChart
              chartData={docenteChartData}
              title="Percentual de ParticipaÃ§Ã£o em Atividades (Docente)"
              customOptions={{
                ...disableZoomOptions,
                plugins: { tooltip: twoDecTooltip('%') },
                scales: {
                  x: { ticks: xTicksNoRot },
                  y: yOptionsSmart(docenteChartData),
                },
              }}
            />
          ) : (
            <p>Dados de atividades do docente nÃ£o disponÃ­veis.</p>
          )}
        </div>
      </div>
    </div>
  );
}
