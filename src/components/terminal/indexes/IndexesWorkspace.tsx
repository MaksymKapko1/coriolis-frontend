import { useState, useCallback, useEffect, useMemo } from "react";
import { usePrivy } from "@privy-io/react-auth";
import { placeBatchOrder } from "../../../services/tradeApi";
import {
  fetchMyIndexes,
  fetchDefaultIndexes,
  createIndex,
  updateIndex,
  deleteIndex,
  type TradingIndex,
} from "../../../services/indexApi";
import { IndexPickerPanel } from "./IndexPickerPanel.tsx";
import { IndexPreviewPanel } from "./IndexPreviewPanel.tsx";
import { IndexSettingsPanel } from "./IndexSettingsPanel.tsx";
import type { BasketItem } from "./types.ts";

interface NadoSymbol {
  product_id: number;
  symbol: string;
  type: string;
}

interface IndexesWorkspaceProps {
  symbols: Record<number, NadoSymbol>;
  oraclePrices: Record<number, number>;
  accountAvailable?: number;
}

export const IndexesWorkspace = ({
  symbols,
  oraclePrices,
  accountAvailable = 0,
}: IndexesWorkspaceProps) => {
  const { getAccessToken } = usePrivy();
  const perpSymbols = Object.values(symbols).filter((s) => s.type === "perp");

  const [basket, setBasket] = useState<BasketItem[]>([]);
  const [selectedProductId, setSelectedProductId] = useState<number>(
    perpSymbols[0]?.product_id ?? 0,
  );
  const [splitMode, setSplitMode] = useState<"equal" | "manual">("equal");
  const [allocationPercent, setAllocationPercent] = useState(100);
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
  const [saveIndexName, setSaveIndexName] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const allocationBudget = useMemo(
    () => accountAvailable * (allocationPercent / 100),
    [accountAvailable, allocationPercent],
  );

  const allIndexes = [...defaultIndexes, ...myIndexes];
  const activeIndex = allIndexes.find((i) => i.id === selectedIndexId);
  const previewTitle =
    activeIndex?.name ?? (basket.length > 0 ? "Custom Basket" : "No Index");

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
        // silent
      }
    };
    load();
  }, [getAccessToken]);

  const distributeEqual = useCallback(
    (items: BasketItem[]): BasketItem[] => {
      if (!items.length || allocationBudget <= 0) return items;
      const perOrder = (allocationBudget / items.length).toFixed(2);
      return items.map((o) => ({ ...o, amount: perOrder }));
    },
    [allocationBudget],
  );

  useEffect(() => {
    if (splitMode === "equal" && basket.length > 0) {
      setBasket((prev) => distributeEqual(prev));
    }
  }, [allocationPercent, accountAvailable, splitMode, distributeEqual]);

  const loadIndex = (indexId: number) => {
    const idx = allIndexes.find((i) => i.id === indexId);
    if (!idx) return;

    setSelectedIndexId(indexId);

    const sideByProduct = new Map(
      basket.map((o) => [o.product_id, o.is_buy] as const),
    );

    const filteredAssets = idx.assets.filter((a) => symbols[a.product_id]);
    const equalAmount =
      allocationBudget > 0 && filteredAssets.length > 0
        ? (allocationBudget / filteredAssets.length).toFixed(2)
        : "";

    const useWeights = idx.is_system || splitMode === "manual";

    const newBasket: BasketItem[] = filteredAssets.map((a) => ({
      product_id: a.product_id,
      symbol: a.symbol,
      amount:
        !useWeights && equalAmount
          ? equalAmount
          : allocationBudget > 0
            ? (allocationBudget * (a.weight || 0)).toFixed(2)
            : "",
      is_buy: a.is_buy ?? sideByProduct.get(a.product_id) ?? true,
    }));

    setBasket(newBasket);
    if (idx.is_system || splitMode !== "equal") setSplitMode("manual");

    setFeedback({
      type: "success",
      msg: `Loaded ${idx.name}`,
    });
  };

  const handleSaveIndex = async () => {
    if (!saveIndexName.trim() || basket.length === 0) return;
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
          is_buy: o.is_buy,
        };
      });

      const saved = await createIndex(token, saveIndexName.trim(), assets);
      setMyIndexes((prev) => [...prev, saved]);
      setSaveIndexName("");
      setShowSaveForm(false);
      setSelectedIndexId(saved.id);
      setFeedback({ type: "success", msg: `Index "${saved.name}" created` });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Save failed";
      setFeedback({ type: "error", msg });
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
      if (!idxToUpdate) throw new Error("Index not found");

      const assets = basket.map((o) => {
        const amt = parseFloat(o.amount) || 0;
        const weight = total > 0 ? amt / total : 1 / basket.length;
        return {
          product_id: o.product_id,
          symbol: o.symbol,
          weight,
          is_buy: o.is_buy,
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
      setFeedback({ type: "success", msg: `Index "${updated.name}" updated` });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Update failed";
      setFeedback({ type: "error", msg });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteIndex = async () => {
    if (!selectedIndexId) return;
    if (!window.confirm("Delete this index?")) return;
    setIsSaving(true);
    try {
      const token = await getAccessToken();
      if (!token) throw new Error("AUTH ERROR");
      await deleteIndex(token, selectedIndexId as number);
      setMyIndexes((prev) => prev.filter((i) => i.id !== selectedIndexId));
      setBasket([]);
      setSelectedIndexId("");
      setFeedback({ type: "success", msg: "Index deleted" });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Delete failed";
      setFeedback({ type: "error", msg });
    } finally {
      setIsSaving(false);
    }
  };

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
    if (field === "amount") setSplitMode("manual");
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
    totalAllocated > allocationBudget && allocationBudget > 0;
  const canSubmit =
    basket.length > 0 &&
    basket.every((o) => parseFloat(o.amount) > 0) &&
    !isOverBudget;

  const handleSubmit = async () => {
    const count = basket.length;
    try {
      setIsSubmitting(true);
      setFeedback(null);
      const token = await getAccessToken();
      if (!token) throw new Error("AUTH ERROR");

      await placeBatchOrder(
        {
          orders: basket.map((o) => ({
            product_id: o.product_id,
            notional_usd: parseFloat(o.amount),
            is_buy: o.is_buy,
            is_market: true,
          })),
          stop_on_failure: stopOnFailure,
        },
        token,
      );

      setBasket([]);
      setSelectedIndexId("");
      setFeedback({
        type: "success",
        msg: `${count} orders executed`,
      });
      setTimeout(() => setFeedback(null), 4000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Execution failed";
      setFeedback({ type: "error", msg });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="lg:col-span-12 border-2 border-white/20 bg-black min-h-[560px] grid grid-cols-1 lg:grid-cols-12 items-stretch">
      {/* Index picker */}
      <div className="lg:col-span-4 flex flex-col min-h-[320px] lg:min-h-0 border-b-2 lg:border-b-0 lg:border-r-2 border-white/20">
        <IndexPickerPanel
          systemIndexes={defaultIndexes}
          myIndexes={myIndexes}
          selectedIndexId={selectedIndexId}
          onSelectIndex={loadIndex}
          onClearSelection={() => {
            setBasket([]);
            setSelectedIndexId("");
            setFeedback(null);
          }}
        />
      </div>

      {/* Preview */}
      <div className="lg:col-span-4 flex flex-col min-h-[280px] lg:min-h-0 border-b-2 lg:border-b-0 lg:border-r-2 border-white/20">
        <IndexPreviewPanel
          indexName={previewTitle}
          assetCount={basket.length}
          basket={basket}
          totalAllocated={totalAllocated}
          allocationBudget={allocationBudget}
          oraclePrices={oraclePrices}
        />
      </div>

      {/* Settings */}
      <div className="lg:col-span-4 flex flex-col min-h-[400px] lg:min-h-0">
        <IndexSettingsPanel
          accountAvailable={accountAvailable}
          allocationPercent={allocationPercent}
          allocationBudget={allocationBudget}
          totalAllocated={totalAllocated}
          isOverBudget={isOverBudget}
          onAllocationPercentChange={setAllocationPercent}
          myIndexes={myIndexes}
          selectedIndexId={selectedIndexId}
          showSaveForm={showSaveForm}
          onToggleSaveForm={() => {
            setShowSaveForm((v) => !v);
            setFeedback(null);
          }}
          indexName={saveIndexName}
          onIndexNameChange={setSaveIndexName}
          onSaveIndex={handleSaveIndex}
          onUpdateIndex={handleUpdateIndex}
          onDeleteIndex={handleDeleteIndex}
          isSaving={isSaving}
          perpSymbols={perpSymbols}
          selectedProductId={selectedProductId}
          onSelectedProductIdChange={setSelectedProductId}
          onAddToBasket={addToBasket}
          splitMode={splitMode}
          onSplitModeEqual={() => {
            setSplitMode("equal");
            setBasket(distributeEqual(basket));
          }}
          onSplitModeManual={() => setSplitMode("manual")}
          basket={basket}
          onUpdateItem={updateItem}
          onRemoveFromBasket={removeFromBasket}
          stopOnFailure={stopOnFailure}
          onStopOnFailureChange={setStopOnFailure}
          feedback={feedback}
          canSubmit={canSubmit}
          isSubmitting={isSubmitting}
          onSubmit={handleSubmit}
        />
      </div>
    </section>
  );
};
