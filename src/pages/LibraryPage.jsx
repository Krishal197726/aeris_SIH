import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  BookOpen, 
  MessageSquare, 
  FileText, 
  LineChart, 
  Image as ImageIcon, 
  Download, 
  ExternalLink, 
  Clock, 
  Share2, 
  Trash2,
  Sparkles,
  CloudRain
} from 'lucide-react';
import { useChat } from '../context/ChatContext';

const MOCK_LIBRARY_DATA = {
  reports: [
    {
      id: 'lib-r1',
      title: 'Comprehensive Agronomic Weather Bulletin - August 2026',
      size: '2.4 MB',
      date: '2026-08-30',
      type: 'PDF Report',
      author: 'AERIS Agro-Meteorological Core'
    },
    {
      id: 'lib-r2',
      title: 'Western Subcontinent Flash Flood Risk Analysis',
      size: '4.8 MB',
      date: '2026-08-27',
      type: 'Technical Dossier',
      author: 'AERIS DeepMet Ensemble'
    },
    {
      id: 'lib-r3',
      title: 'Pre-Monsoon Thermal Stress & Livestock Safety Guide',
      size: '1.9 MB',
      date: '2026-08-15',
      type: 'Advisory Sheet',
      author: 'AERIS Disaster Management Cell'
    }
  ],
  insights: [
    {
      id: 'lib-i1',
      title: 'Monsoon Intra-Seasonal Oscillation (MISO) Phase 4 Assessment',
      category: 'Climate Teleconnections',
      confidence: '94% Ensemble Agreement',
      summary: 'Active Madden-Julian Oscillation pulse traversing the equatorial Indian Ocean is enhancing convective cloud formation over the Arabian Sea basin.',
      date: '2026-08-25'
    },
    {
      id: 'lib-i2',
      title: 'Urban Heat Island Microclimate Variance in Ahmedabad NCR',
      category: 'Urban Meteorology',
      confidence: '89% High Resolution',
      summary: 'Concrete core temperatures are running +3.4°C higher than surrounding rural agricultural peripheries during 14:00 peak solar irradiance.',
      date: '2026-08-20'
    }
  ],
  images: [
    {
      id: 'lib-m1',
      title: 'Severe Cumulonimbus Wall Cloud Formation',
      url: 'https://images.unsplash.com/photo-1534088568595-a066f410bcda?auto=format&fit=crop&w=600&q=80',
      date: '2026-09-01',
      classification: 'Mesoscale Convective System (MCS)'
    },
    {
      id: 'lib-m2',
      title: 'Doppler Radar Precipitation Reflectivity Scan',
      url: 'https://images.unsplash.com/photo-1590055531615-f16d36ffe8ec?auto=format&fit=crop&w=600&q=80',
      date: '2026-08-29',
      classification: 'Radar High dBZ Cloudburst Echo'
    },
    {
      id: 'lib-m3',
      title: 'INSAT Multi-Spectral Infrared Loop',
      url: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=600&q=80',
      date: '2026-08-22',
      classification: 'Oceanic Low Pressure System'
    }
  ]
};

export default function LibraryPage() {
  const navigate = useNavigate();
  const { chats, selectChat, deleteChat } = useChat();
  const [activeTab, setActiveTab] = useState('chats'); // chats, reports, insights, images

  const handleOpenChat = (chatId) => {
    selectChat(chatId);
    navigate('/chat');
  };

  return (
    <div className="relative w-full h-[calc(100vh-3.5rem)] overflow-y-auto bg-[#040711] p-4 sm:p-8">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header Title */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-800">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-950/50 border border-cyan-500/30 text-cyan-300 text-xs font-mono mb-2">
              <BookOpen className="w-3.5 h-3.5 text-cyan-400" />
              <span>SAVED INTELLIGENCE REPOSITORY</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold font-display text-white">
              Library & Saved Dossiers
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              Access bookmarked AI conversations, generated meteorological bulletins, climate insights, and analyzed images.
            </p>
          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-slate-900 border border-slate-800 self-start md:self-auto overflow-x-auto">
            <button
              onClick={() => setActiveTab('chats')}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium flex items-center gap-1.5 transition-all ${
                activeTab === 'chats'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>Saved Chats</span>
            </button>
            <button
              onClick={() => setActiveTab('reports')}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium flex items-center gap-1.5 transition-all ${
                activeTab === 'reports'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Weather Reports</span>
            </button>
            <button
              onClick={() => setActiveTab('insights')}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium flex items-center gap-1.5 transition-all ${
                activeTab === 'insights'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <LineChart className="w-3.5 h-3.5" />
              <span>Climate Insights</span>
            </button>
            <button
              onClick={() => setActiveTab('images')}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium flex items-center gap-1.5 transition-all ${
                activeTab === 'images'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <ImageIcon className="w-3.5 h-3.5" />
              <span>Weather Images</span>
            </button>
          </div>
        </div>

        {/* Tab 1: Saved Chats */}
        {activeTab === 'chats' && (
          <div className="space-y-3">
            {chats.length === 0 ? (
              <div className="p-8 rounded-2xl glass-panel bg-slate-900/50 border border-slate-800 text-center space-y-2">
                <MessageSquare className="w-8 h-8 text-cyan-400/50 mx-auto" />
                <h3 className="text-base font-semibold text-slate-200">No Saved Chats Yet</h3>
                <p className="text-xs text-slate-400 max-w-sm mx-auto">
                  Start a conversation in Chat, and your real atmospheric queries will automatically be saved and accessible here.
                </p>
                <button
                  onClick={() => navigate('/chat')}
                  className="mt-3 px-4 py-2 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 text-xs font-semibold border border-cyan-500/40 transition-all cursor-pointer inline-flex items-center gap-1.5"
                >
                  <span>Go to Chat</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              chats.map((chat) => {
                const firstUserMsg = chat.messages?.find(m => m.sender === 'user')?.text || chat.title;
                const lastBotMsg = chat.messages?.filter(m => m.sender === 'aeris')?.slice(-1)[0]?.text || 'No response yet';
                const dateFormatted = new Date(chat.updatedAt || chat.createdAt).toLocaleDateString('en-IN', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric'
                });

                return (
                  <div
                    key={chat.id}
                    className="p-5 rounded-2xl glass-panel bg-slate-900/70 border border-slate-800 hover:border-cyan-500/30 transition-all group shadow-md"
                  >
                    <div className="flex items-center justify-between pb-2">
                      <h3 className="font-bold text-sm sm:text-base text-slate-100 group-hover:text-cyan-300 transition-colors">
                        {chat.title}
                      </h3>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono text-slate-500">{dateFormatted}</span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteChat(chat.id);
                          }}
                          className="p-1 rounded-md text-slate-500 hover:text-red-400 hover:bg-red-950/30 transition-all cursor-pointer"
                          title="Delete chat"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                    <p className="text-xs text-slate-400 mb-3 line-clamp-2 leading-relaxed">
                      {lastBotMsg}
                    </p>
                    <div className="flex items-center justify-between pt-2 border-t border-slate-800/60 text-xs">
                      <span className="text-[11px] font-mono text-slate-500">
                        {chat.messages?.length || 0} messages
                      </span>
                      <button
                        onClick={() => handleOpenChat(chat.id)}
                        className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1 font-medium cursor-pointer"
                      >
                        <span>Open in Chat</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* Tab 2: Weather Reports */}
        {activeTab === 'reports' && (
          <div className="space-y-3">
            {MOCK_LIBRARY_DATA.reports.map((report) => (
              <div
                key={report.id}
                className="p-5 rounded-2xl glass-panel bg-slate-900/70 border border-slate-800 hover:border-cyan-500/30 transition-all flex items-center justify-between gap-4"
              >
                <div className="flex items-center gap-3.5">
                  <div className="p-3 rounded-2xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-slate-100">{report.title}</h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {report.author} • {report.size} • Published: {report.date}
                    </p>
                  </div>
                </div>
                <button className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium flex items-center gap-1.5 transition-colors border border-slate-700">
                  <Download className="w-3.5 h-3.5 text-cyan-400" />
                  <span className="hidden sm:inline">Export PDF</span>
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Tab 3: Climate Insights */}
        {activeTab === 'insights' && (
          <div className="space-y-3">
            {MOCK_LIBRARY_DATA.insights.map((insight) => (
              <div
                key={insight.id}
                className="p-5 rounded-2xl glass-panel bg-slate-900/70 border border-slate-800"
              >
                <div className="flex items-center justify-between pb-2">
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">
                    {insight.category}
                  </span>
                  <span className="text-xs font-mono text-slate-500">{insight.date}</span>
                </div>
                <h3 className="font-bold text-sm text-slate-100 my-1">{insight.title}</h3>
                <p className="text-xs text-slate-400 leading-relaxed">{insight.summary}</p>
              </div>
            ))}
          </div>
        )}

        {/* Tab 4: Weather Images */}
        {activeTab === 'images' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {MOCK_LIBRARY_DATA.images.map((img) => (
              <div
                key={img.id}
                className="rounded-2xl glass-panel bg-slate-900/80 border border-slate-800 overflow-hidden group shadow-lg"
              >
                <div className="h-44 overflow-hidden relative">
                  <img
                    src={img.url}
                    alt={img.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent opacity-80" />
                  <span className="absolute bottom-2 left-3 text-[10px] font-mono text-cyan-300 bg-slate-950/80 px-2 py-0.5 rounded border border-cyan-500/30">
                    {img.date}
                  </span>
                </div>
                <div className="p-4">
                  <h4 className="font-bold text-xs text-slate-100 mb-1">{img.title}</h4>
                  <p className="text-[11px] text-slate-400">{img.classification}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
