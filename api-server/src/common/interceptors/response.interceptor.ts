import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { map, type Observable } from 'rxjs';
import type { ApiResponse } from '../http/api-response.interface';
import {
  getRequestId,
  type RequestWithId,
} from '../http/request-with-id.interface';

@Injectable()
export class ResponseInterceptor<T> implements NestInterceptor<
  T,
  ApiResponse<T>
> {
  intercept(
    context: ExecutionContext,
    next: CallHandler<T>,
  ): Observable<ApiResponse<T>> {
    const request = context.switchToHttp().getRequest<RequestWithId>();

    return next.handle().pipe(
      map((data) => ({
        code: 0,
        message: 'ok',
        data,
        requestId: getRequestId(request),
        timestamp: new Date().toISOString(),
      })),
    );
  }
}
