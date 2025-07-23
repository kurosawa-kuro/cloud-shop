import { prisma } from '@/lib/database/prisma';
import { BaseApiHandler } from '@/lib/api/handler';
import { NextResponse } from 'next/server';

class ProductSearchHandler extends BaseApiHandler {
  async GET(request: Request) {
    try {
      const { userId } = await this.getHeaders();
      const { searchParams } = new URL(request.url);
      const query = searchParams.get('q') || '';
      console.log("query", query);
      // 検索クエリに基づいて商品を検索
      const products = await prisma.product.findMany({
        where: {
          OR: [
            { name: { contains: query, mode: 'insensitive' } },
          ],
        },
        take: 20, // 1ページあたりの表示件数
      });
      console.log("searched products", products);
      return NextResponse.json(
        { products, user: { userId } },
        {
          headers: {
            'Cache-Control': 'no-store, max-age=0'
          }
        }
      );
    } catch (error) {
      return this.handleError(error, '商品の検索に失敗しました');
    }
  }
}

const handler = new ProductSearchHandler();
export const GET = handler.GET.bind(handler);