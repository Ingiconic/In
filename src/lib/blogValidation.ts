import { z } from "zod";

export const blogPostSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, "عنوان نمی‌تواند خالی باشد")
    .max(200, "عنوان حداکثر ۲۰۰ کاراکتر است"),
  slug: z
    .string()
    .trim()
    .min(1, "اسلاگ نمی‌تواند خالی باشد")
    .max(100, "اسلاگ حداکثر ۱۰۰ کاراکتر است")
    .regex(/^[a-z0-9-]+$/, "اسلاگ فقط شامل حروف کوچک، اعداد و خط تیره است"),
  content: z
    .string()
    .trim()
    .min(1, "محتوا نمی‌تواند خالی باشد")
    .max(50000, "محتوا حداکثر ۵۰۰۰۰ کاراکتر است"),
  excerpt: z
    .string()
    .trim()
    .max(500, "خلاصه حداکثر ۵۰۰ کاراکتر است")
    .optional()
    .or(z.literal("")),
  featured_image: z
    .string()
    .url("آدرس تصویر معتبر نیست")
    .optional()
    .or(z.literal("")),
});

export type BlogPostInput = z.infer<typeof blogPostSchema>;
