import { keepOnlyDigits } from "./formatters";

export function isValidCpf(value) {
  const cpf = keepOnlyDigits(value);

  if (cpf.length !== 11) {
    return false;
  }

  if (/^(\d)\1+$/.test(cpf)) {
    return false;
  }

  let sum = 0;
  for (let i = 0; i < 9; i += 1) {
    sum += Number(cpf[i]) * (10 - i);
  }

  let firstCheck = (sum * 10) % 11;
  if (firstCheck === 10) {
    firstCheck = 0;
  }

  if (firstCheck !== Number(cpf[9])) {
    return false;
  }

  sum = 0;
  for (let i = 0; i < 10; i += 1) {
    sum += Number(cpf[i]) * (11 - i);
  }

  let secondCheck = (sum * 10) % 11;
  if (secondCheck === 10) {
    secondCheck = 0;
  }

  return secondCheck === Number(cpf[10]);
}

export function isValidDatetimeLocal(value) {
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(String(value || ""))) {
    return false;
  }

  const parsed = new Date(value);
  return !Number.isNaN(parsed.getTime());
}
