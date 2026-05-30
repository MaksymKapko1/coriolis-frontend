interface OrderAmountInputProps {
  amount: string;
  onChange: (value: string) => void;
}

export const OrderAmountInput = ({
  amount,
  onChange,
}: OrderAmountInputProps) => {
  return (
    <div className="flex flex-col gap-1 mt-4">
      <label className="text-xs text-gray-400 font-medium">Amount</label>
      <div className="flex items-center bg-gray-900 border border-gray-800 rounded-lg p-3 focus-within:border-purple-500 transition-colors">
        <input
          type="number"
          step="any"
          min="0"
          value={amount}
          onChange={(e) => onChange(e.target.value)}
          placeholder="0.00"
          className="bg-transparent text-white text-lg outline-none w-full placeholder-gray-600 font-mono"
        />
        <span className="text-gray-500 text-sm font-bold pl-2">$/USD</span>
      </div>
    </div>
  );
};
