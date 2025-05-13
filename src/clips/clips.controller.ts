import { and, eq } from 'drizzle-orm';
import { z } from 'zod';
import { env } from '../env';
import { db } from '../infra/database';
import { clipsTable, usersTable } from '../infra/database/schema';
import { s3 } from '../infra/s3';
import { defineController } from '../server';
import { AuthUser } from '../users/users.auth';
import { S3ClipsRepository } from './clips.s3';

export const ClipsController = defineController(http => {
  const clipsRepository = new S3ClipsRepository(env.S3_BUCKET_NAME, s3);

  http.get('/v1/clips', () => ({ hello: 'world' }));
  http.get('/v1/clips/:id', () => ({ hello: 'world' }));

  const UploadClipSchema = z.object({
    title: z.string().min(1).max(255),
    description: z.string().max(255).optional(),
    filename: z.string().min(1),
    size: z.number().int().positive().min(1),
  });

  http.post('/v1/clips/upload', async (request, reply) => {
    const userSession = await AuthUser(request, db);

    if (!userSession) {
      return reply.status(401).send({
        message: 'Must be logged in to upload a clip.',
      });
    }

    const [user] = await db.select().from(usersTable)
      .where(eq(usersTable.id, userSession.userId))
      .limit(1);

    if (!user.isAdmin) {
      return reply.status(403).send({
        message: 'You do not have permission to upload a clip.',
      });
    }

    const { title, description, filename, size } = UploadClipSchema.parse(request.body);

    const [clipExists] = await db.select().from(clipsTable)
      .where(and(
        eq(clipsTable.userId, userSession.userId),
        eq(clipsTable.title, title),
      ));

    const clipExistsAndIsUploading = clipExists && clipExists.status !== 'not_uploaded';

    if (clipExistsAndIsUploading) {
      return reply.status(409).send({
        message: 'Clip with this title already exists.',
      });
    }

    const presignedUrl = await clipsRepository.generatePresignedURL({
      filename,
      size,
    });

    if (!presignedUrl) {
      return reply.status(500).send({
        message: 'Failed to generate presigned URL.',
      });
    }

    if (clipExists) {
      await db.update(clipsTable).set({
        status: 'in_progress',
      }).catch(() => {
        return reply.status(500).send({
          message: 'Failed to update clip status.',
        });
      });

      return reply.status(200).send({
        id: clipExists.id,
        presignedUrl,
      });
    }

    const [clip] = await db.insert(clipsTable).values({
      userId: userSession.userId,
      title,
      description,
      status: 'in_progress',
      bucketUrl: '', // MAYBE THE BUCKETURL COLUMN SHOULD BE NULLABLE
      size,
    }).returning({
      id: clipsTable.id,
    }).catch(() => {
      return reply.status(500).send({
        message: 'Failed to register clip upload.',
      });
    });

    return reply.status(200).send({
      id: clip.id,
      presignedUrl,
    });
  });

  const ConfirmUploadSchema = z.object({
    clipId: z.string().uuid(),
    bucketUrl: z.string().url(),
    filename: z.string().min(1),
  });

  http.patch('/v1/clips/confirm-upload', async (request, reply) => {
    const userSession = await AuthUser(request, db);

    if (!userSession) {
      return reply.status(401).send({
        message: 'Must be logged in to confirm upload.',
      });
    }

    const [user] = await db.select().from(usersTable)
      .where(eq(usersTable.id, userSession.userId))
      .limit(1);

    if (!user.isAdmin) {
      return reply.status(403).send({
        message: 'You do not have permission to confirm upload.',
      });
    }
    const { clipId, bucketUrl, filename } = ConfirmUploadSchema.parse(request.body);

    const clipExistsInS3 = await clipsRepository.checkIfClipExists(`clips/${filename}`);

    if (!clipExistsInS3) {
      return reply.status(404).send({
        message: 'Clip not found in S3 bucket.',
      });
    }

    const [clip] = await db.select().from(clipsTable)
      .where(and(
        eq(clipsTable.userId, userSession.userId),
        eq(clipsTable.id, clipId),
      ))
      .limit(1);

    if (!clip) {
      return reply.status(404).send({
        message: 'Clip not found.',
      });
    }

    if (clip.status !== 'in_progress') {
      return reply.status(409).send({
        message: 'Clip is not in progress.',
      });
    }

    await db.update(clipsTable)
      .set({
        status: 'uploaded',
        bucketUrl
      })
      .where(eq(clipsTable.id, clipId))
      .catch(() => {
        return reply.status(500).send({
          message: 'Failed to confirm clip upload.',
        });
      });

    return reply.status(200).send({
      message: 'Clip upload confirmed.',
    });
  });
});
