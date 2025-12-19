import { GoogleGenerativeAI } from "@google/generative-ai";

type AIProvider = "gemini" | "local" | "openai";

interface AIServiceConfig {
  provider: AIProvider;
  baseUrl?: string;
  modelName: string;
  apiKey?: string;
  openaiKey?: string;
}

export class AIService {
  private config: AIServiceConfig;
  private geminiClient: GoogleGenerativeAI | null = null;

  constructor() {
    this.config = {
      provider: (process.env.AI_PROVIDER as AIProvider) || "gemini",
      // Base URL behavior:
      // - local: defaults to http://localhost:11434/v1
      // - openai: defaults to https://api.openai.com/v1
      baseUrl: process.env.AI_BASE_URL,
      modelName: process.env.AI_MODEL_NAME || "gemini-pro-latest",
      apiKey: process.env.GEMINI_API_KEY,
      openaiKey: process.env.OPENAI_API_KEY,
    };

    if (this.config.provider === "gemini" && this.config.apiKey) {
      this.geminiClient = new GoogleGenerativeAI(this.config.apiKey);
    }
  }

  async generateContent(prompt: string, systemPrompt?: string): Promise<string> {
    const fullPrompt = systemPrompt ? `${systemPrompt}\n\n${prompt}` : prompt;

    if (this.config.provider === "local") {
      return this.generateOpenAICompatible(
        fullPrompt,
        this.config.baseUrl || "http://localhost:11434/v1"
      );
    } else if (this.config.provider === "openai") {
      return this.generateOpenAICompatible(
        fullPrompt,
        "https://api.openai.com/v1",
        this.config.openaiKey
      );
    } else {
      return this.generateGemini(fullPrompt);
    }
  }

  private async generateGemini(prompt: string): Promise<string> {
    if (!this.geminiClient) {
      throw new Error("Gemini API key is missing.");
    }
    const model = this.geminiClient.getGenerativeModel({ model: this.config.modelName });
    const result = await model.generateContent(prompt);
    const response = result.response;
    return response.text();
  }

  private async generateOpenAICompatible(prompt: string, baseUrl: string, apiKey?: string): Promise<string> {
    try {
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      if (apiKey) {
        headers["Authorization"] = `Bearer ${apiKey}`;
      }

      const response = await fetch(`${baseUrl}/chat/completions`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          model: this.config.modelName, // e.g. "gpt-4o" or "llama3"
          messages: [{ role: "user", content: prompt }],
          stream: false,
        }),
      });

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`${this.config.provider} API error (${response.status}): ${errorData}`);
      }

      const data = await response.json();
      return data.choices[0].message.content;
    } catch (error: any) {
      console.error(`${this.config.provider} generation failed:`, error);
      throw new Error(`Failed to generate content with ${this.config.provider}: ${error.message}`);
    }
  }
}

export const aiService = new AIService();
