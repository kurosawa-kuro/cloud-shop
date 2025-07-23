import { BaseApiHandler } from '@/lib/api/handler';
import { microserviceProxy } from '@/lib/api/proxy';
import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';

class ConfirmHandler extends BaseApiHandler {
  async POST(request: NextRequest) {
    try {
      logger.info('Proxying confirm request to Auth Service via Gateway');

      // リクエストボディを取得（プロキシ前に読み取り）
      const body = await request.json();
      const { email, code } = body;

      if (!email || !code) {
        return this.errorResponse('メールアドレスと確認コードは必須です', 400);
      }

      // 新しいリクエストを作成（元のリクエストは既にbodyを読み取り済みのため）
      const proxyRequest = new Request(request.url, {
        method: 'POST',
        headers: request.headers,
        body: JSON.stringify({ email, code })
      });

      // Auth Service経由でKeycloakメール確認を実行
      const response = await microserviceProxy.proxyToAuthService('/confirm', proxyRequest as NextRequest, {
        requireAuth: false,
        fallback: () => this.getFallbackConfirm(email, code)
      });

      return response;
    } catch (error) {
      logger.error('Confirm API proxy error', { error });
      return this.handleError(error, '確認コードの検証に失敗しました');
    }
  }

  // フォールバック用のメソッド（Auth Service停止時の対応）
  private async getFallbackConfirm(email: string, code: string): Promise<NextResponse> {
    logger.warn('Using fallback for confirm API', { email });

    // フォールバック時は基本的にすべての確認を受け入れる（開発・テスト用）
    const isValidCode = code && code.length >= 4; // 最低限のバリデーション

    if (!isValidCode) {
      return NextResponse.json({
        success: false,
        error: "無効な確認コードです",
        isFallback: true
      }, { status: 400 });
    }

    const response = NextResponse.json({
      success: true,
      message: "メールアドレスが確認されました（フォールバックモード）",
      user: {
        email,
        emailVerified: true,
        verifiedAt: new Date().toISOString()
      },
      isFallback: true
    });

    return response;
  }
}

const handler = new ConfirmHandler();
export const POST = handler.POST.bind(handler); 