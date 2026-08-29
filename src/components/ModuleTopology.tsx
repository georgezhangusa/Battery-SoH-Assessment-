import React from 'react';
import {
  Layers,
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
} from 'lucide-react';
import { BatteryModule, ResistanceStatus, PackAnalysis } from '../types';
import { ModuleCard } from './ModuleCard';
import { useLanguage } from '../i18n/translations';

interface ModuleTopologyProps {
  modules: BatteryModule[];
  analysis: PackAnalysis;
  baselineSoh: number;
  onUpdateSoh: (id: number, soh: number) => void;
  onUpdateIR?: (id: number, ir: ResistanceStatus) => void;
  onResetModule: (id: number) => void;
  onSyncAllModulesToBaseline?: () => void;
  hasCustomModifiedModules?: boolean;
  onOpenRepairForModule?: (id: number) => void;
  onRecalculate?: () => void;
  isRecalculating?: boolean;
  hasPendingChanges?: boolean;
}

export const ModuleTopology: React.FC<ModuleTopologyProps> = ({
  modules,
  analysis,
  baselineSoh,
  onUpdateSoh,
  onUpdateIR,
  onResetModule,
  onSyncAllModulesToBaseline,
  hasCustomModifiedModules = false,
  onOpenRepairForModule,
}) => {
  const { t } = useLanguage();
  const { bottleneckModule, deltaSoh } = analysis;
  const hasBottleneck = deltaSoh >= 2.0;

  return (
    <section className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3.5">
      {/* Topology Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-slate-100">
        <div className="flex items-center gap-3 min-w-0">
          <div className="p-2 rounded-xl bg-blue-50 text-blue-600 border border-blue-100 shrink-0">
            <Layers className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <h2 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
              {t('moduleTopologyTitle')}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              {t('moduleStructureDesc')}
            </p>
          </div>
        </div>

        {/* Bottleneck Status Badge & Reset All Modules Button */}
        <div className="flex items-center gap-2 flex-wrap shrink-0">
          {hasBottleneck ? (
            <div className="flex items-center gap-1.5 bg-orange-100/90 border border-orange-300 px-3 py-1.5 rounded-xl text-xs font-bold text-orange-900 shadow-2xs">
              <AlertTriangle className="w-4 h-4 text-orange-600 shrink-0" />
              <span>{t('bottleneckBadge', { id: bottleneckModule?.id ?? 1, soh: (bottleneckModule?.soh ?? 0).toFixed(1) })}</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 bg-emerald-100/90 border border-emerald-300 px-3 py-1.5 rounded-xl text-xs font-bold text-emerald-900 shadow-2xs">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{t('balancedBadge', { delta: (deltaSoh ?? 0).toFixed(1) })}</span>
            </div>
          )}

          {onSyncAllModulesToBaseline && (
            <button
              id="sync-baseline-btn"
              type="button"
              onClick={onSyncAllModulesToBaseline}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer border flex items-center gap-1.5 shadow-2xs ${
                hasCustomModifiedModules
                  ? 'bg-blue-600 text-white border-blue-600 hover:bg-blue-700 shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border-slate-200'
              }`}
              title="Reset all 8 modules to match the calculated baseline"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>{t('resetAllModules')}</span>
            </button>
          )}
        </div>
      </div>

      {/* 8-Module Responsive Grid (2 rows of 4 modules) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-x-3.5 gap-y-4 pt-2">
        {modules.map((module) => (
          <ModuleCard
            key={module.id}
            module={module}
            isBottleneck={module.id === bottleneckModule.id && hasBottleneck}
            baselineSoh={baselineSoh}
            onUpdateSoh={onUpdateSoh}
            onUpdateIR={onUpdateIR}
            onResetModule={onResetModule}
            onOpenRepairForModule={onOpenRepairForModule}
          />
        ))}
      </div>
    </section>
  );
};
