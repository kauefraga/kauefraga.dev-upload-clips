import { S3Client } from '@aws-sdk/client-s3';
import { env } from '../env';

export const s3 = new S3Client({
  region: 'auto',
  forcePathStyle: false,
  endpoint: env.S3_ENDPOINT,
  credentials: {
    accessKeyId: env.S3_ACCESS_KEY,
    secretAccessKey: env.S3_SECRET_KEY,
  }
});
