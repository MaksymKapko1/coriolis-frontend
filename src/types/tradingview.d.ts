interface TradingViewWidgetOptions {
  container_id: string;
  autosize?: boolean;
  width?: string | number;
  height?: string | number;
  symbol: string;
  interval?: string;
  timezone?: string;
  theme?: string;
  style?: string;
  locale?: string;
  toolbar_bg?: string;
  enable_publishing?: boolean;
  hide_top_toolbar?: boolean;
  hide_side_toolbar?: boolean;
  hide_legend?: boolean;
  save_image?: boolean;
  studies?: string[];
  show_popup_button?: boolean;
  allow_symbol_change?: boolean;
  backgroundColor?: string;
  gridColor?: string;
  overrides?: Record<string, string>;
}

interface TradingViewNamespace {
  widget: new (options: TradingViewWidgetOptions) => unknown;
}

interface Window {
  TradingView?: TradingViewNamespace;
}
