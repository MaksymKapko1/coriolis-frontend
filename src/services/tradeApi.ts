export interface MarketOrderPayload {
  product_id: number;
  amount: number;
  is_buy: boolean;
  is_market: boolean;
}

export interface BatchOrderPayload {
  orders: MarketOrderPayload[];
  stop_on_failure: boolean;
}

export const placeMarketOrder = async (
  payload: MarketOrderPayload,
  accessToken: string,
) => {
  const response = await fetch("http://localhost:8000/api/v1/orders/market", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.detail || "Trade execution failed");
  }

  return response.json();
};

export const placeBatchOrder = async (
  payload: BatchOrderPayload,
  accessToken: string,
) => {
  const response = await fetch("http://localhost:8000/api/v1/orders/batch", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.detail || "Batch execution failed");
  }

  return response.json();
};
