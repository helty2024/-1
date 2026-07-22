import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import type { Response } from 'express';
import {
  getRequestId,
  type RequestWithId,
} from '../http/request-with-id.interface';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const context = host.switchToHttp();
    const request = context.getRequest<RequestWithId>();
    const response = context.getResponse<Response>();
    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;
    const exceptionBody =
      exception instanceof HttpException ? exception.getResponse() : null;
    const message = this.resolveMessage(exception, exceptionBody);
    const requestId = getRequestId(request);

    if (status >= 500) {
      this.logger.error({ requestId, path: request.url, exception }, message);
    }

    response.status(status).json({
      code: status,
      message,
      data: null,
      requestId,
      timestamp: new Date().toISOString(),
      path: request.url,
    });
  }

  private resolveMessage(
    exception: unknown,
    body: string | object | null,
  ): string {
    if (typeof body === 'string') return body;
    if (body && 'message' in body) {
      const message = (body as { message: string | string[] }).message;
      return Array.isArray(message) ? message.join('; ') : message;
    }
    if (exception instanceof Error && exception.message)
      return exception.message;
    return '服务器内部错误';
  }
}
