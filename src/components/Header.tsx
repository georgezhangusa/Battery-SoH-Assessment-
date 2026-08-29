import React from 'react';
import {
  Zap,
  RefreshCw,
  HelpCircle,
} from 'lucide-react';
import { PackAnalysis, DiagnosticResult } from '../types';
import { useLanguage } from '../i18n/translations';
import { LanguageSelector } from './LanguageSelector';

interface HeaderProps {
  analysis: PackAnalysis;
  diagnostics: DiagnosticResult;
  isRecalculating: boolean;
  lastCalculatedTime: string;
  hasPendingChanges: boolean;
  onRecalculate: () => void;
  onOpenRepairModal?: () => void;
  onOpenWorkOrderModal?: () => void;
  onResetToBaseline?: () => void;
  onOpenPresets?: () => void;
  onOpenWelcome?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  analysis,
  isRecalculating,
  hasPendingChanges,
  onRecalculate,
  onOpenWelcome,
}) => {
  const { t } = useLanguage();

  return (
    <header className="bg-slate-900 text-white px-4 sm:px-6 py-3 border-b border-slate-800 shadow-lg sticky top-0 z-30">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        {/* Left: Branding & Subtitle */}
        <div className="flex items-center gap-3.5">
          <div className="p-2.5 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-700 text-white shadow-md shadow-emerald-950/50 border border-emerald-400/30">
            <Zap className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-lg sm:text-xl font-bold tracking-tight text-white flex items-center gap-2">
                <span>{t('appTitle')}</span>
                <span className="text-xs text-emerald-400 font-mono font-medium px-2 py-0.5 bg-slate-800/90 rounded border border-slate-700">
                  {t('revision')}
                </span>
              </h1>
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5 font-medium">
              <span>{t('developer')}</span>
            </p>
          </div>
        </div>

        {/* Right: Quick Telemetry Readouts & Action Buttons */}
        <div className="flex flex-wrap items-center gap-3 sm:gap-5 justify-between md:justify-end">
          {/* Telemetry Block 1: Pack Voltage */}
          <div className="text-left md:text-right hidden sm:block">
            <p className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">
              {t('nominalVoltage')}
            </p>
            <p className="text-base sm:text-lg font-mono font-bold text-emerald-400 leading-tight">
              {analysis.nominalVoltage}.0 VDC
            </p>
          </div>

          {/* Telemetry Block 2: Effective SOH */}
          <div className="text-left md:text-right">
            <p className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">
              {t('stringUsableSoh')}
            </p>
            <p
              className={`text-base sm:text-lg font-mono font-bold leading-tight ${
                analysis.effectivePackSoh >= 85
                  ? 'text-emerald-400'
                  : analysis.effectivePackSoh >= 75
                  ? 'text-amber-400'
                  : 'text-orange-400'
              }`}
            >
              {analysis.effectivePackSoh.toFixed(1)}%
            </p>
          </div>

          {/* Action Toolbar */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Language Selector Button */}
            <LanguageSelector />

            {onOpenWelcome && (
              <button
                id="header-guide-button"
                type="button"
                onClick={onOpenWelcome}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-all cursor-pointer shadow-xs"
                title={t('quickStartGuide')}
              >
                <HelpCircle className="w-3.5 h-3.5 text-blue-400" />
                <span className="text-xs font-semibold hidden xs:inline">{t('quickStartGuide')}</span>
              </button>
            )}

            {/* Primary RECALCULATE Button */}
            <button
              id="header-recalculate-button"
              onClick={onRecalculate}
              disabled={isRecalculating}
              className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all cursor-pointer shadow-md border ${
                hasPendingChanges
                  ? 'bg-emerald-600 hover:bg-emerald-500 text-white border-emerald-400 ring-2 ring-emerald-400/50 animate-pulse'
                  : 'bg-blue-600 hover:bg-blue-500 text-white border-blue-400/30'
              }`}
              title="Recalculate degradation, bottleneck, and RUL outputs based on adjusted sliders"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRecalculating ? 'animate-spin' : ''}`} />
              <span>{isRecalculating ? t('recalculating') : t('recalculate')}</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
