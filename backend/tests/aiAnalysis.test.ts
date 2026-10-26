import { describe, it, expect } from 'vitest';
import { aiAnalysisService, ExistingCaseSummary } from '../src/services/aiAnalysis.service';

describe('AIAnalysisService (Bilingual Demo Intelligence Engine)', () => {
  it('should accurately classify an English road damage complaint', () => {
    const result = aiAnalysisService.analyzeComplaint(
      'Deep pothole on main road',
      'Huge crater and damaged asphalt causing two-wheelers to slip',
      'Patna Central',
      'Bailey Road',
      25.612,
      85.087
    );

    expect(result.category).toBe('ROAD_DAMAGE');
    expect(result.categoryConfidence).toBeGreaterThan(0.7);
    expect(['REAL_LOCAL_MODEL', 'DETERMINISTIC_RULES', 'DEMO_RULE_BASED']).toContain(result.engineMode);
  });

  it('should accurately classify a Hindi waterlogging complaint', () => {
    const result = aiAnalysisService.analyzeComplaint(
      'सड़क पर भारी जलजमाव',
      'नाला जाम होने के कारण 2 फीट गंदा पानी सड़क पर भरा हुआ है',
      'Patna Central',
      'Kankarbagh',
      25.596,
      85.155
    );

    expect(result.category).toBe('WATERLOGGING');
    expect(result.priority).toBeDefined();
    expect(['HIGH', 'MEDIUM', 'CRITICAL']).toContain(result.priority);
  });

  it('should escalate to CRITICAL when acute electrical spark/fire keywords are present', () => {
    const result = aiAnalysisService.analyzeComplaint(
      'Transformer sparking violently',
      '11kV transformer throwing continuous sparks and smoke near school, electrocution risk',
      'Patna Central',
      'Kankarbagh',
      25.596,
      85.155
    );

    expect(result.category).toBe('ELECTRICITY');
    expect(result.priority).toBe('CRITICAL');
    expect(result.urgencyScore).toBeGreaterThanOrEqual(9);
    expect(result.sentiment).toBe('Distressed');
  });

  it('should detect duplicate candidate when nearby similar complaint exists', () => {
    const existingCases: ExistingCaseSummary[] = [
      {
        id: 'case-1',
        trackingId: 'JAN-2026-9999',
        title: 'Waterlogging under Bailey Road flyover',
        description: 'Underpass flooded with rain water',
        category: 'WATERLOGGING',
        district: 'Patna Central',
        locality: 'Bailey Road',
        latitude: 25.6125,
        longitude: 85.0872,
        incidentClusterId: 'clust-1',
      },
    ];

    const result = aiAnalysisService.analyzeComplaint(
      'Massive waterlogging on Bailey Road flyover',
      'Flooded underpass with choked drain water',
      'Patna Central',
      'Bailey Road',
      25.6127, // ~30m distance
      85.0874,
      existingCases
    );

    expect(result.duplicateCheck.isPotentialDuplicate).toBe(true);
    expect(result.duplicateCheck.similarityScore).toBeGreaterThanOrEqual(0.60);
    expect(result.duplicateCheck.clusterCandidateId).toBe('clust-1');
  });
});
