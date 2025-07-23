import { prisma } from '@/lib/database/prisma';
import { ActionType } from '@prisma/client';
import { logger } from '@/lib/logger';
import { BaseApiHandler } from '@/lib/api/handler';

class CartHandler extends BaseApiHandler {
  async GET() {
    try {
      const { userId } = await this.getHeaders();
      const authError = this.checkAuth(userId);
      if (authError) return authError;

      // 戻り値にプロダクトの価格等は含まれますか
      const cartItems = await prisma.cartItem.findMany({
        where: { userId: userId! },
        include: { product: true }
      });

      return this.successResponse({ cartItems });
    } catch (error) {
      return this.handleError(error, 'カートの取得に失敗しました');
    }
  }

  async POST(request: Request) {
    try {
      const { userId, requestId } = await this.getHeaders();
      const authError = this.checkAuth(userId);
      if (authError) return authError;

      const user = await prisma.user.findUnique({ 
        where: { id: userId! } 
      });
      if (!user) {
        return this.errorResponse('ユーザーIDが存在しません', 400);
      }

      const body = await request.json();
      const { productId, quantity = 1 } = body;

      if (!productId) {
        return this.errorResponse('商品IDが必要です', 400);
      }

      const existingCartItem = await prisma.cartItem.findFirst({
        where: { userId: userId!, productId: parseInt(productId) }
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
            userId: userId!,
            productId: parseInt(productId),
            quantity: quantity
          },
          include: { product: true }
        });
      }

      await logger.action({
        actionType: ActionType.CART_ADD,
        userId: userId!,
        requestID: requestId ?? undefined,
        productId: parseInt(productId),
        productName: cartItem.product.name,
        productPrice: cartItem.product.price,
        quantity: quantity,
        cartItemId: cartItem.id,
        metadata: {
          source: 'product_page'
        }
      });

      return this.successResponse({ cartItem }, 201);
    } catch (error) {
      return this.handleError(error, 'カートへの追加に失敗しました');
    }
  }

  async DELETE(request: Request) {
    try {
      const { userId } = await this.getHeaders();
      const authError = this.checkAuth(userId);
      if (authError) return authError;

      const { searchParams } = new URL(request.url);
      const cartItemId = searchParams.get('cartItemId');

      if (!cartItemId) {
        return this.errorResponse('カートアイテムIDが必要です', 400);
      }

      const cartItem = await prisma.cartItem.findFirst({
        where: { id: parseInt(cartItemId), userId: userId! },
        include: { product: true }
      });

      if (!cartItem) {
        return this.errorResponse('カートアイテムが見つかりません', 404);
      }

      await prisma.cartItem.delete({ where: { id: parseInt(cartItemId) } });

      await prisma.userActionLog.create({
        data: {
          userId: userId!,
          actionType: ActionType.CART_REMOVE,
          productId: cartItem.productId,
          metadata: { quantity: cartItem.quantity }
        }
      });

      return this.successResponse({});
    } catch (error) {
      return this.handleError(error, 'カートアイテムの削除に失敗しました');
    }
  }
}

const handler = new CartHandler();

export const GET = handler.GET.bind(handler);
export const POST = handler.POST.bind(handler);
export const DELETE = handler.DELETE.bind(handler);