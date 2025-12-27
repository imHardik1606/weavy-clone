import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { z } from 'zod';

const requestSchema = z.object({
  model: z.string().default('gemini-2.5-flash'),
  systemPrompt: z.string().optional(),
  userMessage: z.string().min(1, 'User message is required'),
  images: z.array(z.string()).optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validationResult = requestSchema.safeParse(body);
    
    if (!validationResult.success) {
      return NextResponse.json(
        { error: validationResult.error.errors[0].message },
        { status: 400 }
      );
    }
    
    const { model, systemPrompt, userMessage, images } = validationResult.data;
    const apiKey = process.env.GOOGLE_GEMINI_API_KEY;
    
    if (!apiKey) {
      return NextResponse.json(
        { error: 'API key not configured' },
        { status: 500 }
      );
    }
    
    const genAI = new GoogleGenerativeAI(apiKey);
    const geminiModel = genAI.getGenerativeModel({ 
      model,
      systemInstruction: systemPrompt,
    });
    
    const promptParts: any[] = [{ text: userMessage }];
    
    // Add images if provided
    if (images && images.length > 0) {
      images.forEach((imageBase64) => {
        promptParts.push({
          inlineData: {
            data: imageBase64.split(',')[1], // Remove data:image/... prefix
            mimeType: 'image/jpeg',
          },
        });
      });
    }
    
    const result = await geminiModel.generateContent(promptParts);
    const response = await result.response;
    const text = response.text();
    
    return NextResponse.json({ text });
    
  } catch (error: any) {
    console.error('Gemini API error:', error);
    
    // Handle specific Gemini API errors
    if (error.message?.includes('API key')) {
      return NextResponse.json(
        { error: 'Invalid API key. Please check your configuration.' },
        { status: 401 }
      );
    }
    
    if (error.message?.includes('quota')) {
      return NextResponse.json(
        { error: 'API quota exceeded. Please try again later.' },
        { status: 429 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to process request. Please try again.' },
      { status: 500 }
    );
  }
}