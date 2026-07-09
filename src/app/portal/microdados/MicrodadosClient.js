'use client';

import { useEffect, useMemo, useState } from 'react';
import { Bar, Line } from 'react-chartjs-2';
import {
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Legend,
  LinearScale,
  LineElement,
  PointElement,
  Tooltip,
} from 'chart.js';
import { useAuth } from '@/contexts/AuthContext';
import LoadingOverlay from '@/components/ui/LoadingOverlay';
import styles from '@/styles/dados.module.css';

ChartJS.register(
  BarElement,
  CategoryScale,
  LinearScale,
  Legend,
  LineElement,
  PointElement,
  Tooltip
);

const tabs = [
  { key: 'razao', label: 'Razao do Percentual' },
  { key: 'percentual', label: 'Percentual de Acerto' },
  { key: 'ranking', label: 'Tabela Ranking' },
  { key: 'qe', label: 'Questionario do Estudante' },
];

const qeDimensions = [
  { key: 'organizacao_didatico_pedagogica', label: 'Organizacao Didatico-Pedagogica' },
  { key: 'infraestrutura', label: 'Infraestrutura' },
  { key: 'ampliacao_da_formacao', label: 'Ampliacao da Formacao' },
];

function wrapLabel(label, max = 32) {
  const words = String(label ?? '').split(' ');
  const lines = [];
  let current = '';
  for (const word of words) {
    if (!current || `${current} ${word}`.length <= max) {
      current = current ? `${current} ${word}` : word;
    } else {
      lines.push(current);
      current = word;
    }
  }
  if (current) lines.push(current);
  return lines;
}

function number(value, digits = 2) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed.toFixed(digits).replace('.', ',') : '-';
}

function makeUrl(endpoint, params = {}) {
  const search = new URLSearchParams({ endpoint });
  for (const [key, value] of Object.entries(params)) {
    if (value !== null && value !== undefined && value !== '') {
      search.set(key, String(value));
    }
  }
  return `/api/microdados-db?${search.toString()}`;
}

function chartOptions({ horizontal = false, max = undefined, xTitle = '' } = {}) {
  return {
    indexAxis: horizontal ? 'y' : 'x',
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'bottom' },
      tooltip: {
        callbacks: {
          label: (ctx) => {
            const value = typeof ctx.parsed === 'object'
              ? horizontal ? ctx.parsed.x : ctx.parsed.y
              : ctx.parsed;
            return `${ctx.dataset.label}: ${number(value)}`;
          },
        },
      },
    },
    scales: {
      x: {
        beginAtZero: true,
        max,
        title: { display: Boolean(xTitle), text: xTitle },
      },
      y: {
        beginAtZero: true,
      },
    },
  };
}

function EmptyState({ children }) {
  return (
    <div className={styles.chartContainerCard} style={{ minHeight: 180, justifyContent: 'center' }}>
      <p style={{ textAlign: 'center', color: '#64748b', margin: 0 }}>{children}</p>
    </div>
  );
}

export default function MicrodadosClient() {
  const { authorizedFetch } = useAuth();
  const [filters, setFilters] = useState(null);
  const [selected, setSelected] = useState({ ano: 2023, municipio: '', co_curso: '' });
  const [dashboard, setDashboard] = useState(null);
  const [activeTab, setActiveTab] = useState('razao');
  const [qeTab, setQeTab] = useState(qeDimensions[0].key);
  const [rankingRecorte, setRankingRecorte] = useState('FEDERAL_PUBLICO');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const controller = new AbortController();

    async function loadFilters() {
      try {
        setLoading(true);
        const response = await authorizedFetch(makeUrl('filters'), {
          cache: 'no-store',
          signal: controller.signal,
        });
        const payload = await response.json();
        if (!response.ok) throw new Error(payload?.error || 'Erro ao carregar filtros.');

        setFilters(payload);
        setSelected({
          ano: payload.defaultAno ?? 2023,
          municipio: payload.defaultMunicipio ?? '',
          co_curso: payload.defaultCurso ?? '',
        });
      } catch (err) {
        if (err.name !== 'AbortError') setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    loadFilters();
    return () => controller.abort();
  }, [authorizedFetch]);

  useEffect(() => {
    if (!selected.ano) return;
    const controller = new AbortController();

    async function refreshFilters() {
      try {
        const response = await authorizedFetch(makeUrl('filters', {
          ano: selected.ano,
          municipio: selected.municipio,
        }), {
          cache: 'no-store',
          signal: controller.signal,
        });
        const payload = await response.json();
        if (!response.ok) throw new Error(payload?.error || 'Erro ao atualizar filtros.');

        setFilters(payload);
        setSelected((prev) => ({
          ...prev,
          municipio: payload.defaultMunicipio ?? prev.municipio,
          co_curso: payload.cursos.some((curso) => String(curso.co_curso) === String(prev.co_curso))
            ? prev.co_curso
            : payload.defaultCurso ?? '',
        }));
      } catch (err) {
        if (err.name !== 'AbortError') setError(err.message);
      }
    }

    refreshFilters();
    return () => controller.abort();
  }, [authorizedFetch, selected.ano, selected.municipio]);

  useEffect(() => {
    if (!selected.ano || !selected.co_curso) return;
    const controller = new AbortController();

    async function loadDashboard() {
      try {
        setLoading(true);
        const response = await authorizedFetch(makeUrl('dashboard', selected), {
          cache: 'no-store',
          signal: controller.signal,
        });
        const payload = await response.json();
        if (!response.ok) throw new Error(payload?.error || 'Erro ao carregar microdados.');
        setDashboard(payload);
      } catch (err) {
        if (err.name !== 'AbortError') setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    loadDashboard();
    return () => controller.abort();
  }, [authorizedFetch, selected]);

  const razaoRows = useMemo(() => {
    return [...(dashboard?.comparativo ?? [])]
      .filter((row) => Number(row.razao_ufpa_brasil) > 0)
      .sort((a, b) => Number(a.razao_ufpa_brasil) - Number(b.razao_ufpa_brasil));
  }, [dashboard]);

  const percentualRows = useMemo(() => {
    return [...(dashboard?.comparativo ?? [])]
      .sort((a, b) => Number(b.nota_ufpa_percentual) - Number(a.nota_ufpa_percentual));
  }, [dashboard]);

  const qeRows = useMemo(() => {
    return (dashboard?.qe ?? []).filter((row) => row.dimensao === qeTab);
  }, [dashboard, qeTab]);

  const rankingRows = useMemo(() => {
    return (dashboard?.ranking ?? []).filter((row) => row.recorte === rankingRecorte);
  }, [dashboard, rankingRecorte]);

  const razaoData = {
    labels: razaoRows.map((row) => wrapLabel(row.tema)),
    datasets: [
      {
        label: 'Razao UFPA / Brasil',
        data: razaoRows.map((row) => Number(row.razao_ufpa_brasil ?? 0)),
        backgroundColor: '#111827',
      },
    ],
  };

  const percentualData = {
    labels: percentualRows.map((row) => wrapLabel(row.tema)),
    datasets: [
      {
        label: 'UFPA',
        data: percentualRows.map((row) => Number(row.nota_ufpa_percentual ?? 0)),
        backgroundColor: '#288FB4',
      },
      {
        label: 'Brasil',
        data: percentualRows.map((row) => Number(row.nota_brasil_percentual ?? 0)),
        backgroundColor: '#3FBF7F',
      },
    ],
  };

  const qeMediaData = {
    labels: qeRows.map((row) => row.questao.replace('QE_I', '')),
    datasets: [
      {
        label: 'Media',
        data: qeRows.map((row) => Number(row.media_1_6 ?? 0)),
        backgroundColor: qeRows.map((row) => {
          const values = qeRows.map((item) => Number(item.media_1_6 ?? 0)).filter(Boolean);
          const max = Math.max(...values);
          const min = Math.min(...values);
          const value = Number(row.media_1_6 ?? 0);
          if (value === max) return '#00712D';
          if (value === min) return '#F09319';
          return '#81A263';
        }),
      },
    ],
  };

  const qeCountData = {
    labels: qeRows.map((row) => row.questao.replace('QE_I', '')),
    datasets: [
      {
        label: '1-2 Discordancia',
        data: qeRows.map((row) => row.respostas_1_2),
        borderColor: '#FA360A',
        backgroundColor: '#FA360A',
      },
      {
        label: '3-4 Neutro',
        data: qeRows.map((row) => row.respostas_3_4),
        borderColor: '#F0B775',
        backgroundColor: '#F0B775',
      },
      {
        label: '5-6 Concordancia',
        data: qeRows.map((row) => row.respostas_5_6),
        borderColor: '#1D556F',
        backgroundColor: '#1D556F',
      },
      {
        label: '7-8 Nao se aplica/Nao sei',
        data: qeRows.map((row) => row.respostas_7_8),
        borderColor: '#6B7280',
        backgroundColor: '#6B7280',
      },
    ],
  };

  if (error) {
    return <p className={styles.errorMessage}>{error}</p>;
  }

  return (
    <div className={styles.mainContent}>
      {loading && <LoadingOverlay />}

      <section className={styles.filtersWrapper}>
        <div className={styles.filtersContent} style={{ maxHeight: 'none', opacity: 1, marginTop: 0 }}>
          <label>
            Ano
            <select
              className={styles.filterSelect}
              value={selected.ano}
              onChange={(event) => setSelected((prev) => ({ ...prev, ano: Number(event.target.value) }))}
            >
              {(filters?.anos ?? [2023]).map((ano) => (
                <option key={ano} value={ano}>{ano}</option>
              ))}
            </select>
          </label>

          <label>
            Municipio
            <select
              className={styles.filterSelect}
              value={selected.municipio}
              onChange={(event) => setSelected((prev) => ({ ...prev, municipio: event.target.value }))}
            >
              {(filters?.municipios ?? []).map((municipio) => (
                <option key={municipio} value={municipio}>{municipio}</option>
              ))}
            </select>
          </label>

          <label className={styles.filterSelectWide}>
            Curso
            <select
              className={styles.filterSelect}
              value={selected.co_curso}
              onChange={(event) => setSelected((prev) => ({ ...prev, co_curso: event.target.value }))}
            >
              {(filters?.cursos ?? []).map((curso) => (
                <option key={curso.co_curso} value={curso.co_curso}>{curso.nome_curso}</option>
              ))}
            </select>
          </label>
        </div>
      </section>

      <div className={styles.tabsContainer}>
        {tabs.map((tab) => (
          <button
            key={tab.key}
            className={activeTab === tab.key ? styles.activeTab : styles.tab}
            onClick={() => setActiveTab(tab.key)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'razao' && (
        razaoRows.length ? (
          <section className={styles.chartContainerCard}>
            <h3 className={styles.chartTitle}>Razao de Acertos: {dashboard?.curso?.nome_curso}</h3>
            <div className={styles.chartContainer} style={{ height: Math.max(420, razaoRows.length * 34) }}>
              <Bar data={razaoData} options={chartOptions({ horizontal: true, xTitle: 'Razao do percentual de acerto (UFPA / Brasil)' })} />
            </div>
          </section>
        ) : <EmptyState>Sem dados de Componente Especifico para este curso.</EmptyState>
      )}

      {activeTab === 'percentual' && (
        percentualRows.length ? (
          <section className={styles.chartContainerCard}>
            <h3 className={styles.chartTitle}>Percentual de Acertos por Tema: {dashboard?.curso?.nome_curso}</h3>
            <div className={styles.chartContainer} style={{ height: Math.max(420, percentualRows.length * 38) }}>
              <Bar data={percentualData} options={chartOptions({ horizontal: true, max: 100, xTitle: 'Percentual de acerto (%)' })} />
            </div>
          </section>
        ) : <EmptyState>Sem dados de Componente Especifico para este curso.</EmptyState>
      )}

      {activeTab === 'ranking' && (
        <section className={styles.chartContainerCard}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center', marginBottom: 16 }}>
            <h3 className={styles.chartTitle} style={{ margin: 0 }}>Tabela Ranking por Tema</h3>
            <select
              className={styles.filterSelect}
              style={{ maxWidth: 240 }}
              value={rankingRecorte}
              onChange={(event) => setRankingRecorte(event.target.value)}
            >
              <option value="FEDERAL_PUBLICO">Apenas IES Publicas Federais</option>
              <option value="GERAL">Todas as IES</option>
            </select>
          </div>

          {rankingRows.length ? (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
                <thead>
                  <tr>
                    {['Tema', 'IES com melhor desempenho', 'Participantes', 'Melhor curso (%)', 'UFPA (%)'].map((header) => (
                      <th key={header} style={{ textAlign: 'left', padding: 10, borderBottom: '2px solid #e5e7eb' }}>{header}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rankingRows.map((row) => (
                    <tr key={`${row.recorte}-${row.tema}`}>
                      <td style={{ padding: 10, borderBottom: '1px solid #e5e7eb' }}>{row.tema}</td>
                      <td style={{ padding: 10, borderBottom: '1px solid #e5e7eb' }}>{row.nome_ies_top1}</td>
                      <td style={{ padding: 10, borderBottom: '1px solid #e5e7eb' }}>{row.participantes_top1}</td>
                      <td style={{ padding: 10, borderBottom: '1px solid #e5e7eb' }}>{number(row.nota_top1_percentual)}</td>
                      <td style={{ padding: 10, borderBottom: '1px solid #e5e7eb' }}>{number(row.nota_ufpa_percentual)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyState>Sem ranking para este curso.</EmptyState>
          )}
        </section>
      )}

      {activeTab === 'qe' && (
        <section>
          <div className={styles.tabsContainer}>
            {qeDimensions.map((dimension) => (
              <button
                key={dimension.key}
                className={qeTab === dimension.key ? styles.activeTab : styles.tab}
                onClick={() => setQeTab(dimension.key)}
              >
                {dimension.label}
              </button>
            ))}
          </div>

          {qeRows.length ? (
            <div className={styles.singleGrid}>
              <div className={styles.chartContainerCard}>
                <h3 className={styles.chartTitle}>Grafico de Medias</h3>
                <div className={styles.chartContainer}>
                  <Bar data={qeMediaData} options={chartOptions({ max: 6, xTitle: 'Questao' })} />
                </div>
              </div>

              <div className={styles.chartContainerCard}>
                <h3 className={styles.chartTitle}>Grafico de Contagem</h3>
                <div className={styles.chartContainer}>
                  <Line data={qeCountData} options={chartOptions()} />
                </div>
              </div>
            </div>
          ) : (
            <EmptyState>Sem dados do Questionario do Estudante para este curso.</EmptyState>
          )}

          <div style={{ marginTop: 16 }}>
            <a href="/anexo_qe_2023.pdf" target="_blank" rel="noreferrer" className={styles.navButton}>
              Visualizar Questionario do Estudante
            </a>
          </div>
        </section>
      )}
    </div>
  );
}
