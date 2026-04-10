const {
  FIRST_NAMES,
  INGREDIENT_CATALOG,
  LAST_NAMES,
  PRODUCT_FAMILIES,
  SIZE_PRESETS,
} = require("./catalogs");
const {
  createRng,
  pickOne,
  randomChance,
  randomFloat,
  randomInt,
  sampleWeightedUnique,
  shuffle,
  weightedPick,
} = require("./random");

const DEFAULT_REFERENCE_DATE = "2026-04-09T23:59:59";

function pad(value, size = 2) {
  return String(value).padStart(size, "0");
}

function formatCpfFromDigits(digits) {
  return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9, 11)}`;
}

function buildFakeCpf(index) {
  const digits = String(10000000000 + index).slice(-11);
  return formatCpfFromDigits(digits);
}

function formatDatetimeLocal(date) {
  return [
    date.getFullYear(),
    "-",
    pad(date.getMonth() + 1),
    "-",
    pad(date.getDate()),
    "T",
    pad(date.getHours()),
    ":",
    pad(date.getMinutes()),
  ].join("");
}

function capitalizeWords(text) {
  return text
    .split(" ")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function resolveSizePreset(size) {
  const preset = SIZE_PRESETS[size];
  if (!preset) {
    throw new Error(`Tamanho invalido: "${size}". Use small, medium ou large.`);
  }
  return preset;
}

function buildIngredientRows(rng, count, startId) {
  if (count > INGREDIENT_CATALOG.length) {
    throw new Error(`Nao ha ingredientes suficientes para gerar ${count} registros.`);
  }

  return INGREDIENT_CATALOG.slice(0, count).map((ingredient, index) => ({
    id: startId + index,
    nome: ingredient.name,
    unidade: ingredient.unit,
    quantidade_estoque: randomFloat(rng, ingredient.stock[0], ingredient.stock[1], ingredient.unit === "un" ? 0 : 2),
  }));
}

function buildRecipeForVariant(family, variant) {
  const recipeMultiplier = variant.recipeMultiplier || 1;
  const extraRecipe = variant.extraRecipe || [];
  const omitIngredients = new Set(variant.omitIngredients || []);

  return [...family.recipe, ...extraRecipe]
    .filter(([ingredientName]) => !omitIngredients.has(ingredientName))
    .map(([ingredientName, quantity]) => ({
      ingredientName,
      quantity: Number((quantity * recipeMultiplier).toFixed(3)),
    }));
}

function expandProductCandidates(availableIngredientNames) {
  const candidates = [];

  for (const family of PRODUCT_FAMILIES) {
    for (const variant of family.variants) {
      const recipe = buildRecipeForVariant(family, variant);
      const isAvailable = recipe.every((item) => availableIngredientNames.has(item.ingredientName));

      if (!isAvailable) {
        continue;
      }

      const suffix = variant.suffix ? ` ${variant.suffix}` : "";
      candidates.push({
        name: capitalizeWords(`${family.name}${suffix}`.trim()),
        categoria: family.category,
        basePrice: family.basePrice,
        priceMultiplier: variant.multiplier || 1,
        popularity: family.popularity * (variant.popularity || 1),
        quantityRange: family.quantityRange,
        recipe,
      });
    }
  }

  return candidates;
}

function buildProductRows(rng, count, startId, ingredientRows) {
  const ingredientNames = new Set(ingredientRows.map((ingredient) => ingredient.nome));
  const candidates = expandProductCandidates(ingredientNames);

  if (count > candidates.length) {
    throw new Error(
      `Nao ha combinacoes de produtos suficientes para gerar ${count} produtos com ${ingredientRows.length} ingredientes.`
    );
  }

  const selected = sampleWeightedUnique(rng, candidates, count, (candidate) => candidate.popularity);

  return selected.map((candidate, index) => {
    const jitter = randomFloat(rng, 0.94, 1.08, 4);
    return {
      id: startId + index,
      nome: candidate.name,
      valor: Number((candidate.basePrice * candidate.priceMultiplier * jitter).toFixed(2)),
      categoria: candidate.categoria,
      popularity: Number((candidate.popularity * randomFloat(rng, 0.92, 1.08, 4)).toFixed(4)),
      quantityRange: candidate.quantityRange,
      recipe: candidate.recipe,
    };
  });
}

function buildProdutosIngredientes(productRows, ingredientRows) {
  const ingredientIdByName = new Map(ingredientRows.map((ingredient) => [ingredient.nome, ingredient.id]));
  const rows = [];

  for (const product of productRows) {
    for (const item of product.recipe) {
      rows.push({
        id_produto: product.id,
        id_ingrediente: ingredientIdByName.get(item.ingredientName),
        quantidade: item.quantity,
      });
    }
  }

  return rows;
}

function buildUniqueNames(rng, count) {
  const names = new Set();

  while (names.size < count) {
    const first = pickOne(rng, FIRST_NAMES);
    const last1 = pickOne(rng, LAST_NAMES);
    const last2 = pickOne(rng, LAST_NAMES);
    const parts = last1 === last2 ? [first, last1] : [first, last1, last2];
    names.add(parts.join(" "));
  }

  return Array.from(names);
}

function buildClientes(rng, count, startId) {
  const names = buildUniqueNames(rng, count);
  return names.map((name, index) => ({
    id: startId + index,
    nome: name,
    cpf: buildFakeCpf(startId + index),
    weight: Number(randomFloat(rng, 0.8, 3.2, 4).toFixed(4)),
  }));
}

function buildFuncionarios(rng, count, startId) {
  const names = buildUniqueNames(rng, count);
  return names.map((name, index) => ({
    id: startId + index,
    nome: name,
    weight: Number(randomFloat(rng, 0.9, 1.4, 4).toFixed(4)),
  }));
}

function buildOrderDate(rng, referenceDate, days) {
  const buckets = [
    { startHour: 6, endHour: 10, weight: 0.38 },
    { startHour: 11, endHour: 14, weight: 0.22 },
    { startHour: 15, endHour: 18, weight: 0.24 },
    { startHour: 18, endHour: 20, weight: 0.16 },
  ];
  const bucket = weightedPick(rng, buckets, (item) => item.weight);
  const dayOffset = randomInt(rng, 0, Math.max(days - 1, 0));
  const hour = randomInt(rng, bucket.startHour, bucket.endHour);
  const minute = randomInt(rng, 0, 11) * 5;

  const date = new Date(referenceDate.getTime());
  date.setDate(date.getDate() - dayOffset);
  date.setHours(hour, minute, 0, 0);
  return formatDatetimeLocal(date);
}

function chooseItemCount(rng) {
  return weightedPick(
    rng,
    [
      { value: 1, weight: 28 },
      { value: 2, weight: 31 },
      { value: 3, weight: 21 },
      { value: 4, weight: 12 },
      { value: 5, weight: 6 },
      { value: 6, weight: 2 },
    ],
    (item) => item.weight
  ).value;
}

function chooseQuantityForProduct(rng, product) {
  const [minQuantity, maxQuantity] = product.quantityRange;
  const quantity = weightedPick(
    rng,
    Array.from({ length: maxQuantity - minQuantity + 1 }, (_, index) => {
      const value = minQuantity + index;
      return { value, weight: 1 / (index + 1) };
    }),
    (item) => item.weight
  ).value;

  return quantity;
}

function buildPedidos(rng, config) {
  const {
    clientes,
    funcionarios,
    includeValorUnitario,
    pedidosCount,
    products,
    referenceDate,
    days,
    startPedidoId,
  } = config;

  const pedidos = [];
  const itensPedido = [];
  const productPool = products.map((product) => ({
    ...product,
    weight: product.popularity,
  }));

  for (let index = 0; index < pedidosCount; index += 1) {
    const pedidoId = startPedidoId + index;
    const client = weightedPick(rng, clientes, (item) => item.weight);
    const funcionario = weightedPick(rng, funcionarios, (item) => item.weight);
    const itemCount = Math.min(chooseItemCount(rng), productPool.length);
    const selectedProducts = sampleWeightedUnique(rng, productPool, itemCount, (item) => item.weight);

    let total = 0;

    for (const product of selectedProducts) {
      const quantidade = chooseQuantityForProduct(rng, product);
      const subtotal = quantidade * product.valor;
      total += subtotal;

      const itemRow = {
        id_pedido: pedidoId,
        id_produto: product.id,
        quantidade,
      };

      if (includeValorUnitario) {
        itemRow.valor_unitario = product.valor;
      }

      itensPedido.push(itemRow);
    }

    pedidos.push({
      id: pedidoId,
      data: buildOrderDate(rng, referenceDate, days),
      total: Number(total.toFixed(2)),
      id_cliente: client.id,
      id_funcionario: funcionario.id,
    });
  }

  return { pedidos, itensPedido };
}

function stripRuntimeFields(rows, keysToRemove) {
  return rows.map((row) => {
    const copy = { ...row };
    for (const key of keysToRemove) {
      delete copy[key];
    }
    return copy;
  });
}

function generateMockDataset(options = {}) {
  const {
    size = "medium",
    seed = 42,
    days = 90,
    offsets = {},
    includeValorUnitario = true,
    referenceDate = DEFAULT_REFERENCE_DATE,
  } = options;

  const preset = resolveSizePreset(size);
  const rng = createRng(seed);
  const baseDate = new Date(referenceDate);

  if (Number.isNaN(baseDate.getTime())) {
    throw new Error(`Data de referencia invalida: "${referenceDate}".`);
  }

  const clientes = buildClientes(rng, preset.clientes, offsets.clientes || 1);
  const funcionarios = buildFuncionarios(rng, preset.funcionarios, offsets.funcionarios || 1);
  const ingredientes = buildIngredientRows(rng, preset.ingredientes, offsets.ingredientes || 1);
  const productsWithRuntimeFields = buildProductRows(
    rng,
    preset.produtos,
    offsets.produtos || 1,
    ingredientes
  );
  const produtosIngredientes = buildProdutosIngredientes(productsWithRuntimeFields, ingredientes);
  const { pedidos, itensPedido } = buildPedidos(rng, {
    clientes,
    funcionarios,
    includeValorUnitario,
    pedidosCount: preset.pedidos,
    products: productsWithRuntimeFields,
    referenceDate: baseDate,
    days: Number(days),
    startPedidoId: offsets.pedidos || 1,
  });

  return {
    metadata: {
      size,
      seed: String(seed),
      days: Number(days),
      referenceDate: formatDatetimeLocal(baseDate),
      counts: {
        clientes: clientes.length,
        funcionarios: funcionarios.length,
        ingredientes: ingredientes.length,
        produtos: productsWithRuntimeFields.length,
        produtosIngredientes: produtosIngredientes.length,
        pedidos: pedidos.length,
        itensPedido: itensPedido.length,
      },
    },
    rows: {
      clientes: stripRuntimeFields(clientes, ["weight"]),
      funcionarios: stripRuntimeFields(funcionarios, ["weight"]),
      ingredientes,
      produtos: stripRuntimeFields(productsWithRuntimeFields, ["popularity", "quantityRange", "recipe"]),
      produtosIngredientes,
      pedidos,
      itensPedido,
    },
  };
}

module.exports = {
  DEFAULT_REFERENCE_DATE,
  generateMockDataset,
};
