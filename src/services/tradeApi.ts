export interface MarketOrderPayload {
  product_id: number;
  amount: number;
  is_buy: boolean;
  is_market: boolean;
}

export const placeMarketOrder = async (
  payload: MarketOrderPayload,
  accessToken: string,
) => {
  const response = await fetch("http://localhost:8000/orders/market", {
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
