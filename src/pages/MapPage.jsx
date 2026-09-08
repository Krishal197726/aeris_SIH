import React, { useState } from 'react';
import { 
  Layers, 
  CloudRain, 
  Thermometer, 
  Wind, 
  AlertTriangle, 
  ShieldAlert, 
  Compass, 
  MapPin, 
  X, 
  Activity,
  Droplets,
  Radio,
  Eye,
  Maximize2
} from 'lucide-react';
import { MOCK_WEATHER_STATIONS } from '../data/mockStations';

export default function MapPage() {
  const [activeLayer, setActiveLayer] = useState('rainfall'); // rainfall, temperature, wind, alerts, risk
  const [selectedStation, setSelectedStation] = useState(MOCK_WEATHER_STATIONS[0]);
  const [filterQuery, setFilterQuery] = useState('');

  const filteredStations = MOCK_WEATHER_STATIONS.filter(s => 
    s.city.toLowerCase().includes(filterQuery.toLowerCase()) ||
    s.state.toLowerCase().includes(filterQuery.toLowerCase())
  );

  return (
    <div className="relative w-full h-[calc(100vh-3.5rem)] overflow-hidden bg-[#050914] flex flex-col">
      {/* Top Map Layer Bar */}
      <div className="p-3 sm:px-6 bg-slate-950/80 backdrop-blur-xl border-b border-cyan-500/10 flex flex-wrap items-center justify-between gap-3 z-20 shrink-0">
        <div className="flex items-center gap-2 overflow-x-auto py-1">
          <span className="text-xs font-semibold text-slate-400 mr-2 flex items-center gap-1.5 shrink-0 font-mono">
            <Layers className="w-4 h-4 text-cyan-400" />
            Active Layer:
          </span>

          <button
            onClick={() => setActiveLayer('rainfall')}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium flex items-center gap-1.5 transition-all shrink-0 ${
              activeLayer === 'rainfall'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                : 'bg-slate-900/60 text-slate-400 hover:text-slate-200 border border-slate-800'
            }`}
          >
            <CloudRain className="w-3.5 h-3.5 text-cyan-400" />
            <span>Rainfall</span>
          </button>

          <button
            onClick={() => setActiveLayer('temperature')}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium flex items-center gap-1.5 transition-all shrink-0 ${
              activeLayer === 'temperature'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm'
                : 'bg-slate-900/60 text-slate-400 hover:text-slate-200 border border-slate-800'
            }`}
          >
            <Thermometer className="w-3.5 h-3.5 text-amber-400" />
            <span>Temperature</span>
          </button>

          <button
            onClick={() => setActiveLayer('wind')}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium flex items-center gap-1.5 transition-all shrink-0 ${
              activeLayer === 'wind'
                ? 'bg-blue-500/20 text-blue-300 border border-blue-500/40 shadow-sm'
                : 'bg-slate-900/60 text-slate-400 hover:text-slate-200 border border-slate-800'
            }`}
          >
            <Wind className="w-3.5 h-3.5 text-blue-400" />
            <span>Wind</span>
          </button>

          <button
            onClick={() => setActiveLayer('alerts')}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium flex items-center gap-1.5 transition-all shrink-0 ${
              activeLayer === 'alerts'
                ? 'bg-red-500/20 text-red-300 border border-red-500/40 shadow-sm'
                : 'bg-slate-900/60 text-slate-400 hover:text-slate-200 border border-slate-800'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5 text-red-400" />
            <span>Alerts</span>
          </button>

          <button
            onClick={() => setActiveLayer('risk')}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium flex items-center gap-1.5 transition-all shrink-0 ${
              activeLayer === 'risk'
                ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40 shadow-sm'
                : 'bg-slate-900/60 text-slate-400 hover:text-slate-200 border border-slate-800'
            }`}
          >
            <ShieldAlert className="w-3.5 h-3.5 text-purple-400" />
            <span>Risk</span>
          </button>
        </div>

        {/* Quick Search */}
        <div className="flex items-center gap-2">
          <input
            type="text"
            placeholder="Search stations..."
            value={filterQuery}
            onChange={(e) => setFilterQuery(e.target.value)}
            className="px-3 py-1 rounded-xl bg-slate-900/80 border border-slate-800 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-cyan-500/40"
          />
        </div>
      </div>

      {/* Main Map Viewport */}
      <div className="relative flex-1 w-full h-full overflow-hidden bg-space-grid">
        {/* Synthetic Regional Map Canvas Surface */}
        <div className="absolute inset-0 flex items-center justify-center p-4">
          <div className="relative w-full max-w-4xl h-[78vh] rounded-3xl glass-panel p-6 border border-cyan-500/20 bg-slate-950/80 shadow-2xl overflow-hidden flex items-center justify-center">
            
            {/* Dynamic Meteorological Heatmap / Radar Wave simulation */}
            <div className="absolute inset-0 pointer-events-none">
              {activeLayer === 'rainfall' && (
                <div className="absolute inset-0 bg-radial-[circle_at_32%_48%,rgba(6,182,212,0.35)_0%,rgba(14,116,144,0.15)_40%,transparent_70%]" />
              )}
              {activeLayer === 'temperature' && (
                <div className="absolute inset-0 bg-radial-[circle_at_38%_38%,rgba(245,158,11,0.35)_0%,rgba(239,68,68,0.15)_45%,transparent_70%]" />
              )}
              {activeLayer === 'wind' && (
                <div className="absolute inset-0 bg-radial-[circle_at_45%_65%,rgba(59,130,246,0.35)_0%,rgba(14,165,233,0.15)_45%,transparent_70%]" />
              )}
              {activeLayer === 'alerts' && (
                <div className="absolute inset-0 bg-radial-[circle_at_28%_46%,rgba(239,68,68,0.4)_0%,transparent_50%]" />
              )}
              {activeLayer === 'risk' && (
                <div className="absolute inset-0 bg-radial-[circle_at_50%_50%,rgba(168,85,247,0.3)_0%,transparent_60%]" />
              )}
            </div>

            {/* Subcontinent Schematic Outline */}
            <svg
              viewBox="0 0 100 100"
              className="w-full h-full max-h-[70vh] opacity-80 transition-all select-none"
              preserveAspectRatio="xMidYMid meet"
            >
              {/* Radar Grid Circles */}
              <circle cx="50" cy="50" r="42" fill="none" stroke="rgba(56, 189, 248, 0.1)" strokeWidth="0.5" strokeDasharray="2 2" />
              <circle cx="50" cy="50" r="28" fill="none" stroke="rgba(56, 189, 248, 0.15)" strokeWidth="0.5" />
              <circle cx="50" cy="50" r="14" fill="none" stroke="rgba(56, 189, 248, 0.2)" strokeWidth="0.5" />

              {/* Geographic Region Polygon Outline */}
              <polygon
                points="42,24 50,18 64,22 88,32 86,40 76,48 68,54 56,86 44,78 30,62 26,46 36,34"
                fill="rgba(15, 23, 42, 0.6)"
                stroke="rgba(56, 189, 248, 0.4)"
                strokeWidth="1.2"
                strokeLinejoin="round"
              />

              {/* Wind Vector Streams if wind layer active */}
              {activeLayer === 'wind' && (
                <g stroke="rgba(56, 189, 248, 0.6)" strokeWidth="0.8" strokeLinecap="round">
                  <path d="M25 60 Q 35 50 45 45" strokeDasharray="3 3" />
                  <path d="M28 68 Q 40 58 52 50" strokeDasharray="3 3" />
                  <path d="M35 75 Q 48 62 60 55" strokeDasharray="3 3" />
                </g>
              )}
            </svg>

            {/* Weather Station Interactive Pin Markers */}
            {filteredStations.map((st) => {
              const isSelected = selectedStation?.id === st.id;
              return (
                <button
                  key={st.id}
                  onClick={() => setSelectedStation(st)}
                  className="absolute z-30 transform -translate-x-1/2 -translate-y-1/2 group cursor-pointer"
                  style={{ left: `${st.x}%`, top: `${st.y}%` }}
                >
                  <div className="relative flex items-center justify-center">
                    {/* Pulsing ring for high risk */}
                    {st.risk === 'Severe' || st.risk === 'High' ? (
                      <span
                        className="absolute w-7 h-7 rounded-full animate-ping opacity-60"
                        style={{ backgroundColor: st.riskColor }}
                      />
                    ) : null}

                    {/* Pin Circle */}
                    <div
                      className={`w-5 h-5 rounded-full flex items-center justify-center border-2 transition-all ${
                        isSelected
                          ? 'scale-125 ring-4 ring-cyan-400/40 bg-white text-slate-950 border-cyan-400'
                          : 'bg-slate-900 border-cyan-400/80 text-cyan-300 hover:scale-115'
                      }`}
                      style={{ borderColor: st.riskColor }}
                    >
                      <MapPin className="w-2.5 h-2.5" />
                    </div>

                    {/* Floating Label */}
                    <div className="absolute top-6 left-1/2 transform -translate-x-1/2 whitespace-nowrap px-2 py-0.5 rounded-md bg-slate-950/85 backdrop-blur-md border border-slate-700/60 text-[10px] font-medium text-slate-200 shadow-md group-hover:border-cyan-400/50">
                      <span>{st.city}</span>
                      <span className="ml-1 text-cyan-400 font-mono">{st.temp}°</span>
                    </div>
                  </div>
                </button>
              );
            })}

            {/* Corner Map HUD Overlay */}
            <div className="absolute top-4 left-4 p-3 rounded-2xl glass-panel-subtle text-xs border border-slate-800 space-y-1 pointer-events-none">
              <span className="font-semibold text-cyan-300 block font-mono">
                AERIS SYNOPTIC RADAR
              </span>
              <span className="text-[11px] text-slate-400 block">
                Coverage: Western & Subcontinental Sector
              </span>
              <span className="text-[10px] text-emerald-400 font-mono flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                Stations Online: 8/8 Sync
              </span>
            </div>
          </div>
        </div>

        {/* Selected Station Detail Drawer / Card */}
        {selectedStation && (
          <div className="absolute bottom-4 right-4 sm:right-6 w-full max-w-sm z-40 p-5 rounded-3xl glass-panel border border-cyan-500/30 bg-slate-900/95 shadow-2xl backdrop-blur-xl animate-slideUp">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-white font-display">
                    {selectedStation.city}
                  </h3>
                  <span
                    className="px-2 py-0.5 rounded-full text-[10px] font-bold"
                    style={{
                      backgroundColor: `${selectedStation.riskColor}25`,
                      color: selectedStation.riskColor,
                      border: `1px solid ${selectedStation.riskColor}50`
                    }}
                  >
                    {selectedStation.risk} Risk
                  </span>
                </div>
                <p className="text-xs text-slate-400">{selectedStation.name} • {selectedStation.state}</p>
              </div>

              <button
                onClick={() => setSelectedStation(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Diagnostic Matrix */}
            <div className="grid grid-cols-2 gap-2.5 my-3">
              <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800">
                <span className="text-[10px] text-slate-400 block">Temperature</span>
                <span className="text-lg font-bold text-cyan-400 font-mono">
                  {selectedStation.temp}°C
                </span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800">
                <span className="text-[10px] text-slate-400 block">Rain Probability</span>
                <span className="text-lg font-bold text-cyan-300 font-mono">
                  {selectedStation.rainProb}%
                </span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800">
                <span className="text-[10px] text-slate-400 block">Wind Vector</span>
                <span className="text-xs font-semibold text-slate-200">
                  {selectedStation.windSpeed}
                </span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800">
                <span className="text-[10px] text-slate-400 block">Humidity</span>
                <span className="text-xs font-semibold text-slate-200">
                  {selectedStation.humidity}
                </span>
              </div>
            </div>

            {/* Meteorological Summary */}
            <div className="p-3 rounded-xl bg-slate-950/40 border border-slate-800/80 text-xs text-slate-300 mb-2">
              <span className="font-semibold text-cyan-300 block mb-0.5">Met Diagnostic:</span>
              {selectedStation.summary}
            </div>

            <div className="flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-800">
              <span>Pressure: {selectedStation.pressure}</span>
              <span>Air Quality: {selectedStation.aqi} AQI</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
