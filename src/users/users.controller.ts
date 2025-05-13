import argon2 from 'argon2';
import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '../infra/database';
import { sessionsTable, usersTable } from '../infra/database/schema';
import { defineController } from '../server';
import { AuthUser } from './users.auth';

export const UsersController = defineController(http => {
  const AuthUserSchema = z.object({
    email: z.string().max(255).email(),
    password: z.string().max(255),
    keepSignedIn: z.boolean().optional(),
  });

  http.post('/v1/user/auth', async (request, reply) => {
    const userSession = await AuthUser(request, db);

    if (userSession) {
      return reply.status(400).send({
        message: 'Session already exists.',
      });
    }

    const { email, password, keepSignedIn } = AuthUserSchema.parse(request.body);

    const [existingUser] = await db.select().from(usersTable)
      .where(eq(usersTable.email, email))
      .limit(1);

    if (!existingUser) {
      return reply.status(400).send({
        message: 'User does not exist.',
      });
    }

    const passwordMatch = await argon2.verify(existingUser.password, password);

    if (!passwordMatch) {
      return reply.status(400).send({
        message: 'User email or password are invalid.',
      });
    }

    const [newSession] = await db
      .insert(sessionsTable)
      .values({ userId: existingUser.id, keepSignedIn })
      .returning();

    return reply
      .cookie('sessionId', `${newSession.id}`, {
        signed: true,
        httpOnly: true,
        sameSite: 'strict',
        // magic numbers: one day (24h) in milliseconds
        maxAge: new Date().getTime() + 1000 * 60 * 60 * 24
      })
      .status(201)
      .send(newSession);
  });

  http.delete('/v1/user/logout', async (request, reply) => {
    const userSession = await AuthUser(request, db);

    if (!userSession) {
      return reply.status(401).send({
        message: 'No session to log out.',
      });
    }

    const { rowCount } = await db.delete(sessionsTable).where(eq(sessionsTable.id, userSession.id));

    if (rowCount === 0) {
      return reply.status(500).send({
        message: 'Failed to delete session.'
      });
    }

    return reply
      .clearCookie('sessionId')
      .status(204)
      .send();
  });
});
