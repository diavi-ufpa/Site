'use client';

import { Filter, RotateCcw } from 'lucide-react';

export default function AvaliacaoInLocoFilters({
  title = 'Filtros de Seleção',
  filters,
  selectedFilters,
  onFilterChange,
  showRanking = false,
  onToggleRanking = () => {},
  loadingCampus = false,
  loadingCurso = false,
}) {
  const { anos, undAcad, campi, cursos, modalidades } = filters;
  const hasYearSelected = Boolean(selectedFilters?.ano);
  const hasUndAcadSelected = Boolean(selectedFilters?.undAcad);
  const hasModalidadeSelected = Boolean(selectedFilters?.modalidade);
  const hasCampusSelected = Boolean(selectedFilters?.campus);
  const hasCourseSelected = Boolean(selectedFilters?.curso);

  const undAcadOptions = Array.isArray(undAcad) ? undAcad : [];
  const campusOptions = Array.isArray(campi) ? campi : [];
  const cursoOptions = Array.isArray(cursos) ? cursos : [];
  const modalidadeOptions = Array.isArray(modalidades) ? modalidades : [];

  const isAnyFilterActive =
    hasYearSelected ||
    hasUndAcadSelected ||
    hasModalidadeSelected ||
    hasCampusSelected ||
    hasCourseSelected;

  const handleClearFilters = () => {
    onFilterChange({ target: { name: 'ano', value: '' } });
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
          grid-template-columns: repeat(auto-fit, minmax(190px, 1fr));
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
          <span>{title}</span>
        </div>

        {isAnyFilterActive && (
          <button type="button" onClick={handleClearFilters} className="clearBtn">
            <RotateCcw size={14} />
            Limpar filtros
          </button>
        )}
      </div>

      <div className="stepGrid">
        {/* Passo 1: Ano */}
        <div className="stepCard">
          <label className="stepLabel" htmlFor="inloco-ano">
            <span
              className={`stepBadge ${
                hasYearSelected
                  ? 'stepBadgeCompleted'
                  : 'stepBadgeActive'
              }`}
            >
              1
            </span>
            Ano
          </label>
          <select
            id="inloco-ano"
            name="ano"
            value={selectedFilters?.ano || ''}
            onChange={onFilterChange}
            className="customSelect"
          >
            <option value="" disabled hidden>
              Escolha um ano
            </option>
            {anos?.map((a, i) => (
              <option key={`ano-${a}-${i}`} value={a}>
                {a}
              </option>
            ))}
          </select>
        </div>

        {/* Passo 2: Unidade Acadêmica */}
        <div className="stepCard">
          <label className="stepLabel" htmlFor="inloco-undAcad">
            <span
              className={`stepBadge ${
                hasUndAcadSelected
                  ? 'stepBadgeCompleted'
                  : hasYearSelected
                  ? 'stepBadgeActive'
                  : ''
              }`}
            >
              2
            </span>
            Unidade Acadêmica
          </label>
          <select
            id="inloco-undAcad"
            disabled={!hasYearSelected}
            name="undAcad"
            value={selectedFilters?.undAcad ?? ''}
            onChange={onFilterChange}
            className="customSelect"
          >
            <option value="" disabled>
              {hasYearSelected ? 'Selecione a unidade acadêmica' : 'Selecione o ano primeiro'}
            </option>
            {undAcadOptions.map((u, i) => (
              <option key={`undAcad-${u}-${i}`} value={u}>
                {u}
              </option>
            ))}
          </select>
        </div>

        {/* Passo 3: Modalidade */}
        <div className="stepCard">
          <label className="stepLabel" htmlFor="inloco-modalidade">
            <span
              className={`stepBadge ${
                hasModalidadeSelected
                  ? 'stepBadgeCompleted'
                  : hasUndAcadSelected
                  ? 'stepBadgeActive'
                  : ''
              }`}
            >
              3
            </span>
            Modalidade
          </label>
          <select
            id="inloco-modalidade"
            disabled={!hasYearSelected || !hasUndAcadSelected}
            name="modalidade"
            value={selectedFilters?.modalidade ?? ''}
            onChange={onFilterChange}
            className="customSelect"
          >
            <option value="" disabled>
              {!hasYearSelected
                ? 'Selecione o ano primeiro'
                : !hasUndAcadSelected
                ? 'Selecione a unidade primeiro'
                : 'Selecione a modalidade'}
            </option>
            {modalidadeOptions.map((m, i) => (
              <option key={`modalidade-${m}-${i}`} value={m}>
                {m}
              </option>
            ))}
          </select>
        </div>

        {/* Passo 4: Campus */}
        <div className="stepCard">
          <label className="stepLabel" htmlFor="inloco-campus">
            <span
              className={`stepBadge ${
                hasCampusSelected
                  ? 'stepBadgeCompleted'
                  : hasModalidadeSelected
                  ? 'stepBadgeActive'
                  : ''
              }`}
            >
              4
            </span>
            Campus
          </label>
          <select
            id="inloco-campus"
            disabled={!hasYearSelected || !hasUndAcadSelected || !hasModalidadeSelected || loadingCampus}
            name="campus"
            value={selectedFilters?.campus ?? ''}
            onChange={onFilterChange}
            className="customSelect"
          >
            <option value="" disabled>
              {!hasYearSelected
                ? 'Selecione o ano primeiro'
                : !hasUndAcadSelected
                ? 'Selecione a unidade primeiro'
                : !hasModalidadeSelected
                ? 'Selecione a modalidade primeiro'
                : loadingCampus
                ? 'Carregando campi...'
                : 'Selecione o campus'}
            </option>
            {campusOptions.map((c, i) => (
              <option key={`campus-${c}-${i}`} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        {/* Passo 5: Curso */}
        <div className="stepCard">
          <label className="stepLabel" htmlFor="inloco-curso">
            <span
              className={`stepBadge ${
                hasCourseSelected
                  ? 'stepBadgeCompleted'
                  : hasCampusSelected
                  ? 'stepBadgeActive'
                  : ''
              }`}
            >
              5
            </span>
            Curso
          </label>
          <select
            id="inloco-curso"
            disabled={!hasYearSelected || !selectedFilters?.campus || loadingCurso}
            name="curso"
            value={selectedFilters?.curso ?? ''}
            onChange={onFilterChange}
            className="customSelect"
          >
            <option value="" disabled>
              {!hasYearSelected
                ? 'Selecione o ano primeiro'
                : !selectedFilters?.campus
                ? 'Selecione o campus primeiro'
                : loadingCurso
                ? 'Carregando cursos...'
                : 'Selecione o curso'}
            </option>
            {cursoOptions.map((c, i) => (
              <option key={`curso-${c}-${i}`} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}
