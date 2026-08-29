import React, { useState, useEffect } from 'react';
import {
  Sliders,
  BatteryCharging,
  ChevronDown,
  ChevronUp,
  Thermometer,
  Calendar,
  Gauge,
} from 'lucide-react';
import {
  PackGlobalSettings,
  OperatingTemperature,
  DepthOfDischarge,
} from '../types';
import { calculateBaselineSoh } from '../utils/batteryCalculations';
import { useLanguage } from '../i18n/translations';

interface GlobalControlsProps {
  settings: PackGlobalSettings;
  onChangeSettings: (newSettings: PackGlobalSettings) => void;
  onSyncAllModulesToBaseline: () => void;
  hasCustomModifiedModules: boolean;
  onRecalculate: () => void;
  isRecalculating: boolean;
  lastCalculatedTime: string;
  hasPendingChanges: boolean;
}

export const GlobalControls: React.FC<GlobalControlsProps> = ({
  settings,
  onChangeSettings,
}) => {
  const { t } = useLanguage();
  const baselineSoh = calculateBaselineSoh(settings);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const [cycleInput, setCycleInput] = useState<string>(settings.cycles.toString());
  const [isCycleFocused, setIsCycleFocused] = useState<boolean>(false);

  useEffect(() => {
    if (!isCycleFocused) {
      setCycleInput(settings.cycles.toString());
    }
  }, [settings.cycles, isCycleFocused]);

  const handleCyclesChange = (val: number) => {
    if (isNaN(val)) return;
    const clamped = Math.max(1, Math.min(10000, Math.round(val)));
    setCycleInput(clamped.toString());
    onChangeSettings({ ...settings, cycles: clamped });
  };

  return (
    <section className="bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between space-y-2.5 h-full">
      <div className="space-y-2.5">
        {/* Top Header Row */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-blue-50 text-blue-600 border border-blue-100 shrink-0">
              <BatteryCharging className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-slate-900 tracking-tight">
                {t('setChargingCycles')}
              </h2>
            </div>
          </div>

          {/* Baseline Badge */}
          <div className="flex items-center gap-2 flex-wrap sm:justify-end">
            <div className="bg-slate-900 text-white px-2.5 py-1 rounded-lg shadow-2xs flex items-center gap-1 text-xs">
              <span className="text-[10px] text-slate-300 font-medium">{t('lfpBaseline')}:</span>
              <span className="font-mono font-bold text-emerald-400">
                {baselineSoh}% SOH
              </span>
            </div>
          </div>
        </div>

        {/* Big Main Charging Cycles Slider */}
        <div className="bg-slate-50/80 p-2.5 sm:p-3 rounded-xl border border-slate-200/80 space-y-2">
          <div className="flex items-center justify-between gap-2">
            <label
              htmlFor="main-cycle-slider"
              className="text-xs font-bold text-slate-700 uppercase tracking-wide"
            >
              {t('setChargingCyclesLabel')}
            </label>

            <div className="flex items-center gap-1.5">
              <input
                id="cycle-number-input"
                type="number"
                min="1"
                max="10000"
                step="1"
                value={cycleInput}
                onFocus={() => setIsCycleFocused(true)}
                onChange={(e) => {
                  setCycleInput(e.target.value);
                  const parsed = parseInt(e.target.value, 10);
                  if (!isNaN(parsed) && parsed >= 1 && parsed <= 10000) {
                    onChangeSettings({ ...settings, cycles: parsed });
                  }
                }}
                onBlur={() => {
                  setIsCycleFocused(false);
                  let parsed = parseInt(cycleInput, 10);
                  if (isNaN(parsed)) parsed = settings.cycles;
                  else parsed = Math.max(1, Math.min(10000, parsed));
                  setCycleInput(parsed.toString());
                  onChangeSettings({ ...settings, cycles: parsed });
                }}
                className="w-20 px-2 py-0.5 text-xs font-mono font-bold text-blue-700 bg-white border border-blue-300 rounded-lg text-right shadow-2xs focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <span className="hidden text-[11px] font-mono font-bold text-slate-500">/ 10,000 {t('cycles')}</span>
            </div>
          </div>

          <input
            id="main-cycle-slider"
            type="range"
            min="1"
            max="10000"
            step="50"
            value={settings.cycles}
            onInput={(e) => handleCyclesChange(parseInt((e.target as HTMLInputElement).value, 10))}
            onChange={(e) => handleCyclesChange(parseInt(e.target.value, 10))}
            className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
          />
        </div>
      </div>

      {/* Expandable Advanced Factors (Calendar Age, Temp, DoD) */}
      <div className="pt-0.5">
        <button
          type="button"
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="text-xs font-bold text-slate-600 hover:text-slate-900 flex items-center gap-1.5 py-0.5 cursor-pointer"
        >
          <Sliders className="w-3.5 h-3.5 text-blue-600" />
          <span>{showAdvanced ? t('hideEnvSettings') : t('showEnvSettings')}</span>
          {showAdvanced ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>

        {showAdvanced && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-2 mt-1.5 border-t border-slate-100 animate-in fade-in duration-200">
            {/* Calendar Age */}
            <div className="space-y-1 bg-slate-50 p-2 rounded-xl border border-slate-200">
              <div className="flex justify-between items-center text-[10px] font-bold text-slate-700">
                <span className="flex items-center gap-1">
                  <Calendar className="w-3 h-3 text-blue-600" />
                  {t('calendarAge')}
                </span>
                <span className="font-mono text-blue-700 font-bold">{settings.calendarYears} {t('years')}</span>
              </div>
              <input
                type="range"
                min="0"
                max="15"
                step="0.5"
                value={settings.calendarYears}
                onChange={(e) =>
                  onChangeSettings({ ...settings, calendarYears: parseFloat(e.target.value) || 0 })
                }
                className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
              />
              <div className="text-[10px] text-slate-400">Aging ~0.9%/{t('years').toLowerCase()}</div>
            </div>

            {/* Ambient Temperature */}
            <div className="space-y-1 bg-slate-50 p-2 rounded-xl border border-slate-200">
              <div className="flex justify-between items-center text-[10px] font-bold text-slate-700">
                <span className="flex items-center gap-1">
                  <Thermometer className="w-3 h-3 text-amber-600" />
                  {t('operatingTemp')}
                </span>
                <span className="font-mono text-slate-800 font-bold">
                  {settings.temperature === 'optimal' ? '25°C' : settings.temperature === 'hot' ? '>35°C' : '<15°C'}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-1">
                {(['cool', 'optimal', 'hot'] as OperatingTemperature[]).map((tempVal) => (
                  <button
                    key={tempVal}
                    type="button"
                    onClick={() => onChangeSettings({ ...settings, temperature: tempVal })}
                    className={`py-0.5 rounded text-[10px] font-bold uppercase border cursor-pointer ${
                      settings.temperature === tempVal
                        ? 'bg-slate-900 text-white border-slate-900'
                        : 'bg-white text-slate-600 border-slate-200'
                    }`}
                  >
                    {tempVal === 'cool' ? t('tempCool').split(' ')[0] : tempVal === 'optimal' ? t('tempOptimal').split(' ')[0] : t('tempHot').split(' ')[0]}
                  </button>
                ))}
              </div>
            </div>

            {/* Depth of Discharge */}
            <div className="space-y-1 bg-slate-50 p-2 rounded-xl border border-slate-200">
              <div className="flex justify-between items-center text-[10px] font-bold text-slate-700">
                <span className="flex items-center gap-1">
                  <Gauge className="w-3 h-3 text-blue-600" />
                  {t('depthOfDischarge')}
                </span>
                <span className="font-mono text-blue-700 font-bold">{settings.dod}%</span>
              </div>
              <div className="grid grid-cols-3 gap-1">
                {(['80', '90', '100'] as DepthOfDischarge[]).map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => onChangeSettings({ ...settings, dod: d })}
                    className={`py-0.5 rounded text-[10px] font-bold border cursor-pointer ${
                      settings.dod === d
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-white text-slate-600 border-slate-200'
                    }`}
                  >
                    {d}%
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};
