import 'dotenv/config';
import { z } from 'zod';

const EnvSchema = z.object({
	S3_BUCKET_NAME: z.string(),
	S3_ACCESS_KEY: z.string(),
	S3_SECRET_KEY: z.string(),
	S3_ENDPOINT: z.string().url(),
	COOKIE_SECRET: z.string().min(8),
});

export const env = EnvSchema.parse(process.env);
