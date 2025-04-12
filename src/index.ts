import { ClipsController } from './clips/clips.controller';
import { createServer, defineRoutes } from './server';

const server = createServer();

defineRoutes(server, [ClipsController]);

console.log(':> Server running at http://localhost:3333/');
server.listen({ port: 3333 }).catch(reason => console.error('error :>', reason));
