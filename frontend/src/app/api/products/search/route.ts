import { BaseApiHandler } from '@/lib/api/handler';
import { microserviceProxy } from '@/lib/api/proxy';
import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';

class ProductSearchHandler extends BaseApiHandler {
  async GET(request: NextRequest) {
    try {
      const { userId } = await this.getHeaders();
      const { searchParams } = new URL(request.url);
      const query = searchParams.get('q') || '';
      
      logger.info('Proxying product search request to microservice', { 
        query, 
        userId 
      });

      // マイクロサービスにプロキシ（検索パラメータを含む）
      const response = await microserviceProxy.proxyToProductsService(
        `/search${request.url.includes('?') ? '?' + searchParams.toString() : ''}`, 
        request, 
        {
          requireAuth: false, // 商品検索は認証不要
          fallback: () => this.getFallbackSearchResults(query, userId)
        }
      );

      return response;
    } catch (error) {
      logger.error('Product search API proxy error', { 
        error, 
        query: new URL(request.url).searchParams.get('q') 
      });
      return this.handleError(error, '商品の検索に失敗しました');
    }
  }

  // フォールバック用のメソッド（サービス停止時の対応）
  private async getFallbackSearchResults(
    query: string, 
    userId: string | null
  ): Promise<NextResponse> {
    logger.warn('Using fallback for product search API', { query });

    // 基本的な検索結果をフォールバックとして返す
    const fallbackProducts = query ? [
      {
        id: 1,
        name: `"${query}" の検索結果（一時的）`,
        price: 1000,
        description: "サービス復旧中のため、検索機能が制限されています。",
        imageUrl: "/product/search-fallback.webp",
        category: "search-result",
        relevanceScore: 0.5
      }
    ] : [];

    return NextResponse.json({
      success: true,
      products: fallbackProducts,
      user: { userId },
      query,
      totalCount: fallbackProducts.length,
      isFallback: true,
      message: query 
        ? "サービス復旧中のため、検索結果が制限されています"
        : "検索キーワードを入力してください"
    }, {
      headers: {
        'Cache-Control': 'no-store, max-age=0'
      }
    });
  }
}

const handler = new ProductSearchHandler();
export const GET = handler.GET.bind(handler);