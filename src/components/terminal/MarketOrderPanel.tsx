import { useState, useEffect } from "react";
import { usePrivy } from "@privy-io/react-auth";
import {
  placeMarketOrder,
  placeLimitOrder,
  fetchOpenOrders,
  cancelLimitOrders,
  type LimitOrderResponse,
} from "../../services/tradeApi";
import { type NadoSymbol } from "../../services/nadoApi";

interface MarketOrderPanelProps {
  productId: number;
  symbols: Record<number, NadoSymbol>;
}

const formatSymbol = (
  symbols: Record<number, NadoSymbol>,
  productId: number,
  fallback?: string,
) => {
  const fromMap = symbols[productId]?.symbol;
  if (fromMap) return fromMap.replace(/-PERP$/i, "");
  if (fallback && fallback !== String(productId)) {
    return fallback.replace(/-PERP$/i, "");
  }
  return `ID ${productId}`;
};

type PanelView = "create" | "list";
type OrderType = "market" | "limit";

const MIN_LIMIT_NOTIONAL_USD = 100;

const formatUsd = (n: number) =>
  n.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

export const MarketOrderPanel = ({ productId, symbols }: MarketOrderPanelProps) => {
  const { getAccessToken } = usePrivy();

  const [panelView, setPanelView] = useState<PanelView>("create");

  const [orderType, setOrderType] = useState<OrderType>("market");
  const [isBuy, setIsBuy] = useState<boolean>(true);

  // Стейты инпутов
  const [amount, setAmount] = useState<string>("");
  const [price, setPrice] = useState<string>("");
  const [tpPrice, setTpPrice] = useState<string>("");
  const [slPrice, setSlPrice] = useState<string>("");

  const [openOrders, setOpenOrders] = useState<LimitOrderResponse[]>([]);
  const [cancellingDigest, setCancellingDigest] = useState<string | null>(null);

  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [feedback, setFeedback] = useState<{
    type: "error" | "success";
    msg: string;
  } | null>(null);

  const loadOrders = async () => {
    try {
      const token = await getAccessToken();
      if (token) {
        const data = await fetchOpenOrders(token);
        setOpenOrders(data);
      }
    } catch (err) {
      console.error("Error fetching open orders:", err);
    }
  };

  useEffect(() => {
    loadOrders();
    const interval = setInterval(loadOrders, 4000);
    return () => clearInterval(interval);
  }, [getAccessToken]);

  useEffect(() => {
    if (panelView === "list") {
      loadOrders();
    }
  }, [panelView]);

  const handleCancelOrder = async (prodId: number, digest: string) => {
    setCancellingDigest(digest);
    try {
      const token = await getAccessToken();
      if (!token) throw new Error("AUTH ERROR");

      await cancelLimitOrders(
        { product_ids: [prodId], digests: [digest] },
        token,
      );

      setOpenOrders((prev) => prev.filter((o) => o.digest !== digest));
    } catch (err: any) {
      alert(err.message || "CANCEL FAILED");
    } finally {
      setCancellingDigest(null);
    }
  };

  const handleSubmit = async () => {
    const parsedAmount = parseFloat(amount);

    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setFeedback({ type: "error", msg: "INVALID AMOUNT" });
      return;
    }

    if (orderType === "limit" && parsedAmount < MIN_LIMIT_NOTIONAL_USD) {
      setFeedback({
        type: "error",
        msg: `MIN ORDER SIZE $${MIN_LIMIT_NOTIONAL_USD}`,
      });
      return;
    }

    let parsedTpPrice: number | null = null;
    let parsedSlPrice: number | null = null;

    if (orderType === "limit") {
      const parsedPrice = parseFloat(price);
      if (isNaN(parsedPrice) || parsedPrice <= 0) {
        setFeedback({ type: "error", msg: "INVALID LIMIT PRICE" });
        return;
      }

      // Валидация TP
      if (tpPrice) {
        parsedTpPrice = parseFloat(tpPrice);
        if (isNaN(parsedTpPrice) || parsedTpPrice <= 0) {
          setFeedback({ type: "error", msg: "INVALID TAKE PROFIT PRICE" });
          return;
        }
      }

      // Валидация SL
      if (slPrice) {
        parsedSlPrice = parseFloat(slPrice);
        if (isNaN(parsedSlPrice) || parsedSlPrice <= 0) {
          setFeedback({ type: "error", msg: "INVALID STOP LOSS PRICE" });
          return;
        }
      }
    }

    try {
      setIsSubmitting(true);
      setFeedback(null);

      const token = await getAccessToken();
      if (!token) throw new Error("AUTH ERROR. PLEASE RECONNECT.");

      if (orderType === "market") {
        await placeMarketOrder(
          {
            product_id: productId,
            amount: parsedAmount,
            is_buy: isBuy,
            is_market: true,
          },
          token,
        );
        setFeedback({ type: "success", msg: "MARKET ORDER EXECUTED" });
      } else {
        const limitPayload: Parameters<typeof placeLimitOrder>[0] = {
          product_id: productId,
          symbol: symbols[productId]?.symbol,
          price_usd: parseFloat(price),
          notional_usd: parsedAmount,
          is_buy: isBuy,
        };
        if (parsedTpPrice != null) {
          limitPayload.take_profit_price = parsedTpPrice;
        }
        if (parsedSlPrice != null) {
          limitPayload.stop_loss_price = parsedSlPrice;
        }

        const limitResult = await placeLimitOrder(limitPayload, token);
        let successMsg = "LIMIT ORDER PLACED";
        if (limitResult?.tp_status === "success") {
          successMsg += " + TP";
        } else if (parsedTpPrice != null && limitResult?.tp_status) {
          successMsg += ` (TP: ${limitResult.tp_status})`;
        }
        if (limitResult?.sl_status === "success") {
          successMsg += " + SL";
        }
        setFeedback({ type: "success", msg: successMsg });
        loadOrders();
      }

      // Очистка полей
      setAmount("");
      if (orderType === "limit") {
        setPrice("");
        setTpPrice("");
        setSlPrice("");
      }

      setTimeout(() => setFeedback(null), 4000);
    } catch (err: any) {
      setFeedback({ type: "error", msg: err.message || "EXECUTION FAILED" });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full flex flex-col gap-4 font-sans text-white">
      <div className="grid grid-cols-2 border-2 border-white/20 bg-black">
        <button
          type="button"
          onClick={() => setPanelView("create")}
          className={`py-2.5 text-xs font-black uppercase tracking-[0.15em] transition-colors ${
            panelView === "create"
              ? "bg-green-400 text-black"
              : "text-gray-500 hover:text-white"
          }`}
        >
          New Order
        </button>
        <button
          type="button"
          onClick={() => {
            setPanelView("list");
            loadOrders();
          }}
          className={`border-l-2 border-white/20 py-2.5 text-xs font-black uppercase tracking-[0.15em] transition-colors ${
            panelView === "list"
              ? "bg-green-400 text-black"
              : "text-gray-500 hover:text-white"
          }`}
        >
          Open Orders ({openOrders.length})
        </button>
      </div>

      {panelView === "create" && (
        <div className="flex flex-col gap-4">
          <div className="flex justify-between items-center">
            <h3 className="text-gray-400 font-black uppercase tracking-[0.1em] text-xs">
              Configuration
            </h3>
            <span className="border border-white/20 text-gray-400 text-[9px] font-bold px-1.5 py-0.5 uppercase tracking-widest">
              {orderType === "market" ? "IOC" : "GTC"}
            </span>
          </div>

          <div className="flex w-full border-2 border-white/20 bg-black">
            <button
              type="button"
              onClick={() => {
                setOrderType("market");
                setFeedback(null);
              }}
              className={`flex-1 py-1.5 text-[10px] font-black uppercase tracking-[0.15em] transition-colors ${
                orderType === "market"
                  ? "bg-white text-black"
                  : "text-gray-500 hover:text-white"
              }`}
            >
              Market
            </button>
            <button
              type="button"
              onClick={() => {
                setOrderType("limit");
                setFeedback(null);
              }}
              className={`flex-1 py-1.5 text-[10px] font-black uppercase tracking-[0.15em] border-l-2 border-white/20 transition-colors ${
                orderType === "limit"
                  ? "bg-white text-black"
                  : "text-gray-500 hover:text-white"
              }`}
            >
              Limit
            </button>
          </div>

          <div className="flex w-full border-2 border-white/20 bg-black">
            <button
              type="button"
              onClick={() => setIsBuy(true)}
              className={`flex-1 py-2 text-xs font-black uppercase tracking-[0.15em] transition-colors ${
                isBuy
                  ? "bg-green-400 text-black"
                  : "text-gray-500 hover:text-white"
              }`}
            >
              Buy / Long
            </button>
            <button
              type="button"
              onClick={() => setIsBuy(false)}
              className={`flex-1 py-2 text-xs font-black uppercase tracking-[0.15em] border-l-2 border-white/20 transition-colors ${
                !isBuy
                  ? "bg-white text-black"
                  : "text-gray-500 hover:text-white"
              }`}
            >
              Sell / Short
            </button>
          </div>

          <div className="flex flex-col gap-3">
            {orderType === "limit" && (
              <div className="flex flex-col gap-3">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[9px] text-gray-500 font-bold uppercase tracking-[0.2em]">
                    Limit Price (USD)
                  </label>
                  <div className="flex items-center bg-black border-2 border-white/20 px-3 py-2 focus-within:border-white/50 transition-colors">
                    <input
                      type="number"
                      step="any"
                      min="0"
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                      placeholder="0.00"
                      className="bg-transparent text-white text-base identity-none outline-none w-full placeholder-gray-800 font-mono font-bold rounded-none"
                    />
                    <span className="text-gray-600 font-black text-xs ml-2">
                      USD
                    </span>
                  </div>
                </div>

                {/* БЛОК TP / SL В ДВЕ КОЛОНКИ */}
                <div className="flex gap-3">
                  <div className="flex-1 flex flex-col gap-1.5">
                    <label className="text-[9px] text-gray-500 font-bold uppercase tracking-[0.2em]">
                      Take Profit
                    </label>
                    <div className="flex items-center bg-black border-2 border-white/20 px-2 py-2 focus-within:border-green-400/50 transition-colors">
                      <input
                        type="number"
                        step="any"
                        min="0"
                        value={tpPrice}
                        onChange={(e) => setTpPrice(e.target.value)}
                        placeholder="None"
                        className="bg-transparent text-white text-sm outline-none w-full placeholder-gray-800 font-mono font-bold rounded-none"
                      />
                    </div>
                  </div>

                  <div className="flex-1 flex flex-col gap-1.5">
                    <label className="text-[9px] text-gray-500 font-bold uppercase tracking-[0.2em]">
                      Stop Loss
                    </label>
                    <div className="flex items-center bg-black border-2 border-white/20 px-2 py-2 focus-within:border-red-500/50 transition-colors">
                      <input
                        type="number"
                        step="any"
                        min="0"
                        value={slPrice}
                        onChange={(e) => setSlPrice(e.target.value)}
                        placeholder="None"
                        className="bg-transparent text-white text-sm outline-none w-full placeholder-gray-800 font-mono font-bold rounded-none"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="flex flex-col gap-1.5">
              <div className="flex items-baseline justify-between gap-2">
                <label className="text-[9px] text-gray-500 font-bold uppercase tracking-[0.2em]">
                  Amount (USD)
                </label>
                {orderType === "limit" && (
                  <span className="text-[9px] text-amber-400/90 font-bold uppercase tracking-[0.15em] shrink-0">
                    Min order size ${MIN_LIMIT_NOTIONAL_USD}
                  </span>
                )}
              </div>
              <div className="flex items-center bg-black border-2 border-white/20 px-3 py-2 focus-within:border-white/50 transition-colors">
                <input
                  type="number"
                  step="any"
                  min={orderType === "limit" ? MIN_LIMIT_NOTIONAL_USD : 0}
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder={
                    orderType === "limit"
                      ? String(MIN_LIMIT_NOTIONAL_USD)
                      : "0.00"
                  }
                  className="bg-transparent text-white text-base identity-none outline-none w-full placeholder-gray-800 font-mono font-bold rounded-none"
                />
                <span className="text-gray-600 font-black text-xs ml-2">
                  USD
                </span>
              </div>
            </div>
          </div>

          {feedback && (
            <div
              className={`text-[10px] font-black p-2.5 border-2 uppercase tracking-[0.15em] ${
                feedback.type === "error"
                  ? "border-red-500 text-red-500 bg-red-500/10"
                  : "border-green-400 text-green-400 bg-green-400/10"
              }`}
            >
              {feedback.msg}
            </div>
          )}

          <button
            onClick={handleSubmit}
            disabled={
              isSubmitting || !amount || (orderType === "limit" && !price)
            }
            className={`w-full py-3.5 border-2 text-xs font-black uppercase tracking-[0.2em] transition-colors rounded-none mt-1 ${
              isSubmitting || !amount || (orderType === "limit" && !price)
                ? "border-gray-800 text-gray-600 cursor-not-allowed bg-black"
                : isBuy
                  ? "bg-black border-green-400 text-green-400 hover:bg-green-400 hover:text-black"
                  : "bg-black border-white text-white hover:bg-white hover:text-black"
            }`}
          >
            {isSubmitting
              ? "PROCESSING..."
              : `EXECUTE ${isBuy ? "LONG" : "SHORT"}`}
          </button>
        </div>
      )}

      {panelView === "list" && (
        <div className="flex flex-col gap-2 max-h-[400px] overflow-y-auto pr-1 custom-scrollbar">
          {openOrders.length === 0 ? (
            <div className="flex items-center justify-center h-24 border-2 border-dashed border-white/10 bg-black text-center">
              <p className="text-[10px] uppercase font-black tracking-[0.2em] text-gray-600">
                No Open Orders
              </p>
            </div>
          ) : (
            openOrders.map((order) => (
              <div
                key={order.digest}
                className="border-2 border-white/20 bg-black p-3 flex flex-col gap-2 relative group hover:border-white/40 transition-colors"
              >
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <span className="font-black text-sm uppercase tracking-tight">
                      {formatSymbol(symbols, order.product_id, order.symbol)}
                    </span>
                    <span
                      className={`text-[8px] font-black tracking-widest px-1 py-0.2 border ${
                        order.is_buy
                          ? "text-green-400 border-green-400/30 bg-green-400/5"
                          : "text-red-500 border-red-500/30 bg-red-500/5"
                      }`}
                    >
                      {order.is_buy ? "BUY" : "SELL"}
                    </span>
                  </div>

                  <button
                    onClick={() =>
                      handleCancelOrder(order.product_id, order.digest)
                    }
                    disabled={cancellingDigest === order.digest}
                    className="text-gray-500 hover:text-red-500 transition-colors font-black text-xl leading-none px-1 disabled:opacity-40"
                    title="Cancel Limit Order"
                  >
                    {cancellingDigest === order.digest ? (
                      <div className="w-3 h-3 border border-red-500 border-t-transparent animate-spin" />
                    ) : (
                      "×"
                    )}
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-1 border-t border-white/5 pt-2 font-mono text-[11px]">
                  <div>
                    <span className="text-[8px] text-gray-600 block uppercase font-sans font-bold tracking-wider">
                      PRICE
                    </span>
                    <span className="text-white font-bold">
                      ${formatUsd(order.price_usd)}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-[8px] text-gray-600 block uppercase font-sans font-bold tracking-wider">
                      SIZE
                    </span>
                    <span className="text-gray-400">
                      ${formatUsd(order.notional_usd)}
                    </span>
                  </div>
                  {(order.take_profit_price != null ||
                    order.stop_loss_price != null) && (
                    <>
                      <div>
                        <span className="text-[8px] text-green-500/70 block uppercase font-sans font-bold tracking-wider">
                          TP
                        </span>
                        <span className="text-green-400 font-bold">
                          {order.take_profit_price != null
                            ? `$${formatUsd(order.take_profit_price)}`
                            : "—"}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-[8px] text-red-500/70 block uppercase font-sans font-bold tracking-wider">
                          SL
                        </span>
                        <span className="text-red-400 font-bold">
                          {order.stop_loss_price != null
                            ? `$${formatUsd(order.stop_loss_price)}`
                            : "—"}
                        </span>
                      </div>
                    </>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};
