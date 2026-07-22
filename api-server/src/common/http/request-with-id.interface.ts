import type { Request } from 'express';

export interface RequestWithId extends Request {
  id: string;
  requestId?: string;
  user?: {
    sub: string;
    username: string;
    displayName: string;
    roles: string[];
    permissions: string[];
  };
}

export function getRequestId(request: RequestWithId): string {
  return request.requestId ?? request.id ?? 'unknown';
}
