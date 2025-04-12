import { defineController } from "../server";

export const ClipsController = defineController(http => {
  http.get('/', () => ({ hello: 'world' }))
});
