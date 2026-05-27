import { useEffect, useState } from "react";
import { usePrivy } from "@privy-io/react-auth";
import { toSubaccountBytes32 } from "../services/cryptoaddress";
import {
  fetchNadoSymbolsMap,
  fetchSubaccountRawInfo,
} from "../services/nadoApi";

export const useNadoAccount = () => {
  const { authenticated, user } = usePrivy();
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    const loadAndAggregateAccountData = async () => {
      const walletAddress = user?.wallet?.address;

      if (!authenticated || !walletAddress) return;

      setLoading(true);
      try {
        console.log(">>> [TERMINAL] STARTING DATA AGGREGATION...");

        const symbolsMap = await fetchNadoSymbolsMap();

        const subaccountKey = toSubaccountBytes32(walletAddress);

        const accountSnapshot = await fetchSubaccountRawInfo(subaccountKey);

        if (accountSnapshot.status === "success") {
          const { spot_balances, perp_balances } = accountSnapshot.data;

          console.log(
            "%c============= NADO TERMINAL METRICS =============",
            "color: #4ade80; font-weight: bold;",
          );
          console.log(`Subaccount: ${subaccountKey}`);

          console.log(
            "%c--- SPOT BALANCES ---",
            "color: #ffffff; font-weight: bold;",
          );
          spot_balances.forEach((item) => {
            const market = symbolsMap[item.product_id];
            const ticker = market
              ? market.symbol
              : `UNKNOWN_SPOT_ID_${item.product_id}`;

            const humanAmount = Number(BigInt(item.balance.amount)) / 1e18;

            if (humanAmount !== 0 || item.product_id === 0) {
              console.log(
                `Asset: ${ticker.padEnd(10)} | Amount: ${humanAmount.toFixed(4)}`,
              );
            }
          });

          console.log(
            "%c--- OPEN PERP POSITIONS ---",
            "color: #ffffff; font-weight: bold;",
          );
          let hasActivePositions = false;

          perp_balances.forEach((item) => {
            const humanAmount = Number(BigInt(item.balance.amount)) / 1e18;

            if (humanAmount !== 0) {
              hasActivePositions = true;
              const market = symbolsMap[item.product_id];
              const ticker = market
                ? market.symbol
                : `UNKNOWN_PERP_ID_${item.product_id}`;
              const side = humanAmount > 0 ? "%cLONG" : "%cSHORT";
              const sideColor =
                humanAmount > 0 ? "color: #4ade80" : "color: #f87171";

              console.log(
                `Market: ${ticker.padEnd(10)} | Side: ${side} | Size: ${Math.abs(humanAmount).toFixed(4)}`,
                sideColor,
              );
            }
          });

          if (!hasActivePositions) {
            console.log("No active perpetual positions found.");
          }

          console.log(
            "%c=================================================",
            "color: #4ade80; font-weight: bold;",
          );
        }
      } catch (error) {
        console.error(
          ">>> [TERMINAL ERROR] Failed to load or parse Nado metrics:",
          error,
        );
      } finally {
        setLoading(false);
      }
    };

    loadAndAggregateAccountData();
  }, [authenticated, user]);

  return { loading };
};
