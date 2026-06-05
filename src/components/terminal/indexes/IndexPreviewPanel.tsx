import type { BasketItem } from "./types.ts";

const formatUsd = (n: number) =>
  n.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

const shortSymbol = (symbol: string) =>
  symbol.replace(/-PERP$/i, "").toUpperCase();

interface IndexPreviewPanelProps {
  indexName: string;
  assetCount: number;
  basket: BasketItem[];
  totalAllocated: number;
  allocationBudget: number;
  oraclePrices: Record<number, number>;
}

export const IndexPreviewPanel = ({
  indexName,
  assetCount,
  basket,
  totalAllocated,
  allocationBudget,
  oraclePrices,
}: IndexPreviewPanelProps) => (
  <div className="flex flex-col h-full min-h-0">
    <div className="px-4 py-3 border-b-2 border-white/20 bg-black">
      <p className="text-[9px] font-black uppercase tracking-[0.3em] text-green-400 mb-1">
        Preview
      </p>
      <h2 className="text-xl font-black uppercase tracking-tight text-white">
        {indexName}
      </h2>
      <p className="text-[9px] font-black uppercase tracking-widest text-gray-500 mt-1">
        {assetCount} asset{assetCount !== 1 ? "s" : ""} · budget $
        {formatUsd(allocationBudget)}
      </p>
    </div>

    <div className="flex-1 overflow-y-auto custom-scrollbar">
      {basket.length === 0 ? (
        <div className="flex items-center justify-center h-32 px-4">
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-600 text-center">
            Load an index to preview composition
          </p>
        </div>
      ) : (
        <table className="w-full text-left text-[10px] font-black uppercase tracking-widest">
          <thead className="sticky top-0 bg-black border-b border-white/10 text-gray-500">
            <tr>
              <th className="px-3 py-2">Market</th>
              <th className="px-2 py-2">Side</th>
              <th className="px-2 py-2 text-right">Oracle</th>
              <th className="px-3 py-2 text-right">Alloc</th>
            </tr>
          </thead>
          <tbody>
            {basket.map((item) => {
              const amt = parseFloat(item.amount) || 0;
              const weight =
                totalAllocated > 0 ? (amt / totalAllocated) * 100 : 0;
              const oracle = oraclePrices[item.product_id];

              return (
                <tr
                  key={item.product_id}
                  className="border-b border-white/5"
                >
                  <td className="px-3 py-2.5">
                    <span className="text-white">
                      {shortSymbol(item.symbol)}
                    </span>
                    <span className="block text-[8px] text-gray-600 mt-0.5">
                      {weight.toFixed(1)}% wt
                    </span>
                  </td>
                  <td className="px-2 py-2.5">
                    <span
                      className={`inline-block px-1.5 py-0.5 text-[8px] font-black uppercase tracking-wider border ${
                        item.is_buy
                          ? "border-green-400/60 text-green-400 bg-green-400/15"
                          : "border-red-500/60 text-red-400 bg-red-500/15"
                      }`}
                    >
                      {item.is_buy ? "Long" : "Short"}
                    </span>
                  </td>
                  <td className="px-2 py-2.5 text-right text-gray-300">
                    {oracle != null ? `$${formatUsd(oracle)}` : "—"}
                  </td>
                  <td className="px-3 py-2.5 text-right text-white">
                    ${formatUsd(amt)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </div>

    {basket.length > 0 && (
      <div className="px-4 py-2 border-t-2 border-white/20 text-[9px] font-black uppercase tracking-widest text-gray-500 flex justify-between">
        <span>Total alloc</span>
        <span className="text-green-400">${formatUsd(totalAllocated)}</span>
      </div>
    )}
  </div>
);
