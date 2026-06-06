import { useMemo } from "react";
import type { BasketItem } from "./types.ts";
import type { PerpProductRisk } from "../../../utils/nadoRisk.ts";
import {
  estimateLiquidationPriceForNewLeg,
  estimateMaintenanceMarginForNotional,
  estimateMarginForNotional,
  getMaxLeverage,
} from "../../../utils/nadoRisk.ts";

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
  totalVolume: number;
  volumeBudget: number;
  totalMarginRequired: number;
  productRisks: Record<number, PerpProductRisk>;
  maintenanceHealth: number;
  oraclePrices: Record<number, number>;
}

export const IndexPreviewPanel = ({
  indexName,
  assetCount,
  basket,
  totalVolume,
  volumeBudget,
  totalMarginRequired,
  productRisks,
  maintenanceHealth,
  oraclePrices,
}: IndexPreviewPanelProps) => {
  const batchMaintenanceMargin = useMemo(
    () =>
      basket.reduce((sum, item) => {
        const vol = parseFloat(item.amount) || 0;
        const risk = productRisks[item.product_id];
        if (!risk || vol <= 0) return sum;
        return (
          sum + estimateMaintenanceMarginForNotional(vol, risk, item.is_buy)
        );
      }, 0),
    [basket, productRisks],
  );

  return (
    <div className="flex flex-col h-full min-h-0">
      <div className="px-4 py-3 border-b-2 border-white/20 bg-black">
        <p className="text-[9px] font-black uppercase tracking-[0.3em] text-green-400 mb-1">
          Preview
        </p>
        <h2 className="text-xl font-black uppercase tracking-tight text-white">
          {indexName}
        </h2>
        <p className="text-[9px] font-black uppercase tracking-widest text-gray-500 mt-1">
          {assetCount} asset{assetCount !== 1 ? "s" : ""} · vol $
          {formatUsd(volumeBudget)} · margin ~${formatUsd(totalMarginRequired)}
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
                <th className="px-2 py-2">Mkt</th>
                <th className="px-1 py-2">Side</th>
                <th className="px-1 py-2 text-right">Vol</th>
                <th className="px-1 py-2 text-right">Lev</th>
                <th className="px-1 py-2 text-right">Est Liq</th>
              </tr>
            </thead>
            <tbody>
              {basket.map((item) => {
                const vol = parseFloat(item.amount) || 0;
                const weight = totalVolume > 0 ? (vol / totalVolume) * 100 : 0;
                const oracle = oraclePrices[item.product_id];
                const risk = productRisks[item.product_id];
                const maxLev = risk ? getMaxLeverage(risk, item.is_buy) : null;
                const estMargin =
                  risk && vol > 0
                    ? estimateMarginForNotional(vol, risk, item.is_buy)
                    : null;
                const liq =
                  risk && vol > 0 && oracle
                    ? estimateLiquidationPriceForNewLeg(
                        vol,
                        oracle,
                        item.is_buy,
                        maintenanceHealth,
                        batchMaintenanceMargin,
                        risk,
                      )
                    : null;

                return (
                  <tr
                    key={item.product_id}
                    className="border-b border-white/5"
                  >
                    <td className="px-2 py-2">
                      <span className="text-white">
                        {shortSymbol(item.symbol)}
                      </span>
                      <span className="block text-[8px] text-gray-600 mt-0.5">
                        {weight.toFixed(1)}%
                      </span>
                    </td>
                    <td className="px-1 py-2">
                      <span
                        className={`inline-block px-1 py-0.5 text-[8px] border ${
                          item.is_buy
                            ? "border-green-400/60 text-green-400 bg-green-400/15"
                            : "border-red-500/60 text-red-400 bg-red-500/15"
                        }`}
                      >
                        {item.is_buy ? "L" : "S"}
                      </span>
                    </td>
                    <td className="px-1 py-2 text-right text-white">
                      ${formatUsd(vol)}
                      {estMargin != null && (
                        <span className="block text-[8px] text-gray-600 font-normal">
                          m ${formatUsd(estMargin)}
                        </span>
                      )}
                    </td>
                    <td className="px-1 py-2 text-right text-green-400/80">
                      {maxLev != null && Number.isFinite(maxLev)
                        ? `${Math.round(maxLev)}x`
                        : "—"}
                    </td>
                    <td className="px-1 py-2 text-right text-red-400/90">
                      {liq != null ? `$${formatUsd(liq)}` : "—"}
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
          <span>Total volume</span>
          <span className="text-green-400">${formatUsd(totalVolume)}</span>
        </div>
      )}
    </div>
  );
};
