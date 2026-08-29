import React, { useState } from 'react';
import {
  X,
  FileText,
  Printer,
  Copy,
  Download,
  Check,
  ShieldCheck,
  AlertTriangle,
} from 'lucide-react';
import { BatteryModule, PackAnalysis, PackGlobalSettings, DiagnosticResult } from '../types';
import { useLanguage } from '../i18n/translations';

interface WorkOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  modules: BatteryModule[];
  settings: PackGlobalSettings;
  analysis: PackAnalysis;
  diagnostics: DiagnosticResult;
}

export const WorkOrderModal: React.FC<WorkOrderModalProps> = ({
  isOpen,
  onClose,
  modules,
  settings,
  analysis,
  diagnostics,
}) => {
  const { t } = useLanguage();
  const [copied, setCopied] = useState(false);
  const [technicianName] = useState('Senior BESS Tech (PM Team)');
  const [workOrderId] = useState(`WO-BESS-384V-${Math.floor(100000 + Math.random() * 900000)}`);
  const currentDate = new Date().toISOString().split('T')[0];

  if (!isOpen) return null;

  const handleCopyText = () => {
    const textReport = `======================================================
${t('workOrderModalTitle')}: ${workOrderId}
======================================================
Date: ${currentDate}
System: 384VDC LFP Energy Storage Pack (8 x 48V Modules in Series)
Pack Serial: ${settings.packSerialNumber}
Site Location: ${settings.siteLocation}
Completed Cycles: ${settings.cycles.toLocaleString()}
Calendar Age: ${settings.calendarYears} Years
Operating Temp: ${settings.temperature.toUpperCase()}
DoD Setting: ${settings.dod}%

DIAGNOSTIC SUMMARY:
Status: ${diagnostics.badgeText} - ${diagnostics.title}
String Usable Capacity: ${analysis.effectiveCapacityKwh} kWh / ${analysis.nameplateCapacityKwh} kWh
Effective SOH (Bottleneck): ${analysis.effectivePackSoh.toFixed(1)}% (${analysis.bottleneckModule.name})
String Variance: Δ${analysis.deltaSoh}% SOH
Wasted/Stranded Capacity: ${analysis.wastedCapacityKwh} kWh

MODULE TELEMETRY MATRIX:
${modules
  .map(
    (m) =>
      `Slot #${m.id} | ${m.name} | S/N: ${m.serialNumber} | SOH: ${m.soh.toFixed(1)}% | IR: ${m.internalResistance.toUpperCase()} | Voltage: 48.0V`
  )
  .join('\n')}

ACTIONABLE DIRECTIVES:
1. ${diagnostics.recommendedAction}
${
  diagnostics.targetReplacementSohRange
    ? `2. Recommended Replacement Module SOH Window: ${diagnostics.targetReplacementSohRange.min}% - ${diagnostics.targetReplacementSohRange.max}% SOH.\n`
    : ''
}
SAFETY & FIELD PROTOCOLS:
- Execute Lockout/Tagout (LOTO) on High Voltage DC disconnect switch.
- Verify zero potential difference (<5V) across 384V DC busbars prior to tool contact.
- Torque all M8 copper busbar fasteners to 12.5 N·m using calibrated insulated torque wrench.
- Post-maintenance: Initiate 12-hour BMS cell active top-balancing routine.

Approved By: ${technicianName}
======================================================`;

    navigator.clipboard.writeText(textReport);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleDownloadCsv = () => {
    const headers = 'Module_ID,Module_Name,Serial_Number,Nominal_Voltage,SOH_Percent,IR_Status,Is_Bottleneck\n';
    const rows = modules
      .map(
        (m) =>
          `${m.id},"${m.name}","${m.serialNumber}",${m.nominalVoltage},${m.soh.toFixed(1)},${m.internalResistance},${
            m.id === analysis.bottleneckModule.id ? 'YES' : 'NO'
          }`
      )
      .join('\n');

    const blob = new Blob([headers + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `BESS_384V_Pack_Audit_${settings.packSerialNumber}_${currentDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-xl max-w-4xl w-full border border-slate-200 shadow-2xl overflow-hidden my-6">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-blue-500/20 text-blue-400 border border-blue-400/30">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold tracking-tight text-white flex items-center gap-2">
                <span>{t('workOrderModalTitle')}</span>
                <span className="text-[10px] uppercase font-mono bg-blue-950 text-blue-300 px-2 py-0.5 rounded border border-blue-800">
                  384VDC
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                {t('workOrderSubtitle')}
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

        {/* Work Order Content Area (Printable) */}
        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto font-sans print:p-0 print:max-h-none">
          {/* Metadata Card */}
          <div className="border border-slate-200 rounded-xl p-4 bg-slate-50 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-3 border-b border-slate-200 gap-2">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">
                  {t('workOrderIdentifier')}
                </span>
                <div className="text-base font-bold text-slate-900 font-mono">
                  {workOrderId}
                </div>
              </div>

              <div className="text-right">
                <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">
                  {t('issueDateStatus')}
                </span>
                <div className="text-xs font-bold text-slate-800 flex items-center gap-1.5 justify-end">
                  <span className="font-mono">{currentDate}</span>
                  <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-800 text-[10px] font-bold uppercase">
                    {t('actionRequired')}
                  </span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div>
                <span className="text-slate-500 font-medium">{t('packModel')}:</span>
                <div className="font-bold text-slate-800">384V / 38.4kWh BESS</div>
              </div>
              <div>
                <span className="text-slate-500 font-medium">{t('packSerial')}:</span>
                <div className="font-mono font-bold text-slate-800">{settings.packSerialNumber}</div>
              </div>
              <div>
                <span className="text-slate-500 font-medium">{t('siteLocation')}:</span>
                <div className="font-bold text-slate-800">{settings.siteLocation}</div>
              </div>
              <div>
                <span className="text-slate-500 font-medium">{t('cycleCount')}:</span>
                <div className="font-bold text-slate-800 font-mono">{settings.cycles.toLocaleString()} {t('cycles')}</div>
              </div>
            </div>
          </div>

          {/* Diagnostic Verdict */}
          <div className="border border-amber-200 bg-amber-50/70 rounded-xl p-4 space-y-2">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0" />
              <h4 className="text-xs font-bold text-amber-950 uppercase tracking-wide">
                {t('primaryDiagnosticFinding')}: {diagnostics.title}
              </h4>
            </div>
            <p className="text-xs text-amber-900 leading-relaxed">
              {diagnostics.description}
            </p>
            <div className="text-xs font-semibold text-amber-950 bg-white p-2.5 rounded-lg border border-amber-200">
              {t('directOrder')}: {diagnostics.recommendedAction}
            </div>
          </div>

          {/* Module Health Table */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
              {t('seriesStringTelemetry')}
            </h4>
            <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
              <table className="min-w-full divide-y divide-slate-200 text-xs">
                <thead className="bg-slate-100 text-slate-600 font-semibold text-left">
                  <tr>
                    <th className="py-2.5 px-3">{t('slot')}</th>
                    <th className="py-2.5 px-3">{t('moduleSerial')}</th>
                    <th className="py-2.5 px-3">{t('nominalVoltage')}</th>
                    <th className="py-2.5 px-3">{t('measuredSoh')}</th>
                    <th className="py-2.5 px-3">{t('internalResistance')}</th>
                    <th className="py-2.5 px-3">{t('status')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {modules.map((m) => {
                    const isBottleneck = m.id === analysis.bottleneckModule.id;
                    const isDegraded = m.soh < 75 || m.internalResistance === 'critical';
                    return (
                      <tr
                        key={m.id}
                        className={isDegraded ? 'bg-amber-50/40' : undefined}
                      >
                        <td className="py-2.5 px-3 font-bold text-slate-800">
                          #{m.id}
                        </td>
                        <td className="py-2.5 px-3 font-mono text-slate-600">
                          {m.serialNumber}
                        </td>
                        <td className="py-2.5 px-3 text-slate-700 font-mono">48.0 VDC</td>
                        <td className="py-2.5 px-3 font-mono font-bold text-slate-900">
                          {m.soh.toFixed(1)}%
                        </td>
                        <td className="py-2.5 px-3">
                          <span
                            className={`px-1.5 py-0.5 rounded text-[10px] font-semibold uppercase ${
                              m.internalResistance === 'critical'
                                ? 'bg-red-100 text-red-800'
                                : m.internalResistance === 'elevated'
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-slate-100 text-slate-700'
                            }`}
                          >
                            {m.internalResistance}
                          </span>
                        </td>
                        <td className="py-2.5 px-3">
                          {isBottleneck ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-orange-100 text-orange-800 border border-orange-200 uppercase">
                              {t('badgeWeakest')}
                            </span>
                          ) : m.soh >= 85 ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-50 text-emerald-700 uppercase">
                              {t('nominal')}
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-amber-50 text-amber-700 uppercase">
                              {t('gradeDegraded')}
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Safety & Protocol Checklist */}
          <div className="border border-slate-200 rounded-xl p-4 bg-slate-50 space-y-3">
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wide flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>{t('sopSafetySignoff')}</span>
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs text-slate-700">
              <label className="flex items-start gap-2 bg-white p-2 rounded-lg border border-slate-200">
                <input type="checkbox" defaultChecked className="mt-0.5 accent-blue-600" />
                <span>{t('lotoProtocol')}</span>
              </label>
              <label className="flex items-start gap-2 bg-white p-2 rounded-lg border border-slate-200">
                <input type="checkbox" defaultChecked className="mt-0.5 accent-blue-600" />
                <span>{t('zeroVoltageProtocol')}</span>
              </label>
              <label className="flex items-start gap-2 bg-white p-2 rounded-lg border border-slate-200">
                <input type="checkbox" defaultChecked className="mt-0.5 accent-blue-600" />
                <span>{t('sohToleranceProtocol')}</span>
              </label>
              <label className="flex items-start gap-2 bg-white p-2 rounded-lg border border-slate-200">
                <input type="checkbox" defaultChecked className="mt-0.5 accent-blue-600" />
                <span>{t('torqueProtocol')}</span>
              </label>
            </div>
          </div>
        </div>

        {/* Modal Footer Controls */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyText}
              className="px-3.5 py-2 rounded-lg text-xs font-semibold uppercase tracking-wider bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-slate-600" />}
              <span>{copied ? t('copied') : t('copyTicket')}</span>
            </button>

            <button
              onClick={handleDownloadCsv}
              className="px-3.5 py-2 rounded-lg text-xs font-semibold uppercase tracking-wider bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
            >
              <Download className="w-3.5 h-3.5 text-slate-600" />
              <span>{t('exportCsv')}</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider bg-blue-600 hover:bg-blue-700 text-white shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>{t('printWorkOrder')}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
