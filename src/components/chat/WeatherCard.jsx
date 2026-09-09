import React, { useState } from 'react';
import { 
  CloudRain, 
  Thermometer, 
  Wind, 
  AlertTriangle, 
  Volume2, 
  ChevronDown, 
  ChevronUp, 
  ShieldCheck, 
  Radio, 
  Clock, 
  Activity, 
  Sparkles,
  Layers,
  HelpCircle,
  Compass
} from 'lucide-react';
import { speakWeatherAdvisory } from '../../services/aiService';

export default function WeatherCard({ card, onFocusLocation }) {
  const [showWhyRisk, setShowWhyRisk] = useState(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);

  if (!card) return null;

  const handleSpeak = () => {
    const textToSpeak = `${card.location}. Precipitation probability is ${card.rainProb} percent. Temperature between ${card.tempRange}. Advisory: ${card.personaAdvisory?.recommendation || ''}`;
    speakWeatherAdvisory(textToSpeak);
    setIsPlayingAudio(true);
    setTimeout(() => setIsPlayingAudio(false), 5000);
  };

  return (
    <div className="mt-4 rounded-3xl glass-panel p-5 sm:p-6 border border-cyan-500/30 max-w-2xl bg-slate-950/85 shadow-2xl backdrop-blur-2xl">
      {/* 1. Header with Location & Audio Read-Aloud */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-800/80">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse"></span>
            <h3 className="text-base sm:text-lg font-bold font-display text-white tracking-wide">
              {card.location}
            </h3>
            {card.latitude != null && card.longitude != null && (
              <span className="inline-flex items-center gap-1 text-[11px] font-mono text-cyan-300/90 bg-cyan-950/60 border border-cyan-500/30 px-2 py-0.5 rounded-md shadow-sm">
                <Compass className="w-3 h-3 text-cyan-400" />
                {Math.abs(Number(card.latitude)).toFixed(4)}°{Number(card.latitude) >= 0 ? 'N' : 'S'}, {Math.abs(Number(card.longitude)).toFixed(4)}°{Number(card.longitude) >= 0 ? 'E' : 'W'}
              </span>
            )}
          </div>
          <p className="text-xs text-cyan-300/80 font-mono mt-0.5">
            Meteorological Intelligence Diagnostic
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Read Aloud Button */}
          <button
            type="button"
            onClick={handleSpeak}
            className={`p-2 rounded-xl border text-xs font-medium flex items-center gap-1.5 transition-all ${
              isPlayingAudio
                ? 'bg-cyan-500/20 text-cyan-300 border-cyan-400 animate-pulse'
                : 'bg-slate-900/80 text-slate-300 hover:text-white border-slate-700/80 hover:border-cyan-500/40'
            }`}
            title="Read Aloud Weather Advisory"
          >
            <Volume2 className="w-4 h-4 text-cyan-400" />
            <span className="hidden sm:inline">Listen</span>
          </button>
        </div>
      </div>

      {/* 2. Key Diagnostic Metrics Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 my-4">
        {/* Precipitation */}
        <div className="bg-slate-900/60 p-3 rounded-2xl border border-cyan-500/20">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span className="text-[11px] font-mono">🌧 Precip. Prob</span>
          </div>
          <div className="text-2xl font-bold font-mono text-cyan-300">{card.rainProb}%</div>
          <span className="text-[10px] text-cyan-400/80">Late Afternoon Peak</span>
        </div>

        {/* Temperature */}
        <div className="bg-slate-900/60 p-3 rounded-2xl border border-amber-500/20">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span className="text-[11px] font-mono">🌡 Temperature</span>
          </div>
          <div className="text-base sm:text-lg font-bold font-mono text-amber-300">{card.tempRange}</div>
          <span className="text-[10px] text-slate-400">Current: {card.currentTemp}</span>
        </div>

        {/* Wind */}
        <div className="bg-slate-900/60 p-3 rounded-2xl border border-blue-500/20">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span className="text-[11px] font-mono">💨 Wind Vector</span>
          </div>
          <div className="text-sm font-bold font-mono text-blue-300">{card.windSpeed}</div>
          <span className="text-[10px] text-slate-400">Humidity: {card.humidity}</span>
        </div>

        {/* Risk Level */}
        <div 
          className="bg-slate-900/60 p-3 rounded-2xl border transition-colors"
          style={{ borderColor: card.riskColor ? `${card.riskColor}40` : 'rgba(245, 158, 11, 0.3)' }}
        >
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span className="text-[11px] font-mono">⚠ Risk Level</span>
          </div>
          <div 
            className="text-sm font-bold font-mono"
            style={{ color: card.riskColor || '#f59e0b' }}
          >
            {card.riskLevel}
          </div>
          <span 
            className="text-[10px] block truncate"
            style={{ color: card.riskColor ? `${card.riskColor}cc` : 'rgba(245, 158, 11, 0.8)' }}
          >
            {card.riskLabel || (card.riskLevel === 'LOW RISK' ? 'Favorable Conditions' : card.riskLevel === 'SEVERE RISK' ? 'Severe Hazard' : card.riskLevel === 'HIGH RISK' ? 'Adverse Weather' : 'Caution Advised')}
          </span>
        </div>
      </div>

      {/* 3. Persona-Tailored Advisory Box */}
      {card.personaAdvisory && (
        <div className="p-4 rounded-2xl bg-cyan-950/25 border border-cyan-500/25 my-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-cyan-300 tracking-wider font-mono flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-cyan-400" />
              {card.personaAdvisory.title}
            </span>
          </div>

          <p className="text-xs sm:text-sm text-slate-200 leading-relaxed font-sans mb-3">
            {card.personaAdvisory.recommendation}
          </p>

          {/* Sub-Metrics if present */}
          {card.personaAdvisory.metrics && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-cyan-500/15">
              {card.personaAdvisory.metrics.map((m, idx) => (
                <div key={idx} className="bg-slate-900/50 p-2 rounded-xl text-center border border-slate-800">
                  <span className="text-[10px] text-slate-400 block">{m.label}</span>
                  <span className="text-xs font-mono font-bold text-cyan-300">{m.val}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 4. Interactive [Why this risk?] Diagnostic Button */}
      {card.whyThisRisk && (
        <div className="mt-3">
          <button
            type="button"
            onClick={() => setShowWhyRisk(!showWhyRisk)}
            className="w-full py-2 px-3 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-800 hover:border-cyan-500/30 text-xs font-medium text-cyan-300 flex items-center justify-between transition-all"
          >
            <span className="flex items-center gap-1.5 font-mono">
              <HelpCircle className="w-3.5 h-3.5 text-cyan-400" />
              [Why this risk? — Diagnostic Breakdown]
            </span>
            {showWhyRisk ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>

          {showWhyRisk && (
            <div className="mt-2 p-4 rounded-2xl bg-slate-950 border border-cyan-500/20 space-y-3 animate-fadeIn">
              <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider block">
                Atmospheric Dynamics & Quantitative Indicators:
              </span>

              <div className="space-y-2">
                {card.whyThisRisk.factors.map((f, i) => (
                  <div key={i} className="text-xs p-2.5 rounded-xl bg-slate-900/70 border border-slate-800">
                    <span className="font-bold text-cyan-300 block mb-0.5">• {f.title}</span>
                    <p className="text-slate-300 text-[11px] leading-relaxed pl-3">{f.detail}</p>
                  </div>
                ))}
              </div>

              <div className="flex flex-wrap items-center justify-between text-[10px] font-mono text-slate-500 pt-2 border-t border-slate-800">
                <span>NWP Models: {card.whyThisRisk.nwpModels?.join(' • ')}</span>
                <span>{card.whyThisRisk.timestamp}</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 5. Footer Metadata */}
      <div className="flex flex-wrap items-center justify-between pt-3 mt-3 border-t border-slate-800/80 text-[11px] text-slate-400 font-mono">
        <span className="flex items-center gap-1">
          <Radio className="w-3 h-3 text-cyan-400" /> Data: {card.source}
        </span>
        <span className="flex items-center gap-1">
          <Clock className="w-3 h-3 text-slate-500" /> Updated: {card.updated}
        </span>
      </div>
    </div>
  );
}
