import { useMemo, useState } from "react";
import type { TradingIndex, IndexAsset } from "../../../services/indexApi.ts";

const shortSymbol = (symbol: string) =>
  symbol.replace(/-PERP$/i, "").toUpperCase();

const AssetChip = ({
  asset,
  dimmed,
}: {
  asset: IndexAsset;
  dimmed?: boolean;
}) => {
  const isLong = asset.is_buy;
  return (
    <span
      className={`inline-flex items-center gap-1 px-1.5 py-0.5 border text-[8px] font-black uppercase tracking-wider ${
        isLong
          ? dimmed
            ? "border-green-400/30 text-green-400/80 bg-green-400/5"
            : "border-green-400/60 text-green-400 bg-green-400/15"
          : dimmed
            ? "border-red-500/30 text-red-400/80 bg-red-500/5"
            : "border-red-500/60 text-red-400 bg-red-500/15"
      }`}
    >
      <span className={isLong ? "text-green-400" : "text-red-400"}>
        {isLong ? "L" : "S"}
      </span>
      <span className="text-white">{shortSymbol(asset.symbol)}</span>
      <span className="text-gray-500">
        {((asset.weight || 0) * 100).toFixed(0)}%
      </span>
    </span>
  );
};

const CompositionLine = ({
  assets,
  dimmed,
}: {
  assets: IndexAsset[];
  dimmed?: boolean;
}) => (
  <div className="mt-2 flex flex-wrap gap-1">
    {assets.map((a) => (
      <AssetChip key={a.product_id} asset={a} dimmed={dimmed} />
    ))}
  </div>
);

interface IndexPickerPanelProps {
  systemIndexes: TradingIndex[];
  myIndexes: TradingIndex[];
  selectedIndexId: number | "";
  onSelectIndex: (id: number) => void;
  onClearSelection: () => void;
}

const IndexCard = ({
  index,
  active,
  onClick,
}: {
  index: TradingIndex;
  active: boolean;
  onClick: () => void;
}) => (
  <button
    type="button"
    onClick={onClick}
    className={`w-full text-left p-3 border-2 transition-colors rounded-none group ${
      active
        ? "border-green-400 bg-green-400/10"
        : "border-white/20 bg-black hover:border-white/40 hover:bg-white/5"
    }`}
  >
    <div className="flex items-start justify-between gap-2">
      <span
        className={`text-sm font-black uppercase tracking-tight ${
          active ? "text-green-400" : "text-white group-hover:text-green-400"
        }`}
      >
        {index.name}
      </span>
      <span
        className={`text-[8px] font-black uppercase tracking-widest shrink-0 px-1.5 py-0.5 border ${
          active
            ? "border-green-400/50 text-green-400"
            : "border-white/20 text-gray-600"
        }`}
      >
        {index.assets.length} ast
      </span>
    </div>
    <CompositionLine assets={index.assets} dimmed={!active} />
  </button>
);

const SectionDivider = () => (
  <div className="flex items-center gap-3 py-1">
    <div className="flex-1 h-0.5 bg-white/25" />
    <div className="h-1 w-1 bg-green-400 shrink-0" />
    <div className="flex-1 h-0.5 bg-white/25" />
  </div>
);

export const IndexPickerPanel = ({
  systemIndexes,
  myIndexes,
  selectedIndexId,
  onSelectIndex,
  onClearSelection,
}: IndexPickerPanelProps) => {
  const [query, setQuery] = useState("");

  const filterIndexes = (list: TradingIndex[]) => {
    const q = query.trim().toLowerCase();
    if (!q) return list;
    return list.filter(
      (idx) =>
        idx.name.toLowerCase().includes(q) ||
        idx.assets.some((a) => a.symbol.toLowerCase().includes(q)),
    );
  };

  const filteredSystem = useMemo(
    () => filterIndexes(systemIndexes),
    [systemIndexes, query],
  );
  const filteredMine = useMemo(
    () => filterIndexes(myIndexes),
    [myIndexes, query],
  );

  const showSystemBlock = systemIndexes.length > 0;

  return (
    <div className="flex flex-col h-full min-h-0">
      <div className="px-4 py-3 border-b-2 border-white/20">
        <div className="flex items-center justify-between mb-2">
          <p className="text-[9px] font-black uppercase tracking-[0.3em] text-green-400">
            Indexes
          </p>
          {selectedIndexId !== "" && (
            <button
              type="button"
              onClick={onClearSelection}
              className="text-[9px] font-black uppercase tracking-widest text-gray-600 hover:text-red-500 transition-colors"
            >
              Clear
            </button>
          )}
        </div>
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search indexes..."
          className="w-full bg-black border-2 border-white/20 text-white text-[10px] font-black uppercase tracking-widest px-2 py-1.5 outline-none focus:border-green-400 placeholder:text-gray-700 rounded-none"
        />
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {showSystemBlock && (
          <section className="px-3 pt-3 pb-4 bg-green-400/[0.03] border-b-2 border-green-400/20">
            <div className="flex items-center gap-2 mb-3 px-2 py-1.5 bg-green-400/10 border-l-[3px] border-green-400">
              <span className="text-[10px] font-black uppercase tracking-[0.25em] text-green-400">
                System
              </span>
              <span className="text-[8px] font-black text-green-400/50 uppercase tracking-widest">
                Preset
              </span>
            </div>
            {filteredSystem.length === 0 ? (
              <p className="text-[9px] font-black uppercase tracking-widest text-gray-600 text-center py-4">
                No system matches
              </p>
            ) : (
              <div className="space-y-2 px-1">
                {filteredSystem.map((idx) => (
                  <IndexCard
                    key={idx.id}
                    index={idx}
                    active={selectedIndexId === idx.id}
                    onClick={() => onSelectIndex(idx.id)}
                  />
                ))}
              </div>
            )}
          </section>
        )}

        {showSystemBlock && <SectionDivider />}

        <section className="px-3 pt-4 pb-3 bg-white/[0.02] border-t border-white/10">
          <div className="flex items-center gap-2 mb-3 px-2 py-1.5 bg-white/5 border-l-[3px] border-white/50">
            <span className="text-[10px] font-black uppercase tracking-[0.25em] text-white">
              My Indexes
            </span>
          </div>
          {filteredMine.length === 0 ? (
            <div className="border-2 border-dashed border-white/20 p-4 mx-1 text-center bg-black/40">
              <p className="text-[9px] font-black uppercase tracking-[0.2em] text-gray-500">
                {myIndexes.length === 0
                  ? "No saved indexes yet"
                  : "No matches"}
              </p>
            </div>
          ) : (
            <div className="space-y-2 px-1">
              {filteredMine.map((idx) => (
                <IndexCard
                  key={idx.id}
                  index={idx}
                  active={selectedIndexId === idx.id}
                  onClick={() => onSelectIndex(idx.id)}
                />
              ))}
            </div>
          )}
        </section>

        {!showSystemBlock &&
          filteredMine.length === 0 &&
          query && (
            <p className="text-[10px] font-black uppercase tracking-widest text-gray-600 text-center py-8">
              No indexes found
            </p>
          )}
      </div>
    </div>
  );
};
