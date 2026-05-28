import { useState } from "react";
import { usePrivy } from "@privy-io/react-auth";
import { OrderSideToggle } from "./OrderSideToggle";
import { OrderAmountInput } from "./OrderAmountInput";
import { OrderSubmitButton } from "./OrderSubmitButton";
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
      setFeedback({ type: "error", msg: "Please enter a valid amount" });
      return;
    }

    try {
      setIsSubmitting(true);
      setFeedback(null);

      const token = await getAccessToken();
      if (!token)
        throw new Error("Authentication error. Please reconnect wallet.");

      const payload = {
        product_id: productId,
        amount: parsedAmount,
        is_buy: isBuy,
        is_market: true,
      };

      const result = await placeMarketOrder(payload, token);

      setFeedback({ type: "success", msg: "Order executed successfully!" });
      setAmount("");
      console.log(">>> [TRADE SUCCESS]", result);
    } catch (err: any) {
      console.error(">>> [TRADE ERROR]", err);
      setFeedback({
        type: "error",
        msg: err.message || "Failed to execute order",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-gray-950 p-4 rounded-xl border border-gray-800 w-full max-w-sm">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-white font-bold text-lg">Market Order</h2>
        <span className="bg-purple-500/20 text-purple-400 text-xs px-2 py-1 rounded">
          IOC
        </span>
      </div>

      <OrderSideToggle isBuy={isBuy} onChange={setIsBuy} />

      <OrderAmountInput amount={amount} onChange={setAmount} />

      {feedback && (
        <div
          className={`mt-4 text-sm p-2 rounded ${
            feedback.type === "error"
              ? "bg-red-500/10 text-red-400"
              : "bg-green-500/10 text-green-400"
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
