import { useState } from "react";
import { usePrivy } from "@privy-io/react-auth";
import { placeMarketOrder } from "../../services/tradeApi";

interface MarketOrderPanelProps {
  productId: number;
}

export const MarketOrderPanel = ({ productId }: MarketOrderPanelProps) => {
  const { getAccessToken } = usePrivy();

  const [isBuy, setIsBuy] = useState<boolean>(true);
  const [amount, setAmount] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [feedback, setFeedback] = useState<{
    type: "error" | "success";
    msg: string;
  } | null>(null);

  const handleSubmit = async () => {
    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setFeedback({ type: "error", msg: "Invalid amount" });
      return;
    }

    try {
      setIsSubmitting(true);
      setFeedback(null);

      const token = await getAccessToken();
      if (!token) throw new Error("Auth error. Reconnect wallet.");

      const payload = {
        product_id: productId,
        amount: parsedAmount,
        is_buy: isBuy,
        is_market: true,
      };

      const result = await placeMarketOrder(payload, token);

      setFeedback({ type: "success", msg: "ORDER EXECUTED" });
      setAmount("");
    } catch (err: any) {
      setFeedback({ type: "error", msg: err.message || "EXECUTION FAILED" });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full flex flex-col gap-5">
      <div className="flex justify-between items-center">
        <h2 className="text-white font-black uppercase tracking-[0.1em] text-lg">
          Execution
        </h2>
        <span className="border-2 border-white/20 text-white text-[10px] font-bold px-2 py-1 uppercase tracking-widest">
          IOC
        </span>
      </div>

      <OrderSideToggle isBuy={isBuy} onChange={setIsBuy} />
      <OrderAmountInput amount={amount} onChange={setAmount} />

      {feedback && (
        <div
          className={`text-xs font-bold p-3 border-2 uppercase tracking-wide ${
            feedback.type === "error"
              ? "border-red-500 text-red-500 bg-red-500/10"
              : "border-green-400 text-green-400 bg-green-400/10"
          }`}
        >
          {feedback.msg}
        </div>
      )}

      <OrderSubmitButton
        isBuy={isBuy}
        isSubmitting={isSubmitting}
        disabled={!amount || parseFloat(amount) <= 0}
        onClick={handleSubmit}
      />
    </div>
  );
};

// --- СТРОГИЕ ПОДКОМПОНЕНТЫ ---

export const OrderSideToggle = ({
  isBuy,
  onChange,
}: {
  isBuy: boolean;
  onChange: (b: boolean) => void;
}) => (
  <div className="flex w-full border-2 border-white/20 bg-black">
    <button
      type="button"
      onClick={() => onChange(true)}
      className={`flex-1 py-3 text-xs font-black uppercase tracking-[0.15em] transition-colors ${
        isBuy ? "bg-green-400 text-black" : "text-gray-500 hover:text-white"
      }`}
    >
      Buy / Long
    </button>
    <button
      type="button"
      onClick={() => onChange(false)}
      className={`flex-1 py-3 text-xs font-black uppercase tracking-[0.15em] border-l-2 border-white/20 transition-colors ${
        !isBuy ? "bg-white text-black" : "text-gray-500 hover:text-white"
      }`}
    >
      Sell / Short
    </button>
  </div>
);

export const OrderAmountInput = ({
  amount,
  onChange,
}: {
  amount: string;
  onChange: (v: string) => void;
}) => (
  <div className="flex flex-col gap-2">
    <label className="text-[10px] text-gray-500 font-bold uppercase tracking-[0.2em]">
      Amount (USD)
    </label>
    <div className="flex items-center bg-black border-2 border-white/20 p-3 focus-within:border-green-400 transition-colors">
      <input
        type="number"
        step="any"
        min="0"
        value={amount}
        onChange={(e) => onChange(e.target.value)}
        placeholder="0.00"
        className="bg-transparent text-white text-xl outline-none w-full placeholder-gray-700 font-mono font-bold rounded-none"
      />
      <span className="text-gray-600 text-sm font-black pl-3 border-l-2 border-white/20 ml-3">
        USD
      </span>
    </div>
  </div>
);

export const OrderSubmitButton = ({
  isBuy,
  isSubmitting,
  onClick,
  disabled,
}: any) => {
  const baseClass = isBuy
    ? "bg-black border-green-400 text-green-400 hover:bg-green-400 hover:text-black"
    : "bg-black border-white text-white hover:bg-white hover:text-black";

  const disabledClass =
    "border-gray-800 text-gray-600 cursor-not-allowed bg-black";

  return (
    <button
      onClick={onClick}
      disabled={disabled || isSubmitting}
      className={`w-full py-4 mt-2 border-2 text-sm font-black uppercase tracking-[0.2em] transition-colors rounded-none ${
        disabled || isSubmitting ? disabledClass : baseClass
      }`}
    >
      {isSubmitting ? (
        <span className="flex items-center justify-center gap-3">
          <div className="w-4 h-4 border-2 border-current border-t-transparent animate-spin" />
          PROCESSING
        </span>
      ) : isBuy ? (
        "Execute Long"
      ) : (
        "Execute Short"
      )}
    </button>
  );
};
