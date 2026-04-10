function PaginationControls({
  currentPage,
  totalPages,
  pageSize,
  totalItems,
  onPageChange,
  onPageSizeChange,
}) {
  return (
    <div className="pagination">
      <div className="pagination-info">
        <span>
          Pagina {currentPage} de {totalPages}
        </span>
        <span>Total: {totalItems} registros</span>
      </div>

      <div className="pagination-actions">
        <label className="field compact inline">
          <span>Por pagina</span>
          <select value={pageSize} onChange={(event) => onPageSizeChange(Number(event.target.value))}>
            <option value={5}>5</option>
            <option value={10}>10</option>
            <option value={20}>20</option>
            <option value={50}>50</option>
          </select>
        </label>

        <button type="button" className="secondary" onClick={() => onPageChange(1)} disabled={currentPage === 1}>
          Primeira
        </button>
        <button
          type="button"
          className="secondary"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
        >
          Anterior
        </button>
        <button
          type="button"
          className="secondary"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage >= totalPages}
        >
          Proxima
        </button>
        <button
          type="button"
          className="secondary"
          onClick={() => onPageChange(totalPages)}
          disabled={currentPage >= totalPages}
        >
          Ultima
        </button>
      </div>
    </div>
  );
}

export default PaginationControls;
