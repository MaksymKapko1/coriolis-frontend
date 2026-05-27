import { useEffect, useMemo, useRef, useState } from "react";
import { usePrivy } from "@privy-io/react-auth";
import { NADO_TEST_SUBSCRIBE_WSS } from "../config/constants";
import { toSubaccountBytes32 } from "../services/cryptoaddress.ts";
import {
  fetchNadoSymbolsMap,
  fetchInitialSnapshot,
  type NadoSymbol,
} from "../services/nadoApi";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface AccountState {
  balances: Record<number, number>;
  totalEquity: number;
  availableMargin: number;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const calcEquity = (data: any): number => {
  const prices: Record<number, number> = {};
  data.spot_products?.forEach((p: any) => {
    prices[p.product_id] = Number(BigInt(p.oracle_price_x18)) / 1e18;
  });

  return (
    data.spot_balances?.reduce((acc: number, item: any) => {
      const amount = Number(BigInt(item.balance.amount)) / 1e18;
      const price = prices[item.product_id] ?? 0;
      return acc + amount * price;
    }, 0) ?? 0
  );
};

const calcOraclePrices = (data: any): Record<number, number> => {
  const next: Record<number, number> = {};
  data.spot_products?.forEach((p: any) => {
    if (p?.product_id !== undefined && p?.oracle_price_x18) {
      next[p.product_id] = Number(BigInt(p.oracle_price_x18)) / 1e18;
    }
  });
  data.perp_products?.forEach((p: any) => {
    if (p?.product_id !== undefined && p?.oracle_price_x18) {
      next[p.product_id] = Number(BigInt(p.oracle_price_x18)) / 1e18;
    }
  });
  return next;
};

const calcUnrealizedPnl = (
  balances: Record<number, number>,
  entryPrices: Record<number, number>,
  oraclePrices: Record<number, number>,
  symbols: Record<number, NadoSymbol>,
): number => {
  let total = 0;
  for (const [productIdStr, amount] of Object.entries(balances)) {
    const productId = Number(productIdStr);
    const symbol = symbols[productId];
    if (symbol?.type !== "perp" || amount === 0) continue;

    const entryPrice = entryPrices[productId];
    const currentPrice = oraclePrices[productId];
    if (entryPrice !== undefined && currentPrice !== undefined) {
      total += amount * (currentPrice - entryPrice);
    }
  }
  return total;
};

// (logFormattedState removed; unused)

// ─── Hook ─────────────────────────────────────────────────────────────────────

export const useNadoAccount = () => {
  const { authenticated, user } = usePrivy();

  const [loading, setLoading] = useState(true);
  const [account, setAccount] = useState<AccountState>({
    balances: {},
    totalEquity: 0,
    availableMargin: 0,
  });

  const [entryPrices, setEntryPrices] = useState<Record<number, number>>({});
  const [marketPrices, setMarketPrices] = useState<Record<number, number>>({});
  const [oraclePrices, setOraclePrices] = useState<Record<number, number>>({});

  const socketRef = useRef<WebSocket | null>(null);
  const symbolsMapRef = useRef<Record<number, NadoSymbol>>({});
  const balancesRef = useRef(account.balances);
  const entryPricesRef = useRef(entryPrices);
  const marketPricesRef = useRef(marketPrices);
  const oraclePricesRef = useRef(oraclePrices);
  const subscribedBboRef = useRef<Set<number>>(new Set());

  balancesRef.current = account.balances;
  entryPricesRef.current = entryPrices;
  marketPricesRef.current = marketPrices;
  oraclePricesRef.current = oraclePrices;

  const unrealizedPnl = useMemo(
    () =>
      calcUnrealizedPnl(
        account.balances,
        entryPrices,
        oraclePrices,
        symbolsMapRef.current,
      ),
    [account.balances, entryPrices, oraclePrices],
  );

  useEffect(() => {
    console.log(
      ">>> [DEBUG] Хук запущен, Auth:",
      authenticated,
      "User:",
      !!user,
    );
    const walletAddress = user?.wallet?.address;
    if (!authenticated || !walletAddress) {
      console.log(">>> [DEBUG] Нет доступа к кошельку, хук спит");
      return;
    }

    console.log(">>> [DEBUG] Адрес найден:", walletAddress);

    let pingInterval: ReturnType<typeof setInterval> | undefined;
    let snapshotInterval: ReturnType<typeof setInterval> | undefined;

    const startOrchestrator = async () => {
      try {
        setLoading(true);
        const subaccountKey = toSubaccountBytes32(walletAddress);

        // Ensure we don't keep an old socket around if effect re-runs (e.g. fast refresh)
        if (socketRef.current) {
          try {
            socketRef.current.close();
          } catch {
            // ignore
          }
          socketRef.current = null;
        }

        if (Object.keys(symbolsMapRef.current).length === 0) {
          symbolsMapRef.current = await fetchNadoSymbolsMap();
        }

        console.log(">>> [DEBUG] Загружаю снапшот...");
        const snapshot = await fetchInitialSnapshot(subaccountKey);
        console.log(">>> [DEBUG] Снапшот получен:", snapshot);

        let initialBalances: Record<number, number> = {};
        let initialEntryPrices: Record<number, number> = {};

        if (snapshot.status === "success") {
          snapshot.data.spot_balances?.forEach((item: any) => {
            initialBalances[item.product_id] =
              Number(BigInt(item.balance.amount)) / 1e18;
          });
          snapshot.data.perp_balances?.forEach((item: any) => {
            initialBalances[item.product_id] =
              Number(BigInt(item.balance.amount)) / 1e18;
          });

          snapshot.data.perp_balances?.forEach((item: any) => {
            const amount = Number(BigInt(item.balance.amount)) / 1e18;
            const vQuote =
              Number(BigInt(item.balance.v_quote_balance ?? "0")) / 1e18;
            if (amount !== 0) {
              initialEntryPrices[item.product_id] = -vQuote / amount;
            }
          });

          balancesRef.current = initialBalances;
          entryPricesRef.current = initialEntryPrices;

          const initialOraclePrices = calcOraclePrices(snapshot.data);
          oraclePricesRef.current = initialOraclePrices;
          setOraclePrices(initialOraclePrices);

          const totalEquity = calcEquity(snapshot.data);
          const availableMargin =
            Number(BigInt(snapshot.data.healths[0].health)) / 1e18;

          setEntryPrices(initialEntryPrices);
          setAccount({
            balances: initialBalances,
            totalEquity,
            availableMargin,
          });
        }

        const hasOpenPerpPosition = (balances: Record<number, number>) =>
          Object.entries(balances).some(([productIdStr, amount]) => {
            if (amount === 0) return false;
            const productId = Number(productIdStr);
            return symbolsMapRef.current[productId]?.type === "perp";
          });

        // Poll subaccount_info (weight=2) only when an open perp exists.
        const updateFromSnapshot = async () => {
          const snap = await fetchInitialSnapshot(subaccountKey);
          if (snap.status !== "success") return;

          oraclePricesRef.current = calcOraclePrices(snap.data);
          setOraclePrices(oraclePricesRef.current);

          setAccount((prev) => ({
            ...prev,
            availableMargin: Number(BigInt(snap.data.healths[0].health)) / 1e18,
            totalEquity: calcEquity(snap.data),
          }));
        };

        const ensureSnapshotPolling = async () => {
          const shouldRun = hasOpenPerpPosition(balancesRef.current);
          if (!shouldRun) {
            if (snapshotInterval) {
              clearInterval(snapshotInterval);
              snapshotInterval = undefined;
            }
            return;
          }

          // If we just started (or missed) updates, fetch immediately.
          await updateFromSnapshot();
          if (!snapshotInterval) {
            snapshotInterval = setInterval(() => {
              updateFromSnapshot().catch(() => {});
            }, 5000);
          }
        };

        // Start polling only if we already have an open perp position.
        await ensureSnapshotPolling();

        const ws = new WebSocket(NADO_TEST_SUBSCRIBE_WSS);
        socketRef.current = ws;

        ws.onopen = () => {
          console.log(
            ">>> [WS] Успешное соединение с",
            NADO_TEST_SUBSCRIBE_WSS,
          );
          setLoading(false);

          ws.send(
            JSON.stringify({
              method: "subscribe",
              stream: {
                type: "position_change",
                subaccount: subaccountKey,
                product_id: null,
              },
              id: 123,
            }),
          );

          const activeProducts = Object.entries(initialBalances)
            .filter(([productIdStr, amount]) => {
              if (amount === 0) return false;
              const productId = Number(productIdStr);
              return symbolsMapRef.current[productId]?.type === "perp";
            })
            .map(([id, _]) => Number(id));

          activeProducts.forEach((pid) => {
            ws.send(
              JSON.stringify({
                method: "subscribe",
                stream: { type: "best_bid_offer", product_id: pid },
                id: pid + 200,
              }),
            );
            subscribedBboRef.current.add(pid);
            console.log(`>>> [WS] Подписались на цены для продукта ${pid}`);
          });

          pingInterval = setInterval(() => {
            if (ws.readyState === WebSocket.OPEN) {
              ws.send(JSON.stringify({ method: "ping", id: 0 }));
            }
          }, 30_000);
        };

        ws.onmessage = (event) => {
          const msg = JSON.parse(event.data);
          console.log(">>> [WS RECEIVED RAW]:", event.data);

          if (
            msg.type === "position_change" ||
            msg.channel === "position_change"
          ) {
            const productId = msg.product_id;
            const amount = msg.amount;
            const vQuote = msg.v_quote_amount;

            if (productId !== undefined && amount !== undefined) {
              if (!subscribedBboRef.current.has(productId)) {
                ws.send(
                  JSON.stringify({
                    method: "subscribe",
                    stream: { type: "best_bid_offer", product_id: productId },
                    id: productId + 200,
                  }),
                );
                subscribedBboRef.current.add(productId);
                console.log(
                  `>>> [WS] Авто-подписка на цены продукта ${productId}`,
                );
              }

              const humanAmount = Number(BigInt(amount)) / 1e18;
              const humanVQuote = vQuote ? Number(BigInt(vQuote)) / 1e18 : 0;
              const nextEntryPrices = { ...entryPricesRef.current };
              const nextBalances = { ...balancesRef.current };
              const nextMarketPrices = { ...marketPricesRef.current };

              if (humanAmount === 0) {
                // Position closed: drop it from state and unsubscribe from BBO
                delete nextBalances[productId];
                delete nextEntryPrices[productId];
                delete nextMarketPrices[productId];

                if (subscribedBboRef.current.has(productId)) {
                  ws.send(
                    JSON.stringify({
                      method: "unsubscribe",
                      stream: { type: "best_bid_offer", product_id: productId },
                      id: productId + 200,
                    }),
                  );
                  subscribedBboRef.current.delete(productId);
                  console.log(
                    `>>> [WS] Отписались от цен продукта ${productId} (позиция закрыта)`,
                  );
                }
              } else {
                nextBalances[productId] = humanAmount;
                nextEntryPrices[productId] = -humanVQuote / humanAmount;
              }

              entryPricesRef.current = nextEntryPrices;
              balancesRef.current = nextBalances;
              marketPricesRef.current = nextMarketPrices;

              setEntryPrices(nextEntryPrices);
              setAccount((prev) => ({
                ...prev,
                balances: nextBalances,
              }));
              setMarketPrices(nextMarketPrices);

              // Start/stop oracle polling based on whether any perp positions remain.
              ensureSnapshotPolling();
            }
          }

          if (msg.type === "best_bid_offer") {
            const productId = msg.product_id;
            if (productId !== undefined) {
              const bid = Number(BigInt(msg.bid_price ?? "0")) / 1e18;
              const ask = Number(BigInt(msg.ask_price ?? "0")) / 1e18;
              const mid = (bid + ask) / 2;
              const nextMarketPrices = {
                ...marketPricesRef.current,
                [productId]: mid,
              };

              marketPricesRef.current = nextMarketPrices;
              setMarketPrices(nextMarketPrices);

              const pnl = calcUnrealizedPnl(
                balancesRef.current,
                entryPricesRef.current,
                oraclePricesRef.current,
                symbolsMapRef.current,
              );
              console.log(
                `>>> [PNL DEBUG] Oracle ${productId}: ${(oraclePricesRef.current[productId] ?? 0).toFixed(8)} | Mid: ${mid.toFixed(8)} | PnL: ${pnl.toFixed(4)}`,
              );
            }
          }
        };

        ws.onerror = (err) => console.error(">>> [WS ERROR]", err);
      } catch (err) {
        console.error(">>> [ORCHESTRATOR ERROR]", err);
        setLoading(false);
      }
    };

    startOrchestrator();
    return () => {
      if (pingInterval) clearInterval(pingInterval);
      if (snapshotInterval) clearInterval(snapshotInterval);
      if (socketRef.current) socketRef.current.close();
    };
  }, [authenticated, user]);

  return {
    account,
    loading,
    symbols: symbolsMapRef.current,
    unrealizedPnl,
    marketPrices,
    entryPrices,
    oraclePrices,
  };
};
