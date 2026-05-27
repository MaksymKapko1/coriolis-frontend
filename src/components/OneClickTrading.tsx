import { useState, useEffect } from "react";
import { usePrivy, useWallets } from "@privy-io/react-auth";
import { generatePrivateKey, privateKeyToAccount } from "viem/accounts";
import { getPrivyNadoClient } from "../services/nado";
import { saveSignerToBackend, fetchUserStatus } from "../services/api";

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export const OneClickButton = () => {
  const { getAccessToken } = usePrivy();
  const { wallets } = useWallets();

  const [loading, setLoading] = useState(false);
  const [sessionActive, setSessionActive] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const checkStatus = async () => {
      try {
        const token = await getAccessToken();
        if (!token) return;
        const user = await fetchUserStatus(token);
        if (user?.linked_signer_address) {
          setSessionActive(true);
        }
      } catch (err: any) {
        if (!err?.message?.includes("404")) {
          console.error("Status check failed:", err);
        }
      } finally {
        setChecking(false);
      }
    };

    checkStatus();
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
        `0x${linkedAddress.slice(2).toLowerCase()}${"0".repeat(24)}` as `0x${string}`;

      const provider = await activeWallet.getEthereumProvider();
      const nadoClient = await getPrivyNadoClient(
        provider,
        activeWallet.address as `0x${string}`,
      );

      await nadoClient.subaccount.linkSigner({
        subaccountName: "default",
        signer: signerBytes32,
      });

      if (!token) throw new Error("Privy token generation failed");

      await saveSignerToBackend(token, newPrivateKey);
      setSessionActive(true);
    } catch (err) {
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
