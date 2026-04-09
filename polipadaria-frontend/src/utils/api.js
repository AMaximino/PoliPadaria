const API_BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:4000/api";

async function request(path, options = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
    ...options,
  });

  const contentType = response.headers.get("content-type") || "";
  const payload = contentType.includes("application/json") ? await response.json() : null;

  if (!response.ok) {
    throw new Error(payload?.error || "Falha ao comunicar com o servidor SQLite.");
  }

  return payload;
}

export function fetchState() {
  return request("/state");
}

export function createRecord(collection, body) {
  return request(`/${collection}`, {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export function updateRecord(collection, key, body) {
  return request(`/${collection}/${encodeURIComponent(key)}`, {
    method: "PUT",
    body: JSON.stringify(body),
  });
}

export function deleteRecord(collection, key) {
  return request(`/${collection}/${encodeURIComponent(key)}`, {
    method: "DELETE",
  });
}

export function executeSqlQuery(query) {
  return request("/sql", {
    method: "POST",
    body: JSON.stringify({ query }),
  });
}
