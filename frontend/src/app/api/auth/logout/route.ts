import { BaseApiHandler } from '@/lib/api/handler';
import { microserviceProxy } from '@/lib/api/proxy';
import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';

class LogoutHandler extends BaseApiHandler {
  async POST(request: NextRequest) {
    try {
      logger.info('Proxying logout request to Auth Service via Gateway');

      // Auth Service経由でKeycloakログアウトを実行
      const response = await microserviceProxy.proxyToAuthService('/logout', request, {
        requireAuth: true, // ログアウトは認証が必要
        fallback: () => this.getFallbackLogout()
      });

      // プロキシレスポンスを取得し、追加でクッキーをクリア
      const responseData = await response.json();
      
      const logoutResponse = NextResponse.json(responseData, {
        status: response.status
      });

      // クッキーをクリア
      logoutResponse.cookies.set('idToken', '', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        expires: new Date(0),
        path: '/'
      });

      return logoutResponse;
    } catch (error) {
      logger.error('Logout API proxy error', { error });
      
      // ログアウトエラーでもクッキーはクリアする
      const errorResponse = this.errorResponse('ログアウト処理でエラーが発生しました', 500);
      errorResponse.cookies.set('idToken', '', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        expires: new Date(0),
        path: '/'
      });

      return errorResponse;
    }
  }

  // フォールバック用のメソッド（Auth Service停止時の対応）
  private async getFallbackLogout(): Promise<NextResponse> {
    logger.warn('Using fallback for logout API');

    const response = NextResponse.json({
      success: true,
      message: "ローカルログアウトを実行しました",
      isFallback: true
    });

    // フォールバック時もクッキーをクリア
    response.cookies.set('idToken', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      expires: new Date(0),
      path: '/'
    });

    return response;
  }
}

const handler = new LogoutHandler();
export const POST = handler.POST.bind(handler);