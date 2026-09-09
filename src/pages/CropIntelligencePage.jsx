import React, { useState, useEffect } from 'react';
import { 
  Sprout, 
  Droplets, 
  Bug, 
  Sparkles, 
  BrainCircuit, 
  Thermometer, 
  CloudRain, 
  Compass, 
  AlertTriangle, 
  CheckCircle2, 
  Activity, 
  Layers, 
  ArrowRight, 
  RefreshCw, 
  ShieldCheck, 
  Info,
  Sliders,
  ChevronRight,
  TrendingUp,
  MapPin,
  Calendar,
  Atom,
  Flame,
  Zap,
  Send
} from 'lucide-react';
import { 
  fetchCropsList, 
  fetchCropDetail, 
  getCropRecommendations, 
  evaluateDiseaseRisk, 
  getIrrigationAdvisory, 
  runOpenRouterAgriAnalysis 
} from '../services/cropService';

export default function CropIntelligencePage() {
  const [activeTab, setActiveTab] = useState('recommend'); // 'recommend' | 'disease' | 'irrigation' | 'ai_synthesis'
  const [cropsList, setCropsList] = useState([]);
  const [selectedCropId, setSelectedCropId] = useState('cotton');
  const [selectedCropDetail, setSelectedCropDetail] = useState(null);
  
  // Soil and Location Inputs
  const [locationName, setLocationName] = useState('Ahmedabad, Gujarat');
  const [nitrogen, setNitrogen] = useState(85);
  const [phosphorus, setPhosphorus] = useState(48);
  const [potassium, setPotassium] = useState(55);
  const [ph, setPh] = useState(7.2);
  const [soilType, setSoilType] = useState('Black Soil (Regur)');
  const [season, setSeason] = useState('Kharif');
  
  // Model state
  const [recommendations, setRecommendations] = useState(null);
  const [diseaseAssessment, setDiseaseAssessment] = useState(null);
  const [irrigationAdvisory, setIrrigationAdvisory] = useState(null);
  const [aiReport, setAiReport] = useState(null);
  const [customAiQuery, setCustomAiQuery] = useState('');
  
  // Loading states
  const [loadingRec, setLoadingRec] = useState(false);
  const [loadingDisease, setLoadingDisease] = useState(false);
  const [loadingIrrigation, setLoadingIrrigation] = useState(false);
  const [loadingAi, setLoadingAi] = useState(false);

  // Load initial crops list
  useEffect(() => {
    fetchCropsList()
      .then(res => {
        if (res.success && res.crops) {
          setCropsList(res.crops);
        }
      })
      .catch(e => console.error(e));
  }, []);

  // Fetch crop detail when selectedCropId changes
  useEffect(() => {
    if (selectedCropId) {
      fetchCropDetail(selectedCropId)
        .then(res => {
          if (res.success) setSelectedCropDetail(res.crop);
        })
        .catch(e => console.error(e));
    }
  }, [selectedCropId]);

  // Run initial models on mount
  useEffect(() => {
    handleRunRecommendation();
    handleRunDiseaseCheck(selectedCropId);
    handleRunIrrigationCheck(selectedCropId);
  }, []);

  const handleRunRecommendation = async () => {
    setLoadingRec(true);
    try {
      const res = await getCropRecommendations({
        nitrogen: Number(nitrogen),
        phosphorus: Number(phosphorus),
        potassium: Number(potassium),
        ph: Number(ph),
        soilType,
        season,
        location: { name: locationName }
      });
      if (res.success) {
        setRecommendations(res);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingRec(false);
    }
  };

  const handleRunDiseaseCheck = async (cropIdToUse = selectedCropId) => {
    setLoadingDisease(true);
    try {
      const res = await evaluateDiseaseRisk({
        cropId: cropIdToUse,
        location: { name: locationName }
      });
      if (res.success) {
        setDiseaseAssessment(res.assessment);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingDisease(false);
    }
  };

  const handleRunIrrigationCheck = async (cropIdToUse = selectedCropId) => {
    setLoadingIrrigation(true);
    try {
      const res = await getIrrigationAdvisory({
        cropId: cropIdToUse,
        stageIndex: 2,
        location: { name: locationName }
      });
      if (res.success) {
        setIrrigationAdvisory(res.advisory);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingIrrigation(false);
    }
  };

  const handleRunAiAnalysis = async () => {
    setLoadingAi(true);
    try {
      const res = await runOpenRouterAgriAnalysis({
        cropId: selectedCropId,
        location: { name: locationName },
        soil: {
          nitrogen: Number(nitrogen),
          phosphorus: Number(phosphorus),
          potassium: Number(potassium),
          ph: Number(ph),
          soilType
        },
        customQuery: customAiQuery
      });
      if (res.success) {
        setAiReport(res);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingAi(false);
    }
  };

  return (
    <div className="min-h-full w-full flex flex-col bg-[#050811] text-slate-100 pb-16">
      {/* 1. HERO HEADER */}
      <div className="relative border-b border-slate-800/80 bg-slate-950/70 backdrop-blur-xl px-4 sm:px-8 py-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5 mb-1.5">
              <span className="p-2 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400">
                <Sprout className="w-5 h-5" />
              </span>
              <span className="text-xs font-mono font-medium tracking-wider uppercase text-emerald-400">
                Agro-Meteorological Machine Learning Engine
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold font-display tracking-tight text-white flex items-center gap-3">
              Crop Intelligence System
              <span className="text-xs font-mono font-medium px-2.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                OpenRouter AI Enabled
              </span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-2xl">
              Precision farming decision matrices: multi-variable crop suitability models, real-time pest/fungal risk radar, FAO-56 evapotranspiration irrigation schedulers, and OpenRouter AI agronomy synthesis.
            </p>
          </div>

          {/* Quick Location & Target Crop Bar */}
          <div className="flex flex-wrap items-center gap-2 bg-slate-900/80 p-2 rounded-2xl border border-slate-800 shrink-0">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800/80 text-xs">
              <MapPin className="w-3.5 h-3.5 text-emerald-400" />
              <input
                type="text"
                value={locationName}
                onChange={(e) => setLocationName(e.target.value)}
                placeholder="Enter city..."
                className="bg-transparent text-slate-200 outline-none w-36 text-xs font-medium"
              />
            </div>

            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800/80 text-xs">
              <Sprout className="w-3.5 h-3.5 text-cyan-400" />
              <select
                value={selectedCropId}
                onChange={(e) => {
                  const newId = e.target.value;
                  setSelectedCropId(newId);
                  handleRunDiseaseCheck(newId);
                  handleRunIrrigationCheck(newId);
                }}
                className="bg-transparent text-slate-200 outline-none text-xs font-medium cursor-pointer"
              >
                {cropsList.map((c) => (
                  <option key={c.id} value={c.id} className="bg-slate-900 text-slate-100">
                    {c.cropName} ({c.season})
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* 2. NAVIGATION TABS */}
      <div className="max-w-7xl w-full mx-auto px-4 sm:px-8 mt-6">
        <div className="flex items-center gap-2 border-b border-slate-800 pb-3 overflow-x-auto scrollbar-none">
          <button
            onClick={() => setActiveTab('recommend')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold flex items-center gap-2 transition-all cursor-pointer shrink-0 border ${
              activeTab === 'recommend'
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-400/50 shadow-md shadow-emerald-500/10'
                : 'bg-slate-900/60 text-slate-400 hover:text-slate-200 border-slate-800 hover:border-slate-700'
            }`}
          >
            <BrainCircuit className="w-4 h-4 text-emerald-400" />
            <span>1. Crop Recommendation ML</span>
          </button>

          <button
            onClick={() => setActiveTab('disease')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold flex items-center gap-2 transition-all cursor-pointer shrink-0 border ${
              activeTab === 'disease'
                ? 'bg-amber-500/20 text-amber-300 border-amber-400/50 shadow-md shadow-amber-500/10'
                : 'bg-slate-900/60 text-slate-400 hover:text-slate-200 border-slate-800 hover:border-slate-700'
            }`}
          >
            <Bug className="w-4 h-4 text-amber-400" />
            <span>2. Disease & Pest Risk Radar</span>
          </button>

          <button
            onClick={() => setActiveTab('irrigation')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold flex items-center gap-2 transition-all cursor-pointer shrink-0 border ${
              activeTab === 'irrigation'
                ? 'bg-blue-500/20 text-blue-300 border-blue-400/50 shadow-md shadow-blue-500/10'
                : 'bg-slate-900/60 text-slate-400 hover:text-slate-200 border-slate-800 hover:border-slate-700'
            }`}
          >
            <Droplets className="w-4 h-4 text-blue-400" />
            <span>3. Smart Irrigation & ETc</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('ai_synthesis');
              if (!aiReport) handleRunAiAnalysis();
            }}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold flex items-center gap-2 transition-all cursor-pointer shrink-0 border ${
              activeTab === 'ai_synthesis'
                ? 'bg-gradient-to-r from-cyan-500/20 to-emerald-500/20 text-cyan-300 border-cyan-400/50 shadow-md shadow-cyan-500/10'
                : 'bg-slate-900/60 text-slate-400 hover:text-slate-200 border-slate-800 hover:border-slate-700'
            }`}
          >
            <Sparkles className="w-4 h-4 text-cyan-400" />
            <span>4. OpenRouter Agri-AI Synthesizer</span>
          </button>
        </div>
      </div>

      {/* 3. TAB CONTENTS */}
      <div className="max-w-7xl w-full mx-auto px-4 sm:px-8 mt-6">
        {/* =========================================================================
         * TAB 1: CROP RECOMMENDATION ML MODEL
         * ========================================================================= */}
        {activeTab === 'recommend' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Column: Soil & Environmental Inputs */}
            <div className="lg:col-span-4 space-y-4">
              <div className="p-5 rounded-3xl bg-slate-900/70 border border-slate-800 backdrop-blur-xl shadow-xl">
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <div className="flex items-center gap-2">
                    <Sliders className="w-4 h-4 text-emerald-400" />
                    <h3 className="text-sm font-bold text-white font-display">Soil & Agronomic Parameters</h3>
                  </div>
                  <span className="text-[10px] font-mono text-emerald-400">ML Vector</span>
                </div>

                <div className="space-y-4 mt-4 text-xs">
                  {/* Nitrogen (N) */}
                  <div>
                    <div className="flex justify-between text-slate-300 mb-1">
                      <span>Nitrogen (N)</span>
                      <span className="font-mono text-emerald-400 font-bold">{nitrogen} kg/ha</span>
                    </div>
                    <input
                      type="range"
                      min="20"
                      max="200"
                      value={nitrogen}
                      onChange={(e) => setNitrogen(e.target.value)}
                      className="w-full accent-emerald-500 bg-slate-800 rounded-lg cursor-pointer"
                    />
                  </div>

                  {/* Phosphorus (P) */}
                  <div>
                    <div className="flex justify-between text-slate-300 mb-1">
                      <span>Phosphorus (P)</span>
                      <span className="font-mono text-emerald-400 font-bold">{phosphorus} kg/ha</span>
                    </div>
                    <input
                      type="range"
                      min="10"
                      max="120"
                      value={phosphorus}
                      onChange={(e) => setPhosphorus(e.target.value)}
                      className="w-full accent-emerald-500 bg-slate-800 rounded-lg cursor-pointer"
                    />
                  </div>

                  {/* Potassium (K) */}
                  <div>
                    <div className="flex justify-between text-slate-300 mb-1">
                      <span>Potassium (K)</span>
                      <span className="font-mono text-emerald-400 font-bold">{potassium} kg/ha</span>
                    </div>
                    <input
                      type="range"
                      min="10"
                      max="150"
                      value={potassium}
                      onChange={(e) => setPotassium(e.target.value)}
                      className="w-full accent-emerald-500 bg-slate-800 rounded-lg cursor-pointer"
                    />
                  </div>

                  {/* Soil pH */}
                  <div>
                    <div className="flex justify-between text-slate-300 mb-1">
                      <span>Soil pH Level</span>
                      <span className="font-mono text-cyan-400 font-bold">{ph}</span>
                    </div>
                    <input
                      type="range"
                      min="4.5"
                      max="9.0"
                      step="0.1"
                      value={ph}
                      onChange={(e) => setPh(e.target.value)}
                      className="w-full accent-cyan-500 bg-slate-800 rounded-lg cursor-pointer"
                    />
                    <div className="flex justify-between text-[10px] text-slate-500 mt-0.5 font-mono">
                      <span>Acidic (4.5)</span>
                      <span>Neutral (7.0)</span>
                      <span>Alkaline (9.0)</span>
                    </div>
                  </div>

                  {/* Soil Type */}
                  <div>
                    <label className="block text-slate-300 mb-1">Soil Classification</label>
                    <select
                      value={soilType}
                      onChange={(e) => setSoilType(e.target.value)}
                      className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 outline-none"
                    >
                      <option value="Black Soil (Regur)">Black Soil (Regur / Clayey)</option>
                      <option value="Alluvial Loam">Alluvial Loam (Indo-Gangetic / Coastal)</option>
                      <option value="Red Loam">Red & Yellow Loam</option>
                      <option value="Sandy Loam">Sandy Loam (Light / Well-drained)</option>
                      <option value="Clay Loam">Clay Loam</option>
                    </select>
                  </div>

                  {/* Target Season */}
                  <div>
                    <label className="block text-slate-300 mb-1">Cropping Season</label>
                    <select
                      value={season}
                      onChange={(e) => setSeason(e.target.value)}
                      className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 outline-none"
                    >
                      <option value="Kharif">Kharif (Monsoon / Summer: Jun - Oct)</option>
                      <option value="Rabi">Rabi (Winter: Oct - Mar)</option>
                      <option value="Zaid">Zaid (Summer: Mar - Jun)</option>
                    </select>
                  </div>

                  <button
                    type="button"
                    onClick={handleRunRecommendation}
                    disabled={loadingRec}
                    className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20 cursor-pointer disabled:opacity-50"
                  >
                    {loadingRec ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>Evaluating ML Decision Matrix...</span>
                      </>
                    ) : (
                      <>
                        <BrainCircuit className="w-3.5 h-3.5" />
                        <span>Execute Crop Recommendation</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Right Column: ML Suitability Output */}
            <div className="lg:col-span-8 space-y-4">
              {recommendations && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-bold text-white font-display">
                        Top Ranked Recommended Crops for {recommendations.location?.name || locationName}
                      </h3>
                      <p className="text-xs text-slate-400">
                        Evaluated across 12-dimensional agro-climatic feature vectors using live telemetry ({recommendations.environmentalTelemetry?.currentTemp}, {recommendations.environmentalTelemetry?.relativeHumidity} RH)
                      </p>
                    </div>
                    <span className="text-xs font-mono text-emerald-400 bg-emerald-950/60 px-2.5 py-1 rounded-lg border border-emerald-800/60">
                      {recommendations.recommendations?.length || 0} Crops Evaluated
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {recommendations.recommendations?.map((item, idx) => {
                      const isTop = idx === 0;
                      return (
                        <div
                          key={item.id}
                          className={`p-5 rounded-3xl transition-all border ${
                            isTop
                              ? 'bg-gradient-to-br from-emerald-950/50 via-slate-900/90 to-slate-950 border-emerald-500/50 shadow-xl shadow-emerald-500/10'
                              : 'bg-slate-900/60 border-slate-800/90 hover:border-slate-700'
                          }`}
                        >
                          <div className="flex items-start justify-between">
                            <div>
                              <div className="flex items-center gap-2">
                                <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                                  isTop ? 'bg-emerald-500 text-slate-950' : 'bg-slate-800 text-slate-300'
                                }`}>
                                  #{idx + 1}
                                </span>
                                <h4 className="text-base font-bold text-white font-display">
                                  {item.cropName}
                                </h4>
                              </div>
                              <p className="text-xs text-slate-400 mt-0.5">
                                {item.hindiName} • <span className="text-emerald-400">{item.season}</span>
                              </p>
                            </div>

                            {/* Score Ring */}
                            <div className="text-right">
                              <span className="text-2xl font-black font-mono text-emerald-400">
                                {item.suitabilityScore}%
                              </span>
                              <span className="block text-[10px] text-slate-400 uppercase font-mono">Suitability</span>
                            </div>
                          </div>

                          {/* Progress Bars Breakdown */}
                          <div className="space-y-1.5 my-3.5 text-[11px] pt-3 border-t border-slate-800/80">
                            <div className="flex justify-between items-center text-slate-400">
                              <span>Thermal Fit</span>
                              <span className="font-mono text-slate-300">{item.breakdown.temperatureMatch}%</span>
                            </div>
                            <div className="w-full bg-slate-800/80 h-1.5 rounded-full overflow-hidden">
                              <div
                                className="bg-amber-400 h-full rounded-full"
                                style={{ width: `${item.breakdown.temperatureMatch}%` }}
                              />
                            </div>

                            <div className="flex justify-between items-center text-slate-400">
                              <span>Soil pH & Nutrient Fit</span>
                              <span className="font-mono text-slate-300">{item.breakdown.soilPHMatch}%</span>
                            </div>
                            <div className="w-full bg-slate-800/80 h-1.5 rounded-full overflow-hidden">
                              <div
                                className="bg-emerald-400 h-full rounded-full"
                                style={{ width: `${item.breakdown.soilPHMatch}%` }}
                              />
                            </div>
                          </div>

                          {/* Recommended Varieties */}
                          <div className="mt-3 p-2.5 rounded-xl bg-slate-950/80 border border-slate-800/60 text-xs">
                            <span className="text-[10px] font-mono text-slate-400 uppercase block mb-1">
                              Certified High-Yield Varieties
                            </span>
                            <div className="flex flex-wrap gap-1.5">
                              {item.recommendedVarieties.slice(0, 3).map((v, i) => (
                                <span key={i} className="px-2 py-0.5 rounded-md bg-slate-900 border border-slate-800 text-[11px] text-cyan-300">
                                  {v}
                                </span>
                              ))}
                            </div>
                          </div>

                          {/* Quick Action Button */}
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedCropId(item.id);
                              setActiveTab('disease');
                              handleRunDiseaseCheck(item.id);
                            }}
                            className="mt-3 w-full py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-medium transition-all flex items-center justify-center gap-1 cursor-pointer"
                          >
                            <span>Inspect Disease Risks</span>
                            <ChevronRight className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* =========================================================================
         * TAB 2: DISEASE & PEST VULNERABILITY RADAR
         * ========================================================================= */}
        {activeTab === 'disease' && (
          <div className="space-y-6">
            {diseaseAssessment && (
              <>
                {/* Status Bar */}
                <div className="p-5 rounded-3xl bg-slate-900/70 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-center gap-3.5">
                    <div
                      className="w-12 h-12 rounded-2xl flex items-center justify-center text-white shrink-0 shadow-lg"
                      style={{ backgroundColor: `${diseaseAssessment.overallColor}25`, borderColor: diseaseAssessment.overallColor, borderWidth: 1 }}
                    >
                      <Bug className="w-6 h-6" style={{ color: diseaseAssessment.overallColor }} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-lg font-bold text-white font-display">
                          {diseaseAssessment.cropName} Pathogen & Pest Vulnerability Radar
                        </h3>
                        <span
                          className="px-2.5 py-0.5 rounded-full text-xs font-bold font-mono border"
                          style={{
                            backgroundColor: `${diseaseAssessment.overallColor}20`,
                            color: diseaseAssessment.overallColor,
                            borderColor: `${diseaseAssessment.overallColor}50`
                          }}
                        >
                          {diseaseAssessment.overallStatus}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Evaluated for {locationName} • Ambient: {diseaseAssessment.ambientConditions?.temperature}, {diseaseAssessment.ambientConditions?.relativeHumidity} RH
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleRunDiseaseCheck(selectedCropId)}
                    disabled={loadingDisease}
                    className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-2 transition-colors cursor-pointer self-start md:self-auto"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${loadingDisease ? 'animate-spin' : ''}`} />
                    <span>Recalculate with Live Telemetry</span>
                  </button>
                </div>

                {/* Disease Threat Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {diseaseAssessment.diseases.map((d) => (
                    <div
                      key={d.id}
                      className="p-5 rounded-3xl bg-slate-900/60 border border-slate-800 hover:border-slate-700 transition-all flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <h4 className="text-sm font-bold text-white font-display leading-tight">
                            {d.name}
                          </h4>
                          <span
                            className="text-xs font-black font-mono px-2 py-0.5 rounded-md border shrink-0"
                            style={{
                              backgroundColor: `${d.riskColor}20`,
                              color: d.riskColor,
                              borderColor: `${d.riskColor}40`
                            }}
                          >
                            {d.probability}% Risk
                          </span>
                        </div>

                        {/* Probability Gauge */}
                        <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden my-2.5">
                          <div
                            className="h-full rounded-full transition-all duration-500"
                            style={{ width: `${d.probability}%`, backgroundColor: d.riskColor }}
                          />
                        </div>

                        <p className="text-xs text-slate-300 mt-2 mb-3 leading-relaxed">
                          <span className="text-slate-500 font-mono text-[11px] block uppercase">Identified Symptoms:</span>
                          {d.symptoms}
                        </p>

                        {/* Trigger Diagnosis */}
                        <div className="space-y-1.5 p-3 rounded-2xl bg-slate-950/80 border border-slate-800/80 text-[11px] mb-3 font-mono">
                          <div className="flex justify-between">
                            <span className="text-slate-400">Thermal Index:</span>
                            <span className="text-slate-200">{d.triggerAnalysis.tempStatus}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-400">Moisture Index:</span>
                            <span className="text-slate-200">{d.triggerAnalysis.humidityStatus}</span>
                          </div>
                        </div>
                      </div>

                      {/* Intervention Directives */}
                      <div className="space-y-2 pt-3 border-t border-slate-800/80 text-xs">
                        <div className="p-2 rounded-xl bg-emerald-950/40 border border-emerald-800/40">
                          <span className="text-[10px] font-mono text-emerald-400 uppercase font-bold block mb-0.5">
                            Organic / Bio-Control:
                          </span>
                          <span className="text-[11px] text-slate-200">{d.organicIntervention}</span>
                        </div>

                        <div className="p-2 rounded-xl bg-blue-950/40 border border-blue-800/40">
                          <span className="text-[10px] font-mono text-cyan-400 uppercase font-bold block mb-0.5">
                            Recommended Chemical Dose:
                          </span>
                          <span className="text-[11px] text-slate-200">{d.chemicalIntervention}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        {/* =========================================================================
         * TAB 3: SMART IRRIGATION & FAO-56 EVAPOTRANSPIRATION
         * ========================================================================= */}
        {activeTab === 'irrigation' && (
          <div className="space-y-6">
            {irrigationAdvisory && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Left: Directive Card */}
                <div className="lg:col-span-7 space-y-4">
                  <div className="p-6 rounded-3xl bg-slate-900/80 border border-blue-500/30 backdrop-blur-xl shadow-xl">
                    <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                      <div className="flex items-center gap-2.5">
                        <span className="p-2 rounded-xl bg-blue-500/20 text-blue-400">
                          <Droplets className="w-5 h-5" />
                        </span>
                        <div>
                          <h3 className="text-base font-bold text-white font-display">
                            Precision Irrigation Command Directive
                          </h3>
                          <p className="text-xs text-blue-300 font-mono">
                            FAO-56 Penman-Monteith Evapotranspiration Matrix
                          </p>
                        </div>
                      </div>

                      <span
                        className="px-3 py-1 rounded-xl text-xs font-bold font-mono border"
                        style={{
                          backgroundColor: `${irrigationAdvisory.irrigationDecision.badgeColor}20`,
                          color: irrigationAdvisory.irrigationDecision.badgeColor,
                          borderColor: `${irrigationAdvisory.irrigationDecision.badgeColor}60`
                        }}
                      >
                        {irrigationAdvisory.irrigationDecision.directive}
                      </span>
                    </div>

                    <div className="my-5 p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                      <span className="text-xs font-mono text-slate-400 uppercase tracking-wider block">
                        Agronomic Rationale:
                      </span>
                      <p className="text-sm text-slate-200 leading-relaxed">
                        {irrigationAdvisory.irrigationDecision.rationale}
                      </p>
                    </div>

                    {/* Metrics Grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800">
                        <span className="text-[11px] font-mono text-slate-400 block mb-1">Ref. ET₀</span>
                        <span className="text-xl font-bold font-mono text-blue-300">
                          {irrigationAdvisory.evapotranspiration.referenceET0}
                        </span>
                        <span className="text-[10px] text-slate-500 block">Baseline Evaporation</span>
                      </div>

                      <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800">
                        <span className="text-[11px] font-mono text-slate-400 block mb-1">Crop Water ETc</span>
                        <span className="text-xl font-bold font-mono text-cyan-300">
                          {irrigationAdvisory.evapotranspiration.cropWaterDemandETc}
                        </span>
                        <span className="text-[10px] text-slate-500 block">Kc: {irrigationAdvisory.currentStage.cropCoefficientKc}</span>
                      </div>

                      <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800 col-span-2 sm:col-span-1">
                        <span className="text-[11px] font-mono text-slate-400 block mb-1">Recommended Volume</span>
                        <span className="text-xl font-bold font-mono text-emerald-300">
                          {irrigationAdvisory.irrigationDecision.litersPerHectare.toLocaleString()} L/ha
                        </span>
                        <span className="text-[10px] text-slate-500 block">{irrigationAdvisory.irrigationDecision.recommendedVolumeMm} mm equivalent</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right: Phenology & Scheduling */}
                <div className="lg:col-span-5 space-y-4">
                  <div className="p-6 rounded-3xl bg-slate-900/70 border border-slate-800">
                    <h4 className="text-sm font-bold text-white font-display mb-3 flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-emerald-400" />
                      Growth Stage & Timing
                    </h4>

                    <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 text-xs space-y-2 mb-4">
                      <div className="flex justify-between">
                        <span className="text-slate-400">Current Phenology:</span>
                        <span className="font-semibold text-emerald-400">{irrigationAdvisory.currentStage.name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Stage Duration:</span>
                        <span className="font-mono text-slate-200">~{irrigationAdvisory.currentStage.durationDays} Days</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Optimal Window:</span>
                        <span className="font-mono text-cyan-300">{irrigationAdvisory.irrigationDecision.optimalIrrigationTime}</span>
                      </div>
                    </div>

                    <div className="p-4 rounded-2xl bg-emerald-950/30 border border-emerald-800/40 text-xs space-y-1.5">
                      <span className="font-bold text-emerald-300 flex items-center gap-1.5">
                        <ShieldCheck className="w-4 h-4" />
                        Water Conservation Savings
                      </span>
                      <p className="text-slate-300 text-[11px] leading-relaxed">
                        By aligning with live weather forecasts and suppressing irrigation before rain events, AERIS saves up to 45,000 Litres of water per hectare per week.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* =========================================================================
         * TAB 4: OPENROUTER AGRI-AI SYNTHESIS
         * ========================================================================= */}
        {activeTab === 'ai_synthesis' && (
          <div className="space-y-6">
            {/* Custom Prompt Box */}
            <div className="p-4 sm:p-5 rounded-3xl bg-slate-900/70 border border-slate-800 flex flex-col md:flex-row items-stretch md:items-center gap-3">
              <input
                type="text"
                value={customAiQuery}
                onChange={(e) => setCustomAiQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !loadingAi) {
                    handleRunAiAnalysis();
                  }
                }}
                placeholder="Ask specific agronomy questions (e.g. 'Should I apply urea now considering the rainfall forecast?')"
                className="flex-1 min-w-0 bg-slate-950 border border-slate-800 rounded-2xl px-4 py-3.5 text-xs sm:text-sm text-slate-200 outline-none focus:border-cyan-500/50 transition-colors"
              />
              <button
                type="button"
                onClick={handleRunAiAnalysis}
                disabled={loadingAi}
                className="px-6 py-3.5 rounded-2xl bg-gradient-to-r from-cyan-500 to-emerald-500 hover:from-cyan-400 hover:to-emerald-400 text-slate-950 font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shrink-0 whitespace-nowrap transition-all shadow-lg shadow-cyan-500/20 cursor-pointer disabled:opacity-50"
              >
                {loadingAi ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin shrink-0" />
                    <span>Synthesizing...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 shrink-0" />
                    <span>Run OpenRouter Agri-AI</span>
                  </>
                )}
              </button>
            </div>

            {aiReport && (
              <div className="p-6 sm:p-8 rounded-3xl bg-slate-950/90 border border-cyan-500/30 shadow-2xl backdrop-blur-2xl space-y-6">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-5 border-b border-slate-800 gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full bg-cyan-400 animate-pulse"></span>
                      <h3 className="text-xl font-bold font-display text-white">
                        AI Agronomic Intelligence Report — {aiReport.crop?.name}
                      </h3>
                    </div>
                    <p className="text-xs text-cyan-300/80 font-mono mt-0.5">
                      Synthesized via OpenRouter AI for {aiReport.location?.name}
                    </p>
                  </div>

                  <span
                    className="px-3.5 py-1 rounded-full text-xs font-bold font-mono border self-start sm:self-auto"
                    style={{
                      backgroundColor: `${aiReport.aiSynthesis?.riskColor || '#10b981'}20`,
                      color: aiReport.aiSynthesis?.riskColor || '#10b981',
                      borderColor: `${aiReport.aiSynthesis?.riskColor || '#10b981'}50`
                    }}
                  >
                    {aiReport.aiSynthesis?.riskRating} PRIORITY
                  </span>
                </div>

                {/* Executive Summary */}
                <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800">
                  <span className="text-xs font-mono text-cyan-400 uppercase tracking-wider block mb-1">
                    Executive Agronomy Diagnosis:
                  </span>
                  <p className="text-sm text-slate-200 leading-relaxed">
                    {aiReport.aiSynthesis?.executiveSummary}
                  </p>
                </div>

                {/* Immediate Directives Checklist */}
                <div>
                  <h4 className="text-sm font-bold text-white font-display mb-3 flex items-center gap-2">
                    <Activity className="w-4 h-4 text-emerald-400" />
                    Farmer Operational Directives (Next 48 Hours)
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {aiReport.aiSynthesis?.immediateDirectives?.map((dir, i) => (
                      <div key={i} className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80 flex items-start gap-3">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                        <div>
                          <span className="text-[10px] font-mono text-emerald-400 uppercase font-bold block">
                            {dir.timeframe} • {dir.priority} Priority
                          </span>
                          <p className="text-xs text-slate-200 mt-0.5">{dir.action}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Disease & Nutrient Guidance */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Disease Mitigation */}
                  <div className="p-4 rounded-2xl bg-slate-900/50 border border-amber-500/20">
                    <span className="text-xs font-mono text-amber-400 uppercase tracking-wider block mb-1.5 font-bold">
                      🛡️ Disease & Spray Protection
                    </span>
                    <p className="text-xs text-slate-300 mb-2">
                      <strong className="text-white">Threat:</strong> {aiReport.aiSynthesis?.diseaseMitigation?.primaryThreat}
                    </p>
                    <div className="p-3 rounded-xl bg-slate-950 text-xs text-slate-200 font-mono">
                      {aiReport.aiSynthesis?.diseaseMitigation?.recommendedSpray}
                    </div>
                  </div>

                  {/* Nutrient Optimization */}
                  <div className="p-4 rounded-2xl bg-slate-900/50 border border-emerald-500/20">
                    <span className="text-xs font-mono text-emerald-400 uppercase tracking-wider block mb-1.5 font-bold">
                      🌱 Nutrient & Fertilizer Strategy
                    </span>
                    <p className="text-xs text-slate-300 mb-2">
                      <strong className="text-white">Assessment:</strong> {aiReport.aiSynthesis?.nutrientOptimization?.deficiencyRisk}
                    </p>
                    <div className="p-3 rounded-xl bg-slate-950 text-xs text-slate-200 font-mono">
                      {aiReport.aiSynthesis?.nutrientOptimization?.fertilizerRecommendation}
                    </div>
                  </div>
                </div>

                {/* Extreme Weather Resilience */}
                {aiReport.aiSynthesis?.extremeWeatherResilience && (
                  <div className="p-4 rounded-2xl bg-blue-950/30 border border-blue-800/40 text-xs">
                    <span className="text-[10px] font-mono text-blue-400 uppercase tracking-wider block mb-1 font-bold">
                      ⚡ Extreme Weather Mitigation
                    </span>
                    <p className="text-slate-200">{aiReport.aiSynthesis.extremeWeatherResilience}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
