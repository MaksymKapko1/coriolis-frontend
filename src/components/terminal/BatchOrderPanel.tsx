import { useState, useCallback } from "react";
import { usePrivy } from "@privy-io/react-auth";

// ─── Types ────────────────────────────────────────────────────────────────────

interface NadoSymbol {
  product_id: number;
  symbol: string;
  type: string;
}

interface BatchOrderItem {
  product_id: number;
  symbol: string;
  amount: string;
  is_buy: boolean;
}

interface BatchOrderPanelProps {
  symbols: Record<number, NadoSymbol>;
  accountAvailable?: number; // USDC available balance
}

// ─── API call ─────────────────────────────────────────────────────────────────

async function placeBatchOrder(
  payload: {
    orders: { product_id: number; amount: number; is_buy: boolean }[];
    stop_on_failure: boolean;
  },
  token: string,
) {
  const res = await fetch("/api/orders/batch", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail || "Batch order failed");
  }
  return res.json();
}

// ─── Sub-components ───────────────────────────────────────────────────────────

const SideToggle = ({
  isBuy,
  onChange,
}: {
  isBuy: boolean;
  onChange: (v: boolean) => void;
}) => (
  <div className="flex bg-gray-900 rounded p-0.5 border border-gray-800 w-28 shrink-0">
    <button
      onClick={() => onChange(true)}
      className={`flex-1 py-1 text-xs font-bold rounded transition-colors ${
        isBuy
          ? "bg-green-500/20 text-green-400"
          : "text-gray-600 hover:text-gray-400"
      }`}
    >
      L
    </button>
    <button
      onClick={() => onChange(false)}
      className={`flex-1 py-1 text-xs font-bold rounded transition-colors ${
        !isBuy
          ? "bg-red-500/20 text-red-400"
          : "text-gray-600 hover:text-gray-400"
      }`}
    >
      S
    </button>
  </div>
);

// ─── Main Component ───────────────────────────────────────────────────────────

export const BatchOrderPanel = ({
  symbols,
  accountAvailable = 0,
}: BatchOrderPanelProps) => {
  const { getAccessToken } = usePrivy();

  const perpSymbols = Object.values(symbols).filter((s) => s.type === "perp");

  const [basket, setBasket] = useState<BatchOrderItem[]>([]);
  const [selectedProductId, setSelectedProductId] = useState<number>(
    perpSymbols[0]?.product_id ?? 0,
  );
  const [splitMode, setSplitMode] = useState<"equal" | "manual">("equal");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [stopOnFailure, setStopOnFailure] = useState(false);
  const [feedback, setFeedback] = useState<{
    type: "error" | "success";
    msg: string;
  } | null>(null);

  // ── Basket management ──

  const addToBasket = () => {
    if (basket.find((o) => o.product_id === selectedProductId)) return;
    const sym = symbols[selectedProductId];
    if (!sym) return;

    const newItem: BatchOrderItem = {
      product_id: selectedProductId,
      symbol: sym.symbol,
      amount: "",
      is_buy: true,
    };

    const updated = [...basket, newItem];
    setBasket(splitMode === "equal" ? distributeEqual(updated) : updated);
  };

  const removeFromBasket = (productId: number) => {
    const updated = basket.filter((o) => o.product_id !== productId);
    setBasket(splitMode === "equal" ? distributeEqual(updated) : updated);
  };

  const updateItem = (
    productId: number,
    field: "amount" | "is_buy",
    value: string | boolean,
  ) => {
    setBasket((prev) =>
      prev.map((o) =>
        o.product_id === productId ? { ...o, [field]: value } : o,
      ),
    );
  };

  // ── Equal split ──

  const distributeEqual = useCallback(
    (items: BatchOrderItem[]): BatchOrderItem[] => {
      if (!items.length || accountAvailable <= 0) return items;
      const perOrder = (accountAvailable / items.length).toFixed(2);
      return items.map((o) => ({ ...o, amount: perOrder }));
    },
    [accountAvailable],
  );

  const applyEqualSplit = () => {
    setSplitMode("equal");
    setBasket(distributeEqual(basket));
  };

  // ── Submit ──

  const totalAllocated = basket.reduce(
    (sum, o) => sum + (parseFloat(o.amount) || 0),
    0,
  );
  const isOverBudget =
    totalAllocated > accountAvailable && accountAvailable > 0;
  const canSubmit =
    basket.length > 0 &&
    basket.every((o) => parseFloat(o.amount) > 0) &&
    !isOverBudget;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setIsSubmitting(true);
    setFeedback(null);

    try {
      const token = await getAccessToken();
      if (!token) throw new Error("Auth error — reconnect wallet");

      const orders = basket.map((o) => ({
        product_id: o.product_id,
        amount: parseFloat(o.amount),
        is_buy: o.is_buy,
      }));

      const result = await placeBatchOrder(
        { orders, stop_on_failure: stopOnFailure },
        token,
      );
      setFeedback({ type: "success", msg: `${basket.length} orders executed` });
      setBasket([]);
      console.log(">>> [BATCH SUCCESS]", result);
    } catch (err: any) {
      setFeedback({ type: "error", msg: err.message || "Batch failed" });
    } finally {
      setIsSubmitting(false);
    }
  };

  // ─── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="bg-gray-950 border border-gray-800 rounded-xl p-4 w-full font-mono">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-white font-bold text-lg tracking-tight">
            Batch Orders
          </h2>
          <p className="text-xs text-gray-600 mt-0.5">
            Multi-asset market execution
          </p>
        </div>
        <span className="bg-yellow-500/10 text-yellow-400 text-xs px-2 py-1 rounded border border-yellow-500/20">
          FOK × {basket.length}
        </span>
      </div>

      {/* Balance bar */}
      {accountAvailable > 0 && (
        <div className="mb-4 p-3 bg-gray-900 rounded-lg border border-gray-800">
          <div className="flex justify-between text-xs mb-1.5">
            <span className="text-gray-500">Available</span>
            <span className="text-white">${accountAvailable.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-gray-500">Allocated</span>
            <span className={isOverBudget ? "text-red-400" : "text-green-400"}>
              ${totalAllocated.toFixed(2)}
            </span>
          </div>
          {basket.length > 0 && accountAvailable > 0 && (
            <div className="mt-2">
              <div className="w-full bg-gray-800 rounded-full h-1">
                <div
                  className={`h-1 rounded-full transition-all ${isOverBudget ? "bg-red-500" : "bg-green-500"}`}
                  style={{
                    width: `${Math.min((totalAllocated / accountAvailable) * 100, 100)}%`,
                  }}
                />
              </div>
            </div>
          )}
        </div>
      )}

      {/* Add asset row */}
      <div className="flex gap-2 mb-3">
        <select
          value={selectedProductId}
          onChange={(e) => setSelectedProductId(Number(e.target.value))}
          className="flex-1 bg-gray-900 text-white text-xs border border-gray-800 rounded-lg px-3 py-2 outline-none focus:border-purple-500 transition-colors appearance-none cursor-pointer"
        >
          {perpSymbols.map((s) => (
            <option
              key={s.product_id}
              value={s.product_id}
              className="bg-gray-950"
            >
              {s.symbol} (ID: {s.product_id})
            </option>
          ))}
        </select>
        <button
          onClick={addToBasket}
          disabled={basket.some((o) => o.product_id === selectedProductId)}
          className="px-3 py-2 bg-purple-500/20 text-purple-400 border border-purple-500/30 rounded-lg text-xs font-bold hover:bg-purple-500/30 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
        >
          + ADD
        </button>
      </div>

      {/* Split controls */}
      {basket.length > 1 && (
        <div className="flex items-center gap-2 mb-3">
          <button
            onClick={applyEqualSplit}
            className="text-xs px-2 py-1 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded hover:bg-blue-500/20 transition-colors"
          >
            ⚖ Equal split
          </button>
          <button
            onClick={() => setSplitMode("manual")}
            className={`text-xs px-2 py-1 rounded border transition-colors ${
              splitMode === "manual"
                ? "bg-gray-700 text-white border-gray-600"
                : "bg-gray-900 text-gray-500 border-gray-800 hover:text-gray-300"
            }`}
          >
            Manual
          </button>
          {accountAvailable > 0 && (
            <span className="text-xs text-gray-600 ml-auto">
              ~${(accountAvailable / basket.length).toFixed(2)} each
            </span>
          )}
        </div>
      )}

      {/* Basket */}
      <div className="space-y-2 min-h-[60px]">
        {basket.length === 0 ? (
          <div className="flex items-center justify-center h-16 border border-dashed border-gray-800 rounded-lg">
            <p className="text-xs text-gray-700">Add assets to basket</p>
          </div>
        ) : (
          basket.map((order) => (
            <div
              key={order.product_id}
              className={`flex items-center gap-2 p-2.5 rounded-lg border transition-colors ${
                order.is_buy
                  ? "bg-green-500/5 border-green-500/20"
                  : "bg-red-500/5 border-red-500/20"
              }`}
            >
              {/* Symbol */}
              <span className="text-white text-xs font-bold w-16 shrink-0">
                {order.symbol}
              </span>

              {/* Side toggle */}
              <SideToggle
                isBuy={order.is_buy}
                onChange={(v) => updateItem(order.product_id, "is_buy", v)}
              />

              {/* Amount */}
              <div className="flex-1 flex items-center bg-gray-900 border border-gray-800 rounded px-2 py-1 focus-within:border-purple-500 transition-colors">
                <span className="text-gray-600 text-xs mr-1">$</span>
                <input
                  type="number"
                  step="any"
                  min="0"
                  value={order.amount}
                  onChange={(e) => {
                    setSplitMode("manual");
                    updateItem(order.product_id, "amount", e.target.value);
                  }}
                  placeholder="0.00"
                  className="bg-transparent text-white text-xs outline-none w-full placeholder-gray-700"
                />
              </div>

              {/* Remove */}
              <button
                onClick={() => removeFromBasket(order.product_id)}
                className="text-gray-700 hover:text-red-400 transition-colors text-sm leading-none px-1"
              >
                ×
              </button>
            </div>
          ))
        )}
      </div>

      {/* Options */}
      {basket.length > 0 && (
        <div className="mt-3 flex items-center gap-2">
          <input
            type="checkbox"
            id="stopOnFailure"
            checked={stopOnFailure}
            onChange={(e) => setStopOnFailure(e.target.checked)}
            className="accent-purple-500"
          />
          <label
            htmlFor="stopOnFailure"
            className="text-xs text-gray-500 cursor-pointer"
          >
            Stop on first failure
          </label>
        </div>
      )}

      {/* Feedback */}
      {feedback && (
        <div
          className={`mt-3 text-xs p-2 rounded ${
            feedback.type === "error"
              ? "bg-red-500/10 text-red-400 border border-red-500/20"
              : "bg-green-500/10 text-green-400 border border-green-500/20"
          }`}
        >
          {feedback.msg}
        </div>
      )}

      {/* Submit */}
      <button
        onClick={handleSubmit}
        disabled={!canSubmit || isSubmitting}
        className={`w-full mt-4 py-3 rounded-lg font-bold text-sm transition-colors ${
          !canSubmit || isSubmitting
            ? "bg-gray-800 text-gray-600 cursor-not-allowed"
            : isOverBudget
              ? "bg-red-500/20 text-red-400 border border-red-500/30 cursor-not-allowed"
              : "bg-purple-500/20 text-purple-400 border border-purple-500/30 hover:bg-purple-500/30"
        }`}
      >
        {isSubmitting ? (
          <span className="flex items-center justify-center gap-2">
            <div className="w-3 h-3 border-2 border-purple-400/30 border-t-purple-400 rounded-full animate-spin" />
            Executing {basket.length} orders...
          </span>
        ) : isOverBudget ? (
          `Over budget by $${(totalAllocated - accountAvailable).toFixed(2)}`
        ) : (
          `Execute ${basket.length} Order${basket.length !== 1 ? "s" : ""}`
        )}
      </button>
    </div>
  );
};
