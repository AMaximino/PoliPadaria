const { BadRequestError, ValidationError } = require("./errors");

function ensurePlainObject(payload, message = "O payload deve ser um objeto JSON.") {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    throw new ValidationError(message);
  }
}

function normalizeText(value, fieldName, fieldMeta) {
  if (typeof value !== "string") {
    throw new ValidationError(`O campo "${fieldName}" deve ser texto.`);
  }

  const normalized = value.trim();
  if (fieldMeta.allowEmpty === false && normalized.length === 0) {
    throw new ValidationError(`O campo "${fieldName}" nao pode ser vazio.`);
  }

  return normalized;
}

function normalizeNumber(value, fieldName, fieldMeta, integerOnly) {
  if (value === "") {
    throw new ValidationError(`O campo "${fieldName}" nao pode ser vazio.`);
  }

  const normalized = typeof value === "number" ? value : Number(String(value).trim().replace(",", "."));
  if (!Number.isFinite(normalized)) {
    throw new ValidationError(`O campo "${fieldName}" deve ser numerico.`);
  }

  if (integerOnly && !Number.isInteger(normalized)) {
    throw new ValidationError(`O campo "${fieldName}" deve ser um inteiro.`);
  }

  if (fieldMeta.min !== undefined && normalized < fieldMeta.min) {
    throw new ValidationError(`O campo "${fieldName}" deve ser maior ou igual a ${fieldMeta.min}.`);
  }

  return normalized;
}

function normalizeDatetime(value, fieldName) {
  if (typeof value !== "string") {
    throw new ValidationError(`O campo "${fieldName}" deve ser texto no formato de data.`);
  }

  const normalized = value.trim();
  if (!normalized) {
    throw new ValidationError(`O campo "${fieldName}" nao pode ser vazio.`);
  }

  if (Number.isNaN(Date.parse(normalized))) {
    throw new ValidationError(`O campo "${fieldName}" deve conter uma data valida.`);
  }

  return normalized;
}

function normalizeFieldValue(fieldName, fieldMeta, value) {
  if (value === undefined || value === null) {
    if (fieldMeta.required) {
      throw new ValidationError(`O campo "${fieldName}" e obrigatorio.`);
    }
    return value;
  }

  let normalized;

  if (fieldMeta.type === "text") {
    normalized = normalizeText(value, fieldName, fieldMeta);
  } else if (fieldMeta.type === "integer") {
    normalized = normalizeNumber(value, fieldName, fieldMeta, true);
  } else if (fieldMeta.type === "real") {
    normalized = normalizeNumber(value, fieldName, fieldMeta, false);
  } else if (fieldMeta.type === "datetime") {
    normalized = normalizeDatetime(value, fieldName);
  } else {
    normalized = value;
  }

  if (fieldMeta.enum && !fieldMeta.enum.includes(normalized)) {
    throw new ValidationError(
      `O campo "${fieldName}" deve ser um dos valores: ${fieldMeta.enum.join(", ")}.`
    );
  }

  return normalized;
}

function validatePayload(definition, body, mode) {
  ensurePlainObject(body);

  const allowedColumns =
    mode === "create" ? definition.insertColumns : definition.updateColumns;
  const payloadKeys = Object.keys(body);
  const unknownFields = payloadKeys.filter((fieldName) => !allowedColumns.includes(fieldName));

  if (unknownFields.length > 0) {
    throw new ValidationError(`Campos desconhecidos ou nao permitidos: ${unknownFields.join(", ")}.`);
  }

  if (mode === "patch" && payloadKeys.length === 0) {
    throw new ValidationError("Informe ao menos um campo para atualizar.");
  }

  const requiredColumns =
    mode === "patch"
      ? []
      : allowedColumns.filter((fieldName) => definition.fields[fieldName]?.required);

  for (const fieldName of requiredColumns) {
    if (body[fieldName] === undefined || body[fieldName] === null) {
      throw new ValidationError(`O campo "${fieldName}" e obrigatorio.`);
    }
  }

  const normalized = {};
  const targetColumns = mode === "patch" ? payloadKeys : allowedColumns;

  for (const fieldName of targetColumns) {
    const fieldMeta = definition.fields[fieldName];
    normalized[fieldName] = normalizeFieldValue(fieldName, fieldMeta, body[fieldName]);
  }

  return normalized;
}

function parsePrimaryKey(definition, rawKey) {
  const rawParts = String(rawKey).split("::");
  if (rawParts.length !== definition.pk.length) {
    throw new BadRequestError("Chave primaria invalida.");
  }

  return definition.pk.map((fieldName, index) =>
    normalizeFieldValue(fieldName, definition.fields[fieldName], rawParts[index])
  );
}

module.exports = {
  ensurePlainObject,
  normalizeFieldValue,
  parsePrimaryKey,
  validatePayload,
};
