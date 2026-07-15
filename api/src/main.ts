import 'reflect-metadata';
import { createNestApp } from './bootstrap/create-app';

async function bootstrap() {
  const app = await createNestApp();

  const port = process.env.PORT ?? 3000;
  await app.listen(port);
  console.log(`GuavaJobs API listening on http://localhost:${port}/api/v1`);
  console.log(`Swagger: http://localhost:${port}/api/docs`);
}

bootstrap();
