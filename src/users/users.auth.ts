import cookie from '@fastify/cookie';
import { eq } from 'drizzle-orm';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import type { FastifyRequest } from 'fastify';
import { env } from '../env';
import { sessionsTable } from '../infra/database/schema';

/**
 * Check sessionId cookie and fetch user session
 * @returns user's session
 */
export async function AuthUser(request: FastifyRequest, db: NodePgDatabase) {
  const sessionId = request.cookies.sessionId;

  if (!sessionId) {
    return;
  }

  const unsignedSessionId = cookie.unsign(sessionId, env.COOKIE_SECRET);

  const [userSession] = await db
    .select()
    .from(sessionsTable)
    .where(eq(sessionsTable.id, Number(unsignedSessionId.value)))
    .limit(1);

  if (!userSession) {
    return;
  }

  // keep session until the user finishes it (log out)
  if (userSession.keepSignedIn) {
    return userSession;
  }

  const timeSinceSessionStart = new Date().getTime() - userSession.createdAt.getTime();

  // magic numbers: one day (24h) in milliseconds
  if (timeSinceSessionStart > 1000 * 60 * 60 * 24) {
    return; // session expired
  }

  return userSession;
}
