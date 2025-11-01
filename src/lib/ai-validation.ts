import { z } from "zod";

// AI prompt validation schema
export const aiPromptSchema = z.object({
  prompt: z
    .string()
    .trim()
    .min(1, "پرامپت نمی‌تواند خالی باشد")
    .max(2000, "پرامپت حداکثر ۲۰۰۰ کاراکتر است")
    .refine(
      (val) => !containsSuspiciousPatterns(val),
      "محتوای نامعتبر شناسایی شد"
    ),
});

// Check for suspicious patterns that might indicate prompt injection
function containsSuspiciousPatterns(text: string): boolean {
  const suspiciousPatterns = [
    /ignore\s+(previous|prior|all)\s+(instructions?|prompts?)/i,
    /system\s+prompt/i,
    /دستورات\s+قبلی.*نادیده/i,
    /نادیده\s+بگیر.*دستور/i,
    /disregard\s+(previous|prior)/i,
    /forget\s+(everything|all)/i,
  ];
  
  return suspiciousPatterns.some(pattern => pattern.test(text));
}

// Validation for other AI endpoints
export const aiContentSchema = z.object({
  content: z
    .string()
    .trim()
    .min(1, "محتوا نمی‌تواند خالی باشد")
    .max(10000, "محتوا حداکثر ۱۰۰۰۰ کاراکتر است"),
});

export const aiQuestionSchema = z.object({
  question: z
    .string()
    .trim()
    .min(1, "سوال نمی‌تواند خالی باشد")
    .max(1000, "سوال حداکثر ۱۰۰۰ کاراکتر است"),
  context: z
    .string()
    .trim()
    .max(5000, "متن حداکثر ۵۰۰۰ کاراکتر است")
    .optional(),
});

export const aiMessageSchema = z.object({
  message: z
    .string()
    .trim()
    .min(1, "پیام نمی‌تواند خالی باشد")
    .max(2000, "پیام حداکثر ۲۰۰۰ کاراکتر است"),
});
