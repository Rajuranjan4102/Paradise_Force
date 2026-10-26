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
  locationId: string;
  location: LocationModel;
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
