import { BaseApiHandler } from '@/lib/api/handler';
import { microserviceProxy } from '@/lib/api/proxy';
import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';

class ProductDetailHandler extends BaseApiHandler {
  async GET(
    request: NextRequest,
    { params }: { params: Promise<{ productId: string }> }
  ) {
    try {
      const { userId } = await this.getHeaders();
      
      // paramsをawaitしてから商品IDを取得
      const { productId } = await params;
      
      logger.info('Proxying product detail request to microservice', { 
        productId, 
        userId 
      });

      // マイクロサービスにプロキシ（商品IDをパスに含める）
      const response = await microserviceProxy.proxyToProductsService(
        `/${productId}`, 
        request, 
        {
          requireAuth: false, // 商品詳細は認証不要
          fallback: () => this.getFallbackProduct(productId, userId)
        }
      );

      return response;
    } catch (error) {
      logger.error('Product detail API proxy error', { error, productId: (await params).productId });
      return this.handleError(error, '商品詳細の取得に失敗しました');
    }
  }

  // フォールバック用のメソッド（サービス停止時の対応）
  private async getFallbackProduct(
    productId: string, 
    userId: string | null
  ): Promise<NextResponse> {
    logger.warn('Using fallback for product detail API', { productId });

    // 基本的な商品データをフォールバックとして返す
    const fallbackProduct = {
      id: parseInt(productId),
      name: `商品 #${productId}`,
      price: 1000,
      description: "サービス復旧中のため、詳細情報を表示できません。しばらくお待ちください。",
      imageUrl: "/product/sample.webp",
      category: "unknown",
      stock: 0,
      specifications: "復旧中",
      brand: "Unknown"
    };

    return NextResponse.json({
      success: true,
      product: fallbackProduct,
      user: { userId },
      isFallback: true,
      message: "サービス復旧中のため、制限された情報のみ表示しています"
    }, {
      headers: {
        'Cache-Control': 'no-store, max-age=0'
      }
    });
  }
}

const handler = new ProductDetailHandler();
export const GET = handler.GET.bind(handler);