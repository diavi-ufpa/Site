'use client';

import { useState } from 'react';
import styles from '@/styles/dados.module.css';
import { Filter, CheckCircle2, RotateCcw, ChevronRight, Layers, BarChart3 } from 'lucide-react';

export default function DiscenteFilters({
  filters,
  selectedFilters,
  onFilterChange,
  showRanking = false,
  onToggleRanking = () => {},
  showDimensionFilter = true,
  showRankingToggle = true,
  loadingCampus = false,
  loadingCurso = false,
  loadingInitial = false,
}) {
  const { campus, cursos, anos, dimensoes } = filters;
  const hasYearSelected = Boolean(selectedFilters?.ano);
  const hasCampusSelected = Boolean(selectedFilters?.campus);
  const hasCourseSelected = Boolean(selectedFilters?.curso);

  const campusOptions = Array.isArray(campus) ? campus : [];
  const cursoOptions = Array.isArray(cursos) ? cursos : [];

  const handleClearFilters = () => {
    onFilterChange({ target: { name: 'ano', value: '' } });
  };

  const isAnyFilterActive = hasYearSelected || hasCampusSelected || hasCourseSelected;

  return (
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
          gap: 0.5rem;
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
          grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
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

        .stepBadgeCompleted {
          background-color: #10b981;
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

        .lockedStepPlaceholder {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0.65rem 0.85rem;
          background-color: #f9fafb;
          border: 1.5px dashed #e5e7eb;
          border-radius: 10px;
          font-size: 0.85rem;
          color: #9ca3af;
          user-select: none;
        }

        .clearButton {
          display: inline-flex;
          align-items: center;
          gap: 0.4rem;
          background-color: #f3f4f6;
          color: #4b5563;
          border: none;
          padding: 0.4rem 0.75rem;
          border-radius: 8px;
          font-size: 0.8rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .clearButton:hover {
          background-color: #fee2e2;
          color: #dc2626;
        }

        .togglesRow {
          display: flex;
          align-items: center;
          gap: 1rem;
          flex-wrap: wrap;
        }

        .togglePill {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.5rem 0.85rem;
          background-color: #f9fafb;
          border: 1px solid #e5e7eb;
          border-radius: 20px;
          font-size: 0.85rem;
          font-weight: 600;
          color: #374151;
          cursor: pointer;
          user-select: none;
          transition: all 0.2s ease;
        }

        .togglePill:hover {
          border-color: #FF8E29;
        }

        .togglePillActive {
          background-color: #fff7ed;
          border-color: #FF8E29;
          color: #c2410c;
        }

        .pulseText {
          animation: pulse 1.2s infinite alternate;
        }

        @keyframes pulse {
          from { opacity: 0.5; }
          to { opacity: 1; }
        }
      `}</style>

      {/* Cabeçalho do Card de Filtros */}
      <div className="filterHeader">
        <div className="filterHeaderTitle">
          <Filter size={18} color="#FF8E29" />
          <span>Filtros de Consulta</span>
        </div>

        <div className="togglesRow">
          {showRankingToggle && (
            <label className={`togglePill ${showRanking ? 'togglePillActive' : ''}`}>
              <input
                type="checkbox"
                checked={showRanking}
                onChange={onToggleRanking}
                style={{ accentColor: '#FF8E29', cursor: 'pointer' }}
              />
              <BarChart3 size={16} />
              Exibir Ranking
            </label>
          )}

          {isAnyFilterActive && (
            <button
              type="button"
              className="clearButton"
              onClick={handleClearFilters}
              title="Limpar todos os filtros selecionados"
            >
              <RotateCcw size={14} />
              Limpar filtros
            </button>
          )}
        </div>
      </div>

      {/* Grid de Passos Progressivos */}
      {loadingInitial ? (
        <div className="stepGrid">
          {[
            { label: '1. Ano da Avaliação' },
            { label: '2. Campus' },
            { label: '3. Curso' },
          ].map((item, idx) => (
            <div key={idx} className="stepCard">
              <label className="stepLabel" style={{ color: '#9ca3af' }}>
                <span className="stepBadge">{idx + 1}</span>
                {item.label}
              </label>
              <div className="lockedStepPlaceholder">
                <span className="pulseText">Carregando opções...</span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="stepGrid">
          {/* PASSO 1: ANO */}
          <div className="stepCard">
            <label className="stepLabel">
              <span className={`stepBadge ${hasYearSelected ? 'stepBadgeCompleted' : 'stepBadgeActive'}`}>
                {hasYearSelected ? '✓' : '1'}
              </span>
              Ano da Avaliação
            </label>
            <select
              name="ano"
              value={selectedFilters.ano ?? ''}
              onChange={onFilterChange}
              className="customSelect"
            >
              <option value="" disabled hidden>
                Selecione o ano
              </option>
              {anos?.map((a, i) => (
                <option key={`ano-${a}-${i}`} value={a}>
                  {a}
                </option>
              ))}
            </select>
          </div>

          {/* PASSO 2: CAMPUS (Disclosure Progressivo) */}
          <div className="stepCard">
            <label className="stepLabel">
              <span className={`stepBadge ${!hasYearSelected ? '' : hasCampusSelected ? 'stepBadgeCompleted' : 'stepBadgeActive'}`}>
                {hasCampusSelected ? '✓' : '2'}
              </span>
              Campus
            </label>

            {!hasYearSelected ? (
              <div className="lockedStepPlaceholder">
                <span>Aguardando seleção do ano</span>
                <ChevronRight size={16} />
              </div>
            ) : (
              <select
                disabled={loadingCampus}
                name="campus"
                value={selectedFilters.campus ?? ''}
                onChange={onFilterChange}
                className="customSelect"
              >
                <option value="" disabled>
                  {loadingCampus ? 'Carregando campi...' : 'Selecione o campus'}
                </option>
                {!loadingCampus && <option value="todos">Todos os Campi</option>}
                {campusOptions.map((c, i) => (
                  <option key={`campus-${c}-${i}`} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* PASSO 3: CURSO (Disclosure Progressivo) */}
          <div className="stepCard">
            <label className="stepLabel">
              <span className={`stepBadge ${!hasCampusSelected ? '' : hasCourseSelected ? 'stepBadgeCompleted' : 'stepBadgeActive'}`}>
                {hasCourseSelected ? '✓' : '3'}
              </span>
              Curso
            </label>

            {!hasCampusSelected ? (
              <div className="lockedStepPlaceholder">
                <span>Aguardando seleção do campus</span>
                <ChevronRight size={16} />
              </div>
            ) : (
              <select
                disabled={loadingCurso}
                name="curso"
                value={selectedFilters.curso ?? ''}
                onChange={onFilterChange}
                className="customSelect"
              >
                <option value="" disabled>
                  {loadingCurso ? 'Carregando cursos...' : 'Selecione o curso'}
                </option>
                {!loadingCurso && <option value="todos">Todos os Cursos</option>}
                {cursoOptions.map((c, i) => (
                  <option key={`curso-${c}-${i}`} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* REFINAMENTO: DIMENSÃO (Opcional) */}
          {showDimensionFilter && (
            <div className="stepCard">
              <label className="stepLabel">
                <Layers size={14} color="#6b7280" />
                Dimensão (opcional)
              </label>
              <select
                name="dimensao"
                value={selectedFilters.dimensao ?? ''}
                onChange={onFilterChange}
                className="customSelect"
              >
                <option value="">Todas as Dimensões</option>
                {(dimensoes ?? []).map((d) => (
                  <option key={`dim-${d.value}`} value={d.value}>
                    {d.label}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
