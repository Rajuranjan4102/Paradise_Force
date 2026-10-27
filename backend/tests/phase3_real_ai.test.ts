import { describe, it, expect, beforeEach } from 'vitest';
import { localRuleAdapter } from '../src/services/ai/localRuleAdapter';
import { ExternalAIProviderAdapter } from '../src/services/ai/externalAiAdapter';
import { visionModelAdapter } from '../src/services/ai/visionModelAdapter';
import { geocodingService } from '../src/services/geospatial/geocodingService';
import { privacyService } from '../src/services/privacy/privacyService';
import { socialIngestionService } from '../src/services/ingestion/socialIngestionService';
import { benchmarkService } from '../src/services/evaluation/benchmarkService';
import { StructuredNLPAnalysisSchema } from '../src/services/ai/types';
import fs from 'fs';
import path from 'path';

describe('Phase 3 Real AI and Multimodal Intelligence Suite', () => {
  // Test 1: Real Bilingual NLP & Structured Output Validation
  it('should accurately classify English and Hindi grievances with valid structured outputs', async () => {
    // English Complaint
    const enResult = await localRuleAdapter.analyze(
      'Deep pothole and broken asphalt near pillar 45, vehicles are skidding in danger',
      'Road hazard on Bailey Road'
    );
    expect(enResult.category).toBe('ROAD_DAMAGE');
    expect(enResult.detectedLanguage).toBe('en');
    expect(enResult.sentiment).toBe('Urgent');
    expect(enResult.confidence).toBeGreaterThanOrEqual(0.65);
    expect(enResult.entities.locations).toContain('Bailey Road');
    expect(() => StructuredNLPAnalysisSchema.parse(enResult)).not.toThrow();

    // Hindi Complaint
    const hiResult = await localRuleAdapter.analyze(
      'ट्रांसफार्मर से तेज चिंगारी निकल रही है और सड़क पर करंट दौड़ रहा है। तुरंत लाइन काटिए।',
      'बिजली का खतरा डाक बंगला'
    );
    expect(hiResult.category).toBe('ELECTRICITY');
    expect(hiResult.detectedLanguage).toBe('hi');
    expect(hiResult.sentiment).toBe('Urgent');
    expect(hiResult.entities.landmarks).toContain('Dak Bunglow Chauraha');
    expect(() => StructuredNLPAnalysisSchema.parse(hiResult)).not.toThrow();
  });

  // Test 2: AI Provider Resilience & Safe Fallback
  it('should gracefully fallback to local rules when external AI provider fails or is unconfigured', async () => {
    const unconfiguredAdapter = new ExternalAIProviderAdapter({
      provider: 'gemini',
      apiKey: undefined,
      endpoint: undefined,
      timeoutMs: 50,
    });

    const result = await unconfiguredAdapter.analyze('Heavy waterlogging, main drain choked', 'Drainage overflow');
    expect(result.category).toBe('WATERLOGGING');
    expect(result.confidence).toBeGreaterThan(0.5);
    expect(result.modelProvider).toContain('LOCAL_RULE_TFIDF');
  });

  // Test 3: Multimodal Image & Video Intelligence
  it('should analyze image/video evidence and distinguish model observations from official verification', async () => {
    // Create a mock image file
    const tmpUploadDir = path.resolve(__dirname, '../uploads');
    if (!fs.existsSync(tmpUploadDir)) fs.mkdirSync(tmpUploadDir, { recursive: true });

    const mockImagePath = path.join(tmpUploadDir, 'test_pothole_crater.jpg');
    fs.writeFileSync(mockImagePath, 'mock-image-data-binary');

    const visionResult = await visionModelAdapter.analyzeMedia(
      mockImagePath,
      'image/jpeg',
      'test_pothole_crater.jpg'
    );

    expect(visionResult.hasVisualEvidence).toBe(true);
    expect(visionResult.mediaType).toBe('IMAGE');
    expect(visionResult.detectedCivicIssues.length).toBeGreaterThan(0);
    expect(visionResult.detectedCivicIssues[0].issue).toContain('Pothole');
    expect(visionResult.recommendedCategory).toBe('ROAD_DAMAGE');
    expect(visionResult.modelObservationsSummary).toContain('Visual model identified');

    // Clean up
    if (fs.existsSync(mockImagePath)) fs.unlinkSync(mockImagePath);
  });

  // Test 4: Geospatial Provenance & Missing Location Support
  it('should record coordinate provenance and avoid inventing fake coordinates for unresolved locations', () => {
    // Exact GPS
    const exactResult = geocodingService.resolveLocation('Pipe leak', 'Patna Central', 'Bailey Road', 25.6105, 85.1182);
    expect(exactResult.provenance).toBe('GPS_EXACT');
    expect(exactResult.isResolved).toBe(true);
    expect(exactResult.latitude).toBe(25.6105);

    // Named locality dictionary match
    const dictResult = geocodingService.resolveLocation('Heavy waterlogging at Kankarbagh tempo stand');
    expect(dictResult.provenance).toBe('LOCALITY_CENTROID');
    expect(dictResult.isResolved).toBe(true);
    expect(dictResult.locality).toBe('Kankarbagh');

    // Missing / Vague location
    const vagueResult = geocodingService.resolveLocation('Some lights are flickering somewhere in my area');
    expect(vagueResult.provenance).toBe('UNRESOLVED');
    expect(vagueResult.isResolved).toBe(false);
    expect(vagueResult.latitude).toBeNull();
    expect(vagueResult.longitude).toBeNull();
  });

  // Test 5: Privacy Redaction
  it('should redact phone numbers, Aadhaar numbers, and emails to prevent PII leakage', () => {
    const rawText = 'Call complainant Ramesh at +91 9876543210 or email ramesh@bihar.gov.in. Aadhaar is 2345 6789 0123.';
    const result = privacyService.redactPII(rawText);

    expect(result.piiDetected).toBe(true);
    expect(result.redactedText).toContain('[PHONE_REDACTED]');
    expect(result.redactedText).toContain('[EMAIL_REDACTED]');
    expect(result.redactedText).toContain('[AADHAAR_REDACTED]');
    expect(result.redactedText).not.toContain('9876543210');
    expect(result.redactedText).not.toContain('2345 6789 0123');
  });

  // Test 6: Ingestion Connectors & CSV Parsing
  it('should parse CSV records and return honest connector status', async () => {
    const csvData = `title,description,district,locality,category\n"Burst Pipe","Water gushing from main pipe","Patna Central","Danapur","WATER_SUPPLY"\n"Garbage Dump","Rotten waste pile","Patna Central","Kankarbagh","GARBAGE_WASTE"`;
    const parsed = socialIngestionService.parseCSV(csvData);
    expect(parsed.length).toBe(2);
    expect(parsed[0].title).toBe('Burst Pipe');
    expect(parsed[1].category).toBe('GARBAGE_WASTE');

    const connectors = await socialIngestionService.getConnectorStates();
    expect(connectors.length).toBeGreaterThanOrEqual(4);
    const csvConnector = connectors.find(c => c.id === 'csv_json_batch');
    expect(csvConnector?.status).toBe('ACTIVE');
  });

  // Test 7: Gold-Standard Benchmark Evaluation
  it('should run live benchmark evaluation and report honest metrics', async () => {
    const results = await benchmarkService.runEvaluation();
    expect(results.totalCases).toBeGreaterThanOrEqual(20);
    expect(results.overallAccuracyPercent).toBeGreaterThanOrEqual(80.0);
    expect(results.locationResolutionRatePercent).toBeGreaterThanOrEqual(80.0);
    expect(results.honestLimitations.length).toBeGreaterThan(0);
    expect(results.averageLatencyMs).toBeLessThan(100); // Super-fast local engine
  });
});
