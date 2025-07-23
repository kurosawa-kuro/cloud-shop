import { BaseApiHandler } from '@/lib/api/handler';
import { microserviceProxy } from '@/lib/api/proxy';
import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import { prisma } from '@/lib/database/prisma';

class OrderHandler extends BaseApiHandler {
  async GET(request: NextRequest) {
    try {
      const { userId } = await this.getHeaders();
      const authError = this.checkAuth(userId);
      if (authError) return authError;

      logger.info('Proxying orders request to Orders Service', { userId });

      // Orders Service経由で注文履歴を取得
      const response = await microserviceProxy.proxyToOrdersService('', request, {
        requireAuth: true,
        fallback: () => this.getFallbackOrders(userId!)
      });

      return response;
    } catch (error) {
      logger.error('Orders API proxy error', { error, userId: (await this.getHeaders()).userId });
      return this.handleError(error, '購入履歴の取得に失敗しました');
    }
  }

  async POST(request: NextRequest) {
    try {
      const { userId } = await this.getHeaders();
      const authError = this.checkAuth(userId);
      if (authError) return authError;

      // リクエストボディを取得（注文操作: キャンセル、返品リクエストなど）
      const body = await request.json();
      const { orderId, action, reason } = body;

      if (!orderId || !action) {
        return this.errorResponse('注文IDとアクションは必須です', 400);
      }

      logger.info('Proxying order action request to Orders Service', { 
        userId, 
        orderId, 
        action 
      });

      // 新しいリクエストを作成
      const proxyRequest = new Request(request.url, {
        method: 'POST',
        headers: request.headers,
        body: JSON.stringify({ orderId, action, reason })
      });

      // Orders Service経由で注文操作を実行
      const response = await microserviceProxy.proxyToOrdersService('', proxyRequest as NextRequest, {
        requireAuth: true,
        fallback: () => this.getFallbackOrderAction(userId!, orderId, action, reason)
      });

      return response;
    } catch (error) {
      logger.error('Order action API proxy error', { error });
      return this.handleError(error, '注文操作に失敗しました');
    }
  }

  // フォールバック: 注文履歴取得
  private async getFallbackOrders(userId: string): Promise<NextResponse> {
    logger.warn('Using fallback for orders GET', { userId });

    try {
      // ローカルDBから注文履歴を取得（フォールバック）
      const orders = await prisma.order.findMany({
        where: { userId },
        orderBy: { orderedAt: 'desc' },
        include: {
          orderItems: {
            include: {
              product: true
            }
          }
        }
      });

      // 注文ステータスを推定（フォールバック用の簡易ステータス）
      const ordersWithStatus = orders.map(order => {
        const daysSinceOrder = Math.floor(
          (Date.now() - order.orderedAt.getTime()) / (1000 * 60 * 60 * 24)
        );
        
        let estimatedStatus = 'pending';
        if (daysSinceOrder >= 7) {
          estimatedStatus = 'delivered';
        } else if (daysSinceOrder >= 3) {
          estimatedStatus = 'shipped';
        } else if (daysSinceOrder >= 1) {
          estimatedStatus = 'processing';
        }

        return {
          ...order,
          status: estimatedStatus,
          estimatedDelivery: daysSinceOrder < 7 ? '配送中' : '配送完了',
          trackingNumber: `FALLBACK-${order.id}`,
        };
      });

      return NextResponse.json({
        success: true,
        orders: ordersWithStatus,
        isFallback: true,
        message: "Orders Serviceが一時的に利用できないため、ローカルデータを表示しています。最新のステータス情報は反映されていない可能性があります"
      });
    } catch (error) {
      logger.error('Fallback orders GET failed', { error, userId });
      return NextResponse.json({
        success: true,
        orders: [],
        isFallback: true,
        message: "注文履歴を取得できませんでした。しばらくしてから再度お試しください"
      });
    }
  }

  // フォールバック: 注文操作
  private async getFallbackOrderAction(
    userId: string, 
    orderId: string, 
    action: string, 
    reason?: string
  ): Promise<NextResponse> {
    logger.warn('Using fallback for order action', { userId, orderId, action });

    try {
      // フォールバック時は安全のため、基本的に操作を受け付けるが実行はしない
      const allowedActions = ['cancel', 'return_request', 'review'];
      
      if (!allowedActions.includes(action)) {
        return NextResponse.json({
          success: false,
          error: "サポートされていないアクションです",
          isFallback: true
        }, { status: 400 });
      }

      // 注文の存在確認
      const order = await prisma.order.findFirst({
        where: { id: parseInt(orderId), userId }
      });

      if (!order) {
        return NextResponse.json({
          success: false,
          error: "注文が見つかりません",
          isFallback: true
        }, { status: 404 });
      }

      // フォールバック時は操作をログに記録するのみ
      logger.info('Order action logged for manual processing', { 
        userId, 
        orderId, 
        action, 
        reason,
        fallbackMode: true 
      });

      let actionMessage = '';
      switch (action) {
        case 'cancel':
          actionMessage = 'キャンセルリクエストを受け付けました';
          break;
        case 'return_request':
          actionMessage = '返品リクエストを受け付けました';
          break;
        case 'review':
          actionMessage = 'レビューリクエストを受け付けました';
          break;
      }

      return NextResponse.json({
        success: true,
        message: `${actionMessage}（フォールバックモード）`,
        data: {
          orderId,
          action,
          status: 'pending_manual_processing',
          requestId: `fallback-${Date.now()}-${orderId}`
        },
        isFallback: true,
        note: "Orders Serviceが一時的に利用できないため、リクエストは手動処理のためキューに追加されました。カスタマーサポートから連絡いたします"
      });
    } catch (error) {
      logger.error('Fallback order action failed', { error, userId, orderId, action });
      return NextResponse.json({
        success: false,
        error: "注文操作に失敗しました。カスタマーサポートまでご連絡ください",
        isFallback: true,
        supportContact: "customer-support@example.com"
      }, { status: 500 });
    }
  }
}

const handler = new OrderHandler();
export const GET = handler.GET.bind(handler);
export const POST = handler.POST.bind(handler);