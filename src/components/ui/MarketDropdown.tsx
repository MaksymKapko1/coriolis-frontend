import { useEffect, useMemo, useRef, useState } from "react";
import type { NadoSymbol } from "../../services/nadoApi.ts";

interface MarketDropdownProps {
  products: NadoSymbol[];
  value: number;
  onChange: (productId: number) => void;
  size?: "sm" | "lg";
}

const formatLabel = (symbol: string) =>
  symbol.replace(/-PERP$/i, "").toUpperCase();

export const MarketDropdown = ({
  products,
  value,
  onChange,
  size = "lg",
}: MarketDropdownProps) => {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const rootRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  const selected = products.find((p) => p.product_id === value);
  const label = selected ? formatLabel(selected.symbol) : "SELECT";

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return products;
    return products.filter((p) => {
      const sym = p.symbol.toLowerCase();
      const short = formatLabel(p.symbol).toLowerCase();
      return (
        sym.includes(q) ||
        short.includes(q) ||
        String(p.product_id).includes(q)
      );
    });
  }, [products, query]);

  useEffect(() => {
    if (!open) return;
    searchRef.current?.focus();
    const onPointerDown = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) {
        setOpen(false);
        setQuery("");
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        setQuery("");
      }
    };
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const triggerClass =
    size === "lg"
      ? "text-2xl font-black tracking-tight uppercase"
      : "text-xs font-black uppercase tracking-widest";

  return (
    <div ref={rootRef} className="relative w-fit">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={`group flex items-center gap-2 bg-black text-white outline-none transition-colors hover:text-green-400 ${triggerClass} ${open ? "text-green-400" : ""}`}
        aria-expanded={open}
        aria-haspopup="listbox"
      >
        <span>{label}</span>
        <span
          className={`inline-flex text-green-400 transition-transform ${open ? "rotate-180" : ""}`}
        >
          <svg className="fill-current h-4 w-4" viewBox="0 0 20 20">
            <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
          </svg>
        </span>
      </button>

      {open && (
        <div
          role="listbox"
          className="absolute left-0 top-full z-50 mt-2 w-[min(100vw-2rem,280px)] border-2 border-white/20 bg-black shadow-[4px_4px_0_0_rgba(74,222,128,0.15)]"
        >
          <div className="px-2 py-1.5 border-b border-white/10 bg-white/5">
            <span className="text-[9px] font-black uppercase tracking-[0.3em] text-gray-500">
              Markets
            </span>
          </div>

          <div className="p-2 border-b border-white/10">
            <input
              ref={searchRef}
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="SEARCH..."
              className="w-full bg-black border-2 border-white/20 text-white text-[10px] font-black uppercase tracking-widest px-2 py-1.5 outline-none focus:border-green-400 placeholder:text-gray-700 rounded-none"
            />
          </div>

          <div className="max-h-56 overflow-y-auto custom-scrollbar">
            {filtered.length === 0 ? (
              <p className="px-3 py-4 text-[10px] font-black uppercase tracking-widest text-gray-600 text-center">
                No markets found
              </p>
            ) : (
              filtered.map((prod) => {
                const active = prod.product_id === value;
                return (
                  <button
                    key={prod.product_id}
                    type="button"
                    role="option"
                    aria-selected={active}
                    onClick={() => {
                      onChange(prod.product_id);
                      setOpen(false);
                      setQuery("");
                    }}
                    className={`w-full text-left px-3 py-2 text-xs font-black uppercase tracking-widest transition-colors border-b border-white/5 last:border-b-0 ${
                      active
                        ? "bg-green-400 text-black"
                        : "text-white hover:bg-white/10 hover:text-green-400"
                    }`}
                  >
                    {formatLabel(prod.symbol)}
                    <span
                      className={`ml-2 text-[9px] ${active ? "text-black/60" : "text-gray-600"}`}
                    >
                      PERP
                    </span>
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};
