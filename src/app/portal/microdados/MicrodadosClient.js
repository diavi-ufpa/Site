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
import ChartDataLabels from 'chartjs-plugin-datalabels';
import { useAuth } from '@/contexts/AuthContext';
import StatCard from '@/components/ui/StatCard';
import DashboardSkeleton from '@/components/ui/DashboardSkeleton';
import LoadingOverlay from '@/components/ui/LoadingOverlay';
import {
  Filter,
  BarChart3,
  Percent,
  Award,
  BookOpen,
  GraduationCap,
  Building,
  RotateCcw,
  HelpCircle,
  FileText,
  ExternalLink,
} from 'lucide-react';
import styles from '@/styles/dados.module.css';

ChartJS.register(
  BarElement,
  CategoryScale,
  LinearScale,
  Legend,
  LineElement,
  PointElement,
  Tooltip,
  ChartDataLabels
);

if (ChartJS.defaults?.plugins?.datalabels) {
  ChartJS.defaults.plugins.datalabels.display = false;
}

const tabs = [
  { key: 'razao', label: 'Razão do Percentual', icon: BarChart3 },
  { key: 'percentual', label: 'Percentual de Acerto', icon: Percent },
  { key: 'ranking', label: 'Tabela de Ranking', icon: Award },
  { key: 'qe', label: 'Questionário do Estudante', icon: BookOpen },
];

const qeDimensions = [
  { key: 'organizacao_didatico_pedagogica', label: 'Organização Didático-Pedagógica' },
  { key: 'infraestrutura', label: 'Infraestrutura' },
  { key: 'ampliacao_da_formacao', label: 'Ampliação da Formação' },
];

function wrapLabel(label, max = 36) {
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

function chartOptions({
  horizontal = false,
  max = undefined,
  xTitle = '',
  enableDataLabels = true,
} = {}) {
  return {
    indexAxis: horizontal ? 'y' : 'x',
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          usePointStyle: true,
          pointStyle: 'rectRounded',
          font: { size: 12, weight: '600' },
          padding: 16,
          color: '#374151',
        },
      },
      datalabels: {
        display: enableDataLabels
          ? (ctx) => {
              const val = ctx.dataset?.data?.[ctx.dataIndex];
              return val !== null && val !== undefined && Number.isFinite(Number(val));
            }
          : false,
        anchor: 'end',
        align: horizontal ? 'end' : 'top',
        offset: 4,
        formatter: (value) => number(value),
        color: '#1F2937',
        font: { size: 10, weight: '700' },
      },
      tooltip: {
        backgroundColor: '#0F172A',
        titleFont: { size: 12, weight: '700' },
        bodyFont: { size: 12 },
        padding: 10,
        cornerRadius: 8,
        callbacks: {
          label: (ctx) => {
            const value =
              typeof ctx.parsed === 'object'
                ? horizontal
                  ? ctx.parsed.x
                  : ctx.parsed.y
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
        grid: { color: '#F3F4F6' },
        ticks: {
          font: { size: 11, weight: '500' },
          color: '#4B5563',
        },
        title: {
          display: Boolean(xTitle),
          text: xTitle,
          font: { size: 12, weight: '600' },
          color: '#6B7280',
        },
      },
      y: {
        beginAtZero: true,
        grid: { color: '#F3F4F6' },
        ticks: {
          font: { size: 11, weight: '500' },
          color: '#374151',
        },
      },
    },
  };
}

function EmptyState({ children }) {
  return (
    <div
      className={styles.chartContainerCard}
      style={{
        minHeight: 220,
        justifyContent: 'center',
        alignItems: 'center',
        textAlign: 'center',
        padding: '3rem 1.5rem',
      }}
    >
      <HelpCircle size={40} color="#9ca3af" style={{ margin: '0 auto 1rem' }} />
      <p style={{ textAlign: 'center', color: '#64748b', fontSize: '1rem', margin: 0 }}>
        {children}
      </p>
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
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const controller = new AbortController();

    async function loadFilters() {
      try {
        setIsInitialLoading(true);
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
        setIsInitialLoading(false);
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
        const response = await authorizedFetch(
          makeUrl('filters', {
            ano: selected.ano,
            municipio: selected.municipio,
          }),
          {
            cache: 'no-store',
            signal: controller.signal,
          }
        );
        const payload = await response.json();
        if (!response.ok) throw new Error(payload?.error || 'Erro ao atualizar filtros.');

        setFilters(payload);
        setSelected((prev) => ({
          ...prev,
          municipio: payload.defaultMunicipio ?? prev.municipio,
          co_curso: payload.cursos.some(
            (curso) => String(curso.co_curso) === String(prev.co_curso)
          )
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
    return [...(dashboard?.comparativo ?? [])].sort(
      (a, b) => Number(b.nota_ufpa_percentual) - Number(a.nota_ufpa_percentual)
    );
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
        label: 'Razão UFPA / Brasil',
        data: razaoRows.map((row) => Number(row.razao_ufpa_brasil ?? 0)),
        backgroundColor: '#1D556F',
        borderColor: '#1D556F',
        borderWidth: 1,
        borderRadius: 5,
      },
    ],
  };

  const percentualData = {
    labels: percentualRows.map((row) => wrapLabel(row.tema)),
    datasets: [
      {
        label: 'UFPA (%)',
        data: percentualRows.map((row) => Number(row.nota_ufpa_percentual ?? 0)),
        backgroundColor: '#1D556F',
        borderColor: '#1D556F',
        borderWidth: 1,
        borderRadius: 5,
      },
      {
        label: 'Brasil (%)',
        data: percentualRows.map((row) => Number(row.nota_brasil_percentual ?? 0)),
        backgroundColor: '#10B981',
        borderColor: '#10B981',
        borderWidth: 1,
        borderRadius: 5,
      },
    ],
  };

  const qeMediaData = {
    labels: qeRows.map((row) => row.questao.replace('QE_I', 'Questão ')),
    datasets: [
      {
        label: 'Média (1 a 6)',
        data: qeRows.map((row) => Number(row.media_1_6 ?? 0)),
        backgroundColor: qeRows.map((row) => {
          const values = qeRows.map((item) => Number(item.media_1_6 ?? 0)).filter(Boolean);
          const max = Math.max(...values);
          const min = Math.min(...values);
          const value = Number(row.media_1_6 ?? 0);
          if (value === max) return '#10B981';
          if (value === min) return '#FF8E29';
          return '#1D556F';
        }),
        borderRadius: 6,
      },
    ],
  };

  const qeCountData = {
    labels: qeRows.map((row) => row.questao.replace('QE_I', 'Q.')),
    datasets: [
      {
        label: '1-2 Discordância',
        data: qeRows.map((row) => row.respostas_1_2),
        borderColor: '#EF4444',
        backgroundColor: '#EF4444',
        tension: 0.2,
        pointRadius: 4,
      },
      {
        label: '3-4 Neutro',
        data: qeRows.map((row) => row.respostas_3_4),
        borderColor: '#F59E0B',
        backgroundColor: '#F59E0B',
        tension: 0.2,
        pointRadius: 4,
      },
      {
        label: '5-6 Concordância',
        data: qeRows.map((row) => row.respostas_5_6),
        borderColor: '#10B981',
        backgroundColor: '#10B981',
        tension: 0.2,
        pointRadius: 4,
      },
      {
        label: '7-8 Não se aplica/Não sei',
        data: qeRows.map((row) => row.respostas_7_8),
        borderColor: '#6B7280',
        backgroundColor: '#6B7280',
        tension: 0.2,
        pointRadius: 4,
      },
    ],
  };

  if (isInitialLoading) {
    return <DashboardSkeleton />;
  }

  if (error) {
    return (
      <div className={styles.mainContent}>
        <div className={styles.errorMessage}>{error}</div>
      </div>
    );
  }

  const selectedCursoName =
    dashboard?.curso?.nome_curso ||
    filters?.cursos?.find((c) => String(c.co_curso) === String(selected.co_curso))?.nome_curso ||
    'Curso Selecionado';

  return (
    <div className={styles.mainContent}>
      {loading && <LoadingOverlay isFullScreen={true} message="Carregando microdados do Enade..." />}

      {/* KPI Stat Cards */}
      <div className={styles.statsGrid}>
        <StatCard
          title="Curso Selecionado"
          value={selectedCursoName}
          icon={<GraduationCap size={24} color="#FF8E29" />}
        />
        <StatCard
          title="Município"
          value={selected.municipio || 'Geral'}
          icon={<Building size={24} color="#1D556F" />}
        />
        <StatCard
          title="Temas do Componente"
          value={razaoRows.length.toString()}
          icon={<BarChart3 size={24} color="#288FB4" />}
        />
      </div>

      {/* Modern Filter Card */}
      <div className="filtersContainer">
        <style jsx>{`
          .filtersContainer {
            background-color: #ffffff;
            border: 1px solid #e5e7eb;
            border-radius: 16px;
            padding: 1.25rem;
            box-shadow: 0 4px 14px rgba(0, 0, 0, 0.04);
            margin-bottom: 1.5rem;
            transition: all 0.2s ease;
          }
          .filterHeader {
            display: flex;
            align-items: center;
            justify-content: space-between;
            margin-bottom: 1rem;
            padding-bottom: 0.75rem;
            border-bottom: 1px solid #f3f4f6;
            flex-wrap: wrap;
            gap: 0.75rem;
          }
          .filterHeaderTitle {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            font-weight: 700;
            font-size: 1rem;
            color: #1f2937;
          }
          .stepGrid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 1rem;
            align-items: flex-end;
          }
          .stepCard {
            display: flex;
            flex-direction: column;
            gap: 0.4rem;
            position: relative;
          }
          .stepCardWide {
            grid-column: 1 / -1;
          }
          .stepLabel {
            font-size: 0.8rem;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.04em;
            color: #6b7280;
            display: flex;
            align-items: center;
            gap: 0.4rem;
          }
          .stepBadge {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            width: 20px;
            height: 20px;
            border-radius: 50%;
            font-size: 0.75rem;
            font-weight: 700;
            background-color: #f3f4f6;
            color: #4b5563;
          }
          .stepBadgeActive {
            background-color: #FF8E29;
            color: #ffffff;
          }
          .customSelect {
            width: 100%;
            padding: 0.65rem 2.2rem 0.65rem 0.85rem;
            font-size: 0.9rem;
            font-weight: 500;
            color: #1f2937;
            background-color: #f9fafb;
            border: 1.5px solid #e5e7eb;
            border-radius: 10px;
            cursor: pointer;
            transition: all 0.2s ease;
            appearance: none;
            background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e");
            background-position: right 0.75rem center;
            background-repeat: no-repeat;
            background-size: 1.2em 1.2em;
          }
          .customSelect:hover:not(:disabled) {
            border-color: #FF8E29;
            background-color: #ffffff;
          }
          .customSelect:focus {
            outline: none;
            border-color: #FF8E29;
            box-shadow: 0 0 0 3px rgba(255, 142, 41, 0.15);
            background-color: #ffffff;
          }
        `}</style>

        <div className="filterHeader">
          <div className="filterHeaderTitle">
            <Filter size={18} color="#FF8E29" />
            <span>Filtros de Seleção • Microdados</span>
          </div>
        </div>

        <div className="stepGrid">
          <div className="stepCard">
            <label className="stepLabel" htmlFor="microdados-ano">
              <span className="stepBadge stepBadgeActive">1</span>
              Ano Enade
            </label>
            <select
              id="microdados-ano"
              className="customSelect"
              value={selected.ano}
              onChange={(event) =>
                setSelected((prev) => ({ ...prev, ano: Number(event.target.value) }))
              }
            >
              {(filters?.anos ?? [2023]).map((ano) => (
                <option key={ano} value={ano}>
                  {ano}
                </option>
              ))}
            </select>
          </div>

          <div className="stepCard">
            <label className="stepLabel" htmlFor="microdados-municipio">
              <span className="stepBadge stepBadgeActive">2</span>
              Município
            </label>
            <select
              id="microdados-municipio"
              className="customSelect"
              value={selected.municipio}
              onChange={(event) =>
                setSelected((prev) => ({ ...prev, municipio: event.target.value }))
              }
            >
              {(filters?.municipios ?? []).map((municipio) => (
                <option key={municipio} value={municipio}>
                  {municipio}
                </option>
              ))}
            </select>
          </div>

          <div className="stepCard stepCardWide">
            <label className="stepLabel" htmlFor="microdados-curso">
              <span className="stepBadge stepBadgeActive">3</span>
              Curso de Graduação
            </label>
            <select
              id="microdados-curso"
              className="customSelect"
              value={selected.co_curso}
              onChange={(event) =>
                setSelected((prev) => ({ ...prev, co_curso: event.target.value }))
              }
            >
              {(filters?.cursos ?? []).map((curso) => (
                <option key={curso.co_curso} value={curso.co_curso}>
                  {curso.nome_curso}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className={styles.tabsContainer}>
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.key}
              className={activeTab === tab.key ? styles.activeTab : styles.tab}
              onClick={() => setActiveTab(tab.key)}
            >
              <Icon size={16} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Conteúdo das Abas */}
      <div className={styles.chartDisplayArea}>
        {activeTab === 'razao' &&
          (razaoRows.length ? (
            <section className={styles.chartContainerCard}>
              <div style={{ marginBottom: 16 }}>
                <h3 className={styles.chartTitle} style={{ margin: '0 0 4px 0' }}>
                  Razão do Percentual de Acerto (UFPA / Brasil)
                </h3>
                <p style={{ margin: 0, fontSize: '0.85rem', color: '#64748B' }}>
                  Curso: {dashboard?.curso?.nome_curso} • Valores acima de 1,00 indicam desempenho superior da UFPA em relação à média nacional.
                </p>
              </div>
              <div
                className={styles.chartContainer}
                style={{ height: Math.max(440, razaoRows.length * 36) }}
              >
                <Bar
                  data={razaoData}
                  options={chartOptions({
                    horizontal: true,
                    xTitle: 'Razão do percentual de acerto (UFPA / Brasil)',
                  })}
                  plugins={[ChartDataLabels]}
                />
              </div>
            </section>
          ) : (
            <EmptyState>Sem dados de Componente Específico para este curso.</EmptyState>
          ))}

        {activeTab === 'percentual' &&
          (percentualRows.length ? (
            <section className={styles.chartContainerCard}>
              <div style={{ marginBottom: 16 }}>
                <h3 className={styles.chartTitle} style={{ margin: '0 0 4px 0' }}>
                  Percentual de Acertos por Tema • UFPA vs Brasil
                </h3>
                <p style={{ margin: 0, fontSize: '0.85rem', color: '#64748B' }}>
                  Curso: {dashboard?.curso?.nome_curso} • Comparativo direto do percentual de acertos por área temática.
                </p>
              </div>
              <div
                className={styles.chartContainer}
                style={{ height: Math.max(440, percentualRows.length * 40) }}
              >
                <Bar
                  data={percentualData}
                  options={chartOptions({
                    horizontal: true,
                    max: 100,
                    xTitle: 'Percentual de acerto (%)',
                  })}
                  plugins={[ChartDataLabels]}
                />
              </div>
            </section>
          ) : (
            <EmptyState>Sem dados de Componente Específico para este curso.</EmptyState>
          ))}

        {activeTab === 'ranking' && (
          <section className={styles.chartContainerCard}>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                gap: 16,
                alignItems: 'center',
                marginBottom: 20,
                flexWrap: 'wrap',
              }}
            >
              <div>
                <h3 className={styles.chartTitle} style={{ margin: '0 0 4px 0' }}>
                  Tabela de Ranking por Tema
                </h3>
                <p style={{ margin: 0, fontSize: '0.85rem', color: '#64748B' }}>
                  Comparativo com a instituição líder de desempenho no Enade.
                </p>
              </div>

              <select
                className={styles.filterSelect}
                style={{ maxWidth: 280, backgroundColor: '#f9fafb' }}
                value={rankingRecorte}
                onChange={(event) => setRankingRecorte(event.target.value)}
              >
                <option value="FEDERAL_PUBLICO">Apenas IES Públicas Federais</option>
                <option value="GERAL">Todas as IES (Brasil)</option>
              </select>
            </div>

            {rankingRows.length ? (
              <div style={{ overflowX: 'auto', borderRadius: 12, border: '1px solid #e5e7eb' }}>
                <table
                  style={{
                    width: '100%',
                    borderCollapse: 'collapse',
                    fontSize: '0.9rem',
                    textAlign: 'left',
                  }}
                >
                  <thead>
                    <tr style={{ background: '#F8FAFC' }}>
                      <th style={{ padding: '12px 16px', fontWeight: 700, color: '#1E293B', borderBottom: '1px solid #e5e7eb' }}>
                        Tema
                      </th>
                      <th style={{ padding: '12px 16px', fontWeight: 700, color: '#1E293B', borderBottom: '1px solid #e5e7eb' }}>
                        IES com Melhor Desempenho
                      </th>
                      <th style={{ padding: '12px 16px', fontWeight: 700, color: '#1E293B', borderBottom: '1px solid #e5e7eb' }}>
                        Participantes (Líder)
                      </th>
                      <th style={{ padding: '12px 16px', fontWeight: 700, color: '#1E293B', borderBottom: '1px solid #e5e7eb' }}>
                        Melhor Curso (%)
                      </th>
                      <th style={{ padding: '12px 16px', fontWeight: 700, color: '#1E293B', borderBottom: '1px solid #e5e7eb' }}>
                        UFPA (%)
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {rankingRows.map((row, index) => (
                      <tr
                        key={`${row.recorte}-${row.tema}`}
                        style={{
                          backgroundColor: index % 2 === 0 ? '#FFFFFF' : '#F9FAFB',
                          transition: 'background-color 0.15s ease',
                        }}
                      >
                        <td style={{ padding: '12px 16px', fontWeight: 600, color: '#1E293B', borderBottom: '1px solid #e5e7eb' }}>
                          {row.tema}
                        </td>
                        <td style={{ padding: '12px 16px', color: '#4B5563', borderBottom: '1px solid #e5e7eb' }}>
                          <span
                            style={{
                              display: 'inline-block',
                              padding: '2px 8px',
                              borderRadius: 6,
                              background: '#EFF6FF',
                              color: '#1D556F',
                              fontWeight: 600,
                              fontSize: '0.85rem',
                            }}
                          >
                            {row.nome_ies_top1}
                          </span>
                        </td>
                        <td style={{ padding: '12px 16px', color: '#4B5563', borderBottom: '1px solid #e5e7eb' }}>
                          {row.participantes_top1}
                        </td>
                        <td style={{ padding: '12px 16px', fontWeight: 700, color: '#10B981', borderBottom: '1px solid #e5e7eb' }}>
                          {number(row.nota_top1_percentual)}%
                        </td>
                        <td style={{ padding: '12px 16px', fontWeight: 700, color: '#FF8E29', borderBottom: '1px solid #e5e7eb' }}>
                          {number(row.nota_ufpa_percentual)}%
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <EmptyState>Sem dados de ranking para este curso.</EmptyState>
            )}
          </section>
        )}

        {activeTab === 'qe' && (
          <section>
            {/* Subabas do Questionário */}
            <div className={styles.tabsContainer} style={{ marginBottom: 16 }}>
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
                  <h3 className={styles.chartTitle}>Gráfico de Médias por Questão</h3>
                  <div className={styles.chartContainer} style={{ height: 380 }}>
                    <Bar
                      data={qeMediaData}
                      options={chartOptions({ max: 6, xTitle: 'Questão do Questionário' })}
                      plugins={[ChartDataLabels]}
                    />
                  </div>
                </div>

                <div className={styles.chartContainerCard}>
                  <h3 className={styles.chartTitle}>Distribuição de Respostas por Faixa</h3>
                  <div className={styles.chartContainer} style={{ height: 380 }}>
                    <Line
                      data={qeCountData}
                      options={chartOptions({ enableDataLabels: false })}
                    />
                  </div>
                </div>
              </div>
            ) : (
              <EmptyState>
                Sem dados do Questionário do Estudante para este curso na dimensão selecionada.
              </EmptyState>
            )}

            <div style={{ marginTop: 24, textAlign: 'center' }}>
              <a
                href="/anexo_qe_2023.pdf"
                target="_blank"
                rel="noreferrer"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  background: '#ffffff',
                  color: '#1D556F',
                  border: '1.5px solid #1D556F',
                  borderRadius: 12,
                  padding: '10px 20px',
                  fontWeight: 700,
                  fontSize: '0.9rem',
                  textDecoration: 'none',
                  transition: 'all 0.2s ease',
                  boxShadow: '0 2px 6px rgba(0,0,0,0.04)',
                }}
              >
                <FileText size={18} />
                <span>Visualizar Questionário do Estudante (PDF)</span>
                <ExternalLink size={14} />
              </a>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
