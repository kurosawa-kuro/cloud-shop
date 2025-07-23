import CategoryButtons from "./products/categoryButtons";
import { topAPI } from "@/lib/api/client";
import ProductCard, { ProductItem } from "@/components/ProductCard";

// Dummy category data
const dummyCategories = [
  { id: 1, name: "Electronics" },
  { id: 2, name: "Books" },
  { id: 3, name: "Clothing" },
  { id: 4, name: "Sports" },
  { id: 5, name: "Home & Garden" },
];

// Group labels mapping for display groups (Japanese labels)
const GROUP_LABELS: Record<string, string> = {
  SALE: "セール商品",
  RECOMMENDED_CATEGORY: "おすすめカテゴリー",
  CONTINUE_SHOPPING: "引き続きお買い物",
};

// 表示順序の定義
const DISPLAY_ORDER = ["SALE", "RECOMMENDED_CATEGORY", "CONTINUE_SHOPPING"];

/**
 * Renders a section for a specific product group.
 * This component is responsible for group title and its product list.
 */
function GroupSection({
  groupKey,
  items,
  labels,
}: {
  groupKey: string;
  items: ProductItem[];
  labels: Record<string, string>;
}) {
  // If there are no items in this group, do not render
  if (!items || items.length === 0) return null;

  // Determine the display label, fallback to groupKey
  const label = labels[groupKey] || groupKey;

  return (
    <section key={groupKey} className="mb-8">
      <h2 className="text-2xl font-bold mb-4 text-white">{label}</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {items.map((item: ProductItem) => (
          <ProductCard key={`${groupKey}-${item.id}`} item={item} />
        ))}
      </div>
    </section>
  );
}

export const dynamic = "force-dynamic";

/**
 * Main page component.
 * Fetches top page display data from the API and renders category buttons along with product groups.
 */
export default async function Page() {
  // Fetch data from top page display API (no cache)
  const topResponse = await topAPI.getTopPageDisplay();

  // Extract display groups from API response
  const topPageDisplayByDisplayType: Record<string, ProductItem[]> =
    topResponse.topPageDisplayByDisplayType;

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Render category buttons */}
      <CategoryButtons categories={dummyCategories} />

      {/* Render product group sections in specified order */}
      {DISPLAY_ORDER.map((groupKey) => {
        const items = topPageDisplayByDisplayType[groupKey] || [];
        return (
          <GroupSection 
            key={groupKey} 
            groupKey={groupKey} 
            items={items} 
            labels={GROUP_LABELS} 
          />
        );
      })}
    </div>
  );
}