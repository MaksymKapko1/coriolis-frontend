import { type NadoSymbol } from "../../services/nadoApi.ts";

interface ProductSelectorProps {
  symbols: Record<number, NadoSymbol>;
  selectedProductId: number;
  onSelect: (productId: number) => void;
}

export const ProductSelector = ({
  symbols,
  selectedProductId,
  onSelect,
}: ProductSelectorProps) => {
  const perpProducts = Object.values(symbols).filter(
    (sym) => sym.type === "perp",
  );

  const currentSymbol = symbols[selectedProductId]?.symbol || "Select Asset";

  return (
    <div className="flex flex-col gap-1 w-full max-w-sm bg-gray-950 p-4 rounded-xl border border-gray-800 mb-6">
      <label className="text-xs text-gray-500 font-mono tracking-wider">
        ACTIVE MARKET
      </label>
      <div className="relative mt-1">
        <select
          value={selectedProductId}
          onChange={(e) => onSelect(Number(e.target.value))}
          className="w-full bg-gray-900 text-white font-mono font-bold border border-gray-800 rounded-lg p-3 appearance-none outline-none focus:border-purple-500 cursor-pointer transition-colors"
        >
          {perpProducts.map((prod) => (
            <option
              key={prod.product_id}
              value={prod.product_id}
              className="bg-gray-950 text-white font-mono"
            >
              {prod.symbol} (ID: {prod.product_id})
            </option>
          ))}
        </select>
        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-400">
          <svg
            className="fill-current h-4 w-4"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
          >
            <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
          </svg>
        </div>
      </div>
    </div>
  );
};
