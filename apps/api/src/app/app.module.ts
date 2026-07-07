import { Module, NestModule, MiddlewareConsumer, RequestMethod } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { RequestIdMiddleware } from './common/middleware/request-id.middleware';
import { DemoAuthMiddleware } from './common/middleware/demo-auth.middleware';

@Module({
  imports: [],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(RequestIdMiddleware, DemoAuthMiddleware)
      .forRoutes({ path: '*', method: RequestMethod.ALL });
  }
}
