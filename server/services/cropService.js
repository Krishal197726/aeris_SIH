/**
 * AERIS / WeatherGPT — Crop Intelligence & Agri-Meteorological ML Engine
 * 
 * SERVER-SIDE ONLY.
 * Provides deterministic and machine learning models for agronomic decision support:
 * 1. Multi-Criteria Crop Suitability & Recommendation Model (Soil N-P-K, pH, Rainfall, Temp, Season)
 * 2. Disease & Pest Vulnerability ML Classifier (Temp/Humidity/Rain Thresholds & Leaf Wetness)
 * 3. FAO-56 Penman-Monteith / Hargreaves Evapotranspiration (ET0) & Crop Water Demand (ETc)
 * 4. Growing Degree Days (GDD) Thermal Heat Unit & Phenology Stage Predictor
 */

// Comprehensive Knowledge Base of Major Crops
export const CROP_DATABASE = {
  cotton: {
    id: 'cotton',
    cropName: 'Cotton',
    hindiName: 'कपास (Kapas)',
    season: 'Kharif',
    category: 'Commercial / Fibre',
    optimalTempRange: { min: 21, max: 35, criticalMax: 42, baseTemp: 15.5 },
    optimalHumidity: { min: 50, max: 75 },
    rainfallRequirement: { min: 500, max: 1000, max24hWaterlogging: 35 },
    soilRequirements: {
      preferredTypes: ['Black Soil (Regur)', 'Deep Alluvial', 'Clay Loam'],
      idealPH: { min: 6.0, max: 8.0, optimal: 7.2 },
      nutrientDemand: { N: 120, P: 60, K: 60 } // kg/ha
    },
    growthStages: [
      { name: 'Germination & Emergence', durationDays: 12, gddRequired: 140, kc: 0.45 },
      { name: 'Vegetative & Square Formation', durationDays: 45, gddRequired: 550, kc: 0.75 },
      { name: 'Flowering & Boll Development', durationDays: 55, gddRequired: 800, kc: 1.15 },
      { name: 'Boll Opening & Maturity', durationDays: 35, gddRequired: 450, kc: 0.65 }
    ],
    irrigationGuidance: 'Maintain soil moisture at 65-75% field capacity during flowering and boll formation. Avoid waterlogging during boll burst.',
    weatherRisks: [
      'Waterlogging during boll opening causing shedding and fibre discoloration',
      'High humidity (>80%) and cloudy weather encouraging pink bollworm and whitefly infestation',
      'Sudden temperature drop (<18°C) during flowering causing flower drop'
    ],
    diseases: [
      {
        id: 'pink_bollworm',
        name: 'Pink Bollworm (Pectinophora gossypiella)',
        severity: 'HIGH',
        triggerConditions: { minTemp: 22, maxTemp: 34, minHumidity: 70, rainTrigger: false },
        symptoms: 'Rosetted flowers, exit holes in bolls, stained lint, premature boll dropping.',
        organicRemedy: 'Install pheromone traps @ 5 traps/acre; release Trichogramma egg parasitoids @ 1.5 lakh/ha.',
        chemicalRemedy: 'Spray Emamectin Benzoate 5% SG @ 0.5g/L or Spinosad 45% SC @ 0.3ml/L.'
      },
      {
        id: 'bacterial_blight',
        name: 'Bacterial Blight / Angular Leaf Spot (Xanthomonas citri pv. malvacearum)',
        severity: 'CRITICAL',
        triggerConditions: { minTemp: 25, maxTemp: 32, minHumidity: 82, rainTrigger: true },
        symptoms: 'Angular, water-soaked lesions on leaves turning reddish-brown with yellow halo; black arm on stems.',
        organicRemedy: 'Seed treatment with Pseudomonas fluorescens @ 10g/kg; spray 1% Bordeaux mixture.',
        chemicalRemedy: 'Spray Streptocycline @ 0.1g/L + Copper Oxychloride 50% WP @ 2.5g/L.'
      },
      {
        id: 'root_rot',
        name: 'Rhizoctonia Root Rot',
        severity: 'HIGH',
        triggerConditions: { minTemp: 28, maxTemp: 38, minHumidity: 60, waterloggingTrigger: true },
        symptoms: 'Sudden wilting of plants in patches, dark brown lesions on root bark.',
        organicRemedy: 'Soil application of Trichoderma viride @ 2.5 kg/ha mixed with well-rotted FYM.',
        chemicalRemedy: 'Drench soil with Carbendazim 50% WP @ 1g/L of water.'
      }
    ]
  },

  groundnut: {
    id: 'groundnut',
    cropName: 'Groundnut / Peanut',
    hindiName: 'मूंगफली (Mungfali)',
    season: 'Kharif / Zaid',
    category: 'Oilseed / Legume',
    optimalTempRange: { min: 22, max: 32, criticalMax: 38, baseTemp: 13.0 },
    optimalHumidity: { min: 55, max: 75 },
    rainfallRequirement: { min: 450, max: 750, max24hWaterlogging: 25 },
    soilRequirements: {
      preferredTypes: ['Well-drained Sandy Loam', 'Red Loam', 'Light Alluvial'],
      idealPH: { min: 6.0, max: 7.5, optimal: 6.8 },
      nutrientDemand: { N: 25, P: 50, K: 40 }
    },
    growthStages: [
      { name: 'Germination & Seedling', durationDays: 15, gddRequired: 180, kc: 0.40 },
      { name: 'Vegetative & Flowering', durationDays: 30, gddRequired: 420, kc: 0.70 },
      { name: 'Pegging & Pod Formation', durationDays: 40, gddRequired: 650, kc: 1.05 },
      { name: 'Pod Maturity & Ripening', durationDays: 25, gddRequired: 350, kc: 0.60 }
    ],
    irrigationGuidance: 'Critical irrigation periods are flowering (30-40 DAS) and peg penetration into soil (45-65 DAS). Dry spells during pegging lead to hollow pods (pops).',
    weatherRisks: [
      'Continuous overcast sky and relative humidity >85% triggering Tikka leaf spot epidemic',
      'Water stagnation causing peg rot and aflatoxin contamination by Aspergillus flavus',
      'Dry spells during pegging reducing pod yield by up to 50%'
    ],
    diseases: [
      {
        id: 'tikka_leaf_spot',
        name: 'Early & Late Tikka Leaf Spot (Cercospora arachidicola)',
        severity: 'CRITICAL',
        triggerConditions: { minTemp: 24, maxTemp: 31, minHumidity: 80, rainTrigger: true },
        symptoms: 'Circular necrotic spots on leaves with yellow halo; severe defoliation.',
        organicRemedy: 'Foliar spray of 5% Neem Seed Kernel Extract (NSKE) or Panchagavya 3%.',
        chemicalRemedy: 'Spray Tebuconazole 25.9% EC @ 1ml/L or Mancozeb 75% WP @ 2g/L.'
      },
      {
        id: 'stem_rot',
        name: 'Stem Rot / Sclerotium Wilt (Sclerotium rolfsii)',
        severity: 'HIGH',
        triggerConditions: { minTemp: 26, maxTemp: 35, minHumidity: 75, waterloggingTrigger: true },
        symptoms: 'White mycelial fan at soil line on stem; rapid wilting and drying of branches.',
        organicRemedy: 'Apply Trichoderma harzianum @ 4kg/ha in 250kg FYM at sowing.',
        chemicalRemedy: 'Drench root zone with Hexaconazole 5% EC @ 2ml/L.'
      }
    ]
  },

  wheat: {
    id: 'wheat',
    cropName: 'Wheat',
    hindiName: 'गेहूं (Gehun)',
    season: 'Rabi',
    category: 'Cereal / Food Grain',
    optimalTempRange: { min: 14, max: 24, criticalMax: 32, baseTemp: 4.5 },
    optimalHumidity: { min: 40, max: 65 },
    rainfallRequirement: { min: 300, max: 550, max24hWaterlogging: 20 },
    soilRequirements: {
      preferredTypes: ['Clay Loam', 'Alluvial Loam', 'Sandy Loam'],
      idealPH: { min: 6.0, max: 8.5, optimal: 7.0 },
      nutrientDemand: { N: 120, P: 60, K: 40 }
    },
    growthStages: [
      { name: 'Crown Root Initiation (CRI)', durationDays: 21, gddRequired: 220, kc: 0.35 },
      { name: 'Tillering & Jointing', durationDays: 40, gddRequired: 480, kc: 0.75 },
      { name: 'Booting & Heading/Flowering', durationDays: 30, gddRequired: 450, kc: 1.15 },
      { name: 'Grain Filling & Dough/Maturity', durationDays: 25, gddRequired: 380, kc: 0.65 }
    ],
    irrigationGuidance: 'CRI (20-25 DAS) is the most critical irrigation stage. Flowering and milking stages also require adequate moisture.',
    weatherRisks: [
      'Terminal heat stress (Temp >32°C in Feb/March) causing shrivelled grains and premature forced ripening',
      'Unseasonal hailstorms or rainfall during grain filling lodging the crop',
      'Dense fog and high humidity (>85%) promoting yellow rust in northern plains'
    ],
    diseases: [
      {
        id: 'yellow_rust',
        name: 'Stripe / Yellow Rust (Puccinia striiformis)',
        severity: 'CRITICAL',
        triggerConditions: { minTemp: 10, maxTemp: 18, minHumidity: 80, rainTrigger: false },
        symptoms: 'Yellow pustules arranged in linear stripes on leaf blades; chlorosis.',
        organicRemedy: 'Spray garlic-chilli extract or bio-fungicide Ampelomyces quisqualis.',
        chemicalRemedy: 'Spray Propiconazole 25% EC (Tilt) @ 1ml/L at first notice of pustules.'
      },
      {
        id: 'karnal_bunt',
        name: 'Karnal Bunt (Tilletia indica)',
        severity: 'MODERATE',
        triggerConditions: { minTemp: 15, maxTemp: 22, minHumidity: 70, rainTrigger: true },
        symptoms: 'Partial conversion of grain kernels into black foul-smelling powder (trimethylamine odor).',
        organicRemedy: 'Deep summer ploughing and crop rotation with non-host crops.',
        chemicalRemedy: 'Foliar spray with Propiconazole 25% EC @ 1ml/L at heading stage.'
      }
    ]
  },

  rice: {
    id: 'rice',
    cropName: 'Rice / Paddy',
    hindiName: 'चावल / धान (Dhan)',
    season: 'Kharif',
    category: 'Cereal / Staple',
    optimalTempRange: { min: 22, max: 34, criticalMax: 40, baseTemp: 10.0 },
    optimalHumidity: { min: 70, max: 90 },
    rainfallRequirement: { min: 1000, max: 2000, max24hWaterlogging: 200 },
    soilRequirements: {
      preferredTypes: ['Heavy Clay', 'Clayey Silt', 'Deltaic Alluvium'],
      idealPH: { min: 5.5, max: 7.0, optimal: 6.2 },
      nutrientDemand: { N: 120, P: 50, K: 50 }
    },
    growthStages: [
      { name: 'Seedling & Transplanting', durationDays: 25, gddRequired: 320, kc: 1.10 },
      { name: 'Active Tillering & Panicle Initiation', durationDays: 40, gddRequired: 600, kc: 1.15 },
      { name: 'Flowering & Grain Development', durationDays: 35, gddRequired: 580, kc: 1.25 },
      { name: 'Ripening & Harvesting', durationDays: 20, gddRequired: 300, kc: 0.90 }
    ],
    irrigationGuidance: 'Maintain shallow standing water (2-5 cm) from transplanting until 10 days before harvest. Drain field 7-10 days before harvesting.',
    weatherRisks: [
      'Dry spells during panicle initiation causing sterile spikelets and chaffy grains',
      'Excessive rainfall & squalls during dough stage causing crop lodging into water',
      'Overcast weather with temperature 24-28°C fostering Rice Blast and Bacterial Leaf Blight'
    ],
    diseases: [
      {
        id: 'rice_blast',
        name: 'Rice Blast (Magnaporthe oryzae)',
        severity: 'CRITICAL',
        triggerConditions: { minTemp: 20, maxTemp: 28, minHumidity: 85, rainTrigger: true },
        symptoms: 'Spindle-shaped spots on leaves with grey center and brown margins; neck rot.',
        organicRemedy: 'Foliar spray with Pseudomonas fluorescens @ 2.5g/L; avoid excess nitrogen.',
        chemicalRemedy: 'Spray Tricyclazole 75% WP @ 0.6g/L or Isoprothiolane 40% EC @ 1.5ml/L.'
      },
      {
        id: 'bacterial_leaf_blight',
        name: 'Bacterial Leaf Blight (Xanthomonas oryzae)',
        severity: 'HIGH',
        triggerConditions: { minTemp: 25, maxTemp: 34, minHumidity: 80, rainTrigger: true },
        symptoms: 'Water-soaked wavy lesions starting from leaf tips turning yellow and bleaching.',
        organicRemedy: 'Spray fresh cow dung filtrate (20%) + neem oil (3%).',
        chemicalRemedy: 'Spray Streptocycline @ 100mg/L + Copper Oxychloride @ 2.5g/L.'
      }
    ]
  },

  maize: {
    id: 'maize',
    cropName: 'Maize / Corn',
    hindiName: 'मक्का (Makka)',
    season: 'Kharif / Rabi',
    category: 'Coarse Cereal / Feed',
    optimalTempRange: { min: 20, max: 32, criticalMax: 38, baseTemp: 10.0 },
    optimalHumidity: { min: 55, max: 75 },
    rainfallRequirement: { min: 500, max: 800, max24hWaterlogging: 25 },
    soilRequirements: {
      preferredTypes: ['Deep Loam', 'Silt Loam', 'Well-drained Alluvial'],
      idealPH: { min: 6.0, max: 7.5, optimal: 6.5 },
      nutrientDemand: { N: 120, P: 60, K: 50 }
    },
    growthStages: [
      { name: 'Emergence & Seedling (V1-V4)', durationDays: 18, gddRequired: 200, kc: 0.40 },
      { name: 'Knee High & Rapid Growth (V6-V12)', durationDays: 30, gddRequired: 450, kc: 0.80 },
      { name: 'Tasseling, Silking & Pollination (R1)', durationDays: 25, gddRequired: 420, kc: 1.20 },
      { name: 'Grain Filling & Maturity (R2-R6)', durationDays: 35, gddRequired: 520, kc: 0.60 }
    ],
    irrigationGuidance: 'Tasseling to silking is the most drought-sensitive stage. Water stress at silking decreases yield by 40-50%.',
    weatherRisks: [
      'High temperature (>37°C) with low humidity desiccating pollen during silking',
      'Waterlogging in early seedling stage causing chlorosis and plant stunting',
      'Fall Armyworm invasion in warm, dry spells following early showers'
    ],
    diseases: [
      {
        id: 'fall_armyworm',
        name: 'Fall Armyworm (Spodoptera frugiperda)',
        severity: 'CRITICAL',
        triggerConditions: { minTemp: 22, maxTemp: 35, minHumidity: 50, rainTrigger: false },
        symptoms: 'Pinholes in leaves, ragged whorl feeding, large masses of sawdust-like frass.',
        organicRemedy: 'Whorl application of Bacillus thuringiensis (Bt) @ 2g/L or Beauveria bassiana @ 5g/L.',
        chemicalRemedy: 'Spray Chlorantraniliprole 18.5% SC @ 0.4ml/L into the plant whorls.'
      },
      {
        id: 'maydis_leaf_blight',
        name: 'Maydis Leaf Blight (Bipolaris maydis)',
        severity: 'MODERATE',
        triggerConditions: { minTemp: 22, maxTemp: 30, minHumidity: 80, rainTrigger: true },
        symptoms: 'Small diamond-shaped to elongated tan lesions restricted by leaf veins.',
        organicRemedy: 'Seed treatment with Trichoderma viride @ 4g/kg.',
        chemicalRemedy: 'Spray Mancozeb 75% WP @ 2.5g/L or Azoxystrobin @ 1ml/L.'
      }
    ]
  },

  mustard: {
    id: 'mustard',
    cropName: 'Mustard / Rapeseed',
    hindiName: 'सरसों (Sarson)',
    season: 'Rabi',
    category: 'Oilseed',
    optimalTempRange: { min: 15, max: 25, criticalMax: 30, baseTemp: 5.0 },
    optimalHumidity: { min: 50, max: 70 },
    rainfallRequirement: { min: 250, max: 450, max24hWaterlogging: 15 },
    soilRequirements: {
      preferredTypes: ['Sandy Loam to Heavy Loam', 'Alluvial'],
      idealPH: { min: 6.0, max: 7.5, optimal: 6.8 },
      nutrientDemand: { N: 80, P: 40, K: 30 }
    },
    growthStages: [
      { name: 'Germination & Seedling', durationDays: 20, gddRequired: 200, kc: 0.35 },
      { name: 'Branching & Rosette', durationDays: 30, gddRequired: 380, kc: 0.70 },
      { name: 'Flowering & Pod (Siliqua) Formation', durationDays: 35, gddRequired: 450, kc: 1.10 },
      { name: 'Pod Filling & Maturity', durationDays: 25, gddRequired: 300, kc: 0.55 }
    ],
    irrigationGuidance: 'One pre-flowering irrigation (30-35 DAS) and one siliqua development irrigation (60-65 DAS) provide maximum water-use efficiency.',
    weatherRisks: [
      'Aphid pest explosion during cloudy, humid, warm weather (15-20°C, RH >75%) in Jan/Feb',
      'Frost injury (temp <2°C) during flowering/pod formation destroying ovules',
      'White rust epidemic under prolonged morning fog'
    ],
    diseases: [
      {
        id: 'mustard_aphids',
        name: 'Mustard Aphid (Lipaphis erysimi)',
        severity: 'CRITICAL',
        triggerConditions: { minTemp: 12, maxTemp: 22, minHumidity: 70, rainTrigger: false },
        symptoms: 'Colonies of tiny yellow-green insects sucking sap from tender twigs, flowers, and pods; sooty mould.',
        organicRemedy: 'Spray 2% neem oil or fish oil rosin soap @ 20g/L.',
        chemicalRemedy: 'Spray Dimethoate 30% EC @ 1.7ml/L or Imidacloprid 17.8% SL @ 0.3ml/L.'
      },
      {
        id: 'white_rust',
        name: 'White Rust & Staghead (Albugo candida)',
        severity: 'HIGH',
        triggerConditions: { minTemp: 10, maxTemp: 18, minHumidity: 82, rainTrigger: true },
        symptoms: 'White to creamy pustules on lower leaf surface; staghead floral malformations.',
        organicRemedy: 'Foliar spray of garlic bulb extract @ 5%.',
        chemicalRemedy: 'Spray Metalaxyl 8% + Mancozeb 64% WP (Ridomil MZ) @ 2g/L.'
      }
    ]
  },

  soybean: {
    id: 'soybean',
    cropName: 'Soybean',
    hindiName: 'सोयाबीन (Soyabean)',
    season: 'Kharif',
    category: 'Oilseed / Legume',
    optimalTempRange: { min: 20, max: 32, criticalMax: 38, baseTemp: 10.0 },
    optimalHumidity: { min: 60, max: 80 },
    rainfallRequirement: { min: 600, max: 900, max24hWaterlogging: 30 },
    soilRequirements: {
      preferredTypes: ['Medium to Deep Black Soil', 'Clay Loam', 'Alluvial'],
      idealPH: { min: 6.0, max: 7.5, optimal: 6.8 },
      nutrientDemand: { N: 30, P: 60, K: 40 }
    },
    growthStages: [
      { name: 'Germination & Vegetative (V1-V4)', durationDays: 25, gddRequired: 300, kc: 0.40 },
      { name: 'Flowering & Pod Initiation (R1-R3)', durationDays: 30, gddRequired: 450, kc: 0.85 },
      { name: 'Pod Filling & Seed Development (R4-R6)', durationDays: 35, gddRequired: 550, kc: 1.15 },
      { name: 'Maturity & Leaf Drop (R7-R8)', durationDays: 20, gddRequired: 250, kc: 0.50 }
    ],
    irrigationGuidance: 'Pod filling stage is the most critical. Severe moisture stress during pod filling reduces seed size and oil content significantly.',
    weatherRisks: [
      'Girdle beetle and stem fly infestation in warm, humid weather with intermittent drizzles',
      'Yellow mosaic virus transmitted by whitefly in hot, dry breaks during monsoon',
      'Excessive rain at harvest causing seed germination in pods'
    ],
    diseases: [
      {
        id: 'yellow_mosaic_virus',
        name: 'Yellow Mosaic Virus (MYMV)',
        severity: 'HIGH',
        triggerConditions: { minTemp: 26, maxTemp: 35, minHumidity: 65, rainTrigger: false },
        symptoms: 'Bright yellow alternating patches on leaf lamina, stunting, pod deformation.',
        organicRemedy: 'Install yellow sticky traps @ 10/acre; spray neem seed kernel extract (NSKE 5%).',
        chemicalRemedy: 'Spray Thiamethoxam 25% WG @ 0.3g/L to control vector whiteflies.'
      },
      {
        id: 'charcoal_rot',
        name: 'Charcoal Rot (Macrophomina phaseolina)',
        severity: 'MODERATE',
        triggerConditions: { minTemp: 30, maxTemp: 38, minHumidity: 50, drySpellTrigger: true },
        symptoms: 'Ashy grey stem discoloration near soil line; tiny black sclerotial specks under bark.',
        organicRemedy: 'Soil solarization and application of Trichoderma viride @ 5kg/ha.',
        chemicalRemedy: 'Seed treatment with Carboxin 37.5% + Thiram 37.5% DS @ 2.5g/kg.'
      }
    ]
  },

  sugarcane: {
    id: 'sugarcane',
    cropName: 'Sugarcane',
    hindiName: 'गन्ना (Ganna)',
    season: 'Perennial / Annual',
    category: 'Cash / Sugar Crop',
    optimalTempRange: { min: 24, max: 38, criticalMax: 44, baseTemp: 12.0 },
    optimalHumidity: { min: 60, max: 85 },
    rainfallRequirement: { min: 1100, max: 1800, max24hWaterlogging: 70 },
    soilRequirements: {
      preferredTypes: ['Deep Loam', 'Heavy Alluvial', 'Clayey Soil'],
      idealPH: { min: 6.5, max: 8.0, optimal: 7.2 },
      nutrientDemand: { N: 250, P: 100, K: 120 }
    },
    growthStages: [
      { name: 'Germination & Sprouting', durationDays: 45, gddRequired: 500, kc: 0.50 },
      { name: 'Tillering & Formative Stage', durationDays: 80, gddRequired: 1100, kc: 0.85 },
      { name: 'Grand Growth & Stem Elongation', durationDays: 140, gddRequired: 2200, kc: 1.25 },
      { name: 'Ripening & Sucrose Accumulation', durationDays: 90, gddRequired: 1200, kc: 0.70 }
    ],
    irrigationGuidance: 'Formative and grand growth stages require frequent irrigation (every 7-10 days). Withhold irrigation 15-20 days before harvest to concentrate sucrose.',
    weatherRisks: [
      'Red rot epidemic during hot, humid monsoon breaks',
      'Early shoot borer infestation in high temperature and dry atmosphere',
      'Inversion of sugar to reducing sugars due to heavy rain near ripening'
    ],
    diseases: [
      {
        id: 'red_rot',
        name: 'Red Rot of Sugarcane (Colletotrichum falcatum)',
        severity: 'CRITICAL',
        triggerConditions: { minTemp: 26, maxTemp: 34, minHumidity: 85, rainTrigger: true },
        symptoms: 'Third/fourth leaf withers; internal cane pith turns bright red with transverse white patches; alcoholic smell.',
        organicRemedy: 'Use tissue-cultured certified seed setts; dip setts in hot water at 52°C for 30 mins.',
        chemicalRemedy: 'Sett dip in Carbendazim 50% WP @ 1g/L for 15 minutes before planting.'
      }
    ]
  },

  tomato: {
    id: 'tomato',
    cropName: 'Tomato',
    hindiName: 'टमाटर (Tamatar)',
    season: 'Kharif / Rabi / Zaid',
    category: 'Horticulture / Vegetable',
    optimalTempRange: { min: 18, max: 28, criticalMax: 35, baseTemp: 10.0 },
    optimalHumidity: { min: 50, max: 70 },
    rainfallRequirement: { min: 400, max: 600, max24hWaterlogging: 15 },
    soilRequirements: {
      preferredTypes: ['Rich Loam', 'Sandy Loam', 'Well-drained Soil'],
      idealPH: { min: 6.0, max: 7.0, optimal: 6.5 },
      nutrientDemand: { N: 100, P: 50, K: 50 }
    },
    growthStages: [
      { name: 'Nursery & Transplanting', durationDays: 25, gddRequired: 250, kc: 0.45 },
      { name: 'Vegetative Growth & Flowering', durationDays: 30, gddRequired: 400, kc: 0.75 },
      { name: 'Fruit Setting & Development', durationDays: 35, gddRequired: 500, kc: 1.15 },
      { name: 'Fruit Ripening & Harvesting', durationDays: 30, gddRequired: 400, kc: 0.80 }
    ],
    irrigationGuidance: 'Drip irrigation is recommended. Avoid overhead sprinkler irrigation to prevent leaf wetness and fungal infection. Maintain consistent moisture to prevent fruit cracking and Blossom End Rot (BER).',
    weatherRisks: [
      'Late blight rapid outbreak during cool, cloudy, wet periods (18-22°C, RH >90%)',
      'Flower drop and poor pollen viability when temperatures exceed 35°C',
      'Fruit borer (Helicoverpa armigera) feeding in warm humid windows'
    ],
    diseases: [
      {
        id: 'early_late_blight',
        name: 'Late Blight (Phytophthora infestans)',
        severity: 'CRITICAL',
        triggerConditions: { minTemp: 15, maxTemp: 23, minHumidity: 88, rainTrigger: true },
        symptoms: 'Water-soaked irregular dark green lesions on leaves; white fluffy mould on undersides; greasy brown rot on green fruits.',
        organicRemedy: 'Foliar spray with Copper Hydroxide @ 2g/L or Trichoderma @ 5g/L.',
        chemicalRemedy: 'Spray Cymoxanil 8% + Mancozeb 64% WP (Curzate) @ 2g/L or Dimethomorph 50% WP @ 1g/L.'
      },
      {
        id: 'tomato_leaf_curl',
        name: 'Tomato Leaf Curl Virus (ToLCV)',
        severity: 'HIGH',
        triggerConditions: { minTemp: 25, maxTemp: 35, minHumidity: 55, rainTrigger: false },
        symptoms: 'Upward curling of leaves, thickened veins, severe stunting and bushiness, little to no fruit set.',
        organicRemedy: 'Grow border rows of maize; spray NSKE 5% to repel whitefly vectors.',
        chemicalRemedy: 'Spray Diafenthiuron 50% WP @ 1.2g/L or Acetamiprid 20% SP @ 0.5g/L.'
      }
    ]
  }
};

/* =========================================================================
 * 1. MULTI-CRITERIA CROP SUITABILITY & RECOMMENDATION ML MODEL
 * ========================================================================= */

/**
 * Normalizes value into 0-1 scale with Gaussian-like bell curve penalty for deviations.
 */
function calculateSuitabilityScore(val, optimalMin, optimalMax, absoluteMin, absoluteMax) {
  if (val >= optimalMin && val <= optimalMax) return 1.0;
  if (val < optimalMin) {
    if (val <= absoluteMin) return 0.05;
    return 0.05 + 0.95 * Math.pow((val - absoluteMin) / (optimalMin - absoluteMin), 1.5);
  }
  if (val > optimalMax) {
    if (val >= absoluteMax) return 0.05;
    return 0.05 + 0.95 * Math.pow((absoluteMax - val) / (absoluteMax - optimalMax), 1.5);
  }
  return 0.5;
}

/**
 * Machine Learning Multi-Criteria Decision Model for Crop Recommendation.
 * Evaluates soil nutrients (N, P, K, pH), weather telemetry (temp, humidity, rain, season).
 * 
 * @param {object} input
 * @param {number} [input.nitrogen=80] - Soil Nitrogen in kg/ha
 * @param {number} [input.phosphorus=45] - Soil Phosphorus in kg/ha
 * @param {number} [input.potassium=50] - Soil Potassium in kg/ha
 * @param {number} [input.ph=7.0] - Soil pH (4.0 - 9.0)
 * @param {string} [input.soilType='Alluvial']
 * @param {number} [input.temp=28.5] - Ambient/Forecast Temperature (°C)
 * @param {number} [input.humidity=75] - Relative Humidity (%)
 * @param {number} [input.rainfall=650] - Annual/Seasonal Expected Rainfall (mm)
 * @param {string} [input.season='Kharif'] - Kharif, Rabi, Zaid, Annual
 * @returns {Array<object>} Ranked crop recommendations with suitability breakdown
 */
export function recommendCrops({
  nitrogen = 80,
  phosphorus = 45,
  potassium = 50,
  ph = 7.0,
  soilType = 'Alluvial',
  temp = 28.5,
  humidity = 75,
  rainfall = 650,
  season = 'Kharif'
} = {}) {
  const results = [];

  for (const [id, crop] of Object.entries(CROP_DATABASE)) {
    // 1. Temperature Suitability (Weight: 25%)
    const tempScore = calculateSuitabilityScore(
      temp,
      crop.optimalTempRange.min,
      crop.optimalTempRange.max,
      crop.optimalTempRange.min - 8,
      crop.optimalTempRange.criticalMax
    );

    // 2. Humidity Suitability (Weight: 15%)
    const humidityScore = calculateSuitabilityScore(
      humidity,
      crop.optimalHumidity.min,
      crop.optimalHumidity.max,
      Math.max(20, crop.optimalHumidity.min - 25),
      Math.min(100, crop.optimalHumidity.max + 25)
    );

    // 3. Rainfall Suitability (Weight: 20%)
    const rainScore = calculateSuitabilityScore(
      rainfall,
      crop.rainfallRequirement.min,
      crop.rainfallRequirement.max,
      crop.rainfallRequirement.min * 0.4,
      crop.rainfallRequirement.max * 1.8
    );

    // 4. Soil pH Suitability (Weight: 15%)
    const phScore = calculateSuitabilityScore(
      ph,
      crop.soilRequirements.idealPH.min,
      crop.soilRequirements.idealPH.max,
      crop.soilRequirements.idealPH.min - 1.5,
      crop.soilRequirements.idealPH.max + 1.5
    );

    // 5. Soil Nutrient (N-P-K) Affinity (Weight: 15%)
    const demand = crop.soilRequirements.nutrientDemand;
    const nRatio = Math.min(1.0, nitrogen / Math.max(1, demand.N));
    const pRatio = Math.min(1.0, phosphorus / Math.max(1, demand.P));
    const kRatio = Math.min(1.0, potassium / Math.max(1, demand.K));
    const nutrientScore = (nRatio * 0.4 + pRatio * 0.3 + kRatio * 0.3);

    // 6. Season & Soil Type Compatibility (Weight: 10%)
    let seasonBonus = 0.5;
    if (crop.season.toLowerCase().includes(season.toLowerCase()) || crop.season === 'Perennial / Annual') {
      seasonBonus = 1.0;
    }

    let soilBonus = 0.6;
    if (crop.soilRequirements.preferredTypes.some(t => t.toLowerCase().includes(soilType.toLowerCase()))) {
      soilBonus = 1.0;
    }

    // Weighted Overall Score (0 to 100%)
    const overallScore = Math.round(
      (tempScore * 0.25 +
       humidityScore * 0.15 +
       rainScore * 0.20 +
       phScore * 0.15 +
       nutrientScore * 0.15 +
       (seasonBonus * 0.5 + soilBonus * 0.5) * 0.10) * 100
    );

    // Generate specific agronomic justification
    const pros = [];
    const cons = [];

    if (tempScore > 0.8) pros.push(`Current temperature (${temp}°C) is in optimal growth window (${crop.optimalTempRange.min}–${crop.optimalTempRange.max}°C).`);
    else if (temp < crop.optimalTempRange.min) cons.push(`Sub-optimal low temperature (${temp}°C) may delay germination.`);
    else if (temp > crop.optimalTempRange.max) cons.push(`High temperature (${temp}°C) may induce thermal stress.`);

    if (phScore > 0.85) pros.push(`Soil pH ${ph} is ideal for root nutrient assimilation.`);
    if (seasonBonus === 1.0) pros.push(`Matches current cropping season (${crop.season}).`);
    else cons.push(`Out of primary season (${crop.season}) — requires microclimate adjustment.`);

    results.push({
      id: crop.id,
      cropName: crop.cropName,
      hindiName: crop.hindiName,
      category: crop.category,
      season: crop.season,
      suitabilityScore: Math.min(99, Math.max(15, overallScore)),
      breakdown: {
        temperatureMatch: Math.round(tempScore * 100),
        humidityMatch: Math.round(humidityScore * 100),
        rainfallMatch: Math.round(rainScore * 100),
        soilPHMatch: Math.round(phScore * 100),
        nutrientAdequacy: Math.round(nutrientScore * 100)
      },
      pros,
      cons,
      keyRisks: crop.weatherRisks.slice(0, 2),
      recommendedVarieties: getRecommendedVarieties(crop.id),
      irrigationAdvice: crop.irrigationGuidance
    });
  }

  // Sort descending by suitability score
  return results.sort((a, b) => b.suitabilityScore - a.suitabilityScore);
}

function getRecommendedVarieties(cropId) {
  const varieties = {
    cotton: ['Bt Cotton BG-II (Bollgard II)', 'RCH-659', 'Ankur-3028', 'DCH-32'],
    groundnut: ['GG-20 (Gujarat Groundnut)', 'TAG-24', 'Kadiri-6', 'TG-37A'],
    wheat: ['HD-2967', 'PBW-502', 'DBW-187 (Karan Vandana)', 'GW-496'],
    rice: ['Pusa Basmati 1121', 'IR-64', 'Swarna (MTU 7029)', 'Samba Mahsuri'],
    maize: ['Pioneer P3396', 'DeKalb 9108', 'HQPM-1', 'Ganga 11'],
    mustard: ['Pusa Bold', 'Giriraj (DRMRIJ-31)', 'Kranti', 'RH-749'],
    soybean: ['JS-335', 'JS-9560', 'NRC-37 (Ahilya 4)', 'RVS 2001-4'],
    sugarcane: ['Co-0238 (Karan 4)', 'Co-86032', 'Co-11015', 'CoLk-94184'],
    tomato: ['Arka Rakshak', 'Pusa Ruby', 'Abhinav (Syngenta)', 'Himsona']
  };
  return varieties[cropId] || ['Certified High-Yielding Hybrid'];
}

/* =========================================================================
 * 2. DISEASE & PEST VULNERABILITY ML RISK CLASSIFIER
 * ========================================================================= */

/**
 * Predicts disease/pest outbreak probabilities for a crop based on live/forecast weather telemetry.
 * 
 * @param {string} cropId
 * @param {object} weatherData - Live weather object with current, hourly, daily metrics
 * @returns {object} Detailed Disease Vulnerability Assessment
 */
export function evaluateDiseaseRisk(cropId = 'cotton', weatherData = {}) {
  const crop = CROP_DATABASE[cropId?.toLowerCase()] || CROP_DATABASE.cotton;
  const current = weatherData.current || { temp: 28, humidity: 80, precipitation: 5, precipitationProbability: 75 };
  const daily = weatherData.daily || [];

  const temp = typeof current.temp === 'number' ? current.temp : 28;
  const humidity = typeof current.humidity === 'number' ? current.humidity : 78;
  const rainProb = typeof current.precipitationProbability === 'number' ? current.precipitationProbability : 60;
  const precipitation = typeof current.precipitation === 'number' ? current.precipitation : 2.5;

  // Calculate consecutive rain days or forecasted wet hours
  const wetDaysCount = daily.filter(d => (d.rainProb || 0) > 55 || (d.precipitation || 0) > 2).length;

  const assessedDiseases = crop.diseases.map(disease => {
    const { minTemp, maxTemp, minHumidity, rainTrigger, waterloggingTrigger, drySpellTrigger } = disease.triggerConditions;

    let probability = 15; // baseline environmental presence

    // Temperature proximity check
    if (temp >= minTemp && temp <= maxTemp) {
      probability += 35;
    } else if (Math.abs(temp - minTemp) <= 3 || Math.abs(temp - maxTemp) <= 3) {
      probability += 18;
    }

    // Humidity threshold check
    if (humidity >= minHumidity) {
      const surplus = humidity - minHumidity;
      probability += Math.min(35, 20 + surplus * 1.5);
    } else if (humidity >= minHumidity - 10) {
      probability += 12;
    }

    // Rain / Wetness trigger
    if (rainTrigger && (rainProb > 60 || precipitation > 5 || wetDaysCount >= 2)) {
      probability += 20;
    }

    // Waterlogging trigger
    if (waterloggingTrigger && (precipitation > 25 || wetDaysCount >= 3)) {
      probability += 25;
    }

    // Dry spell trigger
    if (drySpellTrigger && humidity < 55 && precipitation < 1 && wetDaysCount === 0) {
      probability += 25;
    }

    probability = Math.min(96, Math.max(8, Math.round(probability)));

    let riskLevel = 'LOW';
    let riskColor = '#10b981';
    if (probability >= 75) {
      riskLevel = 'CRITICAL';
      riskColor = '#ef4444';
    } else if (probability >= 50) {
      riskLevel = 'HIGH';
      riskColor = '#f97316';
    } else if (probability >= 30) {
      riskLevel = 'MODERATE';
      riskColor = '#f59e0b';
    }

    return {
      id: disease.id,
      name: disease.name,
      probability: probability,
      riskLevel,
      riskColor,
      symptoms: disease.symptoms,
      triggerAnalysis: {
        tempStatus: (temp >= minTemp && temp <= maxTemp) ? 'Infection Danger Range' : 'Favorable',
        humidityStatus: (humidity >= minHumidity) ? 'Critical Moisture Threshold Exceeded' : 'Safe',
        wetnessStatus: wetDaysCount >= 2 ? 'Prolonged Leaf Wetness Detected' : 'Normal Leaf Aeration'
      },
      organicIntervention: disease.organicRemedy,
      chemicalIntervention: disease.chemicalRemedy,
      urgency: probability >= 60 ? 'Immediate preventative spray within 24-48 hours required.' : 'Routine weekly scouting advised.'
    };
  });

  // Calculate crop-wide composite disease index
  const maxRiskProb = Math.max(...assessedDiseases.map(d => d.probability), 10);
  let overallStatus = 'FAVORABLE / LOW RISK';
  let overallColor = '#10b981';
  if (maxRiskProb >= 75) {
    overallStatus = 'CRITICAL EPIDEMIC ALERT';
    overallColor = '#ef4444';
  } else if (maxRiskProb >= 50) {
    overallStatus = 'HIGH RISK WARNING';
    overallColor = '#f97316';
  } else if (maxRiskProb >= 30) {
    overallStatus = 'MODERATE VULNERABILITY';
    overallColor = '#f59e0b';
  }

  return {
    cropId: crop.id,
    cropName: crop.cropName,
    evaluatedAt: new Date().toISOString(),
    compositeRiskScore: maxRiskProb,
    overallStatus,
    overallColor,
    ambientConditions: {
      temperature: `${temp}°C`,
      relativeHumidity: `${humidity}%`,
      precipitationForecast: `${precipitation} mm (${rainProb}% prob)`,
      wetDaysInWindow: wetDaysCount
    },
    diseases: assessedDiseases
  };
}

/* =========================================================================
 * 3. FAO-56 EVAPOTRANSPIRATION (ETc) & SMART IRRIGATION SCHEDULER
 * ========================================================================= */

/**
 * Calculates Reference Evapotranspiration (ET0 in mm/day) using simplified Hargreaves-Samani method.
 * ET0 = 0.0023 * (Tmean + 17.8) * (Tmax - Tmin)^0.5 * Ra
 */
export function calculateReferenceET0(tempMax = 32, tempMin = 22, latitude = 23.0) {
  const tMean = (tempMax + tempMin) / 2;
  const tempRange = Math.max(1, tempMax - tempMin);
  
  // Approximate extraterrestrial solar radiation (Ra) based on latitude (~15.0 MJ/m2/day for tropical/subtropical)
  const radFactor = 15.2 - Math.abs(latitude) * 0.05;
  const et0 = 0.0023 * (tMean + 17.8) * Math.sqrt(tempRange) * (radFactor * 0.408);
  
  return parseFloat(Math.max(1.5, Math.min(9.5, et0)).toFixed(2));
}

/**
 * Calculates Crop Water Requirement (ETc = Kc * ET0) and issues smart irrigation decisions.
 * 
 * @param {object} params
 * @param {string} params.cropId
 * @param {number} [params.stageIndex=2] - 0: Germination, 1: Vegetative, 2: Flowering, 3: Maturity
 * @param {number} [params.tempMax=32]
 * @param {number} [params.tempMin=22]
 * @param {number} [params.forecastedRain24h=0]
 * @param {number} [params.forecastedRain48h=0]
 * @param {number} [params.latitude=23.02]
 * @returns {object} Smart Irrigation Decision Payload
 */
export function calculateIrrigationAdvisory({
  cropId = 'cotton',
  stageIndex = 2,
  tempMax = 32,
  tempMin = 22,
  forecastedRain24h = 0,
  forecastedRain48h = 0,
  latitude = 23.02
} = {}) {
  const crop = CROP_DATABASE[cropId?.toLowerCase()] || CROP_DATABASE.cotton;
  const safeStageIdx = Math.min(crop.growthStages.length - 1, Math.max(0, stageIndex));
  const currentStage = crop.growthStages[safeStageIdx];

  const et0 = calculateReferenceET0(tempMax, tempMin, latitude);
  const kc = currentStage.kc;
  const etc = parseFloat((et0 * kc).toFixed(2)); // Crop water demand mm/day

  // Effective Rainfall calculation (USDA SCS method)
  const effectiveRain = forecastedRain24h > 4 ? parseFloat((forecastedRain24h * 0.8).toFixed(1)) : 0;
  const totalRain48h = forecastedRain24h + forecastedRain48h;

  // Water deficit = ETc - Effective Rain
  const waterDeficitMm = Math.max(0, parseFloat((etc - effectiveRain).toFixed(2)));
  const waterRequirementLitersPerHectare = Math.round(waterDeficitMm * 10000); // 1 mm/ha = 10,000 Litres

  // Irrigation Decision Logic
  let decision = 'IRRIGATE_NORMAL';
  let holdIrrigation = false;
  let rationale = '';
  let badgeColor = '#3b82f6';

  if (totalRain48h >= 25 || forecastedRain24h >= 20) {
    decision = 'HOLD_IRRIGATION_IMMEDIATELY';
    holdIrrigation = true;
    badgeColor = '#10b981';
    rationale = `Substantial rainfall (${totalRain48h} mm forecasted in next 48h) exceeds soil absorption capacity. Holding irrigation will prevent waterlogging, root asphyxiation, and save up to ${waterRequirementLitersPerHectare.toLocaleString()} L/ha of pumping energy.`;
  } else if (totalRain48h >= 10) {
    decision = 'REDUCE_IRRIGATION_50%';
    holdIrrigation = false;
    badgeColor = '#f59e0b';
    rationale = `Moderate rain (${totalRain48h} mm) expected. Apply light deficit irrigation (50% volume: ~${Math.round(waterRequirementLitersPerHectare / 2).toLocaleString()} L/ha) to top up root-zone moisture without risking standing water.`;
  } else if (tempMax > 38 && etc > 6.0) {
    decision = 'EMERGENCY_COOLING_IRRIGATION';
    holdIrrigation = false;
    badgeColor = '#ef4444';
    rationale = `Extreme thermal heat wave (${tempMax}°C) is creating high atmospheric vapour pressure deficit (ETc = ${etc} mm/day). Provide light evening drip/sprinkler irrigation to suppress canopy heat stress.`;
  } else {
    decision = 'SCHEDULE_NORMAL_IRRIGATION';
    holdIrrigation = false;
    badgeColor = '#3b82f6';
    rationale = `Standard weather conditions. Apply recommended root-zone irrigation volume of ${etc} mm (~${waterRequirementLitersPerHectare.toLocaleString()} L/ha) during early morning or late evening.`;
  }

  return {
    cropId: crop.id,
    cropName: crop.cropName,
    currentStage: {
      name: currentStage.name,
      stageIndex: safeStageIdx,
      cropCoefficientKc: kc,
      durationDays: currentStage.durationDays
    },
    evapotranspiration: {
      referenceET0: `${et0} mm/day`,
      cropWaterDemandETc: `${etc} mm/day`,
      forecastedRainfall: `${totalRain48h} mm in 48h`,
      effectiveRainfall: `${effectiveRain} mm`
    },
    irrigationDecision: {
      directive: decision,
      holdIrrigation,
      badgeColor,
      recommendedVolumeMm: holdIrrigation ? 0 : waterDeficitMm,
      litersPerHectare: holdIrrigation ? 0 : waterRequirementLitersPerHectare,
      rationale,
      optimalIrrigationTime: '06:00 AM – 08:30 AM or 05:30 PM – 07:30 PM'
    }
  };
}

/* =========================================================================
 * 4. GROWING DEGREE DAYS (GDD) & PHENOLOGY ACCUMULATOR
 * ========================================================================= */

/**
 * Calculates Growing Degree Days for a crop given daily temperature history.
 */
export function calculateGDD(tempMax, tempMin, baseTemp = 10.0) {
  const avg = (tempMax + tempMin) / 2;
  return Math.max(0, parseFloat((avg - baseTemp).toFixed(1)));
}
