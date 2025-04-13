import { Client as MinioClient } from 'minio';
import { z } from 'zod';
import { env } from '../env';
import { defineController } from "../server";
import { MinIOClipsRepository } from './minio-clips.repository';

export const ClipsController = defineController(http => {
  const minioClient = new MinioClient({
    endPoint: 'localhost',
    port: 9000,
    useSSL: false,
    accessKey: env.S3_ACCESS_KEY,
    secretKey: env.S3_SECRET_KEY,
  });
  const clipsRepository = new MinIOClipsRepository(env.S3_BUCKET_NAME, minioClient);

  http.get('/clips', () => ({ hello: 'world' }));
  http.get('/clips/:id', () => ({ hello: 'world' }));

  const uploadSchema = z.object({
    filename: z.string().min(1),
    fieldname: z.literal('clip'),
    mimetype: z.literal('video/mp4'),
  });

  http.post('/clips/upload', async (request, reply) => {
    const data = await request.file();

    if (!data) {
      return reply.status(400).send({ error: 'No file uploaded' });
    }

    const { filename, fieldname, mimetype, file } = data;

    const validation = uploadSchema.safeParse({ filename, mimetype, fieldname });
    if (!validation.success) {
      return reply.status(400).send({ error: 'Invalid file metadata' });
    }

    try {
      await clipsRepository.upload({ filename, file });
    } catch (error) {
      return reply.status(409).send({ error })
    }

    return reply.send({ message: 'Upload successful', filename });
  });
});
