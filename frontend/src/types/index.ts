export type GrievanceCategory =
  | 'ROAD_DAMAGE'
  | 'WATERLOGGING'
  | 'GARBAGE_WASTE'
  | 'WATER_SUPPLY'
  | 'ELECTRICITY'
  | 'PUBLIC_SAFETY'
  | 'HEALTH_SANITATION';

export type SeverityLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export type GrievanceStatus =
  | 'OPEN'
  | 'ASSIGNED'
  | 'IN_PROGRESS'
  | 'VERIFICATION'
  | 'RESOLVED';

export type UserRole =
  | 'SUPER_ADMIN'
  | 'DISTRICT_MAGISTRATE'
  | 'DEPARTMENT_OFFICER'
  | 'FIELD_INVESTIGATOR';

export interface LocationModel {
  id: string;
  latitude: number;
  longitude: number;
  address: string;
  locality: string;
  landmark?: string | null;
  district: string;
  pincode?: string | null;
  confidence: number;
}

export interface AIAnalysisModel {
  id: string;
  category: string;
  categoryConfidence: number;
  priority: SeverityLevel;
  priorityReason: string;
  sentiment: 'Frustrated' | 'Urgent' | 'Neutral' | 'Distressed';
  sentimentScore: number;
  urgencyScore: number;
  entitiesJson: string; // JSON string of { locations, district, keywords }
  duplicateScore: number;
  isDuplicateCandidate: boolean;
  duplicateReason?: string | null;
  engineMode: string;
  modelProvider?: string;
  modelVersion?: string;
  languageDetected?: string;
  sentimentLabel?: string;
  pipelineMetaJson?: string;
  analyzedAt: string;
}

export interface CaseNoteModel {
  id: string;
  grievanceId: string;
  authorId: string;
  authorName: string;
  authorRole: string;
  noteText: string;
  isInternal: boolean;
  createdAt: string;
}

export interface DepartmentModel {
  id: string;
  code: string;
  name: string;
  description: string;
  slaHours: number;
  headOfficer: string;
  contactEmail: string;
  contactPhone?: string | null;
  colorHex: string;
  officers?: UserModel[];
  _count?: {
    grievances: number;
  };
}

export interface UserModel {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  departmentId?: string | null;
  department?: DepartmentModel | null;
  district?: string | null;
  badgeNumber?: string | null;
  phone?: string | null;
}

export interface IncidentClusterModel {
  id: string;
  clusterCode: string;
  title: string;
  description: string;
  category: string;
  district: string;
  locality: string;
  rootCause: string;
  severity: SeverityLevel;
  status: 'INVESTIGATING' | 'DISPATCHED' | 'MITIGATED' | 'RESOLVED';
  centerLat: number;
  centerLng: number;
  radiusMeters: number;
  priorityScore?: number;
  priorityBreakdownJson?: string;
  recommendedDeptId?: string | null;
  routingReason?: string | null;
  createdAt: string;
  updatedAt: string;
  grievances?: GrievanceModel[];
  _count?: {
    grievances: number;
  };
}

export interface DuplicateCandidateModel {
  id: string;
  sourceGrievanceId: string;
  targetGrievanceId: string;
  sourceGrievance?: GrievanceModel;
  targetGrievance?: GrievanceModel;
  similarityScore: number;
  evidenceJson: string;
  status: 'PENDING' | 'CONFIRMED' | 'REJECTED';
  reviewedById?: string | null;
  reviewedAt?: string | null;
  reviewNotes?: string | null;
  createdAt: string;
}

export interface GrievanceModel {
  id: string;
  trackingId: string;
  title: string;
  description: string;
  originalLanguage: string;
  category: GrievanceCategory;
  severity: SeverityLevel;
  status: GrievanceStatus;
  complainantName: string;
  complainantPhone: string;
  isAnonymous: boolean;
  locationId?: string | null;
  location?: LocationModel | null;
  departmentId?: string | null;
  department?: DepartmentModel | null;
  assignedOfficerId?: string | null;
  assignedOfficer?: UserModel | null;
  incidentClusterId?: string | null;
  incidentCluster?: IncidentClusterModel | null;
  aiAnalysis?: AIAnalysisModel | null;
  resolutionNote?: string | null;
  resolvedAt?: string | null;
  slaDeadline: string;
  priorityOverridden?: boolean;
  priorityOverrideReason?: string | null;
  priorityOverriddenBy?: string | null;

  // Phase 3 Multimodal Evidence
  mediaUrl?: string | null;
  mediaType?: 'IMAGE' | 'VIDEO' | 'NONE' | null;
  mediaAnalysisJson?: string | null;
  mediaVerified?: boolean;
  mediaVerifiedBy?: string | null;
  mediaVerifiedAt?: string | null;
  mediaVerificationNote?: string | null;

  // Phase 3 Ingestion & Geospatial Provenance
  sourcePlatform?: string;
  sourceReference?: string | null;
  sourceAuthorHandle?: string | null;
  locationProvenance?: string;
  locationConfidence?: number;
  redactedDescription?: string | null;

  createdAt: string;
  updatedAt: string;
  notes?: CaseNoteModel[];
  auditLogs?: AuditLogModel[];
  sourceDuplicates?: DuplicateCandidateModel[];
  targetDuplicates?: DuplicateCandidateModel[];
}

export interface AuditLogModel {
  id: string;
  action: string;
  actorId: string;
  actorName: string;
  actorRole: string;
  entityType: string;
  entityId: string;
  oldValues?: string | null;
  newValues?: string | null;
  ipAddress?: string | null;
  timestamp: string;
}

export interface AlertModel {
  id: string;
  title: string;
  message: string;
  severity: 'INFO' | 'WARNING' | 'CRITICAL';
  type: string;
  district?: string | null;
  isRead: boolean;
  metadata?: string | null;
  createdAt: string;
}

export interface DashboardMetrics {
  summary: {
    totalGrievances: number;
    openGrievances: number;
    resolvedGrievances: number;
    criticalAlerts: number;
    slaBreached: number;
    resolutionRate: number;
    aiClassificationAccuracy: number;
  };
  severityDistribution: Record<SeverityLevel, number>;
  categoryDistribution: { category: string; count: number }[];
  departmentWorkload: {
    id: string;
    code: string;
    name: string;
    colorHex: string;
    activeCases: number;
    resolvedCases: number;
    totalCases: number;
    slaHours: number;
  }[];
  intakeAndResolutionTrend: {
    day: string;
    intake: number;
    resolved: number;
  }[];
  recentCases: GrievanceModel[];
  incidentClusters: IncidentClusterModel[];
}

export interface ConnectorStatus {
  id: string;
  name: string;
  type: 'API' | 'RSS_FEED' | 'FILE_IMPORT' | 'WEBHOOK';
  status: 'ACTIVE' | 'STANDBY' | 'DISCONNECTED' | 'ERROR';
  lastSyncAt: string | null;
  recordsIngested: number;
  rateLimitInfo: string;
  notes: string;
}

export interface VisionAnalysisResult {
  hasVisualEvidence: boolean;
  mediaType: 'IMAGE' | 'VIDEO' | 'NONE';
  detectedCivicIssues: Array<{
    issue: string;
    confidence: number;
    severity: SeverityLevel;
    boundingBoxDesc?: string;
  }>;
  observedObjects: string[];
  overallVisualSeverity: SeverityLevel;
  recommendedCategory: string;
  framesSampled?: number;
  modelObservationsSummary: string;
  modelConfidence: number;
  modelName: string;
  analyzedAt: string;
}

export interface EvaluationResults {
  totalCases: number;
  overallAccuracyPercent: number;
  categoryMetrics: Record<string, { precision: number; recall: number; f1: number; total: number }>;
  languageAccuracy: {
    englishAccuracy: number;
    hindiAccuracy: number;
  };
  locationResolutionRatePercent: number;
  duplicateGroupPrecisionPercent: number;
  averageLatencyMs: number;
  p95LatencyMs: number;
  honestLimitations: string[];
  evaluatedAt: string;
}

export interface SystemStatusData {
  timestamp: string;
  environment: string;
  status: string;
  overallHealth: string;
  database: {
    status: string;
    provider: string;
    connectionUrl: string;
    pingLatencyMs: number;
    records: {
      grievances: number;
      incidentClusters: number;
      duplicateCandidates: number;
      alerts: number;
      users: number;
      departments: number;
      auditLogs: number;
      ingestionRecords: number;
    };
  };
  analysisEngine: {
    status: string;
    providerName: string;
    modelVersion: string;
    engineMode: string;
    averageInferenceLatencyMs: number;
    supportedLanguages: string[];
    supportedCategories: string[];
    fallbackState: string;
  };
  mapService: {
    status: string;
    cartographyProvider: string;
    gazetteerLandmarksCount: number;
    coordinateResolutionPolicy: string;
    prohibitsInventedCoordinates: boolean;
    defaultJurisdiction: string;
  };
  ingestionConnectors: ConnectorStatus[];
  runtime: {
    nodeVersion: string;
    uptimeSeconds: number;
    memory: {
      heapUsedMB: number;
      heapTotalMB: number;
      rssMB: number;
    };
    apiPrefix: string;
    port: number | string;
  };
}

export interface DemoStepResult {
  step: number;
  title: string;
  summary: string;
  details: Record<string, any>;
  nextStepAvailable: boolean;
}

export interface DemoOverview {
  scenarioName: string;
  location: string;
  department: string;
  totalSteps: number;
  databaseMetrics: {
    totalGrievances: number;
    totalClusters: number;
    totalAlerts: number;
    totalAuditEvents: number;
  };
  activeDemoCluster: IncidentClusterModel | null;
}
