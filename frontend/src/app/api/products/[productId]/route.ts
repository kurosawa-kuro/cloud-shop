import { prisma } from '@/lib/database/prisma';
import { BaseApiHandler } from '@/lib/api/handler';

class ProductDetailHandler extends BaseApiHandler {
  async GET(
    request: Request,
    { params }: { params: Promise<{ productId: string }> }
  ) {
    try {
      const { userId } = await this.getHeaders();
      
      // paramsをawaitしてから商品IDを取得
      const { productId } = await params;

      // 商品詳細を取得
      const product = await prisma.product.findUnique({
        where: { id: parseInt(productId) }
      });

      if (!product) {
        return this.errorResponse('商品が見つかりません', 404);
      }

      return this.successResponse({ 
        product,
        user: { userId } // ユーザーIDをレスポンスに含める
      });
    } catch (error) {
      return this.handleError(error, '商品詳細の取得に失敗しました');
    }
  }
}

const handler = new ProductDetailHandler();
export const GET = handler.GET.bind(handler);