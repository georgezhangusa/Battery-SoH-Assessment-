import React from 'react';
import { X, Sparkles, ArrowRight } from 'lucide-react';
import { PRESET_SCENARIOS, PresetScenario } from '../utils/presets';
import { useLanguage } from '../i18n/translations';

interface PresetSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectPreset: (preset: PresetScenario) => void;
}

export const PresetSelector: React.FC<PresetSelectorProps> = ({
  isOpen,
  onClose,
  onSelectPreset,
}) => {
  const { t } = useLanguage();
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-xl max-w-2xl w-full border border-slate-200 shadow-2xl overflow-hidden my-6">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-blue-500/20 text-blue-400 border border-blue-400/30">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold tracking-tight text-white flex items-center gap-2">
                <span>{t('presetsTitle')}</span>
                <span className="text-[10px] uppercase font-mono bg-blue-950 text-blue-300 px-2 py-0.5 rounded border border-blue-800">
                  {t('presetsSubtitle')}
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                {t('presetsDesc')}
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

        {/* Preset List */}
        <div className="p-6 space-y-3 max-h-[70vh] overflow-y-auto">
          {PRESET_SCENARIOS.map((preset) => (
            <button
              key={preset.id}
              onClick={() => {
                onSelectPreset(preset);
                onClose();
              }}
              className="w-full text-left p-4 rounded-xl border border-slate-200 hover:border-blue-500 hover:bg-blue-50/20 bg-slate-50/70 transition-all flex items-start justify-between gap-4 cursor-pointer group shadow-2xs"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h4 className="text-sm font-bold text-slate-900 group-hover:text-blue-900">
                    {preset.name}
                  </h4>
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-white border border-slate-200 text-slate-700 shadow-2xs uppercase">
                    {preset.badge}
                  </span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  {preset.description}
                </p>
                <div className="flex items-center gap-3 text-[11px] font-mono text-slate-600 pt-1">
                  <span>{t('cycles')}: <strong className="text-slate-900">{preset.settings.cycles.toLocaleString()}</strong></span>
                  <span>{t('calendarAge')}: <strong className="text-slate-900">{preset.settings.calendarYears}{t('years').substring(0, 1)}</strong></span>
                  <span>{t('operatingTemp')}: <strong className="text-slate-900 capitalize">{preset.settings.temperature}</strong></span>
                  <span>{t('depthOfDischarge')}: <strong className="text-slate-900">{preset.settings.dod}%</strong></span>
                </div>
              </div>

              <div className="shrink-0 p-2 rounded-lg bg-white border border-slate-200 text-slate-400 group-hover:text-blue-600 group-hover:border-blue-300 transition-colors">
                <ArrowRight className="w-4 h-4" />
              </div>
            </button>
          ))}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-200 transition-colors cursor-pointer uppercase tracking-wider"
          >
            {t('close')}
          </button>
        </div>
      </div>
    </div>
  );
};
