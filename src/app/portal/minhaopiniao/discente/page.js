'use client';

import { useState, useEffect, useMemo } from 'react';
import { Users, Building2, Award, BarChart3, HelpCircle } from 'lucide-react';

// Contexto Global
import { useGlobalData } from '@/contexts/DataContext';
import { useAuth } from '@/contexts/AuthContext';

// Componentes
import Header from '@/components/ui/Header';
import StatCard from '@/components/ui/StatCard';
import DashboardSkeleton from '@/components/ui/DashboardSkeleton';
import DiscenteFilters from '@/features/minhaopiniao/components/DiscenteFilters';
import QuestionChart from '@/components/charts/QuestionChart';

// Utils e Estilos
import styles from '../../../../styles/dados.module.css';
import { questionMapping, ratingToScore } from '@/lib/questionMapping';
import { dimensionMapping } from '@/lib/DimensionMappingDiscente';

const DEFAULT_FILTERS = {
  campus: 'todos',
  unidade: 'todos',
  curso: 'todos',
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

  const dataRows = rows.slice(1);
  return dataRows
    .map((columns) => {
      if (columns.length < 10) return null;

      const rowObj = {
        CURSO_DISCENTE: columns[3] || 'N/I',
        CAMPUS_DISCENTE: columns[4] ? columns[4].replace(/^"|"$/g, '') : 'N/I',
        UNIDADE_DISCENTE: columns[5] ? columns[5].replace(/^"|"$/g, '') : 'N/I',
      };

      for (let q = 1; q <= 34; q++) {
        rowObj[`Pergunta_${q}`] = columns[6 + q];
      }
      return rowObj;
    })
    .filter(Boolean);
}

export default function DiscentePage() {
  const { cache, saveToCache } = useGlobalData();
  const { authorizedFetch } = useAuth();

  const [allData, setAllData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [compareEnabled, setCompareEnabled] = useState(false);

  const [selectedFiltersA, setSelectedFiltersA] = useState(DEFAULT_FILTERS);
  const [selectedFiltersB, setSelectedFiltersB] = useState(DEFAULT_FILTERS);

  useEffect(() => {
    if (cache.discente && cache.discente.length > 0) {
      setAllData(cache.discente);
      setLoading(false);
      return;
    }

    async function loadData() {
      try {
        const response = await authorizedFetch('/api/discente');
        if (!response.ok) throw new Error('Falha ao buscar dados');

        const textData = await response.text();
        const data = parseCSV(textData);

        saveToCache('discente', data);
        setAllData(data);
        setLoading(false);
      } catch (err) {
        console.error('Erro ao carregar dados discentes:', err);
        setLoading(false);
      }
    }
    loadData();
  }, [cache.discente, saveToCache, authorizedFetch]);

  const filteredDataA = useMemo(
    () => (loading ? [] : applyFilters(allData, selectedFiltersA)),
    [allData, selectedFiltersA, loading]
  );
  const filteredDataB = useMemo(
    () => (loading ? [] : applyFilters(allData, selectedFiltersB)),
    [allData, selectedFiltersB, loading]
  );

  const filterOptionsA = useMemo(
    () => buildFilterOptions(allData, selectedFiltersA),
    [allData, selectedFiltersA]
  );
  const filterOptionsB = useMemo(
    () => buildFilterOptions(allData, selectedFiltersB),
    [allData, selectedFiltersB]
  );

  const topUnitA = useMemo(() => calcTopUnit(filteredDataA), [filteredDataA]);
  const topUnitB = useMemo(() => calcTopUnit(filteredDataB), [filteredDataB]);

  const chartsByDimensionA = useMemo(
    () =>
      buildChartsByDimension(
        filteredDataA,
        'rgba(255, 142, 41, 0.85)',
        'rgba(255, 142, 41, 1)',
        selectedFiltersA
      ),
    [filteredDataA, selectedFiltersA]
  );
  const chartsByDimensionB = useMemo(
    () =>
      buildChartsByDimension(
        filteredDataB,
        'rgba(40, 143, 180, 0.85)',
        'rgba(40, 143, 180, 1)',
        selectedFiltersB
      ),
    [filteredDataB, selectedFiltersB]
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
          title="Minha Opinião • Discentes"
          subtitle="Análise das respostas do questionário institucional dos discentes"
        />
        <DashboardSkeleton />
      </div>
    );
  }

  return (
    <div className={styles.mainContent}>
      <Header
        title="Minha Opinião • Discentes"
        subtitle="Análise das respostas do questionário institucional dos discentes"
      />

      <div className={`${styles.statsGrid} ${compareEnabled ? styles.statsGridCompare : ''}`}>
        <StatCard
          title={compareEnabled ? 'Total Participantes (A)' : 'Total de Participantes'}
          value={filteredDataA.length.toLocaleString('pt-BR')}
          icon={<Users size={24} color="#FF8E29" />}
        />
        <StatCard
          title={compareEnabled ? 'Top Unidade (A)' : 'Unidade com Mais Participantes'}
          value={`${topUnitA.name} — ${topUnitA.count.toLocaleString('pt-BR')}`}
          icon={<Building2 size={24} color="#FF8E29" />}
        />

        {compareEnabled && (
          <>
            <StatCard
              title="Total Participantes (B)"
              value={filteredDataB.length.toLocaleString('pt-BR')}
              icon={<Users size={24} color="#288FB4" />}
            />
            <StatCard
              title="Top Unidade (B)"
              value={`${topUnitB.name} — ${topUnitB.count.toLocaleString('pt-BR')}`}
              icon={<Building2 size={24} color="#288FB4" />}
            />
          </>
        )}
      </div>

      <div className={compareEnabled ? styles.filtersCompareGrid : styles.filtersSingle}>
        <DiscenteFilters
          title={compareEnabled ? 'Filtros — Recorte (A)' : 'Filtros de Seleção'}
          filters={filterOptionsA}
          selectedFilters={selectedFiltersA}
          onFilterChange={handleFilterChangeA}
          questionMap={questionMapping}
          dimensionMap={dimensionMapping}
          showCompareToggle
          compareEnabled={compareEnabled}
          onCompareChange={(checked) => {
            setCompareEnabled(checked);
            if (checked) setSelectedFiltersB({ ...selectedFiltersA });
          }}
        />

        {compareEnabled && (
          <DiscenteFilters
            title="Filtros — Recorte (B)"
            filters={filterOptionsB}
            selectedFilters={selectedFiltersB}
            onFilterChange={handleFilterChangeB}
            questionMap={questionMapping}
            dimensionMap={dimensionMapping}
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
                    questionMap={questionMapping}
                  />
                </div>
                <div className={styles.chartContainerCard}>
                  <QuestionChart
                    chartData={chartsByDimensionB[0].chartData}
                    title={`${chartsByDimensionB[0].dimensionName} (B)`}
                    questionMap={questionMapping}
                  />
                </div>
              </div>
            </section>
          ) : (
            <CompareDimensions
              chartsA={chartsByDimensionA}
              chartsB={chartsByDimensionB}
              questionMap={questionMapping}
              styles={styles}
            />
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
                    title={dimensionName}
                    questionMap={questionMapping}
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
   Lógica de Comparação e Helpers
   ========================================================================== */
function CompareDimensions({ chartsA, chartsB, questionMap, styles }) {
  const aMap = new Map((chartsA || []).map((c) => [c.dimensionName, c]));
  const bMap = new Map((chartsB || []).map((c) => [c.dimensionName, c]));
  const allNames = Array.from(new Set([...(aMap.keys() || []), ...(bMap.keys() || [])]));

  if (allNames.length === 0) {
    return (
      <div
        className={styles.chartContainerCard}
        style={{ textAlign: 'center', padding: '3rem 1rem' }}
      >
        <HelpCircle size={40} color="#9ca3af" style={{ margin: '0 auto 1rem' }} />
        <p style={{ color: '#6b7280', fontSize: '1rem', margin: 0 }}>
          Nenhum dado disponível para comparação nos recortes atuais.
        </p>
      </div>
    );
  }

  return (
    <>
      {allNames.map((dimensionName) => {
        const a = aMap.get(dimensionName);
        const b = bMap.get(dimensionName);
        if (!a && !b) return null;
        return (
          <section key={`dim-section-${dimensionName}`} className={styles.dimensionWrapper}>
            <div className={styles.equalGrid}>
              {a && (
                <div
                  className={styles.chartContainerCard}
                  style={!b ? { gridColumn: '1 / -1' } : undefined}
                >
                  <QuestionChart
                    chartData={a.chartData}
                    title={`${dimensionName} (A)`}
                    questionMap={questionMap}
                  />
                </div>
              )}
              {b && (
                <div
                  className={styles.chartContainerCard}
                  style={!a ? { gridColumn: '1 / -1' } : undefined}
                >
                  <QuestionChart
                    chartData={b.chartData}
                    title={`${dimensionName} (B)`}
                    questionMap={questionMap}
                  />
                </div>
              )}
            </div>
          </section>
        );
      })}
    </>
  );
}

function norm(v) {
  return String(v ?? '').trim();
}

function rowMatch(rowValue, selectedValue) {
  return selectedValue === 'todos' || norm(rowValue) === norm(selectedValue);
}

function applyFilters(allData, selectedFilters) {
  if (!Array.isArray(allData)) return [];
  const f = selectedFilters || {};
  return allData.filter((d) => {
    return (
      rowMatch(d.CAMPUS_DISCENTE, f.campus) &&
      rowMatch(d.UNIDADE_DISCENTE, f.unidade) &&
      rowMatch(d.CURSO_DISCENTE, f.curso)
    );
  });
}

function buildFilterOptions(allData, selectedFilters) {
  if (!Array.isArray(allData) || !allData.length)
    return { campus: [], unidades: [], cursos: [] };
  const f = selectedFilters || { campus: 'todos', unidade: 'todos', curso: 'todos' };

  function keepRow(row, ignoreKey) {
    const cOk = ignoreKey === 'CAMPUS_DISCENTE' ? true : rowMatch(row.CAMPUS_DISCENTE, f.campus);
    const uOk = ignoreKey === 'UNIDADE_DISCENTE' ? true : rowMatch(row.UNIDADE_DISCENTE, f.unidade);
    const crOk = ignoreKey === 'CURSO_DISCENTE' ? true : rowMatch(row.CURSO_DISCENTE, f.curso);
    return cOk && uOk && crOk;
  }

  function isValidLabel(text) {
    if (!text) return false;
    const str = String(text).trim();
    if (str.length < 2 || str.length > 80) return false;
    if (/^\d+$/.test(str)) return false;
    const lower = str.toLowerCase();
    return !['não informado', 'nao informado', 'n/i', 'ni'].includes(lower);
  }

  function uniq(key) {
    const s = new Set();
    for (const r of allData) {
      if (keepRow(r, key)) {
        const v = norm(r[key]);
        if (isValidLabel(v)) s.add(v);
      }
    }
    return [...s].sort((a, b) => a.localeCompare(b, 'pt-BR'));
  }

  return {
    campus: uniq('CAMPUS_DISCENTE'),
    unidades: uniq('UNIDADE_DISCENTE'),
    cursos: uniq('CURSO_DISCENTE'),
  };
}

function calcTopUnit(data) {
  if (!data?.length) return { name: '-', count: 0 };
  const counts = data.reduce((acc, r) => {
    const n = r.UNIDADE_DISCENTE || 'N/I';
    acc[n] = (acc[n] || 0) + 1;
    return acc;
  }, {});
  const top = Object.entries(counts).sort((a, b) => b[1] - a[1])[0];
  return { name: top ? top[0] : '-', count: top ? top[1] : 0 };
}

function buildChartsByDimension(filteredData, bgColor, borderColor, selectedFilters) {
  if (!dimensionMapping) return [];
  const sDim = selectedFilters?.dimensao || 'todas';
  const sQ = selectedFilters?.pergunta || 'todas';

  return Object.entries(dimensionMapping)
    .filter(([name]) => sDim === 'todas' || name === sDim)
    .map(([name, questionCodes]) => {
      let codes = Array.isArray(questionCodes) ? [...questionCodes] : [];
      if (sQ !== 'todas') codes = codes.includes(sQ) ? [sQ] : [];

      const labels = [];
      const data = [];
      for (const code of codes) {
        const match = code.match(/\.(\d+)$/);
        const dataKey = match ? `Pergunta_${match[1]}` : code;

        const scores = filteredData
          .map((i) => {
            const val = i[dataKey];
            const numeric = parseFloat(val);
            if (!isNaN(numeric)) return numeric;
            return ratingToScore ? ratingToScore[val] : null;
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
