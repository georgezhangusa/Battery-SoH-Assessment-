import {
  BatteryModule,
  PackGlobalSettings,
  PackAnalysis,
  DiagnosticResult,
  DiagnosticSeverity,
} from '../types';

/**
 * Calculates baseline LFP State of Health (SOH %) given cycle count, calendar age,
 * operating temperature, and Depth of Discharge (DoD).
 */
export function calculateBaselineSohAtCycle(
  cycle: number,
  settings: Pick<PackGlobalSettings, 'calendarYears' | 'temperature' | 'dod' | 'intensity'>
): number {
  // Base cycle wear factor for LFP chemistry calibrated for utility/commercial BESS up to 10,000 cycles
  // ~1,000 cyc -> ~98%, ~3,000 cyc -> ~94%, ~6,000 cyc -> ~87%, ~8,000 cyc -> ~81%, ~10,000 cyc -> ~74%
  const normalizedCycle = Math.max(0, cycle);
  const cycleFade = 0.0018 * Math.pow(normalizedCycle, 0.72) + (normalizedCycle / 10000) * 15.2;

  // Temperature multiplier
  let tempFactor = 1.0;
  if (settings.temperature === 'cool') tempFactor = 1.08; // slightly higher impedance wear
  else if (settings.temperature === 'optimal') tempFactor = 1.0;
  else if (settings.temperature === 'warm') tempFactor = 1.25;
  else if (settings.temperature === 'hot') tempFactor = 1.65;

  // Depth of Discharge modifier
  let dodFactor = 1.0;
  if (settings.dod === '80') dodFactor = 0.78;
  else if (settings.dod === '90') dodFactor = 0.88;
  else if (settings.dod === '100') dodFactor = 1.0;

  // Intensity modifier
  let intensityFactor = 1.0;
  if (settings.intensity === '0.25C') intensityFactor = 0.92;
  else if (settings.intensity === '0.5C') intensityFactor = 1.0;
  else if (settings.intensity === '1.0C') intensityFactor = 1.22;

  // Calendar aging: ~0.9% fade per year
  const calendarFade = settings.calendarYears * 0.9 * (tempFactor > 1 ? tempFactor * 0.85 : 1.0);

  const totalFade = (cycleFade * tempFactor * dodFactor * intensityFactor) + calendarFade;
  const calculatedSoh = Math.max(10, Math.min(100, 100 - totalFade));

  return Number(calculatedSoh.toFixed(1));
}

export function calculateBaselineSoh(settings: PackGlobalSettings): number {
  return calculateBaselineSohAtCycle(settings.cycles, settings);
}

/**
 * Initializes default 8-module array for a 384V LFP pack
 */
export function createDefaultModules(baselineSoh: number): BatteryModule[] {
  return Array.from({ length: 8 }, (_, i) => ({
    id: i + 1,
    name: `Module #${i + 1}`,
    serialNumber: `LFP48-MOD${String(i + 1).padStart(2, '0')}-A`,
    nominalVoltage: 48.0,
    soh: baselineSoh,
    internalResistance: 'normal',
    customModified: false,
    installedDate: '2023-04-15',
    cyclesCompleted: 0,
  }));
}

/**
 * Full series-string Pack Analysis calculation (Weakest Link / Barrel Effect)
 */
export function analyzePack(
  modules: BatteryModule[],
  settings: PackGlobalSettings
): PackAnalysis {
  if (!modules || modules.length === 0) {
    throw new Error('At least one module is required for pack analysis.');
  }

  const sohs = modules.map((m) => m.soh);
  const minSoh = Math.min(...sohs);
  const maxSoh = Math.max(...sohs);
  const sumSoh = sohs.reduce((acc, curr) => acc + curr, 0);
  const averageSoh = Number((sumSoh / modules.length).toFixed(1));
  const deltaSoh = Number((maxSoh - minSoh).toFixed(1));

  // In a series circuit, current must pass through all modules in series.
  // The usable string capacity is strictly bounded by the minimum SOH module.
  const effectivePackSoh = minSoh;

  const bottleneckModule = modules.find((m) => m.soh === minSoh) || modules[0];

  const nominalVoltage = modules.reduce((sum, m) => sum + m.nominalVoltage, 0); // 8 * 48 = 384V

  // Total energy in kWh = (Total Volts * Module Ah) / 1000
  const nameplateCapacityKwh = Number(
    ((nominalVoltage * settings.ratedModuleCapacityAh) / 1000).toFixed(2)
  );

  // Effective capacity delivered to load before weakest module cuts off BMS at LVC (Low Voltage Cutoff)
  const effectiveCapacityKwh = Number(
    ((nameplateCapacityKwh * effectivePackSoh) / 100).toFixed(2)
  );

  // Theoretical average capacity vs bottlenecked usable capacity
  const potentialCapacityKwh = Number(
    ((nameplateCapacityKwh * averageSoh) / 100).toFixed(2)
  );
  const wastedCapacityKwh = Number(
    Math.max(0, potentialCapacityKwh - effectiveCapacityKwh).toFixed(2)
  );

  // Critical IR check
  const criticalIRModules = modules.filter((m) => m.internalResistance === 'critical');
  const hasCriticalIR = criticalIRModules.length > 0;

  // Remaining Useful Life (RUL) estimation
  // Calculate instantaneous wear slope (SOH lost per cycle under current conditions)
  const baseSohNow = calculateBaselineSohAtCycle(settings.cycles, settings);
  const baseSohNext = calculateBaselineSohAtCycle(settings.cycles + 100, settings);
  const cycleWearRate = Math.max(0.002, (baseSohNow - baseSohNext) / 100);

  // Remaining cycles before the weakest module reaches 80% (primary EOL)
  let remainingCyclesTo80 = 0;
  if (effectivePackSoh > 80) {
    remainingCyclesTo80 = Math.round((effectivePackSoh - 80) / cycleWearRate);
  }

  // Remaining cycles before reaching 70% (secondary decommission EOL)
  let remainingCyclesTo70 = 0;
  if (effectivePackSoh > 70) {
    remainingCyclesTo70 = Math.round((effectivePackSoh - 70) / cycleWearRate);
  }

  const dailyCycles = settings.dailyCycles || 1.0;
  const estimatedMonthsTo80 = Number(((remainingCyclesTo80 / dailyCycles) / 30.4).toFixed(1));
  const estimatedMonthsTo70 = Number(((remainingCyclesTo70 / dailyCycles) / 30.4).toFixed(1));

  let wearVelocity: 'optimal' | 'normal' | 'accelerated' = 'normal';
  if (settings.temperature === 'hot' || settings.intensity === '1.0C') {
    wearVelocity = 'accelerated';
  } else if (settings.temperature === 'optimal' && settings.dod === '80') {
    wearVelocity = 'optimal';
  }

  return {
    effectivePackSoh,
    averageSoh,
    maxSoh,
    minSoh,
    deltaSoh,
    nominalVoltage,
    nameplateCapacityKwh,
    effectiveCapacityKwh,
    wastedCapacityKwh,
    bottleneckModule,
    hasCriticalIR,
    criticalIRModules,
    remainingCyclesTo80,
    remainingCyclesTo70,
    estimatedMonthsTo80,
    estimatedMonthsTo70,
    wearVelocity,
  };
}

/**
 * Diagnostic & Actionable Recommendation Matrix
 */
export function evaluateDiagnostics(
  modules: BatteryModule[],
  analysis: PackAnalysis,
  settings: PackGlobalSettings
): DiagnosticResult {
  const { effectivePackSoh, deltaSoh, averageSoh, bottleneckModule, hasCriticalIR, criticalIRModules } = analysis;

  // 1. Critical Safety / Thermal Runaway Risk (Internal Resistance high)
  if (hasCriticalIR) {
    const modNames = criticalIRModules.map((m) => m.name).join(', ');
    return {
      severity: 'critical_safety',
      title: 'CRITICAL SAFETY HAZARD: High Internal Resistance Detected',
      badgeText: '⚠️ Safety Isolation Required',
      description: `Critical internal resistance (>4.5 mΩ) detected on ${modNames}. Severe thermal degradation and voltage sag risk during charge/discharge cycles.`,
      bottleneckModuleId: criticalIRModules[0].id,
      recommendedAction: `Immediately isolate and take ${modNames} offline. Perform bench impedance spectroscopy and bypass/replace the affected modules before re-energizing the 384V string.`,
      targetReplacementSohRange: {
        min: Math.max(50, Math.floor(averageSoh - 3)),
        max: Math.min(100, Math.ceil(averageSoh + 3)),
      },
      urgentSafetyNotice: 'Thermal Runaway Hazard: Elevated resistive heat dissipation under high C-rates.',
      rebalanceCandidateCount: 0,
      flaggedModules: criticalIRModules.map((m) => m.id),
    };
  }

  // 2. Whole Pack End of Life (EOL)
  if (averageSoh <= 70 || settings.cycles >= 9000) {
    return {
      severity: 'eol',
      title: 'Whole Pack End of Life (Decommissioning Required)',
      badgeText: '🔴 Decommissioning Required',
      description: `The overall pack has reached secondary life threshold (Average SOH: ${averageSoh}%, Cycles: ${settings.cycles.toLocaleString()}). Multiple modules exhibit deep capacity fade across the entire string.`,
      bottleneckModuleId: bottleneckModule.id,
      recommendedAction: `Individual module replacement is no longer cost-effective. Decommission the full 384V pack from primary BESS duties. Transition to 2nd-life non-critical storage or dispatch to certified LFP hydrometallurgical recycling facility.`,
      targetReplacementSohRange: null,
      rebalanceCandidateCount: 0,
      flaggedModules: modules.map((m) => m.id),
    };
  }

  // 3. High number of degraded modules (>= 3 modules < 75%)
  const severelyDegradedModules = modules.filter((m) => m.soh < 75);
  if (severelyDegradedModules.length >= 3) {
    const ids = severelyDegradedModules.map((m) => `#${m.id}`).join(', ');
    return {
      severity: 'overhaul',
      title: 'Batch Module Overhaul / Bench Reconditioning Recommended',
      badgeText: '🟡 Batch Overhaul Recommended',
      description: `${severelyDegradedModules.length} modules (${ids}) are degraded below 75% SOH. High string variance is causing severe pack derating and BMS cutoff events.`,
      bottleneckModuleId: bottleneckModule.id,
      recommendedAction: `Pull pack for comprehensive bench diagnostics. Swap defective modules (${ids}) with matched capacity units rated within ±3% of remaining healthy modules (~${Math.round(averageSoh)}% SOH), followed by manual cell top-balancing.`,
      targetReplacementSohRange: {
        min: Math.max(70, Math.floor(averageSoh - 4)),
        max: Math.min(95, Math.ceil(averageSoh + 2)),
      },
      rebalanceCandidateCount: severelyDegradedModules.length,
      flaggedModules: severelyDegradedModules.map((m) => m.id),
    };
  }

  // 4. Single or Double Defective Bottleneck Module (1-2 modules < 75% or deviating > 8% from average while others > 82%)
  const outlierModules = modules.filter(
    (m) => m.soh < 76 || (averageSoh - m.soh >= 8 && m.soh < 82)
  );
  if (outlierModules.length >= 1 && outlierModules.length <= 2) {
    const outlierNames = outlierModules.map((m) => `${m.name} (${m.soh}% SOH)`).join(' and ');
    const healthyAvg = modules
      .filter((m) => !outlierModules.includes(m))
      .reduce((sum, m) => sum + m.soh, 0) / (modules.length - outlierModules.length);

    const minMatch = Math.max(70, Math.floor(healthyAvg - 4));
    const maxMatch = Math.min(100, Math.ceil(healthyAvg + 2));

    return {
      severity: 'replace',
      title: `Module Replacement Recommended: ${outlierModules.map((m) => m.name).join(', ')}`,
      badgeText: '🟡 Module Replacement Recommended',
      description: `${outlierNames} is acting as the string bottleneck, stranding ${analysis.wastedCapacityKwh} kWh of capacity in the remaining healthy modules.`,
      bottleneckModuleId: outlierModules[0].id,
      recommendedAction: `Replace ${outlierModules.map((m) => m.name).join(', ')}. To prevent passive balancing strain on the BMS, select replacement module(s) matching the string health window: ${minMatch}% – ${maxMatch}% SOH. Avoid installing a 100% brand-new module into an aged string without charge derating.`,
      targetReplacementSohRange: { min: minMatch, max: maxMatch },
      rebalanceCandidateCount: outlierModules.length,
      flaggedModules: outlierModules.map((m) => m.id),
    };
  }

  // 5. Mild String Imbalance (Delta SOH between 4% and 8%)
  if (deltaSoh >= 4.0) {
    return {
      severity: 'rebalance',
      title: 'Active String Top-Rebalancing Recommended',
      badgeText: '🟡 Rebalancing Recommended',
      description: `String SOH variance is elevated (ΔSOH: ${deltaSoh}%). Modules are drifting in State of Charge (SOC) curves, but no single module has suffered irreversible chemical collapse.`,
      bottleneckModuleId: bottleneckModule.id,
      recommendedAction: `Execute an extended CC-CV low-current top-balancing charge cycle at high SOC (>95%) with active BMS balancing enabled for 12–24 hours. Re-evaluate string delta after rest.`,
      targetReplacementSohRange: null,
      rebalanceCandidateCount: modules.filter((m) => m.soh < averageSoh - 2).length,
      flaggedModules: [bottleneckModule.id],
    };
  }

  // 6. Healthy & Balanced Pack
  return {
    severity: 'healthy',
    title: 'Optimal Nominal Health & Balanced Series String',
    badgeText: '🟢 Nominal Health',
    description: `All 8 modules exhibit tight capacity convergence (ΔSOH: ${deltaSoh}%, Avg SOH: ${averageSoh}%). Series current distribution and BMS cell voltages are well within nominal operational margins.`,
    bottleneckModuleId: null,
    recommendedAction: `No physical maintenance or module replacements required. Maintain periodic thermal monitoring, check busbar torque specifications at scheduled interval, and adhere to recommended 80%–90% DoD cycling.`,
    targetReplacementSohRange: null,
    rebalanceCandidateCount: 0,
    flaggedModules: [],
  };
}

/**
 * Recommends target SOH range for replacing a target module
 */
export function getRecommendedReplacementSoh(
  modules: BatteryModule[],
  targetModuleId: number
): { min: number; max: number; recommended: number } {
  const otherModules = modules.filter((m) => m.id !== targetModuleId);
  const sum = otherModules.reduce((acc, m) => acc + m.soh, 0);
  const avg = sum / (otherModules.length || 1);

  const min = Math.max(70, Math.floor(avg - 4));
  const max = Math.min(100, Math.ceil(avg + 2));
  const recommended = Number(avg.toFixed(1));

  return { min, max, recommended };
}
