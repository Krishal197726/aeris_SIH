import React, { useEffect, useState } from 'react';
import { Mic, MicOff, X, Volume2, Sparkles, Radio } from 'lucide-react';
import { transcribeMockVoice } from '../../services/aiService';

export default function VoiceModal({ isOpen, onClose, onTranscriptionComplete }) {
  const [status, setStatus] = useState('listening'); // 'listening', 'processing', 'done'
  const [transcribedText, setTranscribedText] = useState('');
  const [audioBars, setAudioBars] = useState([30, 60, 45, 80, 55, 90, 70, 40, 85, 60, 75, 50]);

  useEffect(() => {
    if (!isOpen) {
      setStatus('listening');
      setTranscribedText('');
      return;
    }

    // Dynamic wave animation
    const interval = setInterval(() => {
      setAudioBars(bars => bars.map(() => Math.floor(20 + Math.random() * 75)));
    }, 120);

    // Mock speech recognition process
    let timer;
    const runTranscription = async () => {
      setStatus('listening');
      await new Promise(r => setTimeout(r, 2400));
      setStatus('processing');
      const text = await transcribeMockVoice();
      setTranscribedText(text);
      setStatus('done');
      
      timer = setTimeout(() => {
        onTranscriptionComplete(text);
        onClose();
      }, 1400);
    };

    runTranscription();

    return () => {
      clearInterval(interval);
      if (timer) clearTimeout(timer);
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-md rounded-3xl glass-panel p-6 border border-cyan-500/30 bg-slate-900/90 shadow-2xl text-center">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full text-slate-400 hover:text-white hover:bg-slate-800/60 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Pulsing Mic Circle */}
        <div className="relative my-6 flex items-center justify-center">
          <div className="absolute w-28 h-28 rounded-full bg-cyan-500/10 animate-ping" />
          <div className="absolute w-24 h-24 rounded-full bg-cyan-500/20 animate-pulse" />
          <div className="relative w-20 h-20 rounded-full bg-gradient-to-tr from-cyan-600 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/30">
            <Mic className="w-9 h-9 text-white animate-bounce" style={{ animationDuration: '2s' }} />
          </div>
        </div>

        {/* Status Text */}
        <div className="mb-6">
          <h3 className="text-xl font-bold font-display text-white mb-1">
            {status === 'listening' && 'Listening...'}
            {status === 'processing' && 'Processing Speech Dynamics...'}
            {status === 'done' && 'Voice Query Captured'}
          </h3>
          <p className="text-xs text-slate-400">
            {status === 'listening' && 'Speak your weather or climate question clearly'}
            {status === 'processing' && 'Converting acoustic phonemes to meteorological tokens'}
            {status === 'done' && 'Transferring to AERIS chat prompt...'}
          </p>
        </div>

        {/* Animated Waveform */}
        <div className="flex items-center justify-center gap-1.5 h-14 bg-slate-950/60 rounded-2xl p-3 border border-slate-800 mb-5">
          {audioBars.map((height, idx) => (
            <div
              key={idx}
              className="w-1.5 bg-gradient-to-t from-cyan-500 to-blue-400 rounded-full transition-all duration-100"
              style={{
                height: status === 'listening' ? `${height}%` : '15%',
                opacity: status === 'listening' ? 1 : 0.4
              }}
            />
          ))}
        </div>

        {/* Transcribed Output Preview */}
        {transcribedText && (
          <div className="p-3.5 rounded-xl bg-cyan-950/40 border border-cyan-500/30 text-xs font-mono text-cyan-200">
            "{transcribedText}"
          </div>
        )}
      </div>
    </div>
  );
}
