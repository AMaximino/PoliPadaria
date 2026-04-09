function EntityForm({ entity, db, form, errors, editing, onSubmit, onClear, onFieldChange }) {
  function renderField(field) {
    const value = String(form[field.name] ?? "");

    if (field.type === "fk") {
      const refRows = db[field.ref] || [];
      return (
        <select
          value={value}
          aria-invalid={Boolean(errors[field.name])}
          onChange={(event) => onFieldChange(field, event.target.value)}
        >
          <option value="">Selecione...</option>
          {refRows.map((item) => (
            <option key={item.id} value={item.id}>
              {item.id} - {item.nome || "Sem nome"}
            </option>
          ))}
        </select>
      );
    }

    return (
      <input
        type={field.type}
        value={value}
        readOnly={Boolean(field.readOnly)}
        aria-invalid={Boolean(errors[field.name])}
        min={field.min}
        step={field.step}
        placeholder={field.mask === "currency" ? "R$ 0,00" : ""}
        onChange={(event) => onFieldChange(field, event.target.value)}
      />
    );
  }

  return (
    <form className="crud-form" onSubmit={onSubmit}>
      {entity.fields.map((field) => (
        <label key={field.name} className="field">
          <span>{field.label}</span>
          {renderField(field)}
          {errors[field.name] && <small className="field-error">{errors[field.name]}</small>}
        </label>
      ))}

      <div className="form-actions">
        <button type="submit">{editing ? "Atualizar" : "Criar"}</button>
        <button type="button" className="secondary" onClick={onClear}>
          Limpar
        </button>
      </div>
    </form>
  );
}

export default EntityForm;
