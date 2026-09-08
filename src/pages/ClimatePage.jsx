import React, { useState } from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend
} from 'recharts';
import {
  TrendingUp,
  Thermometer,
  CloudRain,
  Activity,
  ShieldAlert,
  Sparkles,
  Info,
  Calendar
} from 'lucide-react';
import {
  TEMPERATURE_TREND_DATA,
  RAINFALL_VARIABILITY_DATA,
  EXTREME_EVENTS_BY_DECADE,
  REGIONAL_VULNERABILITY_INDEX
} from '../data/mockClimate';

export default function ClimatePage() {
  const [activeTab, setActiveTab] = useState('temp'); // temp, rainfall, extremes

  return (
    <div className="relative w-full min-h-full bg-[#040711] p-4 sm:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header Title */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-800">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-950/50 border border-cyan-500/30 text-cyan-300 text-xs font-mono mb-2">
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
              <span>AERIS MULTI-DECADAL REANALYSIS ENGINE</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold font-display text-white">
              Climate Intelligence & Planetary Trends
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              Deep historical observational data, long-term temperature anomalies, and monsoon variability projections.
            </p>
          </div>

          {/* Quick Tab Switcher */}
          <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-slate-900 border border-slate-800 self-start md:self-auto">
            <button
              onClick={() => setActiveTab('temp')}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${activeTab === 'temp'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-white'
                }`}
            >
              Temperature Trend
            </button>
            <button
              onClick={() => setActiveTab('rainfall')}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${activeTab === 'rainfall'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-white'
                }`}
            >
              Rainfall Trend
            </button>
            <button
              onClick={() => setActiveTab('extremes')}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${activeTab === 'extremes'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-white'
                }`}
            >
              Extreme Events
            </button>
          </div>
        </div>

        {/* Top Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="p-4 rounded-2xl glass-panel bg-slate-900/60 border border-cyan-500/20">
            <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
              <span>Mean Warming Anomaly</span>
              <Thermometer className="w-4 h-4 text-cyan-400" />
            </div>
            <div className="text-2xl font-bold font-mono text-cyan-300">+1.24 °C</div>
            <span className="text-[11px] text-slate-500">Above 1990-2010 Climatological Baseline</span>
          </div>

          <div className="p-4 rounded-2xl glass-panel bg-slate-900/60 border border-emerald-500/20">
            <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
              <span>Monsoon Variance</span>
              <CloudRain className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-2xl font-bold font-mono text-emerald-400">+8.4% Erratic</div>
            <span className="text-[11px] text-slate-500">Increased short-duration intense spells</span>
          </div>

          <div className="p-4 rounded-2xl glass-panel bg-slate-900/60 border border-amber-500/20">
            <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
              <span>Heatwave Frequency</span>
              <Activity className="w-4 h-4 text-amber-400" />
            </div>
            <div className="text-2xl font-bold font-mono text-amber-300">+46 Days/Yr</div>
            <span className="text-[11px] text-slate-500">Recorded across Western dry corridor</span>
          </div>

          <div className="p-4 rounded-2xl glass-panel bg-slate-900/60 border border-purple-500/20">
            <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
              <span>High Risk Sectors</span>
              <ShieldAlert className="w-4 h-4 text-purple-400" />
            </div>
            <div className="text-2xl font-bold font-mono text-purple-300">5 Vulnerable</div>
            <span className="text-[11px] text-slate-500">Coastal, Arid & Riverine Basins</span>
          </div>
        </div>

        {/* Dynamic Recharts Section */}
        {activeTab === 'temp' && (
          <div className="p-5 sm:p-6 rounded-3xl glass-panel bg-slate-900/80 border border-cyan-500/20 shadow-2xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6">
              <div>
                <h3 className="text-base sm:text-lg font-bold text-white font-display">
                  Subcontinental Surface Temperature Anomaly Trend (2000 - 2026)
                </h3>
                <p className="text-xs text-slate-400">
                  Annual mean surface temperature anomaly (°C) and recorded peak heatwave duration days.
                </p>
              </div>
              <span className="text-xs font-mono text-cyan-400 bg-cyan-950/40 px-3 py-1 rounded-full border border-cyan-500/30 self-start sm:self-auto">
                Decadal Warming Rate: +0.28°C / 10y
              </span>
            </div>

            <div className="h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={TEMPERATURE_TREND_DATA} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="tempGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stop-color="#06b6d4" stopOpacity={0.4} />
                      <stop offset="95%" stop-color="#06b6d4" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                  <XAxis dataKey="year" stroke="#64748b" tick={{ fontSize: 11 }} />
                  <YAxis stroke="#64748b" tick={{ fontSize: 11 }} unit="°C" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0f172a',
                      borderColor: '#06b6d4',
                      borderRadius: '12px',
                      color: '#fff',
                      fontSize: '12px'
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="tempAnomaly"
                    name="Temperature Anomaly (°C)"
                    stroke="#00E5FF"
                    strokeWidth={3}
                    fillOpacity={1}
                    fill="url(#tempGrad)"
                  />
                  <Line
                    type="monotone"
                    dataKey="baseline"
                    name="Pre-Industrial Baseline (0.0°C)"
                    stroke="#ef4444"
                    strokeDasharray="4 4"
                    strokeWidth={1.5}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {activeTab === 'rainfall' && (
          <div className="p-5 sm:p-6 rounded-3xl glass-panel bg-slate-900/80 border border-cyan-500/20 shadow-2xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6">
              <div>
                <h3 className="text-base sm:text-lg font-bold text-white font-display">
                  Monsoon Rainfall Trend & Extreme Precipitation Events
                </h3>
                <p className="text-xs text-slate-400">
                  Annual cumulative rainfall (mm) vs Long Period Average (LPA: 887 mm)
                </p>
              </div>
            </div>

            <div className="h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={RAINFALL_VARIABILITY_DATA} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                  <XAxis dataKey="year" stroke="#64748b" tick={{ fontSize: 11 }} />
                  <YAxis stroke="#64748b" tick={{ fontSize: 11 }} unit=" mm" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0f172a',
                      borderColor: '#10b981',
                      borderRadius: '12px',
                      color: '#fff',
                      fontSize: '12px'
                    }}
                  />
                  <Legend />
                  <Bar dataKey="actualRain" name="Observed Rainfall (mm)" fill="#0ea5e9" radius={[6, 6, 0, 0]} />
                  <Bar dataKey="normalRain" name="Baseline LPA (mm)" fill="#334155" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {activeTab === 'extremes' && (
          <div className="p-5 sm:p-6 rounded-3xl glass-panel bg-slate-900/80 border border-cyan-500/20 shadow-2xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6">
              <div>
                <h3 className="text-base sm:text-lg font-bold text-white font-display">
                  Decadal Extreme Weather Events Frequency (1990 - 2026)
                </h3>
                <p className="text-xs text-slate-400">
                  Frequency of severe cyclonic storms, flash floods, and prolonged heatwaves.
                </p>
              </div>
            </div>

            <div className="h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={EXTREME_EVENTS_BY_DECADE} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                  <XAxis dataKey="decade" stroke="#64748b" tick={{ fontSize: 11 }} />
                  <YAxis stroke="#64748b" tick={{ fontSize: 11 }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0f172a',
                      borderColor: '#f59e0b',
                      borderRadius: '12px',
                      color: '#fff',
                      fontSize: '12px'
                    }}
                  />
                  <Legend />
                  <Bar dataKey="cyclones" name="Severe Cyclones" fill="#38bdf8" />
                  <Bar dataKey="flashFloods" name="Flash Flood Events" fill="#06b6d4" />
                  <Bar dataKey="heatwaves" name="Heatwave Days" fill="#f59e0b" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Regional Vulnerability Table */}
        <div className="p-5 sm:p-6 rounded-3xl glass-panel bg-slate-900/80 border border-slate-800 shadow-xl">
          <h3 className="text-base font-bold text-white font-display mb-1">
            Regional Climate Risk Index (RCRI Matrix)
          </h3>
          <p className="text-xs text-slate-400 mb-4">
            Vulnerability assessment and adaptive climate strategy priorities for key agricultural and coastal zones.
          </p>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 font-mono">
                  <th className="pb-3 px-3">Geographic Region</th>
                  <th className="pb-3 px-3">Risk Score (1-100)</th>
                  <th className="pb-3 px-3">Primary Threat Vector</th>
                  <th className="pb-3 px-3">Adaptation Priority</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {REGIONAL_VULNERABILITY_INDEX.map((row, i) => (
                  <tr key={i} className="hover:bg-slate-800/30">
                    <td className="py-3 px-3 font-medium text-slate-200">{row.region}</td>
                    <td className="py-3 px-3 font-mono font-bold text-amber-400">{row.riskScore}/100</td>
                    <td className="py-3 px-3 text-slate-300">{row.primaryThreat}</td>
                    <td className="py-3 px-3">
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-semibold bg-red-500/20 text-red-300 border border-red-500/30">
                        {row.adaptStatus}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
