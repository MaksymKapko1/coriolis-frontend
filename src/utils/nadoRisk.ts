export interface PerpProductRisk {
  product_id: number;
  long_weight_initial_x18: string;
  short_weight_initial_x18: string;
  long_weight_maintenance_x18: string;
  short_weight_maintenance_x18: string;
}

export const fromX18 = (value: string | number): number =>
  Number(BigInt(value)) / 1e18;

/** Nado: max leverage from initial risk weights (docs.nado.xyz). */
export const getMaxLeverage = (risk: PerpProductRisk, isBuy: boolean): number => {
  const longWeight = fromX18(risk.long_weight_initial_x18);
  const shortWeight = fromX18(risk.short_weight_initial_x18);

  if (isBuy) {
    return longWeight < 1 ? 1 / (1 - longWeight) : Infinity;
  }
  return shortWeight > 1 ? 1 / (shortWeight - 1) : Infinity;
};

export const estimateMarginForNotional = (
  notionalUsd: number,
  risk: PerpProductRisk,
  isBuy: boolean,
): number => {
  const maxLev = getMaxLeverage(risk, isBuy);
  if (!Number.isFinite(maxLev) || maxLev <= 0) return notionalUsd;
  return notionalUsd / maxLev;
};

/** Max total notional for equal per-leg volume at max leverage. */
export const maxTotalNotionalForMargin = (
  availableMargin: number,
  legs: { product_id: number; is_buy: boolean }[],
  risks: Record<number, PerpProductRisk>,
): number => {
  if (availableMargin <= 0 || !legs.length) return 0;

  const invLevSum = legs.reduce((sum, leg) => {
    const risk = risks[leg.product_id];
    if (!risk) return sum;
    const lev = getMaxLeverage(risk, leg.is_buy);
    return sum + (lev > 0 && Number.isFinite(lev) ? 1 / lev : 0);
  }, 0);

  if (invLevSum <= 0) return 0;
  return (availableMargin * legs.length) / invLevSum;
};

/**
 * Approximate liquidation price for a new leg (cross-margin estimate).
 * Uses account health as maintenance buffer — real liq depends on full portfolio.
 */
export const estimateLiquidationPrice = (
  notionalUsd: number,
  oraclePrice: number,
  isBuy: boolean,
  maintenanceHealth: number,
  risk: PerpProductRisk,
): number | null => {
  if (notionalUsd <= 0 || oraclePrice <= 0 || maintenanceHealth <= 0) return null;

  const amount = isBuy
    ? notionalUsd / oraclePrice
    : -(notionalUsd / oraclePrice);
  const longMaint = fromX18(risk.long_weight_maintenance_x18);
  const shortMaint = fromX18(risk.short_weight_maintenance_x18);

  if (amount > 0) {
    const liq = oraclePrice - maintenanceHealth / amount / longMaint;
    return liq > 0 ? liq : null;
  }

  const liq = oraclePrice + (maintenanceHealth / Math.abs(amount)) * shortMaint;
  return liq < oraclePrice * 10 ? liq : null;
};
