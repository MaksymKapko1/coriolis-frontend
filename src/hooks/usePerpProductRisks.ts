import { useEffect, useState } from "react";
import { fetchPerpProductRiskMap } from "../services/nadoApi.ts";
import type { PerpProductRisk } from "../utils/nadoRisk.ts";

export const usePerpProductRisks = () => {
  const [risks, setRisks] = useState<Record<number, PerpProductRisk>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    fetchPerpProductRiskMap()
      .then((map) => {
        if (!cancelled) setRisks(map);
      })
      .catch((err) => console.error("Failed to load perp risk params:", err))
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return { risks, loading };
};
