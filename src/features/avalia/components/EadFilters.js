'use client';

import { Filter, RotateCcw, ChevronRight, Layers } from 'lucide-react';
import styles from '@/styles/dados.module.css';

export default function EadFilters({
  filters,
  selectedFilters,
  onFilterChange,
  visibleFields,
  poloPlaceholder = 'Selecione o polo desejado',
  disablePlaceholderOption = true,
  showAllPolosOption = true,
  allPolosLabel = 'Todos os Polos',
}) {
  const show = (key) => {
    if (!Array.isArray(visibleFields) || visibleFields.length === 0) return true;
    return visibleFields.includes(key);
  };

  const is2023 = selectedFilters?.ano === '2023';
  const hasPolos = Array.isArray(filters?.polos) && filters.polos.length > 0;
  const shouldShowPolo = !is2023 && hasPolos;

  const polos = hasPolos ? filters.polos : [];
  const cursos = Array.isArray(filters?.cursos) ? filters.cursos : [];
  const disciplinas = Array.isArray(filters?.disciplinas) ? filters.disciplinas : [];
  const dimensoes = Array.isArray(filters?.dimensoes) ? filters.dimensoes : [];
  const anos = Array.isArray(filters?.anos) ? filters.anos : [];

  const poloValue = selectedFilters?.polo || '';
  const cursoValue = selectedFilters?.curso || '';
  const disciplinaValue = selectedFilters?.disciplina || '';
  const dimensaoValue = selectedFilters?.dimensao || '';
  const anoValue = selectedFilters?.ano || (anos[0] ?? '');

  const isAnyFilterActive =
    (poloValue && poloValue !== 'todos' && poloValue !== allPolosLabel) ||
    (cursoValue && cursoValue !== 'todos') ||
    (disciplinaValue && disciplinaValue !== 'todos') ||
    (dimensaoValue && dimensaoValue !== 'todos');

  const handleClearFilters = () => {
    onFilterChange({ target: { name: 'polo', value: 'todos' } });
    onFilterChange({ target: { name: 'curso', value: 'todos' } });
    onFilterChange({ target: { name: 'disciplina', value: 'todos' } });
    onFilterChange({ target: { name: 'dimensao', value: 'todos' } });
  };

  // Calcular contadores dos passos numéricos
  let currentStep = 1;
  const stepMap = {};
  if (show('ano')) stepMap.ano = currentStep++;
  if (show('polo') && shouldShowPolo) stepMap.polo = currentStep++;
  if (show('curso')) stepMap.curso = currentStep++;
  if (show('disciplina')) stepMap.disciplina = currentStep++;

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
          grid-template-columns: repeat(auto-fit, minmax(210px, 1fr));
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
      `}</style>

      {/* Cabeçalho */}
      <div className="filterHeader">
        <div className="filterHeaderTitle">
          <Filter size={18} color="#FF8E29" />
          <span>Filtros de Consulta — EAD</span>
        </div>

        {isAnyFilterActive && (
          <button
            type="button"
            className="clearButton"
            onClick={handleClearFilters}
            title="Limpar filtros específicos"
          >
            <RotateCcw size={14} />
            Limpar filtros
          </button>
        )}
      </div>

      {/* Grid de Passos */}
      <div className="stepGrid">
        {/* ANO */}
        {show('ano') && (
          <div className="stepCard">
            <label className="stepLabel">
              <span className="stepBadge">{stepMap.ano || '1'}</span>
              Ano da Avaliação
            </label>
            <select
              name="ano"
              value={anoValue}
              onChange={onFilterChange}
              className="customSelect"
              aria-label="Ano"
            >
              {anos.map((ano) => (
                <option key={ano} value={ano}>
                  {ano}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* POLO (Se aplicável) */}
        {show('polo') && shouldShowPolo && (
          <div className="stepCard">
            <label className="stepLabel">
              <span className={`stepBadge ${poloValue && poloValue !== 'todos' ? 'stepBadgeCompleted' : ''}`}>
                {poloValue && poloValue !== 'todos' ? '✓' : stepMap.polo || '2'}
              </span>
              Polo de Vinculação
            </label>
            <select
              name="polo"
              value={poloValue}
              onChange={onFilterChange}
              className="customSelect"
              aria-label="Polo"
            >
              {disablePlaceholderOption && (
                <option value="" disabled hidden>
                  {poloPlaceholder}
                </option>
              )}
              {showAllPolosOption && <option value="todos">{allPolosLabel}</option>}
              {polos.map((polo) => (
                <option key={polo} value={polo}>
                  {polo}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* CURSO */}
        {show('curso') && (
          <div className="stepCard">
            <label className="stepLabel">
              <span className={`stepBadge ${cursoValue && cursoValue !== 'todos' ? 'stepBadgeCompleted' : ''}`}>
                {cursoValue && cursoValue !== 'todos' ? '✓' : stepMap.curso || '3'}
              </span>
              Curso
            </label>
            <select
              name="curso"
              value={cursoValue}
              onChange={onFilterChange}
              className="customSelect"
              aria-label="Curso"
            >
              <option value="" disabled hidden>
                Selecione o curso
              </option>
              <option value="todos">Todos os Cursos</option>
              {cursos.map((curso) => (
                <option key={curso} value={curso}>
                  {curso}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* DISCIPLINA */}
        {show('disciplina') && (
          <div className="stepCard">
            <label className="stepLabel">
              <span className={`stepBadge ${disciplinaValue && disciplinaValue !== 'todos' ? 'stepBadgeCompleted' : ''}`}>
                {disciplinaValue && disciplinaValue !== 'todos' ? '✓' : stepMap.disciplina || '4'}
              </span>
              Disciplina
            </label>
            <select
              name="disciplina"
              value={disciplinaValue}
              onChange={onFilterChange}
              className="customSelect"
              aria-label="Disciplina"
            >
              <option value="todos">Todas as Disciplinas</option>
              {disciplinas.map((disciplina) => (
                <option key={disciplina} value={disciplina}>
                  {disciplina}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* DIMENSÃO (Opcional) */}
        {show('dimensao') && (
          <div className="stepCard">
            <label className="stepLabel">
              <Layers size={14} color="#6b7280" />
              Dimensão (opcional)
            </label>
            <select
              name="dimensao"
              value={dimensaoValue}
              onChange={onFilterChange}
              className="customSelect"
              aria-label="Dimensão"
            >
              <option value="todos">Todas as Dimensões</option>
              {dimensoes.map((dimensao) => (
                <option key={dimensao} value={dimensao}>
                  {dimensao}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>
    </div>
  );
}
