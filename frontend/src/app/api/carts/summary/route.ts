import { prisma } from '@/lib/database/prisma';
import { BaseApiHandler } from '@/lib/api/handler';

class CartSummaryHandler extends BaseApiHandler {
  async GET() {
    try {
      const { userId } = await this.getHeaders();
      const authError = this.checkAuth(userId);
      if (authError) return authError;
      
      // カート内の商品と価格情報を取得
      const cartItems = await prisma.cartItem.findMany({
        where: { userId: userId! },
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

      return this.successResponse({ subtotal });
    } catch (error) {
      return this.handleError(error, 'カートサマリーの取得に失敗しました');
    }
  }
}

const handler = new CartSummaryHandler();
export const GET = handler.GET.bind(handler);