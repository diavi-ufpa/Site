'use client';

import { useState, useMemo } from 'react';
import { Filter, RotateCcw, SplitSquareVertical } from 'lucide-react';

export default function DocenteFilters({
  title = 'Filtros de Seleção',
  filters,
  selectedFilters,
  onFilterChange,
  questionMap,
  dimensionMap,

  // Comparação (opcional; só o card A usa)
  showCompareToggle = false,
  compareEnabled = false,
  onCompareChange = () => {},
}) {
  const { lotacoes, cargos } = filters;

  // Perguntas disponíveis filtradas por dimensão
  const availableQuestions = useMemo(() => {
    const selectedDim = selectedFilters?.dimensao;
    if (selectedDim && selectedDim !== 'todas' && dimensionMap && dimensionMap[selectedDim]) {
      const keys = dimensionMap[selectedDim];
      const filtered = {};
      keys.forEach((k) => {
        if (questionMap?.[k]) filtered[k] = questionMap[k];
      });
      return filtered;
    }
    return questionMap;
  }, [selectedFilters?.dimensao, questionMap, dimensionMap]);

  const isAnyFilterActive =
    (selectedFilters?.lotacao && selectedFilters.lotacao !== 'todos') ||
    (selectedFilters?.cargo && selectedFilters.cargo !== 'todos') ||
    (selectedFilters?.dimensao && selectedFilters.dimensao !== 'todas') ||
    (selectedFilters?.pergunta && selectedFilters.pergunta !== 'todas');

  const handleClearFilters = () => {
    onFilterChange({ target: { name: 'lotacao', value: 'todos' } });
    onFilterChange({ target: { name: 'cargo', value: 'todos' } });
    onFilterChange({ target: { name: 'dimensao', value: 'todas' } });
    onFilterChange({ target: { name: 'pergunta', value: 'todas' } });
  };

  // Consistência Dimensão -> Pergunta
  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === 'dimensao') {
      const nextDim = value;
      const currentQuestion = selectedFilters?.pergunta;

      if (
        currentQuestion &&
        currentQuestion !== 'todas' &&
        nextDim !== 'todas' &&
        dimensionMap?.[nextDim] &&
        !dimensionMap[nextDim].includes(currentQuestion)
      ) {
        onFilterChange({ target: { name: 'dimensao', value: nextDim } });
        onFilterChange({ target: { name: 'pergunta', value: 'todas' } });
        return;
      }
    }

    onFilterChange(e);
  };

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

        .headerActions {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          flex-wrap: wrap;
        }

        .compareButton {
          display: inline-flex;
          align-items: center;
          gap: 0.4rem;
          padding: 0.35rem 0.75rem;
          border-radius: 8px;
          font-size: 0.82rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
          border: 1.5px solid #e5e7eb;
          background: #f9fafb;
          color: #4b5563;
        }

        .compareButtonActive {
          border-color: #ff8e29;
          background: #fff7ed;
          color: #ea580c;
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
          <span>{title}</span>
        </div>

        <div className="headerActions">
          {showCompareToggle && (
            <button
              type="button"
              className={`compareButton ${compareEnabled ? 'compareButtonActive' : ''}`}
              onClick={() => onCompareChange(!compareEnabled)}
            >
              <SplitSquareVertical size={16} />
              <span>Modo Comparação {compareEnabled ? '(Ativo)' : ''}</span>
            </button>
          )}

          {isAnyFilterActive && (
            <button type="button" onClick={handleClearFilters} className="clearBtn">
              <RotateCcw size={14} />
              Limpar filtros
            </button>
          )}
        </div>
      </div>

      <div className="stepGrid">
        {/* Passo 1: Lotação */}
        <div className="stepCard">
          <label className="stepLabel" htmlFor="docente-lotacao">
            <span className={`stepBadge ${selectedFilters?.lotacao && selectedFilters.lotacao !== 'todos' ? 'stepBadgeActive' : ''}`}>
              1
            </span>
            Lotação
          </label>
          <select
            id="docente-lotacao"
            name="lotacao"
            value={selectedFilters?.lotacao || 'todos'}
            onChange={handleChange}
            className="customSelect"
          >
            <option value="todos">Todas as Lotações</option>
            {lotacoes?.map((l, i) => (
              <option key={`${l}-${i}`} value={l}>
                {l}
              </option>
            ))}
          </select>
        </div>

        {/* Passo 2: Cargo */}
        <div className="stepCard">
          <label className="stepLabel" htmlFor="docente-cargo">
            <span className={`stepBadge ${selectedFilters?.cargo && selectedFilters.cargo !== 'todos' ? 'stepBadgeActive' : ''}`}>
              2
            </span>
            Cargo
          </label>
          <select
            id="docente-cargo"
            name="cargo"
            value={selectedFilters?.cargo || 'todos'}
            onChange={handleChange}
            className="customSelect"
          >
            <option value="todos">Todos os Cargos</option>
            {cargos?.map((c, i) => (
              <option key={`${c}-${i}`} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        {/* Passo 3: Dimensão */}
        <div className="stepCard">
          <label className="stepLabel" htmlFor="docente-dimensao">
            <span className={`stepBadge ${selectedFilters?.dimensao && selectedFilters.dimensao !== 'todas' ? 'stepBadgeActive' : ''}`}>
              3
            </span>
            Dimensão
          </label>
          <select
            id="docente-dimensao"
            name="dimensao"
            value={selectedFilters?.dimensao || 'todas'}
            onChange={handleChange}
            className="customSelect"
          >
            <option value="todas">Todas as Dimensões</option>
            {dimensionMap &&
              Object.keys(dimensionMap).map((dim, i) => (
                <option key={`${dim}-${i}`} value={dim}>
                  {dim}
                </option>
              ))}
          </select>
        </div>

        {/* Passo 4: Pergunta */}
        <div className="stepCard stepCardWide">
          <label className="stepLabel" htmlFor="docente-pergunta">
            <span className={`stepBadge ${selectedFilters?.pergunta && selectedFilters.pergunta !== 'todas' ? 'stepBadgeActive' : ''}`}>
              4
            </span>
            Analisar Pergunta Específica
          </label>
          <select
            id="docente-pergunta"
            name="pergunta"
            value={selectedFilters?.pergunta || 'todas'}
            onChange={handleChange}
            className="customSelect"
          >
            <option value="todas">Todas as Perguntas da Dimensão</option>
            {availableQuestions &&
              Object.keys(availableQuestions).map((key) => {
                const fullText = `${key}: ${availableQuestions[key]}`;
                return (
                  <option key={key} value={key} title={fullText}>
                    {fullText}
                  </option>
                );
              })}
          </select>
        </div>
      </div>
    </div>
  );
}
