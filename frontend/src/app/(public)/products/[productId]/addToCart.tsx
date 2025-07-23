'use client';

import { useRouter } from 'next/navigation';
import { cartAPI } from '@/lib/api/client';

interface ProductData {
  id: number;
  price: number;
}

export function CartActions({ productData }: { productData: ProductData }) {
  const router = useRouter();

  const handleAddToCart = async () => {
    try {
      await cartAPI.addToCart(productData.id.toString());
    } catch (error) {
      console.error('Connection error:', error);
    }
  };

  const handleMoveToCart = () => {
    router.push('/carts');
  };

  return (
    <div className="bg-gray-800 p-6 rounded-lg shadow">
      <div className="space-y-4">
        <div className="flex items-center justify-between text-white">
          <span className="text-lg font-medium">価格:</span>
          <span className="text-xl font-bold">¥{productData.price.toLocaleString()}</span>
        </div>
        <div className="flex items-center justify-between text-white">
          <span className="text-lg font-medium">数量:</span>
          <span className="text-xl font-bold">1</span>
        </div>
        <button
          onClick={handleAddToCart}
          className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors"
        >
          カートに追加
        </button>
        <button
          onClick={handleMoveToCart}
          className="w-full bg-green-600 text-white py-3 px-4 rounded-lg hover:bg-green-700 transition-colors"
        >
          カートへ移動
        </button>
        <p className="text-sm text-gray-400 text-center">
          通常配送 2-4 日でお届け
        </p>
      </div>
    </div>
  );
}