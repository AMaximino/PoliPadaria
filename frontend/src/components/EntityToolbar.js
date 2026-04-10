function EntityToolbar({
  entity,
  filterText,
  sortField,
  sortDirection,
  advancedFilter,
  operatorOptions,
  showSecondValue,
  onFilterChange,
  onSortFieldChange,
  onSortDirectionChange,
  onAdvancedFilterChange,
  onClearAdvancedFilter,
}) {
  return (
    <div className="toolbar">
      <label className="field compact">
        <span>Busca</span>
        <input
          type="text"
          value={filterText}
          placeholder="Busca geral"
          onChange={(event) => onFilterChange(event.target.value)}
        />
      </label>

      <label className="field compact">
        <span>Filtro por coluna</span>
        <select
          value={advancedFilter.fieldName}
          onChange={(event) => onAdvancedFilterChange("fieldName", event.target.value)}
        >
          <option value="">Sem filtro</option>
          {entity.fields.map((field) => (
            <option key={field.name} value={field.name}>
              {field.label}
            </option>
          ))}
        </select>
      </label>

      <label className="field compact">
        <span>Operador</span>
        <select
          value={advancedFilter.operator}
          onChange={(event) => onAdvancedFilterChange("operator", event.target.value)}
          disabled={!advancedFilter.fieldName}
        >
          {operatorOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </label>

      <label className="field compact">
        <span>Valor inicial</span>
        <input
          type="text"
          value={advancedFilter.value1}
          placeholder="Valor"
          onChange={(event) => onAdvancedFilterChange("value1", event.target.value)}
          disabled={!advancedFilter.fieldName}
        />
      </label>

      {showSecondValue && (
        <label className="field compact">
          <span>Valor final</span>
          <input
            type="text"
            value={advancedFilter.value2}
            placeholder="Valor final"
            onChange={(event) => onAdvancedFilterChange("value2", event.target.value)}
            disabled={!advancedFilter.fieldName}
          />
        </label>
      )}

      <div className="toolbar-actions">
        <button type="button" className="secondary" onClick={onClearAdvancedFilter}>
          Limpar filtros
        </button>
      </div>

      <label className="field compact">
        <span>Ordenar por</span>
        <select value={sortField} onChange={(event) => onSortFieldChange(event.target.value)}>
          {entity.fields.map((field) => (
            <option key={field.name} value={field.name}>
              {field.label}
            </option>
          ))}
        </select>
      </label>

      <label className="field compact">
        <span>Direcao</span>
        <select value={sortDirection} onChange={(event) => onSortDirectionChange(event.target.value)}>
          <option value="asc">Crescente</option>
          <option value="desc">Decrescente</option>
        </select>
      </label>
    </div>
  );
}

export default EntityToolbar;
