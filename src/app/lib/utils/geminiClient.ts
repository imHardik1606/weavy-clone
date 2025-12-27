import { GoogleGenerativeAI } from '@google/generative-ai';
import { GeminiRequest, GeminiResponse } from '../../lib/types/workflow';

export class GeminiClient {
  private genAI: GoogleGenerativeAI;

  constructor() {
    const apiKey = process.env.GOOGLE_GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GOOGLE_GEMINI_API_KEY is not configured');
    }
    this.genAI = new GoogleGenerativeAI(apiKey);
  }

  // Process images with Gemini Vision
  async analyzeWithVision(request: GeminiRequest): Promise<GeminiResponse> {
    try {
      const model = this.genAI.getGenerativeModel({ 
        model: request.model || 'gemini-2.5-flash',
        systemInstruction: request.systemPrompt,
      });

      // Build multimodal prompt
      const promptParts: any[] = [];
      
      // Add text prompt
      promptParts.push({ text: request.userMessage });
      
      // Add images if provided
      if (request.images && request.images.length > 0) {
        for (const imageBase64 of request.images) {
          const imageData = this.parseBase64Image(imageBase64);
          if (imageData) {
            promptParts.push({
              inlineData: {
                data: imageData.data,
                mimeType: imageData.mimeType,
              },
            });
          }
        }
      }

      const result = await model.generateContent(promptParts);
      const response = await result.response;
      const text = response.text();

      return { 
        text
      };
      
    } catch (error: any) {
      console.error('Gemini Vision API Error:', error);
      
      let errorMessage = 'Failed to analyze content';
      
      if (error.message?.includes('API key')) {
        errorMessage = 'Invalid API key';
      } else if (error.message?.includes('quota')) {
        errorMessage = 'API quota exceeded';
      } else if (error.message?.includes('safety')) {
        errorMessage = 'Content blocked by safety filters';
      }
      
      return { text: '', error: errorMessage };
    }
  }

  // Parse base64 image data
  private parseBase64Image(base64String: string): { data: string; mimeType: string } | null {
    const matches = base64String.match(/^data:(image\/[a-zA-Z+]+);base64,(.+)$/);
    if (!matches || matches.length !== 3) {
      console.warn('Invalid image format:', base64String.substring(0, 50));
      return null;
    }
    
    return {
      mimeType: matches[1],
      data: matches[2],
    };
  }

  // Get vision-capable models
  getVisionModels() {
    return [
      { 
        id: 'gemini-2.5-flash', 
        name: 'Gemini 2.5 Flash', 
        supportsVision: true,
        maxImages: 16,
        description: 'Fast vision model for image analysis'
      },
      { 
        id: 'gemini-2.5-pro', 
        name: 'Gemini 2.5 Pro', 
        supportsVision: true,
        maxImages: 16,
        description: 'High accuracy vision model'
      },
    ];
  }

  // Validate image for Gemini Vision
  validateImageForVision(imageBase64: string): { valid: boolean; error?: string } {
    const parsed = this.parseBase64Image(imageBase64);
    if (!parsed) {
      return { valid: false, error: 'Invalid image format. Must be base64 data URL.' };
    }

    // Check supported MIME types
    const supportedTypes = [
      'image/jpeg', 'image/png', 'image/webp', 
      'image/heic', 'image/heif', 'image/bmp', 'image/gif'
    ];
    
    if (!supportedTypes.includes(parsed.mimeType)) {
      return { 
        valid: false, 
        error: `Unsupported image type: ${parsed.mimeType}` 
      };
    }

    // Check size (approx 20MB limit)
    const sizeInBytes = (parsed.data.length * 3) / 4;
    const maxSize = 20 * 1024 * 1024;
    if (sizeInBytes > maxSize) {
      return { valid: false, error: 'Image too large (max 20MB)' };
    }

    return { valid: true };
  }
}

export const geminiClient = new GeminiClient();