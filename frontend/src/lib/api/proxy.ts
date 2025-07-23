import { NextRequest, NextResponse } from 'next/server';
import { logger } from '../logger';

export interface ProxyOptions {
  requireAuth?: boolean;
  timeout?: number;
  retries?: number;
  fallback?: () => Promise<NextResponse>;
}

export class MicroserviceProxy {
  private readonly DEFAULT_TIMEOUT = 30000;

  constructor() {}

  async proxyRequest(
    servicePath: string,
    request: NextRequest,
    options: ProxyOptions = {}
  ): Promise<NextResponse> {
    const {
      requireAuth = true,
      timeout = this.DEFAULT_TIMEOUT,
      fallback
    } = options;

    try {
      // リクエストヘッダーの準備
      const headers = await this.prepareHeaders(request, requireAuth);
      
      // リクエストボディの準備
      const body = await this.prepareBody(request);

      // Gateway経由でサービス呼び出し
      const response = await this.callService(
        servicePath,
        {
          method: request.method,
          headers,
          body,
          timeout
        }
      );

      return this.createSuccessResponse(response);

    } catch (error) {
      logger.error('Proxy request failed', error instanceof Error ? error : new Error(String(error)));
      
      // フォールバック処理
      if (fallback) {
        try {
          return await fallback();
        } catch (fallbackError) {
          logger.error('Fallback failed', fallbackError instanceof Error ? fallbackError : new Error(String(fallbackError)));
        }
      }

      return this.createErrorResponse('サービスエラーが発生しました', 500);
    }
  }

  private async prepareHeaders(
    request: NextRequest,
    requireAuth: boolean
  ): Promise<Record<string, string>> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    };

    // Authorization ヘッダーの転送
    const authHeader = request.headers.get('Authorization');
    if (authHeader) {
      headers['Authorization'] = authHeader;
    } else if (requireAuth) {
      throw new Error('Authorization header required');
    }

    // カスタムヘッダーの転送
    const userId = request.headers.get('x-user-id');
    if (userId) {
      headers['x-user-id'] = userId;
    }

    const requestId = request.headers.get('x-request-id');
    if (requestId) {
      headers['x-request-id'] = requestId;
    }

    return headers;
  }

  private async prepareBody(request: NextRequest): Promise<string | undefined> {
    if (request.method === 'GET' || request.method === 'HEAD') {
      return undefined;
    }

    try {
      const contentType = request.headers.get('content-type');
      
      if (contentType?.includes('application/json')) {
        const json = await request.json();
        return JSON.stringify(json);
      }
      
      return await request.text();
    } catch (error) {
      logger.warn('Failed to parse request body', { error });
      return undefined;
    }
  }

  private async callService(
    path: string,
    options: any
  ): Promise<any> {
    const gatewayUrl = 'http://localhost:8072'; // Backend gateway URL
    const url = `${gatewayUrl}${path}`;

    const response = await fetch(url, {
      method: options.method,
      headers: options.headers,
      body: options.body,
      signal: AbortSignal.timeout(options.timeout)
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return await response.json();
  }

  private createSuccessResponse(data: any): NextResponse {
    return NextResponse.json(data, {
      status: 200,
      headers: {
        'Cache-Control': 'no-store, max-age=0'
      }
    });
  }

  private createErrorResponse(message: string, status: number): NextResponse {
    return NextResponse.json({
      success: false,
      error: message,
      timestamp: new Date().toISOString()
    }, { status });
  }

  // サービス固有のプロキシメソッド
  async proxyToProductsService(
    path: string,
    request: NextRequest,
    options: ProxyOptions = {}
  ): Promise<NextResponse> {
    return this.proxyRequest(`/cloud-shop/products${path}`, request, {
      requireAuth: false,
      ...options
    });
  }

  async proxyToUsersService(
    path: string,
    request: NextRequest,
    options: ProxyOptions = {}
  ): Promise<NextResponse> {
    return this.proxyRequest(`/cloud-shop/users${path}`, request, options);
  }

  async proxyToCartService(
    path: string,
    request: NextRequest,
    options: ProxyOptions = {}
  ): Promise<NextResponse> {
    return this.proxyRequest(`/cloud-shop/cart${path}`, request, options);
  }

  async proxyToOrdersService(
    path: string,
    request: NextRequest,
    options: ProxyOptions = {}
  ): Promise<NextResponse> {
    return this.proxyRequest(`/cloud-shop/orders${path}`, request, options);
  }

  async proxyToPaymentsService(
    path: string,
    request: NextRequest,
    options: ProxyOptions = {}
  ): Promise<NextResponse> {
    return this.proxyRequest(`/cloud-shop/payments${path}`, request, options);
  }

  async proxyToAnalyticsService(
    path: string,
    request: NextRequest,
    options: ProxyOptions = {}
  ): Promise<NextResponse> {
    return this.proxyRequest(`/cloud-shop/analytics${path}`, request, options);
  }

  async proxyToContentService(
    path: string,
    request: NextRequest,
    options: ProxyOptions = {}
  ): Promise<NextResponse> {
    return this.proxyRequest(`/cloud-shop/content${path}`, request, {
      requireAuth: false,
      ...options
    });
  }

  async proxyToAuthService(
    path: string,
    request: NextRequest,
    options: ProxyOptions = {}
  ): Promise<NextResponse> {
    return this.proxyRequest(`/auth${path}`, request, {
      requireAuth: false,
      ...options
    });
  }
}

// シングルトンインスタンス
export const microserviceProxy = new MicroserviceProxy();