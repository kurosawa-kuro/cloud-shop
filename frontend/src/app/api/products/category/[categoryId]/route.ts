import { prisma } from '@/lib/database/prisma';
import { BaseApiHandler } from '@/lib/api/handler';
import { NextResponse } from 'next/server';

class ProductsByCategoryHandler extends BaseApiHandler {
  async GET(
    request: Request,
    context: { params: Promise<{ categoryId: string }> }
  ) {
    try {
      const { categoryId } = await context.params;
      console.log("categoryId", categoryId);
      const categoryIdNum = parseInt(categoryId);

      if (isNaN(categoryIdNum)) {
        return NextResponse.json(
          { error: 'カテゴリーIDが無効です' },
          { status: 400 }
        );
      }

      const products = await prisma.product.findMany({
        where: {
          productCategories: {
            some: {
              categoryId: categoryIdNum
            }
          }
        },
        include: {
          productCategories: {
            include: {
              category: true
            }
          }
        }
      });

      console.log("products", products);

      return NextResponse.json(
        { products },
        {
          headers: {
            'Cache-Control': 'no-store, max-age=0'
          }
        }
      );
    } catch (error) {
      return this.handleError(error, 'カテゴリー別商品一覧の取得に失敗しました');
    }
  }
}

const handler = new ProductsByCategoryHandler();
export const GET = handler.GET.bind(handler);