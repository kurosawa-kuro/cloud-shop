import { productAPI } from "@/lib/api/client";
import CategoryButtons from "./categoryButtons";
import ProductCard, { ProductItem } from "@/components/ProductCard";


// ダミーのカテゴリーデータ
const dummyCategories = [
  { id: 1, name: 'Electronics' },
  { id: 2, name: 'Books' },
  { id: 3, name: 'Clothing' },
  { id: 4, name: 'Sports' },
  { id: 5, name: 'Home & Garden' },
];

export const dynamic = 'force-dynamic';

export default async function Page() {
  const { products } = await productAPI.getProducts();

  return (
    <div className="container mx-auto px-4 py-8">
      {/* カテゴリー一覧 */}
      <CategoryButtons categories={dummyCategories} />

      {/* 商品一覧 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {products.map((item: ProductItem) => (
          <ProductCard key={`${item.id}`} item={item} />
        ))}
      </div>
    </div>
  );
}