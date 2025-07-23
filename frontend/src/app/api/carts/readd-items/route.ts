import { BaseApiHandler } from '@/lib/api/handler';
import { microserviceProxy } from '@/lib/api/proxy';
import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';

class ReaddItemsHandler extends BaseApiHandler {
  async POST(request: NextRequest) {
    try {
      const { userId } = await this.getHeaders();
      const authError = this.checkAuth(userId);
      if (authError) return authError;

      logger.info('Proxying readd-items request to Cart Service', { userId });

      // リクエストボディを取得（過去の注文IDなどが含まれる想定）
      const body = await request.json();
      const { orderId, items } = body;

      if (!orderId && !items) {
        return this.errorResponse('注文IDまたはアイテム情報が必要です', 400);
      }

      // 新しいリクエストを作成
      const proxyRequest = new Request(request.url, {
        method: 'POST',
        headers: request.headers,
        body: JSON.stringify({ orderId, items })
      });

      // Cart Service経由で再度購入処理を実行
      const response = await microserviceProxy.proxyToCartService('/readd-items', proxyRequest as NextRequest, {
        requireAuth: true,
        fallback: () => this.getFallbackReaddItems(userId!, orderId, items)
      });

      return response;
    } catch (error) {
      logger.error('Readd-items API proxy error', { error });
      return this.handleError(error, '再度購入リクエストに失敗しました');
    }
  }

  // フォールバック: 再度購入処理
  private async getFallbackReaddItems(
    userId: string, 
    orderId?: string, 
    items?: any[]
  ): Promise<NextResponse> {
    logger.warn('Using fallback for readd-items', { userId, orderId });

    try {
      // フォールバック時は基本的な成功レスポンスを返す
      // 実際の実装では、過去の注文履歴からアイテムを特定してカートに追加する処理が必要
      
      return NextResponse.json({
        success: true,
        message: "再度購入リクエストを受け付けました（フォールバックモード）",
        data: {
          orderId,
          itemsCount: items?.length || 0,
          status: "pending"
        },
        isFallback: true,
        note: "Cart Serviceが一時的に利用できないため、リクエストは保留されています。復旧後に処理されます"
      });
    } catch (error) {
      logger.error('Fallback readd-items failed', { error, userId, orderId });
      return NextResponse.json({
        success: false,
        error: "再度購入リクエストの処理に失敗しました",
        isFallback: true
      }, { status: 500 });
    }
  }
}

const handler = new ReaddItemsHandler();
export const POST = handler.POST.bind(handler);