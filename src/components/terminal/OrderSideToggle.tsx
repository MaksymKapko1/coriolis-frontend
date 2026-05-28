interface OrderSideToggleProps {
  isBuy: boolean;
  onChange: (isBuy: boolean) => void;
}

export const OrderSideToggle = ({ isBuy, onChange }: OrderSideToggleProps) => {
  return (
    <div className="flex w-full bg-gray-900 rounded-lg p-1 border border-gray-800">
      <button
        type="button"
        onClick={() => onChange(true)}
        className={`flex-1 py-2 text-sm font-semibold rounded-md transition-colors ${
          isBuy
            ? "bg-green-500/20 text-green-400 border border-green-500/30"
            : "text-gray-500 hover:text-gray-300"
        }`}
      >
        Buy / Long
      </button>
      <button
        type="button"
        onClick={() => onChange(false)}
        className={`flex-1 py-2 text-sm font-semibold rounded-md transition-colors ${
          !isBuy
            ? "bg-red-500/20 text-red-400 border border-red-500/30"
            : "text-gray-500 hover:text-gray-300"
        }`}
      >
        Sell / Short
      </button>
    </div>
  );
};
