/**
 * Nado perp symbol → TradingView ticker (chart data proxy).
 * Prefer liquid feeds that exist on TradingView (Binance / Bybit / TVC / FX / NASDAQ).
 */
const TV_SYMBOL_MAP: Record<string, string> = {
  "BTC-PERP": "BINANCE:BTCUSDT",
  "ETH-PERP": "BINANCE:ETHUSDT",
  "SOL-PERP": "BINANCE:SOLUSDT",
  "ARB-PERP": "BINANCE:ARBUSDT",
  "BNB-PERP": "BINANCE:BNBUSDT",
  "DOGE-PERP": "BINANCE:DOGEUSDT",
  "XRP-PERP": "BINANCE:XRPUSDT",
  "SUI-PERP": "BINANCE:SUIUSDT",
  "NEAR-PERP": "BINANCE:NEARUSDT",
  "TON-PERP": "BINANCE:TONUSDT",
  "ADA-PERP": "BINANCE:ADAUSDT",
  "AVAX-PERP": "BINANCE:AVAXUSDT",
  "LINK-PERP": "BINANCE:LINKUSDT",
  "LTC-PERP": "BINANCE:LTCUSDT",
  "BCH-PERP": "BINANCE:BCHUSDT",
  "AAVE-PERP": "BINANCE:AAVEUSDT",
  "UNI-PERP": "BINANCE:UNIUSDT",
  "JUP-PERP": "BINANCE:JUPUSDT",
  "ENA-PERP": "BINANCE:ENAUSDT",
  "TAO-PERP": "BINANCE:TAOUSDT",
  "ZEC-PERP": "BINANCE:ZECUSDT",
  "ZRO-PERP": "BINANCE:ZROUSDT",
  "AXS-PERP": "BINANCE:AXSUSDT",
  "BERA-PERP": "BYBIT:BERAUSDT",
  "PENGU-PERP": "BINANCE:PENGUUSDT",
  "KBONK-PERP": "BINANCE:1000BONKUSDT",
  "KPEPE-PERP": "BINANCE:1000PEPEUSDT",

  "HYPE-PERP": "BYBIT:HYPEUSDT.P",
  "ASTER-PERP": "BYBIT:ASTERUSDT",
  "MON-PERP": "BYBIT:MONUSDT",
  "ONDO-PERP": "BINANCE:ONDOUSDT",
  "LIT-PERP": "BYBIT:LITUSDT",
  "PUMP-PERP": "BYBIT:PUMPUSDT",
  "FARTCOIN-PERP": "BYBIT:FARTCOINUSDT",
  "VIRTUAL-PERP": "BYBIT:VIRTUALUSDT",
  "MEGA-PERP": "BYBIT:MEGAUSDT",
  "SKY-PERP": "BYBIT:SKYUSDT",
  "SKR-PERP": "BYBIT:SKRUSDT",
  "VVV-PERP": "BYBIT:VVVUSDT",
  "XPL-PERP": "BYBIT:XPLUSDT",
  "WLFI-PERP": "BYBIT:WLFIUSDT",
  "USELESS-PERP": "BYBIT:USELESSUSDT",

  "WTI-PERP": "TVC:USOIL",
  "XAG-PERP": "TVC:SILVER",
  "XAUT-PERP": "TVC:GOLD",
  "EURUSD-PERP": "FX:EURUSD",
  "GBPUSD-PERP": "FX:GBPUSD",
  "USDJPY-PERP": "FX:USDJPY",

  "AAPL-PERP": "NASDAQ:AAPL",
  "AMZN-PERP": "NASDAQ:AMZN",
  "GOOGL-PERP": "NASDAQ:GOOGL",
  "META-PERP": "NASDAQ:META",
  "MSFT-PERP": "NASDAQ:MSFT",
  "NVDA-PERP": "NASDAQ:NVDA",
  "TSLA-PERP": "NASDAQ:TSLA",
  "SPY-PERP": "AMEX:SPY",
  "QQQ-PERP": "NASDAQ:QQQ",
};

const normalizeNadoSymbol = (symbol: string): string => {
  const upper = symbol.toUpperCase();
  if (upper.startsWith("K") && upper.length > 5) {
    return `K${upper.slice(1)}`;
  }
  return upper;
};

/** Suggested TradingView tickers for alts not in the explicit map. */
const altTvCandidates = (base: string): string[] => [
  `BYBIT:${base}USDT.P`,
  `BYBIT:${base}USDT`,
  `BINANCE:${base}USDT`,
  `KUCOIN:${base}USDT`,
];

export const nadoSymbolToTradingView = (symbol: string | undefined): string => {
  if (!symbol) return "BINANCE:BTCUSDT";

  const key = normalizeNadoSymbol(symbol);
  const mapped = TV_SYMBOL_MAP[key];
  if (mapped) return mapped;

  const base = key.replace(/-PERP$/i, "").replace(/^K/, "");
  if (!base) return "BINANCE:BTCUSDT";

  return altTvCandidates(base)[0];
};

/** All TV tickers to try when the widget reports an invalid symbol. */
export const tradingViewSymbolFallbacks = (
  symbol: string | undefined,
): string[] => {
  if (!symbol) return ["BINANCE:BTCUSDT"];

  const key = normalizeNadoSymbol(symbol);
  const primary = TV_SYMBOL_MAP[key];
  const base = key.replace(/-PERP$/i, "").replace(/^K/, "");

  const candidates = new Set<string>();
  if (primary) candidates.add(primary);
  if (base) altTvCandidates(base).forEach((c) => candidates.add(c));
  candidates.add("BINANCE:BTCUSDT");

  return [...candidates];
};
