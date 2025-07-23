// lib/api/baseHandler.ts
import { NextResponse } from 'next/server';
import { headers } from "next/headers";
import { logger } from '../logger';

export class BaseApiHandler {
    protected async getHeaders() {
      const headersList = await headers();
      return {
        userId: headersList.get('x-user-id'),
        requestId: headersList.get('x-request-id'),
        requestUrl: headersList.get('x-request-url')
      };
    }
  
    protected checkAuth(userId: string | null) {
      if (!userId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      return null;
    }
  
    protected handleError(error: unknown, defaultMessage: string) {
      const errorObj = error instanceof Error ? error : new Error(defaultMessage);
      logger.error(defaultMessage, errorObj, { context: 'API Error' });
      return this.errorResponse(defaultMessage, 500);
    }

    protected successResponse(data: Record<string, unknown>, status: number = 200) {
      return NextResponse.json({ success: true, ...data }, { status });
    }

    protected errorResponse(message: string, status: number = 400) {
      return NextResponse.json({ success: false, error: message }, { status });
    }
  }