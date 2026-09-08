import React from 'react';
import { 
  Sparkles, 
  Layers, 
  CloudSun, 
  Eye, 
  AlertCircle, 
  CheckCircle2, 
  Info, 
  ShieldAlert,
  Cpu
} from 'lucide-react';

export default function VisualAnalysisCard({ analysisData }) {
  if (!analysisData) return null;

  const { fileName, imageUrl, analysis } = analysisData;

  return (
    <div className="mt-4 rounded-2xl glass-panel p-5 border border-cyan-500/30 max-w-2xl bg-slate-900/90 shadow-2xl backdrop-blur-xl">
      {/* Title Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-700/50">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-cyan-500/15 text-cyan-400 border border-cyan-500/30">
            <Cpu className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="font-semibold text-sm text-cyan-300 font-display">
                AI Visual Weather Analysis
              </h4>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
                Confidence {analysis.aiConfidence}
              </span>
            </div>
            <p className="text-xs text-slate-400">Target File: {fileName}</p>
          </div>
        </div>
      </div>

      {/* Image Preview & Quick Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 my-4">
        <div className="sm:col-span-5 relative rounded-xl overflow-hidden border border-slate-700/60 bg-slate-950 aspect-video sm:aspect-auto">
          <img
            src={imageUrl}
            alt="Weather analysis target"
            className="w-full h-full object-cover"
          />
          <div className="absolute top-2 left-2 px-2 py-0.5 rounded bg-black/70 backdrop-blur-md text-[10px] font-mono text-cyan-300 border border-cyan-500/30">
            MULTI-SPECTRAL OPTICAL
          </div>
        </div>

        <div className="sm:col-span-7 flex flex-col justify-between space-y-2">
          <div className="p-3 rounded-xl bg-slate-950/50 border border-slate-800">
            <span className="text-[11px] text-slate-400 block mb-0.5">Identified Cloud Classification</span>
            <div className="text-xs font-bold text-cyan-300 font-mono">
              {analysis.classification}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="p-2.5 rounded-xl bg-slate-950/40 border border-slate-800">
              <span className="text-[10px] text-slate-400 block">Sky Coverage</span>
              <span className="text-xs font-semibold text-slate-200">{analysis.cloudCoverage}</span>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-950/40 border border-slate-800">
              <span className="text-[10px] text-slate-400 block">Estimated Ceiling</span>
              <span className="text-xs font-semibold text-slate-200">{analysis.estimatedCeiling}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Precipitation & Hazards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
        <div className="p-3 rounded-xl bg-slate-950/40 border border-slate-800">
          <span className="text-[11px] text-slate-400 block mb-1">Precipitation Likelihood</span>
          <div className="text-lg font-bold text-cyan-400 font-mono">
            {analysis.precipitationLikelihood}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Vertical convective development active</p>
        </div>

        <div className="p-3 rounded-xl bg-slate-950/40 border border-slate-800">
          <span className="text-[11px] text-slate-400 block mb-1.5">Identified Microphysical Hazards</span>
          <ul className="space-y-1">
            {analysis.hazardsIdentified.map((h, i) => (
              <li key={i} className="text-xs text-amber-300 flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span>{h}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Crucial Scientific / Hackathon Disclaimer */}
      <div className="p-3.5 rounded-xl bg-cyan-950/20 border border-cyan-500/20 text-xs text-slate-300 leading-relaxed">
        <div className="flex items-start gap-2">
          <Info className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold text-cyan-300">Methodological Note: </span>
            {analysis.meteorologicalDisclaimer}
          </div>
        </div>
      </div>
    </div>
  );
}
