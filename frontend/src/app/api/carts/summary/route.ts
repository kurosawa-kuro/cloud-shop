import { BaseApiHandler } from '@/lib/api/handler';
import { microserviceProxy } from '@/lib/api/proxy';
import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import { prisma } from '@/lib/database/prisma';

class CartSummaryHandler extends BaseApiHandler {
  async GET(request: NextRequest) {
    try {
      const { userId } = await this.getHeaders();
      const authError = this.checkAuth(userId);
      if (authError) return authError;

      logger.info('Proxying cart summary request to Cart Service', { userId });

      // Cart Service経由でカートサマリーを取得
      const response = await microserviceProxy.proxyToCartService('/summary', request, {
        requireAuth: true,
        fallback: () => this.getFallbackCartSummary(userId!)
      });

      return response;
    } catch (error) {
      logger.error('Cart summary API proxy error', { error, userId: (await this.getHeaders()).userId });
      return this.handleError(error, 'カートサマリーの取得に失敗しました');
    }
  }

  // フォールバック: カートサマリー計算
  private async getFallbackCartSummary(userId: string): Promise<NextResponse> {
    logger.warn('Using fallback for cart summary', { userId });

    try {
      // ローカルDBからカートサマリーを計算（フォールバック）
      const cartItems = await prisma.cartItem.findMany({
        where: { userId },
        include: {
          product: {
            select: {
              price: true
            }
          }
        }
      });

      // 小計を計算
      const subtotal = cartItems.reduce((total, item) => {
        return total + (item.product.price * item.quantity);
      }, 0);

      // 税率計算（仮：10%）
      const taxRate = 0.10;
      const tax = Math.floor(subtotal * taxRate);
      const total = subtotal + tax;

      return NextResponse.json({
        success: true,
        subtotal,
        tax,
        total,
        itemCount: cartItems.length,
        totalQuantity: cartItems.reduce((sum, item) => sum + item.quantity, 0),
        isFallback: true,
        message: "Cart Serviceが一時的に利用できないため、ローカルデータから計算しています"
      });
    } catch (error) {
      logger.error('Fallback cart summary failed', { error, userId });
      return NextResponse.json({
        success: true,
        subtotal: 0,
        tax: 0,
        total: 0,
        itemCount: 0,
        totalQuantity: 0,
        isFallback: true,
        message: "カートサマリーデータを取得できませんでした。しばらくしてから再度お試しください"
      });
    }
  }
}

const handler = new CartSummaryHandler();
export const GET = handler.GET.bind(handler);