import { useState } from "react";
import { Header } from "./components/Header";
import { useNadoAccount } from "./hooks/useNadoAccount";
import { MarketOrderPanel } from "./components/terminal/MarketOrderPanel";
import { BatchOrderPanel } from "./components/terminal/BatchOrderPanel.tsx";

type OrderMode = "market" | "indexes";

function App() {
  const { loading, account, symbols } = useNadoAccount();

  const [activeProductId, setActiveProductId] = useState<number>(16);
  const [orderMode, setOrderMode] = useState<OrderMode>("market");

  const perpProducts = Object.values(symbols).filter(
    (sym) => sym.type === "perp",
  );

  return (
    <div className="min-h-screen bg-black text-white font-sans selection:bg-green-400 selection:text-black">
      <Header account={account} />

      <main className="max-w-7xl mx-auto p-4 mt-6">
        {/* GLOBAL TABS */}
        <div className="flex mb-6 border-2 border-white/20 bg-black w-fit">
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

        {/* MAIN TERMINAL GRID (items-stretch делает их одинаковой высоты) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          {/* LEFT SIDE: CHART WORKSPACE */}
          <section className="lg:col-span-8 border-2 border-white/20 bg-black flex flex-col h-full min-h-[520px]">
            <div className="flex items-center justify-between border-b-2 border-white/20 px-5 py-4 bg-black relative">
              <div className="flex-1">
                <p className="text-[10px] uppercase tracking-[0.3em] text-green-400 font-black mb-1">
                  Chart & Orderbook
                </p>

                {/* NATIVE MARKET SELECTOR STYLED AS HEADER */}
                <div className="relative w-fit inline-block">
                  <select
                    value={activeProductId}
                    onChange={(e) => setActiveProductId(Number(e.target.value))}
                    className="appearance-none bg-transparent text-2xl font-black tracking-tight text-white uppercase outline-none cursor-pointer pr-8 hover:text-green-400 transition-colors"
                  >
                    {perpProducts.map((prod) => (
                      <option
                        key={prod.product_id}
                        value={prod.product_id}
                        className="bg-black text-white font-sans text-lg"
                      >
                        {prod.symbol}
                      </option>
                    ))}
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center text-green-400">
                    <svg className="fill-current h-5 w-5" viewBox="0 0 20 20">
                      <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
                    </svg>
                  </div>
                </div>
              </div>

              <div className="text-right text-[10px] uppercase tracking-[0.2em] text-gray-500 font-bold shrink-0">
                <p>Product ID</p>
                <p className="mt-1 text-lg font-black text-green-400">
                  {activeProductId}
                </p>
              </div>
            </div>

            <div className="flex-1 flex items-center justify-center bg-[linear-gradient(90deg,rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[size:32px_32px] p-6">
              <div className="border-2 border-white/20 bg-black px-8 py-6 text-center shadow-2xl">
                <p className="text-sm uppercase tracking-[0.2em] text-white font-black">
                  TradingView Workspace
                </p>
                <p className="mt-2 text-[10px] font-bold uppercase tracking-[0.3em] text-green-400">
                  Awaiting integration
                </p>
              </div>
            </div>
          </section>

          {/* RIGHT SIDE: TERMINAL PANELS */}
          <aside className="lg:col-span-4 flex flex-col h-full">
            <div className="border-2 border-white/20 bg-black p-5 h-full">
              {!loading ? (
                orderMode === "market" ? (
                  <MarketOrderPanel productId={activeProductId} />
                ) : (
                  <BatchOrderPanel
                    symbols={symbols}
                    accountAvailable={account.availableMargin ?? 0}
                  />
                )
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
      </main>
    </div>
  );
}

export default App;
