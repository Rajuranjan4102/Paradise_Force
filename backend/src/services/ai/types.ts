import { z } from 'zod';

export const CivicCategorySchema = z.enum([
  'ROAD_DAMAGE',
  'WATERLOGGING',
  'WATER_SUPPLY',
  'ELECTRICITY',
  'GARBAGE_WASTE',
  'PUBLIC_SAFETY',
  'HEALTH_SANITATION',
  'INFRASTRUCTURE',
  'OTHER_CIVIC',
]);
export type CivicCategory = z.infer<typeof CivicCategorySchema>;

export const SentimentLabelSchema = z.enum(['Frustrated', 'Urgent', 'Neutral', 'Distressed']);
export type SentimentLabel = z.infer<typeof SentimentLabelSchema>;

export const LanguageCodeSchema = z.enum(['en', 'hi', 'bho', 'unsupported']);
export type LanguageCode = z.infer<typeof LanguageCodeSchema>;

export const StructuredNLPAnalysisSchema = z.object({
  category: CivicCategorySchema,
  confidence: z.number().min(0).max(1),
  secondaryCategory: CivicCategorySchema.optional(),
  sentiment: SentimentLabelSchema,
  sentimentScore: z.number().min(-1).max(1),
  urgencyScore: z.number().min(1).max(10),
  detectedLanguage: LanguageCodeSchema,
  entities: z.object({
    locations: z.array(z.string()).default([]),
    districts: z.array(z.string()).default([]),
    landmarks: z.array(z.string()).default([]),
    keywords: z.array(z.string()).default([]),
  }),
  summary: z.string(),
  modelProvider: z.string(),
  modelVersion: z.string(),
  latencyMs: z.number().nonnegative(),
});
export type StructuredNLPAnalysis = z.infer<typeof StructuredNLPAnalysisSchema>;

export const DetectedIssueSchema = z.object({
  issue: z.string(),
  confidence: z.number().min(0).max(1),
  severity: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']),
  boundingBoxDesc: z.string().optional(),
});
export type DetectedIssue = z.infer<typeof DetectedIssueSchema>;

export const StructuredVisionAnalysisSchema = z.object({
  hasVisualEvidence: z.boolean(),
  mediaType: z.enum(['IMAGE', 'VIDEO', 'NONE']),
  detectedCivicIssues: z.array(DetectedIssueSchema),
  observedObjects: z.array(z.string()),
  overallVisualSeverity: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']),
  recommendedCategory: CivicCategorySchema,
  framesSampled: z.number().optional(),
  modelObservationsSummary: z.string(),
  modelConfidence: z.number().min(0).max(1),
  modelName: z.string(),
  analyzedAt: z.string(),
});
export type StructuredVisionAnalysis = z.infer<typeof StructuredVisionAnalysisSchema>;

export interface INLPModelAdapter {
  readonly providerName: string;
  readonly modelVersion: string;
  analyze(text: string, title?: string): Promise<StructuredNLPAnalysis>;
  isAvailable(): Promise<boolean>;
}

export interface IVisionModelAdapter {
  readonly providerName: string;
  analyzeMedia(
    filePath: string,
    mimeType: string,
    originalName: string
  ): Promise<StructuredVisionAnalysis>;
}

export type LocationProvenance =
  | 'GPS_EXACT'
  | 'GEOCODED_ADDRESS'
  | 'LOCALITY_CENTROID'
  | 'DISTRICT_CENTROID'
  | 'UNRESOLVED';

export interface GeocodingResult {
  latitude: number | null;
  longitude: number | null;
  locality: string;
  district: string;
  provenance: LocationProvenance;
  confidence: number;
  matchedName?: string;
  isResolved: boolean;
  notes?: string;
}
