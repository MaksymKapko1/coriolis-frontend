import { usePrivy } from '@privy-io/react-auth';

export const ConnectButton = () => {
  const { ready, authenticated, login, user, logout } = usePrivy();
  
  if (!ready) return null;

  const formatAddress = (address?: string) => {
    if (!address) return '';
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  return (
    <button
      onClick={authenticated ? logout : login}
      className="border-2 border-white px-4 py-2 text-sm uppercase font-bold tracking-widest bg-black text-white hover:border-green-400 hover:text-green-400 transition-colors rounded-none"
    >
      {authenticated && user?.wallet ? formatAddress(user.wallet.address) : 'Connect Wallet'}
    </button>
  );
};