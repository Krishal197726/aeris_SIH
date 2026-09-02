import React, { useState } from 'react';
import { 
  AlertTriangle, 
  ShieldAlert, 
  Radio, 
  MapPin, 
  Clock, 
  ShieldCheck, 
  Filter, 
  Share2, 
  BellRing,
  Info,
  ChevronRight
} from 'lucide-react';
import { MOCK_WEATHER_ALERTS } from '../data/mockAlerts';

export default function AlertsPage() {
  const [severityFilter, setSeverityFilter] = useState('ALL');

  const filteredAlerts = MOCK_WEATHER_ALERTS.filter(alert => {
    if (severityFilter === 'ALL') return true;
    return alert.severity.toUpperCase() === severityFilter;
  });

  return (
    <div className="relative w-full h-[calc(100vh-3.5rem)] overflow-y-auto bg-[#040711] p-4 sm:p-8">
      {/* Header Banner */}
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-800">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-950/50 border border-red-500/30 text-red-300 text-xs font-mono mb-2">
              <span className="w-2 h-2 rounded-full bg-red-400 animate-ping"></span>
              <span>EARLY WARNING RADAR FEED • ACTIVE</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold font-display text-white">
              Extreme Weather Alerts
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              Real-time meteorological warnings, cyclonic tracks, and disaster risk reduction advisories.
            </p>
          </div>

          {/* Severity Filter Controls */}
          <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-slate-900/90 border border-slate-800 self-start md:self-auto overflow-x-auto">
            <button
              onClick={() => setSeverityFilter('ALL')}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
                severityFilter === 'ALL'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              All Alerts ({MOCK_WEATHER_ALERTS.length})
            </button>
            <button
              onClick={() => setSeverityFilter('SEVERE')}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium flex items-center gap-1 transition-all ${
                severityFilter === 'SEVERE'
                  ? 'bg-red-500/20 text-red-300 border border-red-500/40'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-red-500"></span>
              <span>Severe</span>
            </button>
            <button
              onClick={() => setSeverityFilter('HIGH')}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium flex items-center gap-1 transition-all ${
                severityFilter === 'HIGH'
                  ? 'bg-orange-500/20 text-orange-300 border border-orange-500/40'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-orange-500"></span>
              <span>High</span>
            </button>
            <button
              onClick={() => setSeverityFilter('MODERATE')}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium flex items-center gap-1 transition-all ${
                severityFilter === 'MODERATE'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-yellow-400"></span>
              <span>Moderate</span>
            </button>
          </div>
        </div>

        {/* Alerts Grid */}
        <div className="space-y-4">
          {filteredAlerts.map((alert) => {
            const isSevere = alert.severity === 'Severe';
            const isHigh = alert.severity === 'High';
            
            const badgeBg = isSevere 
              ? 'bg-red-500/20 text-red-300 border-red-500/40' 
              : isHigh 
              ? 'bg-orange-500/20 text-orange-300 border-orange-500/40' 
              : 'bg-yellow-500/20 text-yellow-300 border-yellow-500/40';

            const cardBorder = isSevere
              ? 'border-red-500/30 hover:border-red-500/50'
              : isHigh
              ? 'border-orange-500/30 hover:border-orange-500/50'
              : 'border-yellow-500/30 hover:border-yellow-500/50';

            return (
              <div
                key={alert.id}
                className={`p-5 sm:p-6 rounded-3xl glass-panel bg-slate-900/80 border ${cardBorder} transition-all duration-200 shadow-xl`}
              >
                {/* Header Info */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-slate-800">
                  <div className="flex items-center gap-3">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold font-mono border flex items-center gap-1.5 ${badgeBg}`}>
                      {isSevere && <span className="w-2 h-2 rounded-full bg-red-400 animate-ping" />}
                      {alert.severity === 'Severe' && '🔴'}
                      {alert.severity === 'High' && '🟠'}
                      {alert.severity === 'Moderate' && '🟡'}
                      {alert.severity} • {alert.category}
                    </span>
                    <span className="text-xs text-slate-400 font-mono hidden sm:inline">
                      CODE: {alert.alertCode}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 text-xs text-slate-400 font-mono">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-cyan-400" /> {alert.time}
                    </span>
                  </div>
                </div>

                {/* Main Alert Description */}
                <div className="my-4">
                  <div className="flex items-start gap-2 mb-1">
                    <MapPin className="w-4 h-4 text-cyan-400 mt-1 shrink-0" />
                    <div>
                      <h3 className="text-lg font-bold text-white font-display">
                        {alert.title} — {alert.location}
                      </h3>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Issued: {alert.issuedAt} • Impact Zone: {alert.impactRadius}
                      </p>
                    </div>
                  </div>

                  <p className="text-xs sm:text-sm text-slate-300 mt-3 leading-relaxed">
                    {alert.description}
                  </p>
                </div>

                {/* Recommended Mitigation Action */}
                <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 text-xs sm:text-sm leading-relaxed text-slate-200 mb-3">
                  <div className="flex items-start gap-2.5">
                    <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold text-emerald-300 block mb-1">
                        Recommended Action:
                      </span>
                      {alert.recommendedAction}
                    </div>
                  </div>
                </div>

                {/* Affected Districts */}
                <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-800 text-xs">
                  <span className="text-slate-400 font-medium">Affected Sectors:</span>
                  {alert.affectedDistricts.map((district, dIdx) => (
                    <span
                      key={dIdx}
                      className="px-2.5 py-0.5 rounded-lg bg-slate-800 text-slate-300 border border-slate-700/60 font-mono text-[11px]"
                    >
                      {district}
                    </span>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
