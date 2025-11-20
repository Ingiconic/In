import { z } from 'zod';

/**
 * Common validation patterns for edge functions
 */

// Suspicious patterns that might indicate prompt injection
const suspiciousPatterns = [
  /ignore\s+(previous|above|all)\s+(instructions?|prompts?|commands?)/i,
  /you\s+are\s+(now|a)/i,
  /system\s*:?\s*role/i,
  /\[INST\]|\[\/INST\]/i,
  /<\|im_start\|>|<\|im_end\|>/i,
];

export function containsSuspiciousPatterns(text: string): boolean {
  return suspiciousPatterns.some(pattern => pattern.test(text));
}

// AI Answer validation
export const aiAnswerSchema = z.object({
  question: z.string().min(1, 'Question cannot be empty').max(2000, 'Question too long'),
  context: z.string().max(5000, 'Context too long').optional(),
}).refine(
  data => !containsSuspiciousPatterns(data.question),
  { message: 'Question contains suspicious content', path: ['question'] }
);

// AI Consultation validation
export const aiConsultationSchema = z.object({
  message: z.string().min(1, 'Message cannot be empty').max(2000, 'Message too long'),
  history: z.array(z.object({
    role: z.enum(['user', 'assistant']),
    content: z.string().max(5000),
  })).max(20, 'Too many messages in history').optional(),
}).refine(
  data => !containsSuspiciousPatterns(data.message),
  { message: 'Message contains suspicious content', path: ['message'] }
);

// AI Exam Generator validation
export const aiExamGeneratorSchema = z.object({
  topic: z.string().min(1, 'Topic cannot be empty').max(500, 'Topic too long'),
  questionCount: z.number().int().min(1).max(50),
  difficulty: z.enum(['easy', 'medium', 'hard']),
  questionType: z.enum(['multiple_choice', 'short_answer', 'mixed']).optional(),
});

// AI Evaluate Exam validation
export const aiEvaluateExamSchema = z.object({
  questions: z.array(z.object({
    question: z.string().max(1000),
    correctAnswer: z.string().max(1000),
    userAnswer: z.string().max(1000),
  })).min(1).max(100),
});

// AI Flashcard Generator validation
export const aiFlashcardGeneratorSchema = z.object({
  topic: z.string().min(1, 'Topic cannot be empty').max(500, 'Topic too long'),
  count: z.number().int().min(1).max(50),
  difficulty: z.enum(['easy', 'medium', 'hard']).optional(),
});

// AI Image Analysis validation
export const aiImageAnalysisSchema = z.object({
  imageData: z.string().min(1, 'Image data required'),
  prompt: z.string().max(1000, 'Prompt too long').optional(),
}).refine(
  data => {
    // Basic base64 validation
    const base64Regex = /^data:image\/(png|jpg|jpeg|webp);base64,/;
    return base64Regex.test(data.imageData);
  },
  { message: 'Invalid image data format', path: ['imageData'] }
);

// AI Mindmap Generator validation
export const aiMindmapGeneratorSchema = z.object({
  topic: z.string().min(1, 'Topic cannot be empty').max(500, 'Topic too long'),
  depth: z.number().int().min(1).max(5).optional(),
});

// AI Study Planner validation
export const aiStudyPlannerSchema = z.object({
  subjects: z.array(z.string().max(200)).min(1, 'At least one subject required').max(10),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format'),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format'),
  hoursPerDay: z.number().min(0.5).max(24).optional(),
});

// AI Summarize validation
export const aiSummarizeSchema = z.object({
  content: z.string().min(1, 'Content cannot be empty').max(10000, 'Content too long'),
  type: z.enum(['summarize', 'explain']).optional(),
});

// Submit Exam validation
export const submitExamSchema = z.object({
  examId: z.string().uuid('Invalid exam ID'),
  answers: z.array(z.object({
    questionIndex: z.number().int().min(0),
    answer: z.string().max(1000),
  })).min(1).max(100),
});

// Admin Auth validation
export const adminAuthSchema = z.object({
  username: z.string().min(1, 'Username required').max(100),
  password: z.string().min(1, 'Password required').max(200),
});
