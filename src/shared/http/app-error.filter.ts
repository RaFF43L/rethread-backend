import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Injectable,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { AppError } from '../kernel/app-error';

// Single place that translates errors into the HTTP response envelope
// (architecture rule): domain/application throw AppError subclasses and never
// know about HTTP. NestJS HttpException (e.g. validation, guards) is still
// honored for framework-level failures.
@Injectable()
@Catch()
export class AppErrorFilter implements ExceptionFilter {
  private readonly logger = new Logger(AppErrorFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error.';
    let details: unknown = null;

    if (exception instanceof AppError) {
      status = exception.statusCode;
      message = exception.message;
      details = exception.details ?? null;
    } else if (exception instanceof HttpException) {
      status = exception.getStatus();
      const body = exception.getResponse() as { message?: string; details?: unknown };
      message = body.message ?? exception.message;
      details = body.details ?? null;
    } else {
      this.logger.error(
        `Unhandled exception on ${request.method} ${request.url}`,
        exception instanceof Error ? exception.stack : String(exception),
      );
    }

    response.status(status).json({
      statusCode: status,
      message,
      details,
      timestamp: new Date().toISOString(),
      path: request.url,
    });
  }
}
