import { useCallback, useEffect, useMemo, useState } from "react";
import { usePrivy } from "@privy-io/react-auth";
import { Header } from "./components/Header";
import { useNadoAccount } from "./hooks/useNadoAccount";
import { MarketOrderPanel } from "./components/terminal/MarketOrderPanel";
import { IndexesWorkspace } from "./components/terminal/indexes/IndexesWorkspace.tsx";
import { PositionsPanel } from "./components/terminal/PositionsPanel";
import { MarketDropdown } from "./components/ui/MarketDropdown.tsx";
import { TradingViewChart } from "./components/terminal/TradingViewChart.tsx";
import {
  closePosition,
  fetchPositionBrackets,
  type ProductBrackets,
} from "./services/tradeApi";

type OrderMode = "market" | "indexes";

function App() {
  const {
    loading,
    account,
    symbols,
    unrealizedPnl,
    oraclePrices,
    entryPrices,
  } = useNadoAccount();

  const { getAccessToken, user, authenticated } = usePrivy();

  const [brackets, setBrackets] = useState<ProductBrackets[]>([]);
  const [activeProductId, setActiveProductId] = useState<number>(16);
  const [orderMode, setOrderMode] = useState<OrderMode>("market");
  const [isClosingAll, setIsClosingAll] = useState(false);

  const [closingProductId, setClosingProductId] = useState<number | null>(null);

  const perpProducts = Object.values(symbols).filter(
    (sym) => sym.type === "perp",
  );

  useEffect(() => {
    if (perpProducts.length === 0) return;
    const exists = perpProducts.some((p) => p.product_id === activeProductId);
    if (!exists) setActiveProductId(perpProducts[0].product_id);
  }, [perpProducts, activeProductId]);

  const bracketsByProduct = useMemo(() => {
    const map: Record<number, ProductBrackets> = {};
    for (const b of brackets) {
      map[b.product_id] = b;
    }
    return map;
  }, [brackets]);

  const loadBrackets = useCallback(async () => {
    try {
      const token = await getAccessToken();
      if (!token) return;
      const data = await fetchPositionBrackets(token);
      setBrackets(data);
    } catch (err) {
      console.error("Failed to load position brackets:", err);
    }
  }, [getAccessToken]);

  useEffect(() => {
    if (!authenticated || loading) return;
    loadBrackets();
    const interval = setInterval(loadBrackets, 4000);
    return () => clearInterval(interval);
  }, [authenticated, loading, loadBrackets]);

  const handleClosePosition = async (productId: number) => {
    setClosingProductId(productId);
    try {
      const token = await getAccessToken();
      const walletAddress = user?.wallet?.address;

      if (!token || !walletAddress) {
        throw new Error("Authentication required. Please reconnect wallet.");
      }

      const payload = {
        product_id: productId,
        sender_address: walletAddress,
        subaccount_name: "default",
      };

      await closePosition(payload, token);

      console.log(`>>> [CLOSE SUCCESS] Позиция (ID: ${productId}) закрыта`);
    } catch (err: any) {
      console.error(">>> [CLOSE ERROR]", err);
      alert(err.message);
    } finally {
      setClosingProductId(null);
    }
  };

  const handleCloseAll = async () => {
    setIsClosingAll(true);
    try {
      console.log(">>> [CLOSE ALL] Инициировано закрытие всех позиций");
      // Твоя логика закрытия
      setTimeout(() => setIsClosingAll(false), 2000);
    } catch (err) {
      console.error("Failed to close all", err);
      setIsClosingAll(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white font-sans selection:bg-green-400 selection:text-black">
      <Header account={account} />

      <main className="max-w-7xl mx-auto p-4 mt-6 flex flex-col gap-6">
        {/* GLOBAL TABS */}
        <div className="flex border-2 border-white/20 bg-black w-fit">
          <button
            type="button"
            onClick={() => setOrderMode("market")}
            className={`px-6 py-3 text-sm font-black uppercase tracking-[0.2em] transition-colors ${
              orderMode === "market"
                ? "bg-green-400 text-black"
                : "bg-black text-gray-500 hover:text-white"
            }`}
          >
            Market Trading
          </button>
          <button
            type="button"
            onClick={() => setOrderMode("indexes")}
            className={`border-l-2 border-white/20 px-6 py-3 text-sm font-black uppercase tracking-[0.2em] transition-colors ${
              orderMode === "indexes"
                ? "bg-green-400 text-black"
                : "bg-black text-gray-500 hover:text-white"
            }`}
          >
            Indexes
          </button>
        </div>

        {!loading && orderMode === "indexes" ? (
          <IndexesWorkspace
            symbols={symbols}
            oraclePrices={oraclePrices}
            accountAvailable={account.availableMargin ?? 0}
          />
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
            <section className="lg:col-span-8 border-2 border-white/20 bg-black flex flex-col h-full min-h-[520px]">
              <div className="flex items-center justify-between border-b-2 border-white/20 px-5 py-4 bg-black">
                <div className="flex-1">
                  <p className="text-[10px] uppercase tracking-[0.3em] text-green-400 font-black mb-1">
                    Chart & Orderbook
                  </p>
                  <MarketDropdown
                    products={perpProducts}
                    value={activeProductId}
                    onChange={setActiveProductId}
                    size="lg"
                  />
                </div>
              </div>
              <div className="flex-1 min-h-0 p-2 bg-black">
                <TradingViewChart symbol={symbols[activeProductId]?.symbol} />
              </div>
            </section>

            <aside className="lg:col-span-4 flex flex-col h-full">
              <div className="border-2 border-white/20 bg-black p-5 h-full">
                {!loading ? (
                  <MarketOrderPanel
                    productId={activeProductId}
                    symbols={symbols}
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center h-full min-h-[300px]">
                    <div className="w-6 h-6 border-2 border-green-400/20 border-t-green-400 animate-spin mb-4" />
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500">
                      Syncing System...
                    </p>
                  </div>
                )}
              </div>
            </aside>
          </div>
        )}

        {loading && orderMode === "indexes" && (
          <div className="border-2 border-white/20 bg-black min-h-[560px] flex items-center justify-center">
            <div className="w-6 h-6 border-2 border-green-400/20 border-t-green-400 animate-spin" />
          </div>
        )}

        {!loading && (
          <PositionsPanel
            account={account}
            balances={account.balances}
            entryPrices={entryPrices}
            oraclePrices={oraclePrices}
            symbols={symbols}
            unrealizedPnl={unrealizedPnl}
            bracketsByProduct={bracketsByProduct}
            onCloseAll={handleCloseAll}
            isClosing={isClosingAll}
            onClosePosition={handleClosePosition}
            closingProductId={closingProductId}
          />
        )}
      </main>
    </div>
  );
}

export default App;
