'use client';

// import { useRouter } from 'next/navigation';
import { logger } from '@/lib/logger';
import { useEffect, useState } from 'react';
import Image from 'next/image';
import { orderAPI, cartAPI } from '@/lib/api/client';

interface Product {
  id: number;
  name: string;
  price: number;
  imageUrl: string;
}

interface OrderItem {
  id: number;
  orderId: number;
  productId: number;
  quantity: number;
  price: number;
  product: Product;
}

interface Order {
  id: number;
  userId: string;
  totalAmount: number;
  orderedAt: Date;
  orderItems?: OrderItem[];
}

// アクション処理を集約
const useOrderActions = () => {
  const handleReturn = async (orderId: string, productId: string) => {
    try {
      await orderAPI.return(orderId, productId);
    } catch (error) {
      logger.error('返品処理に失敗しました', error as Error);
    }
  };

  const handleReaddToCart = async (products: { id: string; quantity: number }[]) => {
    try {
      await Promise.all(products.map(product => 
        cartAPI.readdToCart(product.id)
      ));
    } catch (error) {
      logger.error('カートへの再追加に失敗しました', error as Error);
    }
  };

  const handleReview = async (orderId: string, productId: string) => {
    try {
      await orderAPI.review(orderId, productId);
    } catch (error) {
      logger.error('レビュー投稿リクエストに失敗しました', error as Error);
    }
  };

  return { handleReturn, handleReaddToCart, handleReview };
};

// 注文履歴取得ロジック
const useOrderData = () => {
  const [orders, setOrders] = useState<Order[]>([]);

  useEffect(() => {
    const loadOrders = async () => {
      try {
        const data = await orderAPI.fetchorders();
        setOrders(data.orders);
      } catch (error) {
        logger.error('購入履歴取得エラー:', error as Error);
      }
    };
    loadOrders();
  }, []);

  return { orders };
};

// メインコンポーネント
export default function Page() {
  const { orders } = useOrderData();
  const { handleReturn, handleReaddToCart, handleReview } = useOrderActions();

  // UI描画
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6 text-white">注文履歴</h1>
      
      <div className="space-y-6">
        {orders.map((order) => (
          <div key={order.id} className="bg-gray-800 border border-gray-700 rounded-lg p-4 shadow">
            {/* 注文情報ヘッダー */}
            <div className="flex justify-between items-center mb-4 text-sm text-gray-300">
              <div>注文日: {new Date(order.orderedAt).toLocaleDateString('ja-JP')}</div>
              <div>合計: ¥{order.totalAmount.toLocaleString()}</div>
            </div>
            
            {/* 商品リスト */}
            <div className="space-y-4">
              {order.orderItems?.map((item) => (
                <div key={item.id} className="flex items-center gap-4 border-b border-gray-700 last:border-b-0 pb-4 last:pb-0">
                  <div className="w-20 h-20 bg-gray-700 rounded flex-shrink-0 overflow-hidden">
                    <Image
                      src={item.product.imageUrl || `/product/${item.product.name}.webp`}
                      alt={item.product.name}
                      width={80}
                      height={80}
                      className="object-cover w-full h-full"
                    />
                  </div>
                  
                  {/* 商品情報とアクション */}
                  <div className="flex-grow flex justify-between items-center">
                    <div>
                      <h3 className="font-medium text-white">{item.product.name}</h3>
                      <div className="text-sm text-gray-300 space-y-1">
                        <p>数量: {item.quantity}</p>
                        <p>価格: ¥{item.price.toLocaleString()}</p>
                      </div>
                    </div>
                    
                    {/* アクションボタン */}
                    <div className="flex gap-2">
                      <button 
                        onClick={() => handleReturn(order.id.toString(), item.productId.toString())}
                        className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
                      >
                        返品
                      </button>
                      <button 
                        onClick={() => handleReaddToCart([{
                          id: item.product.id.toString(),
                          quantity: item.quantity
                        }])}
                        className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
                      >
                        再度購入
                      </button>
                      <button 
                        onClick={() => handleReview(order.id.toString(), item.productId.toString())}
                        className="px-3 py-1 text-sm border border-gray-600 text-gray-300 rounded hover:bg-gray-700"
                      >
                        レビューを書く
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}