import React, { useState } from 'react';
import {
  Zap,
  Sliders,
  Layers,
  Activity,
  Wrench,
  Sparkles,
  ArrowRight,
  X,
  CheckCircle2,
} from 'lucide-react';
import { useLanguage } from '../i18n/translations';

interface WelcomeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenPresets?: () => void;
}

export const WelcomeModal: React.FC<WelcomeModalProps> = ({
  isOpen,
  onClose,
  onOpenPresets,
}) => {
  const { t } = useLanguage();
  const [dontShowAgain, setDontShowAgain] = useState(false);

  if (!isOpen) return null;

  const handleClose = () => {
    if (dontShowAgain) {
      localStorage.setItem('bess_welcome_seen', 'true');
    }
    onClose();
  };

  const handleOpenPresets = () => {
    if (dontShowAgain) {
      localStorage.setItem('bess_welcome_seen', 'true');
    }
    onClose();
    if (onOpenPresets) {
      onOpenPresets();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={handleClose}
    >
      <div
        className="bg-white w-full max-w-3xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Hero Banner */}
        <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-blue-950 text-white p-5 sm:p-6 relative">
          <button
            onClick={handleClose}
            className="absolute top-4 right-4 p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white transition-colors cursor-pointer"
            aria-label="Close welcome modal"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3.5 mb-2">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-600 text-slate-950 shadow-md">
              <Zap className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-emerald-400">
                {t('welcomeWelcomeTo')}
              </span>
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
                {t('welcomeTitle')}
              </h2>
            </div>
          </div>
          <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed mt-1">
            {t('welcomeSubtitle')}
          </p>
        </div>

        {/* Modal Scrollable Content */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-5 text-slate-700 text-xs sm:text-sm">
          {/* Quick Concept / Why this matters */}
          <div className="bg-blue-50/80 border border-blue-200 rounded-xl p-3.5 flex items-start gap-3">
            <div className="p-1.5 rounded-lg bg-blue-100 text-blue-700 shrink-0 mt-0.5">
              <Activity className="w-4 h-4" />
            </div>
            <div className="text-xs text-blue-900 leading-relaxed">
              <strong>{t('welcomeSeriesRuleTitle')}</strong> {t('welcomeSeriesRuleText')}
            </div>
          </div>

          {/* Core Features Grid */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-blue-600" />
              {t('welcomeCoreFeatures')}
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="p-3 rounded-xl border border-slate-200 bg-slate-50/60 flex items-start gap-3">
                <div className="p-2 rounded-lg bg-blue-100 text-blue-700 shrink-0">
                  <Sliders className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 text-xs">{t('feat1Title')}</h4>
                  <p className="text-[11px] text-slate-600 mt-0.5 leading-normal">
                    {t('feat1Desc')}
                  </p>
                </div>
              </div>

              <div className="p-3 rounded-xl border border-slate-200 bg-slate-50/60 flex items-start gap-3">
                <div className="p-2 rounded-lg bg-emerald-100 text-emerald-700 shrink-0">
                  <Layers className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 text-xs">{t('feat2Title')}</h4>
                  <p className="text-[11px] text-slate-600 mt-0.5 leading-normal">
                    {t('feat2Desc')}
                  </p>
                </div>
              </div>

              <div className="p-3 rounded-xl border border-slate-200 bg-slate-50/60 flex items-start gap-3">
                <div className="p-2 rounded-lg bg-amber-100 text-amber-700 shrink-0">
                  <Activity className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 text-xs">{t('feat3Title')}</h4>
                  <p className="text-[11px] text-slate-600 mt-0.5 leading-normal">
                    {t('feat3Desc')}
                  </p>
                </div>
              </div>

              <div className="p-3 rounded-xl border border-slate-200 bg-slate-50/60 flex items-start gap-3">
                <div className="p-2 rounded-lg bg-purple-100 text-purple-700 shrink-0">
                  <Wrench className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 text-xs">{t('feat4Title')}</h4>
                  <p className="text-[11px] text-slate-600 mt-0.5 leading-normal">
                    {t('feat4Desc')}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Start Steps */}
          <div className="border-t border-slate-200 pt-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2.5 flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              {t('quickStartGuide')}
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex flex-col justify-between">
                <div>
                  <span className="w-5 h-5 rounded-full bg-slate-900 text-white font-mono font-bold text-[10px] inline-flex items-center justify-center mb-1.5">
                    1
                  </span>
                  <p className="text-xs font-bold text-slate-800">{t('setChargingCycles')}</p>
                  <p className="text-[11px] text-slate-600 mt-0.5">
                    {t('feat1Desc')}
                  </p>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex flex-col justify-between">
                <div>
                  <span className="w-5 h-5 rounded-full bg-slate-900 text-white font-mono font-bold text-[10px] inline-flex items-center justify-center mb-1.5">
                    2
                  </span>
                  <p className="text-xs font-bold text-slate-800">{t('tabAssessment')}</p>
                  <p className="text-[11px] text-slate-600 mt-0.5">
                    {t('feat2Desc')}
                  </p>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex flex-col justify-between">
                <div>
                  <span className="w-5 h-5 rounded-full bg-slate-900 text-white font-mono font-bold text-[10px] inline-flex items-center justify-center mb-1.5">
                    3
                  </span>
                  <p className="text-xs font-bold text-slate-800">{t('simulateRepair')}</p>
                  <p className="text-[11px] text-slate-600 mt-0.5">
                    {t('feat4Desc')}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 sm:p-5 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
          <label className="flex items-center gap-2 text-xs text-slate-600 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={dontShowAgain}
              onChange={(e) => setDontShowAgain(e.target.checked)}
              className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
            />
            <span>{t('welcomeDontShowAgain')}</span>
          </label>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            {onOpenPresets && (
              <button
                type="button"
                onClick={handleOpenPresets}
                className="px-3.5 py-2 rounded-xl text-xs font-bold text-slate-700 bg-white hover:bg-slate-100 border border-slate-300 transition-all cursor-pointer flex items-center gap-1.5 shadow-2xs"
              >
                <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                <span>{t('welcomeOpenPresets')}</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 transition-all cursor-pointer flex items-center gap-1.5 shadow-xs"
            >
              <span>{t('welcomeGetStarted')}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
