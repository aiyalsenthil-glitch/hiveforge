import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus } from '@nestjs/common';
import { Response } from 'express';
import { BaseError } from '@hiveforge/errors';
import { AuthenticatedRequest } from '../middleware/demo-auth.middleware';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  catch(exception: any, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<AuthenticatedRequest>();

    const requestId = request.requestId || 'unknown';
    const correlationId = request.correlationId || 'unknown';

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let code = 'INTERNAL_ERROR';
    let message = 'An unexpected error occurred';
    let details: any = undefined;

    if (exception instanceof BaseError) {
      status = exception.statusCode;
      code = exception.code;
      message = exception.message;
      details = exception.details;
    } else if (exception instanceof HttpException) {
      status = exception.getStatus();
      const resContent = exception.getResponse();
      code = 'HTTP_EXCEPTION';
      message = typeof resContent === 'string' ? resContent : (resContent as any).message || exception.message;
    } else if (exception instanceof Error) {
      message = exception.message;
      if (process.env['NODE_ENV'] !== 'production') {
        details = { stack: exception.stack };
      }
    }

    // Log the exception
    console.error(`[${correlationId}] ❌ [${code}] Error: ${message}`, details || exception);

    response.status(status).json({
      success: false,
      error: {
        code,
        message,
        details,
        requestId,
        correlationId,
        timestamp: new Date().toISOString()
      }
    });
  }
}
