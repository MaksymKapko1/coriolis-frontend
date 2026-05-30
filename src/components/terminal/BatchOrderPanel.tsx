import { useState, useCallback } from "react";
import { usePrivy } from "@privy-io/react-auth";
import { placeBatchOrder } from "../../services/tradeApi";

interface NadoSymbol {
  product_id: number;
  symbol: string;
  type: string;
}

interface BasketItem {
  product_id: number;
  symbol: string;
  amount: string;
  is_buy: boolean;
}

interface BatchOrderPanelProps {
  symbols: Record<number, NadoSymbol>;
  accountAvailable?: number;
}

const SideToggle = ({
  isBuy,
  onChange,
}: {
  isBuy: boolean;
  onChange: (v: boolean) => void;
}) => (
  <div className="flex border-2 border-white/20 w-24 shrink-0 bg-black font-sans">
    <button
      onClick={() => onChange(true)}
      className={`flex-1 py-1 text-[10px] font-black uppercase transition-colors ${
        isBuy ? "bg-green-400 text-black" : "text-gray-600 hover:text-white"
      }`}
    >
      L
    </button>
    <button
      onClick={() => onChange(false)}
      className={`flex-1 py-1 text-[10px] font-black uppercase border-l-2 border-white/20 transition-colors ${
        !isBuy ? "bg-white text-black" : "text-gray-600 hover:text-white"
      }`}
    >
      S
    </button>
  </div>
);

export const BatchOrderPanel = ({
  symbols,
  accountAvailable = 0,
}: BatchOrderPanelProps) => {
  const { getAccessToken } = usePrivy();
  const perpSymbols = Object.values(symbols).filter((s) => s.type === "perp");

  const [basket, setBasket] = useState<BasketItem[]>([]);
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

  const distributeEqual = useCallback(
    (items: BasketItem[]): BasketItem[] => {
      if (!items.length || accountAvailable <= 0) return items;
      const perOrder = (accountAvailable / items.length).toFixed(2);
      return items.map((o) => ({ ...o, amount: perOrder }));
    },
    [accountAvailable],
  );

  const addToBasket = () => {
    if (basket.find((o) => o.product_id === selectedProductId)) return;
    const sym = symbols[selectedProductId];
    if (!sym) return;
    const updated = [
      ...basket,
      {
        product_id: selectedProductId,
        symbol: sym.symbol,
        amount: "",
        is_buy: true,
      },
    ];
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
    const hasInvalid = basket.some(
      (o) => isNaN(parseFloat(o.amount)) || parseFloat(o.amount) <= 0,
    );
    if (hasInvalid) {
      setFeedback({ type: "error", msg: "INVALID AMOUNTS DETECTED" });
      return;
    }

    try {
      setIsSubmitting(true);
      setFeedback(null);
      const token = await getAccessToken();
      if (!token) throw new Error("AUTH ERROR");

      const payload = {
        orders: basket.map((o) => ({
          product_id: o.product_id,
          notional_usd: parseFloat(o.amount),
          is_buy: o.is_buy,
          is_market: true,
        })),
        stop_on_failure: stopOnFailure,
      };

      await placeBatchOrder(payload, token);
      setFeedback({
        type: "success",
        msg: `INDEX OF ${basket.length} EXECUTED`,
      });
      setBasket([]);
    } catch (err: any) {
      setFeedback({ type: "error", msg: err.message || "EXECUTION FAILED" });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full flex flex-col gap-5 font-sans h-full">
      <div className="flex justify-between items-center">
        <h2 className="text-white font-black uppercase tracking-[0.1em] text-lg">
          Index Config
        </h2>
        <span className="border-2 border-white/20 text-white text-[10px] font-bold px-2 py-1 uppercase tracking-widest">
          FOK × {basket.length}
        </span>
      </div>

      {/* BALANCE BAR */}
      {accountAvailable > 0 && (
        <div className="border-2 border-white/20 bg-black p-3">
          <div className="flex justify-between text-[10px] font-black mb-2 uppercase tracking-widest">
            <span className="text-gray-500">
              Avail:{" "}
              <span className="text-white">${accountAvailable.toFixed(2)}</span>
            </span>
            <span className={isOverBudget ? "text-red-500" : "text-green-400"}>
              Alloc: ${totalAllocated.toFixed(2)}
            </span>
          </div>
          {basket.length > 0 && (
            <div className="w-full bg-gray-900 h-2 border border-white/10">
              <div
                className={`h-full transition-all ${isOverBudget ? "bg-red-500" : "bg-green-400"}`}
                style={{
                  width: `${Math.min((totalAllocated / accountAvailable) * 100, 100)}%`,
                }}
              />
            </div>
          )}
        </div>
      )}

      {/* ADD ASSET */}
      <div className="flex gap-0 border-2 border-white/20">
        <select
          value={selectedProductId}
          onChange={(e) => setSelectedProductId(Number(e.target.value))}
          className="flex-1 bg-black text-white font-black text-sm px-3 py-3 outline-none cursor-pointer appearance-none rounded-none"
        >
          {perpSymbols.map((s) => (
            <option
              key={s.product_id}
              value={s.product_id}
              className="bg-black text-white font-sans"
            >
              {s.symbol}
            </option>
          ))}
        </select>
        <button
          onClick={addToBasket}
          disabled={basket.some((o) => o.product_id === selectedProductId)}
          className="px-4 py-3 bg-white text-black font-black text-[10px] uppercase tracking-[0.2em] border-l-2 border-white/20 hover:bg-green-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Add
        </button>
      </div>

      {/* SPLIT CONTROLS */}
      {basket.length > 1 && (
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setSplitMode("equal");
              setBasket(distributeEqual(basket));
            }}
            className={`text-[10px] uppercase font-black tracking-[0.2em] px-3 py-2 border-2 transition-colors ${
              splitMode === "equal"
                ? "border-green-400 text-green-400"
                : "border-white/20 text-gray-500 hover:text-white"
            }`}
          >
            Equal Split
          </button>
          <button
            onClick={() => setSplitMode("manual")}
            className={`text-[10px] uppercase font-black tracking-[0.2em] px-3 py-2 border-2 transition-colors ${
              splitMode === "manual"
                ? "border-white text-white"
                : "border-white/20 text-gray-500 hover:text-white"
            }`}
          >
            Manual
          </button>
          {accountAvailable > 0 && (
            <span className="text-[10px] font-black text-gray-600 ml-auto uppercase tracking-widest">
              ~${(accountAvailable / basket.length).toFixed(2)} / EA
            </span>
          )}
        </div>
      )}

      {/* INDEX LIST */}
      <div className="space-y-3 flex-1">
        {basket.length === 0 ? (
          <div className="flex items-center justify-center h-16 border-2 border-dashed border-white/20 bg-black">
            <p className="text-[10px] uppercase font-black tracking-[0.3em] text-gray-600">
              Index is empty
            </p>
          </div>
        ) : (
          basket.map((order) => (
            <div
              key={order.product_id}
              className="flex items-center gap-3 p-2 border-2 border-white/20 bg-black"
            >
              <span className="text-white text-xs font-black uppercase w-12 shrink-0 text-center">
                {order.symbol}
              </span>

              <SideToggle
                isBuy={order.is_buy}
                onChange={(v) => updateItem(order.product_id, "is_buy", v)}
              />

              <div className="flex-1 flex items-center bg-black border-2 border-transparent focus-within:border-white/20 transition-colors px-2">
                <span className="text-green-400 font-black text-xs mr-2">
                  $
                </span>
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
                  className="bg-transparent text-white text-sm font-bold outline-none w-full rounded-none"
                />
              </div>

              <button
                onClick={() => removeFromBasket(order.product_id)}
                className="text-gray-600 hover:text-red-500 transition-colors font-black text-xl leading-none px-2"
              >
                ×
              </button>
            </div>
          ))
        )}
      </div>

      {/* STOP ON FAILURE */}
      {basket.length > 0 && (
        <div className="flex items-center gap-3 border-2 border-white/20 p-3 bg-black mt-auto">
          <input
            type="checkbox"
            id="stopOnFailure"
            checked={stopOnFailure}
            onChange={(e) => setStopOnFailure(e.target.checked)}
            className="w-4 h-4 accent-green-400 cursor-pointer rounded-none"
          />
          <label
            htmlFor="stopOnFailure"
            className="text-[10px] font-black uppercase tracking-widest text-gray-400 cursor-pointer"
          >
            Stop on first failure
          </label>
        </div>
      )}

      {feedback && (
        <div
          className={`text-[10px] font-black p-3 border-2 uppercase tracking-[0.2em] ${
            feedback.type === "error"
              ? "border-red-500 text-red-500"
              : "border-green-400 text-green-400"
          }`}
        >
          {feedback.msg}
        </div>
      )}

      {/* SUBMIT BUTTON */}
      <button
        onClick={handleSubmit}
        disabled={!canSubmit || isSubmitting}
        className={`w-full py-4 border-2 text-sm font-black uppercase tracking-[0.2em] transition-colors rounded-none ${
          !canSubmit || isSubmitting
            ? "border-gray-800 text-gray-600 cursor-not-allowed bg-black"
            : "border-green-400 bg-black text-green-400 hover:bg-green-400 hover:text-black"
        }`}
      >
        {isSubmitting ? (
          <span className="flex items-center justify-center gap-3">
            <div className="w-4 h-4 border-2 border-current border-t-transparent animate-spin" />
            PROCESSING
          </span>
        ) : (
          `EXECUTE ${basket.length} ORDER${basket.length !== 1 ? "S" : ""}`
        )}
      </button>
    </div>
  );
};
