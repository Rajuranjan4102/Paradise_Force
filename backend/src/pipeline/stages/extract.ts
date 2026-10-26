import { NormalisedData, PipelineInput, ExtractedEntities, StageTelemetry } from '../types';

const BIHAR_DISTRICTS = [
  'Patna Central',
  'Patna Rural',
  'Gaya City',
  'Muzaffarpur North',
  'Bhagalpur East',
  'Darbhanga West',
  'Nalanda',
  'Vaishali',
  'Purnia',
];

const LOCALITIES = [
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
  'Pillar',
  'मोड़',
  'चौक',
  'गोलांबर',
];

const LANDMARKS = [
  'school',
  'hospital',
  'flyover',
  'metro station',
  'junction',
  'railway station',
  'temple',
  'market',
  'college',
  'police station',
  'थाना',
  'अस्पताल',
  'स्कूल',
  'स्टेशन',
  'पुल',
  'मंदिर',
  'बाजार',
];

const CRITICAL_HAZARDS = [
  'spark',
  'fire',
  'blast',
  'electrocution',
  'live wire',
  'cave-in',
  'collapse',
  'explosion',
  'gas leak',
  'चिंगारी',
  'स्पार्क',
  'आग',
  'करंट',
  'धमाका',
  'तार टूटा',
  'हादसा',
  'जान का खतरा',
];

const HIGH_URGENCY = [
  'submerged',
  'ambulance',
  'children',
  'stagnant',
  'accident',
  'choked',
  'foul smell',
  'overflowing',
  'dengue',
  'एंबुलेंस',
  'बच्चे',
  'दुर्घटना',
  'जाम',
  'डेंगू',
  'मच्छर',
];

export function runExtractStage(
  norm: NormalisedData,
  input: PipelineInput
): { entities: ExtractedEntities; telemetry: StageTelemetry } {
  const start = performance.now();

  const text = norm.combinedText;

  // Extract districts
  const matchedDistricts: string[] = [];
  for (const d of BIHAR_DISTRICTS) {
    if (text.includes(d.toLowerCase())) {
      matchedDistricts.push(d);
    }
  }
  if (matchedDistricts.length === 0 && input.district) {
    matchedDistricts.push(input.district);
  }

  // Extract localities
  const matchedLocalities: string[] = [];
  for (const loc of LOCALITIES) {
    if (text.includes(loc.toLowerCase())) {
      matchedLocalities.push(loc);
    }
  }
  if (matchedLocalities.length === 0 && input.locality) {
    matchedLocalities.push(input.locality);
  }

  // Extract landmarks
  const matchedLandmarks: string[] = [];
  for (const lm of LANDMARKS) {
    if (text.includes(lm.toLowerCase())) {
      matchedLandmarks.push(lm);
    }
  }
  if (input.landmark && !matchedLandmarks.includes(input.landmark)) {
    matchedLandmarks.push(input.landmark);
  }

  // Extract critical & high urgency keywords
  const matchedCritical: string[] = [];
  for (const k of CRITICAL_HAZARDS) {
    if (text.includes(k.toLowerCase()) && !matchedCritical.includes(k)) {
      matchedCritical.push(k);
    }
  }

  const matchedHigh: string[] = [];
  for (const k of HIGH_URGENCY) {
    if (text.includes(k.toLowerCase()) && !matchedHigh.includes(k)) {
      matchedHigh.push(k);
    }
  }

  // Location confidence calculation
  let locConfidence = 0.70;
  if (matchedLocalities.length > 0) locConfidence += 0.15;
  if (matchedLandmarks.length > 0) locConfidence += 0.10;
  if (input.latitude && input.longitude) locConfidence += 0.05;
  locConfidence = Math.min(Number(locConfidence.toFixed(2)), 0.99);

  const durationMs = performance.now() - start;

  return {
    entities: {
      districts: matchedDistricts,
      localities: matchedLocalities,
      landmarks: matchedLandmarks,
      criticalHazardKeywords: matchedCritical,
      highUrgencyKeywords: matchedHigh,
      inferredLocationConfidence: locConfidence,
    },
    telemetry: {
      stage: 'EXTRACT',
      timestamp: new Date().toISOString(),
      method: 'DETERMINISTIC_RULES',
      algorithm: 'NamedEntityAndHazardLexiconExtractor',
      confidence: locConfidence,
      durationMs: Number(durationMs.toFixed(2)),
      metadata: {
        criticalHazardCount: matchedCritical.length,
        highUrgencyCount: matchedHigh.length,
        localityCount: matchedLocalities.length,
      },
    },
  };
}
