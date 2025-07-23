import Link from "next/link";
import Image from "next/image";

// 商品アイテムの共通インターフェース
export interface ProductItem {
  id: number;
  productId?: number;
  name?: string;
  productName?: string;
  price?: number;
  productPrice?: number;
  specialPrice?: number | null;
  rating?: number;
  imageUrl?: string;
}

/**
 * 共通の商品カードコンポーネント
 * トップページと商品一覧ページで使用される商品表示の統一デザイン
 */
export default function ProductCard({ item }: { item: ProductItem }) {
  // 商品IDの取得（productIdがある場合はそれを使用、なければid）
  const productId = item.productId || item.id;
  
  // 商品名の取得（productNameがある場合はそれを使用、なければname）
  const name = item.productName || item.name || "";
  
  // 価格の取得（productPriceがある場合はそれを使用、なければprice）
  const price = item.productPrice || item.price || 0;
  
  // 画像URLの取得（指定がある場合はそれを使用、なければデフォルト画像）
  const imageUrl = item.imageUrl || "/product/"+ name +".webp";

  return (
    <Link
      href={`/products/${productId}`}
      className="group block bg-gray-800 rounded-lg shadow hover:shadow-lg transition-shadow duration-200"
    >
      <div className="aspect-w-1 aspect-h-1 w-full overflow-hidden rounded-t-lg bg-gray-700 relative">
        <div className="relative w-full h-0 pb-[50%]">
          <Image
            src={imageUrl}
            alt={name}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
            className="object-contain object-center group-hover:opacity-75 transition-opacity"
            priority={item.id <= 4}
          />
        </div>
      </div>
      <div className="p-4">
        <h2 className="text-lg font-medium text-white">{name}</h2>
        
        {/* 評価がある場合は表示 */}
        {item.rating && (
          <div className="mt-2 flex items-center">
            <div className="flex items-center">
              {[...Array(5)].map((_, index) => (
                <span 
                  key={index}
                  className={`${
                    index < Math.floor(item.rating || 0)
                      ? "text-yellow-400"
                      : "text-gray-600"
                  } text-lg`}
                >
                  ★
                </span>
              ))}
            </div>
            <span className="ml-2 text-sm text-gray-300">
              {item.rating}
            </span>
            <span className="ml-2 text-sm text-gray-400">
              ({Math.floor(Math.random() * 200 + 50)})
            </span>
          </div>
        )}
        
        {/* 価格表示 - 特別価格がある場合は割引表示 */}
        <p className="mt-2 text-lg font-semibold text-white">
          {item.specialPrice != null ? (
            <>
              <span>¥{item.specialPrice.toLocaleString()}</span>{" "}
              <span className="text-sm text-gray-400 line-through">
                ¥{price.toLocaleString()}
              </span>
            </>
          ) : (
            <>¥{price.toLocaleString()}</>
          )}
        </p>
      </div>
    </Link>
  );
}