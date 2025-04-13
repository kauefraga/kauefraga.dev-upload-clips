import { z } from "zod";

export const ClipSchema = z.object({
  id: z.string().uuid(),
  title: z.string(),
  game_title: z.string(), // enum?
  clip_url: z.string().url(),
  /** Clip duration in seconds */
  duration: z.number(),
  publishedAt: z.date()
});

export type Clip = z.infer<typeof ClipSchema>;
