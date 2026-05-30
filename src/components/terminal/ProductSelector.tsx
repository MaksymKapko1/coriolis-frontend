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

  return (
    <div className="flex flex-col gap-2 w-full bg-black border-2 border-white/20 p-4">
      <label className="text-[10px] text-green-400 font-bold uppercase tracking-[0.2em]">
        Active Market Selection
      </label>
      <div className="relative">
        <select
          value={selectedProductId}
          onChange={(e) => onSelect(Number(e.target.value))}
          className="w-full bg-black text-white font-mono font-bold text-lg border-2 border-white/20 p-3 appearance-none outline-none focus:border-green-400 cursor-pointer transition-colors rounded-none"
        >
          {perpProducts.map((prod) => (
            <option
              key={prod.product_id}
              value={prod.product_id}
              className="bg-black text-white font-mono"
            >
              {prod.symbol} (ID: {prod.product_id})
            </option>
          ))}
        </select>
        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-white">
          <svg className="fill-current h-4 w-4" viewBox="0 0 20 20">
            <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
          </svg>
        </div>
      </div>
    </div>
  );
};
