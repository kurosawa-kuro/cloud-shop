import { BaseApiHandler } from '@/lib/api/handler';
import { microserviceProxy } from '@/lib/api/proxy';
import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import { prisma } from '@/lib/database/prisma';

class CartHandler extends BaseApiHandler {
  async GET(request: NextRequest) {
    try {
      const { userId } = await this.getHeaders();
      const authError = this.checkAuth(userId);
      if (authError) return authError;

      logger.info('Proxying cart GET request to Cart Service', { userId });

      // Cart Service経由でカート情報を取得
      const response = await microserviceProxy.proxyToCartService('', request, {
        requireAuth: true,
        fallback: () => this.getFallbackCart(userId!)
      });

      return response;
    } catch (error) {
      logger.error('Cart GET API proxy error', { error, userId: (await this.getHeaders()).userId });
      return this.handleError(error, 'カートの取得に失敗しました');
    }
  }

  async POST(request: NextRequest) {
    try {
      const { userId, requestId } = await this.getHeaders();
      const authError = this.checkAuth(userId);
      if (authError) return authError;

      // リクエストボディを取得（バリデーション用）
      const body = await request.json();
      const { productId, quantity = 1 } = body;

      if (!productId) {
        return this.errorResponse('商品IDが必要です', 400);
      }

      if (quantity < 1 || quantity > 100) {
        return this.errorResponse('数量は1〜100の範囲で指定してください', 400);
      }

      logger.info('Proxying cart POST request to Cart Service', { 
        userId, 
        productId, 
        quantity 
      });

      // 新しいリクエストを作成
      const proxyRequest = new Request(request.url, {
        method: 'POST',
        headers: request.headers,
        body: JSON.stringify({ productId, quantity })
      });

      // Cart Service経由でカートに追加
      const response = await microserviceProxy.proxyToCartService('', proxyRequest as NextRequest, {
        requireAuth: true,
        fallback: () => this.getFallbackAddToCart(userId!, productId, quantity, requestId)
      });

      return response;
    } catch (error) {
      logger.error('Cart POST API proxy error', { error });
      return this.handleError(error, 'カートへの追加に失敗しました');
    }
  }

  async DELETE(request: NextRequest) {
    try {
      const { userId } = await this.getHeaders();
      const authError = this.checkAuth(userId);
      if (authError) return authError;

      const { searchParams } = new URL(request.url);
      const cartItemId = searchParams.get('cartItemId');

      if (!cartItemId) {
        return this.errorResponse('カートアイテムIDが必要です', 400);
      }

      logger.info('Proxying cart DELETE request to Cart Service', { 
        userId, 
        cartItemId 
      });

      // Cart Service経由でカートアイテムを削除
      const response = await microserviceProxy.proxyToCartService('', request, {
        requireAuth: true,
        fallback: () => this.getFallbackDeleteCartItem(userId!, cartItemId)
      });

      return response;
    } catch (error) {
      logger.error('Cart DELETE API proxy error', { error });
      return this.handleError(error, 'カートアイテムの削除に失敗しました');
    }
  }

  // フォールバック: カート取得
  private async getFallbackCart(userId: string): Promise<NextResponse> {
    logger.warn('Using fallback for cart GET', { userId });

    try {
      // ローカルDBからカート情報を取得（フォールバック）
      const cartItems = await prisma.cartItem.findMany({
        where: { userId },
        include: { product: true }
      });

      return NextResponse.json({
        success: true,
        cartItems,
        isFallback: true,
        message: "Cart Serviceが一時的に利用できないため、ローカルデータを表示しています"
      });
    } catch (error) {
      logger.error('Fallback cart GET failed', { error, userId });
      return NextResponse.json({
        success: true,
        cartItems: [],
        isFallback: true,
        message: "カートデータを取得できませんでした。しばらくしてから再度お試しください"
      });
    }
  }

  // フォールバック: カート追加
  private async getFallbackAddToCart(
    userId: string, 
    productId: number, 
    quantity: number,
    requestId?: string | null
  ): Promise<NextResponse> {
    logger.warn('Using fallback for cart POST', { userId, productId, quantity });

    try {
      // ローカルDBに直接保存（フォールバック）
      const existingCartItem = await prisma.cartItem.findFirst({
        where: { userId, productId: parseInt(productId.toString()) }
      });

      let cartItem;
      if (existingCartItem) {
        cartItem = await prisma.cartItem.update({
          where: { id: existingCartItem.id },
          data: { quantity: existingCartItem.quantity + quantity },
          include: { product: true }
        });
      } else {
        cartItem = await prisma.cartItem.create({
          data: {
            userId,
            productId: parseInt(productId.toString()),
            quantity
          },
          include: { product: true }
        });
      }

      return NextResponse.json({
        success: true,
        cartItem,
        isFallback: true,
        message: "Cart Serviceが一時的に利用できないため、ローカルに保存しました。後でサービス復旧時に同期されます"
      }, { status: 201 });
    } catch (error) {
      logger.error('Fallback cart POST failed', { error, userId, productId });
      return NextResponse.json({
        success: false,
        error: "カートへの追加に失敗しました。しばらくしてから再度お試しください",
        isFallback: true
      }, { status: 500 });
    }
  }

  // フォールバック: カートアイテム削除
  private async getFallbackDeleteCartItem(
    userId: string, 
    cartItemId: string
  ): Promise<NextResponse> {
    logger.warn('Using fallback for cart DELETE', { userId, cartItemId });

    try {
      // ローカルDBから削除（フォールバック）
      const cartItem = await prisma.cartItem.findFirst({
        where: { id: parseInt(cartItemId), userId },
        include: { product: true }
      });

      if (!cartItem) {
        return NextResponse.json({
          success: false,
          error: "カートアイテムが見つかりません",
          isFallback: true
        }, { status: 404 });
      }

      await prisma.cartItem.delete({ 
        where: { id: parseInt(cartItemId) } 
      });

      return NextResponse.json({
        success: true,
        isFallback: true,
        message: "Cart Serviceが一時的に利用できないため、ローカルから削除しました"
      });
    } catch (error) {
      logger.error('Fallback cart DELETE failed', { error, userId, cartItemId });
      return NextResponse.json({
        success: false,
        error: "カートアイテムの削除に失敗しました",
        isFallback: true
      }, { status: 500 });
    }
  }
}

const handler = new CartHandler();

export const GET = handler.GET.bind(handler);
export const POST = handler.POST.bind(handler);
export const DELETE = handler.DELETE.bind(handler);