import { useState } from "react";
import { Header } from "./components/Header";
import { useNadoAccount } from "./hooks/useNadoAccount";
import { MarketOrderPanel } from "./components/terminal/MarketOrderPanel";
import { ProductSelector } from "./components/terminal/ProductSelector";
import { BatchOrderPanel } from "./components/terminal/BatchOrderPanel.tsx";
import type { AccountState } from "../hooks/useNadoAccount";

function App() {
  const { loading, account, symbols } = useNadoAccount();

  const [activeProductId, setActiveProductId] = useState<number>(16);

  return (
    <div className="min-h-screen bg-black text-white">
      <Header account={account} />

      <main className="max-w-7xl mx-auto p-4 mt-10">
        <div className="border border-gray-800 bg-gray-950 p-4 rounded-xl text-center text-green-400 mb-6 font-mono">
          <h1 className="text-xl font-bold tracking-wider">
            TERMINAL INITIATED...
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            {loading
              ? "Parsing x18 engine data chunks..."
              : "Metrics mapped to symbols successfully. Core system ready."}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
          <div className="md:col-span-1 flex flex-col gap-4">
            {!loading ? (
              <>
                <ProductSelector
                  symbols={symbols}
                  selectedProductId={activeProductId}
                  onSelect={setActiveProductId}
                />

                <MarketOrderPanel productId={activeProductId} />
                <BatchOrderPanel
                  symbols={symbols}
                  accountAvailable={account.availableMargin ?? 0}
                />
              </>
            ) : (
              <div className="bg-gray-950 p-6 rounded-xl border border-gray-800 flex flex-col items-center justify-center min-h-[300px]">
                <div className="w-6 h-6 border-2 border-purple-500/30 border-t-purple-500 rounded-full animate-spin mb-2" />
                <p className="text-xs text-gray-500 font-mono">
                  Synchronizing subaccount...
                </p>
              </div>
            )}
          </div>

          <div className="md:col-span-2 flex flex-col gap-6">
            <div className="border border-dashed border-gray-800 rounded-xl p-8 flex flex-col items-center justify-center min-h-[450px] bg-gray-950/40">
              <p className="text-gray-600 font-mono text-sm">
                [ Chart & Orderbook Workspace Allocation ]
              </p>
              <p className="text-xs text-gray-700 font-mono mt-4">
                Active Product ID Focused:{" "}
                <span className="text-purple-400 font-bold">
                  {activeProductId}
                </span>
              </p>
              <p className="text-xs text-gray-500 font-mono mt-1">
                Asset Name: {symbols[activeProductId]?.symbol || "Unknown"}
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;
