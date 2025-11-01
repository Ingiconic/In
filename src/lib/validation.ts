import { z } from "zod";

// Message validation
export const messageSchema = z.object({
  content: z
    .string()
    .trim()
    .min(1, "پیام نمی‌تواند خالی باشد")
    .max(5000, "پیام حداکثر ۵۰۰۰ کاراکتر است"),
});

// Username validation
export const usernameSchema = z
  .string()
  .trim()
  .min(3, "نام کاربری حداقل ۳ کاراکتر است")
  .max(30, "نام کاربری حداکثر ۳۰ کاراکتر است")
  .regex(/^[a-zA-Z0-9_]+$/, "نام کاربری فقط شامل حروف، اعداد و _ است");

// Channel/Group name validation
export const channelNameSchema = z
  .string()
  .trim()
  .min(3, "نام حداقل ۳ کاراکتر است")
  .max(100, "نام حداکثر ۱۰۰ کاراکتر است");

export const groupNameSchema = channelNameSchema;

// Description validation
export const descriptionSchema = z
  .string()
  .trim()
  .max(500, "توضیحات حداکثر ۵۰۰ کاراکتر است");
