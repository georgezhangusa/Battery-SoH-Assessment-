import React, { useState, useMemo } from 'react';
import {
  Zap,
  Layers,
  Wrench,
  FileText,
  Sparkles,
  ShieldCheck,
  BarChart3,
  CheckCircle2,
  RefreshCw,
  LayoutDashboard,
} from 'lucide-react';
import {
  BatteryModule,
  PackGlobalSettings,
  ResistanceStatus,
} from './types';
import {
  calculateBaselineSoh,
  createDefaultModules,
  analyzePack,
  evaluateDiagnostics,
} from './utils/batteryCalculations';
import { PRESET_SCENARIOS, PresetScenario } from './utils/presets';
import { useLanguage } from './i18n/translations';
import { Header } from './components/Header';
import { GlobalControls } from './components/GlobalControls';
import { ModuleTopology } from './components/ModuleTopology';
import { DiagnosticsPanel } from './components/DiagnosticsPanel';
import { DegradationCharts } from './components/DegradationCharts';
import { RepairSimulatorModal } from './components/RepairSimulatorModal';
import { WorkOrderModal } from './components/WorkOrderModal';
import { PresetSelector } from './components/PresetSelector';
import { WelcomeModal } from './components/WelcomeModal';
import { ExecutiveSummaryView } from './components/ExecutiveSummaryView';

export default function App() {
  const { t } = useLanguage();

  // Global settings state
  const [settings, setSettings] = useState<PackGlobalSettings>({
    cycles: 2200,
    calendarYears: 3.5,
    temperature: 'optimal',
    dod: '100',
    intensity: '0.5C',
    ratedModuleCapacityAh: 100,
    dailyCycles: 1.2,
    packSerialNumber: 'BESS-384V-2023-STR-04',
    siteLocation: 'Northwind Energy Storage Facility (Bay 4)',
  });

  // Calculate baseline SOH from settings
  const baselineSoh = useMemo(() => calculateBaselineSoh(settings), [settings]);

  // 8-Module array state (Default field scenario: Mod #3 is degraded bottleneck)
  const [modules, setModules] = useState<BatteryModule[]>(() => {
    const base = calculateBaselineSoh({
      cycles: 2200,
      calendarYears: 3.5,
      temperature: 'optimal',
      dod: '100',
      intensity: '0.5C',
      ratedModuleCapacityAh: 100,
      dailyCycles: 1.2,
      packSerialNumber: 'BESS-384V-2023-STR-04',
      siteLocation: 'Northwind Energy Storage Facility (Bay 4)',
    });

    return Array.from({ length: 8 }, (_, i) => {
      if (i === 2) {
        return {
          id: 3,
          name: 'Cell #3',
          serialNumber: 'LFP48-MOD03-A',
          nominalVoltage: 48.0,
          soh: 69.4,
          internalResistance: 'normal' as ResistanceStatus,
          customModified: true,
          installedDate: '2023-01-15',
        };
      }
      return {
        id: i + 1,
        name: `Cell #${i + 1}`,
        serialNumber: `LFP48-MOD${String(i + 1).padStart(2, '0')}-A`,
        nominalVoltage: 48.0,
        soh: Number((base + (i % 2 === 0 ? 0.6 : -0.4)).toFixed(1)),
        internalResistance: 'normal' as ResistanceStatus,
        customModified: false,
        installedDate: '2023-01-15',
      };
    });
  });

  // Recalculation & Synchronizing state
  const [isRecalculating, setIsRecalculating] = useState(false);
  const [lastCalculatedTime, setLastCalculatedTime] = useState<string>(() =>
    new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
  );
  const [hasPendingChanges, setHasPendingChanges] = useState(false);
  const [notificationToast, setNotificationToast] = useState<string | null>(null);

  // Active view tab (Executive Summary vs Topology vs Lifecycle Trajectory Chart)
  const [activeTab, setActiveTab] = useState<'summary' | 'dashboard' | 'charts'>('summary');

  // Modals state
  const [isRepairModalOpen, setIsRepairModalOpen] = useState(false);
  const [activeRepairModuleId, setActiveRepairModuleId] = useState<number | null>(null);
  const [isWorkOrderModalOpen, setIsWorkOrderModalOpen] = useState(false);
  const [isPresetModalOpen, setIsPresetModalOpen] = useState(false);
  const [isWelcomeModalOpen, setIsWelcomeModalOpen] = useState<boolean>(() => {
    try {
      return !localStorage.getItem('bess_welcome_seen');
    } catch {
      return true;
    }
  });

  // Derive pack analysis & diagnostics
  const analysis = useMemo(() => analyzePack(modules, settings), [modules, settings]);
  const diagnostics = useMemo(
    () => evaluateDiagnostics(modules, analysis, settings),
    [modules, analysis, settings]
  );

  const hasCustomModifiedModules = useMemo(
    () => modules.some((m) => m.customModified),
    [modules]
  );

  // Trigger explicit recalculation
  const handleRecalculate = () => {
    setIsRecalculating(true);
    setHasPendingChanges(false);

    setTimeout(() => {
      const now = new Date().toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      });
      setLastCalculatedTime(now);
      setIsRecalculating(false);
      setNotificationToast(
        `${t('calculationsUpdated')} ${now} (${t('usablePackSoh')}: ${analysis.effectivePackSoh.toFixed(1)}%)`
      );

      setTimeout(() => {
        setNotificationToast(null);
      }, 3500);
    }, 200);
  };

  // Handlers
  const handleSettingsChange = (newSettings: PackGlobalSettings) => {
    setSettings(newSettings);
    setHasPendingChanges(true);
    const newBase = calculateBaselineSoh(newSettings);

    // Update non-custom-modified modules to follow new baseline
    setModules((prev) =>
      prev.map((m) => {
        if (!m.customModified) {
          return {
            ...m,
            soh: Number((newBase + (m.id % 2 === 0 ? 0.3 : -0.3)).toFixed(1)),
          };
        }
        return m;
      })
    );
  };

  const handleUpdateSoh = (id: number, newSoh: number) => {
    const clamped = Math.max(10, Math.min(100, Number(newSoh.toFixed(1))));
    setHasPendingChanges(true);
    setModules((prev) =>
      prev.map((m) =>
        m.id === id
          ? { ...m, soh: clamped, customModified: true }
          : m
      )
    );
  };

  const handleUpdateIR = (id: number, ir: ResistanceStatus) => {
    setHasPendingChanges(true);
    setModules((prev) =>
      prev.map((m) =>
        m.id === id
          ? { ...m, internalResistance: ir, customModified: true }
          : m
      )
    );
  };

  const handleResetModule = (id: number) => {
    setHasPendingChanges(true);
    setModules((prev) =>
      prev.map((m) =>
        m.id === id
          ? {
              ...m,
              soh: Number((baselineSoh + (m.id % 2 === 0 ? 0.3 : -0.3)).toFixed(1)),
              internalResistance: 'normal',
              customModified: false,
            }
          : m
      )
    );
  };

  const handleSyncAllModulesToBaseline = () => {
    setModules(createDefaultModules(baselineSoh));
    handleRecalculate();
  };

  const handleSelectPreset = (preset: PresetScenario) => {
    setSettings(preset.settings);
    const base = calculateBaselineSoh(preset.settings);
    if (preset.customModules) {
      setModules(preset.customModules(base));
    } else {
      setModules(createDefaultModules(base));
    }
    handleRecalculate();
  };

  const handleOpenRepairForModule = (id: number) => {
    setActiveRepairModuleId(id);
    setIsRepairModalOpen(true);
  };

  const handleApplyRepairedModules = (newModules: BatteryModule[]) => {
    setModules(newModules);
    handleRecalculate();
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans selection:bg-blue-600 selection:text-white">
      {/* Header */}
      <Header
        analysis={analysis}
        diagnostics={diagnostics}
        isRecalculating={isRecalculating}
        lastCalculatedTime={lastCalculatedTime}
        hasPendingChanges={hasPendingChanges}
        onRecalculate={handleRecalculate}
        onOpenRepairModal={() => {
          setActiveRepairModuleId(null);
          setIsRepairModalOpen(true);
        }}
        onOpenWorkOrderModal={() => setIsWorkOrderModalOpen(true)}
        onResetToBaseline={handleSyncAllModulesToBaseline}
        onOpenPresets={() => setIsPresetModalOpen(true)}
        onOpenWelcome={() => setIsWelcomeModalOpen(true)}
      />

      {/* Recalculation Notification Toast */}
      {notificationToast && (
        <div className="sticky top-[60px] z-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-2">
          <div className="bg-emerald-900 text-emerald-100 border border-emerald-700 px-4 py-2 rounded-xl shadow-lg flex items-center justify-between text-xs font-semibold animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{notificationToast}</span>
            </div>
            <button
              onClick={() => setNotificationToast(null)}
              className="text-emerald-300 hover:text-white text-xs underline cursor-pointer"
            >
              {t('dismiss')}
            </button>
          </div>
        </div>
      )}

      {/* View Switcher Bar (Clean Navigation) */}
      <div className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-5">
        <div className="flex items-center justify-center border-b border-slate-200/80 pb-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-3.5 p-1.5 bg-slate-100/90 rounded-2xl border border-slate-200/80 shadow-inner w-full max-w-3xl">
            <button
              id="tab-summary-btn"
              type="button"
              onClick={() => setActiveTab('summary')}
              className={`w-full justify-center px-4 py-2.5 rounded-xl text-xs font-bold transition-all duration-150 cursor-pointer flex items-center gap-2 select-none text-center ${
                activeTab === 'summary'
                  ? 'bg-slate-900 text-white shadow-[0_4px_0_0_#0f172a,0_6px_12px_rgba(15,23,42,0.25)] border-t border-slate-700 -translate-y-0.5 active:translate-y-0.5 active:shadow-[0_1px_0_0_#0f172a]'
                  : 'bg-white text-slate-700 hover:bg-slate-50 border border-slate-200/90 shadow-[0_3px_0_0_#cbd5e1,0_4px_6px_rgba(0,0,0,0.04)] hover:-translate-y-0.5 active:translate-y-0.5 active:shadow-[0_0px_0_0_#cbd5e1]'
              }`}
            >
              <LayoutDashboard className="w-4 h-4 text-emerald-400 shrink-0" />
              <span className="truncate">{t('tabSummary')}</span>
            </button>

            <button
              id="tab-topology-btn"
              type="button"
              onClick={() => setActiveTab('dashboard')}
              className={`w-full justify-center px-4 py-2.5 rounded-xl text-xs font-bold transition-all duration-150 cursor-pointer flex items-center gap-2 select-none text-center ${
                activeTab === 'dashboard'
                  ? 'bg-slate-900 text-white shadow-[0_4px_0_0_#0f172a,0_6px_12px_rgba(15,23,42,0.25)] border-t border-slate-700 -translate-y-0.5 active:translate-y-0.5 active:shadow-[0_1px_0_0_#0f172a]'
                  : 'bg-white text-slate-700 hover:bg-slate-50 border border-slate-200/90 shadow-[0_3px_0_0_#cbd5e1,0_4px_6px_rgba(0,0,0,0.04)] hover:-translate-y-0.5 active:translate-y-0.5 active:shadow-[0_0px_0_0_#cbd5e1]'
              }`}
            >
              <Layers className="w-4 h-4 text-blue-400 shrink-0" />
              <span className="truncate">{t('tabAssessment')}</span>
            </button>

            <button
              id="tab-charts-btn"
              type="button"
              onClick={() => setActiveTab('charts')}
              className={`w-full justify-center px-4 py-2.5 rounded-xl text-xs font-bold transition-all duration-150 cursor-pointer flex items-center gap-2 select-none text-center ${
                activeTab === 'charts'
                  ? 'bg-slate-900 text-white shadow-[0_4px_0_0_#0f172a,0_6px_12px_rgba(15,23,42,0.25)] border-t border-slate-700 -translate-y-0.5 active:translate-y-0.5 active:shadow-[0_1px_0_0_#0f172a]'
                  : 'bg-white text-slate-700 hover:bg-slate-50 border border-slate-200/90 shadow-[0_3px_0_0_#cbd5e1,0_4px_6px_rgba(0,0,0,0.04)] hover:-translate-y-0.5 active:translate-y-0.5 active:shadow-[0_0px_0_0_#cbd5e1]'
              }`}
            >
              <BarChart3 className="w-4 h-4 text-indigo-400 shrink-0" />
              <span className="truncate">{t('tabCharts')}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-5 space-y-5">
        {activeTab === 'summary' ? (
          /* 1. Executive Summary View */
          <ExecutiveSummaryView
            modules={modules}
            analysis={analysis}
            settings={settings}
            diagnostics={diagnostics}
            onOpenRepairModal={handleOpenRepairForModule}
            onOpenWorkOrderModal={() => setIsWorkOrderModalOpen(true)}
            onSwitchToSimulator={() => setActiveTab('dashboard')}
            onOpenPresets={() => setIsPresetModalOpen(true)}
          />
        ) : activeTab === 'dashboard' ? (
          <div className="space-y-5 animate-in fade-in duration-200">
            {/* Top Side-by-Side Control and Diagnostic Panels */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 items-stretch">
              {/* 1. Global Charging Cycles Slider & Baseline */}
              <GlobalControls
                settings={settings}
                onChangeSettings={handleSettingsChange}
                onSyncAllModulesToBaseline={handleSyncAllModulesToBaseline}
                hasCustomModifiedModules={hasCustomModifiedModules}
                onRecalculate={handleRecalculate}
                isRecalculating={isRecalculating}
                lastCalculatedTime={lastCalculatedTime}
                hasPendingChanges={hasPendingChanges}
              />

              {/* 2. Clear Health Diagnosis, Life Span Prediction & Suggestions */}
              <DiagnosticsPanel
                diagnostics={diagnostics}
                analysis={analysis}
                modules={modules}
                onOpenPresets={() => setIsPresetModalOpen(true)}
                onOpenRepairModal={() => {
                  setActiveRepairModuleId(diagnostics.bottleneckModuleId);
                  setIsRepairModalOpen(true);
                }}
                onOpenWorkOrderModal={() => setIsWorkOrderModalOpen(true)}
              />
            </div>

            {/* 3. 8-Module Series Topology with Individual Degradation Sliders */}
            <ModuleTopology
              modules={modules}
              analysis={analysis}
              baselineSoh={baselineSoh}
              onUpdateSoh={handleUpdateSoh}
              onUpdateIR={handleUpdateIR}
              onResetModule={handleResetModule}
              onSyncAllModulesToBaseline={handleSyncAllModulesToBaseline}
              hasCustomModifiedModules={hasCustomModifiedModules}
              onOpenRepairForModule={handleOpenRepairForModule}
              onRecalculate={handleRecalculate}
              isRecalculating={isRecalculating}
              hasPendingChanges={hasPendingChanges}
            />
          </div>
        ) : (
          /* 4. Degradation & Lifecycle Trajectory Curves */
          <DegradationCharts
            modules={modules}
            analysis={analysis}
            settings={settings}
            baselineSoh={baselineSoh}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-4 mt-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-center sm:justify-start gap-2 text-xs text-slate-500">
          <span className="font-bold text-slate-900 tracking-tight">
            {t('appTitle')}
          </span>
          <span>•</span>
          <span className="font-mono text-emerald-600 font-semibold">{t('revision')}</span>
          <span>•</span>
          <span>{t('developer')}</span>
        </div>
      </footer>

      {/* Modals */}
      <RepairSimulatorModal
        isOpen={isRepairModalOpen}
        onClose={() => setIsRepairModalOpen(false)}
        modules={modules}
        settings={settings}
        currentAnalysis={analysis}
        initialTargetModuleId={activeRepairModuleId}
        onApplyRepairedModules={handleApplyRepairedModules}
      />

      <WorkOrderModal
        isOpen={isWorkOrderModalOpen}
        onClose={() => setIsWorkOrderModalOpen(false)}
        modules={modules}
        settings={settings}
        analysis={analysis}
        diagnostics={diagnostics}
      />

      <PresetSelector
        isOpen={isPresetModalOpen}
        onClose={() => setIsPresetModalOpen(false)}
        onSelectPreset={handleSelectPreset}
      />

      <WelcomeModal
        isOpen={isWelcomeModalOpen}
        onClose={() => setIsWelcomeModalOpen(false)}
        onOpenPresets={() => setIsPresetModalOpen(true)}
      />
    </div>
  );
}
