// Clean-energy grounding data + a deterministic plan generator.
//
// Two jobs:
//  1) buildSignals() — assemble "really relevant" property data (real rooftop
//     figures from the Google Solar API when a key is set, otherwise realistic
//     regional estimates).
//  2) fallbackPlan() — turn those signals into a ranked clean-energy plan with
//     transparent math, used when no Anthropic key is configured so the product
//     still works on dummy data alone.

import type { CleanEnergyOption, CleanEnergyPlan, PropertySignals } from "./types";

// Northern-California (PG&E / Sonoma) reference figures — illustrative but realistic.
const REGION = {
  name: "Sonoma County, California",
  utilityRate: 0.42, // $/kWh — PG&E residential is among the highest in the US
  sunHoursPerYear: 1850, // peak sun hours for the North Bay
  annualUsageKwh: 10500, // typical detached CA home
  gridCarbonKgPerKwh: 0.21, // CAISO grid average
  solarInstallPerWatt: 3.2, // $/W installed, before incentives
  panelWatts: 400,
  panelAreaSqFt: 18,
};

const FEDERAL_ITC = 0.3; // 30% federal Investment Tax Credit

export interface SolarApiData {
  maxPanels: number;
  yearlyKwh: number;
  sunHoursPerYear: number;
  roofAreaSqFt: number;
}

/** Assemble property signals from optional real solar data + regional estimates. */
export function buildSignals(
  address: string,
  solar: SolarApiData | null
): PropertySignals {
  const sunHoursPerYear = solar?.sunHoursPerYear ?? REGION.sunHoursPerYear;
  const maxPanels = solar?.maxPanels ?? 24; // ~9.6 kW system
  const roofAreaSqFt = solar?.roofAreaSqFt ?? maxPanels * REGION.panelAreaSqFt;

  // If the Solar API gave production, trust it; else derive from panels × watts × sun.
  const systemKw = (maxPanels * REGION.panelWatts) / 1000;
  const derivedKwh = Math.round(systemKw * sunHoursPerYear * 0.85); // 0.85 derate
  const solarPotentialKwh = solar?.yearlyKwh ?? derivedKwh;

  const annualUsageKwh = REGION.annualUsageKwh;
  const annualBill = Math.round(annualUsageKwh * REGION.utilityRate);

  return {
    address,
    region: REGION.name,
    roofAreaSqFt,
    maxPanels,
    sunHoursPerYear,
    solarPotentialKwh,
    utilityRate: REGION.utilityRate,
    annualUsageKwh,
    annualBill,
    gridCarbonKgPerKwh: REGION.gridCarbonKgPerKwh,
    fromSolarApi: solar != null,
  };
}

function round(n: number, step = 1): number {
  return Math.round(n / step) * step;
}

/** Deterministic, transparent plan derived purely from the signals. */
export function fallbackPlan(signals: PropertySignals): CleanEnergyPlan {
  // --- Rooftop solar ---
  const systemKw = (signals.maxPanels * REGION.panelWatts) / 1000;
  const solarGross = systemKw * 1000 * REGION.solarInstallPerWatt;
  const solarNet = round(solarGross * (1 - FEDERAL_ITC), 100);
  // Solar offsets up to ~100% of usage; savings capped by the bill.
  const solarOffsetKwh = Math.min(signals.solarPotentialKwh, signals.annualUsageKwh);
  const solarSavings = round(solarOffsetKwh * signals.utilityRate, 10);
  const solarCo2 = +((solarOffsetKwh * signals.gridCarbonKgPerKwh) / 1000).toFixed(1);

  // --- Battery (resilience + time-of-use arbitrage) ---
  const batteryGross = 13500; // ~13.5 kWh home battery installed
  const batteryNet = round(batteryGross * (1 - FEDERAL_ITC), 100); // ITC applies w/ solar
  const batterySavings = 650; // TOU arbitrage + avoided outage losses

  // --- Heat pump (space + water heating electrification) ---
  const heatPumpGross = 16000;
  const heatPumpNet = round(heatPumpGross - 3000, 100); // federal + state rebates
  const heatPumpSavings = 900; // vs propane/gas in wine country

  // --- EV charger ---
  const evGross = 1600;
  const evNet = round(evGross - 500, 50);
  const evSavings = 1200; // vs gasoline, modeled

  const options: CleanEnergyOption[] = [
    {
      key: "rooftop_solar",
      name: "Rooftop Solar",
      icon: "☀️",
      recommended: true,
      headline: `${systemKw.toFixed(1)} kW system offsets ~${Math.round((solarOffsetKwh / signals.annualUsageKwh) * 100)}% of your power`,
      whatItIs: `About ${signals.maxPanels} panels on ~${round(signals.roofAreaSqFt, 10)} sq ft of roof, producing ~${round(signals.solarPotentialKwh, 100).toLocaleString()} kWh/yr.`,
      estimatedCost: solarNet,
      annualSavings: solarSavings,
      paybackYears: +(solarNet / Math.max(solarSavings, 1)).toFixed(1),
      co2ReductionTons: solarCo2,
      incentives: ["30% federal ITC", "Net energy metering (NEM 3.0)"],
      priority: 1,
    },
    {
      key: "battery",
      name: "Home Battery",
      icon: "🔋",
      recommended: true,
      headline: "Store daytime solar, ride through outages",
      whatItIs: "A ~13.5 kWh battery shifts solar into the evening peak and keeps the lights on during PSPS shutoffs.",
      estimatedCost: batteryNet,
      annualSavings: batterySavings,
      paybackYears: +(batteryNet / Math.max(batterySavings, 1)).toFixed(1),
      co2ReductionTons: 0.4,
      incentives: ["30% federal ITC (paired with solar)", "CA SGIP rebate"],
      priority: 2,
    },
    {
      key: "heat_pump",
      name: "Heat Pump",
      icon: "♨️",
      recommended: true,
      headline: "Replace gas/propane heating + hot water",
      whatItIs: "A high-efficiency heat pump for space and water heating — the biggest fossil load in most homes.",
      estimatedCost: heatPumpNet,
      annualSavings: heatPumpSavings,
      paybackYears: +(heatPumpNet / Math.max(heatPumpSavings, 1)).toFixed(1),
      co2ReductionTons: 2.1,
      incentives: ["25C federal tax credit", "TECH Clean California rebate"],
      priority: 3,
    },
    {
      key: "ev_charger",
      name: "EV Charger",
      icon: "🔌",
      recommended: false,
      headline: "Level 2 home charging, fueled by your solar",
      whatItIs: "A 240V charger so an EV runs on rooftop solar instead of gasoline.",
      estimatedCost: evNet,
      annualSavings: evSavings,
      paybackYears: +(evNet / Math.max(evSavings, 1)).toFixed(1),
      co2ReductionTons: 2.4,
      incentives: ["Utility EV charger rebate", "Federal 30C credit"],
      priority: 4,
    },
  ];

  const bundleItems = options.filter((o) => o.recommended);
  const totalCost = bundleItems.reduce((s, o) => s + o.estimatedCost, 0);
  const totalAnnualSavings = bundleItems.reduce((s, o) => s + o.annualSavings, 0);
  const totalCo2 = options.reduce((s, o) => s + o.co2ReductionTons, 0);

  // Clean score: share of energy load that ends up carbon-free.
  const cleanScoreBefore = 12;
  const cleanScoreAfter = Math.min(
    96,
    Math.round((solarOffsetKwh / signals.annualUsageKwh) * 70) + 26
  );

  return {
    headline: `You could cut ~${totalCo2.toFixed(1)} tons of CO₂ a year and save $${totalAnnualSavings.toLocaleString()}/yr.`,
    summary: `Starting from a clean-energy score of ${cleanScoreBefore}, this property has strong rooftop solar potential (${(signals.solarPotentialKwh / 1000).toFixed(1)} MWh/yr). Pairing solar with a battery and electrifying heating gets you to roughly ${cleanScoreAfter}/100 — most of your energy carbon-free, with backup power through PG&E outages.`,
    cleanScoreBefore,
    cleanScoreAfter,
    options,
    recommendedBundle: {
      items: bundleItems.map((o) => o.name),
      totalCost,
      totalAnnualSavings,
      note: "After the 30% federal tax credit and California rebates. Start with solar + battery, then electrify heating.",
    },
    source: "fallback",
    signals,
  };
}
