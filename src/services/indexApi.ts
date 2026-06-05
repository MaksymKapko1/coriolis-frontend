const API_BASE_URL = "http://127.0.0.1:8000/api/v1";

export interface IndexAsset {
  product_id: number;
  symbol: string;
  weight: number;
  is_buy: boolean;
}

export interface TradingIndex {
  id: number;
  name: string;
  is_system: boolean;
  assets: IndexAsset[];
}

export const fetchMyIndexes = async (
  accessToken: string,
): Promise<TradingIndex[]> => {
  const response = await fetch(`${API_BASE_URL}/indexes/my`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!response.ok) throw new Error("Failed to fetch indexes");
  return response.json();
};

export const fetchDefaultIndexes = async (): Promise<TradingIndex[]> => {
  const response = await fetch(`${API_BASE_URL}/indexes/default`);
  if (!response.ok) throw new Error("Failed to fetch default indexes");
  return response.json();
};

export const createIndex = async (
  accessToken: string,
  name: string,
  assets: IndexAsset[],
): Promise<TradingIndex> => {
  const response = await fetch(`${API_BASE_URL}/indexes/create-index`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({ name, assets }),
  });
  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.detail || "Failed to create index");
  }
  return response.json();
};

export const deleteIndex = async (
  accessToken: string,
  indexId: number,
): Promise<void> => {
  const response = await fetch(`${API_BASE_URL}/indexes/my/${indexId}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!response.ok) throw new Error("Failed to delete index");
};

export const updateIndex = async (
  accessToken: string,
  indexId: number,
  name: string,
  assets: IndexAsset[],
): Promise<TradingIndex> => {
  const response = await fetch(`${API_BASE_URL}/indexes/my/${indexId}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({ name, assets }),
  });
  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.detail || "Failed to update index");
  }
  return response.json();
};
