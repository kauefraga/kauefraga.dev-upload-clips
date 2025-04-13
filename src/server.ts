import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import multipart from '@fastify/multipart';
import fastify from 'fastify';
import { ZodError } from 'zod';

export function createServer() {
  const http = fastify({
    logger: true,
  });

  http.register(helmet);
  http.register(cors);
  http.register(multipart, {
    limits: {
      fileSize: 200 * 1024 * 1024, // 200 MB
    },
  });

  http.setErrorHandler((error, _, reply) => {
    console.log(error); // REMOVE

    if (error instanceof ZodError) {
      return reply.status(400).send({ message: error.errors[0]?.message });
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
