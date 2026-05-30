import { usePrivy } from "@privy-io/react-auth";
import type { AccountState } from "../hooks/useNadoAccount";

const formatAddress = (address?: string) => {
  if (!address) return "";
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
};

const formatUsd = (n: number) =>
  n.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

export const ConnectButton = ({ account }: { account: AccountState }) => {
  const { ready, authenticated, login, logout, user } = usePrivy();

  if (!ready) return null;

  const showTooltip = authenticated && !!user?.wallet;

  return (
    <div className="relative group font-sans">
      <button
        onClick={authenticated ? logout : login}
        className="border-2 border-white px-4 py-2 text-sm uppercase font-black tracking-widest bg-black text-white hover:border-green-400 hover:text-green-400 transition-colors rounded-none"
      >
        {authenticated && user?.wallet
          ? formatAddress(user.wallet.address)
          : "Connect Wallet"}
      </button>

      {/* ДОБАВЛЕН z-50 ЧТОБЫ БЫТЬ ПОВЕРХ ВСЕХ ЭЛЕМЕНТОВ */}
      {showTooltip && (
        <div className="opacity-0 group-hover:opacity-100 pointer-events-none group-hover:pointer-events-auto transition-opacity absolute right-0 top-full mt-2 w-64 border-2 border-green-400 bg-black text-green-400 p-4 text-xs tracking-wide z-50 shadow-2xl">
          <div className="flex justify-between gap-4">
            <span className="text-gray-500 font-bold uppercase tracking-widest">
              Account equity
            </span>
            <span className="font-black text-green-400">
              {formatUsd(account.totalEquity)}{" "}
              <span className="text-gray-500">USDT</span>
            </span>
          </div>
          <div className="flex justify-between gap-4 mt-3">
            <span className="text-gray-500 font-bold uppercase tracking-widest">
              Available
            </span>
            <span className="font-black text-green-400">
              {formatUsd(account.availableMargin)}{" "}
              <span className="text-gray-500">USDT</span>
            </span>
          </div>

          <div className="mt-4 pt-4 border-t-2 border-green-400/20 flex justify-end">
            <button
              onClick={logout}
              className="border-2 border-green-400 px-4 py-2 text-[10px] uppercase font-black tracking-widest bg-black text-green-400 hover:bg-green-400 hover:text-black transition-colors rounded-none"
            >
              Logout
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
