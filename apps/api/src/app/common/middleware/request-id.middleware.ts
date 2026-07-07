import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { randomUUID } from 'crypto';

export interface TelemetryRequest extends Request {
  requestId: string;
  correlationId: string;
}

@Injectable()
export class RequestIdMiddleware implements NestMiddleware {
  use(req: TelemetryRequest, res: Response, next: NextFunction) {
    const requestId = (req.headers['x-request-id'] as string) || randomUUID();
    const correlationId = (req.headers['x-correlation-id'] as string) || requestId;

    req.requestId = requestId;
    req.correlationId = correlationId;

    // Set headers on response
    res.setHeader('x-request-id', requestId);
    res.setHeader('x-correlation-id', correlationId);

    next();
  }
}
