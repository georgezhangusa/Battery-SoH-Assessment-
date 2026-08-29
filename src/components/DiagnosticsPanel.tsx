import React from 'react';
import {
  AlertTriangle,
  Flame,
  Wrench,
  FileText,
  Sparkles,
  ShieldCheck,
  ShieldAlert,
} from 'lucide-react';
import { DiagnosticResult, PackAnalysis, BatteryModule } from '../types';
import { useLanguage } from '../i18n/translations';

interface DiagnosticsPanelProps {
  diagnostics: DiagnosticResult;
  analysis: PackAnalysis;
  modules?: BatteryModule[];
  onOpenRepairModal?: () => void;
  onOpenWorkOrderModal?: () => void;
  onOpenPresets?: () => void;
}

export const DiagnosticsPanel: React.FC<DiagnosticsPanelProps> = ({
  diagnostics,
  analysis,
  modules = [],
  onOpenRepairModal,
  onOpenWorkOrderModal,
  onOpenPresets,
}) => {
  const { t } = useLanguage();

  const {
    severity,
    targetReplacementSohRange,
  } = diagnostics;

  const {
    effectivePackSoh,
    effectiveCapacityKwh,
    nameplateCapacityKwh,
    bottleneckModule,
    remainingCyclesTo80,
    estimatedMonthsTo80,
    deltaSoh,
    wastedCapacityKwh,
    averageSoh,
  } = analysis;

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

  const localized = getLocalizedDiagnostics();

  const getTheme = () => {
    switch (severity) {
      case 'critical_safety':
        return {
          bg: 'bg-red-50/70 border-red-300 ring-2 ring-red-300/50',
          badge: 'bg-red-600 text-white font-bold',
          icon: <Flame className="w-5 h-5 text-red-600" />,
        };
      case 'eol':
        return {
          bg: 'bg-red-50/70 border-red-300 ring-1 ring-red-200',
          badge: 'bg-red-600 text-white font-bold',
          icon: <ShieldAlert className="w-5 h-5 text-red-600" />,
        };
      case 'overhaul':
      case 'replace':
      case 'rebalance':
        return {
          bg: 'bg-yellow-50/80 border-yellow-300 ring-1 ring-yellow-200/50',
          badge: 'bg-yellow-400 text-yellow-950 font-bold border border-yellow-500/40 shadow-2xs',
          icon: <AlertTriangle className="w-5 h-5 text-yellow-600" />,
        };
      case 'healthy':
      default:
        return {
          bg: 'bg-emerald-50/60 border-emerald-300',
          badge: 'bg-emerald-600 text-white font-bold',
          icon: <ShieldCheck className="w-5 h-5 text-emerald-600" />,
        };
    }
  };

  const theme = getTheme();

  return (
    <section
      className={`p-3.5 sm:p-4 rounded-2xl border shadow-sm transition-all bg-white flex flex-col justify-between space-y-2.5 h-full ${theme.bg}`}
    >
      <div className="space-y-2.5">
        {/* Top Banner: Status Header */}
        <div className="flex items-center gap-2 pb-2 border-b border-slate-200/70">
          <div className="p-1.5 rounded-lg bg-white shadow-2xs border border-slate-200 shrink-0">
            {theme.icon}
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span
                className={`text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${theme.badge}`}
              >
                {localized.badge}
              </span>
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                {t('diagnosisAndSuggestion')}
              </span>
            </div>
            <h3 className="text-sm sm:text-base font-bold text-slate-900 tracking-tight mt-0.5">
              {localized.title}
            </h3>
          </div>
        </div>

        {/* Critical Safety Notice if present */}
        {localized.urgentNotice && (
          <div className="p-2 bg-red-600 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-xs">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{localized.urgentNotice}</span>
          </div>
        )}

        {/* 4 Summary Metric Pills (Fast Readability) */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-2 xl:grid-cols-4 gap-2">
          <div className="bg-white/90 p-2 sm:p-2.5 rounded-xl border border-slate-200 shadow-2xs">
            <div className="text-[10px] font-semibold uppercase text-slate-500">{t('effectivePackSoh')}</div>
            <div className="text-base font-mono font-black text-slate-900 mt-0.5">
              {effectivePackSoh.toFixed(1)}%
            </div>
            <div className="text-[10px] text-slate-500 mt-0.5 truncate">
              {t('bottleneck')}: <span className="font-bold text-slate-800">{t('module')} #{bottleneckModule.id}</span>
            </div>
          </div>

          <div className="bg-white/90 p-2 sm:p-2.5 rounded-xl border border-slate-200 shadow-2xs">
            <div className="text-[10px] font-semibold uppercase text-slate-500">{t('usableEnergy')}</div>
            <div className="text-base font-mono font-black text-slate-900 mt-0.5">
              {effectiveCapacityKwh}{' '}
              <span className="text-[10px] font-normal text-slate-500">/ {nameplateCapacityKwh} kWh</span>
            </div>
            <div className="text-[10px] text-slate-500 mt-0.5">
              {t('spreadDeltaSoh')}: <span className="font-bold text-slate-800">Δ{deltaSoh}% SOH</span>
            </div>
          </div>

          <div className="bg-white/90 p-2 sm:p-2.5 rounded-xl border border-slate-200 shadow-2xs">
            <div className="text-[10px] font-semibold uppercase text-slate-500">{t('lifeSpanRul')}</div>
            <div className="text-base font-mono font-black text-slate-900 mt-0.5">
              {effectivePackSoh <= 80 ? (
                <span className="text-orange-600 text-xs font-bold">{t('pastEol')}</span>
              ) : (
                `~${remainingCyclesTo80.toLocaleString()} ${t('cycles')}`
              )}
            </div>
            <div className="text-[10px] text-slate-500 mt-0.5">
              {effectivePackSoh <= 80 ? t('replaceDegradedModules') : t('estMonthsRemaining', { months: estimatedMonthsTo80 })}
            </div>
          </div>

          <div className="bg-white/90 p-2 sm:p-2.5 rounded-xl border border-slate-200 shadow-2xs">
            <div className="text-[10px] font-semibold uppercase text-slate-500">{t('suggestedAction')}</div>
            <div className="text-[11px] font-bold text-blue-700 mt-0.5 leading-tight line-clamp-1">
              {localized.action.split('.')[0]}
            </div>
            {targetReplacementSohRange ? (
              <div className="text-[10px] font-mono text-emerald-700 font-bold mt-0.5 truncate">
                {targetReplacementSohRange.min}%–{targetReplacementSohRange.max}% SOH
              </div>
            ) : (
              <div className="text-[10px] text-emerald-600 font-medium mt-0.5">{t('diagNominalBadge')}</div>
            )}
          </div>
        </div>
      </div>

      {/* Bottom Action Toolbar: Presets, What-If Repair, and Work Order */}
      <div className="flex items-center justify-end gap-2 pt-1.5 border-t border-slate-200/70 flex-wrap">
        {onOpenPresets && (
          <button
            id="header-preset-button"
            type="button"
            onClick={onOpenPresets}
            className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 transition-all flex items-center gap-1 shadow-2xs cursor-pointer"
            title={t('loadTestPreset')}
          >
            <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
            <span>{t('presetsSubtitle')}</span>
          </button>
        )}

        {onOpenRepairModal && (
          <button
            id="header-repair-sim-button"
            type="button"
            onClick={onOpenRepairModal}
            className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 transition-all flex items-center gap-1 shadow-2xs cursor-pointer"
            title={t('simulateRepair')}
          >
            <Wrench className="w-3.5 h-3.5 text-slate-600" />
            <span>{t('simulateRepair')}</span>
          </button>
        )}

        {onOpenWorkOrderModal && (
          <button
            id="header-work-order-button"
            type="button"
            onClick={onOpenWorkOrderModal}
            className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 transition-all flex items-center gap-1 shadow-2xs cursor-pointer"
            title={t('generateWorkOrder')}
          >
            <FileText className="w-3.5 h-3.5 text-slate-500" />
            <span>{t('workOrder')}</span>
          </button>
        )}
      </div>
    </section>
  );
};
