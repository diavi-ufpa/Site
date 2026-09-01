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
import TecnicoFilters from '@/features/minhaopiniao/components/TecnicoFilters';
import QuestionChart from '@/components/charts/QuestionChart';

// Utils e Estilos
import styles from '../../../../styles/dados.module.css';
import { questionMappingTecnico, ratingToScore } from '@/lib/questionMappingTecnico';
import { dimensionMappingTecnico } from '@/lib/dimensionMappingTecnico';

const DEFAULT_FILTERS = {
  lotacao: 'todos',
  exercicio: 'todos',
  cargo: 'todos',
  pergunta: 'todas',
  dimensao: 'todas',
};

/* ==========================================================================
   PARSER DE CSV ROBUSTO (Máquina de Estado)
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
      if (columns.length < 30) return null;

      // REGRA DE DESCARTE: Mais de 3 nulos nas perguntas (Índices 9 a 36 no CSV)
      let nullCount = 0;
      for (let j = 9; j <= 36; j++) {
        const val = columns[j];
        if (!val || val === 'NULL' || val === 'N/I' || val === '') {
          nullCount++;
        }
      }
      if (nullCount > 3) return null;

      const rowObj = {
        CARGO_TECNICO: columns[5] || 'N/I',
        UND_LOTACAO_TECNICO: columns[6] || 'N/I',
        UND_EXERCICIO_TECNICO: columns[7] || 'N/I',
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

export default function TecnicoPage() {
  const { cache, saveToCache } = useGlobalData();
  const { authorizedFetch } = useAuth();
  const [allData, setAllData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [compareEnabled, setCompareEnabled] = useState(false);

  const [selectedFiltersA, setSelectedFiltersA] = useState(DEFAULT_FILTERS);
  const [selectedFiltersB, setSelectedFiltersB] = useState(DEFAULT_FILTERS);

  useEffect(() => {
    if (cache.tecnico && cache.tecnico.length > 0) {
      setAllData(cache.tecnico);
      setLoading(false);
      return;
    }
    async function loadData() {
      try {
        const res = await authorizedFetch('/api/tecnico');
        if (!res.ok) throw new Error('Falha ao buscar dados técnicos');

        const textData = await res.text();
        const data = parseCSV(textData);

        saveToCache('tecnico', data);
        setAllData(data);
        setLoading(false);
      } catch (e) {
        console.error('Erro ao carregar técnicos:', e);
        setLoading(false);
      }
    }
    loadData();
  }, [cache.tecnico, saveToCache, authorizedFetch]);

  const filteredDataA = useMemo(
    () => (loading ? [] : applyFiltersTecnico(allData, selectedFiltersA)),
    [allData, selectedFiltersA, loading]
  );
  const filteredDataB = useMemo(
    () => (loading ? [] : applyFiltersTecnico(allData, selectedFiltersB)),
    [allData, selectedFiltersB, loading]
  );

  const filterOptionsA = useMemo(
    () => buildTecnicoFilterOptions(allData, selectedFiltersA),
    [allData, selectedFiltersA]
  );
  const filterOptionsB = useMemo(
    () => buildTecnicoFilterOptions(allData, selectedFiltersB),
    [allData, selectedFiltersB]
  );

  const topLotacaoA = useMemo(() => calcTopLotacaoTecnico(filteredDataA), [filteredDataA]);
  const topLotacaoB = useMemo(() => calcTopLotacaoTecnico(filteredDataB), [filteredDataB]);

  const chartsA = useMemo(
    () => buildChartsTecnico(filteredDataA, selectedFiltersA, false),
    [filteredDataA, selectedFiltersA]
  );
  const chartsB = useMemo(
    () => buildChartsTecnico(filteredDataB, selectedFiltersB, true),
    [filteredDataB, selectedFiltersB]
  );
  const chartsBByName = useMemo(() => new Map(chartsB.map((c) => [c.dimensionName, c])), [chartsB]);

  const handleFilterChangeA = (e) =>
    setSelectedFiltersA((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  const handleFilterChangeB = (e) =>
    setSelectedFiltersB((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const specialPairSideBySide = compareEnabled && chartsA.length === 1 && chartsB.length === 1;

  if (loading) {
    return (
      <div className={styles.mainContent}>
        <Header
          title="Minha Opinião • Técnicos"
          subtitle="Análise das respostas do questionário institucional dos técnico-administrativos"
        />
        <DashboardSkeleton />
      </div>
    );
  }

  return (
    <div className={styles.mainContent}>
      <Header
        title="Minha Opinião • Técnicos"
        subtitle="Análise das respostas do questionário institucional dos técnico-administrativos"
      />

      <div className={`${styles.statsGrid} ${compareEnabled ? styles.statsGridCompare : ''}`}>
        <StatCard
          title={compareEnabled ? 'Total Participantes (A)' : 'Total de Participantes'}
          value={filteredDataA.length.toLocaleString('pt-BR')}
          icon={<Users size={24} color="#FF8E29" />}
        />
        <StatCard
          title={compareEnabled ? 'Top Lotação (A)' : 'Lotação com Mais Participantes'}
          value={`${topLotacaoA.name} — ${topLotacaoA.count.toLocaleString('pt-BR')}`}
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
              value={`${topLotacaoB.name} — ${topLotacaoB.count.toLocaleString('pt-BR')}`}
              icon={<Building size={24} color="#288FB4" />}
            />
          </>
        )}
      </div>

      <div className={compareEnabled ? styles.filtersCompareGrid : styles.filtersSingle}>
        <TecnicoFilters
          title={compareEnabled ? 'Filtros — Recorte (A)' : 'Filtros de Seleção'}
          filters={filterOptionsA}
          selectedFilters={selectedFiltersA}
          onFilterChange={handleFilterChangeA}
          questionMap={questionMappingTecnico}
          dimensionMap={dimensionMappingTecnico}
          showCompareToggle
          compareEnabled={compareEnabled}
          onCompareChange={(checked) => {
            setCompareEnabled(checked);
            if (checked) setSelectedFiltersB({ ...selectedFiltersA });
          }}
        />
        {compareEnabled && (
          <TecnicoFilters
            title="Filtros — Recorte (B)"
            filters={filterOptionsB}
            selectedFilters={selectedFiltersB}
            onFilterChange={handleFilterChangeB}
            questionMap={questionMappingTecnico}
            dimensionMap={dimensionMappingTecnico}
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
                    chartData={chartsA[0].chartData}
                    title={`${chartsA[0].dimensionName} (A)`}
                    questionMap={questionMappingTecnico}
                  />
                </div>
                <div className={styles.chartContainerCard}>
                  <QuestionChart
                    chartData={chartsB[0].chartData}
                    title={`${chartsB[0].dimensionName} (B)`}
                    questionMap={questionMappingTecnico}
                  />
                </div>
              </div>
            </section>
          ) : (
            chartsA.map(({ dimensionName, chartData }) => {
              const chartB = chartsBByName.get(dimensionName);
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
                        questionMap={questionMappingTecnico}
                      />
                    </div>
                    {chartB && (
                      <div className={styles.chartContainerCard}>
                        <QuestionChart
                          chartData={chartB.chartData}
                          title={`${dimensionName} (B)`}
                          questionMap={questionMappingTecnico}
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
            {chartsA.length === 0 ? (
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
              chartsA.map(({ dimensionName, chartData }) => (
                <div
                  key={`dim-card-${dimensionName}`}
                  className={styles.chartContainerCard}
                  style={chartsA.length === 1 ? { gridColumn: '1 / -1' } : {}}
                >
                  <QuestionChart
                    chartData={chartData}
                    title={String(dimensionName)}
                    questionMap={questionMappingTecnico}
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
function applyFiltersTecnico(data, f) {
  if (!Array.isArray(data)) return [];
  return data.filter(
    (d) =>
      (f.lotacao === 'todos' || d.UND_LOTACAO_TECNICO === f.lotacao) &&
      (f.exercicio === 'todos' || d.UND_EXERCICIO_TECNICO === f.exercicio) &&
      (f.cargo === 'todos' || d.CARGO_TECNICO === f.cargo)
  );
}

function buildTecnicoFilterOptions(data) {
  if (!data || !data.length) return { lotacoes: [], exercicios: [], cargos: [] };
  const uniq = (k) =>
    [...new Set(data.map((r) => r[k]))]
      .filter((v) => v && !/^(não informado|nao informado|n\/i|\d+)$/i.test(String(v)))
      .sort((a, b) => String(a).localeCompare(String(b), 'pt-BR'));

  return {
    lotacoes: uniq('UND_LOTACAO_TECNICO'),
    exercicios: uniq('UND_EXERCICIO_TECNICO'),
    cargos: uniq('CARGO_TECNICO'),
  };
}

function calcTopLotacaoTecnico(data) {
  if (!data?.length) return { name: '-', count: 0 };
  const counts = data.reduce((acc, r) => {
    const l = r.UND_LOTACAO_TECNICO || 'N/I';
    acc[l] = (acc[l] || 0) + 1;
    return acc;
  }, {});
  const top = Object.entries(counts).sort((a, b) => b[1] - a[1])[0];
  return { name: top ? top[0] : '-', count: top ? top[1] : 0 };
}

function buildChartsTecnico(filteredData, f, isB) {
  if (!dimensionMappingTecnico) return [];
  const bg = isB ? 'rgba(40, 143, 180, 0.85)' : 'rgba(255, 142, 41, 0.85)';
  const border = isB ? 'rgba(40, 143, 180, 1)' : 'rgba(255, 142, 41, 1)';

  return Object.entries(dimensionMappingTecnico)
    .filter(([name]) => f.dimensao === 'todas' || name === f.dimensao)
    .map(([name, codes]) => {
      const labels = [];
      const points = [];
      for (const code of codes) {
        if (f.pergunta !== 'todas' && code !== f.pergunta) continue;
        const match = code.match(/\.(\d+)$/);
        const qNum = match ? parseInt(match[1], 10) : null;
        const dataKey = qNum ? `Pergunta_${qNum + 84}` : code;

        const scores = filteredData
          .map((i) => {
            const val = i[dataKey];
            if (ratingToScore && ratingToScore[val] !== undefined) return ratingToScore[val];
            const n = parseFloat(val);
            return !isNaN(n) ? n : null;
          })
          .filter((v) => v !== null && v !== undefined);

        if (scores.length) {
          labels.push(code);
          points.push(Number((scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(2)));
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
                  data: points,
                  backgroundColor: bg,
                  borderColor: border,
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
