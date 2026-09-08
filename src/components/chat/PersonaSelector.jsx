import React from 'react';
import { usePersona } from '../../context/PersonaContext';
import { User, Sprout, ShieldAlert, Plane, Anchor, Microscope } from 'lucide-react';

const iconMap = {
  User,
  Sprout,
  ShieldAlert,
  Plane,
  Anchor,
  Microscope
};

export default function PersonaSelector() {
  const { currentPersona, setPersona, personas } = usePersona();

  return (
    <div className="w-full max-w-3xl mx-auto my-3">
      <div className="flex items-center justify-between gap-2 px-1 mb-2">
        <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
          <span>I'm using AERIS as:</span>
        </span>
        <span className="text-[10px] font-mono text-cyan-400 hidden sm:inline">
          {currentPersona.description}
        </span>
      </div>

      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
        {personas.map((p) => {
          const Icon = iconMap[p.icon] || User;
          const isSelected = currentPersona.id === p.id;
          return (
            <button
              key={p.id}
              type="button"
              onClick={() => setPersona(p.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium flex items-center gap-1.5 transition-all shrink-0 border ${
                isSelected
                  ? 'bg-cyan-500/20 text-cyan-300 border-cyan-400/50 shadow-md shadow-cyan-500/10'
                  : 'bg-slate-950/60 text-slate-400 hover:text-slate-200 border-slate-800/80 hover:border-slate-700'
              }`}
            >
              <Icon className="w-3.5 h-3.5" style={{ color: isSelected ? '#00e5ff' : undefined }} />
              <span>{p.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
