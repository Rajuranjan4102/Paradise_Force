export type PipelineMethod = 'REAL_LOCAL_MODEL' | 'DETERMINISTIC_RULES' | 'SYNTHETIC_DEMO';

export type StageName =
  | 'INGEST'
  | 'NORMALISE'
  | 'CLASSIFY'
  | 'EXTRACT'
  | 'MATCH'
  | 'SCORE'
  | 'ROUTE'
  | 'ALERT';

export interface StageTelemetry {
  stage: StageName;
  timestamp: string;
  method: PipelineMethod;
  algorithm: string;
  confidence?: number;
  durationMs: number;
  metadata?: Record<string, any>;
}

export interface PipelineInput {
  title: string;
  description: string;
  complainantName: string;
  complainantPhone: string;
  isAnonymous?: boolean;
  originalLanguage?: string;
  latitude: number;
  longitude: number;
  address: string;
  locality: string;
  landmark?: string;
  district: string;
  pincode?: string;
  createdAt?: Date;
}

export interface NormalisedData {
  cleanTitle: string;
  cleanDescription: string;
  combinedText: string;
  detectedLanguage: 'en' | 'hi' | 'unsupported';
  tokens: string[];
  ngrams: string[];
}

export interface ClassificationResult {
  category: string;
  confidence: number;
  method: PipelineMethod;
  algorithm: string;
  secondaryCategory?: string;
  languageSupported: boolean;
  explanation: string;
}

export interface ExtractedEntities {
  districts: string[];
  localities: string[];
  landmarks: string[];
  criticalHazardKeywords: string[];
  highUrgencyKeywords: string[];
  inferredLocationConfidence: number;
}

export interface MatchEvidence {
  matchedGrievanceId: string;
  matchedTrackingId: string;
  clusterId?: string | null;
  textSimilarity: number;
  categoryAgreement: boolean;
  spatialDistanceMeters: number;
  spatialScore: number;
  timeDeltaHours: number;
  timeScore: number;
  compositeScore: number;
  explanation: string;
}

export interface MatchResult {
  isDuplicateCandidate: boolean;
  topMatch?: MatchEvidence;
  allMatches: MatchEvidence[];
  recommendedClusterId?: string;
  clusterAction: 'LINK_EXISTING' | 'CREATE_NEW' | 'STANDALONE';
}

export interface PriorityScoreBreakdown {
  baseHazardScore: number;      // 0 - 30
  reportVolumeScore: number;    // 0 - 25
  recurrenceVelocityScore: number; // 0 - 15
  slaUrgencyScore: number;      // 0 - 15
  geoSpreadScore: number;       // 0 - 10
  evidenceQualityScore: number; // 0 - 5
  totalScore: number;           // 0 - 100
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  primaryReason: string;
  overridden?: boolean;
  overrideReason?: string;
}

export interface RoutingRecommendation {
  departmentCode: string;
  departmentName?: string;
  departmentId?: string;
  slaHours: number;
  routingReason: string;
  requiresHumanConfirmation: boolean;
  jurisdictionOffice: string;
}

export interface AlertTriggerResult {
  triggeredAlerts: {
    title: string;
    message: string;
    severity: 'INFO' | 'WARNING' | 'CRITICAL';
    type: string;
    district: string;
    trigger: string;
    supportingCaseIds: string[];
  }[];
}

export interface PipelineExecutionResult {
  ingest: PipelineInput;
  normalise: NormalisedData;
  classify: ClassificationResult;
  extract: ExtractedEntities;
  match: MatchResult;
  score: PriorityScoreBreakdown;
  route: RoutingRecommendation;
  alert: AlertTriggerResult;
  telemetry: StageTelemetry[];
  pipelineExecutionDurationMs: number;
}
