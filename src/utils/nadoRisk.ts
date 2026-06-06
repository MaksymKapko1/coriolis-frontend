export interface PerpProductRisk {
  product_id: number;
  long_weight_initial_x18: string;
  short_weight_initial_x18: string;
  long_weight_maintenance_x18: string;
  short_weight_maintenance_x18: string;
}

export const BUDGET_TOLERANCE_USD = 0.05;

export const fromX18 = (value: string | number): number =>
  Number(BigInt(value)) / 1e18;

const roundUsd = (value: number): number => Math.round(value * 100) / 100;

/** Nado: max leverage from initial risk weights (docs.nado.xyz). */
export const getMaxLeverage = (risk: PerpProductRisk, isBuy: boolean): number => {
  const longWeight = fromX18(risk.long_weight_initial_x18);
  const shortWeight = fromX18(risk.short_weight_initial_x18);

  if (isBuy) {
    return longWeight < 1 ? 1 / (1 - longWeight) : Infinity;
  }
  return shortWeight > 1 ? 1 / (shortWeight - 1) : Infinity;
};

/** Initial margin at max leverage ≈ notional / maxLev. */
export const estimateMarginForNotional = (
  notionalUsd: number,
  risk: PerpProductRisk,
  isBuy: boolean,
): number => {
  const maxLev = getMaxLeverage(risk, isBuy);
  if (!Number.isFinite(maxLev) || maxLev <= 0) return notionalUsd;
  return notionalUsd / maxLev;
};

/** Maintenance margin contribution for a new perp leg. */
export const estimateMaintenanceMarginForNotional = (
  notionalUsd: number,
  risk: PerpProductRisk,
  isBuy: boolean,
): number => {
  if (notionalUsd <= 0) return 0;
  if (isBuy) {
    const w = fromX18(risk.long_weight_maintenance_x18);
    return notionalUsd * Math.max(0, 1 - w);
  }
  const w = fromX18(risk.short_weight_maintenance_x18);
  return notionalUsd * Math.max(0, w - 1);
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

/** Split volume by weights; last leg absorbs rounding remainder. */
export const splitVolumeByWeights = (
  totalVolume: number,
  entries: { product_id: number; weight: number }[],
): Map<number, string> => {
  const result = new Map<number, string>();
  if (totalVolume <= 0 || !entries.length) return result;

  let allocated = 0;
  for (let i = 0; i < entries.length; i++) {
    const { product_id, weight } = entries[i];
    if (i === entries.length - 1) {
      result.set(product_id, Math.max(0, roundUsd(totalVolume - allocated)).toFixed(2));
    } else {
      const part = roundUsd(totalVolume * weight);
      result.set(product_id, part.toFixed(2));
      allocated += part;
    }
  }
  return result;
};

/** Equal split; last leg absorbs rounding remainder. */
export const splitVolumeEqual = (
  totalVolume: number,
  productIds: number[],
): Map<number, string> => {
  const result = new Map<number, string>();
  if (totalVolume <= 0 || !productIds.length) return result;

  const perLeg = roundUsd(totalVolume / productIds.length);
  let allocated = 0;
  for (let i = 0; i < productIds.length; i++) {
    if (i === productIds.length - 1) {
      result.set(productIds[i], Math.max(0, roundUsd(totalVolume - allocated)).toFixed(2));
    } else {
      result.set(productIds[i], perLeg.toFixed(2));
      allocated += perLeg;
    }
  }
  return result;
};

/**
 * Cross-margin liquidation estimate for a new leg (Nado formula).
 * Uses maintenance health after the whole batch opens.
 */
export const estimateLiquidationPriceForNewLeg = (
  notionalUsd: number,
  oraclePrice: number,
  isBuy: boolean,
  accountMaintenanceHealth: number,
  batchMaintenanceMargin: number,
  risk: PerpProductRisk,
): number | null => {
  if (notionalUsd <= 0 || oraclePrice <= 0) return null;

  const postHealth = Math.max(0, accountMaintenanceHealth - batchMaintenanceMargin);
  if (postHealth <= 0) return null;

  const amount = isBuy
    ? notionalUsd / oraclePrice
    : -(notionalUsd / oraclePrice);
  const longMaint = fromX18(risk.long_weight_maintenance_x18);
  const shortMaint = fromX18(risk.short_weight_maintenance_x18);

  if (amount > 0) {
    const liq = oraclePrice - postHealth / amount / longMaint;
    return liq > 0 ? liq : null;
  }

  const liq = oraclePrice + (postHealth / Math.abs(amount)) * shortMaint;
  return liq < oraclePrice * 10 ? liq : null;
};
