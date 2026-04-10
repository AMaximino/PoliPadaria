function EntityTable({ entity, rows, onEdit, onDelete, formatCellValue, getPk }) {
  return (
    <div className="table-container">
      <table>
        <thead>
          <tr>
            {entity.fields.map((field) => (
              <th key={field.name}>{field.label}</th>
            ))}
            <th>Acoes</th>
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 && (
            <tr>
              <td colSpan={entity.fields.length + 1}>Nenhum registro encontrado.</td>
            </tr>
          )}

          {rows.map((row) => (
            <tr key={getPk(entity, row)}>
              {entity.fields.map((field) => (
                <td key={field.name}>{formatCellValue(field, row[field.name])}</td>
              ))}
              <td>
                <div className="table-actions">
                  <button type="button" onClick={() => onEdit(row)}>
                    Editar
                  </button>
                  <button type="button" className="danger" onClick={() => onDelete(row)}>
                    Excluir
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default EntityTable;
