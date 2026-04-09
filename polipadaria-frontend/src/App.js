import "./App.css";
import EntityForm from "./components/EntityForm";
import EntityTable from "./components/EntityTable";
import EntityTabs from "./components/EntityTabs";
import EntityToolbar from "./components/EntityToolbar";
import PaginationControls from "./components/PaginationControls";
import { ENTITY_CONFIG, TAB_ORDER } from "./constants/dataModel";
import { usePoliPadariaCrud } from "./hooks/usePoliPadariaCrud";

function App() {
  const {
    db,
    activeTab,
    entity,
    editingKey,
    message,
    form,
    fieldErrors,
    sortField,
    sortDirection,
    filterText,
    advancedFilter,
    operatorOptions,
    showSecondValue,
    paginatedRows,
    totalPages,
    currentPage,
    pageSize,
    filteredTotal,
    formatCellValue,
    getPk,
    setActiveTab,
    handleGlobalFilterChange,
    handleSortFieldChange,
    handleSortDirectionChange,
    handleAdvancedFilterChange,
    clearAdvancedFilters,
    handleSubmit,
    resetForm,
    handleChange,
    handleEdit,
    handleDelete,
    setCurrentPage,
    setPageSize,
  } = usePoliPadariaCrud();

  return (
    <div className="App">
      <div className="App-wrapper">
        <header className="App-header">PoliPadaria</header>
        <main>
          <p className="App-subtitle">Sistema React com CRUD por entidade do diagrama ER</p>

          <EntityTabs
            tabOrder={TAB_ORDER}
            entityConfig={ENTITY_CONFIG}
            activeTab={activeTab}
            onChange={setActiveTab}
          />

          <section className="entity-panel">
            <h2>{entity.title}</h2>

            <EntityToolbar
              entity={entity}
              filterText={filterText}
              sortField={sortField}
              sortDirection={sortDirection}
              advancedFilter={advancedFilter}
              operatorOptions={operatorOptions}
              showSecondValue={showSecondValue}
              onFilterChange={handleGlobalFilterChange}
              onSortFieldChange={handleSortFieldChange}
              onSortDirectionChange={handleSortDirectionChange}
              onAdvancedFilterChange={handleAdvancedFilterChange}
              onClearAdvancedFilter={clearAdvancedFilters}
            />

            <EntityForm
              entity={entity}
              db={db}
              form={form}
              errors={fieldErrors}
              editing={Boolean(editingKey)}
              onSubmit={handleSubmit}
              onClear={resetForm}
              onFieldChange={handleChange}
            />

            {message && <p className="feedback">{message}</p>}

            <EntityTable
              entity={entity}
              rows={paginatedRows}
              onEdit={handleEdit}
              onDelete={handleDelete}
              formatCellValue={formatCellValue}
              getPk={getPk}
            />

            <PaginationControls
              currentPage={currentPage}
              totalPages={totalPages}
              pageSize={pageSize}
              totalItems={filteredTotal}
              onPageChange={setCurrentPage}
              onPageSizeChange={(size) => {
                setPageSize(size);
                setCurrentPage(1);
              }}
            />
          </section>
        </main>
      </div>
    </div>
  );
}

export default App;
