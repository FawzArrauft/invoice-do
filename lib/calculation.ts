/**
 * Calculation utilities for cargo/muatan cost calculations
 */

export interface CargoCalculation {
  costMuatan: number;
  cutPayment: number;
  total: number;
}

export interface CargoInput {
  freight_cost: number;
  balen_freight_cost: number;
  fuel: number;
  operational_cost: number;
  other_cost: number;
}

/**
 * Parse Indonesian Rupiah format to number
 * Handles formats like: 700.000, 1.500.000, Rp 700.000, etc.
 * Indonesian format uses . as thousand separator and , as decimal separator
 */
export function parseRupiah(value: string | number): number {
  if (typeof value === "number") return value;
  if (!value || value === "") return 0;
  
  // Remove "Rp", spaces, and currency symbols
  let cleaned = value.toString().replace(/[Rp\s]/gi, "").trim();
  
  // Check if it's Indonesian format (uses . as thousand separator)
  // Pattern: digits separated by dots, optionally with comma for decimals
  // e.g., 700.000 or 1.500.000 or 1.500.000,50
  const indonesianPattern = /^\d{1,3}(\.\d{3})*(,\d+)?$/;
  
  if (indonesianPattern.test(cleaned)) {
    // Indonesian format: replace . with nothing, replace , with .
    cleaned = cleaned.replace(/\./g, "").replace(",", ".");
  } else {
    // Standard format or just numbers: remove commas (thousand separator in US format)
    cleaned = cleaned.replace(/,/g, "");
  }
  
  const num = parseFloat(cleaned);
  return isNaN(num) ? 0 : num;
}

/**
 * Format number to Indonesian Rupiah string
 */
export function formatRupiah(n: number): string {
  return "Rp " + new Intl.NumberFormat("id-ID").format(n || 0);
}

/**
 * Calculate cargo costs with proper business logic
 * 
 * Formula:
 * 1. costMuatan = (freightCost + balenCost) - fuelCost - operationalCost - otherCost
 * 2. If costMuatan > 0: cutPayment = costMuatan * 0.3, total = costMuatan - cutPayment
 * 3. If costMuatan <= 0: cutPayment = 0, total = 0
 */
export function calculateCargoTotal(input: CargoInput): CargoCalculation {
  const freightCost = input.freight_cost || 0;
  const balenCost = input.balen_freight_cost || 0;
  const fuelCost = input.fuel || 0;
  const operationalCost = input.operational_cost || 0;
  const otherCost = input.other_cost || 0;

  // Step 1: Calculate costMuatan
  const costMuatan = (freightCost + balenCost) - fuelCost - operationalCost - otherCost;

  // Step 2 & 3: Calculate cutPayment and total based on costMuatan
  if (costMuatan <= 0) {
    return {
      costMuatan: costMuatan,
      cutPayment: 0,
      total: 0,
    };
  }

  const cutPayment = costMuatan * 0.3;
  const total = costMuatan - cutPayment;

  return {
    costMuatan,
    cutPayment,
    total,
  };
}

/**
 * Calculate cargo result from modal inputs (live calculation)
 */
export function calculateCargoResult(
  freightCost: number,
  balenFreightCost: number,
  fuel: number,
  operationalCost: number,
  otherCost: number
): CargoCalculation & { cargoGross: number } {
  const cargoGross = (freightCost || 0) + (balenFreightCost || 0);
  
  const result = calculateCargoTotal({
    freight_cost: freightCost,
    balen_freight_cost: balenFreightCost,
    fuel,
    operational_cost: operationalCost,
    other_cost: otherCost,
  });

  return {
    cargoGross,
    ...result,
  };
}
