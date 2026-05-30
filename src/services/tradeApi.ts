export interface MarketOrderPayload {
  product_id: number;
  amount: number;
  is_buy: boolean;
  is_market: boolean;
}

export interface BatchOrderPayload {
  orders: BatchOrderItemPayload[];
  stop_on_failure: boolean;
}

export interface BatchOrderItemPayload {
  product_id: number;
  notional_usd: number;
  is_buy: boolean;
  is_market: boolean;
}

export interface ClosePositionPayload {
  product_id: number;
  sender_address: string;
  subaccount_name?: string;
}

const formatApiError = (errorData: any, fallback: string) => {
  const detail = errorData?.detail;
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail)) {
    return detail.map((item) => item?.msg || JSON.stringify(item)).join(", ");
  }
  if (detail && typeof detail === "object") return JSON.stringify(detail);
  return fallback;
};

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
    throw new Error(formatApiError(errorData, "Trade execution failed"));
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
    throw new Error(formatApiError(errorData, "Batch execution failed"));
  }

  return response.json();
};

export const closePosition = async (
  payload: ClosePositionPayload,
  accessToken: string,
) => {
  const response = await fetch("http://localhost:8000/api/v1/orders/close", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(
      formatApiError(errorData, "Close position execution failed"),
    );
  }

  return response.json();
};
