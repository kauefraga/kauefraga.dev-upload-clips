import { ClipsController } from './clips/clips.controller';
import { createServer, defineRoutes } from './server';
import { UsersController } from './users/users.controller';

const server = createServer();

defineRoutes(server, [UsersController, ClipsController]);

console.log(':> Server running at http://localhost:3333/');
server.listen({ port: 3333 }).catch(reason => console.error('error :>', reason));
