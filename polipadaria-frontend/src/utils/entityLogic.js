import { formatDatetimeDisplay, maskCpf, toCurrencyInput } from "./formatters";

export function readDb(storageKey, baseDb) {
  const raw = window.localStorage.getItem(storageKey);

  if (!raw) {
    return baseDb;
  }

  try {
    const parsed = JSON.parse(raw);
    return { ...baseDb, ...parsed };
  } catch {
    return baseDb;
  }
}

export function getPk(meta, row) {
  return meta.pk.map((field) => String(row[field])).join("::");
}

export function buildEmptyForm(entity) {
  const next = {};
  entity.fields.forEach((field) => {
    next[field.name] = "";
  });
  return next;
}

export function nextId(collectionRows) {
  if (!collectionRows.length) {
    return 1;
  }

  const ids = collectionRows.map((item) => Number(item.id) || 0);
  return Math.max(...ids) + 1;
}

export function getFieldKind(field) {
  if (!field) {
    return "text";
  }

  if (field.mask === "currency" || field.type === "number" || field.type === "fk") {
    return "number";
  }

  if (field.type === "datetime-local") {
    return "datetime";
  }

  return "text";
}

export function getOperatorOptions(field) {
  const kind = getFieldKind(field);
  if (kind === "text") {
    return [
      { value: "contains", label: "Contem" },
      { value: "equals", label: "Igual" },
    ];
  }

  return [
    { value: "equals", label: "Igual" },
    { value: "gte", label: "Maior ou igual" },
    { value: "lte", label: "Menor ou igual" },
    { value: "between", label: "Faixa" },
  ];
}

export function parseFilterValue(field, value) {
  const kind = getFieldKind(field);
  if (kind === "text") {
    return String(value || "").trim().toLowerCase();
  }

  if (kind === "datetime") {
    const parsed = new Date(value).getTime();
    return Number.isNaN(parsed) ? null : parsed;
  }

  const normalized = String(value || "").trim().replace(",", ".");
  if (normalized === "") {
    return null;
  }
  const parsed = Number(normalized);
  return Number.isNaN(parsed) ? null : parsed;
}

export function formatCellValue(field, value) {
  if (value === undefined || value === null || value === "") {
    return "";
  }

  if (field.mask === "currency" || field.display === "currency") {
    return toCurrencyInput(value);
  }

  if (field.type === "datetime-local") {
    return formatDatetimeDisplay(value);
  }

  if (field.mask === "cpf") {
    return maskCpf(value);
  }

  return String(value);
}

export function fieldToComparable(field, value) {
  if (field.mask === "currency") {
    return Number(value) || 0;
  }

  if (field.type === "number" || field.type === "fk") {
    return Number(value) || 0;
  }

  if (field.type === "datetime-local") {
    return new Date(value).getTime() || 0;
  }

  return String(value || "").toLowerCase();
}
