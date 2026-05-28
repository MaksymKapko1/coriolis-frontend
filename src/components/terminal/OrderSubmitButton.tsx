interface OrderSubmitButtonProps {
  isBuy: boolean;
  isSubmitting: boolean;
  onClick: () => void;
  disabled: boolean;
}

export const OrderSubmitButton = ({
  isBuy,
  isSubmitting,
  onClick,
  disabled,
}: OrderSubmitButtonProps) => {
  const baseColor = isBuy
    ? "bg-green-500 hover:bg-green-400"
    : "bg-red-500 hover:bg-red-400";
  const disabledColor = "bg-gray-700 text-gray-500 cursor-not-allowed";

  return (
    <button
      onClick={onClick}
      disabled={disabled || isSubmitting}
      className={`w-full mt-6 py-3 rounded-lg font-bold text-white transition-colors ${
        disabled || isSubmitting ? disabledColor : baseColor
      }`}
    >
      {isSubmitting ? (
        <span className="flex items-center justify-center gap-2">
          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          Processing...
        </span>
      ) : isBuy ? (
        "Execute Long"
      ) : (
        "Execute Short"
      )}
    </button>
  );
};
