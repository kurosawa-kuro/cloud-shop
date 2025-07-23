import { BaseApiHandler } from '@/lib/api/handler';
import { microserviceProxy } from '@/lib/api/proxy';
import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import { prisma } from '@/lib/database/prisma';

class CheckoutPrepareHandler extends BaseApiHandler {
  async GET(request: NextRequest) {
    try {
      const { userId } = await this.getHeaders();
      const authError = this.checkAuth(userId);
      if (authError) return authError;

      logger.info('Proxying checkout prepare request to Orders Service', { userId });

      // Orders Service経由でチェックアウト準備処理を実行
      const response = await microserviceProxy.proxyToOrdersService('/checkout/prepare', request, {
        requireAuth: true,
        fallback: () => this.getFallbackCheckoutPrepare(userId!)
      });

      return response;
    } catch (error) {
      logger.error('Checkout prepare API proxy error', { error });
      return this.handleError(error, 'チェックアウト準備処理に失敗しました');
    }
  }

  async POST(request: NextRequest) {
    try {
      const { userId } = await this.getHeaders();
      const authError = this.checkAuth(userId);
      if (authError) return authError;

      // リクエストボディを取得（配送先、支払い方法など）
      const body = await request.json();
      const { shippingAddress, paymentMethod, couponCode } = body;

      logger.info('Proxying checkout prepare POST request to Orders Service', { 
        userId, 
        hasShippingAddress: !!shippingAddress,
        paymentMethod
      });

      // 新しいリクエストを作成
      const proxyRequest = new Request(request.url, {
        method: 'POST',
        headers: request.headers,
        body: JSON.stringify({ shippingAddress, paymentMethod, couponCode })
      });

      // Orders Service経由でチェックアウト準備処理を実行
      const response = await microserviceProxy.proxyToOrdersService('/checkout/prepare', proxyRequest as NextRequest, {
        requireAuth: true,
        fallback: () => this.getFallbackCheckoutPreparePost(userId!, { shippingAddress, paymentMethod, couponCode })
      });

      return response;
    } catch (error) {
      logger.error('Checkout prepare POST API proxy error', { error });
      return this.handleError(error, 'チェックアウト準備処理に失敗しました');
    }
  }

  // フォールバック: チェックアウト準備（GET）
  private async getFallbackCheckoutPrepare(userId: string): Promise<NextResponse> {
    logger.warn('Using fallback for checkout prepare GET', { userId });

    try {
      // ローカルDBからカート情報を取得してチェックアウト情報を準備
      const cartItems = await prisma.cartItem.findMany({
        where: { userId },
        include: { product: true }
      });

      if (cartItems.length === 0) {
        return NextResponse.json({
          success: false,
          error: "カートが空です",
          isFallback: true
        }, { status: 400 });
      }

      // 基本的なチェックアウト情報を準備
      const subtotal = cartItems.reduce((total, item) => {
        return total + (item.product.price * item.quantity);
      }, 0);

      const taxRate = 0.10;
      const tax = Math.floor(subtotal * taxRate);
      const shippingFee = subtotal >= 5000 ? 0 : 500; // 5000円以上で送料無料
      const total = subtotal + tax + shippingFee;

      return NextResponse.json({
        success: true,
        data: {
          items: cartItems.map(item => ({
            id: item.id,
            productId: item.productId,
            productName: item.product.name,
            price: item.product.price,
            quantity: item.quantity,
            subtotal: item.product.price * item.quantity
          })),
          pricing: {
            subtotal,
            tax,
            shippingFee,
            total
          },
          availablePaymentMethods: ['credit_card', 'bank_transfer', 'cod'],
          estimatedDelivery: '3-5営業日'
        },
        isFallback: true,
        message: "Orders Serviceが一時的に利用できないため、基本的なチェックアウト情報を表示しています"
      });
    } catch (error) {
      logger.error('Fallback checkout prepare GET failed', { error, userId });
      return NextResponse.json({
        success: false,
        error: "チェックアウト準備処理に失敗しました",
        isFallback: true
      }, { status: 500 });
    }
  }

  // フォールバック: チェックアウト準備（POST）
  private async getFallbackCheckoutPreparePost(
    userId: string, 
    data: { shippingAddress?: any, paymentMethod?: string, couponCode?: string }
  ): Promise<NextResponse> {
    logger.warn('Using fallback for checkout prepare POST', { userId, data });

    try {
      const { shippingAddress, paymentMethod, couponCode } = data;

      // バリデーション
      if (!shippingAddress || !paymentMethod) {
        return NextResponse.json({
          success: false,
          error: "配送先住所と支払い方法は必須です",
          isFallback: true
        }, { status: 400 });
      }

      // フォールバック時は基本的な検証のみ実行
      const checkoutSession = {
        sessionId: `fallback-${Date.now()}-${userId}`,
        userId,
        shippingAddress,
        paymentMethod,
        couponCode,
        status: 'prepared',
        expiresAt: new Date(Date.now() + 30 * 60 * 1000), // 30分後
        createdAt: new Date()
      };

      return NextResponse.json({
        success: true,
        data: {
          checkoutSession,
          message: "チェックアウトセッションが準備されました"
        },
        isFallback: true,
        note: "Orders Serviceが一時的に利用できないため、セッション情報はローカルで管理されています"
      });
    } catch (error) {
      logger.error('Fallback checkout prepare POST failed', { error, userId });
      return NextResponse.json({
        success: false,
        error: "チェックアウト準備処理に失敗しました",
        isFallback: true
      }, { status: 500 });
    }
  }
}

const handler = new CheckoutPrepareHandler();
export const GET = handler.GET.bind(handler);
export const POST = handler.POST.bind(handler);