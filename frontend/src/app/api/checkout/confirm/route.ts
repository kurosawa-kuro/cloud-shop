import { BaseApiHandler } from '@/lib/api/handler';
import { microserviceProxy } from '@/lib/api/proxy';
import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import { prisma } from '@/lib/database/prisma';

class CheckoutConfirmHandler extends BaseApiHandler {
  async POST(request: NextRequest) {
    try {  
      const { userId, requestId, requestUrl } = await this.getHeaders();
      const authError = this.checkAuth(userId);
      if (authError) return authError;

      // リクエストボディを取得（決済情報、配送情報など）
      const body = await request.json();
      const { sessionId, paymentDetails, shippingDetails } = body;

      logger.info('Proxying checkout confirm request to Orders Service', { 
        userId, 
        sessionId,
        hasPaymentDetails: !!paymentDetails 
      });

      // 新しいリクエストを作成
      const proxyRequest = new Request(request.url, {
        method: 'POST',
        headers: request.headers,
        body: JSON.stringify({ 
          sessionId, 
          paymentDetails, 
          shippingDetails,
          requestId,
          requestUrl 
        })
      });

      // Orders Service経由でチェックアウト確定処理を実行
      const response = await microserviceProxy.proxyToOrdersService('/checkout/confirm', proxyRequest as NextRequest, {
        requireAuth: true,
        fallback: () => this.getFallbackCheckoutConfirm(userId!, requestId, requestUrl)
      });

      return response;
    } catch (error) {
      logger.error('Checkout confirm API proxy error', { error });
      return this.handleError(error, 'チェックアウトの処理に失敗しました');
    }
  }

  // フォールバック: チェックアウト確定処理
  private async getFallbackCheckoutConfirm(
    userId: string,
    requestId?: string | null,
    requestUrl?: string | null
  ): Promise<NextResponse> {
    logger.warn('Using fallback for checkout confirm', { userId });

    try {
      // 緊急時のみローカルDBで注文処理を実行（データ整合性のリスクあり）
      const result = await prisma.$transaction(async (tx) => {
        const cartItems = await tx.cartItem.findMany({
          where: { userId },
          include: { 
            product: {
              include: {
                productCategories: {
                  include: {
                    category: true
                  }
                }
              }
            }
          }
        });

        if (cartItems.length === 0) {
          throw new Error('カートが空です');
        }

        // フォールバック用の注文を作成
        const order = await tx.order.create({
          data: {
            userId,
            totalAmount: cartItems.reduce((sum, item) => sum + (item.quantity * item.product.price), 0),
            orderItems: {
              create: cartItems.map(item => ({
                productId: item.productId,
                quantity: item.quantity,
                price: item.product.price
              }))
            }
          }
        });

        // カートをクリア
        await tx.cartItem.deleteMany({
          where: { userId }
        });

        return { order, cartItems };
      });

      // 重要: フォールバック処理の警告をログに記録
      logger.error('CRITICAL: Fallback checkout confirm executed', {
        userId,
        orderId: result.order.id,
        totalAmount: result.order.totalAmount,
        itemCount: result.cartItems.length,
        warning: 'This order may need manual verification due to service outage'
      });

      return NextResponse.json({
        success: true,
        data: {
          order: result.order,
          message: "注文が完了しました"
        },
        isFallback: true,
        warning: "Orders Serviceが一時的に利用できないため、ローカルで処理されました。注文の確認が必要な場合があります",
        requiresManualVerification: true
      }, { status: 201 });

    } catch (error) {
      logger.error('CRITICAL: Fallback checkout confirm failed', { 
        error, 
        userId,
        impact: 'Customer may lose cart items and payment may be processed without order creation'
      });

      // フォールバック失敗時は安全側に倒す（注文を作成しない）
      return NextResponse.json({
        success: false,
        error: "注文処理に失敗しました。カートの内容は保持されています。しばらくしてから再度お試しください",
        isFallback: true,
        retryable: true,
        supportContact: "緊急時は customer-support@example.com までご連絡ください"
      }, { status: 500 });
    }
  }
}

const handler = new CheckoutConfirmHandler();
export const POST = handler.POST.bind(handler);