export type ResistanceStatus = 'normal' | 'elevated' | 'critical';

export type OperatingTemperature = 'cool' | 'optimal' | 'warm' | 'hot';

export type DepthOfDischarge = '100' | '80' | '90';

export type UsageIntensity = '0.5C' | '1.0C' | '0.25C';

export interface BatteryModule {
  id: number;
  name: string;
  serialNumber: string;
  nominalVoltage: number; // typically 48V (or 51.2V)
  soh: number; // 0 to 100 %
  internalResistance: ResistanceStatus; // normal (1.2mΩ), elevated (2.5mΩ), critical (4.8mΩ)
  customModified: boolean; // if user manually nudged this module from baseline
  installedDate?: string;
  cyclesCompleted?: number;
}

export interface PackGlobalSettings {
  cycles: number; // 1 to 5000
  calendarYears: number; // 0 to 15
  temperature: OperatingTemperature;
  dod: DepthOfDischarge;
  intensity: UsageIntensity;
  ratedModuleCapacityAh: number; // default 100Ah
  dailyCycles: number; // default 1.0 cycles/day
  packSerialNumber: string;
  siteLocation: string;
}

export type DiagnosticSeverity = 'healthy' | 'rebalance' | 'replace' | 'overhaul' | 'eol' | 'critical_safety';

export interface DiagnosticResult {
  severity: DiagnosticSeverity;
  title: string;
  badgeText: string;
  description: string;
  bottleneckModuleId: number | null;
  recommendedAction: string;
  targetReplacementSohRange: { min: number; max: number } | null;
  urgentSafetyNotice?: string;
  rebalanceCandidateCount: number;
  flaggedModules: number[];
}

export interface PackAnalysis {
  effectivePackSoh: number; // min(all modules)
  averageSoh: number;
  maxSoh: number;
  minSoh: number;
  deltaSoh: number; // max - min
  nominalVoltage: number; // e.g. 384V
  nameplateCapacityKwh: number;
  effectiveCapacityKwh: number;
  wastedCapacityKwh: number; // trapped by bottleneck
  bottleneckModule: BatteryModule;
  hasCriticalIR: boolean;
  criticalIRModules: BatteryModule[];
  remainingCyclesTo80: number;
  remainingCyclesTo70: number;
  estimatedMonthsTo80: number;
  estimatedMonthsTo70: number;
  wearVelocity: 'optimal' | 'normal' | 'accelerated';
}

export interface SimulatedRepair {
  targetModuleId: number;
  replacementType: 'new' | 'matched_refurbished' | 'custom';
  replacementSoh: number;
  estimatedCost: number;
  costOfNewPack: number;
}
