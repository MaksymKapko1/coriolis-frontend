import { createNadoClient } from "@nadohq/client";
import { createPublicClient, createWalletClient, custom, http } from "viem";
import { ink } from "../config/chains";

export const getPrivyNadoClient = async (
  privyProvider: any,
  walletAddress: `0x${string}`,
) => {
  const walletClient = createWalletClient({
    account: walletAddress,
    chain: ink,
    transport: custom(privyProvider),
  });

  const publicClient = createPublicClient({
    chain: ink,
    transport: http(),
  });

  const nadoClient = await createNadoClient("inkMainnet", {
    walletClient: walletClient as any,
    publicClient: publicClient as any,
  });

  return nadoClient;
};
