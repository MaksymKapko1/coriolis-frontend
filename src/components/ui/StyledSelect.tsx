import type { ReactNode, SelectHTMLAttributes } from "react";

const sizeClasses = {
  sm: "text-xs font-black px-2 py-1.5",
  md: "text-xs font-black px-2 py-2",
  lg: "text-lg font-bold px-3 py-3",
  inline: "text-2xl font-black px-0 py-0 pr-8 bg-transparent",
} as const;

const wrapperBorder = {
  sm: "border-2 border-white/20",
  md: "border-2 border-white/20",
  lg: "border-2 border-white/20",
  inline: "",
} as const;

interface StyledSelectProps
  extends Omit<SelectHTMLAttributes<HTMLSelectElement>, "size"> {
  label?: string;
  size?: keyof typeof sizeClasses;
  bordered?: boolean;
  wrapperClassName?: string;
  children: ReactNode;
}

export const StyledSelect = ({
  label,
  size = "md",
  bordered = true,
  wrapperClassName = "",
  className = "",
  children,
  ...props
}: StyledSelectProps) => {
  const isInline = size === "inline";
  const borderClass = bordered ? wrapperBorder[size] : "";

  return (
    <div className={wrapperClassName}>
      {label && (
        <label className="text-[10px] text-green-400 font-bold uppercase tracking-[0.2em] mb-2 block">
          {label}
        </label>
      )}
      <div className={`relative ${borderClass}`}>
        <select
          {...props}
          className={`w-full bg-black text-white outline-none cursor-pointer appearance-none rounded-none transition-colors focus:border-green-400 ${sizeClasses[size]} ${isInline ? "hover:text-green-400" : ""} ${className}`}
        >
          {children}
        </select>
        <div
          className={`pointer-events-none absolute inset-y-0 right-0 flex items-center ${isInline ? "text-green-400 px-0" : "text-white px-3"}`}
        >
          <svg className="fill-current h-4 w-4" viewBox="0 0 20 20">
            <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
          </svg>
        </div>
      </div>
    </div>
  );
};
