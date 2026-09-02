import React from 'react';
import { CloudRain, AlertTriangle, Sprout, TrendingUp } from 'lucide-react';
import { PROMPT_SUGGESTIONS } from '../../data/mockWeather';

const iconMap = {
  CloudRain: CloudRain,
  AlertTriangle: AlertTriangle,
  Sprout: Sprout,
  TrendingUp: TrendingUp
};

export default function SuggestionChips({ onSelectPrompt }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 w-full max-w-3xl mx-auto mt-4">
      {PROMPT_SUGGESTIONS.map((item) => {
        const IconComponent = iconMap[item.icon] || CloudRain;
        return (
          <button
            key={item.id}
            onClick={() => onSelectPrompt(item.query)}
            className="group p-3 rounded-2xl glass-panel-subtle hover:glass-panel-active border border-slate-800 hover:border-cyan-500/40 text-left transition-all duration-200 flex flex-col justify-between"
          >
            <div className="flex items-center justify-between w-full mb-1.5">
              <span className="text-[10px] font-medium tracking-wider uppercase text-slate-500 group-hover:text-cyan-400 transition-colors font-mono">
                {item.category}
              </span>
              <IconComponent className="w-3.5 h-3.5 text-slate-400 group-hover:text-cyan-400 transition-colors" />
            </div>
            <span className="text-xs font-medium text-slate-200 group-hover:text-white transition-colors line-clamp-2">
              "{item.title}"
            </span>
          </button>
        );
      })}
    </div>
  );
}
