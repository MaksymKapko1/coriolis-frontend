import { type AccountState } from "../../hooks/useNadoAccount";
import { type NadoSymbol } from "../../services/nadoApi";

const formatUsd = (n: number) =>
  n.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 4,
  });

interface PositionsPanelProps {
  account: AccountState;
  balances: Record<number, number>;
  entryPrices: Record<number, number>;
  oraclePrices: Record<number, number>;
  symbols: Record<number, NadoSymbol>;
  unrealizedPnl: number;
  onCloseAll?: () => void;
  isClosing?: boolean;
  onClosePosition: (productId: number) => void;
  closingProductId: number | null;
}

export const PositionsPanel = ({
  account,
  balances,
  entryPrices,
  oraclePrices,
  symbols,
  unrealizedPnl,
  onCloseAll,
  isClosing = false,
  onClosePosition,
  closingProductId,
}: PositionsPanelProps) => {
  const isTotalPnlPositive = unrealizedPnl >= 0;

  const activePositions = Object.entries(balances)
    .filter(([productIdStr, amount]) => {
      if (amount === 0) return false;
      const productId = Number(productIdStr);
      return symbols[productId]?.type === "perp";
    })
    .map(([productIdStr, amount]) => {
      const productId = Number(productIdStr);
      const symbol = symbols[productId]?.symbol || `ID:${productId}`;
      const entry = entryPrices[productId] || 0;
      const oracle = oraclePrices[productId] || 0;
      const pnl = amount * (oracle - entry);
      const isLong = amount > 0;

      return {
        productId,
        symbol,
        amount,
        isLong,
        entry,
        oracle,
        pnl,
      };
    });

  return (
    <div className="w-full border-2 border-white/20 bg-black font-sans flex flex-col mt-2">
      <div className="flex flex-wrap justify-between items-center p-4 border-b-2 border-white/20 gap-4 bg-gray-950/50">
        <div className="flex gap-8 items-center">
          <div>
            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-[0.2em] mb-1">
              Total Equity
            </p>
            <p className="font-mono text-lg font-black text-white">
              ${formatUsd(account.totalEquity)}
            </p>
          </div>
          <div>
            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-[0.2em] mb-1">
              Available Margin
            </p>
            <p className="font-mono text-lg font-black text-white">
              ${formatUsd(account.availableMargin)}
            </p>
          </div>
          <div className="pl-6 border-l-2 border-white/20">
            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-[0.2em] mb-1">
              Unrealized PNL
            </p>
            <p
              className={`font-mono text-lg font-black ${
                isTotalPnlPositive ? "text-green-400" : "text-red-500"
              }`}
            >
              {isTotalPnlPositive ? "+" : ""}
              {formatUsd(unrealizedPnl)}
            </p>
          </div>
        </div>

        <button
          onClick={onCloseAll}
          disabled={isClosing || activePositions.length === 0}
          className={`px-6 py-3 border-2 text-xs font-black uppercase tracking-[0.2em] transition-colors rounded-none ${
            isClosing || activePositions.length === 0
              ? "border-gray-800 text-gray-600 cursor-not-allowed bg-black"
              : "border-red-500 bg-black text-red-500 hover:bg-red-500 hover:text-black"
          }`}
        >
          {isClosing ? "CLOSING..." : "CLOSE ALL POSITIONS"}
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b-2 border-white/10 bg-black">
              <th className="p-4 text-[10px] font-black uppercase tracking-[0.2em] text-gray-500">
                Market
              </th>
              <th className="p-4 text-[10px] font-black uppercase tracking-[0.2em] text-gray-500">
                Size
              </th>
              <th className="p-4 text-[10px] font-black uppercase tracking-[0.2em] text-gray-500">
                Entry Price
              </th>
              <th className="p-4 text-[10px] font-black uppercase tracking-[0.2em] text-gray-500">
                Oracle Price
              </th>
              <th className="p-4 text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 text-right">
                Est. PNL
              </th>
            </tr>
          </thead>
          <tbody className="font-mono text-sm">
            {activePositions.length === 0 ? (
              <tr>
                <td
                  colSpan={5}
                  className="p-8 text-center text-[10px] uppercase tracking-[0.3em] font-bold text-gray-600"
                >
                  No Open Positions
                </td>
              </tr>
            ) : (
              activePositions.map((pos) => (
                <tr
                  key={pos.productId}
                  className="border-b border-white/5 hover:bg-white/5 transition-colors"
                >
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <span className="font-black text-white font-sans uppercase">
                        {pos.symbol}
                      </span>
                      <span
                        className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 border ${
                          pos.isLong
                            ? "text-green-400 border-green-400/30 bg-green-400/10"
                            : "text-red-400 border-red-400/30 bg-red-400/10"
                        }`}
                      >
                        {pos.isLong ? "LONG" : "SHORT"}
                      </span>
                    </div>
                  </td>
                  <td className="p-4 font-bold text-white">
                    {Math.abs(pos.amount).toString()}
                  </td>
                  <td className="p-4 text-gray-300">${formatUsd(pos.entry)}</td>
                  <td className="p-4 text-gray-300">
                    ${formatUsd(pos.oracle)}
                  </td>
                  <td
                    className={`p-4 text-right font-black ${
                      pos.pnl >= 0 ? "text-green-400" : "text-red-500"
                    }`}
                  >
                    {pos.pnl >= 0 ? "+" : ""}
                    {formatUsd(pos.pnl)}
                  </td>
                  <td className="p-4 text-center">
                    <button
                      onClick={() => onClosePosition(pos.productId)}
                      disabled={closingProductId === pos.productId || isClosing}
                      className="text-gray-600 hover:text-red-500 transition-colors font-black text-2xl leading-none px-2 disabled:opacity-30 disabled:cursor-not-allowed"
                      title="Close Position"
                    >
                      {closingProductId === pos.productId ? (
                        <div className="w-4 h-4 border-2 border-red-500 border-t-transparent animate-spin mx-auto" />
                      ) : (
                        "×"
                      )}
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
