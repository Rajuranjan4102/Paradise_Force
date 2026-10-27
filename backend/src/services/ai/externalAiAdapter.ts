import {
  INLPModelAdapter,
  StructuredNLPAnalysis,
  StructuredNLPAnalysisSchema,
} from './types';
import { localRuleAdapter } from './localRuleAdapter';

export interface ExternalAIConfig {
  apiKey?: string;
  provider: 'gemini' | 'openai' | 'ollama' | 'mock_active';
  endpoint?: string;
  modelName: string;
  timeoutMs: number;
}

export class ExternalAIProviderAdapter implements INLPModelAdapter {
  public readonly providerName: string;
  public readonly modelVersion: string;
  private config: ExternalAIConfig;

  constructor(customConfig?: Partial<ExternalAIConfig>) {
    const provider = (process.env.AI_PROVIDER as any) || customConfig?.provider || 'gemini';
    const apiKey = process.env.AI_API_KEY || process.env.GEMINI_API_KEY || process.env.OPENAI_API_KEY || customConfig?.apiKey;

    this.config = {
      provider,
      apiKey,
      endpoint: process.env.AI_PROVIDER_ENDPOINT || customConfig?.endpoint,
      modelName: process.env.AI_MODEL_NAME || customConfig?.modelName || (provider === 'openai' ? 'gpt-4o-mini' : 'gemini-1.5-flash'),
      timeoutMs: customConfig?.timeoutMs || 4000,
    };

    this.providerName = `EXTERNAL_${this.config.provider.toUpperCase()}`;
    this.modelVersion = this.config.modelName;
  }

  public async isAvailable(): Promise<boolean> {
    if (this.config.provider === 'mock_active') return true;
    return Boolean(this.config.apiKey || this.config.endpoint);
  }

  public async analyze(text: string, title: string = ''): Promise<StructuredNLPAnalysis> {
    const startTime = performance.now();

    // If no external provider configured, fallback immediately to local engine
    if (!this.config.apiKey && !this.config.endpoint && this.config.provider !== 'mock_active') {
      const localResult = await localRuleAdapter.analyze(text, title);
      return {
        ...localResult,
        modelProvider: 'LOCAL_RULE_TFIDF (No external API key set)',
      };
    }

    try {
      // Execute with timeout guard
      const result = await Promise.race([
        this.callExternalProvider(text, title),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('AI provider request timed out')), this.config.timeoutMs)
        ),
      ]);

      const latency = Number((performance.now() - startTime).toFixed(2));
      return {
        ...result,
        latencyMs: latency,
      };
    } catch (err: any) {
      console.warn(`[AI Adapter] External call failed (${err?.message || err}). Falling back to local engine.`);
      const fallback = await localRuleAdapter.analyze(text, title);
      return {
        ...fallback,
        modelProvider: `FALLBACK_LOCAL_RULES (Provider error: ${err?.message || 'unknown'})`,
      };
    }
  }

  private async callExternalProvider(text: string, title: string): Promise<StructuredNLPAnalysis> {
    // In test or offline mode with mock_active provider:
    if (this.config.provider === 'mock_active') {
      const base = await localRuleAdapter.analyze(text, title);
      return {
        ...base,
        modelProvider: 'MOCK_EXTERNAL_AI_PROVIDER',
        modelVersion: 'simulated-gemini-1.5-flash',
        confidence: Math.min(0.99, base.confidence + 0.05),
      };
    }

    // Call external REST API (Gemini / OpenAI compatible)
    if (this.config.provider === 'gemini' && this.config.apiKey) {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${this.config.modelName}:generateContent?key=${this.config.apiKey}`;
      const prompt = this.buildPrompt(text, title);

      const resp = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { responseMimeType: 'application/json' },
        }),
      });

      if (!resp.ok) {
        throw new Error(`Gemini API returned status ${resp.status}`);
      }

      const jsonResponse: any = await resp.json();
      const rawText = jsonResponse.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!rawText) throw new Error('Empty response from Gemini');

      const parsed = JSON.parse(rawText);
      const validated = StructuredNLPAnalysisSchema.parse({
        ...parsed,
        modelProvider: this.providerName,
        modelVersion: this.modelVersion,
        latencyMs: 0,
      });

      return validated;
    }

    // Default fallback if unsupported provider
    return localRuleAdapter.analyze(text, title);
  }

  private buildPrompt(text: string, title: string): string {
    return `You are JANRAKSHA AI, Bihar Police & Civic Grievance Intelligence Engine.
Analyze the following public grievance (may be Hindi, English, or Bhojpuri):
Title: ${title}
Text: ${text}

Output MUST be a valid JSON object matching this schema:
{
  "category": "ROAD_DAMAGE" | "WATERLOGGING" | "WATER_SUPPLY" | "ELECTRICITY" | "GARBAGE_WASTE" | "PUBLIC_SAFETY" | "HEALTH_SANITATION" | "INFRASTRUCTURE" | "OTHER_CIVIC",
  "confidence": 0.0 to 1.0,
  "sentiment": "Frustrated" | "Urgent" | "Neutral" | "Distressed",
  "sentimentScore": -1.0 to 1.0,
  "urgencyScore": 1 to 10,
  "detectedLanguage": "en" | "hi" | "bho" | "unsupported",
  "entities": {
    "locations": ["string"],
    "districts": ["string"],
    "landmarks": ["string"],
    "keywords": ["string"]
  },
  "summary": "Brief explanation"
}`;
  }
}
