import cookie from '@fastify/cookie';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import fastify from 'fastify';
import { ZodError } from 'zod';
import { env } from './env';

export function createServer() {
  const http = fastify({
    logger: true,
  });

  http.register(helmet);
  http.register(cors);
  http.register(cookie, {
    secret: env.COOKIE_SECRET
  });

  http.setErrorHandler((error, _, reply) => {
    if (error instanceof ZodError) {
      return reply.status(400).send({ errors: error.errors });
    }

    return reply.status(500).send({ message: error.message });
  });

  return http;
}

type ServerContext = ReturnType<typeof createServer>;

export type Controller = (http: ServerContext) => void;

export function defineController(callback: Controller): Controller {
  return callback;
}

export function defineRoutes(http: ServerContext, controllers: Controller[]) {
  for (const controller of controllers) {
    controller(http);
  }
}
