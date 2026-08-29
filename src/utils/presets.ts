import { BatteryModule, PackGlobalSettings } from '../types';
import { calculateBaselineSoh } from './batteryCalculations';

export interface PresetScenario {
  id: string;
  name: string;
  badge: string;
  description: string;
  settings: PackGlobalSettings;
  customModules?: (baselineSoh: number) => BatteryModule[];
}

export const PRESET_SCENARIOS: PresetScenario[] = [
  {
    id: 'factory_fresh',
    name: '1. Brand New Factory Pack',
    badge: '100% SOH',
    description: '0 cycles, pristine 384V string with zero cell divergence and optimal thermal status.',
    settings: {
      cycles: 25,
      calendarYears: 0.2,
      temperature: 'optimal',
      dod: '80',
      intensity: '0.5C',
      ratedModuleCapacityAh: 100,
      dailyCycles: 1.0,
      packSerialNumber: 'BESS-384V-2026-ALPHA-01',
      siteLocation: 'West Substation Array A-12',
    },
    customModules: () =>
      Array.from({ length: 8 }, (_, i) => ({
        id: i + 1,
        name: `Module #${i + 1}`,
        serialNumber: `LFP48-MOD0${i + 1}-A`,
        nominalVoltage: 48.0,
        soh: 99.5 - (i % 2 === 0 ? 0.2 : 0.4),
        internalResistance: 'normal',
        customModified: false,
        installedDate: '2026-01-10',
      })),
  },
  {
    id: 'single_bottleneck',
    name: '2. Defective Bottleneck (Mod #3)',
    badge: 'Replace Mod #3',
    description: 'Pack at 2,400 cycles (~88% avg), but Module #3 has severely degraded to 68%, capping whole string output.',
    settings: {
      cycles: 2400,
      calendarYears: 4,
      temperature: 'optimal',
      dod: '100',
      intensity: '0.5C',
      ratedModuleCapacityAh: 100,
      dailyCycles: 1.2,
      packSerialNumber: 'BESS-384V-2022-COMM-08',
      siteLocation: 'Solar Farm B ESS Unit 4',
    },
    customModules: (baseline) => {
      const base = Math.max(86, baseline);
      return Array.from({ length: 8 }, (_, i) => {
        if (i === 2) {
          // Module #3 severe degradation
          return {
            id: 3,
            name: 'Module #3',
            serialNumber: 'LFP48-MOD03-A',
            nominalVoltage: 48.0,
            soh: 68.4,
            internalResistance: 'elevated',
            customModified: true,
            installedDate: '2022-06-15',
          };
        }
        return {
          id: i + 1,
          name: `Module #${i + 1}`,
          serialNumber: `LFP48-MOD0${i + 1}-A`,
          nominalVoltage: 48.0,
          soh: Number((base + (i % 3 === 0 ? 1.2 : -0.8)).toFixed(1)),
          internalResistance: 'normal',
          customModified: false,
          installedDate: '2022-06-15',
        };
      });
    },
  },
  {
    id: 'imbalanced_string',
    name: '3. Imbalanced String (Needs Top-Balance)',
    badge: 'Rebalance',
    description: '3,000 cycles with mild voltage drift (ΔSOH ~6.8%), suitable for active BMS equalization without physical swap.',
    settings: {
      cycles: 3000,
      calendarYears: 5,
      temperature: 'warm',
      dod: '90',
      intensity: '0.5C',
      ratedModuleCapacityAh: 100,
      dailyCycles: 1.0,
      packSerialNumber: 'BESS-384V-2021-PEAK-21',
      siteLocation: 'Commercial Microgrid Hub 2',
    },
    customModules: () => [
      { id: 1, name: 'Module #1', serialNumber: 'LFP48-MOD01-A', nominalVoltage: 48.0, soh: 86.2, internalResistance: 'normal', customModified: true },
      { id: 2, name: 'Module #2', serialNumber: 'LFP48-MOD02-A', nominalVoltage: 48.0, soh: 84.8, internalResistance: 'normal', customModified: true },
      { id: 3, name: 'Module #3', serialNumber: 'LFP48-MOD03-A', nominalVoltage: 48.0, soh: 80.5, internalResistance: 'normal', customModified: true },
      { id: 4, name: 'Module #4', serialNumber: 'LFP48-MOD04-A', nominalVoltage: 48.0, soh: 87.0, internalResistance: 'normal', customModified: true },
      { id: 5, name: 'Module #5', serialNumber: 'LFP48-MOD05-A', nominalVoltage: 48.0, soh: 81.2, internalResistance: 'normal', customModified: true },
      { id: 6, name: 'Module #6', serialNumber: 'LFP48-MOD06-A', nominalVoltage: 48.0, soh: 85.5, internalResistance: 'normal', customModified: true },
      { id: 7, name: 'Module #7', serialNumber: 'LFP48-MOD07-A', nominalVoltage: 48.0, soh: 83.1, internalResistance: 'normal', customModified: true },
      { id: 8, name: 'Module #8', serialNumber: 'LFP48-MOD08-A', nominalVoltage: 48.0, soh: 86.8, internalResistance: 'normal', customModified: true },
    ],
  },
  {
    id: 'thermal_hazard',
    name: '4. Critical Internal Resistance Risk',
    badge: '⚠️ Thermal Risk',
    description: 'Module #6 shows critical internal resistance (4.8 mΩ). Immediate isolation required to prevent thermal runaway.',
    settings: {
      cycles: 1850,
      calendarYears: 3,
      temperature: 'hot',
      dod: '100',
      intensity: '1.0C',
      ratedModuleCapacityAh: 100,
      dailyCycles: 1.5,
      packSerialNumber: 'BESS-384V-2023-IND-03',
      siteLocation: 'Industrial Peak Shaving Bay 3',
    },
    customModules: () =>
      Array.from({ length: 8 }, (_, i) => ({
        id: i + 1,
        name: `Module #${i + 1}`,
        serialNumber: `LFP48-MOD0${i + 1}-A`,
        nominalVoltage: 48.0,
        soh: i === 5 ? 74.0 : 88.0 - (i * 0.5),
        internalResistance: i === 5 ? 'critical' : i === 2 ? 'elevated' : 'normal',
        customModified: i === 5,
      })),
  },
  {
    id: 'pack_eol',
    name: '5. Pack End-of-Life (9,200 Cycles)',
    badge: '🔴 Decommission',
    description: 'Aged string nearing secondary lifecycle limit (>9,000 cycles). Whole-pack replacement/recycling required.',
    settings: {
      cycles: 9200,
      calendarYears: 14,
      temperature: 'warm',
      dod: '100',
      intensity: '0.5C',
      ratedModuleCapacityAh: 100,
      dailyCycles: 1.0,
      packSerialNumber: 'BESS-384V-2012-UTIL-99',
      siteLocation: 'Utility Grid Substation East',
    },
    customModules: () =>
      Array.from({ length: 8 }, (_, i) => ({
        id: i + 1,
        name: `Module #${i + 1}`,
        serialNumber: `LFP48-MOD0${i + 1}-A`,
        nominalVoltage: 48.0,
        soh: Number((69.5 - (i % 3 === 0 ? 2.5 : 1.0)).toFixed(1)),
        internalResistance: i % 2 === 0 ? 'elevated' : 'normal',
        customModified: false,
      })),
  },
];
