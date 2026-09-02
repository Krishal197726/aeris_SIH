import React, { useState } from 'react';
import { 
  Settings as SettingsIcon, 
  Globe, 
  Moon, 
  Sun, 
  Mic, 
  MapPin, 
  Bell, 
  Check, 
  Save, 
  ShieldCheck, 
  Sliders,
  Sparkles
} from 'lucide-react';

export default function SettingsPage() {
  const [language, setLanguage] = useState('English');
  const [appearance, setAppearance] = useState('Dark Space');
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [currentLocation, setCurrentLocation] = useState('Ahmedabad, Gujarat (23.02° N, 72.57° E)');
  const [weatherAlerts, setWeatherAlerts] = useState(true);
  const [extremeWeatherAlerts, setExtremeWeatherAlerts] = useState(true);
  const [savedStatus, setSavedStatus] = useState(false);

  const handleSave = () => {
    setSavedStatus(true);
    setTimeout(() => setSavedStatus(false), 2500);
  };

  return (
    <div className="relative w-full h-[calc(100vh-3.5rem)] overflow-y-auto bg-[#040711] p-4 sm:p-8">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Header Title */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-950/50 border border-cyan-500/30 text-cyan-300 text-xs font-mono mb-2">
              <SettingsIcon className="w-3.5 h-3.5 text-cyan-400" />
              <span>AERIS CONFIGURATION</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold font-display text-white">
              System Settings
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              Customize language preferences, voice parameters, default geo-coordinates, and early alert triggers.
            </p>
          </div>

          <button
            onClick={handleSave}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white text-xs font-semibold flex items-center gap-2 shadow-lg shadow-cyan-500/20 hover:from-cyan-400 hover:to-blue-500 transition-all self-start sm:self-auto"
          >
            {savedStatus ? (
              <>
                <Check className="w-4 h-4 text-white" />
                <span>Saved Changes</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>Save Preferences</span>
              </>
            )}
          </button>
        </div>

        {/* Setting Card 1: Language */}
        <div className="p-5 sm:p-6 rounded-3xl glass-panel bg-slate-900/80 border border-slate-800 shadow-xl space-y-3">
          <div className="flex items-center gap-2.5 text-slate-200 font-bold text-sm">
            <Globe className="w-4 h-4 text-cyan-400" />
            <span>Language / भाषा / ભાષા</span>
          </div>
          <p className="text-xs text-slate-400">
            Select the primary language for conversational weather intelligence responses and agronomic advisories.
          </p>

          <div className="grid grid-cols-3 gap-3 pt-2">
            {[
              { id: 'English', label: 'English', sub: 'Standard' },
              { id: 'Hindi', label: 'हिन्दी (Hindi)', sub: 'देवनागरी' },
              { id: 'Gujarati', label: 'ગુજરાતી (Gujarati)', sub: 'ગુજરાતી લિપિ' }
            ].map((lang) => (
              <button
                key={lang.id}
                type="button"
                onClick={() => setLanguage(lang.id)}
                className={`p-3 rounded-2xl text-left transition-all border ${
                  language === lang.id
                    ? 'bg-cyan-500/15 border-cyan-500/40 text-cyan-300 shadow-md'
                    : 'bg-slate-950/50 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div className="font-semibold text-xs text-white">{lang.label}</div>
                <div className="text-[10px] text-slate-500">{lang.sub}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Setting Card 2: Appearance */}
        <div className="p-5 sm:p-6 rounded-3xl glass-panel bg-slate-900/80 border border-slate-800 shadow-xl space-y-3">
          <div className="flex items-center gap-2.5 text-slate-200 font-bold text-sm">
            <Moon className="w-4 h-4 text-cyan-400" />
            <span>Appearance & Visual Theme</span>
          </div>
          <p className="text-xs text-slate-400">
            Control the visual contrast and 3D space atmosphere aesthetic.
          </p>

          <div className="grid grid-cols-2 gap-3 pt-2">
            <button
              type="button"
              onClick={() => setAppearance('Dark Space')}
              className={`p-3.5 rounded-2xl text-left transition-all border flex items-center gap-3 ${
                appearance === 'Dark Space'
                  ? 'bg-cyan-500/15 border-cyan-500/40 text-cyan-300 shadow-md'
                  : 'bg-slate-950/50 border-slate-800 text-slate-400'
              }`}
            >
              <Moon className="w-5 h-5 text-cyan-400" />
              <div>
                <span className="font-bold text-xs text-white block">Dark Space (Recommended)</span>
                <span className="text-[10px] text-slate-500">Photorealistic 3D Earth glow theme</span>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setAppearance('Light High Contrast')}
              className={`p-3.5 rounded-2xl text-left transition-all border flex items-center gap-3 ${
                appearance === 'Light High Contrast'
                  ? 'bg-cyan-500/15 border-cyan-500/40 text-cyan-300 shadow-md'
                  : 'bg-slate-950/50 border-slate-800 text-slate-400'
              }`}
            >
              <Sun className="w-5 h-5 text-amber-400" />
              <div>
                <span className="font-bold text-xs text-white block">High Contrast Field</span>
                <span className="text-[10px] text-slate-500">Enhanced daylight legibility</span>
              </div>
            </button>
          </div>
        </div>

        {/* Setting Card 3: Voice & Speech */}
        <div className="p-5 sm:p-6 rounded-3xl glass-panel bg-slate-900/80 border border-slate-800 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5 text-slate-200 font-bold text-sm">
              <Mic className="w-4 h-4 text-cyan-400" />
              <span>Voice Interface & Acoustic Synthesis</span>
            </div>
            <button
              type="button"
              onClick={() => setVoiceEnabled(!voiceEnabled)}
              className={`w-12 h-6 rounded-full transition-colors relative p-0.5 ${
                voiceEnabled ? 'bg-cyan-500' : 'bg-slate-800'
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full bg-white transition-transform ${
                  voiceEnabled ? 'translate-x-6' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
          <p className="text-xs text-slate-400">
            Enable hands-free voice questioning and speech waveform recognition.
          </p>
        </div>

        {/* Setting Card 4: Location */}
        <div className="p-5 sm:p-6 rounded-3xl glass-panel bg-slate-900/80 border border-slate-800 shadow-xl space-y-3">
          <div className="flex items-center gap-2.5 text-slate-200 font-bold text-sm">
            <MapPin className="w-4 h-4 text-cyan-400" />
            <span>Default Meteorological Location</span>
          </div>
          <p className="text-xs text-slate-400">
            Set default radar bounding box for instant rain forecasts and local alerts.
          </p>

          <div className="flex gap-2">
            <input
              type="text"
              value={currentLocation}
              onChange={(e) => setCurrentLocation(e.target.value)}
              className="flex-1 px-4 py-2.5 rounded-xl bg-slate-950/80 border border-slate-800 text-xs text-slate-200 font-mono focus:outline-none focus:border-cyan-500/40"
            />
            <button
              onClick={() => setCurrentLocation('Ahmedabad, Gujarat (23.02° N, 72.57° E)')}
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-300 border border-slate-700"
            >
              Use GPS Current
            </button>
          </div>
        </div>

        {/* Setting Card 5: Notifications */}
        <div className="p-5 sm:p-6 rounded-3xl glass-panel bg-slate-900/80 border border-slate-800 shadow-xl space-y-4">
          <div className="flex items-center gap-2.5 text-slate-200 font-bold text-sm">
            <Bell className="w-4 h-4 text-cyan-400" />
            <span>Notification & Early Warning Broadcasts</span>
          </div>

          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-950/40 border border-slate-800/80">
              <div>
                <span className="font-semibold text-xs text-slate-200 block">Weather Alerts</span>
                <span className="text-[11px] text-slate-500">Daily forecast updates & precipitation reminders</span>
              </div>
              <input
                type="checkbox"
                checked={weatherAlerts}
                onChange={(e) => setWeatherAlerts(e.target.checked)}
                className="w-4 h-4 rounded text-cyan-500 focus:ring-0 bg-slate-900 border-slate-700"
              />
            </div>

            <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-950/40 border border-slate-800/80">
              <div>
                <span className="font-semibold text-xs text-red-300 block">Extreme-Weather Alerts (Emergency)</span>
                <span className="text-[11px] text-slate-500">Instant red alerts for cyclones, flash floods, and gale storms</span>
              </div>
              <input
                type="checkbox"
                checked={extremeWeatherAlerts}
                onChange={(e) => setExtremeWeatherAlerts(e.target.checked)}
                className="w-4 h-4 rounded text-red-500 focus:ring-0 bg-slate-900 border-slate-700"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
