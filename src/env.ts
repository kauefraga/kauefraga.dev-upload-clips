import { z } from 'zod';

const EnvSchema = z.object({
	S3_BUCKET_NAME: z.string().default('kauefraga-dev'),
	S3_ACCESS_KEY: z.string(),
	S3_SECRET_KEY: z.string(),
});

export const env = EnvSchema.parse(process.env);
