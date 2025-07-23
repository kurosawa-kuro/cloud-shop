import { prisma } from '@/lib/database/prisma';
import { BaseApiHandler } from '@/lib/api/handler';

class OrderHandler extends BaseApiHandler {
  async GET() {
    try {
      const { userId } = await this.getHeaders();
      const authError = this.checkAuth(userId);
      if (authError) return authError;

      // 購入履歴を取得（最新順）
      const orders = await prisma.order.findMany({
        where: { userId: userId! },
        orderBy: { orderedAt: 'desc' },
        include: {
          orderItems: {
            include: {
              product: true
            }
          }
        }
      });

      return this.successResponse({ orders });
    } catch (error) {
      return this.handleError(error, '購入履歴の取得に失敗しました');
    }
  }
}

const handler = new OrderHandler();
export const GET = handler.GET.bind(handler);