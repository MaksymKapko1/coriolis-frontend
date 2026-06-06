import { NADO_MAIN_GATEWAY_URL } from "../config/constants.ts";

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
  const response = await fetch(`${NADO_MAIN_GATEWAY_URL}/symbols`);
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
    `${NADO_MAIN_GATEWAY_URL}/query?type=subaccount_info&subaccount=${subaccountBytes32}`,
  );
  if (!response.ok) throw new Error("Failed to fetch initial subaccount info");
  return response.json();
};

export const fetchAllProducts = async () => {
  const response = await fetch(`${NADO_MAIN_GATEWAY_URL}/query?type=all_products`);
  if (!response.ok) throw new Error("Failed to fetch all products");
  return response.json();
};

export interface NadoPerpProductRisk {
  product_id: number;
  risk: {
    long_weight_initial_x18: string;
    short_weight_initial_x18: string;
    long_weight_maintenance_x18: string;
    short_weight_maintenance_x18: string;
  };
}

/** Per-product max leverage weights from Nado all_products. */
export const fetchPerpProductRiskMap = async () => {
  const payload = await fetchAllProducts();
  if (payload.status !== "success") {
    throw new Error("Failed to fetch perp risk params");
  }

  const perps: NadoPerpProductRisk[] = payload.data?.perp_products ?? [];
  return perps.reduce(
    (acc, product) => {
      acc[product.product_id] = {
        product_id: product.product_id,
        long_weight_initial_x18: product.risk.long_weight_initial_x18,
        short_weight_initial_x18: product.risk.short_weight_initial_x18,
        long_weight_maintenance_x18: product.risk.long_weight_maintenance_x18,
        short_weight_maintenance_x18: product.risk.short_weight_maintenance_x18,
      };
      return acc;
    },
    {} as Record<
      number,
      {
        product_id: number;
        long_weight_initial_x18: string;
        short_weight_initial_x18: string;
        long_weight_maintenance_x18: string;
        short_weight_maintenance_x18: string;
      }
    >,
  );
};
