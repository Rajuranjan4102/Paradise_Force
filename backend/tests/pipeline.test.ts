import { describe, it, expect } from 'vitest';
import { pipelineOrchestrator } from '../src/pipeline/pipelineOrchestrator';
import { runClassifyStage } from '../src/pipeline/stages/classify';
import { runMatchStage, ExistingIncidentCandidate } from '../src/pipeline/stages/match';
import { runScoreStage } from '../src/pipeline/stages/score';
import { runRouteStage, DEPARTMENT_RULES } from '../src/pipeline/stages/route';
import { runAlertStage } from '../src/pipeline/stages/alert';
import { runNormaliseStage, runIngestStage } from '../src/pipeline/stages/normalise';

describe('Phase 2: 8-Stage Intelligence Pipeline Tests', () => {
  const existingCaseBailey: ExistingIncidentCandidate = {
    id: 'case-bailey-1',
    trackingId: 'JAN-2026-1011',
    title: 'Massive waterlogging under Bailey Road flyover',
    description: 'Underpass completely flooded with 2.5ft rain water',
    category: 'WATERLOGGING',
    district: 'Patna Central',
    locality: 'Bailey Road',
    latitude: 25.6128,
    longitude: 85.0874,
    createdAt: new Date(),
    incidentClusterId: 'clust-bailey',
  };

  const existingCaseGaya: ExistingIncidentCandidate = {
    id: 'case-gaya-1',
    trackingId: 'JAN-2026-1031',
    title: 'Drinking water pipe cracked near Gaya station',
    description: 'High pressure drinking water pipe burst',
    category: 'WATER_SUPPLY',
    district: 'Gaya City',
    locality: 'Station Road',
    latitude: 24.8023,
    longitude: 85.0086,
    createdAt: new Date(),
    incidentClusterId: 'clust-gaya',
  };

  // 1. INGEST & NORMALISE
  it('STAGE 1 & 2: INGEST & NORMALISE should sanitize inputs and normalize bilingual Hindi text', () => {
    const { input } = runIngestStage({
      title: '  सड़क पर बड़ा गड्ढा  ',
      description: '  गढ्ढा होने से दुर्घटना की आशंका है  ',
      complainantName: 'Raju',
      complainantPhone: '9835012345',
      latitude: 25.612,
      longitude: 85.087,
      district: 'Patna Central',
      locality: 'Bailey Road',
      address: 'Bailey Road',
    });

    const { data: norm, telemetry } = runNormaliseStage(input);

    expect(input.title).toBe('सड़क पर बड़ा गड्ढा');
    expect(norm.detectedLanguage).toBe('hi');
    expect(norm.tokens).toContain('गड्ढा'); // Standardized from गढ्ढा
    expect(telemetry.stage).toBe('NORMALISE');
    expect(telemetry.method).toBe('DETERMINISTIC_RULES');
  });

  // 2. CLASSIFICATION & LOCAL MODEL
  it('STAGE 3: CLASSIFY should use real local TF-IDF model on English and Hindi complaints', () => {
    const { data: normHi } = runNormaliseStage({
      title: 'ट्रांसफार्मर में तेज स्पार्क और आग',
      description: '11kV खंभे से चिंगारी निकल रही है करंट का खतरा है',
      complainantName: 'Citizen',
      complainantPhone: '9999999999',
      latitude: 25.596,
      longitude: 85.155,
      district: 'Patna Central',
      locality: 'Kankarbagh',
      address: 'Kankarbagh',
    });

    const { result: classHi } = runClassifyStage(normHi);
    expect(classHi.category).toBe('ELECTRICITY');
    expect(classHi.confidence).toBeGreaterThanOrEqual(0.70);
    expect(classHi.method).toBe('REAL_LOCAL_MODEL');

    // Unsupported language test
    const { data: normUnsupported } = runNormaliseStage({
      title: '12345 67890 ???',
      description: '--- ... ---',
      complainantName: 'Unknown',
      complainantPhone: '',
      latitude: 25.596,
      longitude: 85.155,
      district: 'Patna Central',
      locality: 'Central',
      address: 'Central',
    });
    const { result: classUnsupported } = runClassifyStage(normUnsupported);
    expect(classUnsupported.languageSupported).toBe(false);
    expect(classUnsupported.category).toBe('OTHER_CIVIC');
  });

  // 3. DUPLICATE MATCHING & FALSE POSITIVES
  it('STAGE 5: MATCH should detect multi-factor duplicates and reject false positives', () => {
    // True duplicate: same locality (Bailey Road, 50m apart), same category, within 2 hours
    const { data: normDup } = runNormaliseStage({
      title: 'Bailey Road flyover waterlogging underpass flooded',
      description: 'Drain choked near pillar 42, water standing on road',
      complainantName: 'Complainant 2',
      complainantPhone: '9835000000',
      latitude: 25.6125, // ~35m from existingCaseBailey
      longitude: 85.0872,
      district: 'Patna Central',
      locality: 'Bailey Road',
      address: 'Pillar 42, Bailey Road',
    });

    const { result: matchResult } = runMatchStage(
      normDup,
      {
        title: 'Bailey Road flyover waterlogging underpass flooded',
        description: 'Drain choked near pillar 42',
        complainantName: 'Complainant 2',
        complainantPhone: '9835000000',
        latitude: 25.6125,
        longitude: 85.0872,
        district: 'Patna Central',
        locality: 'Bailey Road',
        address: 'Pillar 42, Bailey Road',
      },
      {
        category: 'WATERLOGGING',
        confidence: 0.92,
        method: 'REAL_LOCAL_MODEL',
        algorithm: 'TFIDF_Cosine',
        languageSupported: true,
        explanation: 'Waterlogging match',
      },
      [existingCaseBailey, existingCaseGaya]
    );

    expect(matchResult.isDuplicateCandidate).toBe(true);
    expect(matchResult.topMatch).toBeDefined();
    expect(matchResult.topMatch?.matchedGrievanceId).toBe('case-bailey-1');
    expect(matchResult.topMatch?.spatialDistanceMeters).toBeLessThan(100);
    expect(matchResult.topMatch?.compositeScore).toBeGreaterThanOrEqual(0.70);

    // FALSE POSITIVE TEST: Completely different category & location in Gaya should NOT match
    const gayaMatch = matchResult.allMatches.find(m => m.matchedGrievanceId === 'case-gaya-1');
    expect(gayaMatch).toBeUndefined(); // Filtered out due to ~95km distance and category divergence
  });

  // 4. SCORING BOUNDARIES & EDGE CASES
  it('STAGE 6: SCORE should handle missing data, boundaries, and critical hazard escalation', () => {
    // Edge case: Empty extracted entities, low confidence, routine complaint
    const { score: routineScore } = runScoreStage(
      {
        category: 'GARBAGE_WASTE',
        confidence: 0.50,
        method: 'DETERMINISTIC_RULES',
        algorithm: 'Rules',
        languageSupported: true,
        explanation: 'Low confidence routine',
      },
      {
        districts: [],
        localities: [],
        landmarks: [],
        criticalHazardKeywords: [],
        highUrgencyKeywords: [],
        inferredLocationConfidence: 0.5,
      },
      {
        isDuplicateCandidate: false,
        allMatches: [],
        clusterAction: 'STANDALONE',
      },
      { elapsedHours: 0, slaHoursTarget: 48, clusterReportCount: 1 }
    );

    expect(routineScore.priority).toBe('LOW');
    expect(routineScore.totalScore).toBeLessThan(40);
    expect(routineScore.baseHazardScore).toBe(12);

    // Critical Hazard escalation: live wire spark
    const { score: criticalScore } = runScoreStage(
      {
        category: 'ELECTRICITY',
        confidence: 0.95,
        method: 'REAL_LOCAL_MODEL',
        algorithm: 'TFIDF',
        languageSupported: true,
        explanation: 'Electricity',
      },
      {
        districts: ['Patna Central'],
        localities: ['Kankarbagh'],
        landmarks: ['market'],
        criticalHazardKeywords: ['spark', 'fire', 'electrocution'],
        highUrgencyKeywords: [],
        inferredLocationConfidence: 0.95,
      },
      {
        isDuplicateCandidate: true,
        allMatches: [{ compositeScore: 0.85 } as any, { compositeScore: 0.80 } as any],
        clusterAction: 'LINK_EXISTING',
      },
      { elapsedHours: 10, slaHoursTarget: 12, clusterReportCount: 3 }
    );

    expect(criticalScore.priority).toBe('CRITICAL');
    expect(criticalScore.baseHazardScore).toBe(30);
    expect(criticalScore.totalScore).toBeGreaterThanOrEqual(75);
  });

  // 5. ROUTING RULES & CONFIRMATION REQUIREMENT
  it('STAGE 7: ROUTE should recommend correct department and mandate human confirmation', () => {
    const { recommendation: routePwd } = runRouteStage(
      {
        category: 'ROAD_DAMAGE',
        confidence: 0.9,
        method: 'REAL_LOCAL_MODEL',
        algorithm: 'TFIDF',
        languageSupported: true,
        explanation: '',
      },
      {
        title: 'Broken road',
        description: 'Pothole on main road',
        complainantName: 'Citizen',
        complainantPhone: '',
        latitude: 25.6,
        longitude: 85.1,
        district: 'Patna Central',
        locality: 'Bailey Road',
        address: 'Bailey Road',
      }
    );

    expect(routePwd.departmentCode).toBe('PWD');
    expect(routePwd.slaHours).toBe(48);
    expect(routePwd.requiresHumanConfirmation).toBe(true);

    // Critical SLA reduction test
    const { recommendation: routeCriticalElec } = runRouteStage(
      {
        category: 'ELECTRICITY',
        confidence: 0.9,
        method: 'REAL_LOCAL_MODEL',
        algorithm: 'TFIDF',
        languageSupported: true,
        explanation: '',
      },
      {
        title: 'Transformer spark',
        description: 'Sparking wire',
        complainantName: 'Citizen',
        complainantPhone: '',
        latitude: 25.6,
        longitude: 85.1,
        district: 'Patna Central',
        locality: 'Kankarbagh',
        address: 'Kankarbagh',
      },
      true // isCritical
    );

    expect(routeCriticalElec.departmentCode).toBe('ELEC');
    expect(routeCriticalElec.slaHours).toBe(4); // Expedited critical SLA
  });

  // 6. ALERT GENERATION
  it('STAGE 8: ALERT should spawn documented alerts for acute safety hazards and cluster surges', () => {
    const { alertResult } = runAlertStage(
      {
        title: 'Explosion hazard at substation',
        description: 'Continuous sparks dropping on market crowd',
        complainantName: 'Citizen',
        complainantPhone: '',
        latitude: 25.6,
        longitude: 85.1,
        district: 'Patna Central',
        locality: 'Kankarbagh',
        address: 'Kankarbagh',
      },
      { category: 'ELECTRICITY', confidence: 0.9, method: 'REAL_LOCAL_MODEL', algorithm: 'TFIDF', languageSupported: true, explanation: '' },
      { districts: ['Patna Central'], localities: ['Kankarbagh'], landmarks: [], criticalHazardKeywords: ['spark', 'fire'], highUrgencyKeywords: [], inferredLocationConfidence: 0.95 },
      {
        isDuplicateCandidate: true,
        allMatches: [
          { matchedTrackingId: 'JAN-2026-1021', spatialDistanceMeters: 60 } as any,
          { matchedTrackingId: 'JAN-2026-1022', spatialDistanceMeters: 80 } as any,
        ],
        clusterAction: 'LINK_EXISTING',
      },
      { priority: 'CRITICAL', totalScore: 88 } as any,
      { caseTrackingId: 'JAN-2026-1023' }
    );

    expect(alertResult.triggeredAlerts.length).toBeGreaterThanOrEqual(2);
    const safetyAlert = alertResult.triggeredAlerts.find(a => a.type === 'CRITICAL_SAFETY');
    const clusterAlert = alertResult.triggeredAlerts.find(a => a.type === 'CLUSTER_GROWTH');

    expect(safetyAlert).toBeDefined();
    expect(safetyAlert?.severity).toBe('CRITICAL');
    expect(safetyAlert?.trigger).toBe('HAZARD_KEYWORDS_OR_CRITICAL_SCORE');

    expect(clusterAlert).toBeDefined();
    expect(clusterAlert?.severity).toBe('WARNING');
    expect(clusterAlert?.supportingCaseIds).toContain('JAN-2026-1021');
  });

  // 7. FULL PIPELINE ORCHESTRATION
  it('FULL ORCHESTRATION: pipelineOrchestrator should execute all 8 stages with complete telemetry', () => {
    const fullResult = pipelineOrchestrator.execute(
      {
        title: 'Massive waterlogging on Bailey Road flyover',
        description: 'Underpass flooded with rain water, drain choked near pillar 42',
        complainantName: 'Amit Sharma',
        complainantPhone: '9835011111',
        latitude: 25.6125,
        longitude: 85.0872,
        district: 'Patna Central',
        locality: 'Bailey Road',
        address: 'Pillar 42, Bailey Road',
      },
      [existingCaseBailey]
    );

    expect(fullResult.telemetry.length).toBe(8);
    const stages = fullResult.telemetry.map(t => t.stage);
    expect(stages).toEqual([
      'INGEST',
      'NORMALISE',
      'CLASSIFY',
      'EXTRACT',
      'MATCH',
      'SCORE',
      'ROUTE',
      'ALERT',
    ]);
    expect(fullResult.pipelineExecutionDurationMs).toBeGreaterThan(0);
    expect(fullResult.classify.category).toBe('WATERLOGGING');
    expect(fullResult.match.isDuplicateCandidate).toBe(true);
    expect(fullResult.route.departmentCode).toBe('DRAINAGE');
  });
});
