import { BaseApiHandler } from '@/lib/api/handler';
import { microserviceProxy } from '@/lib/api/proxy';
import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';

class LoginHandler extends BaseApiHandler {
  async POST(request: NextRequest) {
    try {
      logger.info('Proxying login request to Auth Service via Gateway');

      // リクエストボディを取得（プロキシ前に読み取り）
      const body = await request.json();
      const { email, password } = body;

      if (!email || !password) {
        return this.errorResponse('メールアドレスとパスワードは必須です', 400);
      }

      // 新しいリクエストを作成（元のリクエストは既にbodyを読み取り済みのため）
      const proxyRequest = new Request(request.url, {
        method: 'POST',
        headers: request.headers,
        body: JSON.stringify({ email, password })
      });

      // Auth Service経由でKeycloakログインを実行
      const response = await microserviceProxy.proxyToAuthService('/login', proxyRequest as NextRequest, {
        requireAuth: false,
        fallback: () => this.getFallbackLogin(email)
      });

      return response;
    } catch (error) {
      logger.error('Login API proxy error', { error });
      return this.handleError(error, 'ログインに失敗しました');
    }
  }

  // フォールバック用のメソッド（Auth Service停止時の対応）
  private async getFallbackLogin(email: string): Promise<NextResponse> {
    logger.warn('Using fallback for login API', { email });

    // デモ用のトークンを生成（実際の運用では適切な実装が必要）
    const fallbackToken = Buffer.from(JSON.stringify({
      email,
      sub: `fallback-${Date.now()}`,
      exp: Math.floor(Date.now() / 1000) + 3600 // 1時間後
    })).toString('base64');

    const response = NextResponse.json({
      success: true,
      user: {
        email,
        userId: `fallback-${Date.now()}`
      },
      isFallback: true,
      message: "認証サービス復旧中のため、一時的なアクセスを許可しています"
    });

    // フォールバック用のクッキーを設定
    response.cookies.set({
      name: 'idToken',
      value: fallbackToken,
      path: '/',
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      httpOnly: true,
      maxAge: 3600 // 1時間
    });

    return response;
  }
}

const handler = new LoginHandler();
export const POST = handler.POST.bind(handler);