import {
  INLPModelAdapter,
  StructuredNLPAnalysis,
  CivicCategory,
  SentimentLabel,
  LanguageCode,
} from './types';

interface Prototype {
  category: CivicCategory;
  terms: Record<string, number>;
}

const CATEGORY_PROTOTYPES: Prototype[] = [
  {
    category: 'ROAD_DAMAGE',
    terms: {
      pothole: 3.5, crater: 3.0, road: 2.5, asphalt: 2.5, broken: 2.0, tar: 2.0, subsidence: 3.0,
      skid: 2.0, accident: 1.5, cave: 2.0, pit: 2.0, street: 1.5, paving: 2.0,
      गड्ढा: 4.0, गड्ढे: 4.0, सड़क: 3.0, डामर: 2.5, रास्ता: 2.0, टूटा: 2.0, धंस: 3.0, दुर्घटना: 2.0,
    },
  },
  {
    category: 'WATERLOGGING',
    terms: {
      waterlogging: 4.0, flooded: 3.5, flood: 3.5, drain: 2.5, drainage: 3.0, submerged: 3.5,
      culvert: 3.0, choked: 2.5, overflow: 2.5, gutter: 2.5, stagnant: 2.5, sump: 3.0, puddle: 2.5,
      जलजमाव: 4.5, 'नाला जाम': 3.5, 'पानी भरा': 3.5, 'गंदा पानी': 3.0, नाली: 2.5, डूबा: 3.0,
      कीचड़: 2.5, जलभराव: 4.0,
    },
  },
  {
    category: 'WATER_SUPPLY',
    terms: {
      'water supply': 3.5, pipeline: 3.5, tap: 2.5, pipe: 2.5, burst: 3.0, leak: 2.5,
      contaminated: 3.0, drinking: 2.5, potable: 3.0, phed: 3.0, valve: 2.5, dry: 2.0,
      पेयजल: 3.5, 'पीने का पानी': 3.5, 'पाइप फटा': 3.5, नल: 2.5, 'जल आपूर्ति': 3.0, सप्लाई: 2.0, रिसाव: 2.5,
    },
  },
  {
    category: 'ELECTRICITY',
    terms: {
      transformer: 4.0, spark: 3.5, electric: 2.5, electricity: 3.0, wire: 2.5, blackout: 2.5,
      feeder: 3.0, electrocution: 4.0, voltage: 2.5, bsphcl: 3.0, pole: 2.5, hanging: 2.5, short: 2.5,
      power: 2.0, fuse: 2.5, current: 3.0, shock: 3.0,
      ट्रांसफार्मर: 4.5, स्पार्क: 3.5, करंट: 3.5, बिजली: 3.0, तार: 2.5, 'हाई वोल्टेज': 3.5,
      खंभा: 2.5, चिंगारी: 3.5, अंधेरा: 2.0,
    },
  },
  {
    category: 'GARBAGE_WASTE',
    terms: {
      garbage: 3.5, waste: 3.0, trash: 3.0, dump: 3.0, dumping: 3.0, stench: 3.0, stenchs: 3.0,
      sanitation: 2.5, litter: 2.5, bin: 2.0, rot: 2.5, rotten: 2.5, uncleaned: 3.0,
      कचरा: 4.0, कूड़ा: 4.0, दुर्गंध: 3.5, बदबू: 3.5, डंप: 3.0, गंदगी: 3.0, सड़ांध: 3.5, सफ़ाई: 2.0,
    },
  },
  {
    category: 'PUBLIC_SAFETY',
    terms: {
      manhole: 3.5, uncovered: 3.5, open: 2.0, hazard: 3.0, dangerous: 3.0, collapsed: 3.5,
      fall: 2.0, pedestrian: 2.0, barricade: 2.5, railing: 2.5, fatal: 3.5,
      मैनहोल: 4.0, खुला: 2.5, ख़तरा: 3.0, दुर्घटना: 2.5, गिरा: 2.0, ढक्कन: 3.0, 'बिना ढक्कन': 3.5,
    },
  },
  {
    category: 'HEALTH_SANITATION',
    terms: {
      dengue: 3.5, mosquitoes: 3.5, pest: 3.0, infection: 3.0, disease: 3.0, stagnant: 2.5,
      fumigation: 3.5, spray: 2.5, malaria: 3.5, epidemic: 3.5, larvae: 3.5,
      डेंगू: 4.0, मच्छर: 3.5, बीमारी: 3.0, छिड़काव: 3.5, संक्रमण: 3.0, मलेरिया: 3.5,
    },
  },
  {
    category: 'INFRASTRUCTURE',
    terms: {
      bridge: 3.5, culvert: 3.0, railing: 3.0, wall: 2.5, crack: 2.5, fissure: 3.0, footbridge: 3.5,
      pedestrian: 2.0, divider: 2.5, flyover: 3.0, pillar: 3.0, foundation: 3.0,
      पुल: 3.5, पुलिया: 3.0, रेलिंग: 3.0, दीवार: 2.5, दरार: 3.0, फ्लाइओवर: 3.0, खंभा: 2.5,
    },
  },
];

const KNOWN_BIHAR_DISTRICTS = [
  'patna', 'gaya', 'muzaffarpur', 'bhagalpur', 'darbhanga', 'purnia',
  'begusarai', 'saharsa', 'rohtas', 'nalanda', 'vaishali', 'samastipur',
  'chapra', 'saran', 'motihari', 'bettiah', 'katihar', 'siwan', 'arrah', 'bhojpur',
];

interface LandmarkItem {
  canonicalName: string;
  terms: string[];
}

const KNOWN_LANDMARKS: LandmarkItem[] = [
  { canonicalName: 'Dak Bunglow Chauraha', terms: ['dak bunglow', 'dak bangla', 'डाक बंगला', 'डाकबंगला'] },
  { canonicalName: 'Bailey Road', terms: ['bailey road', 'बेली रोड', 'नेहरू पथ'] },
  { canonicalName: 'Boring Road', terms: ['boring road', 'बोरिंग रोड'] },
  { canonicalName: 'Kankarbagh', terms: ['kankarbagh', 'कंकड़बाग'] },
  { canonicalName: 'Gandhi Maidan', terms: ['gandhi maidan', 'गांधी मैदान'] },
  { canonicalName: 'Rajendra Nagar', terms: ['rajendra nagar', 'राजेन्द्र नगर', 'राजेंद्र नगर'] },
  { canonicalName: 'Saguna More', terms: ['saguna more', 'सगना मोड़', 'सगुना मोड़'] },
  { canonicalName: 'Danapur', terms: ['danapur', 'दानापुर'] },
  { canonicalName: 'Ashok Rajpath', terms: ['ashok rajpath', 'अशोक राजपथ'] },
  { canonicalName: 'Fraser Road', terms: ['fraser road', 'frazer road', 'फ्रेजर रोड'] },
  { canonicalName: 'Patliputra', terms: ['patliputra', 'पाटलिपुत्र'] },
  { canonicalName: 'Anisabad', terms: ['anisabad', 'अनिसाबाद'] },
];

export class LocalRuleTfidfAdapter implements INLPModelAdapter {
  public readonly providerName = 'LOCAL_TFIDF_RULES';
  public readonly modelVersion = 'janraksha-bilingual-v3.2';

  public async isAvailable(): Promise<boolean> {
    return true; // Always operational locally
  }

  public async analyze(text: string, title: string = ''): Promise<StructuredNLPAnalysis> {
    const startTime = performance.now();
    const combined = `${title} ${text}`.trim();
    const lower = combined.toLowerCase();

    // 1. Language Identification
    const hasDevanagari = /[\u0900-\u097F]/.test(combined);
    const hasBhojpuriMarkers = /\b(baani|ba|hum|tohar|rowa|baba|bawe|rahe|kareke|dekhab)\b/i.test(lower);
    const detectedLanguage: LanguageCode = hasBhojpuriMarkers
      ? 'bho'
      : hasDevanagari
      ? 'hi'
      : 'en';

    // 2. Bilingual Classification via Cosine / Scoring Matrix
    const scores: Record<CivicCategory, number> = {
      ROAD_DAMAGE: 0,
      WATERLOGGING: 0,
      WATER_SUPPLY: 0,
      ELECTRICITY: 0,
      GARBAGE_WASTE: 0,
      PUBLIC_SAFETY: 0,
      HEALTH_SANITATION: 0,
      INFRASTRUCTURE: 0,
      OTHER_CIVIC: 0.1,
    };

    for (const proto of CATEGORY_PROTOTYPES) {
      for (const [term, weight] of Object.entries(proto.terms)) {
        if (lower.includes(term.toLowerCase())) {
          scores[proto.category] += weight;
        }
      }
    }

    const sortedCats = Object.entries(scores).sort((a, b) => b[1] - a[1]) as [CivicCategory, number][];
    const top = sortedCats[0];
    const second = sortedCats[1];

    let category: CivicCategory = top[1] > 0.4 ? top[0] : 'OTHER_CIVIC';
    let confidence = top[1] > 0.4 ? Math.min(0.98, Math.max(0.65, top[1] / 8.0)) : 0.50;
    const secondaryCategory = second && second[1] > 1.0 ? second[0] : undefined;

    // 3. Sentiment & Urgency Scoring
    const urgentKeywords = ['urgent', 'emergency', 'danger', 'hazard', 'spark', 'current', 'fire', 'blast', 'death', 'hospital', 'हादसा', 'आग', 'खतरा', 'करंट', 'तुरंत', 'जानलेवा'];
    const frustratedKeywords = ['pathetic', 'useless', 'repeated', 'ignored', 'complained', 'shame', 'worst', 'लापरवाही', 'परेशान', 'कोई नहीं सुनता', 'बेशर्म'];
    const distressedKeywords = ['submerged', 'suffering', 'sick', 'children', 'crying', 'drowning', 'बीमार', 'बच्चे', 'डूबा', 'मदद'];

    let isUrgent = urgentKeywords.some(k => lower.includes(k));
    let isFrustrated = frustratedKeywords.some(k => lower.includes(k));
    let isDistressed = distressedKeywords.some(k => lower.includes(k));

    let sentiment: SentimentLabel = 'Neutral';
    let sentimentScore = 0.0;
    let urgencyScore = 4;

    if (isUrgent) {
      sentiment = 'Urgent';
      sentimentScore = -0.7;
      urgencyScore = 9;
    } else if (isDistressed) {
      sentiment = 'Distressed';
      sentimentScore = -0.8;
      urgencyScore = 8;
    } else if (isFrustrated) {
      sentiment = 'Frustrated';
      sentimentScore = -0.6;
      urgencyScore = 6;
    } else {
      sentiment = 'Neutral';
      sentimentScore = -0.1;
      urgencyScore = 4;
    }

    // 4. Entity & Keyword Extraction
    const extractedDistricts: string[] = [];
    for (const d of KNOWN_BIHAR_DISTRICTS) {
      if (lower.includes(d)) {
        extractedDistricts.push(d.charAt(0).toUpperCase() + d.slice(1));
      }
    }

    const extractedLandmarks: string[] = [];
    for (const lm of KNOWN_LANDMARKS) {
      if (lm.terms.some(term => lower.includes(term.toLowerCase()))) {
        extractedLandmarks.push(lm.canonicalName);
      }
    }

    const matchedKeywords: string[] = [];
    for (const kw of [...urgentKeywords, ...frustratedKeywords, ...distressedKeywords]) {
      if (lower.includes(kw) && !matchedKeywords.includes(kw)) {
        matchedKeywords.push(kw);
      }
    }

    const latencyMs = Number((performance.now() - startTime).toFixed(2));

    return {
      category,
      confidence: Number(confidence.toFixed(2)),
      secondaryCategory,
      sentiment,
      sentimentScore,
      urgencyScore,
      detectedLanguage,
      entities: {
        locations: extractedLandmarks,
        districts: extractedDistricts,
        landmarks: extractedLandmarks,
        keywords: matchedKeywords.slice(0, 10),
      },
      summary: `${category.replace(/_/g, ' ')} detected with ${sentiment} sentiment (${detectedLanguage.toUpperCase()})`,
      modelProvider: this.providerName,
      modelVersion: this.modelVersion,
      latencyMs,
    };
  }
}

export const localRuleAdapter = new LocalRuleTfidfAdapter();
