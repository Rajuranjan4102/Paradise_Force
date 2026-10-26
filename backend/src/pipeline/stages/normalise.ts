import { PipelineInput, NormalisedData, StageTelemetry } from '../types';

export function runIngestStage(input: PipelineInput): { input: PipelineInput; telemetry: StageTelemetry } {
  const start = performance.now();

  // Validate coordinates within Bihar & India bounds
  const validLat = Math.min(Math.max(input.latitude || 25.5941, 23.0), 28.5);
  const validLng = Math.min(Math.max(input.longitude || 85.1376, 82.5), 88.5);

  const sanitizedInput: PipelineInput = {
    ...input,
    title: (input.title || '').trim(),
    description: (input.description || '').trim(),
    complainantName: (input.complainantName || 'Citizen').trim(),
    complainantPhone: (input.complainantPhone || 'Unknown').trim(),
    latitude: validLat,
    longitude: validLng,
    district: (input.district || 'Patna Central').trim(),
    locality: (input.locality || 'Central').trim(),
    address: (input.address || `${input.locality}, ${input.district}`).trim(),
    createdAt: input.createdAt || new Date(),
  };

  const durationMs = performance.now() - start;

  return {
    input: sanitizedInput,
    telemetry: {
      stage: 'INGEST',
      timestamp: new Date().toISOString(),
      method: 'DETERMINISTIC_RULES',
      algorithm: 'BoundaryValidationAndSchemaIngress',
      confidence: 1.0,
      durationMs: Number(durationMs.toFixed(2)),
      metadata: { coordinatesBounded: validLat === input.latitude },
    },
  };
}

export function runNormaliseStage(input: PipelineInput): { data: NormalisedData; telemetry: StageTelemetry } {
  const start = performance.now();

  const rawTitle = input.title;
  const rawDesc = input.description;

  // Detect script/language
  const devanagariRegex = /[\u0900-\u097F]/;
  const englishRegex = /[a-zA-Z]/;

  const hasHindi = devanagariRegex.test(rawTitle + rawDesc);
  const hasEnglish = englishRegex.test(rawTitle + rawDesc);

  let detectedLanguage: 'en' | 'hi' | 'unsupported' = 'en';
  if (hasHindi) {
    detectedLanguage = 'hi';
  } else if (!hasEnglish) {
    detectedLanguage = 'unsupported';
  }

  // Unicode NFC Normalization
  let cleanTitle = rawTitle.normalize('NFC').replace(/[^\w\s\u0900-\u097F.,-]/g, ' ');
  let cleanDescription = rawDesc.normalize('NFC').replace(/[^\w\s\u0900-\u097F.,-]/g, ' ');

  // Standardize common Hindi phonetic variations in civic complaints
  cleanTitle = cleanTitle
    .replace(/ट्रान्सफॉर्मर/g, 'ट्रांसफार्मर')
    .replace(/गढ्ढा/g, 'गड्ढा')
    .replace(/बिजली का तार/g, 'बिजली तार')
    .replace(/पानी जमा/g, 'जलजमाव');

  cleanDescription = cleanDescription
    .replace(/ट्रान्सफॉर्मर/g, 'ट्रांसफार्मर')
    .replace(/गढ्ढा/g, 'गड्ढा')
    .replace(/बिजली का तार/g, 'बिजली तार')
    .replace(/पानी जमा/g, 'जलजमाव');

  const combinedText = `${cleanTitle} ${cleanDescription}`.toLowerCase();

  // Tokenization (unigrams)
  const tokens = combinedText
    .split(/[\s,.;:!?()-]+/)
    .map(t => t.trim())
    .filter(t => t.length > 2);

  // Bigrams for key phrase extraction
  const ngrams: string[] = [];
  for (let i = 0; i < tokens.length - 1; i++) {
    ngrams.push(`${tokens[i]} ${tokens[i + 1]}`);
  }

  const durationMs = performance.now() - start;

  return {
    data: {
      cleanTitle,
      cleanDescription,
      combinedText,
      detectedLanguage,
      tokens,
      ngrams,
    },
    telemetry: {
      stage: 'NORMALISE',
      timestamp: new Date().toISOString(),
      method: 'DETERMINISTIC_RULES',
      algorithm: 'UnicodeNFCNormalizerAndBilingualNGramTokenizer',
      confidence: detectedLanguage !== 'unsupported' ? 0.98 : 0.60,
      durationMs: Number(durationMs.toFixed(2)),
      metadata: {
        detectedLanguage,
        tokenCount: tokens.length,
        ngramCount: ngrams.length,
      },
    },
  };
}
