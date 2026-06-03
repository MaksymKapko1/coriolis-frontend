import { useState, useCallback, useEffect } from "react";
import { usePrivy } from "@privy-io/react-auth";
import { placeBatchOrder } from "../../services/tradeApi";
import {
  fetchMyIndexes,
  fetchDefaultIndexes,
  createIndex,
  updateIndex,
  deleteIndex,
  type TradingIndex,
} from "../../services/indexApi";

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
  <div className="flex border-2 border-white/20 w-20 shrink-0 bg-black font-sans">
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

  const [myIndexes, setMyIndexes] = useState<TradingIndex[]>([]);
  const [defaultIndexes, setDefaultIndexes] = useState<TradingIndex[]>([]);
  const [selectedIndexId, setSelectedIndexId] = useState<number | "">("");
  const [showSaveForm, setShowSaveForm] = useState(false);
  const [indexName, setIndexName] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const token = await getAccessToken();
        const [mine, defaults] = await Promise.all([
          token ? fetchMyIndexes(token) : Promise.resolve([]),
          fetchDefaultIndexes(),
        ]);
        setMyIndexes(mine);
        setDefaultIndexes(defaults);
      } catch {
        // Handle silently
      }
    };
    load();
  }, [getAccessToken]);

  const allIndexes = [...defaultIndexes, ...myIndexes];

  const loadIndex = (indexId: number) => {
    const idx = allIndexes.find((i) => i.id === indexId);
    if (!idx) return;

    setSelectedIndexId(indexId);

    const newBasket: BasketItem[] = idx.assets
      .filter((a) => symbols[a.product_id])
      .map((a) => ({
        product_id: a.product_id,
        symbol: a.symbol,
        amount:
          accountAvailable > 0
            ? (accountAvailable * (a.weight || 0)).toFixed(2)
            : "",
        is_buy: true,
      }));

    setBasket(newBasket);
    setSplitMode("manual");

    setFeedback({
      type: "success",
      msg: `LOADED: ${idx.assets
        .map((a) => `${a.symbol} ${((a.weight || 0) * 100).toFixed(0)}%`)
        .join(" / ")}`,
    });
  };

  const handleSaveIndex = async () => {
    if (!indexName.trim() || basket.length === 0) return;
    setIsSaving(true);

    const total = basket.reduce((s, o) => s + (parseFloat(o.amount) || 0), 0);

    try {
      const token = await getAccessToken();
      if (!token) throw new Error("AUTH ERROR");

      const assets = basket.map((o) => {
        const amt = parseFloat(o.amount) || 0;
        const weight = total > 0 ? amt / total : 1 / basket.length;
        return {
          product_id: o.product_id,
          symbol: o.symbol,
          weight,
        };
      });

      const saved = await createIndex(token, indexName.trim(), assets);

      setMyIndexes((prev) => [...prev, saved]);
      setIndexName("");
      setShowSaveForm(false);
      setSelectedIndexId(saved.id);

      setFeedback({
        type: "success",
        msg: `INDEX "${saved.name}" CREATED`,
      });
    } catch (err: any) {
      setFeedback({ type: "error", msg: err.message || "SAVE FAILED" });
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdateIndex = async () => {
    if (!selectedIndexId || basket.length === 0) return;
    setIsSaving(true);

    const total = basket.reduce((s, o) => s + (parseFloat(o.amount) || 0), 0);

    try {
      const token = await getAccessToken();
      if (!token) throw new Error("AUTH ERROR");

      const idxToUpdate = myIndexes.find((i) => i.id === selectedIndexId);
      if (!idxToUpdate) throw new Error("INDEX NOT FOUND");

      const assets = basket.map((o) => {
        const amt = parseFloat(o.amount) || 0;
        const weight = total > 0 ? amt / total : 1 / basket.length;
        return {
          product_id: o.product_id,
          symbol: o.symbol,
          weight,
        };
      });

      const updated = await updateIndex(
        token,
        selectedIndexId,
        idxToUpdate.name,
        assets,
      );

      setMyIndexes((prev) =>
        prev.map((i) => (i.id === updated.id ? updated : i)),
      );

      setFeedback({
        type: "success",
        msg: `INDEX "${updated.name}" UPDATED`,
      });
    } catch (err: any) {
      setFeedback({ type: "error", msg: err.message || "UPDATE FAILED" });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteIndex = async () => {
    if (!selectedIndexId) return;

    const isConfirmed = window.confirm(
      "Are you sure you want to delete this index?",
    );
    if (!isConfirmed) return;

    setIsSaving(true);
    try {
      const token = await getAccessToken();
      if (!token) throw new Error("AUTH ERROR");

      await deleteIndex(token, selectedIndexId as number);

      setMyIndexes((prev) => prev.filter((i) => i.id !== selectedIndexId));
      setBasket([]);
      setSelectedIndexId("");
      setFeedback({
        type: "success",
        msg: "INDEX DELETED",
      });
    } catch (err: any) {
      setFeedback({ type: "error", msg: err.message || "DELETE FAILED" });
    } finally {
      setIsSaving(false);
    }
  };

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

      setBasket([]);
      setSelectedIndexId("");

      setFeedback({
        type: "success",
        msg: `INDEX OF ${basket.length} EXECUTED SUCCESSFULLY`,
      });

      setTimeout(() => {
        setFeedback(null);
      }, 4000);
    } catch (err: any) {
      setFeedback({ type: "error", msg: err.message || "EXECUTION FAILED" });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full flex flex-col gap-3 font-sans h-full">
      <div className="flex justify-between items-center mb-1">
        <h2 className="text-white font-black uppercase tracking-[0.1em] text-base">
          Index Config
        </h2>
        <div className="flex gap-1.5">
          {typeof selectedIndexId === "number" &&
            myIndexes.some((i) => i.id === selectedIndexId) && (
              <>
                <button
                  onClick={handleUpdateIndex}
                  disabled={isSaving || basket.length === 0}
                  className="border-2 border-white/20 text-white text-[9px] font-black px-3 py-1 uppercase tracking-widest hover:border-blue-400 hover:text-blue-400 transition-colors disabled:opacity-30 disabled:cursor-not-allowed rounded-none"
                >
                  {isSaving ? "..." : "Update"}
                </button>
                <button
                  onClick={handleDeleteIndex}
                  disabled={isSaving}
                  className="border-2 border-white/20 text-white text-[9px] font-black px-3 py-1 uppercase tracking-widest hover:border-red-500 hover:text-red-500 transition-colors disabled:opacity-30 disabled:cursor-not-allowed rounded-none"
                >
                  Delete
                </button>
              </>
            )}
          <button
            onClick={() => {
              setShowSaveForm((v) => !v);
              setFeedback(null);
            }}
            disabled={basket.length === 0}
            className="border-2 border-white/20 text-white text-[9px] font-black px-3 py-1 uppercase tracking-widest hover:border-green-400 hover:text-green-400 transition-colors disabled:opacity-30 disabled:cursor-not-allowed rounded-none"
          >
            {showSaveForm ? "Cancel" : "Save As New"}
          </button>
        </div>
      </div>

      {showSaveForm && (
        <div className="flex gap-0 border-2 border-green-400/40">
          <input
            type="text"
            value={indexName}
            onChange={(e) => setIndexName(e.target.value)}
            placeholder="INDEX NAME"
            className="flex-1 bg-black text-white font-black text-xs px-2 py-1.5 outline-none placeholder-gray-700 uppercase tracking-widest rounded-none"
          />
          <button
            onClick={handleSaveIndex}
            disabled={!indexName.trim() || isSaving}
            className="px-3 py-1.5 bg-green-400 text-black font-black text-[10px] uppercase tracking-[0.2em] border-l-2 border-green-400/40 hover:bg-green-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed rounded-none"
          >
            {isSaving ? "..." : "Create"}
          </button>
        </div>
      )}

      {allIndexes.length > 0 && (
        <div className="border-2 border-white/20 bg-black">
          <div className="px-2 pt-1.5 pb-0.5 border-b border-white/10 bg-white/5">
            <span className="text-[9px] font-black uppercase tracking-[0.3em] text-gray-500">
              Load Index
            </span>
          </div>
          <div className="flex gap-0">
            <select
              value={selectedIndexId}
              onChange={(e) => {
                const id = Number(e.target.value);
                if (id) loadIndex(id);
              }}
              className="flex-1 bg-black text-white font-black text-xs px-2 py-1.5 outline-none cursor-pointer appearance-none rounded-none"
            >
              <option value="" className="bg-black text-gray-600">
                — SELECT INDEX —
              </option>
              {defaultIndexes.length > 0 && (
                <optgroup
                  label="System"
                  className="bg-black text-gray-400 uppercase tracking-widest"
                >
                  {defaultIndexes.map((idx) => (
                    <option
                      key={idx.id}
                      value={idx.id}
                      className="bg-black text-white"
                    >
                      {idx.name} ({idx.assets.length} ASSETS)
                    </option>
                  ))}
                </optgroup>
              )}
              {myIndexes.length > 0 && (
                <optgroup
                  label="My Indexes"
                  className="bg-black text-gray-400 uppercase tracking-widest"
                >
                  {myIndexes.map((idx) => (
                    <option
                      key={idx.id}
                      value={idx.id}
                      className="bg-black text-white"
                    >
                      {idx.name} ({idx.assets.length} ASSETS)
                    </option>
                  ))}
                </optgroup>
              )}
            </select>
            {selectedIndexId !== "" && (
              <button
                onClick={() => {
                  setBasket([]);
                  setSelectedIndexId("");
                  setFeedback(null);
                }}
                className="px-3 py-1 text-gray-600 hover:text-red-500 transition-colors font-black text-base border-l-2 border-white/20"
              >
                ×
              </button>
            )}
          </div>
        </div>
      )}

      {accountAvailable > 0 && (
        <div className="border-2 border-white/20 bg-black p-2">
          <div className="flex justify-between text-[10px] font-black mb-1.5 uppercase tracking-widest">
            <span className="text-gray-500">
              Avail:{" "}
              <span className="text-white">${accountAvailable.toFixed(2)}</span>
            </span>
            <span className={isOverBudget ? "text-red-500" : "text-green-400"}>
              Alloc: ${totalAllocated.toFixed(2)}
            </span>
          </div>
          {basket.length > 0 && (
            <div className="w-full bg-gray-900 h-1.5 border border-white/10">
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

      <div className="flex gap-0 border-2 border-white/20">
        <select
          value={selectedProductId}
          onChange={(e) => setSelectedProductId(Number(e.target.value))}
          className="flex-1 bg-black text-white font-black text-xs px-2 py-2 outline-none cursor-pointer appearance-none rounded-none"
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
          className="px-4 py-2 bg-white text-black font-black text-[10px] uppercase tracking-[0.2em] border-l-2 border-white/20 hover:bg-green-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed rounded-none"
        >
          Add
        </button>
      </div>

      {basket.length > 1 && (
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => {
              setSplitMode("equal");
              setBasket(distributeEqual(basket));
            }}
            className={`text-[9px] uppercase font-black tracking-[0.2em] px-3 py-1.5 border-2 transition-colors rounded-none ${
              splitMode === "equal"
                ? "border-green-400 text-green-400"
                : "border-white/20 text-gray-500 hover:text-white"
            }`}
          >
            Equal Split
          </button>
          <button
            onClick={() => setSplitMode("manual")}
            className={`text-[9px] uppercase font-black tracking-[0.2em] px-3 py-1.5 border-2 transition-colors rounded-none ${
              splitMode === "manual"
                ? "border-white text-white"
                : "border-white/20 text-gray-500 hover:text-white"
            }`}
          >
            Manual
          </button>
          {accountAvailable > 0 && (
            <span className="text-[9px] font-black text-gray-600 ml-auto uppercase tracking-widest">
              ~${(accountAvailable / basket.length).toFixed(2)} / EA
            </span>
          )}
        </div>
      )}

      <div className="space-y-2 flex-1 overflow-y-auto pr-1 custom-scrollbar">
        {basket.length === 0 ? (
          <div className="flex items-center justify-center h-12 border-2 border-dashed border-white/20 bg-black">
            <p className="text-[10px] uppercase font-black tracking-[0.3em] text-gray-600">
              Index is empty
            </p>
          </div>
        ) : (
          basket.map((order) => (
            <div
              key={order.product_id}
              className="flex items-center gap-2 p-1.5 border-2 border-white/20 bg-black"
            >
              <span className="text-white text-[10px] font-black uppercase w-10 shrink-0 text-center">
                {order.symbol.split("-")[0]}
              </span>
              <SideToggle
                isBuy={order.is_buy}
                onChange={(v) => updateItem(order.product_id, "is_buy", v)}
              />

              <div className="flex flex-col flex-1 gap-0.5">
                <div className="flex items-center bg-black border-2 border-transparent focus-within:border-white/20 transition-colors px-1.5 py-0.5">
                  <span className="text-green-400 font-black text-[10px] mr-1.5">
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
                    className="bg-transparent text-white text-xs font-bold outline-none w-full rounded-none"
                  />
                </div>
                {totalAllocated > 0 && parseFloat(order.amount) > 0 && (
                  <div className="px-1.5">
                    <span className="text-[8px] font-black uppercase tracking-widest text-gray-600">
                      {(
                        (parseFloat(order.amount) / totalAllocated) *
                        100
                      ).toFixed(1)}
                      % WEIGHT
                    </span>
                  </div>
                )}
              </div>

              <button
                onClick={() => removeFromBasket(order.product_id)}
                className="text-gray-600 hover:text-red-500 transition-colors font-black text-lg leading-none px-1.5"
              >
                ×
              </button>
            </div>
          ))
        )}
      </div>

      {basket.length > 0 && (
        <div className="flex items-center gap-2 border-2 border-white/20 p-2 bg-black mt-auto">
          <input
            type="checkbox"
            id="stopOnFailure"
            checked={stopOnFailure}
            onChange={(e) => setStopOnFailure(e.target.checked)}
            className="w-3.5 h-3.5 accent-green-400 cursor-pointer rounded-none"
          />
          <label
            htmlFor="stopOnFailure"
            className="text-[9px] font-black uppercase tracking-widest text-gray-400 cursor-pointer"
          >
            Stop on first failure
          </label>
        </div>
      )}

      {feedback && (
        <div
          className={`text-[9px] font-black p-2 border-2 uppercase tracking-[0.2em] ${
            feedback.type === "error"
              ? "border-red-500 text-red-500"
              : "border-green-400 text-green-400"
          }`}
        >
          {feedback.msg}
        </div>
      )}

      <button
        onClick={handleSubmit}
        disabled={!canSubmit || isSubmitting}
        className={`w-full py-3 border-2 text-xs font-black uppercase tracking-[0.2em] transition-colors rounded-none mt-1 ${
          !canSubmit || isSubmitting
            ? "border-gray-800 text-gray-600 cursor-not-allowed bg-black"
            : "border-green-400 bg-black text-green-400 hover:bg-green-400 hover:text-black"
        }`}
      >
        {isSubmitting ? (
          <span className="flex items-center justify-center gap-2">
            <div className="w-3 h-3 border-2 border-current border-t-transparent animate-spin" />
            PROCESSING
          </span>
        ) : (
          `EXECUTE ${basket.length} ORDER${basket.length !== 1 ? "S" : ""}`
        )}
      </button>
    </div>
  );
};
