import { z } from 'zod';
import { env } from '../env';
import { minioClient } from '../infra/minio';
import { defineController } from "../server";
import { MinIOClipsRepository } from './minio-clips.repository';

export const ClipsController = defineController(http => {
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
      const uploadedFilename = await clipsRepository.upload({ filename, file })

      return reply.send({ message: 'Upload successful', filename: uploadedFilename });
    } catch (error) {
      if (error instanceof Error) {
        return reply.status(409).send({ error: error.message });
      }

      return reply.status(500).send({ error: 'Internal server error' });
    }
  });
});
