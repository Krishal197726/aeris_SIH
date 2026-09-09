import React, { useState, useRef, useEffect } from 'react';
import EarthCanvas from '../components/earth/EarthCanvas';
import ChatInput from '../components/chat/ChatInput';
import WeatherCard from '../components/chat/WeatherCard';
import VisualAnalysisCard from '../components/chat/VisualAnalysisCard';
import VoiceModal from '../components/chat/VoiceModal';
import ImageUploadModal from '../components/chat/ImageUploadModal';
import { usePersona } from '../context/PersonaContext';
import { useChat } from '../context/ChatContext';
import {
  generateWeatherIntelligenceResponse,
  analyzeWeatherImage
} from '../services/aiService';
import { fetchLiveWeather } from '../services/weatherService';
import {
  extractLocationFromQuery
} from '../utils/geoUtils';
import {
  RefreshCw,
  Check,
  Copy,
  Compass
} from 'lucide-react';

export default function ChatPage() {
  const { currentPersona } = usePersona();
  const { activeChat, addMessageToChat } = useChat();
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [telemetryStatus, setTelemetryStatus] = useState('');
  const [focusTarget, setFocusTarget] = useState(null);
  const [isVoiceModalOpen, setIsVoiceModalOpen] = useState(false);
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState(null);
  const messagesEndRef = useRef(null);

  // Sync messages whenever the selected active chat changes
  useEffect(() => {
    if (activeChat && Array.isArray(activeChat.messages)) {
      setMessages(activeChat.messages);
    } else {
      setMessages([]);
    }
  }, [activeChat]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  // Main Natural-Language & Location-Aware Search Handler (Calls backend /api/chat)
  const handleSearch = async (text) => {
    if (!text.trim()) return;

    const userMessage = {
      id: `usr-${Date.now()}`,
      sender: 'user',
      text: text,
      timestamp: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
    };

    setMessages((prev) => [...prev, userMessage]);
    addMessageToChat(userMessage);
    setIsLoading(true);
    setTelemetryStatus('Connecting to AERIS AI Chat Gateway & Open-Meteo Telemetry...');

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message: text,
          persona: currentPersona.id,
          conversationId: activeChat?.id
        })
      });

      const data = await res.json();

      if (!res.ok || !data.success || data.error) {
        const errorMessageText = data.error?.message || 'Failed to retrieve AI weather intelligence response.';
        throw new Error(errorMessageText);
      }

      const aiPayload = data.response;

      // Synchronize 3D Earth camera position with resolved location
      if (aiPayload?.card?.latitude != null && aiPayload?.card?.longitude != null) {
        setFocusTarget({
          lat: Number(aiPayload.card.latitude),
          lng: Number(aiPayload.card.longitude),
          zoom: 1.95,
          name: aiPayload.card.location
        });
        setTelemetryStatus(`Focused 3D Earth on ${aiPayload.card.location}...`);
      } else if (aiPayload?.card?.location) {
        try {
          const liveGeo = await fetchLiveWeather(aiPayload.card.location);
          if (liveGeo?.location) {
            const { latitude, longitude, name, state } = liveGeo.location;
            setFocusTarget({
              lat: latitude,
              lng: longitude,
              zoom: 1.95,
              name: `${name}, ${state}`
            });
            setTelemetryStatus(`Focused 3D Earth on ${name}, ${state}...`);
          }
        } catch (_) {
          const detectedGeo = extractLocationFromQuery(text);
          if (detectedGeo) {
            setFocusTarget({
              lat: detectedGeo.lat,
              lng: detectedGeo.lng,
              zoom: 1.95,
              name: detectedGeo.name
            });
          }
        }
      }

      const botMessage = {
        id: `bot-${Date.now()}`,
        sender: 'aeris',
        text: aiPayload.text,
        card: aiPayload.card,
        sources: aiPayload.sources,
        timestamp: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
      };

      setMessages((prev) => [...prev, botMessage]);
      addMessageToChat(botMessage);
    } catch (error) {
      console.error('Error in AI weather chat query:', error);

      const errorMessage = {
        id: `bot-err-${Date.now()}`,
        sender: 'aeris',
        text: `⚠️ Weather Intelligence Query Error: ${error.message || 'Unable to retrieve weather data. Please try again.'}`,
        timestamp: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
      };
      setMessages((prev) => [...prev, errorMessage]);
      addMessageToChat(errorMessage);
    } finally {
      setIsLoading(false);
      setTelemetryStatus('');
    }
  };


  const handleImageAnalysis = async ({ url, name, prompt }) => {
    const userPrompt = prompt || `Analyze this weather image: ${name}`;
    const userMessage = {
      id: `usr-${Date.now()}`,
      sender: 'user',
      text: userPrompt,
      imageUrl: url,
      timestamp: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
    };

    setMessages((prev) => [...prev, userMessage]);
    addMessageToChat(userMessage);
    setIsLoading(true);

    try {
      const analysisResult = await analyzeWeatherImage(url, name);

      const botMessage = {
        id: `bot-${Date.now()}`,
        sender: 'aeris',
        text: `AI Visual Weather Analysis completed. Convective cloud signatures and Doppler radar reflectivity cross-checked with atmospheric soundings.`,
        visualAnalysis: analysisResult,
        timestamp: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
      };

      setMessages((prev) => [...prev, botMessage]);
      addMessageToChat(botMessage);
    } catch (error) {
      console.error('Error analyzing image:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyText = (text, index) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const isLandingView = messages.length === 0;

  return (
    <div className="relative w-full h-[calc(100vh-3.5rem)] overflow-hidden bg-[#020b08] flex flex-col justify-between">

      {/* 1. PHOTOREALISTIC THREE.JS 3D NASA EARTH BACKGROUND */}
      <div className="absolute inset-0 z-0">
        <EarthCanvas focusTarget={focusTarget} />
      </div>

      {/* 2. SUBTLE LOW-FADE GREEN SPACE VIGNETTE */}
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_center,rgba(4,24,18,0.08)_0%,rgba(3,18,14,0.28)_60%,rgba(1,8,6,0.65)_100%)]" />

      {/* MAIN VIEWPORT */}
      {isLandingView ? (
        /* ================= CLEAN LANDING VIEW ================= */
        <div className="relative z-10 flex-1 flex flex-col justify-between items-center px-4 sm:px-6 text-center max-w-2xl mx-auto w-full py-10 pointer-events-none">

          {/* Logo / Branding in the middle upper side */}
          <div className="pt-6 sm:pt-8 space-y-2 pointer-events-auto select-none flex flex-col items-center">
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-tr from-cyan-500/20 via-emerald-500/30 to-teal-500/20 border border-emerald-400/40 p-2.5 shadow-[0_0_30px_rgba(16,185,129,0.3)] backdrop-blur-xl mb-1">
              <img src="/logo.svg" alt="AERIS" className="w-full h-full object-contain filter drop-shadow" />
            </div>
            <h1 className="text-5xl sm:text-7xl font-black font-display tracking-tight text-white drop-shadow-[0_4px_25px_rgba(0,0,0,0.9)]">
              AERIS
            </h1>
            <p className="text-sm sm:text-lg text-emerald-400 font-bold tracking-widest uppercase font-mono drop-shadow-[0_2px_10px_rgba(16,185,129,0.4)]">
              AI Based Weather Intelligence
            </p>
          </div>

          {/* Search bar in the center as it was */}
          <div className="w-full my-auto pointer-events-auto">
            <ChatInput
              onSendMessage={handleSearch}
              onImageUpload={handleImageAnalysis}
              onOpenVoiceModal={() => setIsVoiceModalOpen(true)}
              onOpenImageModal={() => setIsImageModalOpen(true)}
              placeholder="Ask AERIS about any place, weather or climate..."
              isLoading={isLoading}
            />

            {/* Live Flight Telemetry Status */}
            {telemetryStatus && (
              <div className="inline-flex mt-4 px-4 py-1.5 rounded-full bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 text-xs font-mono items-center gap-2 animate-fadeIn backdrop-blur-md shadow-lg shadow-emerald-950/50">
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-emerald-400" />
                <span>{telemetryStatus}</span>
              </div>
            )}
          </div>

          {/* Bottom spacing anchor */}
          <div className="h-6" />
        </div>
      ) : (
        /* ================= ACTIVE WEATHER INTELLIGENCE VIEW ================= */
        <div className="relative z-10 flex-1 flex flex-col h-full overflow-hidden">

          {/* Top Active Telemetry Status Bar */}
          {telemetryStatus && (
            <div className="py-1.5 px-4 bg-emerald-950/60 border-b border-emerald-500/20 text-center text-xs font-mono text-emerald-300 flex items-center justify-center gap-2">
              <Compass className="w-3.5 h-3.5 text-emerald-400 animate-spin" />
              <span>{telemetryStatus}</span>
            </div>
          )}

          {/* Scrollable Conversation Thread */}
          <div className="flex-1 overflow-y-auto px-4 sm:px-8 py-6 space-y-6 max-w-4xl mx-auto w-full">
            {messages.map((msg, index) => (
              <div
                key={msg.id || index}
                className={`flex gap-3 sm:gap-4 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'
                  } animate-fadeIn`}
              >
                {/* Bot Avatar */}
                {msg.sender === 'aeris' && (
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-600 flex items-center justify-center p-1.5 shadow-md shadow-emerald-500/25 shrink-0 mt-0.5">
                    <img src="/logo.svg" alt="AERIS" className="w-full h-full object-contain" />
                  </div>
                )}

                {/* Message Content Container */}
                <div
                  className={`max-w-[85%] sm:max-w-2xl ${msg.sender === 'user'
                    ? 'bg-gradient-to-r from-emerald-600 to-teal-700 text-white rounded-3xl rounded-tr-sm p-4 shadow-lg shadow-emerald-600/20'
                    : 'text-slate-100'
                    }`}
                >
                  {/* User Uploaded Image Preview */}
                  {msg.imageUrl && (
                    <div className="mb-2 rounded-xl overflow-hidden max-w-xs border border-white/20">
                      <img src={msg.imageUrl} alt="Uploaded target" className="w-full h-auto object-cover" />
                    </div>
                  )}

                  {/* Text Message Body */}
                  <p className="text-sm sm:text-base leading-relaxed whitespace-pre-wrap font-sans">
                    {msg.text}
                  </p>

                  {/* Structured Rich Weather Card */}
                  {msg.card && <WeatherCard card={msg.card} />}

                  {/* AI Visual Weather Analysis Card */}
                  {msg.visualAnalysis && (
                    <VisualAnalysisCard analysisData={msg.visualAnalysis} />
                  )}

                  {/* Bot Actions Row */}
                  {msg.sender === 'aeris' && (
                    <div className="flex items-center gap-3 mt-2 text-[11px] text-slate-500 font-mono">
                      <span>{msg.timestamp}</span>
                      <button
                        onClick={() => handleCopyText(msg.text, index)}
                        className="hover:text-emerald-300 transition-colors flex items-center gap-1"
                      >
                        {copiedIndex === index ? (
                          <>
                            <Check className="w-3 h-3 text-emerald-400" />
                            <span className="text-emerald-400">Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3" />
                            <span>Copy</span>
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </div>

                {/* User Avatar */}
                {msg.sender === 'user' && (
                  <div className="w-8 h-8 rounded-full bg-[#f87171] text-white flex items-center justify-center text-xs font-bold shrink-0 mt-0.5 shadow-sm">
                    VL
                  </div>
                )}
              </div>
            ))}

            {/* AI Streaming Loading Indicator */}
            {isLoading && (
              <div className="flex gap-3 sm:gap-4 items-start">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-600 flex items-center justify-center p-1.5 shadow-md shadow-emerald-500/25 shrink-0 animate-pulse">
                  <img src="/logo.svg" alt="AERIS" className="w-full h-full object-contain" />
                </div>
                <div className="p-4 rounded-2xl bg-slate-900/85 border border-emerald-500/25 text-xs text-emerald-300 flex items-center gap-2">
                  <RefreshCw className="w-4 h-4 animate-spin text-emerald-400" />
                  <span>Computing WRF-3km moisture convergence & ensemble telemetry...</span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Persistent Floating Bottom Bar in Conversation Mode */}
          <div className="p-3 sm:p-4 bg-gradient-to-t from-[#020b08] via-[#020b08]/95 to-transparent">
            <ChatInput
              onSendMessage={handleSearch}
              onImageUpload={handleImageAnalysis}
              onOpenVoiceModal={() => setIsVoiceModalOpen(true)}
              onOpenImageModal={() => setIsImageModalOpen(true)}
              placeholder="Ask AERIS about any place, weather or climate..."
              isLoading={isLoading}
            />
          </div>
        </div>
      )}

      {/* Voice Assistant Modal */}
      <VoiceModal
        isOpen={isVoiceModalOpen}
        onClose={() => setIsVoiceModalOpen(false)}
        onTranscriptionComplete={(text) => handleSearch(text)}
      />

      {/* Image Upload Modal */}
      <ImageUploadModal
        isOpen={isImageModalOpen}
        onClose={() => setIsImageModalOpen(false)}
        onImageSelect={handleImageAnalysis}
      />
    </div>
  );
}
