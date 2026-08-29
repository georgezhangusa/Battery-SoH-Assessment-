import React from 'react';
import {
  Clock,
} from 'lucide-react';
import { PackAnalysis, PackGlobalSettings } from '../types';
import { useLanguage } from '../i18n/translations';

interface PackMetricsSummaryProps {
  analysis: PackAnalysis;
  settings: PackGlobalSettings;
}

export const PackMetricsSummary: React.FC<PackMetricsSummaryProps> = ({
  analysis,
  settings,
}) => {
  const { t } = useLanguage();
  const {
    effectivePackSoh,
    averageSoh,
    deltaSoh,
    nameplateCapacityKwh,
    effectiveCapacityKwh,
    wastedCapacityKwh,
    bottleneckModule,
    remainingCyclesTo80,
    estimatedMonthsTo80,
    nominalVoltage,
    wearVelocity,
  } = analysis;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* 1. Usable Capacity */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
        <div>
          <p className="text-[10px] uppercase text-slate-500 tracking-wider font-semibold mb-1 flex items-center justify-between">
            <span>{t('usableEnergy')}</span>
            <span className="font-mono text-slate-400">{nominalVoltage}VDC {t('stringTopology')}</span>
          </p>
          <p className="text-xl font-mono font-bold text-slate-900 tracking-tight">
            {effectiveCapacityKwh}{' '}
            <span className="text-xs font-normal text-slate-400">/ {nameplateCapacityKwh} kWh</span>
          </p>

          {/* Progress bar */}
          <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden mt-2.5">
            <div
              className={`h-full rounded-full transition-all duration-300 ${
                effectivePackSoh >= 80 ? 'bg-emerald-500' : effectivePackSoh >= 70 ? 'bg-amber-500' : 'bg-rose-500'
              }`}
              style={{ width: `${Math.min(100, Math.max(0, effectivePackSoh))}%` }}
            />
          </div>
        </div>

        <div className="mt-3 pt-2 border-t border-slate-100 text-[11px] flex items-center justify-between">
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

      {/* 2. String Delta (ΔSOH) & Effective SOH */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
        <div>
          <p className="text-[10px] uppercase text-slate-500 tracking-wider font-semibold mb-1 flex items-center justify-between">
            <span>{t('spreadDeltaSoh')}</span>
            <span className={`text-[10px] font-bold uppercase ${deltaSoh > 5 ? 'text-red-500' : 'text-emerald-600'}`}>
              {deltaSoh > 5 ? t('imbalanced') : t('balanced')}
            </span>
          </p>
          <p className="text-xl font-mono font-bold text-slate-900 tracking-tight flex items-baseline gap-2">
            <span className={deltaSoh > 5 ? 'text-red-500' : 'text-slate-800'}>
              {deltaSoh}% ΔSOH
            </span>
            <span className="text-xs font-normal text-slate-400">
              ({t('avgSoh')} {averageSoh}%)
            </span>
          </p>

          <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden mt-2.5">
            <div
              className={`h-full rounded-full transition-all duration-300 ${
                deltaSoh <= 4 ? 'bg-emerald-500' : deltaSoh <= 8 ? 'bg-amber-500' : 'bg-red-500'
              }`}
              style={{ width: `${Math.min(100, Math.max(10, 100 - deltaSoh * 4))}%` }}
            />
          </div>
        </div>

        <div className="mt-3 pt-2 border-t border-slate-100 text-[11px] flex items-center justify-between">
          <span className="text-slate-500">{t('effectivePackSoh')}:</span>
          <span className="font-mono font-bold text-slate-800">
            {effectivePackSoh.toFixed(1)}% SOH
          </span>
        </div>
      </div>

      {/* 3. Prediction Engine Card (Dark Slate Styling) */}
      <div className="bg-slate-900 p-4 rounded-xl text-white shadow-md border border-slate-800 flex flex-col justify-between">
        <div>
          <div className="flex justify-between items-center mb-1">
            <p className="text-[10px] uppercase text-emerald-400 tracking-wider font-bold flex items-center gap-1">
              <Clock className="w-3 h-3" />
              <span>{t('lifeSpanRul')}</span>
            </p>
            <span className="text-[9px] font-mono text-slate-400">to 80% EOL</span>
          </div>

          <div className="flex items-baseline gap-1.5 mt-0.5">
            {effectivePackSoh > 80 ? (
              <>
                <span className="text-2xl font-bold font-mono text-white tracking-tight">
                  {remainingCyclesTo80.toLocaleString()}
                </span>
                <span className="text-xs text-slate-400">{t('cycles')}</span>
              </>
            ) : (
              <span className="text-base font-bold font-mono text-red-400">
                0 {t('cycles')} ({t('pastEol')})
              </span>
            )}
          </div>

          <div className="w-full bg-slate-800 h-1.5 mt-2 rounded-full overflow-hidden">
            <div
              className="bg-emerald-500 h-full transition-all duration-300"
              style={{
                width: `${Math.min(100, Math.max(0, (remainingCyclesTo80 / 8000) * 100))}%`,
              }}
            />
          </div>
        </div>

        <div className="mt-2.5 pt-2 border-t border-slate-800 text-[11px] text-slate-300 flex items-center justify-between">
          <span className="text-slate-400">{t('timeHorizon')}:</span>
          <span className="font-mono font-semibold text-emerald-400">
            {effectivePackSoh > 80 ? `~${(estimatedMonthsTo80 / 12).toFixed(1)} ${t('years')} (${estimatedMonthsTo80} mo)` : t('gradeDegraded')}
          </span>
        </div>
      </div>

      {/* 4. Maintenance Status */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
        <div>
          <p className="text-[10px] uppercase text-slate-500 tracking-wider font-semibold mb-1">
            {t('maintenanceStatus')}
          </p>
          <p
            className={`text-sm sm:text-base font-bold tracking-tight uppercase ${
              effectivePackSoh >= 85 && deltaSoh < 4
                ? 'text-emerald-600'
                : deltaSoh > 8 || effectivePackSoh < 75
                ? 'text-orange-600'
                : 'text-amber-600'
            }`}
          >
            {effectivePackSoh >= 85 && deltaSoh < 4
              ? t('diagNominalBadge').toUpperCase()
              : deltaSoh >= 4 && deltaSoh <= 8 && effectivePackSoh >= 78
              ? t('diagRebalanceBadge').toUpperCase()
              : t('diagReplaceBadge').toUpperCase()}
          </p>
          <p className="text-[11px] text-slate-500 mt-1">
            {t('wearVelocity')}: <strong className="text-slate-800 uppercase font-mono">{wearVelocity}</strong> ({settings.temperature} temp, {settings.dod}% DoD)
          </p>
        </div>

        <div className="mt-3 pt-2 border-t border-slate-100 text-[11px] flex items-center justify-between">
          <span className="text-slate-500">{t('totalStringCycles')}:</span>
          <span className="font-mono font-bold text-slate-800">
            {settings.cycles.toLocaleString()} / 10,000
          </span>
        </div>
      </div>
    </div>
  );
};
