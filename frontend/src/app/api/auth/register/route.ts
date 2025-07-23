import { BaseApiHandler } from '@/lib/api/handler';
import { microserviceProxy } from '@/lib/api/proxy';
import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';

interface RegisterRequestBody {
  email: string;
  password: string;
}

class RegisterHandler extends BaseApiHandler {
  async POST(request: NextRequest) {
    try {
      logger.info('Proxying register request to Auth Service via Gateway');

      // リクエストボディを取得（プロキシ前に読み取り）
      const body = await request.json() as RegisterRequestBody;
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

      // Auth Service経由でKeycloakユーザー登録を実行
      const response = await microserviceProxy.proxyToAuthService('/register', proxyRequest as NextRequest, {
        requireAuth: false,
        fallback: () => this.getFallbackRegister(email)
      });

      return response;
    } catch (error) {
      logger.error('Register API proxy error', { error });
      return this.handleError(error, 'ユーザー登録に失敗しました');
    }
  }

  // フォールバック用のメソッド（Auth Service停止時の対応）
  private async getFallbackRegister(email: string): Promise<NextResponse> {
    logger.warn('Using fallback for register API', { email });

    // フォールバック用のユーザーIDを生成
    const fallbackUserId = `fallback-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    const response = NextResponse.json({
      success: true,
      user: {
        id: fallbackUserId,
        email,
        status: "PENDING",
        emailVerified: false,
        createdAt: new Date().toISOString()
      },
      isFallback: true,
      message: "認証サービス復旧中のため、登録は一時的に保留されています。復旧後に再度お試しください。"
    }, { status: 201 });

    return response;
  }
}

const handler = new RegisterHandler();
export const POST = handler.POST.bind(handler);