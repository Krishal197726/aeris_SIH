import React, { useState, useRef } from 'react';
import { Upload, X, Image as ImageIcon, Sparkles, CloudRain, Satellite, Eye, ArrowRight } from 'lucide-react';

const PRESET_SAMPLES = [
  {
    id: 'cumulonimbus',
    name: 'Thunderstorm Cloud (Cumulonimbus)',
    type: 'Sky Photo',
    url: 'https://images.unsplash.com/photo-1534088568595-a066f410bcda?auto=format&fit=crop&w=800&q=80',
    description: 'Heavy vertical towering clouds over horizon'
  },
  {
    id: 'radar',
    name: 'Doppler Radar Reflectivity',
    type: 'Radar Scan',
    url: 'https://images.unsplash.com/photo-1590055531615-f16d36ffe8ec?auto=format&fit=crop&w=800&q=80',
    description: 'High dBZ precipitation echo over metropolitan zone'
  },
  {
    id: 'satellite',
    name: 'INSAT Satellite Infrared',
    type: 'Satellite Image',
    url: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=800&q=80',
    description: 'Oceanic low-pressure vortex band'
  }
];

export default function ImageUploadModal({ isOpen, onClose, onImageSelect }) {
  const [dragActive, setDragActive] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [fileName, setFileName] = useState('');
  const fileInputRef = useRef(null);

  if (!isOpen) return null;

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleFile = (file) => {
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreviewUrl(e.target.result);
    };
    reader.readAsDataURL(file);
  };

  const handlePresetSelect = (preset) => {
    setFileName(preset.name);
    setPreviewUrl(preset.url);
  };

  const handleSubmit = () => {
    if (!previewUrl) return;
    onImageSelect({
      url: previewUrl,
      name: fileName || 'weather_image_upload.jpg'
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md">
      <div className="relative w-full max-w-lg rounded-3xl glass-panel p-6 border border-cyan-500/30 bg-slate-900/95 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-cyan-500/15 text-cyan-400 border border-cyan-500/30">
              <ImageIcon className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white font-display">AI Visual Weather Analysis</h3>
              <p className="text-xs text-slate-400">Upload sky photos, cloud formations, satellite or radar scans</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-slate-800/60"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Upload Zone */}
        <div
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`my-4 border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all ${
            dragActive
              ? 'border-cyan-400 bg-cyan-950/30'
              : 'border-slate-700/80 hover:border-cyan-500/50 bg-slate-950/40'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => e.target.files && handleFile(e.target.files[0])}
          />

          {previewUrl ? (
            <div className="space-y-3">
              <img
                src={previewUrl}
                alt="Upload preview"
                className="max-h-44 mx-auto rounded-xl border border-slate-700 object-cover"
              />
              <p className="text-xs text-cyan-300 font-mono">{fileName}</p>
              <span className="text-[11px] text-slate-400">Click or drop to replace image</span>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="w-12 h-12 mx-auto rounded-2xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center border border-cyan-500/20">
                <Upload className="w-6 h-6" />
              </div>
              <p className="text-sm font-medium text-slate-200">
                Click to browse or drag & drop weather image
              </p>
              <p className="text-xs text-slate-500">
                Supports JPG, PNG, WEBP (Max 15MB)
              </p>
            </div>
          )}
        </div>

        {/* Demo Preset Samples for Fast Testing */}
        <div className="mb-5">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-2">
            Or select sample meteorological dataset:
          </span>
          <div className="grid grid-cols-3 gap-2">
            {PRESET_SAMPLES.map((preset) => (
              <button
                key={preset.id}
                type="button"
                onClick={() => handlePresetSelect(preset)}
                className="p-2 rounded-xl text-left bg-slate-950/50 hover:bg-slate-800/80 border border-slate-800/80 hover:border-cyan-500/30 transition-all text-xs group"
              >
                <span className="font-semibold text-slate-200 group-hover:text-cyan-300 block truncate">
                  {preset.name}
                </span>
                <span className="text-[10px] text-slate-500 block truncate">{preset.type}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={!previewUrl}
            onClick={handleSubmit}
            className="px-5 py-2.5 rounded-xl text-xs font-semibold bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-500/20 hover:from-cyan-400 hover:to-blue-500 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5 transition-all"
          >
            <span>Analyze Image</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
