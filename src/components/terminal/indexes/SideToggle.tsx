export const SideToggle = ({
  isBuy,
  onChange,
}: {
  isBuy: boolean;
  onChange: (v: boolean) => void;
}) => (
  <div className="flex border-2 border-white/20 w-20 shrink-0 bg-black font-sans">
    <button
      type="button"
      onClick={() => onChange(true)}
      className={`flex-1 py-1 text-[10px] font-black uppercase transition-colors ${
        isBuy ? "bg-green-400 text-black" : "text-gray-600 hover:text-white"
      }`}
    >
      L
    </button>
    <button
      type="button"
      onClick={() => onChange(false)}
      className={`flex-1 py-1 text-[10px] font-black uppercase border-l-2 border-white/20 transition-colors ${
        !isBuy ? "bg-white text-black" : "text-gray-600 hover:text-white"
      }`}
    >
      S
    </button>
  </div>
);
