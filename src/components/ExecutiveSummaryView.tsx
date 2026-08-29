import React from 'react';
import {
  Zap,
  Battery,
  AlertTriangle,
  CheckCircle2,
  Wrench,
  FileText,
  ShieldAlert,
  ArrowUpRight,
  Printer,
} from 'lucide-react';
import {
  BatteryModule,
  PackAnalysis,
  PackGlobalSettings,
  DiagnosticResult,
} from '../types';
import { useLanguage } from '../i18n/translations';

interface ExecutiveSummaryViewProps {
  modules: BatteryModule[];
  analysis: PackAnalysis;
  settings: PackGlobalSettings;
  diagnostics: DiagnosticResult;
  onOpenRepairModal: (moduleId?: number) => void;
  onOpenWorkOrderModal: () => void;
  onSwitchToSimulator: () => void;
  onOpenPresets: () => void;
}

export const ExecutiveSummaryView: React.FC<ExecutiveSummaryViewProps> = ({
  modules,
  analysis,
  settings,
  diagnostics,
  onOpenRepairModal,
  onOpenWorkOrderModal,
  onSwitchToSimulator,
}) => {
  const { t } = useLanguage();

  const {
    effectivePackSoh = 100,
    averageSoh = 100,
    deltaSoh = 0,
    nameplateCapacityKwh = 38.4,
    effectiveCapacityKwh = 38.4,
    wastedCapacityKwh = 0,
    wastedEnergyKwh = 0,
    bottleneckModule = modules[0] || { id: 1, name: 'Module #1', soh: 100 },
    remainingCyclesTo80 = 4000,
    remainingCyclesTo70 = 6000,
    estimatedMonthsTo80 = 130,
    nominalVoltage = 384,
    wearVelocity = 'normal',
  } = analysis || {};

  const {
    severity = 'healthy',
    targetReplacementSohRange,
  } = diagnostics || {};

  // Resolve dynamic localized diagnostic text
  const getLocalizedDiagnostics = () => {
    const criticalIrModules = modules
      .filter((m) => m.internalResistance === 'critical')
      .map((m) => `${t('module')} #${m.id}`)
      .join(', ');

    const degradedModules = modules
      .filter((m) => m.soh < 75)
      .map((m) => `${t('module')} #${m.id}`)
      .join(', ');

    const degradedCount = modules.filter((m) => m.soh < 75).length;

    switch (severity) {
      case 'critical_safety':
        return {
          title: t('diagSafetyTitle'),
          badge: t('diagSafetyBadge'),
          desc: t('diagSafetyDesc', { modules: criticalIrModules || `${t('module')} #${bottleneckModule.id}` }),
          action: t('diagSafetyAction', { modules: criticalIrModules || `${t('module')} #${bottleneckModule.id}` }),
          urgentNotice: t('diagSafetyNotice'),
        };
      case 'eol':
        return {
          title: t('diagEolTitle'),
          badge: t('diagEolBadge'),
          desc: t('diagEolDesc', { avg: averageSoh.toFixed(1), cycles: remainingCyclesTo80 }),
          action: t('diagEolAction'),
          urgentNotice: null,
        };
      case 'overhaul':
        return {
          title: t('diagOverhaulTitle'),
          badge: t('diagOverhaulBadge'),
          desc: t('diagOverhaulDesc', { count: degradedCount, modules: degradedModules, avg: averageSoh.toFixed(0) }),
          action: t('diagOverhaulAction', { modules: degradedModules, avg: averageSoh.toFixed(0) }),
          urgentNotice: null,
        };
      case 'replace':
        return {
          title: t('diagReplaceTitle', { modules: `${t('module')} #${bottleneckModule.id}` }),
          badge: t('diagReplaceBadge'),
          desc: t('diagReplaceDesc', { modules: `${t('module')} #${bottleneckModule.id}`, wasted: (wastedCapacityKwh ?? 0).toFixed(1) }),
          action: t('diagReplaceAction', {
            modules: `${t('module')} #${bottleneckModule.id}`,
            min: targetReplacementSohRange?.min ?? 85,
            max: targetReplacementSohRange?.max ?? 92,
          }),
          urgentNotice: null,
        };
      case 'rebalance':
        return {
          title: t('diagRebalanceTitle'),
          badge: t('diagRebalanceBadge'),
          desc: t('diagRebalanceDesc'),
          action: t('diagRebalanceAction'),
          urgentNotice: null,
        };
      case 'healthy':
      default:
        return {
          title: t('diagNominalTitle'),
          badge: t('diagNominalBadge'),
          desc: t('diagNominalDesc'),
          action: t('diagNominalAction'),
          urgentNotice: null,
        };
    }
  };

  const localizedDiag = getLocalizedDiagnostics();

  const stringCurrentCapacityAh = ((settings?.ratedModuleCapacityAh || 100) * (effectivePackSoh || 100)) / 100;
  const hasSevereBottleneck = deltaSoh > 6;

  // Calculate annual estimated financial impact of stranded capacity
  const annualCycles = 365;
  const energyPricePerKwh = 0.15;
  const annualStrandedKwh = wastedCapacityKwh * annualCycles;
  const annualStrandedLossDollars = Math.round(annualStrandedKwh * energyPricePerKwh);

  // Health Score / Grade
  const getPackGrade = () => {
    if (localizedDiag.urgentNotice) return { grade: 'F', label: t('gradeHazard'), color: 'text-red-600 bg-red-50 border-red-200' };
    if (effectivePackSoh >= 90 && deltaSoh <= 3) return { grade: 'A', label: t('gradeExcellent'), color: 'text-emerald-600 bg-emerald-50 border-emerald-200' };
    if (effectivePackSoh >= 80 && deltaSoh <= 5) return { grade: 'B', label: t('gradeGood'), color: 'text-blue-600 bg-blue-50 border-blue-200' };
    if (effectivePackSoh >= 75 || deltaSoh <= 8) return { grade: 'C', label: t('gradeFair'), color: 'text-amber-600 bg-amber-50 border-amber-200' };
    return { grade: 'D', label: t('gradeDegraded'), color: 'text-orange-600 bg-orange-50 border-orange-200' };
  };

  const packGrade = getPackGrade();

  // Status badge styling
  const getStatusBadgeClass = () => {
    if (severity === 'critical_safety' || severity === 'eol') {
      return 'bg-red-100 text-red-800 border-red-300';
    }
    if (severity === 'replace' || severity === 'rebalance' || severity === 'overhaul') {
      return 'bg-yellow-100 text-yellow-900 border-yellow-300';
    }
    return 'bg-emerald-100 text-emerald-800 border-emerald-300';
  };

  return (
    <div className="space-y-5 animate-in fade-in duration-200">
      {/* 1. Top Executive Banner */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start sm:items-center gap-3.5">
          <div
            className={`w-12 h-12 rounded-xl flex items-center justify-center border shrink-0 shadow-xs ${packGrade.color}`}
          >
            <Battery className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
                {t('packStatusHeader')}
              </span>
              <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${getStatusBadgeClass()}`}>
                {localizedDiag.title}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              384V DC {t('stringTopology')} • {settings.cycles.toLocaleString()} {t('cycles')} • {packGrade.label}
            </p>
          </div>
        </div>

        {/* Quick Action Toolbar */}
        <div className="flex items-center gap-2 flex-wrap sm:justify-end">
          <button
            type="button"
            onClick={() => window.print()}
            className="px-3 py-1.5 rounded-xl text-sm font-semibold bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 transition-all flex items-center gap-1.5 shadow-2xs cursor-pointer"
            title="Print summary report"
          >
            <Printer className="w-4 h-4 text-slate-500" />
            <span className="text-sm">{t('printReport')}</span>
          </button>

          <button
            type="button"
            onClick={() => onOpenRepairModal(bottleneckModule.id)}
            className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 transition-all flex items-center gap-1.5 shadow-2xs cursor-pointer"
            title={t('simulateRepair')}
          >
            <Wrench className="w-3.5 h-3.5 text-blue-600" />
            <span>{t('simulateRepair')}</span>
          </button>

          <button
            type="button"
            onClick={onOpenWorkOrderModal}
            className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white transition-all flex items-center gap-1.5 shadow-xs cursor-pointer"
            title={t('generateWorkOrder')}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>{t('workOrder')}</span>
          </button>
        </div>
      </div>

      {/* Safety Notice if Urgent */}
      {localizedDiag.urgentNotice && (
        <div className="bg-red-600 text-white p-3.5 rounded-xl shadow-sm flex items-center gap-3 text-xs font-bold">
          <ShieldAlert className="w-5 h-5 shrink-0 animate-bounce" />
          <span>{localizedDiag.urgentNotice}</span>
        </div>
      )}

      {/* 2. Top 4 Critical KPI Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Usable Capacity */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
              <span className="font-bold uppercase tracking-wider text-[10px]">{t('usableEnergy')}</span>
              <span className="font-mono text-[11px] text-slate-400">384V String</span>
            </div>
            <div className="mt-1 flex items-baseline gap-1.5">
              <span className="text-2xl font-black font-mono text-slate-900">{effectiveCapacityKwh}</span>
              <span className="text-xs text-slate-500">/ {nameplateCapacityKwh} kWh</span>
            </div>
            <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden mt-2.5">
              <div
                className={`h-full rounded-full transition-all duration-300 ${
                  effectivePackSoh >= 80 ? 'bg-emerald-500' : effectivePackSoh >= 70 ? 'bg-amber-500' : 'bg-red-500'
                }`}
                style={{ width: `${Math.min(100, Math.max(0, effectivePackSoh))}%` }}
              />
            </div>
          </div>
          <div className="mt-3 pt-2.5 border-t border-slate-100 text-xs flex items-center justify-between">
            <span className="text-slate-500">{t('strandedLoss')}:</span>
            {wastedCapacityKwh > 0 ? (
              <span className="font-bold font-mono text-orange-600">
                -{wastedCapacityKwh} kWh ({t('module')} #{bottleneckModule.id})
              </span>
            ) : (
              <span className="font-semibold text-emerald-600">{t('balanced100')}</span>
            )}
          </div>
        </div>

        {/* KPI 2: Effective SOH vs Avg SOH */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
              <span className="font-bold uppercase tracking-wider text-[10px]">{t('effectivePackSoh')}</span>
              <span className={`text-[10px] font-bold uppercase ${deltaSoh > 5 ? 'text-amber-600' : 'text-emerald-600'}`}>
                {deltaSoh > 5 ? t('imbalanced') : t('balanced')}
              </span>
            </div>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-2xl font-black font-mono text-slate-900">{effectivePackSoh.toFixed(1)}%</span>
              <span className="text-xs text-slate-500 font-mono">({t('avgSoh')} {averageSoh}%)</span>
            </div>
            <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden mt-2.5">
              <div
                className={`h-full rounded-full transition-all duration-300 ${
                  deltaSoh <= 4 ? 'bg-emerald-500' : deltaSoh <= 8 ? 'bg-amber-500' : 'bg-red-500'
                }`}
                style={{ width: `${Math.min(100, Math.max(10, 100 - deltaSoh * 4))}%` }}
              />
            </div>
          </div>
          <div className="mt-3 pt-2.5 border-t border-slate-100 text-xs flex items-center justify-between">
            <span className="text-slate-500">{t('spreadDeltaSoh')}:</span>
            <span className={`font-mono font-bold ${deltaSoh > 5 ? 'text-amber-700' : 'text-slate-800'}`}>
              Δ{deltaSoh}% SOH
            </span>
          </div>
        </div>

        {/* KPI 3: Remaining Useful Life (RUL) */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
              <span className="font-bold uppercase tracking-wider text-[10px]">{t('lifeSpanRul')}</span>
              <span className="font-mono text-[11px] text-slate-400">{t('tabCharts')}</span>
            </div>
            <div className="mt-1 flex items-baseline gap-1.5">
              {effectivePackSoh <= 80 ? (
                <span className="text-xl font-black text-rose-600">{t('pastEol')}</span>
              ) : (
                <>
                  <span className="text-2xl font-black font-mono text-slate-900">
                    ~{remainingCyclesTo80.toLocaleString()}
                  </span>
                  <span className="text-xs text-slate-500">{t('cycles')}</span>
                </>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-1">
              {effectivePackSoh <= 80 ? t('replaceDegradedModules') : t('estMonthsRemaining', { months: estimatedMonthsTo80 })}
            </p>
          </div>
          <div className="mt-3 pt-2.5 border-t border-slate-100 text-xs flex items-center justify-between">
            <span className="text-slate-500">{t('critical70Cutoff')}:</span>
            <span className="font-mono font-semibold text-slate-700">~{remainingCyclesTo70.toLocaleString()} {t('cycles')}</span>
          </div>
        </div>

        {/* KPI 4: Financial & Stranded Impact */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
              <span className="font-bold uppercase tracking-wider text-[10px]">{t('strandedImpact')}</span>
              <span className="font-mono text-[11px] text-slate-400">{t('annualLoss')}</span>
            </div>
            <div className="mt-1 flex items-baseline gap-1">
              <span className="text-2xl font-black font-mono text-slate-900">${annualStrandedLossDollars}</span>
              <span className="text-xs text-slate-500">{t('perYearLoss')}</span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              {wastedCapacityKwh > 0
                ? `${wastedCapacityKwh} kWh ${t('trappedDaily')}`
                : t('zeroStrandedLoss')}
            </p>
          </div>
          <div className="mt-3 pt-2.5 border-t border-slate-100 text-xs flex items-center justify-between">
            <span className="text-slate-500">{t('bottleneck')}:</span>
            <span className="font-bold font-mono text-blue-700">{t('module')} #{bottleneckModule.id} ({bottleneckModule.soh}%)</span>
          </div>
        </div>
      </div>

      {/* 3. Middle Section: String Bottleneck Analysis & Action Recommendation */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Recommended Action Plan (Takes 2 Cols) */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-blue-50 text-blue-600 border border-blue-100">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">{t('recommendedPlanTitle')}</h3>
                  <p className="text-xs text-slate-500">{t('engineeringGuidance')}</p>
                </div>
              </div>

              {targetReplacementSohRange && (
                <div className="bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-xl text-xs font-mono font-bold text-emerald-800">
                  {t('targetReplacementWindow')}: {targetReplacementSohRange.min}%–{targetReplacementSohRange.max}% SOH
                </div>
              )}
            </div>

            <div className="mt-3.5 space-y-2.5">
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                <p className="text-xs text-slate-800 leading-relaxed font-medium">
                  {localizedDiag.action}
                </p>
              </div>

              {hasSevereBottleneck && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-2.5 text-xs text-amber-900">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <p>
                    <strong>{t('severeBottleneckTitle')}:</strong> {t('severeBottleneckDesc', {
                      module: `${t('module')} #${bottleneckModule.id}`,
                      diff: Math.abs(bottleneckModule.soh - averageSoh).toFixed(1),
                      wasted: wastedCapacityKwh,
                    })}
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            <span className="text-slate-500">
              {t('testReplacingPrompt', { module: `${t('module')} #${bottleneckModule.id}` })}
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onSwitchToSimulator}
                className="text-xs font-semibold text-slate-700 hover:text-slate-900 px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 cursor-pointer transition-colors"
              >
                {t('openSimulator')}
              </button>
              <button
                type="button"
                onClick={() => onOpenRepairModal(bottleneckModule.id)}
                className="text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 px-3.5 py-1.5 rounded-lg shadow-2xs flex items-center gap-1.5 cursor-pointer transition-colors"
              >
                <span>{t('launchWhatIf')}</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Series String Specs & Operational Context */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-3.5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-2.5 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-100">
                  <Zap className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-bold text-slate-900">{t('packConfigTitle')}</h3>
              </div>
              <span className="text-[10px] font-mono bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-full font-bold">
                LiFePO4 LFP
              </span>
            </div>

            <div className="mt-3 space-y-2 text-xs font-mono">
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500 font-sans">{t('stringTopology')}</span>
                <span className="font-bold text-slate-800">8S1P (8 {t('seriesModules')})</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500 font-sans">{t('nominalVoltage')}</span>
                <span className="font-bold text-emerald-600">{nominalVoltage}V DC (8×48V)</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500 font-sans">{t('nameplateEnergy')}</span>
                <span className="font-bold text-slate-800">{nameplateCapacityKwh} kWh</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500 font-sans">{t('stringCapacityAh')}</span>
                <span className="font-bold text-blue-600">{stringCurrentCapacityAh.toFixed(1)} Ah</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-500 font-sans">{t('wearVelocity')}</span>
                <span className="font-bold capitalize text-slate-800">{wearVelocity || 'normal'}</span>
              </div>
            </div>
          </div>

          <div className="p-2.5 bg-slate-50 rounded-xl text-[11px] text-slate-600 font-sans leading-normal border border-slate-200">
            <strong className="text-slate-800">{t('cutoffPrinciple')}:</strong> {t('cutoffPrincipleDesc')}
          </div>
        </div>
      </div>

      {/* 4. 8-Module Matrix Overview Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-100">
          <div>
            <h3 className="text-sm font-bold text-slate-900">{t('moduleMatrixTitle')}</h3>
            <p className="text-xs text-slate-500">{t('moduleMatrixDesc')}</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 font-mono">
              {t('bottleneck')}: <span className="font-bold text-rose-600">{t('module')} #{bottleneckModule.id} ({bottleneckModule.soh}%)</span>
            </span>
          </div>
        </div>

        {/* Responsive Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                <th className="py-2.5 px-3">{t('tableModule')}</th>
                <th className="py-2.5 px-3">{t('tableNominalPos')}</th>
                <th className="py-2.5 px-3">{t('tableSoh')}</th>
                <th className="py-2.5 px-3">{t('tableHealthStatus')}</th>
                <th className="py-2.5 px-3">{t('tableIR')}</th>
                <th className="py-2.5 px-3">{t('tableUsableKwh')}</th>
                <th className="py-2.5 px-3 text-right">{t('tableAction')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {modules.map((m) => {
                const isBottleneck = m.id === bottleneckModule.id && deltaSoh > 0.5;
                const moduleKwh = Number(((12.5 * m.soh) / 100).toFixed(2));

                return (
                  <tr
                    key={m.id}
                    className={`transition-colors ${
                      isBottleneck
                        ? 'bg-rose-50/70 hover:bg-rose-100/60 font-semibold'
                        : 'hover:bg-slate-50/80'
                    }`}
                  >
                    <td className="py-2.5 px-3 flex items-center gap-2">
                      <span className="font-bold text-slate-900">{t('module')} #{m.id}</span>
                      {isBottleneck && (
                        <span className="px-1.5 py-0.5 bg-rose-600 text-white rounded text-[10px] font-bold uppercase">
                          {t('badgeWeakest')}
                        </span>
                      )}
                      {m.customModified && (
                        <span className="text-[9px] bg-blue-100 text-blue-800 px-1 py-0.2 rounded font-mono">
                          {t('custom')}
                        </span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-slate-600 font-mono">
                      48V #{m.id}
                    </td>
                    <td className="py-2.5 px-3 font-mono font-bold text-slate-900">
                      {m.soh.toFixed(1)}%
                    </td>
                    <td className="py-2.5 px-3">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          m.soh >= 90
                            ? 'bg-emerald-100 text-emerald-800'
                            : m.soh >= 80
                            ? 'bg-blue-100 text-blue-800'
                            : m.soh >= 70
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {m.soh >= 90 ? t('badgeHealthy') : m.soh >= 80 ? t('normal') : m.soh >= 70 ? t('badgeDegraded') : t('badgeCritical')}
                      </span>
                    </td>
                    <td className="py-2.5 px-3">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold uppercase ${
                          m.internalResistance === 'optimal'
                            ? 'bg-slate-100 text-slate-700'
                            : m.internalResistance === 'elevated'
                            ? 'bg-amber-100 text-amber-800 font-bold'
                            : 'bg-red-100 text-red-800 font-bold'
                        }`}
                      >
                        {m.internalResistance === 'optimal' ? t('irOptimal') : m.internalResistance === 'elevated' ? t('irElevated') : t('irCritical')}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 font-mono text-slate-700">
                      {moduleKwh} kWh
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      <button
                        type="button"
                        onClick={() => onOpenRepairModal(m.id)}
                        className="text-xs font-semibold text-blue-600 hover:text-blue-800 hover:underline cursor-pointer"
                      >
                        {t('simulate')}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
