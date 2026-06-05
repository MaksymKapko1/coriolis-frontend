import { API_BASE_URL } from "../config/api.ts";

// ---------------------------------------------------------------------------
// PAYLOAD INTERFACES
// ---------------------------------------------------------------------------

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

export interface LimitOrderPayload {
  product_id: number;
  symbol?: string;
  price_usd: number;
  notional_usd: number;
  is_buy: boolean;
  user_id?: string;
  take_profit_price?: number | null;
  stop_loss_price?: number | null;
}

export interface CancelLimitOrderPayload {
  product_ids: number[];
  digests: string[];
}

export interface LimitOrderResponse {
  id: number;
  product_id: number;
  symbol: string;
  digest: string;
  price_usd: number;
  notional_usd: number;
  is_buy: boolean;
  status: string;
  created_at: string;
  take_profit_price?: number | null;
  stop_loss_price?: number | null;
  tp_digest?: string | null;
  sl_digest?: string | null;
}

export interface ProductBrackets {
  product_id: number;
  take_profit_price?: number | null;
  stop_loss_price?: number | null;
  tp_digest?: string | null;
  sl_digest?: string | null;
  order_status?: string | null;
  limit_price_usd?: number | null;
}

// ---------------------------------------------------------------------------
// ERROR FORMATTER
// ---------------------------------------------------------------------------

const formatApiError = (errorData: any, fallback: string) => {
  const detail = errorData?.detail;
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail)) {
    return detail.map((item) => item?.msg || JSON.stringify(item)).join(", ");
  }
  if (detail && typeof detail === "object") return JSON.stringify(detail);
  return fallback;
};

// ---------------------------------------------------------------------------
// API METHODS
// ---------------------------------------------------------------------------

export const placeMarketOrder = async (
  payload: MarketOrderPayload,
  accessToken: string,
) => {
  const response = await fetch(`${API_BASE_URL}/orders/market`, {
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
  const response = await fetch(`${API_BASE_URL}/orders/batch`, {
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
  const response = await fetch(`${API_BASE_URL}/orders/close`, {
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

export const placeLimitOrder = async (
  payload: LimitOrderPayload,
  accessToken: string,
) => {
  const response = await fetch(`${API_BASE_URL}/orders/limit-open`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(formatApiError(errorData, "Limit order execution failed"));
  }

  return response.json();
};

export const fetchOpenOrders = async (
  accessToken: string,
): Promise<LimitOrderResponse[]> => {
  const response = await fetch(`${API_BASE_URL}/orders/limit-orders`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(formatApiError(errorData, "Failed to fetch open orders"));
  }

  return response.json();
};

export const fetchPositionBrackets = async (
  accessToken: string,
): Promise<ProductBrackets[]> => {
  const response = await fetch(`${API_BASE_URL}/orders/position-brackets`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(
      formatApiError(errorData, "Failed to fetch position brackets"),
    );
  }

  return response.json();
};

export const cancelLimitOrders = async (
  payload: CancelLimitOrderPayload,
  accessToken: string,
) => {
  const response = await fetch(`${API_BASE_URL}/orders/cancel-limit`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(formatApiError(errorData, "Failed to cancel limit order"));
  }

  return response.json();
};
