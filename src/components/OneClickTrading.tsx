import { useState, useEffect } from "react";
import { usePrivy, useWallets } from "@privy-io/react-auth";
import { generatePrivateKey, privateKeyToAccount } from "viem/accounts";
import { getPrivyNadoClient } from "../services/nado";
import { saveSignerToBackend, fetchUserStatus } from "../services/api";

// "default" subaccount encoding: "default" в ASCII hex (7 байт) + 5 байт паддинга
const DEFAULT_SUBACCOUNT_HEX = "64656661756c740000000000";

const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

export const OneClickButton = () => {
  const { getAccessToken } = usePrivy();
  const { wallets } = useWallets();

  const [loading, setLoading] = useState(false);
  const [sessionActive, setSessionActive] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const checkStatus = async () => {
      try {
        const token = await getAccessToken();
        if (!token || cancelled) return;

        const user = await fetchUserStatus(token);
        if (!cancelled && user?.linked_signer_address) {
          setSessionActive(true);
        }
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        if (!message.includes("404")) {
          console.error("Status check failed:", err);
        }
      } finally {
        if (!cancelled) setChecking(false);
      }
    };

    checkStatus();
    return () => {
      cancelled = true;
    };
  }, [getAccessToken]);

  const handleEnable = async () => {
    setLoading(true);
    try {
      const token = await getAccessToken();
      if (!token) throw new Error("Privy token generation failed");

      const activeWallet = wallets[0];
      if (!activeWallet) throw new Error("Wallet not found");

      if (activeWallet.chainId !== "eip155:763373") {
        await activeWallet.switchChain(763373);
        await sleep(1500);
      }

      const newPrivateKey = generatePrivateKey();
      const linkedAddress = privateKeyToAccount(newPrivateKey).address;

      const signerBytes32 =
        `0x${linkedAddress.slice(2).toLowerCase()}${DEFAULT_SUBACCOUNT_HEX}` as `0x${string}`;

      const provider = await activeWallet.getEthereumProvider();
      const nadoClient = await getPrivyNadoClient(
        provider,
        activeWallet.address as `0x${string}`,
      );

      await nadoClient.subaccount.linkSigner({
        subaccountName: "default",
        signer: signerBytes32,
      });

      await saveSignerToBackend(token, newPrivateKey);
      setSessionActive(true);
    } catch (err: unknown) {
      console.error("1-click error:", err);
    } finally {
      setLoading(false);
    }
  };

  if (checking) {
    return (
      <button
        disabled
        className="border-2 border-white/20 px-4 py-2 text-sm uppercase font-bold tracking-widest bg-black text-white/30 rounded-none cursor-not-allowed"
      >
        ...
      </button>
    );
  }

  if (sessionActive) {
    return (
      <button
        disabled
        className="border-2 border-green-400/40 px-4 py-2 text-sm uppercase font-bold tracking-widest bg-black text-green-400/50 rounded-none cursor-not-allowed"
      >
        ● Session Active
      </button>
    );
  }

  return (
    <button
      onClick={handleEnable}
      disabled={loading}
      className="border-2 border-green-400 px-4 py-2 text-sm uppercase font-bold tracking-widest bg-black text-green-400 hover:bg-green-400 hover:text-black transition-all rounded-none disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {loading ? "Processing..." : "1-Click Trading"}
    </button>
  );
};
