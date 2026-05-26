import { useState } from "react";
import { usePrivy, useWallets } from "@privy-io/react-auth";
import { generatePrivateKey, privateKeyToAccount } from "viem/accounts";
import { saveSignerToBackend } from "../services/api";
import { getPrivyNadoClient } from "../services/nado";
import { pad } from "viem";

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export const OneClickTrading = () => {
  const { authenticated, getAccessToken } = usePrivy();
  const { wallets } = useWallets();
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");

  if (!authenticated) return null;

  const handleEnable1Click = async () => {
    setLoading(true);
    setStatus("idle");
    try {
      const activeWallet = wallets[0];
      if (!activeWallet) throw new Error("Wallet not found");

      if (activeWallet.chainId !== "eip155:763373") {
        console.log("Switching network to Ink Sepolia...");
        try {
          // Теперь это вызовет системное окно добавления/переключения сети в кошельке
          await activeWallet.switchChain(763373);
          await sleep(1500);
        } catch (switchError) {
          console.error("Failed to switch network:", switchError);
          throw new Error(
            "Please switch your wallet network to Ink Sepolia manually.",
          );
        }
      }

      const newPrivateKey = generatePrivateKey();
      const linkedAccount = privateKeyToAccount(newPrivateKey);
      const linkedAddress = linkedAccount.address;

      console.log("Generated Session Address:", linkedAddress);

      const provider = await activeWallet.getEthereumProvider();
      const nadoClient = await getPrivyNadoClient(
        provider,
        activeWallet.address as `0x${string}`,
      );

      console.log("Please sign the request in your wallet...");
      await nadoClient.subaccount.linkSigner({
        subaccountName: "default",
        signer: pad(linkedAddress),
      });

      const token = await getAccessToken();
      if (!token) throw new Error("Privy token generation failed");

      await saveSignerToBackend(token, newPrivateKey);

      setStatus("success");
    } catch (err) {
      console.error("Session Init Error:", err);
      setStatus("error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="border-2 border-white p-6 max-w-md bg-black mt-6 rounded-none">
      <h3 className="text-lg font-bold tracking-widest uppercase mb-2 text-white">
        [1-Click Trading]
      </h3>
      <p className="text-sm text-gray-400 mb-4">
        Delegate trading permissions to a secure, encrypted session key. Trade
        instantly without wallet popups.
      </p>

      {status === "success" && (
        <p className="text-green-400 text-sm mb-4 uppercase font-bold tracking-wider">
          {">"} SESSION INITIATED SUCCESSFULLY
        </p>
      )}

      {status === "error" && (
        <p className="text-red-500 text-sm mb-4 uppercase font-bold tracking-wider">
          {">"} ERROR ENABLING SESSION
        </p>
      )}

      <button
        onClick={handleEnable1Click}
        disabled={loading}
        className="w-full border-2 border-green-400 p-3 text-sm font-bold uppercase tracking-widest bg-black text-green-400 hover:bg-green-400 hover:text-black transition-all disabled:opacity-50 disabled:cursor-not-allowed rounded-none"
      >
        {loading ? "PROCESSING..." : "ENABLE 1-CLICK TRADING"}
      </button>
    </div>
  );
};
