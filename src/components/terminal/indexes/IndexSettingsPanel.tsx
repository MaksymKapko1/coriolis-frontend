import { StyledSelect } from "../../ui/StyledSelect.tsx";
import { SideToggle } from "./SideToggle.tsx";
import type { BasketItem } from "./types.ts";
import type { TradingIndex } from "../../../services/indexApi.ts";

interface IndexSettingsPanelProps {
  accountAvailable: number;
  allocationPercent: number;
  allocationBudget: number;
  totalAllocated: number;
  isOverBudget: boolean;
  onAllocationPercentChange: (v: number) => void;
  myIndexes: TradingIndex[];
  selectedIndexId: number | "";
  showSaveForm: boolean;
  onToggleSaveForm: () => void;
  indexName: string;
  onIndexNameChange: (v: string) => void;
  onSaveIndex: () => void;
  onUpdateIndex: () => void;
  onDeleteIndex: () => void;
  isSaving: boolean;
  perpSymbols: { product_id: number; symbol: string }[];
  selectedProductId: number;
  onSelectedProductIdChange: (id: number) => void;
  onAddToBasket: () => void;
  splitMode: "equal" | "manual";
  onSplitModeEqual: () => void;
  onSplitModeManual: () => void;
  basket: BasketItem[];
  onUpdateItem: (
    productId: number,
    field: "amount" | "is_buy",
    value: string | boolean,
  ) => void;
  onRemoveFromBasket: (productId: number) => void;
  stopOnFailure: boolean;
  onStopOnFailureChange: (v: boolean) => void;
  feedback: { type: "error" | "success"; msg: string } | null;
  canSubmit: boolean;
  isSubmitting: boolean;
  onSubmit: () => void;
}

export const IndexSettingsPanel = ({
  accountAvailable,
  allocationPercent,
  allocationBudget,
  totalAllocated,
  isOverBudget,
  onAllocationPercentChange,
  myIndexes,
  selectedIndexId,
  showSaveForm,
  onToggleSaveForm,
  indexName,
  onIndexNameChange,
  onSaveIndex,
  onUpdateIndex,
  onDeleteIndex,
  isSaving,
  perpSymbols,
  selectedProductId,
  onSelectedProductIdChange,
  onAddToBasket,
  splitMode,
  onSplitModeEqual,
  onSplitModeManual,
  basket,
  onUpdateItem,
  onRemoveFromBasket,
  stopOnFailure,
  onStopOnFailureChange,
  feedback,
  canSubmit,
  isSubmitting,
  onSubmit,
}: IndexSettingsPanelProps) => {
  return (
    <div className="flex flex-col gap-3 h-full min-h-0 p-4 font-sans">
      <div className="flex justify-between items-center">
        <h2 className="text-white font-black uppercase tracking-[0.1em] text-sm">
          Settings
        </h2>
        <div className="flex gap-1.5">
          {typeof selectedIndexId === "number" &&
            myIndexes.some((i) => i.id === selectedIndexId) && (
              <>
                <button
                  type="button"
                  onClick={onUpdateIndex}
                  disabled={isSaving || basket.length === 0}
                  className="border-2 border-white/20 text-white text-[9px] font-black px-2 py-1 uppercase tracking-widest hover:border-green-400 hover:text-green-400 transition-colors disabled:opacity-30 rounded-none"
                >
                  {isSaving ? "..." : "Update"}
                </button>
                <button
                  type="button"
                  onClick={onDeleteIndex}
                  disabled={isSaving}
                  className="border-2 border-white/20 text-white text-[9px] font-black px-2 py-1 uppercase tracking-widest hover:border-red-500 hover:text-red-500 transition-colors disabled:opacity-30 rounded-none"
                >
                  Delete
                </button>
              </>
            )}
          <button
            type="button"
            onClick={onToggleSaveForm}
            disabled={basket.length === 0}
            className="border-2 border-white/20 text-white text-[9px] font-black px-2 py-1 uppercase tracking-widest hover:border-green-400 hover:text-green-400 transition-colors disabled:opacity-30 rounded-none"
          >
            {showSaveForm ? "Cancel" : "Save"}
          </button>
        </div>
      </div>

      {showSaveForm && (
        <div className="flex gap-0 border-2 border-green-400/40">
          <input
            type="text"
            value={indexName}
            onChange={(e) => onIndexNameChange(e.target.value)}
            placeholder="INDEX NAME"
            className="flex-1 bg-black text-white font-black text-xs px-2 py-1.5 outline-none placeholder-gray-700 uppercase tracking-widest rounded-none"
          />
          <button
            type="button"
            onClick={onSaveIndex}
            disabled={!indexName.trim() || isSaving}
            className="px-3 py-1.5 bg-green-400 text-black font-black text-[10px] uppercase tracking-[0.2em] border-l-2 border-green-400/40 hover:bg-green-300 transition-colors disabled:opacity-50 rounded-none"
          >
            {isSaving ? "..." : "Create"}
          </button>
        </div>
      )}

      {accountAvailable > 0 && (
        <div className="border-2 border-white/20 bg-black p-2 space-y-2">
          <div className="flex flex-wrap justify-between gap-x-2 text-[9px] font-black uppercase tracking-widest">
            <span className="text-gray-500">
              Avail{" "}
              <span className="text-white">${accountAvailable.toFixed(2)}</span>
            </span>
            <span className="text-gray-500">
              Budget{" "}
              <span className="text-white">
                ${allocationBudget.toFixed(2)} ({allocationPercent}%)
              </span>
            </span>
            <span className={isOverBudget ? "text-red-500" : "text-green-400"}>
              Alloc ${totalAllocated.toFixed(2)}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[9px] text-gray-600 shrink-0">Use</span>
            <input
              type="range"
              min={1}
              max={100}
              value={allocationPercent}
              onChange={(e) =>
                onAllocationPercentChange(Number(e.target.value))
              }
              className="flex-1 accent-green-400 h-1 cursor-pointer"
            />
            <input
              type="number"
              min={1}
              max={100}
              value={allocationPercent}
              onChange={(e) => {
                const v = Math.min(
                  100,
                  Math.max(1, Number(e.target.value) || 1),
                );
                onAllocationPercentChange(v);
              }}
              className="w-10 bg-black border-2 border-white/20 text-white text-[9px] font-black text-center py-0.5 outline-none rounded-none"
            />
          </div>
        </div>
      )}

      <div className="flex gap-0 border-2 border-white/20">
        <StyledSelect
          bordered={false}
          size="sm"
          wrapperClassName="flex-1"
          value={selectedProductId}
          onChange={(e) => onSelectedProductIdChange(Number(e.target.value))}
        >
          {perpSymbols.map((s) => (
            <option key={s.product_id} value={s.product_id} className="bg-black">
              {s.symbol}
            </option>
          ))}
        </StyledSelect>
        <button
          type="button"
          onClick={onAddToBasket}
          disabled={basket.some((o) => o.product_id === selectedProductId)}
          className="px-3 py-1.5 bg-white text-black font-black text-[9px] uppercase tracking-widest border-l-2 border-white/20 hover:bg-green-400 transition-colors disabled:opacity-50 rounded-none"
        >
          Add
        </button>
      </div>

      {basket.length > 1 && (
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={onSplitModeEqual}
            className={`text-[9px] uppercase font-black tracking-widest px-2 py-1 border-2 rounded-none ${
              splitMode === "equal"
                ? "border-green-400 text-green-400"
                : "border-white/20 text-gray-500"
            }`}
          >
            Equal
          </button>
          <button
            type="button"
            onClick={onSplitModeManual}
            className={`text-[9px] uppercase font-black tracking-widest px-2 py-1 border-2 rounded-none ${
              splitMode === "manual"
                ? "border-white text-white"
                : "border-white/20 text-gray-500"
            }`}
          >
            Manual
          </button>
        </div>
      )}

      <div className="space-y-1.5 flex-1 min-h-0 overflow-y-auto custom-scrollbar">
        {basket.map((order) => (
          <div
            key={order.product_id}
            className="flex items-center gap-1.5 p-1 border-2 border-white/20 bg-black"
          >
            <span className="text-white text-[9px] font-black w-8 shrink-0 text-center">
              {order.symbol.split("-")[0]}
            </span>
            <SideToggle
              isBuy={order.is_buy}
              onChange={(v) => onUpdateItem(order.product_id, "is_buy", v)}
            />
            <div className="flex items-center flex-1 border-2 border-transparent focus-within:border-white/20 px-1">
              <span className="text-green-400 text-[9px] mr-1">$</span>
              <input
                type="number"
                step="any"
                min="0"
                value={order.amount}
                onChange={(e) =>
                  onUpdateItem(order.product_id, "amount", e.target.value)
                }
                className="bg-transparent text-white text-[10px] font-bold outline-none w-full rounded-none"
              />
            </div>
            <button
              type="button"
              onClick={() => onRemoveFromBasket(order.product_id)}
              className="text-gray-600 hover:text-red-500 font-black px-1"
            >
              ×
            </button>
          </div>
        ))}
      </div>

      {basket.length > 0 && (
        <label className="flex items-center gap-2 border-2 border-white/20 p-2 text-[9px] font-black uppercase tracking-widest text-gray-400 cursor-pointer">
          <input
            type="checkbox"
            checked={stopOnFailure}
            onChange={(e) => onStopOnFailureChange(e.target.checked)}
            className="w-3 h-3 accent-green-400 rounded-none"
          />
          Stop on first failure
        </label>
      )}

      {feedback && (
        <div
          className={`text-[9px] font-black p-2 border-2 uppercase tracking-widest ${
            feedback.type === "error"
              ? "border-red-500 text-red-500"
              : "border-green-400 text-green-400"
          }`}
        >
          {feedback.msg}
        </div>
      )}

      <button
        type="button"
        onClick={onSubmit}
        disabled={!canSubmit || isSubmitting}
        className={`w-full py-3 border-2 text-xs font-black uppercase tracking-[0.2em] rounded-none mt-auto shrink-0 ${
          !canSubmit || isSubmitting
            ? "border-gray-800 text-gray-600 cursor-not-allowed"
            : "border-green-400 text-green-400 hover:bg-green-400 hover:text-black"
        }`}
      >
        {isSubmitting
          ? "Processing..."
          : `Execute ${basket.length} Order${basket.length !== 1 ? "s" : ""}`}
      </button>
    </div>
  );
};
