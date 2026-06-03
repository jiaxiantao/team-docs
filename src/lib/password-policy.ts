import { z } from "zod";

export const passwordSchema = z
  .string()
  .min(8, "密码至少 8 位")
  .max(128, "密码过长");
