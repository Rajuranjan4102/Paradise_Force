import { INLPModelAdapter } from './types';
import { localRuleAdapter } from './localRuleAdapter';
import { ExternalAIProviderAdapter } from './externalAiAdapter';

export class NLPModelFactory {
  private static instance: INLPModelAdapter | null = null;

  public static getModel(): INLPModelAdapter {
    if (!this.instance) {
      const provider = process.env.AI_PROVIDER;
      const apiKey = process.env.AI_API_KEY || process.env.GEMINI_API_KEY || process.env.OPENAI_API_KEY;

      if (apiKey || provider === 'gemini' || provider === 'openai') {
        this.instance = new ExternalAIProviderAdapter();
      } else {
        this.instance = localRuleAdapter;
      }
    }
    return this.instance;
  }

  public static setModel(customAdapter: INLPModelAdapter): void {
    this.instance = customAdapter;
  }

  public static resetModel(): void {
    this.instance = null;
  }
}
