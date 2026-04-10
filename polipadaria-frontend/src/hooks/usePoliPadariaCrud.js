import { useEffect, useMemo, useState } from "react";
import { BASE_DB, DELETE_RULES, ENTITY_CONFIG, TAB_ORDER } from "../constants/dataModel";
import { currencyInputToNumber, maskCpf, normalizeCurrencyInput, toCurrencyInput } from "../utils/formatters";
import { createRecord, deleteRecord, fetchState, updateRecord } from "../utils/api";
import {
  buildEmptyForm,
  fieldToComparable,
  formatCellValue,
  getFieldKind,
  getOperatorOptions,
  getPk,
  nextId,
  parseFilterValue,
} from "../utils/entityLogic";
import { isValidCpf, isValidDatetimeLocal } from "../utils/validators";

function initialAdvancedFilter() {
  return {
    fieldName: "",
    operator: "contains",
    value1: "",
    value2: "",
  };
}

function parseFieldValue(field, value) {
  if (field.mask === "currency") {
    return currencyInputToNumber(value);
  }

  if (field.type === "number" || field.type === "fk") {
    if (value === "") {
      return "";
    }
    return Number(value);
  }

  return value;
}

export function usePoliPadariaCrud() {
  const [db, setDb] = useState(BASE_DB);
  const [activeTab, setActiveTab] = useState(TAB_ORDER[0]);
  const [editingKey, setEditingKey] = useState("");
  const [message, setMessage] = useState("");
  const [form, setForm] = useState(() => buildEmptyForm(ENTITY_CONFIG[TAB_ORDER[0]]));
  const [fieldErrors, setFieldErrors] = useState({});
  const [filterText, setFilterText] = useState("");
  const [advancedFilter, setAdvancedFilter] = useState(initialAdvancedFilter);
  const [sortField, setSortField] = useState(ENTITY_CONFIG[TAB_ORDER[0]].fields[0].name);
  const [sortDirection, setSortDirection] = useState("asc");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const entity = ENTITY_CONFIG[activeTab];
  const rows = useMemo(() => db[entity.collection] || [], [db, entity.collection]);

  useEffect(() => {
    let cancelled = false;

    if (typeof fetch !== "function") {
      return () => {
        cancelled = true;
      };
    }

    fetchState()
      .then((state) => {
        if (!cancelled) {
          setDb(state);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setMessage("Nao foi possivel carregar o banco SQLite.");
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    setForm(buildEmptyForm(ENTITY_CONFIG[activeTab]));
    setFieldErrors({});
    setEditingKey("");
    setMessage("");
    setFilterText("");
    setAdvancedFilter(initialAdvancedFilter());
    setSortField(ENTITY_CONFIG[activeTab].fields[0].name);
    setSortDirection("asc");
    setCurrentPage(1);
  }, [activeTab]);

  function findFkProblem(field, value) {
    if (field.type !== "fk" || value === "") {
      return "";
    }

    const refRows = db[field.ref] || [];
    const exists = refRows.some((item) => Number(item.id) === Number(value));

    if (!exists) {
      return `FK invalida: ${field.label}`;
    }

    return "";
  }

  const filteredAndSortedRows = useMemo(() => {
    const applyAdvancedFilter = (row) => {
      if (!advancedFilter.fieldName) {
        return true;
      }

      const targetField = entity.fields.find((field) => field.name === advancedFilter.fieldName);
      if (!targetField) {
        return true;
      }

      const kind = getFieldKind(targetField);
      const rowComparable = fieldToComparable(targetField, row[targetField.name]);
      const value1 = parseFilterValue(targetField, advancedFilter.value1);
      const value2 = parseFilterValue(targetField, advancedFilter.value2);

      if (kind === "text") {
        if (!value1) {
          return true;
        }

        if (advancedFilter.operator === "equals") {
          return rowComparable === value1;
        }

        return rowComparable.includes(value1);
      }

      if (value1 === null) {
        return true;
      }

      if (advancedFilter.operator === "gte") {
        return rowComparable >= value1;
      }
      if (advancedFilter.operator === "lte") {
        return rowComparable <= value1;
      }
      if (advancedFilter.operator === "between") {
        if (value2 === null) {
          return true;
        }
        return rowComparable >= value1 && rowComparable <= value2;
      }

      return rowComparable === value1;
    };

    const lowerQuery = filterText.trim().toLowerCase();
    const sortTargetField = entity.fields.find((field) => field.name === sortField) || entity.fields[0];

    const filteredRows = rows.filter((row) => {
      if (!lowerQuery) {
        return applyAdvancedFilter(row);
      }

      const matchesGlobal = entity.fields.some((field) => {
        const shownValue = formatCellValue(field, row[field.name]);
        return shownValue.toLowerCase().includes(lowerQuery);
      });

      return matchesGlobal && applyAdvancedFilter(row);
    });

    return [...filteredRows].sort((a, b) => {
      const aValue = fieldToComparable(sortTargetField, a[sortTargetField.name]);
      const bValue = fieldToComparable(sortTargetField, b[sortTargetField.name]);

      if (typeof aValue === "string" && typeof bValue === "string") {
        const compared = aValue.localeCompare(bValue, "pt-BR");
        return sortDirection === "asc" ? compared : -compared;
      }

      const compared = aValue - bValue;
      return sortDirection === "asc" ? compared : -compared;
    });
  }, [
    advancedFilter.fieldName,
    advancedFilter.operator,
    advancedFilter.value1,
    advancedFilter.value2,
    entity,
    filterText,
    rows,
    sortDirection,
    sortField,
  ]);

  const totalPages = Math.max(1, Math.ceil(filteredAndSortedRows.length / pageSize));

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const paginatedRows = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredAndSortedRows.slice(start, start + pageSize);
  }, [currentPage, filteredAndSortedRows, pageSize]);

  function validateRow(candidate, currentPk) {
    const nextErrors = {};

    for (const field of entity.fields) {
      if (field.required && String(candidate[field.name] ?? "").trim() === "") {
        nextErrors[field.name] = `Preencha ${field.label}.`;
        continue;
      }

      if (field.mask === "cpf" && !isValidCpf(candidate[field.name])) {
        nextErrors[field.name] = "CPF invalido.";
      }

      if (field.type === "datetime-local" && !isValidDatetimeLocal(candidate[field.name])) {
        nextErrors[field.name] = "Data invalida.";
      }

      if ((field.type === "number" || field.type === "fk") && candidate[field.name] !== "") {
        const asNumber = Number(candidate[field.name]);
        if (Number.isNaN(asNumber)) {
          nextErrors[field.name] = "Numero invalido.";
          continue;
        }
        if (field.min !== undefined && asNumber < field.min) {
          nextErrors[field.name] = `Valor deve ser >= ${field.min}.`;
        }
      }

      if (field.mask === "currency") {
        const amount = Number(candidate[field.name]);
        if (Number.isNaN(amount) || amount < 0) {
          nextErrors[field.name] = "Moeda invalida.";
        }
      }

      const fkProblem = findFkProblem(field, candidate[field.name]);
      if (fkProblem) {
        nextErrors[field.name] = fkProblem;
      }
    }

    if (Object.keys(nextErrors).length > 0) {
      return { fieldErrors: nextErrors, generalError: "Corrija os campos destacados." };
    }

    const candidatePk = getPk(entity, candidate);
    const duplicate = rows.some((item) => {
      const itemPk = getPk(entity, item);
      if (currentPk && itemPk === currentPk) {
        return false;
      }
      return itemPk === candidatePk;
    });

    if (duplicate) {
      return {
        fieldErrors: {},
        generalError: "Ja existe um registro com a mesma chave primaria.",
      };
    }

    return { fieldErrors: {}, generalError: "" };
  }

  function resetForm() {
    setForm(buildEmptyForm(entity));
    setFieldErrors({});
    setEditingKey("");
  }

  function handleChange(field, value) {
    let normalized = value;

    if (field.mask === "cpf") {
      normalized = maskCpf(value);
    }

    if (field.mask === "currency") {
      normalized = normalizeCurrencyInput(value);
    }

    setForm((prev) => ({
      ...prev,
      [field.name]: normalized,
    }));

    setFieldErrors((prev) => {
      if (!prev[field.name]) {
        return prev;
      }
      const next = { ...prev };
      delete next[field.name];
      return next;
    });
  }

  async function handleSubmit(event) {
    event.preventDefault();

    const isEditing = editingKey !== "";
    const candidate = {};
    const validationCandidate = {};

    entity.fields.forEach((field) => {
      const parsedValue = parseFieldValue(field, form[field.name]);
      validationCandidate[field.name] = parsedValue;

      if (field.readOnly) {
        return;
      }

      if (isEditing && entity.pk.includes(field.name)) {
        return;
      }

      candidate[field.name] = parsedValue;
    });

    if (entity.autoId) {
      if (isEditing) {
        validationCandidate.id = Number(String(editingKey).split("::")[0]);
      } else {
        validationCandidate.id = nextId(rows);
      }
    }

    const validation = validateRow(validationCandidate, editingKey);
    if (validation.generalError) {
      setFieldErrors(validation.fieldErrors);
      setMessage(validation.generalError);
      return;
    }

    setFieldErrors({});

    try {
      if (isEditing) {
        await updateRecord(entity.collection, editingKey, candidate);
      } else {
        await createRecord(entity.collection, candidate);
      }

      const state = await fetchState();

      setDb(state);
      setMessage(isEditing ? "Registro atualizado com sucesso." : "Registro criado com sucesso.");
      resetForm();
    } catch (error) {
      setMessage(error.message || "Falha ao salvar registro no SQLite.");
    }
  }

  function handleEdit(row) {
    const copy = buildEmptyForm(entity);
    entity.fields.forEach((field) => {
      if (field.mask === "currency") {
        copy[field.name] = toCurrencyInput(row[field.name]);
      } else if (field.mask === "cpf") {
        copy[field.name] = maskCpf(row[field.name]);
      } else {
        copy[field.name] = row[field.name] ?? "";
      }
    });

    setForm(copy);
    setFieldErrors({});
    setEditingKey(getPk(entity, row));
    setMessage("");
  }

  function handleAdvancedFilterChange(fieldName, value) {
    setAdvancedFilter((prev) => {
      const next = { ...prev, [fieldName]: value };

      if (fieldName === "fieldName") {
        const selectedField = entity.fields.find((field) => field.name === value);
        const operators = getOperatorOptions(selectedField);
        next.operator = operators[0].value;
        next.value1 = "";
        next.value2 = "";
      }

      if (fieldName === "operator" && value !== "between") {
        next.value2 = "";
      }

      return next;
    });
    setCurrentPage(1);
  }

  function clearAdvancedFilters() {
    setFilterText("");
    setAdvancedFilter(initialAdvancedFilter());
    setCurrentPage(1);
  }

  function handleGlobalFilterChange(value) {
    setFilterText(value);
    setCurrentPage(1);
  }

  function handleSortFieldChange(value) {
    setSortField(value);
    setCurrentPage(1);
  }

  function handleSortDirectionChange(value) {
    setSortDirection(value);
    setCurrentPage(1);
  }

  const selectedFilterField = entity.fields.find((field) => field.name === advancedFilter.fieldName);
  const operatorOptions = getOperatorOptions(selectedFilterField);
  const showSecondValue = advancedFilter.operator === "between";

  function findDeleteBlocker(row) {
    const rules = DELETE_RULES[entity.collection] || [];
    if (!rules.length) {
      return "";
    }

    for (const rule of rules) {
      const sourceRows = db[rule.sourceCollection] || [];
      const hasReference = sourceRows.some(
        (sourceRow) => Number(sourceRow[rule.sourceField]) === Number(row.id)
      );
      if (hasReference) {
        return `Nao foi possivel excluir: existe referencia em ${rule.label}.`;
      }
    }

    return "";
  }

  async function handleDelete(row) {
    const blocker = findDeleteBlocker(row);
    if (blocker) {
      setMessage(blocker);
      return;
    }

    const targetPk = getPk(entity, row);
    try {
      await deleteRecord(entity.collection, targetPk);
      const state = await fetchState();
      setDb(state);

      if (editingKey === targetPk) {
        resetForm();
      }

      setMessage("Registro removido com sucesso.");
    } catch (error) {
      setMessage(error.message || "Falha ao excluir registro no SQLite.");
    }
  }

  return {
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
    filteredTotal: filteredAndSortedRows.length,
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
  };
}
