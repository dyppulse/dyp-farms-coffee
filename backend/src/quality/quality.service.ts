/**
 * Coffee quality vision analysis via Google Gemini (free-tier flash models).
 *
 * FUTURE UPGRADE PATH:
 * - For production volume / SLA, switch to a paid vision API (Gemini paid tier, OpenAI GPT-4o, etc.)
 *   or train/deploy a custom coffee-bean grading model (domain-specific defects, moisture cues, screen size).
 * - Keep this service as a thin adapter so the controller / mobile contract stay stable.
 */
import {
  BadRequestException,
  Injectable,
  ServiceUnavailableException,
} from '@nestjs/common';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { StoreService } from '../common/data/store.service';

export type QualityScanResult = {
  id: string;
  lotId?: string;
  lotName?: string;
  grade: string;
  points: number;
  scannedAt: string;
  recommendations: string[];
  summary?: string;
  moistureEstimate?: string;
  defectRate?: string;
  screenSize?: string;
  colourScore?: string;
  model?: string;
};

const SYSTEM_PROMPT = `You are an expert coffee quality grader analyzing a photo of harvested coffee beans
(green, parchment, or dried cherries). Respond with JSON ONLY — no markdown fences.

Schema:
{
  "grade": "AA" | "A" | "AB" | "B" | "C" | "N/A",
  "points": number (0-100),
  "moistureEstimate": string (e.g. "11.2%"),
  "defectRate": string (e.g. "0.8%"),
  "screenSize": string (e.g. "18+"),
  "colourScore": string (e.g. "97%"),
  "recommendations": string[] (2-4 short actionable tips for the farmer),
  "summary": string (1-2 sentences)
}

Rules:
- If the image is not coffee beans / cherries / parchment, set grade to "N/A", points to 0, and explain in summary.
- Estimate visually; do not invent lab precision — use plausible ranges from what you see.
- Prefer East African / SCA-style grade language (AA, A, AB, B, C).`;

@Injectable()
export class QualityService {
  constructor(private store: StoreService) {}

  async analyzeImage(params: {
    buffer: Buffer;
    mimeType: string;
    lotId?: string;
    variety?: string;
    moistureNote?: string;
  }): Promise<QualityScanResult> {
    const apiKey = process.env.GEMINI_API_KEY?.trim();
    if (!apiKey) {
      throw new ServiceUnavailableException(
        'GEMINI_API_KEY is not configured. Add it to backend/.env',
      );
    }

    if (!params.buffer?.length) {
      throw new BadRequestException('Image file is required');
    }

    const modelName =
      process.env.GEMINI_VISION_MODEL?.trim() || 'gemini-2.0-flash';

    const lot = params.lotId
      ? this.store.getLotById(params.lotId)
      : undefined;

    const contextBits = [
      params.variety ? `Declared variety: ${params.variety}` : null,
      params.moistureNote
        ? `Farmer moisture note: ${params.moistureNote}`
        : null,
      lot ? `Linked lot: ${lot.name} (${lot.grade})` : null,
    ]
      .filter(Boolean)
      .join('. ');

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: modelName,
      generationConfig: {
        temperature: 0.2,
        responseMimeType: 'application/json',
      },
    });

    const userText = [
      SYSTEM_PROMPT,
      contextBits ? `Context: ${contextBits}` : null,
      'Analyze the attached image and return the JSON object.',
    ]
      .filter(Boolean)
      .join('\n\n');

    let rawText: string;
    try {
      const result = await model.generateContent([
        { text: userText },
        {
          inlineData: {
            data: params.buffer.toString('base64'),
            mimeType: params.mimeType || 'image/jpeg',
          },
        },
      ]);
      rawText = result.response.text();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Vision request failed';
      throw new ServiceUnavailableException(
        `Gemini analysis failed: ${message}`,
      );
    }

    const parsed = this.parseModelJson(rawText);
    const points = this.clampPoints(parsed.points);

    return {
      id: `qc-${Date.now()}`,
      lotId: lot?.id ?? params.lotId,
      lotName: lot?.name ?? 'Harvest scan',
      grade: String(parsed.grade ?? 'N/A'),
      points,
      scannedAt: new Date().toISOString(),
      recommendations: Array.isArray(parsed.recommendations)
        ? parsed.recommendations.map(String).slice(0, 6)
        : [],
      summary: parsed.summary ? String(parsed.summary) : undefined,
      moistureEstimate: parsed.moistureEstimate
        ? String(parsed.moistureEstimate)
        : undefined,
      defectRate: parsed.defectRate ? String(parsed.defectRate) : undefined,
      screenSize: parsed.screenSize ? String(parsed.screenSize) : undefined,
      colourScore: parsed.colourScore ? String(parsed.colourScore) : undefined,
      model: modelName,
    };
  }

  private parseModelJson(raw: string): Record<string, unknown> {
    const trimmed = raw.trim();
    try {
      return JSON.parse(trimmed) as Record<string, unknown>;
    } catch {
      const match = trimmed.match(/\{[\s\S]*\}/);
      if (match) {
        try {
          return JSON.parse(match[0]) as Record<string, unknown>;
        } catch {
          /* fall through */
        }
      }
      throw new ServiceUnavailableException(
        'Gemini returned an unreadable quality result. Try another photo.',
      );
    }
  }

  private clampPoints(value: unknown): number {
    const n = typeof value === 'number' ? value : Number(value);
    if (!Number.isFinite(n)) return 0;
    return Math.max(0, Math.min(100, Math.round(n)));
  }
}
