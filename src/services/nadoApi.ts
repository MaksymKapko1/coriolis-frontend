import { NADO_TEST_GATEWAY_URL } from "../config/constants.ts";

export interface NadoSymbol {
  type: "spot" | "perp";
  product_id: number;
  symbol: string;
}

export interface BalanceDetails {
  amount: string;
  v_quote_balance?: string;
}

export interface NadoBalanceItem {
  product_id: number;
  balance: BalanceDetails;
}

export interface SubaccountInfoResponse {
  status: string;
  data: {
    subaccount: string;
    spot_balances: NadoBalanceItem[];
    perp_balances: NadoBalanceItem[];
  };
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

export const fetchSubaccountRawInfo = async (
  subaccountBytes32: string,
): Promise<SubaccountInfoResponse> => {
  const response = await fetch(
    `${NADO_TEST_GATEWAY_URL}/query?type=subaccount_info&subaccount=${subaccountBytes32}`,
  );
  if (!response.ok) throw new Error("Failed to fetch subaccount info");
  return response.json();
};
