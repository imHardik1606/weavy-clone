import { GoogleGenerativeAI } from '@google/generative-ai';
import { GeminiRequest, GeminiResponse } from '../../lib/types/workflow';


export class GeminiClient {
  private genAI: GoogleGenerativeAI;
  private apiKey: string;

  constructor() {
    this.apiKey = process.env.GOOGLE_GEMINI_API_KEY || '';
    if (!this.apiKey) {
      console.warn('Gemini API key not found in environment variables');
    }
    this.genAI = new GoogleGenerativeAI(this.apiKey);
  }

  async generateContent(request: GeminiRequest): Promise<GeminiResponse> {
    try {
      if (!this.apiKey) {
        throw new Error('Gemini API key not configured');
      }

      const model = this.genAI.getGenerativeModel({ 
        model: request.model || 'gemini-2.5-flash',
        systemInstruction: request.systemPrompt,
      });

      // Build prompt parts
      const promptParts: any[] = [{ text: request.userMessage }];

      // Add images if provided
      if (request.images && request.images.length > 0) {
        request.images.forEach((imageBase64) => {
          // Extract base64 data and mime type
          const matches = imageBase64.match(/^data:(image\/\w+);base64,(.+)$/);
          if (matches) {
            const mimeType = matches[1];
            const base64Data = matches[2];
            
            promptParts.push({
              inlineData: {
                data: base64Data,
                mimeType: mimeType || 'image/jpeg',
              },
            });
          }
        });
      }

      // Generate content
      const result = await model.generateContent(promptParts);
      const response = await result.response;
      const text = response.text();

      return { text };
      
    } catch (error: any) {
      console.error('Gemini API Error:', error);
      
      // Handle specific error types
      let errorMessage = 'Failed to generate content';
      
      if (error.message?.includes('API key')) {
        errorMessage = 'Invalid API key. Please check your configuration.';
      } else if (error.message?.includes('quota')) {
        errorMessage = 'API quota exceeded. Please try again later.';
      } else if (error.message?.includes('safety')) {
        errorMessage = 'Content blocked by safety filters.';
      } else if (error.message?.includes('model')) {
        errorMessage = 'Invalid model specified.';
      }
      
      return { text: '', error: errorMessage };
    }
  }

  // Get available models
  getAvailableModels() {
    return [
      { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash', description: 'Fast, versatile model' },
      { id: 'gemini-2.5-pro', name: 'Gemini 2.5 Pro', description: 'Most capable model' },
      { id: 'gemini-2.0-flash', name: 'Gemini 2.0 Flash', description: 'Balanced performance' },
      { id: 'gemini-2.0-flash-exp', name: 'Gemini 2.0 Flash Experimental', description: 'Latest features' },
      { id: 'gemini-2.5-flash-lite', name: 'Gemini 2.5 Flash Lite', description: 'Lightweight, efficient' },
    ];
  }

  // Check if API key is configured
  isConfigured(): boolean {
    return !!this.apiKey && this.apiKey.length > 0;
  }

  // Validate image for Gemini API
  validateImage(base64Image: string): { valid: boolean; error?: string } {
    try {
      const matches = base64Image.match(/^data:(image\/\w+);base64,(.+)$/);
      if (!matches) {
        return { valid: false, error: 'Invalid image format. Must be base64 data URL.' };
      }

      const mimeType = matches[1];
      const base64Data = matches[2];
      
      // Check if it's a supported image type
      const supportedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif'];
      if (!supportedTypes.includes(mimeType)) {
        return { valid: false, error: `Unsupported image type: ${mimeType}. Supported: JPEG, PNG, WebP, HEIC.` };
      }

      // Check size (Gemini has limits)
      const sizeInBytes = (base64Data.length * 3) / 4;
      const maxSize = 20 * 1024 * 1024; // 20MB
      if (sizeInBytes > maxSize) {
        return { valid: false, error: 'Image too large. Maximum size is 20MB.' };
      }

      return { valid: true };
    } catch (error) {
      return { valid: false, error: 'Failed to validate image.' };
    }
  }
}

// Singleton instance
export const geminiClient = new GeminiClient();