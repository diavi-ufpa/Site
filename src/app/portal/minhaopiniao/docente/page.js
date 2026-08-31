'use client';

import { useState, useEffect, useMemo } from 'react';
import { Users, Building, Award, HelpCircle } from 'lucide-react';

// Contexto Global
import { useGlobalData } from '@/contexts/DataContext';
import { useAuth } from '@/contexts/AuthContext';

// Componentes
import Header from '@/components/ui/Header';
import StatCard from '@/components/ui/StatCard';
import DashboardSkeleton from '@/components/ui/DashboardSkeleton';
import DocenteFilters from '@/features/minhaopiniao/components/DocenteFilters';
import QuestionChart from '@/components/charts/QuestionChart';

// Utils e Estilos
import styles from '../../../../styles/dados.module.css';
import { questionMappingDocente, ratingToScore } from '@/lib/questionMappingDocente';
import { dimensionMapping as dimensionMappingDocente } from '@/lib/DimensionMappingDocente';

const DEFAULT_FILTERS = {
  lotacao: 'todos',
  cargo: 'todos',
  pergunta: 'todas',
  dimensao: 'todas',
};

/* ==========================================================================
   PARSER ROBUSTO (MÁQUINA DE ESTADO)
   Filtra docentes com mais de 3 respostas nulas (NULL).
   ========================================================================== */
function parseCSV(text) {
  const rows = [];
  let currentRow = [];
  let currentVal = '';
  let insideQuote = false;
  const cleanText = text.replace(/\r\n/g, '\n');

  for (let i = 0; i < cleanText.length; i++) {
    const char = cleanText[i];
    const nextChar = cleanText[i + 1];

    if (char === '"') {
      if (insideQuote && nextChar === '"') {
        currentVal += '"';
        i++;
      } else {
        insideQuote = !insideQuote;
      }
    } else if (char === ',' && !insideQuote) {
      currentRow.push(currentVal.trim());
      currentVal = '';
    } else if (char === '\n' && !insideQuote) {
      currentRow.push(currentVal.trim());
      if (currentRow.length > 0) rows.push(currentRow);
      currentRow = [];
      currentVal = '';
    } else {
      currentVal += char;
    }
  }

  if (currentVal || currentRow.length > 0) {
    currentRow.push(currentVal.trim());
    rows.push(currentRow);
  }

  if (rows.length < 2) return [];

  const headers = rows[0];
  const dataRows = rows.slice(1);

  return dataRows
    .map((columns) => {
      if (columns.length < 40) return null;

      // Filtro de nulls (Perguntas 35 a 82)
      let nullCount = 0;
      for (let j = 9; j <= 56; j++) {
        const val = columns[j];
        if (!val || val === 'NULL' || val === 'N/I') {
          nullCount++;
        }
      }

      if (nullCount > 3) return null;

      const rowObj = {
        CARGO_DOCENTE: columns[5] || 'N/I',
        UND_LOTACAO_DOCENTE: columns[6] || 'N/I',
      };

      headers.forEach((header, index) => {
        if (header.startsWith('Pergunta_')) {
          rowObj[header] = columns[index];
        }
      });

      return rowObj;
    })
    .filter(Boolean);
}

export default function DocentePage() {
  const { cache, saveToCache } = useGlobalData();
  const { authorizedFetch } = useAuth();

  const [allData, setAllData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [compareEnabled, setCompareEnabled] = useState(false);

  const [selectedFiltersA, setSelectedFiltersA] = useState(DEFAULT_FILTERS);
  const [selectedFiltersB, setSelectedFiltersB] = useState(DEFAULT_FILTERS);

  useEffect(() => {
    if (cache.docente && cache.docente.length > 0) {
      setAllData(cache.docente);
      setLoading(false);
      return;
    }

    async function loadTeacherData() {
      try {
        const response = await authorizedFetch('/api/docente');
        if (!response.ok) throw new Error('Falha ao buscar dados');

        const textData = await response.text();
        const data = parseCSV(textData);

        saveToCache('docente', data);
        setAllData(data);
        setLoading(false);
      } catch (err) {
        console.error('Erro ao carregar dados docentes:', err);
        setLoading(false);
      }
    }
    loadTeacherData();
  }, [cache.docente, saveToCache, authorizedFetch]);

  const filteredDataA = useMemo(
    () => (loading ? [] : applyFiltersDocente(allData, selectedFiltersA)),
    [allData, selectedFiltersA, loading]
  );
  const filteredDataB = useMemo(
    () => (loading ? [] : applyFiltersDocente(allData, selectedFiltersB)),
    [allData, selectedFiltersB, loading]
  );

  const filterOptionsA = useMemo(
    () => buildDocenteFilterOptions(allData, selectedFiltersA),
    [allData, selectedFiltersA]
  );
  const filterOptionsB = useMemo(
    () => buildDocenteFilterOptions(allData, selectedFiltersB),
    [allData, selectedFiltersB]
  );

  const topLotacaoA = useMemo(() => calcTopLotacao(filteredDataA), [filteredDataA]);
  const topLotacaoB = useMemo(() => calcTopLotacao(filteredDataB), [filteredDataB]);

  const chartsByDimensionA = useMemo(
    () => buildChartsByDimensionDocente(filteredDataA, selectedFiltersA, false),
    [filteredDataA, selectedFiltersA]
  );
  const chartsByDimensionB = useMemo(
    () => buildChartsByDimensionDocente(filteredDataB, selectedFiltersB, true),
    [filteredDataB, selectedFiltersB]
  );

  const bMap = useMemo(
    () => new Map((chartsByDimensionB || []).map((c) => [c.dimensionName, c])),
    [chartsByDimensionB]
  );

  const handleFilterChangeA = (e) => {
    const { name, value } = e.target;
    setSelectedFiltersA((prev) => ({ ...prev, [name]: value }));
  };

  const handleFilterChangeB = (e) => {
    const { name, value } = e.target;
    setSelectedFiltersB((prev) => ({ ...prev, [name]: value }));
  };

  const specialPairSideBySide =
    compareEnabled && chartsByDimensionA.length === 1 && chartsByDimensionB.length === 1;

  if (loading) {
    return (
      <div className={styles.mainContent}>
        <Header
          title="Minha Opinião • Docentes"
          subtitle="Análise das respostas do questionário institucional dos docentes"
        />
        <DashboardSkeleton />
      </div>
    );
  }

  return (
    <div className={styles.mainContent}>
      <Header
        title="Minha Opinião • Docentes"
        subtitle="Análise das respostas do questionário institucional dos docentes"
      />

      <div className={`${styles.statsGrid} ${compareEnabled ? styles.statsGridCompare : ''}`}>
        <StatCard
          title={compareEnabled ? 'Total Participantes (A)' : 'Total de Participantes'}
          value={filteredDataA.length.toLocaleString('pt-BR')}
          icon={<Users size={24} color="#FF8E29" />}
        />
        <StatCard
          title={compareEnabled ? 'Top Lotação (A)' : 'Lotação com Mais Participantes'}
          value={topLotacaoA}
          icon={<Building size={24} color="#FF8E29" />}
        />

        {compareEnabled && (
          <>
            <StatCard
              title="Total Participantes (B)"
              value={filteredDataB.length.toLocaleString('pt-BR')}
              icon={<Users size={24} color="#288FB4" />}
            />
            <StatCard
              title="Top Lotação (B)"
              value={topLotacaoB}
              icon={<Building size={24} color="#288FB4" />}
            />
          </>
        )}
      </div>

      <div className={compareEnabled ? styles.filtersCompareGrid : styles.filtersSingle}>
        <DocenteFilters
          title={compareEnabled ? 'Filtros — Recorte (A)' : 'Filtros de Seleção'}
          filters={filterOptionsA}
          selectedFilters={selectedFiltersA}
          onFilterChange={handleFilterChangeA}
          questionMap={questionMappingDocente}
          dimensionMap={dimensionMappingDocente}
          showCompareToggle
          compareEnabled={compareEnabled}
          onCompareChange={(checked) => {
            setCompareEnabled(checked);
            if (checked) setSelectedFiltersB({ ...selectedFiltersA });
          }}
        />

        {compareEnabled && (
          <DocenteFilters
            title="Filtros — Recorte (B)"
            filters={filterOptionsB}
            selectedFilters={selectedFiltersB}
            onFilterChange={handleFilterChangeB}
            questionMap={questionMappingDocente}
            dimensionMap={dimensionMappingDocente}
          />
        )}
      </div>

      <div className={styles.chartsMainContainer}>
        {compareEnabled ? (
          specialPairSideBySide ? (
            <section className={styles.dimensionWrapper}>
              <div className={styles.equalGrid}>
                <div className={styles.chartContainerCard}>
                  <QuestionChart
                    chartData={chartsByDimensionA[0].chartData}
                    title={`${chartsByDimensionA[0].dimensionName} (A)`}
                    questionMap={questionMappingDocente}
                  />
                </div>
                <div className={styles.chartContainerCard}>
                  <QuestionChart
                    chartData={chartsByDimensionB[0].chartData}
                    title={`${chartsByDimensionB[0].dimensionName} (B)`}
                    questionMap={questionMappingDocente}
                  />
                </div>
              </div>
            </section>
          ) : (
            chartsByDimensionA.map(({ dimensionName, chartData }) => {
              const chartB = bMap.get(dimensionName);
              return (
                <section key={`dim-section-${dimensionName}`} className={styles.dimensionWrapper}>
                  <div className={styles.equalGrid}>
                    <div
                      className={styles.chartContainerCard}
                      style={!chartB ? { gridColumn: '1 / -1' } : undefined}
                    >
                      <QuestionChart
                        chartData={chartData}
                        title={`${dimensionName} (A)`}
                        questionMap={questionMappingDocente}
                      />
                    </div>
                    {chartB && (
                      <div className={styles.chartContainerCard}>
                        <QuestionChart
                          chartData={chartB.chartData}
                          title={`${dimensionName} (B)`}
                          questionMap={questionMappingDocente}
                        />
                      </div>
                    )}
                  </div>
                </section>
              );
            })
          )
        ) : (
          <div className={styles.singleGrid}>
            {chartsByDimensionA.length === 0 ? (
              <div
                className={styles.chartContainerCard}
                style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '3rem 1rem' }}
              >
                <HelpCircle size={40} color="#9ca3af" style={{ margin: '0 auto 1rem' }} />
                <p style={{ color: '#6b7280', fontSize: '1rem', margin: 0 }}>
                  Nenhum dado encontrado para a combinação de filtros selecionada.
                </p>
              </div>
            ) : (
              chartsByDimensionA.map(({ dimensionName, chartData }) => (
                <div
                  key={`dim-card-${dimensionName}`}
                  className={styles.chartContainerCard}
                  style={chartsByDimensionA.length === 1 ? { gridColumn: '1 / -1' } : {}}
                >
                  <QuestionChart
                    chartData={chartData}
                    title={String(dimensionName)}
                    questionMap={questionMappingDocente}
                  />
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}

/* ==========================================================================
   HELPERS
   ========================================================================== */
function applyFiltersDocente(allData, selectedFilters) {
  if (!Array.isArray(allData)) return [];
  const f = selectedFilters || {};
  return allData.filter((d) => {
    return (
      (f.lotacao === 'todos' || d.UND_LOTACAO_DOCENTE === f.lotacao) &&
      (f.cargo === 'todos' || d.CARGO_DOCENTE === f.cargo)
    );
  });
}

function buildDocenteFilterOptions(allData, selectedFilters) {
  if (!Array.isArray(allData) || !allData.length) return { lotacoes: [], cargos: [] };

  const uniq = (key) => {
    const s = new Set();
    for (const r of allData) {
      const v = String(r[key] || '').trim();
      if (v && !['não informado', 'nao informado', 'n/i'].includes(v.toLowerCase())) {
        s.add(v);
      }
    }
    return [...s].sort((a, b) => a.localeCompare(b, 'pt-BR'));
  };

  return {
    lotacoes: uniq('UND_LOTACAO_DOCENTE'),
    cargos: uniq('CARGO_DOCENTE'),
  };
}

function calcTopLotacao(data) {
  if (!data?.length) return '-';
  const counts = data.reduce((acc, r) => {
    const l = r.UND_LOTACAO_DOCENTE || 'N/I';
    acc[l] = (acc[l] || 0) + 1;
    return acc;
  }, {});
  const top = Object.entries(counts).sort((a, b) => b[1] - a[1])[0];
  return top ? `${top[0]} — ${top[1].toLocaleString('pt-BR')}` : '-';
}

function buildChartsByDimensionDocente(filteredData, selectedFilters, isB = false) {
  if (!dimensionMappingDocente) return [];
  const sDim = selectedFilters?.dimensao || 'todas';
  const sQ = selectedFilters?.pergunta || 'todas';

  const bgColor = isB ? 'rgba(40, 143, 180, 0.85)' : 'rgba(255, 142, 41, 0.85)';
  const borderColor = isB ? 'rgba(40, 143, 180, 1)' : 'rgba(255, 142, 41, 1)';

  return Object.entries(dimensionMappingDocente)
    .filter(([name]) => sDim === 'todas' || name === sDim)
    .map(([name, questionCodes]) => {
      const labels = [];
      const data = [];

      for (const code of questionCodes) {
        if (sQ !== 'todas' && code !== sQ) continue;

        const match = code.match(/\.(\d+)$/);
        const qNum = match ? parseInt(match[1], 10) : null;
        const dataKey = qNum ? `Pergunta_${qNum + 34}` : code;

        const scores = filteredData
          .map((i) => {
            const val = i[dataKey];
            if (ratingToScore && ratingToScore[val] !== undefined) return ratingToScore[val];
            const numeric = parseFloat(val);
            return !isNaN(numeric) ? numeric : null;
          })
          .filter((v) => v !== null && v !== undefined);

        if (scores.length) {
          const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
          labels.push(code);
          data.push(Number(avg.toFixed(2)));
        }
      }

      return labels.length
        ? {
            dimensionName: name,
            chartData: {
              labels,
              datasets: [
                {
                  label: 'Média',
                  data,
                  backgroundColor: bgColor,
                  borderColor: borderColor,
                  borderWidth: 1,
                  borderRadius: 6,
                },
              ],
            },
          }
        : null;
    })
    .filter(Boolean);
}
