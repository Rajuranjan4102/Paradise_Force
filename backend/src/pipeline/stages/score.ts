import {
  ClassificationResult,
  ExtractedEntities,
  MatchResult,
  PriorityScoreBreakdown,
  StageTelemetry,
} from '../types';

export interface ScoreContext {
  elapsedHours?: number;
  slaHoursTarget?: number;
  clusterReportCount?: number;
  clusterRadiusMeters?: number;
  isRecurrentHotspot?: boolean;
}

export function runScoreStage(
  classify: ClassificationResult,
  entities: ExtractedEntities,
  match: MatchResult,
  context: ScoreContext = {}
): { score: PriorityScoreBreakdown; telemetry: StageTelemetry } {
  const start = performance.now();

  // 1. Base Hazard Score (0 - 30)
  let baseHazardScore = 10;
  if (entities.criticalHazardKeywords.length > 0) {
    baseHazardScore = 30; // Direct acute life/safety hazard
  } else if (entities.highUrgencyKeywords.length > 0) {
    baseHazardScore = 22;
  } else if (['ELECTRICITY', 'INFRASTRUCTURE'].includes(classify.category)) {
    baseHazardScore = 20;
  } else if (['WATERLOGGING', 'ROAD_DAMAGE'].includes(classify.category)) {
    baseHazardScore = 15;
  } else if (['GARBAGE_WASTE', 'WATER_SUPPLY'].includes(classify.category)) {
    baseHazardScore = 12;
  } else {
    baseHazardScore = 8;
  }

  // 2. Independent Report Volume Score (0 - 25)
  // Reflects verified independent citizen reports, NOT social media popularity
  const count = context.clusterReportCount || (match.isDuplicateCandidate ? (match.allMatches.length + 1) : 1);
  let reportVolumeScore = 5;
  if (count >= 5) reportVolumeScore = 25;
  else if (count >= 3) reportVolumeScore = 18;
  else if (count >= 2) reportVolumeScore = 12;

  // 3. Recurrence Velocity Score (0 - 15)
  let recurrenceVelocityScore = 3;
  if (context.isRecurrentHotspot || (count >= 3 && (context.elapsedHours || 0) < 12)) {
    recurrenceVelocityScore = 15; // High velocity influx
  } else if (match.topMatch && match.topMatch.timeDeltaHours <= 6) {
    recurrenceVelocityScore = 10;
  } else if (match.isDuplicateCandidate) {
    recurrenceVelocityScore = 6;
  }

  // 4. SLA Urgency / Duration Score (0 - 15)
  const elapsed = context.elapsedHours || 1;
  const slaTarget = context.slaHoursTarget || 48;
  const elapsedRatio = elapsed / Math.max(slaTarget, 1);
  let slaUrgencyScore = 4;
  if (elapsedRatio >= 1.0) slaUrgencyScore = 15; // SLA breached
  else if (elapsedRatio >= 0.75) slaUrgencyScore = 12;
  else if (elapsedRatio >= 0.50) slaUrgencyScore = 8;

  // 5. Geographic Spread Score (0 - 10)
  const radius = context.clusterRadiusMeters || (match.topMatch ? match.topMatch.spatialDistanceMeters : 50);
  let geoSpreadScore = 3;
  if (radius > 500) geoSpreadScore = 10; // Disruption across broad transit corridor
  else if (radius > 200) geoSpreadScore = 7;
  else if (radius > 50) geoSpreadScore = 5;

  // 6. Evidence Quality Score (0 - 5)
  let evidenceQualityScore = 3;
  if (entities.inferredLocationConfidence >= 0.90 && entities.landmarks.length > 0) {
    evidenceQualityScore = 5;
  } else if (entities.inferredLocationConfidence < 0.70) {
    evidenceQualityScore = 2;
  }

  // Total Score Calculation
  const totalScore = Math.min(
    Math.round(
      baseHazardScore +
      reportVolumeScore +
      recurrenceVelocityScore +
      slaUrgencyScore +
      geoSpreadScore +
      evidenceQualityScore
    ),
    100
  );

  // Derive Priority Level
  let priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' = 'LOW';
  let primaryReason = 'Routine complaint with localized impact and no acute life hazards.';

  if (baseHazardScore === 30 || totalScore >= 75) {
    priority = 'CRITICAL';
    primaryReason = entities.criticalHazardKeywords.length > 0
      ? `Critical public safety risk: detected acute hazard keywords (${entities.criticalHazardKeywords.join(', ')}) with high impact score (${totalScore}/100).`
      : `Critical priority reached due to cumulative multi-report cluster volume and velocity (${totalScore}/100).`;
  } else if (totalScore >= 55) {
    priority = 'HIGH';
    primaryReason = count > 1
      ? `High priority: ${count} concurrent reports received with significant civic disruption (${totalScore}/100).`
      : `High priority: severe civic infrastructure degradation requiring expedited inspection (${totalScore}/100).`;
  } else if (totalScore >= 35) {
    priority = 'MEDIUM';
    primaryReason = 'Standard civic priority: infrastructure requires scheduled departmental remediation.';
  }

  const durationMs = performance.now() - start;

  return {
    score: {
      baseHazardScore,
      reportVolumeScore,
      recurrenceVelocityScore,
      slaUrgencyScore,
      geoSpreadScore,
      evidenceQualityScore,
      totalScore,
      priority,
      primaryReason,
    },
    telemetry: {
      stage: 'SCORE',
      timestamp: new Date().toISOString(),
      method: 'DETERMINISTIC_RULES',
      algorithm: 'ExplainableMultiFactorPriorityEngine',
      confidence: 0.95,
      durationMs: Number(durationMs.toFixed(2)),
      metadata: { totalScore, priority, count, baseHazardScore },
    },
  };
}
