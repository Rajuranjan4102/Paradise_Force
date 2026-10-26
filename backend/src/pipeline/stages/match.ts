import {
  NormalisedData,
  PipelineInput,
  ClassificationResult,
  MatchResult,
  MatchEvidence,
  StageTelemetry,
} from '../types';

export interface ExistingIncidentCandidate {
  id: string;
  trackingId: string;
  title: string;
  description: string;
  category: string;
  latitude: number;
  longitude: number;
  district: string;
  locality: string;
  createdAt: Date;
  incidentClusterId?: string | null;
}

export function runMatchStage(
  norm: NormalisedData,
  input: PipelineInput,
  classify: ClassificationResult,
  existingCases: ExistingIncidentCandidate[] = []
): { result: MatchResult; telemetry: StageTelemetry } {
  const start = performance.now();

  const allMatches: MatchEvidence[] = [];

  const currentTokens = new Set(norm.tokens);
  const now = input.createdAt || new Date();

  for (const candidate of existingCases) {
    // 1. Text Similarity (Token Jaccard & substring check)
    const candWords = `${candidate.title} ${candidate.description}`
      .toLowerCase()
      .split(/[\s,.;:!?()-]+/)
      .filter(w => w.length > 2);
    const candTokenSet = new Set(candWords);

    let intersection = 0;
    for (const t of currentTokens) {
      if (candTokenSet.has(t)) intersection++;
    }
    const unionSize = Math.max(currentTokens.size + candTokenSet.size - intersection, 1);
    const textSimilarity = Number((intersection / unionSize).toFixed(2));

    // 2. Category Agreement
    const categoryAgreement = candidate.category === classify.category;
    const categoryScore = categoryAgreement ? 1.0 : candidate.category === classify.secondaryCategory ? 0.5 : 0.0;

    // 3. Geographic Proximity (Haversine formula in meters)
    const distanceMeters = calculateHaversineDistance(
      input.latitude,
      input.longitude,
      candidate.latitude,
      candidate.longitude
    );

    let spatialScore = 0.0;
    if (distanceMeters <= 80) spatialScore = 1.0;
    else if (distanceMeters <= 300) spatialScore = 0.85;
    else if (distanceMeters <= 700) spatialScore = 0.60;
    else if (distanceMeters <= 1500) spatialScore = 0.25;

    // 4. Time Window Overlap
    const candTime = new Date(candidate.createdAt);
    const timeDeltaMs = Math.abs(now.getTime() - candTime.getTime());
    const timeDeltaHours = Number((timeDeltaMs / (1000 * 60 * 60)).toFixed(1));

    let timeScore = 0.05;
    if (timeDeltaHours <= 6) timeScore = 1.0;
    else if (timeDeltaHours <= 24) timeScore = 0.85;
    else if (timeDeltaHours <= 72) timeScore = 0.55;
    else if (timeDeltaHours <= 168) timeScore = 0.25;

    // Multi-factor Composite Score
    const compositeScore = Number(
      (0.30 * textSimilarity + 0.25 * categoryScore + 0.30 * spatialScore + 0.15 * timeScore).toFixed(2)
    );

    if (compositeScore >= 0.50 || (distanceMeters <= 400 && categoryAgreement)) {
      const explanation = `Matched ${candidate.trackingId}: ${distanceMeters.toFixed(0)}m distance (geo: ${(spatialScore * 100).toFixed(0)}%), ${(textSimilarity * 100).toFixed(0)}% text similarity, ${timeDeltaHours}h time delta.`;

      allMatches.push({
        matchedGrievanceId: candidate.id,
        matchedTrackingId: candidate.trackingId,
        clusterId: candidate.incidentClusterId,
        textSimilarity,
        categoryAgreement,
        spatialDistanceMeters: Math.round(distanceMeters),
        spatialScore,
        timeDeltaHours,
        timeScore,
        compositeScore,
        explanation,
      });
    }
  }

  // Sort by composite score descending
  allMatches.sort((a, b) => b.compositeScore - a.compositeScore);

  const topMatch = allMatches.length > 0 ? allMatches[0] : undefined;
  const isDuplicateCandidate = topMatch !== undefined && topMatch.compositeScore >= 0.60;

  let clusterAction: 'LINK_EXISTING' | 'CREATE_NEW' | 'STANDALONE' = 'STANDALONE';
  let recommendedClusterId = topMatch?.clusterId || undefined;

  if (isDuplicateCandidate) {
    if (topMatch?.clusterId) {
      clusterAction = 'LINK_EXISTING';
    } else {
      clusterAction = 'CREATE_NEW';
    }
  }

  const durationMs = performance.now() - start;

  return {
    result: {
      isDuplicateCandidate,
      topMatch,
      allMatches,
      recommendedClusterId,
      clusterAction,
    },
    telemetry: {
      stage: 'MATCH',
      timestamp: new Date().toISOString(),
      method: 'DETERMINISTIC_RULES',
      algorithm: 'MultiFactorSpatialTemporalTextMatcher',
      confidence: topMatch ? topMatch.compositeScore : 0.95,
      durationMs: Number(durationMs.toFixed(2)),
      metadata: {
        candidateCountSearched: existingCases.length,
        candidateMatchesFound: allMatches.length,
        topCompositeScore: topMatch?.compositeScore || 0,
      },
    },
  };
}

function calculateHaversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371e3; // Earth radius in meters
  const phi1 = (lat1 * Math.PI) / 180;
  const phi2 = (lat2 * Math.PI) / 180;
  const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
  const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
    Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}
