import { NestFactory } from '@nestjs/core';
import { AppModule } from './app/app.module';
import { config } from '@hiveforge/config';
import { GlobalExceptionFilter } from './app/common/filters/exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  app.enableCors();
  
  // Register global exception filter
  app.useGlobalFilters(new GlobalExceptionFilter());
  
  const port = config.PORT;
  await app.listen(port);
  console.log(`🚀 HiveForge API is running on: http://localhost:${port}`);
}
bootstrap();
