import { createNadoClient } from "@nadohq/client";
import { createPublicClient, createWalletClient, custom, http } from "viem";
import { inkSepolia } from "viem/chains";

export const getPrivyNadoClient = async (
  privyProvider: any,
  walletAddress: `0x${string}`,
) => {
  const walletClient = createWalletClient({
    account: walletAddress,
    chain: inkSepolia,
    transport: custom(privyProvider),
  });

  const publicClient = createPublicClient({
    chain: inkSepolia,
    transport: http(),
  });

  const nadoClient = await createNadoClient("inkTestnet", {
    walletClient: walletClient as any,
    publicClient: publicClient as any,
  });

  return nadoClient;
};
