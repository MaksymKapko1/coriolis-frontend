import { NADO_TEST_GATEWAY_URL } from "../config/constants.ts";

export interface NadoSymbol {
  type: "spot" | "perp";
  product_id: number;
  symbol: string;
}

export interface NadoProduct {
  product_id: number;
  oracle_price_x18: string;
}

export const fetchNadoSymbolsMap = async (): Promise<
  Record<number, NadoSymbol>
> => {
  const response = await fetch(`${NADO_TEST_GATEWAY_URL}/symbols`);
  if (!response.ok) throw new Error("Failed to fetch Nado symbols");

  const data: NadoSymbol[] = await response.json();

  return data.reduce(
    (acc, curr) => {
      acc[curr.product_id] = curr;
      return acc;
    },
    {} as Record<number, NadoSymbol>,
  );
};

export const fetchInitialSnapshot = async (subaccountBytes32: string) => {
  const response = await fetch(
    `${NADO_TEST_GATEWAY_URL}/query?type=subaccount_info&subaccount=${subaccountBytes32}`,
  );
  if (!response.ok) throw new Error("Failed to fetch initial subaccount info");
  return response.json();
};

export const fetchAllProducts = async () => {
  const response = await fetch(`${NADO_TEST_GATEWAY_URL}/query?type=all_products`);
  if (!response.ok) throw new Error("Failed to fetch all products");
  return response.json();
};
