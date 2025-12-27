import { z } from 'zod';

// Gemini API request validation
export const geminiRequestSchema = z.object({
  model: z.enum([
    'gemini-2.5-flash',
    'gemini-2.5-pro',
    'gemini-2.0-flash',
    'gemini-2.0-flash-exp',
    'gemini-2.5-flash-lite'
  ]).default('gemini-2.5-flash'),
  
  systemPrompt: z.string().max(2000, 'System prompt too long (max 2000 chars)').optional(),
  
  userMessage: z.string()
    .min(1, 'User message is required')
    .max(10000, 'User message too long (max 10000 chars)'),
  
  images: z.array(z.string())
    .max(16, 'Maximum 16 images allowed')
    .optional(),
  
  temperature: z.number()
    .min(0, 'Temperature must be at least 0')
    .max(2, 'Temperature must be at most 2')
    .optional()
    .default(0.7),
  
  maxTokens: z.number()
    .min(1, 'Max tokens must be at least 1')
    .max(8192, 'Max tokens must be at most 8192')
    .optional()
    .default(1024),
}).refine((data) => {
  // Additional validation: Check image format
  if (data.images) {
    for (const image of data.images) {
      if (!image.startsWith('data:image/')) {
        return false;
      }
    }
  }
  return true;
}, {
  message: 'Images must be valid base64 data URLs starting with data:image/',
  path: ['images'],
});

// Workflow validation
export const workflowSchema = z.object({
  name: z.string()
    .min(1, 'Workflow name is required')
    .max(100, 'Workflow name too long'),
  
  nodes: z.array(z.object({
    id: z.string(),
    type: z.enum(['text', 'image', 'llm']),
    position: z.object({
      x: z.number(),
      y: z.number(),
    }),
    data: z.object({
      label: z.string(),
      value: z.string().optional(),
      image: z.string().optional(),
      model: z.string().optional(),
      systemPrompt: z.string().optional(),
      isLoading: z.boolean().optional(),
      error: z.string().optional(),
      response: z.string().optional(),
    }),
  })),
  
  edges: z.array(z.object({
    id: z.string(),
    source: z.string(),
    target: z.string(),
    sourceHandle: z.string().optional(),
    targetHandle: z.string().optional(),
    animated: z.boolean().optional(),
  })),
});

// Node data validation
export const textNodeSchema = z.object({
  value: z.string()
    .min(1, 'Text cannot be empty')
    .max(5000, 'Text too long (max 5000 chars)'),
});

export const imageNodeSchema = z.object({
  image: z.string()
    .refine((img) => img.startsWith('data:image/'), {
      message: 'Invalid image format. Must be base64 data URL.',
    }),
});

export const llmNodeSchema = z.object({
  model: z.string(),
  systemPrompt: z.string().max(1000).optional(),
});

// Export validation
export const exportSchema = z.object({
  metadata: z.object({
    version: z.string(),
    exportedAt: z.string().datetime(),
    app: z.string().default('Weavy Workflow Builder'),
  }),
  workflow: workflowSchema,
});

// Validation helper functions
export function validateGeminiRequest(data: unknown) {
  return geminiRequestSchema.safeParse(data);
}

export function validateWorkflow(data: unknown) {
  return workflowSchema.safeParse(data);
}

export function validateImageUpload(file: File): { valid: boolean; error?: string } {
  // Check file type
  const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/heic', 'image/heif'];
  if (!validTypes.includes(file.type)) {
    return {
      valid: false,
      error: `Unsupported file type: ${file.type}. Supported: ${validTypes.join(', ')}`,
    };
  }

  // Check file size (20MB limit)
  const maxSize = 20 * 1024 * 1024; // 20MB
  if (file.size > maxSize) {
    return {
      valid: false,
      error: `File too large: ${(file.size / 1024 / 1024).toFixed(2)}MB. Maximum: 20MB`,
    };
  }

  return { valid: true };
}

// Schema for importing workflows
export const importSchema = z.object({
  nodes: z.array(z.any()),
  edges: z.array(z.any()),
  metadata: z.object({
    exportedAt: z.string().optional(),
    version: z.string().optional(),
  }).optional(),
});

// URL validation for external images (optional feature)
export const urlSchema = z.string().url('Invalid URL').refine(
  (url) => url.match(/\.(jpg|jpeg|png|gif|webp)$/i),
  'URL must point to an image (jpg, png, gif, webp)'
);

// Helper: Create error response
export function createErrorResponse(message: string, status: number = 400) {
  return {
    error: message,
    status,
    timestamp: new Date().toISOString(),
  };
}

// Helper: Sanitize input
export function sanitizeInput(input: string): string {
  return input
    .replace(/[<>]/g, '') // Remove < and >
    .trim()
    .substring(0, 10000); // Limit length
}