import { useEffect, useId, useRef, useState } from "react";
import {
  nadoSymbolToTradingView,
  tradingViewSymbolFallbacks,
} from "../../config/tradingViewSymbols.ts";

let scriptPromise: Promise<void> | null = null;

const loadTradingViewScript = (): Promise<void> => {
  if (window.TradingView) return Promise.resolve();
  if (scriptPromise) return scriptPromise;

  scriptPromise = new Promise((resolve, reject) => {
    const existing = document.querySelector('script[data-tv="1"]');
    if (existing) {
      existing.addEventListener("load", () => resolve());
      existing.addEventListener("error", () => reject(new Error("TV script failed")));
      return;
    }
    const script = document.createElement("script");
    script.src = "https://s3.tradingview.com/tv.js";
    script.async = true;
    script.dataset.tv = "1";
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Failed to load TradingView"));
    document.head.appendChild(script);
  });

  return scriptPromise;
};

interface TradingViewChartProps {
  symbol: string | undefined;
  className?: string;
}

export const TradingViewChart = ({
  symbol,
  className = "",
}: TradingViewChartProps) => {
  const reactId = useId().replace(/:/g, "");
  const containerId = `tv-chart-${reactId}`;
  const containerRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [fallbackIndex, setFallbackIndex] = useState(0);

  const fallbacks = tradingViewSymbolFallbacks(symbol);
  const tvSymbol = fallbacks[fallbackIndex] ?? nadoSymbolToTradingView(symbol);

  useEffect(() => {
    setFallbackIndex(0);
  }, [symbol]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    let cancelled = false;
    setLoading(true);
    setError(null);
    el.innerHTML = "";

    loadTradingViewScript()
      .then(() => {
        if (cancelled || !window.TradingView) return;

        el.innerHTML = `<div id="${containerId}" class="w-full h-full" />`;

        new window.TradingView.widget({
          container_id: containerId,
          autosize: true,
          symbol: tvSymbol,
          interval: "15",
          timezone: "Etc/UTC",
          theme: "dark",
          style: "1",
          locale: "en",
          toolbar_bg: "#000000",
          backgroundColor: "#000000",
          gridColor: "rgba(255, 255, 255, 0.06)",
          enable_publishing: false,
          allow_symbol_change: false,
          hide_side_toolbar: false,
          hide_top_toolbar: false,
          hide_legend: false,
          save_image: false,
          show_popup_button: false,
          studies: [],
          overrides: {
            "paneProperties.background": "#000000",
            "paneProperties.backgroundType": "solid",
            "paneProperties.vertGridProperties.color": "rgba(255, 255, 255, 0.06)",
            "paneProperties.horzGridProperties.color": "rgba(255, 255, 255, 0.06)",
            "scalesProperties.textColor": "#9ca3af",
            "mainSeriesProperties.candleStyle.upColor": "#4ade80",
            "mainSeriesProperties.candleStyle.downColor": "#ef4444",
            "mainSeriesProperties.candleStyle.borderUpColor": "#4ade80",
            "mainSeriesProperties.candleStyle.borderDownColor": "#ef4444",
            "mainSeriesProperties.candleStyle.wickUpColor": "#4ade80",
            "mainSeriesProperties.candleStyle.wickDownColor": "#ef4444",
          },
        });

        if (!cancelled) setLoading(false);
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Chart unavailable");
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
      if (el) el.innerHTML = "";
    };
  }, [containerId, tvSymbol]);

  const tryNextFeed = () => {
    if (fallbackIndex < fallbacks.length - 1) {
      setFallbackIndex((i) => i + 1);
    }
  };

  return (
    <div className={`relative w-full h-full min-h-[380px] ${className}`}>
      <div className="absolute top-2 right-2 z-20 flex items-center gap-2">
        <span className="text-[8px] font-black uppercase tracking-widest text-gray-600 bg-black/80 px-1.5 py-0.5 border border-white/10">
          {tvSymbol}
        </span>
        {fallbackIndex < fallbacks.length - 1 && (
          <button
            type="button"
            onClick={tryNextFeed}
            className="text-[8px] font-black uppercase tracking-widest text-green-400 border border-green-400/40 px-1.5 py-0.5 hover:bg-green-400 hover:text-black transition-colors"
          >
            Alt feed
          </button>
        )}
      </div>
      {loading && !error && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-black/90">
          <div className="w-6 h-6 border-2 border-green-400/20 border-t-green-400 animate-spin mb-3" />
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-500">
            Loading chart
          </p>
        </div>
      )}
      {error && (
        <div className="absolute inset-0 flex items-center justify-center border-2 border-red-500/40 bg-black p-6">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-red-500">
            {error}
          </p>
        </div>
      )}
      <div ref={containerRef} className="w-full h-full min-h-[380px]" />
    </div>
  );
};
