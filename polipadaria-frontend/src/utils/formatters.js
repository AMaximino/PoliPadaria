export function keepOnlyDigits(value) {
  return String(value || "").replace(/\D/g, "");
}

export function maskCpf(value) {
  const digits = keepOnlyDigits(value).slice(0, 11);

  if (digits.length <= 3) {
    return digits;
  }
  if (digits.length <= 6) {
    return `${digits.slice(0, 3)}.${digits.slice(3)}`;
  }
  if (digits.length <= 9) {
    return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`;
  }

  return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`;
}

export function toCurrencyInput(value) {
  if (value === "" || value === null || value === undefined) {
    return "";
  }

  const numeric = Number(value);
  if (Number.isNaN(numeric)) {
    return "";
  }

  return numeric.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

export function normalizeCurrencyInput(value) {
  const digits = keepOnlyDigits(value);
  if (!digits) {
    return "";
  }

  const amount = Number(digits) / 100;
  return toCurrencyInput(amount);
}

export function currencyInputToNumber(value) {
  const digits = keepOnlyDigits(value);
  if (!digits) {
    return null;
  }
  return Number(digits) / 100;
}

export function formatDatetimeDisplay(value) {
  if (!value) {
    return "";
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  return parsed.toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
