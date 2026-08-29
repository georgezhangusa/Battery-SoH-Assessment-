import React, { useState } from 'react';
import {
  X,
  Wrench,
  Sparkles,
  ArrowRight,
  TrendingUp,
  CheckCircle2,
  DollarSign,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { BatteryModule, PackAnalysis, PackGlobalSettings } from '../types';
import { analyzePack, getRecommendedReplacementSoh } from '../utils/batteryCalculations';
import { useLanguage } from '../i18n/translations';

interface RepairSimulatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  modules: BatteryModule[];
  settings: PackGlobalSettings;
  currentAnalysis: PackAnalysis;
  initialTargetModuleId?: number | null;
  onApplyRepairedModules: (newModules: BatteryModule[]) => void;
}

export const RepairSimulatorModal: React.FC<RepairSimulatorModalProps> = ({
  isOpen,
  onClose,
  modules,
  settings,
  currentAnalysis,
  initialTargetModuleId,
  onApplyRepairedModules,
}) => {
  const { t } = useLanguage();
  if (!isOpen) return null;

  const defaultTargetId = initialTargetModuleId || currentAnalysis.bottleneckModule.id;
  const [selectedModuleId, setSelectedModuleId] = useState<number>(defaultTargetId);

  const matchingRecommendation = getRecommendedReplacementSoh(modules, selectedModuleId);

  const [replacementType, setReplacementType] = useState<'matched' | 'new' | 'custom'>('matched');
  const [customSoh, setCustomSoh] = useState<number>(matchingRecommendation.recommended);

  const replacementSoh =
    replacementType === 'new'
      ? 100
      : replacementType === 'matched'
      ? matchingRecommendation.recommended
      : customSoh;

  const costPerNewModule = 850;
  const costPerMatchedModule = 450;
  const costOfFullNewPack = 5200;

  const estimatedRepairCost =
    replacementType === 'new'
      ? costPerNewModule
      : replacementType === 'matched'
      ? costPerMatchedModule
      : Math.round(costPerMatchedModule * (replacementSoh / 85));

  const simulatedModules: BatteryModule[] = modules.map((m) => {
    if (m.id === selectedModuleId) {
      return {
        ...m,
        soh: replacementSoh,
        internalResistance: 'normal',
        customModified: true,
        serialNumber: `LFP48-SWAP${String(m.id).padStart(2, '0')}-REV`,
      };
    }
    return m;
  });

  const simulatedAnalysis = analyzePack(simulatedModules, settings);

  const deltaCapacity = Number(
    (simulatedAnalysis.effectiveCapacityKwh - currentAnalysis.effectiveCapacityKwh).toFixed(2)
  );
  const deltaSohGain = Number(
    (simulatedAnalysis.effectivePackSoh - currentAnalysis.effectivePackSoh).toFixed(1)
  );
  const deltaRulCycles = Math.max(
    0,
    simulatedAnalysis.remainingCyclesTo80 - currentAnalysis.remainingCyclesTo80
  );
  const deltaRulMonths = Number(
    (simulatedAnalysis.estimatedMonthsTo80 - currentAnalysis.estimatedMonthsTo80).toFixed(1)
  );

  const handleApply = () => {
    try {
      confetti({
        particleCount: 80,
        spread: 65,
        origin: { y: 0.6 },
      });
    } catch {
      // ignore
    }
    onApplyRepairedModules(simulatedModules);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-xl max-w-3xl w-full border border-slate-200 shadow-2xl overflow-hidden my-6">
        {/* Modal Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-blue-500/20 text-blue-400 border border-blue-400/30">
              <Wrench className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold tracking-tight text-white flex items-center gap-2">
                <span>{t('repairSimulator')}</span>
                <span className="text-[10px] uppercase font-mono bg-blue-950 text-blue-300 px-2 py-0.5 rounded border border-blue-800">
                  ROI Engine
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                {t('repairSimulatorSubtitle')}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
          {/* Step 1: Select Target Module */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-900 uppercase tracking-wide flex items-center gap-1.5">
              <span>{t('step1TargetModule')}</span>
              <span className="text-slate-400 font-normal font-mono">(Series Slot)</span>
            </label>

            <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
              {modules.map((m) => {
                const isSelected = m.id === selectedModuleId;
                const isBottleneck = m.id === currentAnalysis.bottleneckModule.id;
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => {
                      setSelectedModuleId(m.id);
                      if (replacementType === 'matched') {
                        const rec = getRecommendedReplacementSoh(modules, m.id);
                        setCustomSoh(rec.recommended);
                      }
                    }}
                    className={`p-2 rounded-lg text-center border transition-all cursor-pointer ${
                      isSelected
                        ? 'border-blue-600 bg-blue-50/50 ring-2 ring-blue-500'
                        : isBottleneck
                        ? 'border-orange-400 bg-orange-50/40 hover:border-orange-500'
                        : 'border-slate-200 bg-slate-50 hover:bg-white'
                    }`}
                  >
                    <div className="text-[10px] font-bold text-slate-700">
                      {t('module').substring(0, 3).toUpperCase()} {String(m.id).padStart(2, '0')}
                    </div>
                    <div className="text-xs font-mono font-bold text-slate-900 mt-0.5">
                      {m.soh.toFixed(1)}%
                    </div>
                    {isBottleneck && (
                      <span className="inline-block mt-1 text-[8px] font-bold uppercase bg-orange-100 text-orange-800 px-1 rounded">
                        {t('badgeWeakest')}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Step 2: Select Replacement Type & SOH */}
          <div className="space-y-3 bg-slate-50 border border-slate-200 rounded-xl p-4">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-900 uppercase tracking-wide flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                <span>{t('step2ReplacementType')}</span>
              </label>

              <div className="text-xs font-mono text-blue-700 font-bold bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                {t('optimalWindow')}: {matchingRecommendation.min}% – {matchingRecommendation.max}%
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Option A: Matched Refurbished */}
              <button
                type="button"
                onClick={() => setReplacementType('matched')}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                  replacementType === 'matched'
                    ? 'border-blue-600 bg-white ring-2 ring-blue-500 shadow-xs'
                    : 'border-slate-200 bg-white/70 hover:bg-white'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-900">
                    {t('matchedRefurbished')}
                  </span>
                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 uppercase">
                    {t('recommended')}
                  </span>
                </div>
                <div className="text-lg font-mono font-bold text-emerald-700 mt-1">
                  {matchingRecommendation.recommended}% SOH
                </div>
                <p className="text-[11px] text-slate-500 mt-1 leading-normal">
                  {t('matchedRefurbishedDesc')}
                </p>
                <div className="text-xs font-mono font-bold text-slate-700 mt-2">
                  {t('estimatedCost')}: ${costPerMatchedModule}
                </div>
              </button>

              {/* Option B: Brand-New OEM */}
              <button
                type="button"
                onClick={() => setReplacementType('new')}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                  replacementType === 'new'
                    ? 'border-blue-600 bg-white ring-2 ring-blue-500 shadow-xs'
                    : 'border-slate-200 bg-white/70 hover:bg-white'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-900">
                    {t('brandNewOem')}
                  </span>
                  <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 uppercase">
                    100% SOH
                  </span>
                </div>
                <div className="text-lg font-mono font-bold text-slate-900 mt-1">
                  100.0% SOH
                </div>
                <p className="text-[11px] text-slate-500 mt-1 leading-normal">
                  {t('brandNewOemDesc')}
                </p>
                <div className="text-xs font-mono font-bold text-slate-700 mt-2">
                  {t('estimatedCost')}: ${costPerNewModule}
                </div>
              </button>

              {/* Option C: Custom SOH slider */}
              <button
                type="button"
                onClick={() => setReplacementType('custom')}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                  replacementType === 'custom'
                    ? 'border-blue-600 bg-white ring-2 ring-blue-500 shadow-xs'
                    : 'border-slate-200 bg-white/70 hover:bg-white'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-900">
                    {t('customBinGrade')}
                  </span>
                  <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 uppercase">
                    {t('manual')}
                  </span>
                </div>
                <div className="text-lg font-mono font-bold text-blue-700 mt-1">
                  {customSoh.toFixed(1)}% SOH
                </div>
                <p className="text-[11px] text-slate-500 mt-1 leading-normal">
                  {t('customBinGradeDesc')}
                </p>
                <div className="text-xs font-mono font-bold text-slate-700 mt-2">
                  {t('estimatedCost')}: ~${estimatedRepairCost}
                </div>
              </button>
            </div>

            {replacementType === 'custom' && (
              <div className="pt-2 bg-white p-3 rounded-lg border border-blue-200">
                <div className="flex justify-between items-center text-xs font-semibold text-slate-700 mb-1.5">
                  <span>{t('customTargetSoh')}:</span>
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      min="60"
                      max="100"
                      step="0.1"
                      value={customSoh}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value);
                        if (!isNaN(val)) {
                          setCustomSoh(Math.max(60, Math.min(100, val)));
                        }
                      }}
                      className="w-16 px-1.5 py-0.5 text-xs font-mono font-bold text-blue-700 bg-blue-50/70 border border-blue-300 rounded text-right focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                    <span className="font-mono font-bold text-slate-600">%</span>
                  </div>
                </div>
                <input
                  type="range"
                  min="60"
                  max="100"
                  step="0.5"
                  value={customSoh}
                  onInput={(e) => setCustomSoh(parseFloat((e.target as HTMLInputElement).value))}
                  onChange={(e) => setCustomSoh(parseFloat(e.target.value))}
                  className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                />
              </div>
            )}
          </div>

          {/* Step 3: Before vs After Impact Analysis */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wide flex items-center gap-1.5">
              <TrendingUp className="w-3.5 h-3.5 text-blue-600" />
              <span>{t('step3PredictedImpact')}</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Metric 1: Usable Capacity Gain */}
              <div className="bg-emerald-50/70 border border-emerald-200 rounded-xl p-3.5 flex flex-col justify-between">
                <div>
                  <div className="text-xs font-semibold text-slate-600">
                    {t('usableCapacityGain')}
                  </div>
                  <div className="flex items-baseline gap-2 mt-1">
                    <span className="text-xs font-mono text-slate-400 line-through">
                      {currentAnalysis.effectiveCapacityKwh} kWh
                    </span>
                    <ArrowRight className="w-3 h-3 text-slate-400" />
                    <span className="text-lg font-mono font-bold text-emerald-800">
                      {simulatedAnalysis.effectiveCapacityKwh} kWh
                    </span>
                  </div>
                </div>
                <div className="mt-2 text-xs font-bold text-emerald-700 flex items-center gap-1">
                  <Sparkles className="w-3 h-3" />
                  <span>+{deltaCapacity} kWh (+{((deltaCapacity / (currentAnalysis.effectiveCapacityKwh || 1)) * 100).toFixed(1)}%)</span>
                </div>
              </div>

              {/* Metric 2: Effective String SOH */}
              <div className="bg-blue-50/70 border border-blue-200 rounded-xl p-3.5 flex flex-col justify-between">
                <div>
                  <div className="text-xs font-semibold text-slate-600">
                    {t('effectiveStringSohGain')}
                  </div>
                  <div className="flex items-baseline gap-2 mt-1">
                    <span className="text-xs font-mono text-slate-400 line-through">
                      {currentAnalysis.effectivePackSoh.toFixed(1)}%
                    </span>
                    <ArrowRight className="w-3 h-3 text-slate-400" />
                    <span className="text-lg font-mono font-bold text-blue-800">
                      {simulatedAnalysis.effectivePackSoh.toFixed(1)}%
                    </span>
                  </div>
                </div>
                <div className="mt-2 text-xs font-bold text-blue-700">
                  +{deltaSohGain}% {t('healthRecovery')}
                </div>
              </div>

              {/* Metric 3: Extended RUL */}
              <div className="bg-indigo-50/70 border border-indigo-200 rounded-xl p-3.5 flex flex-col justify-between">
                <div>
                  <div className="text-xs font-semibold text-slate-600">
                    {t('extendedRul')}
                  </div>
                  <div className="flex items-baseline gap-2 mt-1">
                    <span className="text-lg font-mono font-bold text-indigo-900">
                      +{deltaRulCycles.toLocaleString()} {t('cycles')}
                    </span>
                  </div>
                </div>
                <div className="mt-2 text-xs font-bold text-indigo-700">
                  ~+{deltaRulMonths} {t('monthsOfLife')}
                </div>
              </div>
            </div>

            {/* Financial ROI Callout in Slate 900 */}
            <div className="bg-slate-900 text-slate-200 rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs border border-slate-800">
              <div className="space-y-0.5">
                <div className="font-bold text-white flex items-center gap-1.5">
                  <DollarSign className="w-4 h-4 text-emerald-400" />
                  <span>{t('financialRoi')}:</span>
                </div>
                <p className="text-slate-400">
                  {t('financialRoiDesc', { repairCost: String(estimatedRepairCost), newPackCost: String(costOfFullNewPack) })}
                </p>
              </div>
              <div className="bg-emerald-500/20 border border-emerald-400/40 text-emerald-400 font-mono font-bold px-3 py-1.5 rounded-lg text-xs whitespace-nowrap">
                {t('capexSavings', { amount: String(costOfFullNewPack - estimatedRepairCost) })}
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-200 transition-colors cursor-pointer uppercase tracking-wider"
          >
            {t('cancel')}
          </button>

          <button
            type="button"
            onClick={handleApply}
            className="px-5 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider bg-blue-600 hover:bg-blue-700 text-white shadow-md transition-all flex items-center gap-2 cursor-pointer"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>{t('applyRepair')}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
