'use client';

import { useState, useEffect } from 'react';
import AvaliacaoInLocoFilters from '@/features/avaliacaoInLoco/components/AvaliacaoInLocoFilters';
import { useAuth } from '@/contexts/AuthContext';
import Header from '@/components/ui/Header';
import StatCard from '@/components/ui/StatCard';
import DashboardSkeleton from '@/components/ui/DashboardSkeleton';
import LoadingOverlay from '@/components/ui/LoadingOverlay';
import MediaDimensoesChart from '@/components/charts/MediaDimensoesChart';
import GraficoEvolucaoLineChart from '@/components/charts/GraficoEvolucaoLineChart';
import GraficoEvolucaoD123LineChart from '@/components/charts/GraficoEvolucaoD123LineChart';
import QuantidadeCursosAvaliadosChart from '@/components/charts/QuantidadeCursosAvaliadosChart';
import MediaDimensaoAnualChart from '@/components/charts/MediaDimensaoAnualChart';
import { Filter, BarChart3, TrendingUp, BookOpen, Building, GraduationCap, RotateCcw, HelpCircle } from 'lucide-react';
import styles from '../../../../styles/dados.module.css';

function buildFiltersUrl(filters = {}) {
  const qs = new URLSearchParams();

  if (filters.ano) qs.set('ano', filters.ano);
  if (filters.undAcad) qs.set('undAcad', filters.undAcad);
  if (filters.modalidade) qs.set('modalidade', filters.modalidade);
  if (filters.campus) qs.set('campus', filters.campus);

  const query = qs.toString();
  return query
    ? `/api/avaliacao-in-loco/filters?${query}`
    : '/api/avaliacao-in-loco/filters';
}

function buildMediaDimensoesUrl(filters = {}) {
  const qs = new URLSearchParams();

  if (filters.ano) qs.set('ano', filters.ano);
  if (filters.undAcad) qs.set('undAcad', filters.undAcad);
  if (filters.modalidade) qs.set('modalidade', filters.modalidade);
  if (filters.campus) qs.set('campus', filters.campus);
  if (filters.curso) qs.set('curso', filters.curso);

  const query = qs.toString();
  return query
    ? `/api/avaliacao-in-loco/media-dimensoes?${query}`
    : '/api/avaliacao-in-loco/media-dimensoes';
}

function buildGraficoEvolucaoUrl(filters = {}) {
  const qs = new URLSearchParams();

  if (filters.undAcad) qs.set('undAcad', filters.undAcad);
  if (filters.curso) qs.set('curso', filters.curso);

  const query = qs.toString();
  return query
    ? `/api/avaliacao-in-loco/grafico-evolucao?${query}`
    : '/api/avaliacao-in-loco/grafico-evolucao';
}

export default function AvaliacaoInLocoDadosPage() {
  const { authorizedFetch } = useAuth();
  const [activeSubmenu, setActiveSubmenu] = useState('media');
  const tabs = [
    { key: 'media', label: 'Média das Dimensões', icon: BarChart3 },
    { key: 'grafico-evolucao', label: 'Evolução Histórica', icon: TrendingUp },
  ];

  const [selectedFilters, setSelectedFilters] = useState({
    ano: '',
    undAcad: '',
    modalidade: '',
    campus: '',
    curso: '',
  });

  const [filtersOptions, setFiltersOptions] = useState({
    anos: [],
    undAcad: [],
    modalidades: [],
    campi: [],
    cursos: [],
  });

  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [loadingCampus, setLoadingCampus] = useState(false);
  const [loadingCurso, setLoadingCurso] = useState(false);
  const [mediaDimensoes, setMediaDimensoes] = useState({
    labels: [],
    d1: [],
    d2: [],
    d3: [],
  });
  const [loadingMedia, setLoadingMedia] = useState(false);
  const [graficoEvolucaoData, setGraficoEvolucaoData] = useState({
    anos: [],
    series: {},
    quantidadeCursosAvaliados: { anos: [], valores: [] },
    mediaDimensaoAnual: { anos: [], d1: [], d2: [], d3: [] },
  });
  const [loadingEvolucao, setLoadingEvolucao] = useState(false);
  const [selectedEvolucaoFilters, setSelectedEvolucaoFilters] = useState({
    undAcad: '',
    curso: '',
  });
  const [evolucaoFilterOptions, setEvolucaoFilterOptions] = useState({
    undAcad: [],
    cursos: [],
  });
  const [loadingEvolucaoCursos, setLoadingEvolucaoCursos] = useState(false);

  const allFiltersSelected =
    Boolean(selectedFilters.ano) &&
    Boolean(selectedFilters.undAcad) &&
    Boolean(selectedFilters.modalidade) &&
    Boolean(selectedFilters.campus) &&
    Boolean(selectedFilters.curso);

  // Carregar opções iniciais
  useEffect(() => {
    const loadInitialFilters = async () => {
      try {
        setIsInitialLoading(true);
        const response = await authorizedFetch('/api/avaliacao-in-loco/filters');
        const data = await response.json();
        setFiltersOptions({
          anos: data?.anos ?? [],
          undAcad: data?.undAcad ?? [],
          modalidades: data?.modalidades ?? [],
          campi: [],
          cursos: [],
        });
      } catch (error) {
        console.error('Erro ao carregar filtros iniciais:', error);
      } finally {
        setIsInitialLoading(false);
      }
    };

    loadInitialFilters();
  }, [authorizedFetch]);

  // Carregar UND-ACAD e Modalidade conforme ano/unidade
  useEffect(() => {
    if (!selectedFilters.ano) {
      return;
    }

    const loadUndAcadAndModalidades = async () => {
      try {
        const response = await authorizedFetch(
          buildFiltersUrl({
            ano: selectedFilters.ano,
            undAcad: selectedFilters.undAcad,
          })
        );
        const data = await response.json();

        setFiltersOptions((prev) => ({
          ...prev,
          undAcad: data?.undAcad ?? [],
          modalidades: data?.modalidades ?? [],
        }));
      } catch (error) {
        console.error('Erro ao carregar unidade/modalidade:', error);
      }
    };

    loadUndAcadAndModalidades();
  }, [selectedFilters.ano, selectedFilters.undAcad, authorizedFetch]);

  // Carregar campi ao selecionar ano, unidade acadêmica e modalidade
  useEffect(() => {
    if (!selectedFilters.ano || !selectedFilters.undAcad || !selectedFilters.modalidade) {
      setFiltersOptions((prev) => ({
        ...prev,
        campi: [],
        cursos: [],
      }));
      return;
    }

    const loadCampus = async () => {
      try {
        setLoadingCampus(true);
        const response = await authorizedFetch(
          buildFiltersUrl({
            ano: selectedFilters.ano,
            undAcad: selectedFilters.undAcad,
            modalidade: selectedFilters.modalidade,
          })
        );
        const data = await response.json();

        setFiltersOptions((prev) => ({
          ...prev,
          campi: data?.campi ?? [],
          cursos: [],
        }));
      } catch (error) {
        console.error('Erro ao carregar campi:', error);
      } finally {
        setLoadingCampus(false);
      }
    };

    loadCampus();
  }, [selectedFilters.ano, selectedFilters.undAcad, selectedFilters.modalidade, authorizedFetch]);

  // Carregar cursos ao selecionar campus
  useEffect(() => {
    if (!selectedFilters.ano || !selectedFilters.undAcad || !selectedFilters.modalidade || !selectedFilters.campus) {
      setFiltersOptions((prev) => ({
        ...prev,
        cursos: [],
      }));
      return;
    }

    const loadCursos = async () => {
      try {
        setLoadingCurso(true);
        const response = await authorizedFetch(
          buildFiltersUrl({
            ano: selectedFilters.ano,
            undAcad: selectedFilters.undAcad,
            modalidade: selectedFilters.modalidade,
            campus: selectedFilters.campus,
          })
        );
        const data = await response.json();

        setFiltersOptions((prev) => ({
          ...prev,
          cursos: data?.cursos ?? [],
        }));
      } catch (error) {
        console.error('Erro ao carregar cursos:', error);
      } finally {
        setLoadingCurso(false);
      }
    };

    loadCursos();
  }, [selectedFilters.ano, selectedFilters.undAcad, selectedFilters.modalidade, selectedFilters.campus, authorizedFetch]);

  useEffect(() => {
    if (!allFiltersSelected) {
      setMediaDimensoes({ labels: [], d1: [], d2: [], d3: [] });
      return;
    }

    const loadMediaDimensoes = async () => {
      try {
        setLoadingMedia(true);
        const response = await authorizedFetch(buildMediaDimensoesUrl(selectedFilters));
        const data = await response.json();
        setMediaDimensoes({
          labels: data?.unidades ?? [],
          d1: data?.mediasPorDimensao?.d1 ?? [],
          d2: data?.mediasPorDimensao?.d2 ?? [],
          d3: data?.mediasPorDimensao?.d3 ?? [],
        });
      } catch (error) {
        console.error('Erro ao carregar média das dimensões:', error);
        setMediaDimensoes({ labels: [], d1: [], d2: [], d3: [] });
      } finally {
        setLoadingMedia(false);
      }
    };

    loadMediaDimensoes();
  }, [selectedFilters, allFiltersSelected, authorizedFetch]);

  useEffect(() => {
    const loadGraficoEvolucao = async () => {
      try {
        setLoadingEvolucao(true);
        const response = await authorizedFetch(buildGraficoEvolucaoUrl(selectedEvolucaoFilters));
        const data = await response.json();
        setGraficoEvolucaoData({
          anos: data?.anos ?? [],
          series: data?.series ?? {},
          quantidadeCursosAvaliados: data?.quantidadeCursosAvaliados ?? {
            anos: [],
            valores: [],
          },
          mediaDimensaoAnual: data?.mediaDimensaoAnual ?? {
            anos: [],
            d1: [],
            d2: [],
            d3: [],
          },
        });
      } catch (error) {
        console.error('Erro ao carregar gráfico de evolução:', error);
        setGraficoEvolucaoData({
          anos: [],
          series: {},
          quantidadeCursosAvaliados: { anos: [], valores: [] },
          mediaDimensaoAnual: { anos: [], d1: [], d2: [], d3: [] },
        });
      } finally {
        setLoadingEvolucao(false);
      }
    };

    loadGraficoEvolucao();
  }, [selectedEvolucaoFilters, authorizedFetch]);

  useEffect(() => {
    const loadEvolucaoUndAcad = async () => {
      try {
        const response = await authorizedFetch('/api/avaliacao-in-loco/filters');
        const data = await response.json();
        setEvolucaoFilterOptions((prev) => ({
          ...prev,
          undAcad: data?.undAcad ?? [],
        }));
      } catch (error) {
        console.error('Erro ao carregar filtros da evolução:', error);
      }
    };

    loadEvolucaoUndAcad();
  }, [authorizedFetch]);

  useEffect(() => {
    if (!selectedEvolucaoFilters.undAcad) {
      setEvolucaoFilterOptions((prev) => ({
        ...prev,
        cursos: [],
      }));
      return;
    }

    const loadEvolucaoCursos = async () => {
      try {
        setLoadingEvolucaoCursos(true);
        const response = await authorizedFetch(
          buildFiltersUrl({ undAcad: selectedEvolucaoFilters.undAcad })
        );
        const data = await response.json();
        setEvolucaoFilterOptions((prev) => ({
          ...prev,
          cursos: data?.cursos ?? [],
        }));
      } catch (error) {
        console.error('Erro ao carregar cursos da evolução:', error);
      } finally {
        setLoadingEvolucaoCursos(false);
      }
    };

    loadEvolucaoCursos();
  }, [selectedEvolucaoFilters.undAcad, authorizedFetch]);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;

    if (name === 'ano') {
      setSelectedFilters({
        ano: value,
        undAcad: '',
        modalidade: '',
        campus: '',
        curso: '',
      });
      setFiltersOptions((prev) => ({
        ...prev,
        campi: [],
        cursos: [],
      }));
      return;
    }

    if (name === 'undAcad') {
      setSelectedFilters((prev) => ({
        ...prev,
        undAcad: value,
        modalidade: '',
        campus: '',
        curso: '',
      }));
      setFiltersOptions((prev) => ({
        ...prev,
        campi: [],
        cursos: [],
      }));
      return;
    }

    if (name === 'modalidade') {
      setSelectedFilters((prev) => ({
        ...prev,
        modalidade: value,
        campus: '',
        curso: '',
      }));
      setFiltersOptions((prev) => ({
        ...prev,
        campi: [],
        cursos: [],
      }));
      return;
    }

    if (name === 'campus') {
      setSelectedFilters((prev) => ({
        ...prev,
        campus: value,
        curso: '',
      }));
      setFiltersOptions((prev) => ({
        ...prev,
        cursos: [],
      }));
      return;
    }

    setSelectedFilters((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleEvolucaoFilterChange = (e) => {
    const { name, value } = e.target;

    if (name === 'undAcad') {
      setSelectedEvolucaoFilters({
        undAcad: value,
        curso: '',
      });
      return;
    }

    if (name === 'curso') {
      setSelectedEvolucaoFilters((prev) => ({
        ...prev,
        curso: value,
      }));
    }
  };

  const isEvolucaoFilterActive = Boolean(
    selectedEvolucaoFilters.undAcad || selectedEvolucaoFilters.curso
  );

  const handleClearEvolucaoFilters = () => {
    setSelectedEvolucaoFilters({ undAcad: '', curso: '' });
  };

  const labelOrTodos = (value, fallback) => (value && value !== 'todos' ? value : fallback);

  const mediaChartTitle = `Média das Dimensões no Ano ${labelOrTodos(
    selectedFilters.ano,
    'Todos'
  )} — ${labelOrTodos(selectedFilters.curso, selectedFilters.undAcad || 'Recorte Selecionado')}`;

  const totalHistoricoCursos = (graficoEvolucaoData?.quantidadeCursosAvaliados?.valores || []).reduce(
    (a, b) => a + Number(b || 0),
    0
  );

  if (isInitialLoading) {
    return (
      <div className={styles.mainContent}>
        <Header
          title="Avaliação In Loco"
          subtitle="Média das Dimensões e Série Histórica (INEP / SINAES)"
        />
        <DashboardSkeleton />
      </div>
    );
  }

  return (
    <div className={styles.mainContent}>
      <Header
        title="Avaliação In Loco"
        subtitle="Média das Dimensões e Série Histórica (INEP / SINAES)"
      />

      {/* KPI Stat Cards */}
      <div className={styles.statsGrid}>
        {activeSubmenu === 'media' ? (
          <>
            <StatCard
              title="Ano Selecionado"
              value={selectedFilters.ano || 'Não selecionado'}
              icon={<BookOpen size={24} color="#FF8E29" />}
            />
            <StatCard
              title="Unidade Acadêmica"
              value={selectedFilters.undAcad || 'Todas as unidades'}
              icon={<Building size={24} color="#1D556F" />}
            />
            <StatCard
              title="Curso Selecionado"
              value={selectedFilters.curso || 'Todos os cursos'}
              icon={<GraduationCap size={24} color="#288FB4" />}
            />
          </>
        ) : (
          <>
            <StatCard
              title="Período Analisado"
              value={
                graficoEvolucaoData.anos?.length
                  ? `${graficoEvolucaoData.anos[0]} — ${
                      graficoEvolucaoData.anos[graficoEvolucaoData.anos.length - 1]
                    }`
                  : 'Série Histórica'
              }
              icon={<TrendingUp size={24} color="#FF8E29" />}
            />
            <StatCard
              title="Total de Cursos Avaliados"
              value={totalHistoricoCursos > 0 ? totalHistoricoCursos.toLocaleString('pt-BR') : 'Consolidado'}
              icon={<GraduationCap size={24} color="#1D556F" />}
            />
            <StatCard
              title="Unidade em Análise"
              value={selectedEvolucaoFilters.undAcad || 'Geral (UFPA)'}
              icon={<Building size={24} color="#288FB4" />}
            />
          </>
        )}
      </div>

      {/* Filtros da aba Média */}
      {activeSubmenu === 'media' && (
        <AvaliacaoInLocoFilters
          title="Filtros de Seleção • Recorte Anual"
          filters={filtersOptions}
          selectedFilters={selectedFilters}
          onFilterChange={handleFilterChange}
          loadingCampus={loadingCampus}
          loadingCurso={loadingCurso}
        />
      )}

      {/* Filtros da aba Evolução */}
      {activeSubmenu === 'grafico-evolucao' && (
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
            .clearBtn {
              display: inline-flex;
              align-items: center;
              gap: 0.35rem;
              font-size: 0.8rem;
              font-weight: 600;
              color: #ef4444;
              background: #fef2f2;
              border: 1px solid #fee2e2;
              padding: 0.35rem 0.75rem;
              border-radius: 8px;
              cursor: pointer;
              transition: all 0.2s ease;
            }
            .clearBtn:hover {
              background: #fee2e2;
            }
            .stepGrid {
              display: grid;
              grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
              gap: 1rem;
              align-items: flex-end;
            }
            .stepCard {
              display: flex;
              flex-direction: column;
              gap: 0.4rem;
              position: relative;
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
            .customSelect:disabled {
              background-color: #f3f4f6;
              color: #9ca3af;
              cursor: not-allowed;
              border-color: #e5e7eb;
            }
          `}</style>

          <div className="filterHeader">
            <div className="filterHeaderTitle">
              <Filter size={18} color="#FF8E29" />
              <span>Filtros da Série Histórica</span>
            </div>

            {isEvolucaoFilterActive && (
              <button
                type="button"
                onClick={handleClearEvolucaoFilters}
                className="clearBtn"
              >
                <RotateCcw size={14} />
                Limpar filtros
              </button>
            )}
          </div>

          <div className="stepGrid">
            <div className="stepCard">
              <label className="stepLabel" htmlFor="evolucao-undAcad">
                <span
                  className={`stepBadge ${
                    selectedEvolucaoFilters.undAcad ? 'stepBadgeActive' : ''
                  }`}
                >
                  1
                </span>
                Unidade Acadêmica
              </label>
              <select
                id="evolucao-undAcad"
                name="undAcad"
                value={selectedEvolucaoFilters.undAcad}
                onChange={handleEvolucaoFilterChange}
                className="customSelect"
              >
                <option value="">Todas as Unidades Acadêmicas</option>
                {(evolucaoFilterOptions.undAcad ?? []).map((unidade, index) => (
                  <option key={`evolucao-und-${unidade}-${index}`} value={unidade}>
                    {unidade}
                  </option>
                ))}
              </select>
            </div>

            <div className="stepCard">
              <label className="stepLabel" htmlFor="evolucao-curso">
                <span
                  className={`stepBadge ${
                    selectedEvolucaoFilters.curso ? 'stepBadgeActive' : ''
                  }`}
                >
                  2
                </span>
                Curso
              </label>
              <select
                id="evolucao-curso"
                name="curso"
                value={selectedEvolucaoFilters.curso}
                onChange={handleEvolucaoFilterChange}
                disabled={!selectedEvolucaoFilters.undAcad || loadingEvolucaoCursos}
                className="customSelect"
              >
                <option value="">
                  {!selectedEvolucaoFilters.undAcad
                    ? 'Selecione uma unidade acadêmica primeiro'
                    : loadingEvolucaoCursos
                    ? 'Carregando cursos...'
                    : 'Todos os Cursos'}
                </option>
                {!loadingEvolucaoCursos &&
                  (evolucaoFilterOptions.cursos ?? []).map((curso, index) => (
                    <option key={`evolucao-curso-${curso}-${index}`} value={curso}>
                      {curso}
                    </option>
                  ))}
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className={styles.tabsContainer}>
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.key}
              className={activeSubmenu === tab.key ? styles.activeTab : styles.tab}
              onClick={() => setActiveSubmenu(tab.key)}
            >
              <Icon size={16} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Área de Visualização dos Gráficos */}
      <div className={styles.chartDisplayArea}>
        {activeSubmenu === 'media' && (
          <div className={styles.chartsMainContainer} style={{ marginTop: 0 }}>
            {!allFiltersSelected ? (
              <div
                className={styles.chartContainerCard}
                style={{ textAlign: 'center', padding: '3.5rem 1.5rem' }}
              >
                <Filter size={44} color="#FF8E29" style={{ margin: '0 auto 1.25rem' }} />
                <h3 style={{ fontSize: '1.2rem', fontWeight: '700', color: '#1F2937', marginBottom: '0.5rem' }}>
                  Selecione os Filtros
                </h3>
                <p style={{ color: '#6B7280', fontSize: '0.95rem', maxWidth: '500px', margin: '0 auto' }}>
                  Para visualizar a média das dimensões D1, D2 e D3, selecione todos os passos dos filtros acima (Ano, Unidade, Modalidade, Campus e Curso).
                </p>
              </div>
            ) : loadingMedia ? (
              <div
                className={styles.chartContainerCard}
                style={{ minHeight: '380px', position: 'relative' }}
              >
                <LoadingOverlay message="Carregando médias das dimensões..." />
              </div>
            ) : !mediaDimensoes.labels.length ? (
              <div
                className={styles.chartContainerCard}
                style={{ textAlign: 'center', padding: '3rem 1rem' }}
              >
                <HelpCircle size={40} color="#9ca3af" style={{ margin: '0 auto 1rem' }} />
                <p style={{ color: '#6b7280', fontSize: '1rem', margin: 0 }}>
                  Não há dados disponíveis para os filtros selecionados.
                </p>
              </div>
            ) : (
              <div className={styles.chartContainerCard}>
                <MediaDimensoesChart data={mediaDimensoes} title={mediaChartTitle} />
              </div>
            )}
          </div>
        )}

        {activeSubmenu === 'grafico-evolucao' && (
          <div className={styles.chartsMainContainer} style={{ marginTop: 0 }}>
            {loadingEvolucao ? (
              <div
                className={styles.chartContainerCard}
                style={{ minHeight: '380px', position: 'relative' }}
              >
                <LoadingOverlay message="Carregando série histórica..." />
              </div>
            ) : !graficoEvolucaoData.anos?.length ? (
              <div
                className={styles.chartContainerCard}
                style={{ textAlign: 'center', padding: '3rem 1rem' }}
              >
                <HelpCircle size={40} color="#9ca3af" style={{ margin: '0 auto 1rem' }} />
                <p style={{ color: '#6b7280', fontSize: '1rem', margin: 0 }}>
                  Não há dados para o gráfico de evolução histórica.
                </p>
              </div>
            ) : (
              <>
                <div className={styles.chartContainerCard}>
                  <GraficoEvolucaoLineChart data={graficoEvolucaoData} />
                </div>

                <div className={styles.chartContainerCard}>
                  <GraficoEvolucaoD123LineChart data={graficoEvolucaoData} />
                </div>

                <div className={styles.chartContainerCard}>
                  <QuantidadeCursosAvaliadosChart
                    data={graficoEvolucaoData?.quantidadeCursosAvaliados}
                  />
                </div>

                <div className={styles.chartContainerCard}>
                  <MediaDimensaoAnualChart
                    data={graficoEvolucaoData?.mediaDimensaoAnual}
                  />
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
