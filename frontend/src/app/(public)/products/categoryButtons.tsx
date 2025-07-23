'use client';

import { productAPI } from '@/lib/api/client';

interface Category {
  id: number;
  name: string;
}

interface CategoryButtonsProps {
  categories: Category[];
}

export default function CategoryButtons({ categories }: CategoryButtonsProps) {
  const handleCategoryClick = async (categoryId: number) => {
    try {
      const data = await productAPI.getProductsByCategory(categoryId);
      console.log('カテゴリー別商品:', data.products);
      // ここで取得した商品データを表示する処理を追加
    } catch (error) {
      console.error('エラー:', error);
      // ユーザーにエラーメッセージを表示する処理を追加
    }
  };

  return (
    <div className="flex flex-wrap gap-2 mb-8">
      {categories.map((category) => (
        <button
          key={category.id}
          onClick={() => handleCategoryClick(category.id)}
          className="px-4 py-2 bg-gray-700 text-white rounded-full hover:bg-gray-600 transition-colors"
        >
          {category.name}
        </button>
      ))}
    </div>
  );
}