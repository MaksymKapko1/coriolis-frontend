import { StyledSelect } from "../ui/StyledSelect.tsx";
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
      <StyledSelect
        label="Active Market Selection"
        size="lg"
        value={selectedProductId}
        onChange={(e) => onSelect(Number(e.target.value))}
        className="font-mono"
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
      </StyledSelect>
    </div>
  );
};
