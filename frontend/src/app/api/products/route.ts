import { BaseApiHandler } from '@/lib/api/handler';
import { microserviceProxy } from '@/lib/api/proxy';
import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';

class ProductsHandler extends BaseApiHandler {
  async GET(request: NextRequest) {
    try {
      const { userId } = await this.getHeaders();
      
      logger.info('Proxying products request to microservice', { userId });

      // マイクロサービスにプロキシ
      const response = await microserviceProxy.proxyToProductsService('', request, {
        requireAuth: false, // 商品一覧は認証不要
        fallback: () => this.getFallbackProducts(userId)
      });

      return response;
    } catch (error) {
      logger.error('Products API proxy error', { error });
      return this.handleError(error, '商品一覧の取得に失敗しました');
    }
  }

  // フォールバック用のメソッド（サービス停止時の対応）
  private async getFallbackProducts(userId: string | null): Promise<NextResponse> {
    logger.warn('Using fallback for products API');
    
    // 基本的な商品データをフォールバックとして返す
    const fallbackProducts = [
      {
        id: 1,
        name: "サンプル商品1",
        price: 1000,
        description: "サービス復旧中です",
        imageUrl: "/product/sample1.webp",
        category: "electronics"
      },
      {
        id: 2,
        name: "サンプル商品2", 
        price: 2000,
        description: "サービス復旧中です",
        imageUrl: "/product/sample2.webp",
        category: "electronics"
      }
    ];

    return NextResponse.json({
      success: true,
      products: fallbackProducts,
      user: { userId },
      isFallback: true,
      message: "サービス復旧中のため、一部の商品のみ表示しています"
    }, {
      headers: {
        'Cache-Control': 'no-store, max-age=0'
      }
    });
  }
}

const handler = new ProductsHandler();
export const GET = handler.GET.bind(handler);