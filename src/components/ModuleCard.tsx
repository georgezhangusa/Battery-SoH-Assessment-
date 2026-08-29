import React, { useState, useEffect } from 'react';
import {
  RotateCcw,
  Wrench,
  Flame,
  Zap,
} from 'lucide-react';
import { BatteryModule, ResistanceStatus } from '../types';
import { useLanguage } from '../i18n/translations';

interface ModuleCardProps {
  module: BatteryModule;
  isBottleneck: boolean;
  baselineSoh: number;
  onUpdateSoh: (id: number, soh: number) => void;
  onUpdateIR?: (id: number, ir: ResistanceStatus) => void;
  onResetModule: (id: number) => void;
  onOpenRepairForModule?: (id: number) => void;
}

export const ModuleCard: React.FC<ModuleCardProps> = ({
  module,
  isBottleneck,
  baselineSoh,
  onUpdateSoh,
  onUpdateIR,
  onResetModule,
  onOpenRepairForModule,
}) => {
  const { t } = useLanguage();
  const [localSohText, setLocalSohText] = useState<string>(module.soh.toFixed(1));
  const [isInputFocused, setIsInputFocused] = useState<boolean>(false);

  useEffect(() => {
    if (!isInputFocused) {
      setLocalSohText(module.soh.toFixed(1));
    }
  }, [module.soh, isInputFocused]);

  const deltaFromBaseline = Number((module.soh - baselineSoh).toFixed(1));
  const isCritical = module.internalResistance === 'critical' || module.soh < 60;
  const isDegraded = module.soh < 75 && !isCritical;
  const isAging = module.soh >= 75 && module.soh < 85 && !isCritical;

  // Module usable capacity in kWh (48V * 100Ah = 4.8 kWh nominal)
  const moduleCapacityKwh = Number(((4.8 * module.soh) / 100).toFixed(2));

  // Remaining life prediction for this module (estimate to 80% SOH)
  const remainingModuleCycles = Math.max(
    0,
    Math.round(((module.soh - 80) / 20) * 3800)
  );

  const getContainerStyle = () => {
    if (isCritical) {
      return 'border-2 border-red-500 bg-red-50/70 shadow-md ring-2 ring-red-400/50';
    }
    if (isBottleneck) {
      return 'border-2 border-orange-500 bg-orange-50/60 shadow-md ring-2 ring-orange-400/50';
    }
    if (isDegraded) {
      return 'border-2 border-amber-400 bg-amber-50/40 shadow-xs';
    }
    if (isAging) {
      return 'border-2 border-amber-300 bg-amber-50/30 shadow-xs';
    }
    return 'border-2 border-slate-700 bg-white shadow-xs';
  };

  const getBadge = () => {
    if (isCritical) return { text: t('badgeCritical'), style: 'bg-red-600 text-white' };
    if (isBottleneck) return { text: t('badgeWeakest'), style: 'bg-orange-600 text-white animate-pulse' };
    if (isDegraded) return { text: t('badgeDegraded'), style: 'bg-amber-100 text-amber-800 border border-amber-300' };
    if (isAging) return { text: t('badgeAging'), style: 'bg-blue-100 text-blue-800 border border-blue-200' };
    return { text: t('badgeHealthy'), style: 'bg-emerald-100 text-emerald-800 border border-emerald-300' };
  };

  const badge = getBadge();

  const handleSliderChange = (val: number) => {
    if (isNaN(val)) return;
    const clamped = Math.max(10, Math.min(100, Number(val.toFixed(1))));
    setLocalSohText(clamped.toFixed(1));
    onUpdateSoh(module.id, clamped);
  };

  const handleTextInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    setLocalSohText(raw);
    const parsed = parseFloat(raw);
    if (!isNaN(parsed) && parsed >= 10 && parsed <= 100) {
      onUpdateSoh(module.id, Number(parsed.toFixed(1)));
    }
  };

  const handleTextInputBlur = () => {
    setIsInputFocused(false);
    let parsed = parseFloat(localSohText);
    if (isNaN(parsed)) parsed = module.soh;
    else parsed = Math.max(10, Math.min(100, parsed));
    const finalVal = Number(parsed.toFixed(1));
    setLocalSohText(finalVal.toFixed(1));
    onUpdateSoh(module.id, finalVal);
  };

  return (
    <div className="relative pt-3.5 min-w-0">
      {/* Top Battery Terminal Posts (Cathode / Anode Lugs) */}
      <div className="absolute top-0 left-5 flex items-center justify-center w-8 h-3.5 rounded-t bg-slate-900 border-t-2 border-x-2 border-slate-950 text-slate-200 select-none shadow-sm z-10">
        <div className="w-3.5 h-1 bg-slate-300 rounded-full" />
      </div>
      <div className="absolute top-0 right-5 flex items-center justify-center w-8 h-3.5 rounded-t bg-slate-900 border-t-2 border-x-2 border-slate-950 text-slate-200 select-none shadow-sm z-10">
        <div className="relative w-3.5 h-3.5 flex items-center justify-center">
          <div className="w-3.5 h-1 bg-rose-500 rounded-full absolute" />
          <div className="h-3.5 w-1 bg-rose-500 rounded-full absolute" />
        </div>
      </div>

      <div
        id={`module-card-${module.id}`}
        className={`rounded-2xl p-3 flex flex-col justify-between transition-all duration-150 relative min-w-0 overflow-hidden ${getContainerStyle()}`}
      >
        <div className="min-w-0 space-y-2">
          {/* Header: Module ID & Badge & Quick Reset */}
          <div className="flex items-center justify-between gap-1 min-w-0">
            <div className="flex items-center gap-1.5 min-w-0">
              <div className="w-6 h-6 rounded-lg bg-slate-900 text-white flex items-center justify-center font-mono font-black text-xs shrink-0 shadow-sm border border-slate-700">
                {module.id}
              </div>
              <div className="min-w-0">
                <h3 className="text-xs font-bold text-slate-900 leading-tight truncate">
                  {t('module')} #{module.id}
                </h3>
                <span className="text-[10px] font-mono text-slate-500 block leading-tight">
                  48V • {moduleCapacityKwh} kWh
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1 shrink-0">
              <span
                className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-tight whitespace-nowrap ${badge.style}`}
              >
                {badge.text}
              </span>
              {module.customModified && (
                <button
                  type="button"
                  onClick={() => onResetModule(module.id)}
                  className="p-0.5 rounded text-slate-400 hover:text-slate-800 hover:bg-slate-200/70 transition-colors cursor-pointer"
                  title={t('resetToBaseline')}
                >
                  <RotateCcw className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>

          {/* SOH Telemetry & Slider Section */}
          <div className="bg-slate-50/90 rounded-xl p-2.5 border border-slate-200 space-y-2 min-w-0">
            {/* Top Row: Direct SOH Numeric Input + Delta Badge */}
            <div className="flex items-center justify-between gap-1.5 min-w-0">
              <div className="flex items-center gap-1 min-w-0">
                <input
                  id={`input-module-soh-${module.id}`}
                  type="number"
                  min="10"
                  max="100"
                  step="0.1"
                  value={localSohText}
                  onFocus={() => setIsInputFocused(true)}
                  onChange={handleTextInputChange}
                  onBlur={handleTextInputBlur}
                  className="w-18 px-1.5 py-0.5 text-base font-mono font-black text-slate-900 bg-white border border-slate-300 rounded-md text-right focus:outline-none focus:ring-1 focus:ring-blue-500 shadow-2xs [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                />
                <span className="text-xs font-bold text-slate-500 font-mono">%</span>
              </div>

              <span
                className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded whitespace-nowrap shrink-0 ${
                  deltaFromBaseline < -0.1
                    ? 'text-rose-700 bg-rose-100/90 border border-rose-200'
                    : deltaFromBaseline > 0.1
                    ? 'text-emerald-700 bg-emerald-100/90 border border-emerald-200'
                    : 'text-slate-600 bg-slate-200/80'
                }`}
              >
                {deltaFromBaseline > 0 ? `+${deltaFromBaseline}%` : `${deltaFromBaseline}%`}
              </span>
            </div>

            {/* Interactive Range Slider */}
            <div className="space-y-1">
              <input
                id={`slider-module-${module.id}`}
                type="range"
                min="30"
                max="100"
                step="0.5"
                value={module.soh}
                onInput={(e) => handleSliderChange(parseFloat((e.target as HTMLInputElement).value))}
                onChange={(e) => handleSliderChange(parseFloat(e.target.value))}
                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600 block"
              />

              <div className="flex justify-between text-[9px] font-mono font-semibold text-slate-400">
                <span>30%</span>
                <span className="text-amber-700 font-bold">80% EOL</span>
                <span>100%</span>
              </div>
            </div>

            {/* Internal Resistance (IR) Selector */}
            {onUpdateIR && (
              <div className="pt-1.5 border-t border-slate-200/80 space-y-1">
                <div className="flex items-center justify-between text-[9px] font-bold uppercase tracking-wider text-slate-500">
                  <span className="flex items-center gap-1">
                    <Zap className="w-2.5 h-2.5 text-amber-500" />
                    <span>{t('internalResistance').replace(':', '')}</span>
                  </span>
                  <span className="font-mono text-slate-700">
                    {module.internalResistance === 'normal' ? '1.2mΩ' : module.internalResistance === 'elevated' ? '2.5mΩ' : '4.8mΩ'}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-1">
                  {(['normal', 'elevated', 'critical'] as ResistanceStatus[]).map((irStatus) => {
                    const isSelected = module.internalResistance === irStatus;
                    return (
                      <button
                        key={irStatus}
                        type="button"
                        onClick={() => onUpdateIR(module.id, irStatus)}
                        className={`py-0.5 rounded text-[9px] font-bold uppercase transition-all cursor-pointer border ${
                          isSelected
                            ? irStatus === 'critical'
                              ? 'bg-red-600 text-white border-red-600 shadow-2xs'
                              : irStatus === 'elevated'
                              ? 'bg-amber-500 text-white border-amber-500 shadow-2xs'
                              : 'bg-slate-900 text-white border-slate-900 shadow-2xs'
                            : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                        }`}
                        title={
                          irStatus === 'normal'
                            ? t('irNormal')
                            : irStatus === 'elevated'
                            ? t('irElevated')
                            : t('irCritical')
                        }
                      >
                        {irStatus === 'normal'
                          ? t('irNormal').split(' ')[0]
                          : irStatus === 'elevated'
                          ? t('irElevated').split(' ')[0]
                          : t('irCritical').split(' ')[0]}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Life Span prediction text */}
            <div className="flex justify-between items-center text-[10px] text-slate-600 font-mono pt-1.5 border-t border-slate-200/80 gap-1 min-w-0">
              <span className="text-slate-500 truncate">{t('estimatedModuleRul').split(':')[0]}:</span>
              <span className="font-bold text-slate-900 whitespace-nowrap text-right">
                {module.soh <= 80 ? (
                  <span className="text-rose-600 font-bold">&lt;80% EOL</span>
                ) : (
                  `~${remainingModuleCycles.toLocaleString()} ${t('cycles')}`
                )}
              </span>
            </div>
          </div>
        </div>

        {/* Action Button: Simulate Repair for this module */}
        {onOpenRepairForModule && (
          <div className="pt-2 mt-2 border-t border-slate-200/80">
            <button
              type="button"
              onClick={() => onOpenRepairForModule(module.id)}
              className="w-full py-1 px-2 rounded-lg text-[11px] font-bold text-slate-700 bg-white hover:bg-blue-50 hover:text-blue-700 hover:border-blue-300 border border-slate-300 transition-all flex items-center justify-center gap-1.5 shadow-2xs cursor-pointer"
            >
              <Wrench className="w-3 h-3 text-blue-600" />
              <span>{t('simulateSwap')}</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

