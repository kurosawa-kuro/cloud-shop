import { prisma } from '@/lib/database/prisma';
import { BaseApiHandler } from '@/lib/api/handler';
import { NextResponse } from 'next/server';

class ProductsHandler extends BaseApiHandler {
  async GET() {
    try {
      const { userId } = await this.getHeaders();
      
      // 商品一覧を取得
      const products = await prisma.product.findMany();

      return NextResponse.json(
        { products, user: { userId } },
        {
          headers: {
            'Cache-Control': 'no-store, max-age=0'
          }
        }
      );
    } catch (error) {
      return this.handleError(error, '商品一覧の取得に失敗しました');
    }
  }
}

const handler = new ProductsHandler();
export const GET = handler.GET.bind(handler);