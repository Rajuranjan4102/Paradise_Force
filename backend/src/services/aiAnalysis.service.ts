import { pipelineOrchestrator } from '../pipeline/pipelineOrchestrator';
import { ExistingIncidentCandidate } from '../pipeline/stages/match';

export interface IAIAnalysisResult {
  category: string;
  categoryConfidence: number;
  priority: string;
  priorityReason: string;
  sentiment: 'Frustrated' | 'Urgent' | 'Neutral' | 'Distressed';
  sentimentScore: number;
  urgencyScore: number;
  entities: {
    locations: string[];
    district?: string;
    landmarks: string[];
    keywords: string[];
  };
  duplicateCheck: {
    isPotentialDuplicate: boolean;
    clusterCandidateId?: string;
    similarityScore: number;
    matchReason?: string;
    matchedGrievanceId?: string;
    matchedTrackingId?: string;
    evidence?: any;
  };
  scoreBreakdown?: any;
  routeRecommendation?: any;
  triggeredAlerts?: any[];
  pipelineTelemetry?: any[];
  engineMode: string;
}

export interface ExistingCaseSummary {
  id: string;
  trackingId: string;
  title: string;
  description: string;
  category: string;
  district: string;
  locality: string;
  latitude: number;
  longitude: number;
  incidentClusterId?: string | null;
}

export interface IAIAnalysisService {
  analyzeComplaint(
    title: string,
    description: string,
    district: string,
    locality: string,
    lat: number,
    lng: number,
    existingCases?: ExistingCaseSummary[]
  ): IAIAnalysisResult;
}

// Bilingual dictionaries for classification
const CATEGORY_LEXICON: Record<string, { en: string[]; hi: string[] }> = {
  ROAD_DAMAGE: {
    en: ['pothole', 'road damaged', 'crater', 'asphalt', 'cave-in', 'broken road', 'highway pit', 'accident risk'],
    hi: ['सड़क', 'गड्ढा', 'डामर', 'रास्ता टूटा', 'दुर्घटना', 'गड्ढे', 'सड़क धंस'],
  },
  WATERLOGGING: {
    en: ['waterlogging', 'flooded', 'submerged', 'drain choked', 'rain water', 'drainage overflow', 'gutter blocked', 'stagnant water'],
    hi: ['जलजमाव', 'नाला जाम', 'पानी भरा', 'डूबा हुआ', 'गंदा पानी सड़क पर', 'नाली ओवरफ्लो'],
  },
  GARBAGE_WASTE: {
    en: ['garbage', 'trash', 'waste dump', 'foul smell', 'stink', 'filth', 'uncollected waste', 'sanitation', 'debris'],
    hi: ['कचरा', 'कूड़ा', 'कूड़ेदान', 'बदबू', 'गंदगी', 'सफाई नहीं', 'कचरे का ढेर'],
  },
  WATER_SUPPLY: {
    en: ['water supply', 'dirty water', 'contaminated tap water', 'pipe burst', 'no drinking water', 'brown water', 'water leakage'],
    hi: ['पेयजल', 'पीने का पानी', 'गंदा पानी', 'पाइप फटा', 'जल आपूर्ति बंद', 'नल से कीचड़'],
  },
  ELECTRICITY: {
    en: ['transformer', 'spark', 'electric wire', 'power cut', 'electrocution', 'hanging wire', 'short circuit', 'low voltage'],
    hi: ['बिजली', 'ट्रांसफार्मर', 'स्पार्क', 'करंट', 'तार टूटा', 'बिजली गुल', 'शॉर्ट सर्किट', 'खंभा'],
  },
  PUBLIC_SAFETY: {
    en: ['dark street', 'street light', 'eve teasing', 'harassment', 'theft', 'unlit road', 'cctv broken', 'patrolling needed'],
    hi: ['अंधेरा', 'स्ट्रीट लाइट', 'छेड़खानी', 'चोरी', 'सुरक्षा', 'रोशनी नहीं', 'गश्त'],
  },
  HEALTH_SANITATION: {
    en: ['dengue', 'mosquitoes', 'fogging', 'epidemic', 'stray dogs', 'open drainage infection'],
    hi: ['डेंगू', 'मच्छर', 'फॉगिंग', 'बीमारी', 'आवारा कुत्ते', 'महामारी'],
  },
};

const CRITICAL_KEYWORDS = {
  en: ['spark', 'fire', 'blast', 'electrocution', 'hospital', 'collapse', 'death', 'deadly', 'live wire', 'emergency', 'ambulance'],
  hi: ['आग', 'ब्लास्ट', 'करंट', 'अस्पताल', 'धमाका', 'मौत', 'जान का खतरा', 'आपातकाल', 'तार गिरा'],
};

const HIGH_KEYWORDS = {
  en: ['severe', 'urgent', 'school', 'children', 'accident', 'danger', 'overflow', 'contamination', 'blocked traffic'],
  hi: ['खतरा', 'गंभीर', 'स्कूल', 'बच्चे', 'दुर्घटना', 'जाम', 'बीमार'],
};

const BIHAR_LOCALITIES = [
  'Bailey Road',
  'Kankarbagh',
  'Boring Canal Road',
  'Fraser Road',
  'Anisabad',
  'Rajendra Nagar',
  'Zero Mile',
  'Station Road',
  'Ashok Rajpath',
  'Danapur',
  'Saguna More',
  'Dak Bungalow',
  'Rukanpura',
  'Boring Road',
];

export class AIAnalysisService implements IAIAnalysisService {
  /**
   * Genuine, testable 8-stage grievance intelligence pipeline:
   * INGEST -> NORMALISE -> CLASSIFY -> EXTRACT -> MATCH -> SCORE -> ROUTE -> ALERT
   */
  public analyzeComplaint(
    title: string,
    description: string,
    district: string,
    locality: string,
    lat: number,
    lng: number,
    existingCases: ExistingCaseSummary[] = []
  ): IAIAnalysisResult {
    const candidates: ExistingIncidentCandidate[] = existingCases.map(c => ({
      id: c.id,
      trackingId: c.trackingId,
      title: c.title,
      description: c.description,
      category: c.category,
      latitude: c.latitude,
      longitude: c.longitude,
      district: c.district,
      locality: c.locality,
      createdAt: new Date(),
      incidentClusterId: c.incidentClusterId,
    }));

    const pipeResult = pipelineOrchestrator.execute(
      {
        title,
        description,
        complainantName: 'Citizen',
        complainantPhone: '',
        latitude: lat,
        longitude: lng,
        district,
        locality,
        address: `${locality}, ${district}`,
      },
      candidates
    );

    // Compute sentiment from hazard & urgency
    let sentiment: 'Frustrated' | 'Urgent' | 'Neutral' | 'Distressed' = 'Neutral';
    let sentimentScore = -0.2;
    if (pipeResult.extract.criticalHazardKeywords.length > 0) {
      sentiment = 'Distressed';
      sentimentScore = -0.85;
    } else if (pipeResult.score.priority === 'CRITICAL' || pipeResult.score.priority === 'HIGH') {
      sentiment = 'Urgent';
      sentimentScore = -0.65;
    } else if (title.includes('no response') || description.includes('days') || description.includes('परेशान')) {
      sentiment = 'Frustrated';
      sentimentScore = -0.55;
    }

    const urgencyScore =
      pipeResult.score.priority === 'CRITICAL'
        ? 10
        : pipeResult.score.priority === 'HIGH'
        ? 8
        : Math.min(Math.max(Math.round(pipeResult.score.totalScore / 10), 1), 10);

    return {
      category: pipeResult.classify.category,
      categoryConfidence: pipeResult.classify.confidence,
      priority: pipeResult.score.priority,
      priorityReason: pipeResult.score.primaryReason,
      sentiment,
      sentimentScore,
      urgencyScore,
      entities: {
        locations: pipeResult.extract.localities,
        district: pipeResult.extract.districts[0] || district,
        landmarks: pipeResult.extract.landmarks,
        keywords: [...pipeResult.extract.criticalHazardKeywords, ...pipeResult.extract.highUrgencyKeywords],
      },
      duplicateCheck: {
        isPotentialDuplicate: pipeResult.match.isDuplicateCandidate,
        clusterCandidateId: pipeResult.match.recommendedClusterId,
        similarityScore: pipeResult.match.topMatch?.compositeScore || 0,
        matchReason: pipeResult.match.topMatch?.explanation,
        matchedGrievanceId: pipeResult.match.topMatch?.matchedGrievanceId,
        matchedTrackingId: pipeResult.match.topMatch?.matchedTrackingId,
        evidence: pipeResult.match.topMatch,
      },
      scoreBreakdown: pipeResult.score,
      routeRecommendation: pipeResult.route,
      triggeredAlerts: pipeResult.alert.triggeredAlerts,
      pipelineTelemetry: pipeResult.telemetry,
      engineMode: pipeResult.classify.method,
    };
  }

  private classifyCategory(text: string): { category: string; confidence: number } {
    let bestCategory = 'ROAD_DAMAGE';
    let maxMatches = 0;

    for (const [cat, words] of Object.entries(CATEGORY_LEXICON)) {
      let matches = 0;
      for (const w of words.en) {
        if (text.includes(w.toLowerCase())) matches += 2;
      }
      for (const w of words.hi) {
        if (text.includes(w)) matches += 2;
      }

      if (matches > maxMatches) {
        maxMatches = matches;
        bestCategory = cat;
      }
    }

    const confidence = maxMatches > 0 ? Math.min(0.70 + maxMatches * 0.05, 0.98) : 0.65;
    return { category: bestCategory, confidence: Number(confidence.toFixed(2)) };
  }

  private analyzeSentiment(text: string): {
    sentiment: 'Frustrated' | 'Urgent' | 'Neutral' | 'Distressed';
    sentimentScore: number;
    urgencyScore: number;
  } {
    let criticalScore = 0;
    let highUrgencyScore = 0;

    for (const w of CRITICAL_KEYWORDS.en) {
      if (text.includes(w)) criticalScore += 3;
    }
    for (const w of CRITICAL_KEYWORDS.hi) {
      if (text.includes(w)) criticalScore += 3;
    }

    for (const w of HIGH_KEYWORDS.en) {
      if (text.includes(w)) highUrgencyScore += 1.5;
    }
    for (const w of HIGH_KEYWORDS.hi) {
      if (text.includes(w)) highUrgencyScore += 1.5;
    }

    let urgency = 4; // base moderate urgency
    if (criticalScore > 0) {
      urgency = Math.min(8 + criticalScore, 10);
    } else if (highUrgencyScore > 0) {
      urgency = Math.min(5 + Math.floor(highUrgencyScore), 8);
    }

    let sentiment: 'Frustrated' | 'Urgent' | 'Neutral' | 'Distressed' = 'Neutral';
    let sentimentScore = 0.0;

    if (criticalScore >= 3) {
      sentiment = 'Distressed';
      sentimentScore = -0.85;
    } else if (urgency >= 7) {
      sentiment = 'Urgent';
      sentimentScore = -0.70;
    } else if (text.includes('days') || text.includes('no response') || text.includes('महीनों से') || text.includes('परेशान')) {
      sentiment = 'Frustrated';
      sentimentScore = -0.60;
    } else {
      sentiment = 'Neutral';
      sentimentScore = -0.20;
    }

    return { sentiment, sentimentScore, urgencyScore: urgency };
  }

  private extractEntities(
    text: string,
    fallbackDistrict: string,
    fallbackLocality: string
  ): {
    locations: string[];
    district?: string;
    landmarks: string[];
    keywords: string[];
  } {
    const locations: string[] = [];
    const landmarks: string[] = [];
    const keywords: string[] = [];

    // Detect known localities
    for (const loc of BIHAR_LOCALITIES) {
      if (text.includes(loc.toLowerCase())) {
        locations.push(loc);
      }
    }
    if (locations.length === 0 && fallbackLocality) {
      locations.push(fallbackLocality);
    }

    // Detect landmarks
    const landmarkPatterns = ['school', 'hospital', 'flyover', 'metro station', 'station', 'temple', 'school', 'market', 'चौराहा', 'पुल', 'अस्पताल'];
    for (const lm of landmarkPatterns) {
      if (text.includes(lm)) {
        landmarks.push(lm);
      }
    }

    // Detect matched keywords
    const allKeyWords = [...CRITICAL_KEYWORDS.en, ...CRITICAL_KEYWORDS.hi, ...HIGH_KEYWORDS.en, ...HIGH_KEYWORDS.hi];
    for (const kw of allKeyWords) {
      if (text.includes(kw) && !keywords.includes(kw)) {
        keywords.push(kw);
      }
    }

    return {
      locations,
      district: fallbackDistrict,
      landmarks,
      keywords: keywords.slice(0, 8),
    };
  }

  private detectDuplicates(
    text: string,
    category: string,
    district: string,
    locality: string,
    lat: number,
    lng: number,
    existingCases: ExistingCaseSummary[]
  ): {
    isPotentialDuplicate: boolean;
    clusterCandidateId?: string;
    similarityScore: number;
    matchReason?: string;
  } {
    if (!existingCases || existingCases.length === 0) {
      return { isPotentialDuplicate: false, similarityScore: 0.0 };
    }

    let highestScore = 0;
    let matchedCase: ExistingCaseSummary | null = null;
    let reason = '';

    for (const existing of existingCases) {
      // 1. Must share category or locality
      const sameCategory = existing.category === category;
      const sameLocality = existing.locality.toLowerCase() === locality.toLowerCase();
      const sameDistrict = existing.district.toLowerCase() === district.toLowerCase();

      // 2. Geographic distance in km
      const distanceKm = this.calculateDistanceKm(lat, lng, existing.latitude, existing.longitude);

      if (sameDistrict && distanceKm < 1.0) {
        // Compute text token overlap
        const wordsA = new Set(text.split(/\s+/).filter(w => w.length > 3));
        const existingTokens = `${existing.title} ${existing.description}`.toLowerCase().split(/\s+/).filter(w => w.length > 3);
        let overlap = 0;
        for (const token of existingTokens) {
          if (wordsA.has(token)) overlap++;
        }

        const jaccard = overlap / Math.max(wordsA.size + existingTokens.length - overlap, 1);
        let compositeScore = (sameCategory ? 0.35 : 0.0) + (sameLocality ? 0.25 : 0.0) + (distanceKm < 0.3 ? 0.25 : 0.10) + jaccard * 0.30;
        compositeScore = Math.min(Number(compositeScore.toFixed(2)), 0.96);

        if (compositeScore > highestScore) {
          highestScore = compositeScore;
          matchedCase = existing;
          reason = `High spatial proximity (${(distanceKm * 1000).toFixed(0)}m) and matching incident type with ${existing.trackingId}`;
        }
      }
    }

    const isDuplicate = highestScore >= 0.60;

    return {
      isPotentialDuplicate: isDuplicate,
      clusterCandidateId: matchedCase?.incidentClusterId || undefined,
      similarityScore: highestScore,
      matchReason: isDuplicate ? reason : undefined,
    };
  }

  private computePriority(
    category: string,
    urgencyScore: number,
    isDuplicateCandidate: boolean,
    keywords: string[]
  ): { priority: string; priorityReason: string } {
    if (urgencyScore >= 9 || keywords.some(k => ['spark', 'fire', 'blast', 'electrocution', 'करंट', 'आग'].includes(k))) {
      return {
        priority: 'CRITICAL',
        priorityReason: 'Immediate public safety risk detected (electrical hazard or structural emergency)',
      };
    }

    if (urgencyScore >= 7 || isDuplicateCandidate) {
      return {
        priority: 'HIGH',
        priorityReason: isDuplicateCandidate
          ? 'Multiple citizen reports detected for the same localized incident cluster'
          : 'High civic disruption and urgency indicators detected',
      };
    }

    if (urgencyScore >= 5 || ['ROAD_DAMAGE', 'WATERLOGGING'].includes(category)) {
      return {
        priority: 'MEDIUM',
        priorityReason: 'Standard civic infrastructure disruption requiring scheduled inspection',
      };
    }

    return {
      priority: 'LOW',
      priorityReason: 'Routine grievance with no acute hazards identified',
    };
  }

  private calculateDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Earth's radius in km
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }
}

export const aiAnalysisService = new AIAnalysisService();
