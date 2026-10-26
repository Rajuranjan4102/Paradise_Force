import {
  PipelineInput,
  ClassificationResult,
  ExtractedEntities,
  MatchResult,
  PriorityScoreBreakdown,
  AlertTriggerResult,
  StageTelemetry,
} from '../types';

export interface AlertEvaluationContext {
  activeUnresolvedDistrictCount?: number;
  recentDistrictCountThreshold?: number;
  caseTrackingId?: string;
}

export function runAlertStage(
  input: PipelineInput,
  classify: ClassificationResult,
  entities: ExtractedEntities,
  match: MatchResult,
  score: PriorityScoreBreakdown,
  context: AlertEvaluationContext = {}
): { alertResult: AlertTriggerResult; telemetry: StageTelemetry } {
  const start = performance.now();

  const triggeredAlerts: AlertTriggerResult['triggeredAlerts'] = [];
  const trackingId = context.caseTrackingId || 'NEW_CASE';

  // 1. Critical Safety Hazard Trigger
  if (entities.criticalHazardKeywords.length > 0 || score.priority === 'CRITICAL') {
    triggeredAlerts.push({
      title: `SAFETY ALERT: ${input.title.slice(0, 50)}...`,
      message: `Immediate hazard detected at ${input.locality}, ${input.district}. Acute triggers: [${entities.criticalHazardKeywords.join(', ')}].`,
      severity: 'CRITICAL',
      type: 'CRITICAL_SAFETY',
      district: input.district,
      trigger: 'HAZARD_KEYWORDS_OR_CRITICAL_SCORE',
      supportingCaseIds: [trackingId],
    });
  }

  // 2. Increasing Complaint Cluster Trigger
  if (match.isDuplicateCandidate && match.allMatches.length >= 2) {
    const matchedIds = match.allMatches.map(m => m.matchedTrackingId);
    triggeredAlerts.push({
      title: `CLUSTER SURGE: Multi-report Incident at ${input.locality}`,
      message: `${match.allMatches.length + 1} citizen complaints converging on localized incident in ${input.locality} within 48h.`,
      severity: 'WARNING',
      type: 'CLUSTER_GROWTH',
      district: input.district,
      trigger: 'CONCURRENT_CLUSTER_THRESHOLD_EXCEEDED',
      supportingCaseIds: [trackingId, ...matchedIds],
    });
  }

  // 3. Repeated Reports From Area (Hotspot Trigger)
  const nearbyMatches = match.allMatches.filter(m => m.spatialDistanceMeters <= 350);
  if (nearbyMatches.length >= 2) {
    triggeredAlerts.push({
      title: `AREA HOTSPOT: Repeated reports in ${input.locality}`,
      message: `High spatial concentration of ${classify.category} complaints detected within 350m radius.`,
      severity: 'WARNING',
      type: 'AREA_HOTSPOT',
      district: input.district,
      trigger: 'SPATIAL_PROXIMITY_DENSITY_THRESHOLD',
      supportingCaseIds: [trackingId, ...nearbyMatches.map(m => m.matchedTrackingId)],
    });
  }

  // 4. District Complaint Surge Trigger
  if (
    context.activeUnresolvedDistrictCount &&
    context.recentDistrictCountThreshold &&
    context.activeUnresolvedDistrictCount > context.recentDistrictCountThreshold
  ) {
    triggeredAlerts.push({
      title: `DISTRICT SURGE: High Unresolved Volume in ${input.district}`,
      message: `Active unresolved tickets (${context.activeUnresolvedDistrictCount}) exceed threshold (${context.recentDistrictCountThreshold}).`,
      severity: 'WARNING',
      type: 'DISTRICT_SURGE',
      district: input.district,
      trigger: 'DISTRICT_UNRESOLVED_SPIKE',
      supportingCaseIds: [trackingId],
    });
  }

  const durationMs = performance.now() - start;

  return {
    alertResult: { triggeredAlerts },
    telemetry: {
      stage: 'ALERT',
      timestamp: new Date().toISOString(),
      method: 'DETERMINISTIC_RULES',
      algorithm: 'DocumentedThresholdAlertEngine',
      confidence: 1.0,
      durationMs: Number(durationMs.toFixed(2)),
      metadata: { alertsGeneratedCount: triggeredAlerts.length },
    },
  };
}
