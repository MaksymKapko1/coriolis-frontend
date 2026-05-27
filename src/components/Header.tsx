import { ConnectButton } from "./ConnectButton";
import { OneClickButton } from "./OneClickTrading.tsx";
import { usePrivy } from "@privy-io/react-auth";
import type { AccountState } from "../hooks/useNadoAccount";

export const Header = ({ account }: { account: AccountState }) => {
  const { authenticated } = usePrivy();

  return (
    <header className="border-b-2 border-white/20 p-4 bg-black">
      <div className="max-w-7xl mx-auto flex justify-between items-center">
        <div className="flex items-center gap-6">
          <a
            href="/"
            className="text-xl font-black tracking-tighter text-white hover:text-green-400 transition-colors"
          >
            [CORIOLIS]
          </a>
          <nav className="hidden md:flex gap-4 text-sm text-gray-400">
            <a href="/trade" className="hover:text-white transition-colors">
              Trade
            </a>
            <a href="/dashboard" className="hover:text-white transition-colors">
              Dashboard
            </a>
          </nav>
        </div>

        <div className="flex items-center gap-3">
          {authenticated && <OneClickButton />}
          <ConnectButton account={account} />
        </div>
      </div>
    </header>
  );
};
