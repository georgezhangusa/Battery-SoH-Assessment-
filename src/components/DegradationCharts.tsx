import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  LineChart,
  Line,
  Cell,
  LabelList,
} from 'recharts';
import { BarChart3 } from 'lucide-react';
import { BatteryModule, PackAnalysis, PackGlobalSettings } from '../types';
import { calculateBaselineSohAtCycle } from '../utils/batteryCalculations';
import { useLanguage } from '../i18n/translations';

interface DegradationChartsProps {
  modules: BatteryModule[];
  analysis: PackAnalysis;
  settings: PackGlobalSettings;
  baselineSoh: number;
}

export const DegradationCharts: React.FC<DegradationChartsProps> = ({
  modules,
  analysis,
  settings,
  baselineSoh,
}) => {
  const { t } = useLanguage();

  // Data for Chart 1: Module SOH distribution
  const moduleBarData = modules.map((m) => ({
    name: `${t('module').substring(0, 3)} #${m.id}`,
    soh: m.soh,
    isBottleneck: m.id === analysis.bottleneckModule.id,
    ir: m.internalResistance,
  }));

  // Data for Chart 2: 0 to 10,000 cycle lifetime degradation curve
  const cycleCurveData: { cycle: number; baseline: number; currentOperating?: number; eol80: number; eol70: number }[] = [];
  for (let c = 0; c <= 10000; c += 500) {
    const bSoh = calculateBaselineSohAtCycle(c, settings);
    cycleCurveData.push({
      cycle: c,
      baseline: bSoh,
      eol80: 80,
      eol70: 70,
    });
  }

  return (
    <section className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-3 border-b border-slate-100 gap-2">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-indigo-50 text-indigo-700">
            <BarChart3 className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900 tracking-tight">
              {t('chartsTitle')}
            </h3>
            <p className="text-xs text-slate-500">
              {t('chartsSubtitle')}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500" />
            <span className="text-slate-600">≥85% {t('badgeHealthy')}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-amber-500" />
            <span className="text-slate-600">75–84% {t('badgeAging')}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-orange-500" />
            <span className="text-slate-600">&lt;75% {t('badgeWeakest')}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 1: Module SOH Variance Bar Chart */}
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 flex flex-col justify-between shadow-xs">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
            <h4 className="text-sm font-bold text-slate-900 tracking-tight flex items-center gap-1.5">
              <span>{t('moduleSohVariance')}</span>
            </h4>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded-md bg-white border border-slate-200 text-xs font-mono font-medium text-slate-700 shadow-2xs">
                {t('avgSoh')}: <strong className="text-slate-900">{analysis.averageSoh}%</strong>
              </span>
              <span className="px-2 py-0.5 rounded-md bg-amber-50 border border-amber-200 text-xs font-mono font-medium text-amber-800 shadow-2xs">
                {t('minSoh')}: <strong className="text-amber-900">{analysis.minSoh}%</strong>
              </span>
            </div>
          </div>

          <div className="h-64 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={moduleBarData} margin={{ top: 20, right: 15, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 12, fill: '#1e293b', fontWeight: 600 }}
                  axisLine={{ stroke: '#cbd5e1' }}
                  tickLine={{ stroke: '#cbd5e1' }}
                />
                <YAxis
                  domain={[50, 100]}
                  tick={{ fontSize: 12, fill: '#475569', fontWeight: 500 }}
                  tickFormatter={(v) => `${v}%`}
                  axisLine={{ stroke: '#cbd5e1' }}
                  tickLine={{ stroke: '#cbd5e1' }}
                  width={42}
                />
                <Tooltip
                  formatter={(value: any, name: any, props: any) => [
                    `${value}% SOH`,
                    props.payload.isBottleneck ? `${t('module')} SOH (⚠️ ${t('badgeWeakest')})` : `${t('module')} SOH`,
                  ]}
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderRadius: '8px',
                    color: '#fff',
                    fontSize: '12px',
                    fontWeight: '600',
                    border: 'none',
                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                  }}
                />
                <ReferenceLine
                  y={80}
                  stroke="#d97706"
                  strokeWidth={1.5}
                  strokeDasharray="4 4"
                  label={{
                    value: '80% EOL',
                    position: 'insideTopLeft',
                    fill: '#b45309',
                    fontSize: 11,
                    fontWeight: 700,
                  }}
                />
                <ReferenceLine
                  y={baselineSoh}
                  stroke="#4f46e5"
                  strokeWidth={1.5}
                  strokeDasharray="2 2"
                  label={{
                    value: `${t('lfpBaseline')}: ${baselineSoh}%`,
                    position: 'insideTopRight',
                    fill: '#4338ca',
                    fontSize: 11,
                    fontWeight: 700,
                  }}
                />
                <Bar dataKey="soh" radius={[6, 6, 0, 0]}>
                  <LabelList
                    dataKey="soh"
                    position="top"
                    formatter={(val: number) => `${val}%`}
                    fill="#0f172a"
                    fontSize={11}
                    fontWeight={700}
                    offset={6}
                  />
                  {moduleBarData.map((entry, index) => {
                    let color = '#10b981'; // emerald
                    if (entry.ir === 'critical') color = '#ef4444'; // red
                    else if (entry.soh < 75) color = '#f97316'; // orange
                    else if (entry.soh < 85) color = '#f59e0b'; // amber
                    return (
                      <Cell
                        key={`cell-${index}`}
                        fill={color}
                        stroke={entry.isBottleneck ? '#9a3412' : '#ffffff'}
                        strokeWidth={entry.isBottleneck ? 2.5 : 1}
                      />
                    );
                  })}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-200/80 text-xs text-slate-600 flex flex-wrap items-center justify-between gap-2">
            <span>{t('minModuleSetsCutoff')}</span>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-amber-100/80 border border-amber-300 text-amber-950 font-bold rounded-md">
              {t('spreadDeltaSoh')}: {analysis.deltaSoh}%
            </span>
          </div>
        </div>

        {/* Chart 2: Lifetime LFP Aging Curve */}
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 flex flex-col justify-between shadow-xs">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
            <h4 className="text-sm font-bold text-slate-900 tracking-tight">
              {t('cycleDegradationCurve')}
            </h4>
            <span className="px-2.5 py-0.5 rounded-md bg-white border border-slate-200 text-xs font-mono font-semibold text-slate-800 shadow-2xs">
              {t('currentLabel')}: {settings.cycles.toLocaleString()} {t('cycles')}
            </span>
          </div>

          <div className="h-64 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={cycleCurveData} margin={{ top: 20, right: 15, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                <XAxis
                  dataKey="cycle"
                  tick={{ fontSize: 12, fill: '#1e293b', fontWeight: 600 }}
                  tickFormatter={(val) => `${val / 1000}k`}
                  axisLine={{ stroke: '#cbd5e1' }}
                  tickLine={{ stroke: '#cbd5e1' }}
                />
                <YAxis
                  domain={[60, 100]}
                  tick={{ fontSize: 12, fill: '#475569', fontWeight: 500 }}
                  tickFormatter={(v) => `${v}%`}
                  axisLine={{ stroke: '#cbd5e1' }}
                  tickLine={{ stroke: '#cbd5e1' }}
                  width={42}
                />
                <Tooltip
                  formatter={(value: any, name: any) => [
                    `${value}% SOH`,
                    name === 'baseline' ? t('calculatedBaselineSoh') : name,
                  ]}
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderRadius: '8px',
                    color: '#fff',
                    fontSize: '12px',
                    fontWeight: '600',
                    border: 'none',
                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                  }}
                />
                <ReferenceLine
                  y={80}
                  stroke="#d97706"
                  strokeWidth={1.5}
                  strokeDasharray="3 3"
                  label={{
                    value: '80% Primary EOL',
                    position: 'insideBottomRight',
                    fill: '#b45309',
                    fontSize: 11,
                    fontWeight: 700,
                  }}
                />
                <ReferenceLine
                  y={70}
                  stroke="#ef4444"
                  strokeWidth={1.5}
                  strokeDasharray="3 3"
                  label={{
                    value: '70% Decommission',
                    position: 'insideBottomRight',
                    fill: '#dc2626',
                    fontSize: 11,
                    fontWeight: 700,
                  }}
                />
                <ReferenceLine
                  x={settings.cycles}
                  stroke="#059669"
                  strokeWidth={2}
                  label={{
                    value: `${t('currentLabel')} (${settings.cycles}c)`,
                    position: 'insideTopLeft',
                    fill: '#065f46',
                    fontSize: 11,
                    fontWeight: 700,
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="baseline"
                  stroke="#4f46e5"
                  strokeWidth={2.5}
                  dot={false}
                  name={t('lfpDegradationCurve')}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-200/80 text-xs text-slate-600 flex flex-wrap items-center justify-between gap-2">
            <span>{t('curveExplanation')}</span>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-blue-50 border border-blue-200 text-blue-950 font-bold rounded-md">
              {t('lifeSpanRul')}: ~{analysis.remainingCyclesTo80.toLocaleString()} {t('cycles')} to 80%
            </span>
          </div>
        </div>
      </div>
    </section>
  );
};
